// ==========================================
// UBICACIÓN: src/recurring-authorizations/recurring-authorizations.controller.js
// DESCRIPCIÓN: Controlador para la Gestión de Autorizaciones Recurrentes (Personal Habitual/Staff)
// ==========================================

const db = require('../config/db');

/**
 * @desc    Crear una nueva autorización recurrente para personal habitual (staff, doméstico, jardineros)
 * @route   POST /api/recurring-authorizations
 * @access  Privado (Requiere Token JWT de Residente/Propietario)
 */
const createRecurringAuthorization = async (req, res) => {
  try {
    // 1. Extraer los datos del usuario autenticado (residente)
    const residentId = req.user.id;
    const countryId = req.user.country_id;

    // 2. Extraer los campos enviados en el body
    const { 
      destination_fraction, 
      destination_lot, 
      staff_dni, 
      staff_first_name, 
      staff_last_name, 
      staff_role, 
      allowed_days, 
      start_time, 
      end_time, 
      valid_until 
    } = req.body;

    // 3. Validar campos obligatorios básicos
    if (!destination_lot || !staff_dni || !staff_first_name || !staff_last_name || !staff_role || !allowed_days || !start_time || !end_time || !valid_until) {
      return res.status(400).json({ 
        error: 'Faltan campos obligatorios para registrar la autorización recurrente.' 
      });
    }

    // 4. Validar roles permitidos para el personal
    const validRoles = ['domestic', 'gardener', 'pool_service', 'maintenance', 'babysitter'];
    if (!validRoles.includes(staff_role)) {
      return res.status(400).json({ 
        error: `Rol de personal inválido. Los permitidos son: ${validRoles.join(', ')}` 
      });
    }

    // 5. Control anti-duplicidad: Verificar si ya existe una autorización activa para el mismo DNI en el mismo lote
    const duplicateCheck = await db.query(
      `SELECT id FROM recurring_authorizations 
       WHERE country_id = $1 AND destination_lot = $2 AND staff_dni = $3 AND is_active = true`,
      [countryId, destination_lot, staff_dni]
    );

    if (duplicateCheck.rows.length > 0) {
      return res.status(400).json({ 
        error: 'Ya existe una autorización recurrente activa para este DNI en el lote especificado.' 
      });
    }

    // 6. Insertar en la base de datos PostgreSQL
    const query = `
      INSERT INTO recurring_authorizations (
        country_id, resident_id, destination_fraction, destination_lot, 
        staff_dni, staff_first_name, staff_last_name, staff_role, 
        allowed_days, start_time, end_time, valid_until, is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true)
      RETURNING *
    `;

    const values = [
      countryId,
      residentId,
      destination_fraction || null,
      destination_lot,
      staff_dni,
      staff_first_name,
      staff_last_name,
      staff_role,
      allowed_days, // Ej: 'LUN,MIE,VIE'
      start_time,   // Ej: '08:00'
      end_time,     // Ej: '17:00'
      valid_until   // Fecha límite de vigencia
    ];

    const result = await db.query(query, values);

    return res.status(201).json({
      message: 'Autorización recurrente registrada exitosamente para la garita',
      recurring_authorization: result.rows[0]
    });

  } catch (error) {
    console.error('Error al crear autorización recurrente:', error);
    return res.status(500).json({ error: 'Error interno del servidor al procesar la autorización recurrente.' });
  }
};

/**
 * @desc    Listar todas las autorizaciones recurrentes del country (o del residente)
 * @route   GET /api/recurring-authorizations
 * @access  Privado (Residente / Seguridad / Admin)
 */
const getRecurringAuthorizations = async (req, res) => {
  try {
    const countryId = req.user.country_id;

    const query = `
      SELECT ra.*, 
             u.first_name AS resident_first_name, 
             u.last_name AS resident_last_name 
      FROM recurring_authorizations ra
      JOIN users u ON ra.resident_id = u.id
      WHERE ra.country_id = $1
      ORDER BY ra.created_at DESC
    `;

    const result = await db.query(query, [countryId]);

    return res.json({
      status: 'success',
      total: result.rows.length,
      authorizations: result.rows
    });

  } catch (error) {
    console.error('Error al consultar autorizaciones recurrentes:', error);
    return res.status(500).json({ error: 'Error interno al consultar las autorizaciones.' });
  }
};

/**
 * @desc    Desactivar o revocar una autorización recurrente
 * @route   PUT /api/recurring-authorizations/:id/revoke
 * @access  Privado (Residente o Admin)
 */
const revokeRecurringAuthorization = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      UPDATE recurring_authorizations 
      SET is_active = false 
      WHERE id = $1 AND is_active = true
      RETURNING *
    `;

    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Autorización no encontrada o ya se encuentra inactiva.' });
    }

    return res.json({
      message: 'Autorización recurrente revocada exitosamente',
      recurring_authorization: result.rows[0]
    });

  } catch (error) {
    console.error('Error al revocar autorización recurrente:', error);
    return res.status(500).json({ error: 'Error interno al revocar la autorización.' });
  }
};

module.exports = {
  createRecurringAuthorization,
  getRecurringAuthorizations,
  revokeRecurringAuthorization
};