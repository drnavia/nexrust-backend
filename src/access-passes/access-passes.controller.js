// ==========================================
// UBICACIÓN: src/access-passes/access-passes.controller.js
// DESCRIPCIÓN: Controlador para la Generación de Pases de Acceso y Tokens QR
// ==========================================

const db = require('../config/db');
const crypto = require('crypto');

/**
 * @desc    Crear un nuevo pase de acceso QR temporal para la garita del country
 * @route   POST /api/passes
 * @access  Privado (Requiere Token JWT de Residente/Propietario)
 */
const createAccessPass = async (req, res) => {
  try {
    // 1. Extraer los datos del usuario autenticado a través del middleware JWT
    const userId = req.user.id;
    const countryId = req.user.country_id;
    
    // 2. Extraer los parámetros enviados en el cuerpo de la petición HTTP
    const { provider_id, destination_lot, destination_fraction, start_date, end_date } = req.body;

    // 3. Validar campos obligatorios básicos para asegurar la integridad de los datos
    if (!destination_lot || !start_date || !end_date) {
      return res.status(400).json({ 
        error: 'Faltan campos obligatorios (destination_lot, start_date, end_date).' 
      });
    }

    // 4. VALIDACIÓN DE DUPLICADOS: 
    // Evita que se sigan generando pases idénticos si el usuario presiona varias veces el botón por error.
    const duplicateCheckQuery = `
      SELECT id, qr_token, created_at FROM access_passes 
      WHERE user_id = $1 
        AND country_id = $2 
        AND destination_lot = $3 
        AND (provider_id = $4 OR ($4::uuid IS NULL AND provider_id IS NULL))
        AND start_date = $5 
        AND end_date = $6 
        AND status = 'pending'
    `;
    
    const duplicateCheckValues = [
      userId, 
      countryId, 
      destination_lot, 
      provider_id || null, 
      start_date, 
      end_date
    ];

    const existingPass = await db.query(duplicateCheckQuery, duplicateCheckValues);

    // Si ya existe un pase pendiente idéntico, bloqueamos la creación y respondemos con un 400
    if (existingPass.rows.length > 0) {
      return res.status(400).json({
        error: 'Ya existe un pase pendiente idéntico generado para este prestador en el mismo horario.',
        existing_pass: existingPass.rows[0]
      });
    }

    // 5. Generar un token criptográfico hexadecimal único y seguro para el código QR de la garita
    const qrToken = crypto.randomBytes(32).toString('hex');

    // 6. Insertar el nuevo pase de acceso en la base de datos PostgreSQL
    const query = `
      INSERT INTO access_passes (
        user_id, provider_id, country_id, destination_lot, 
        destination_fraction, start_date, end_date, status, qr_token
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8)
      RETURNING *
    `;

    const values = [
      userId,
      provider_id || null,
      countryId,
      destination_lot,
      destination_fraction || null,
      start_date,
      end_date,
      qrToken
    ];

    const newPass = await db.query(query, values);

    // 7. Responder con éxito y los datos del pase generado
    return res.status(201).json({
      message: 'Pase de acceso QR generado exitosamente para la garita',
      access_pass: newPass.rows[0]
    });

  } catch (error) {
    console.error('Error al generar pase de acceso:', error);
    return res.status(500).json({ error: 'Error interno del servidor al generar el pase de acceso.' });
  }
};

/**
 * @desc    Listar todos los pases de acceso emitidos en el country del usuario
 * @route   GET /api/passes
 * @access  Privado (Requiere Token JWT)
 */
const getAccessPasses = async (req, res) => {
  try {
    // 1. Obtener el ID del country del usuario autenticado para aislar los datos por barrio
    const countryId = req.user.country_id;

    // 2. Consultar los pases haciendo un JOIN con la tabla providers para traer los datos del prestador
    const query = `
      SELECT ap.*, 
             p.first_name AS provider_first_name, 
             p.last_name AS provider_last_name, 
             p.specialty
      FROM access_passes ap
      LEFT JOIN providers p ON ap.provider_id = p.id
      WHERE ap.country_id = $1
      ORDER BY ap.created_at DESC
    `;

    const result = await db.query(query, [countryId]);

    // 3. Devolver la lista completa con el total de registros encontrados
    return res.json({
      status: 'success',
      total: result.rows.length,
      passes: result.rows
    });

  } catch (error) {
    console.error('Error al obtener pases de acceso:', error);
    return res.status(500).json({ error: 'Error interno del servidor al consultar los pases.' });
  }
};

module.exports = { 
  createAccessPass, 
  getAccessPasses 
};