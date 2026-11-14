/**
 * @file access-passes.controller.js
 * @description Controlador para la gestión de pases de acceso y códigos QR temporales.
 * @location /nexrust-backend/src/access-passes/access-passes.controller.js
 */

const pool = require('../config/db');

/**
 * Obtiene la lista de pases de acceso registrados.
 */
const getPasses = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM access_passes ORDER BY created_at DESC LIMIT 50');
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener pases de acceso:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

/**
 * Crea un nuevo pase de acceso o QR temporal.
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
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error al crear pase de acceso:', err);
    res.status(500).json({ message: 'Error al registrar el pase de acceso' });
  }
};

/**
 * Actualiza el estado de un pase de acceso (ej. active, completed, cancelled).
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
      return res.status(404).json({ message: 'Pase no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al actualizar estado del pase:', err);
    res.status(500).json({ message: 'Error al actualizar el estado' });
  }
};

// Exportación completa y correcta de todas las funciones
module.exports = {
  getPasses,
  createPass,
  updatePassStatus
};