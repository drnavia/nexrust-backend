// ==========================================
// UBICACIÓN: src/providers/providers.controller.js
// DESCRIPCIÓN: Controlador para la Gestión de Prestadores y sus Vehículos
// ==========================================

const db = require('../config/db');

/**
 * @desc    Registrar un nuevo prestador de servicios junto con su vehículo (Transaccional)
 * @route   POST /api/providers
 * @access  Privado (Admin / Residente Autorizado)
 */
const createProviderWithVehicle = async (req, res) => {
  const client = await db.pool.connect();
  try {
    // 1. Iniciar transacción SQL para garantizar atomicidad
    await client.query('BEGIN');

    const { first_name, last_name, specialty, dni, criminal_record_url, accident_insurance_url, vehicle } = req.body;

    // 2. Validar campos obligatorios del prestador
    if (!first_name || !last_name || !specialty || !dni) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Faltan campos obligatorios del prestador (first_name, last_name, specialty, dni).' });
    }

    // 3. Control de duplicidad: Verificar si el DNI del prestador ya existe
    const dniCheck = await client.query('SELECT id FROM providers WHERE dni = $1', [dni]);
    if (dniCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Ya existe un prestador registrado con este DNI.' });
    }

    // 4. Insertar el prestador en la tabla 'providers'
    const providerQuery = `
      INSERT INTO providers (first_name, last_name, specialty, dni, verification_status, criminal_record_url, accident_insurance_url)
      VALUES ($1, $2, $3, $4, 'pending', $5, $6)
      RETURNING *
    `;
    const providerValues = [
      first_name,
      last_name,
      specialty,
      dni,
      criminal_record_url || null,
      accident_insurance_url || null
    ];
    const providerResult = await client.query(providerQuery, providerValues);
    const newProvider = providerResult.rows[0];

    // 5. Si se proporciona información de vehículo, registrarla en 'provider_vehicles'
    let newVehicle = null;
    if (vehicle && vehicle.license_plate) {
      const vehicleQuery = `
        INSERT INTO provider_vehicles (provider_id, license_plate, model, color)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;
      const vehicleValues = [
        newProvider.id,
        vehicle.license_plate,
        vehicle.model || null,
        vehicle.color || null
      ];
      const vehicleResult = await client.query(vehicleQuery, vehicleValues);
      newVehicle = vehicleResult.rows[0];
    }

    // 6. Confirmar transacción
    await client.query('COMMIT');

    return res.status(201).json({
      message: 'Prestador y vehículo registrados exitosamente',
      provider: newProvider,
      vehicle: newVehicle
    });

  } catch (error) {
    // Revertir cambios en caso de error
    await client.query('ROLLBACK');
    console.error('Error al registrar prestador con vehículo:', error);
    return res.status(500).json({ error: 'Error interno al registrar el prestador.' });
  } finally {
    client.release();
  }
};

/**
 * @desc    Listar todos los prestadores registrados junto con sus datos vehiculares
 * @route   GET /api/providers
 * @access  Privado
 */
const getProviders = async (req, res) => {
  try {
    const query = `
      SELECT p.*, pv.license_plate, pv.model, pv.color 
      FROM providers p
      LEFT JOIN provider_vehicles pv ON p.id = pv.provider_id
      ORDER BY p.created_at DESC
    `;
    const result = await db.query(query);

    return res.json({
      status: 'success',
      total: result.rows.length,
      providers: result.rows
    });
  } catch (error) {
    console.error('Error al listar prestadores:', error);
    return res.status(500).json({ error: 'Error interno al consultar prestadores.' });
  }
};

module.exports = { createProviderWithVehicle, getProviders };