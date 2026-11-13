// ==========================================
// UBICACIÓN: src/visitor-logs/visitor-logs.controller.js
// DESCRIPCIÓN: Controlador para el Registro de Ingresos y Egresos (Check-in / Check-out en Garita)
// ==========================================

const db = require('../config/db');

/**
 * @desc    Registrar el ingreso (Check-in) manual de un prestador o visitante a la garita
 * @route   POST /api/visitor-logs/entry
 * @access  Privado (Requiere Token JWT de Seguridad o Administrador)
 */
const registerEntry = async (req, res) => {
  try {
    // 1. Extraer los datos del guardia autenticado y el country desde el token JWT
    const countryId = req.user.country_id;
    const guardId = req.user.id; 

    // 2. Extraer los campos enviados en el cuerpo de la petición HTTP
    const { dni, first_name, last_name, visitor_type, destination_lot, destination_fraction } = req.body;

    // 3. Validar que los campos obligatorios principales no estén vacíos
    if (!dni || !first_name || !last_name || !visitor_type || !destination_lot) {
      return res.status(400).json({ 
        error: 'Faltan campos obligatorios (dni, first_name, last_name, visitor_type, destination_lot).' 
      });
    }

    // 4. VALIDACIÓN ESTRICTA POR DNI (Anti-ingresos duplicados activos):
    const activeCheckQuery = `
      SELECT id, entry_time FROM visitor_logs 
      WHERE country_id = $1 AND dni = $2 AND exit_time IS NULL
    `;
    const activeCheck = await db.query(activeCheckQuery, [countryId, dni]);

    if (activeCheck.rows.length > 0) {
      return res.status(400).json({
        error: 'El visitante con este DNI ya figura con un ingreso activo en el country y no ha registrado su egreso.',
        active_log: activeCheck.rows[0]
      });
    }

    // 5. Insertar el nuevo registro de ingreso en la tabla visitor_logs con la fecha/hora actual
    const query = `
      INSERT INTO visitor_logs (
        country_id, dni, first_name, last_name, visitor_type, 
        destination_lot, destination_fraction, guard_id, entry_time
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
      RETURNING *
    `;

    const values = [
      countryId,
      dni,
      first_name,
      last_name,
      visitor_type, // 'guest', 'provider', 'delivery', 'taxi'
      destination_lot,
      destination_fraction || null,
      guardId
    ];

    const result = await db.query(query, values);

    return res.status(201).json({
      message: 'Ingreso registrado exitosamente en la garita',
      visitor_log: result.rows[0]
    });

  } catch (error) {
    console.error('Error al registrar ingreso en garita:', error);
    return res.status(500).json({ error: 'Error interno del servidor al registrar el ingreso.' });
  }
};

/**
 * @desc    Registrar ingreso mediante el escaneo del Código QR del pase (Pase de Garita)
 * @route   POST /api/visitor-logs/scan-qr
 * @access  Privado (Seguridad o Administrador)
 */
