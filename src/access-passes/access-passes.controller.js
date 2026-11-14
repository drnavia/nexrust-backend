/**
 * @file access-passes.controller.js
 * @description Controlador para la gestión de pases de acceso y códigos QR temporales.
 * @location /nexrust-backend/src/access-passes/access-passes.controller.js
 */

const pool = require('../config/db');

/**
 * Obtiene la lista completa de pases de acceso registrados.
 * @param {Object} req - Petición HTTP (Express)
 * @param {Object} res - Respuesta HTTP (Express)
 */
const getPasses = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM access_passes ORDER BY created_at DESC LIMIT 50');
    return res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener pases de acceso:', err);
    return res.status(500).json({ message: 'Error interno del servidor al obtener pases' });
  }
};

/**
 * Crea un nuevo pase de acceso o código QR temporal.
 * @param {Object} req - Petición HTTP (Express)
 * @param {Object} res - Respuesta HTTP (Express)
 */
const createPass = async (req, res) => {
  const { user_id, provider_id, country_id, destination_lot, destination_fraction, start_date, end_date, qr_token } = req.body;
  try {
    const query = `
      INSERT INTO access_passes (user_id, provider_id, country_id, destination_lot, destination_fraction, start_date, end_date, qr_token, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
      RETURNING *;
    `;
    const values = [
      user_id || null, 
      provider_id || null, 
      country_id, 
      destination_lot, 
      destination_fraction || null, 
      start_date, 
      end_date, 
      qr_token || 'token_qr_generico'
    ];
    const result = await pool.query(query, values);
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error al crear pase de acceso:', err);
    return res.status(500).json({ message: 'Error al registrar el pase de acceso' });
  }
};

/**
 * Actualiza el estado de un pase de acceso (ej. active, completed, cancelled).
 * @param {Object} req - Petición HTTP (Express)
 * @param {Object} res - Respuesta HTTP (Express)
 */
const updatePassStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const result = await pool.query(
      'UPDATE access_passes SET status = $1 WHERE id = $2 RETURNING *;',
      [status, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Pase de acceso no encontrado' });
    }
    return res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al actualizar estado del pase:', err);
    return res.status(500).json({ message: 'Error al actualizar el estado del pase' });
  }
};

// Exportamos las funciones garantizando compatibilidad con las rutas originales
module.exports = {
  getPasses,
  createPass,
  updatePassStatus
};