// ==========================================
// UBICACIÓN: src/barrier-devices/barrier-devices.controller.js
// DESCRIPCIÓN: Controlador para la Gestión y Apertura Remota de Dispositivos IoT de Barrera
// ==========================================

const db = require('../config/db');

/**
 * @desc    Registrar un nuevo dispositivo IoT de barrera en la garita del country
 * @route   POST /api/barrier-devices
 * @access  Privado (Administrador)
 */
const createBarrierDevice = async (req, res) => {
  try {
    // 1. Extraer los datos del country desde el token JWT del usuario autenticado
    const countryId = req.user.country_id;
    const { device_name, ip_address, api_endpoint, status } = req.body;

    // 2. Validar campos obligatorios básicos
    if (!device_name || !ip_address) {
      return res.status(400).json({ error: 'El nombre del dispositivo y la dirección IP son obligatorios.' });
    }

    // 3. Insertar el dispositivo IoT en la base de datos PostgreSQL
    const query = `
      INSERT INTO barrier_devices (country_id, device_name, ip_address, api_endpoint, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const values = [
      countryId,
      device_name,
      ip_address,
      api_endpoint || null,
      status || 'online'
    ];

    const result = await db.query(query, values);

    // 4. Responder con éxito y los datos del dispositivo registrado
    return res.status(201).json({
      message: 'Dispositivo IoT de barrera registrado exitosamente',
      device: result.rows[0]
    });

  } catch (error) {
    console.error('Error al registrar dispositivo de barrera:', error);
    return res.status(500).json({ error: 'Error interno del servidor al registrar el dispositivo.' });
  }
};

/**
 * @desc    Listar todos los dispositivos IoT de barrera del country
 * @route   GET /api/barrier-devices
 * @access  Privado (Seguridad / Administrador)
 */
const getBarrierDevices = async (req, res) => {
  try {
    const countryId = req.user.country_id;

    // Consultar todos los dispositivos asociados al barrio
    const query = `SELECT * FROM barrier_devices WHERE country_id = $1 ORDER BY created_at DESC`;
    const result = await db.query(query, [countryId]);

    return res.json({
      status: 'success',
      total: result.rows.length,
      devices: result.rows
    });

  } catch (error) {
    console.error('Error al consultar dispositivos de barrera:', error);
    return res.status(500).json({ error: 'Error interno al consultar los dispositivos.' });
  }
};

/**
 * @desc    Accionar la apertura remota de una barrera física
 * @route   POST /api/barrier-devices/:id/open
 * @access  Privado (Seguridad / Administrador)
 */
const triggerBarrierOpen = async (req, res) => {
  try {
    const { id } = req.params;
    const countryId = req.user.country_id;

    // 1. Buscar el dispositivo y verificar que pertenezca al country
    const deviceQuery = `SELECT * FROM barrier_devices WHERE id = $1 AND country_id = $2`;
    const deviceResult = await db.query(deviceQuery, [id, countryId]);

    if (deviceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Dispositivo de barrera no encontrado.' });
    }

    const device = deviceResult.rows[0];

    // 2. Validar que tenga un endpoint de API configurado
    if (!device.api_endpoint) {
      return res.status(400).json({ error: 'El dispositivo no tiene configurado un endpoint de API para apertura remota.' });
    }

    // 3. Simular o realizar la petición HTTP hacia el hardware IoT físico (ej. fetch al endpoint)
    // const response = await fetch(device.api_endpoint, { method: 'POST' });

    return res.json({
      message: `Comanda de apertura enviada exitosamente al dispositivo: ${device.device_name}`,
      device_ip: device.ip_address,
      status: 'triggered'
    });

  } catch (error) {
    console.error('Error al accionar barrera física:', error);
    return res.status(500).json({ error: 'Error al comunicarse con el dispositivo de barrera.' });
  }
};

module.exports = {
  createBarrierDevice,
  getBarrierDevices,
  triggerBarrierOpen
};