const scanQrEntry = async (req, res) => {
  try {
    const countryId = req.user.country_id;
    const guardId = req.user.id;
    const { qr_token } = req.body;

    if (!qr_token) {
      return res.status(400).json({ error: 'El token QR es obligatorio para el escaneo.' });
    }

    // 1. Buscar el pase de acceso asociado al token QR y que pertenezca al country
    const passQuery = `
      SELECT ap.*, 
             p.dni AS provider_dni, p.first_name AS provider_first_name, 
             p.last_name AS provider_last_name, p.specialty
      FROM access_passes ap
      LEFT JOIN providers p ON ap.provider_id = p.id
      WHERE ap.qr_token = $1 AND ap.country_id = $2
    `;
    const passResult = await db.query(passQuery, [qr_token, countryId]);

    if (passResult.rows.length === 0) {
      return res.status(404).json({ error: 'Código QR inválido o no corresponde a este country.' });
    }

    const pass = passResult.rows[0];

    // 2. Validar vigencia temporal del pase
    const now = new Date();
    if (now < new Date(pass.start_date) || now > new Date(pass.end_date)) {
      return res.status(400).json({ 
        error: 'El pase QR se encuentra fuera de su rango de fecha y horario autorizado.' 
      });
    }

    // 3. Extraer datos del prestador o visitante del pase
    const dni = pass.provider_dni || 'SIN-DNI-REGISTRADO';
    const firstName = pass.provider_first_name || 'Visita';
    const lastName = pass.provider_last_name || 'Autorizada';
    const visitorType = pass.provider_id ? 'provider' : 'guest';

    // 4. Validar que no tenga un ingreso activo previo
    const activeCheckQuery = `
      SELECT id FROM visitor_logs 
      WHERE country_id = $1 AND dni = $2 AND exit_time IS NULL
    `;
    const activeCheck = await db.query(activeCheckQuery, [countryId, dni]);

    if (activeCheck.rows.length > 0) {
      return res.status(400).json({
        error: 'El portador de este pase ya figura con un ingreso activo en el country.',
      });
    }

    // 5. Registrar el ingreso en la bitácora
    const logQuery = `
      INSERT INTO visitor_logs (
        country_id, dni, first_name, last_name, visitor_type, 
        destination_lot, destination_fraction, guard_id, entry_time
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
      RETURNING *
    `;

    const logValues = [
      countryId,
      dni,
      firstName,
      lastName,
      visitorType,
      pass.destination_lot,
      pass.destination_fraction || null,
      guardId
    ];

    const logResult = await db.query(logQuery, logValues);

    // 6. Actualizar el estado del pase a 'entered' o 'completed'
    await db.query(`UPDATE access_passes SET status = 'entered' WHERE id = $1`, [pass.id]);

    return res.status(201).json({
      message: 'Ingreso por código QR validado y registrado exitosamente',
      visitor_log: logResult.rows[0],
      pass_info: {
        destination_lot: pass.destination_lot,
        destination_fraction: pass.destination_fraction,
        specialty: pass.specialty
      }
    });

  } catch (error) {
    console.error('Error al escanear QR en garita:', error);
    return res.status(500).json({ error: 'Error interno del servidor al procesar el código QR.' });
  }
};

/**
 * @desc    Registrar el egreso (Check-out) de un visitante o prestador por ID de registro
 * @route   PUT /api/visitor-logs/:id/exit
 * @access  Privado (Seguridad o Administrador)
 */
const registerExit = async (req, res) => {
  try {
    const { id } = req.params; 

    const query = `
      UPDATE visitor_logs 
      SET exit_time = CURRENT_TIMESTAMP 
      WHERE id = $1 AND exit_time IS NULL
      RETURNING *
    `;

    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Registro de ingreso no encontrado o el egreso ya fue registrado anteriormente.' 
      });
    }

    return res.json({
      message: 'Egreso registrado exitosamente',
      visitor_log: result.rows[0]
    });

  } catch (error) {
    console.error('Error al registrar egreso:', error);
    return res.status(500).json({ error: 'Error interno del servidor al registrar el egreso.' });
  }
};

/**
 * @desc    Listar todos los registros activos e históricos de la garita para el country
 * @route   GET /api/visitor-logs
 * @access  Privado (Seguridad o Administrador)
 */
const getVisitorLogs = async (req, res) => {
  try {
    const countryId = req.user.country_id;

    const query = `
      SELECT vl.*, 
             u.first_name AS guard_first_name, 
             u.last_name AS guard_last_name
      FROM visitor_logs vl
      LEFT JOIN users u ON vl.guard_id = u.id
      WHERE vl.country_id = $1
      ORDER BY vl.entry_time DESC
    `;

    const result = await db.query(query, [countryId]);

    return res.json({
      status: 'success',
      total: result.rows.length,
      logs: result.rows
    });

  } catch (error) {
    console.error('Error al consultar registros de garita:', error);
    return res.status(500).json({ error: 'Error interno al consultar la bitácora de garita.' });
  }
};

module.exports = {
  registerEntry,
  scanQrEntry,
  registerExit,
  getVisitorLogs
};