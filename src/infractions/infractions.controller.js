// ==========================================
// UBICACIÓN: src/infractions/infractions.controller.js
// DESCRIPCIÓN: Controlador para la Gestión y Registro de Infracciones y Multas
// ==========================================

const db = require('../config/db');

/**
 * @desc    Emitir una nueva infracción o multa (por seguridad o administración)
 * @route   POST /api/infractions
 * @access  Privado (Seguridad / Administrador)
 */
const createInfraction = async (req, res) => {
  try {
    const countryId = req.user.country_id;
    const { destination_fraction, destination_lot, license_plate, infraction_type, description, severity } = req.body;

    // 1. Validar campos obligatorios básicos
    if (!destination_lot || !infraction_type) {
      return res.status(400).json({ 
        error: 'El lote de destino (destination_lot) y el tipo de infracción (infraction_type) son obligatorios.' 
      });
    }

    // 2. Validar niveles de severidad permitidos según el esquema de la BD
    const validSeverities = ['warning', 'minor', 'grave'];
    const infractionSeverity = severity || 'warning';
    if (!validSeverities.includes(infractionSeverity)) {
      return res.status(400).json({ 
        error: `Severidad inválida. Las permitidas son: ${validSeverities.join(', ')}` 
      });
    }

    // 3. Insertar la infracción en PostgreSQL con estado inicial 'pending'
    const query = `
      INSERT INTO infractions (
        country_id, destination_fraction, destination_lot, license_plate, 
        infraction_type, description, severity, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
      RETURNING *
    `;

    const values = [
      countryId,
      destination_fraction || null,
      destination_lot,
      license_plate || null,
      infraction_type,
      description || 'Infracción registrada por control interno del country',
      infractionSeverity
    ];

    const result = await db.query(query, values);

    return res.status(201).json({
      message: '⚠️ Infracción registrada exitosamente en el sistema',
      infraction: result.rows[0]
    });

  } catch (error) {
    console.error('Error al registrar infracción:', error);
    return res.status(500).json({ error: 'Error interno del servidor al registrar la infracción.' });
  }
};

/**
 * @desc    Listar todas las infracciones del country
 * @route   GET /api/infractions
 * @access  Privado (Residente / Seguridad / Admin)
 */
const getInfractions = async (req, res) => {
  try {
    const countryId = req.user.country_id;

    const query = `
      SELECT * FROM infractions 
      WHERE country_id = $1 
      ORDER BY created_at DESC
    `;
    const result = await db.query(query, [countryId]);

    return res.json({
      status: 'success',
      total: result.rows.length,
      infractions: result.rows
    });

  } catch (error) {
    console.error('Error al consultar infracciones:', error);
    return res.status(500).json({ error: 'Error interno al consultar el registro de infracciones.' });
  }
};

/**
 * @desc    Actualizar el estado de una infracción (Pagada, Apelada, etc.)
 * @route   PUT /api/infractions/:id
 * @access  Privado (Administrador)
 */
const updateInfractionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'paid', 'appealed'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: `Estado inválido. Los permitidos son: ${validStatuses.join(', ')}` 
      });
    }

    const query = `
      UPDATE infractions 
      SET status = $1 
      WHERE id = $2
      RETURNING *
    `;
    const result = await db.query(query, [status, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Infracción no encontrada.' });
    }

    return res.json({
      message: 'Estado de la infracción actualizado exitosamente',
      infraction: result.rows[0]
    });

  } catch (error) {
    console.error('Error al actualizar infracción:', error);
    return res.status(500).json({ error: 'Error interno al actualizar la infracción.' });
  }
};

module.exports = {
  createInfraction,
  getInfractions,
  updateInfractionStatus
};