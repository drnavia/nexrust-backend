/**
 * @file admin.controller.js
 * @description Controlador de administración para la gestión de countries y marca blanca (theme_config).
 * @location /nexrust-backend/src/admin/admin.controller.js
 */

const pool = require('../config/db');

/**
 * Obtiene la lista de countries disponibles (útil para el selector global del superadmin).
 * @param {Object} req - Petición HTTP Express
 * @param {Object} res - Respuesta HTTP Express
 */
const getCountriesList = async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, zone, theme_config FROM countries ORDER BY name ASC;');
    res.json(result.rows);
  } catch (err) {
    console.error('Error al listar countries:', err);
    res.status(500).json({ message: 'Error al obtener la lista de countries', detail: err.message });
  }
};

/**
 * Obtiene la configuración de marca blanca de un Country específico.
 * @param {Object} req - Petición HTTP Express
 * @param {Object} res - Respuesta HTTP Express
 */
const getCountryConfig = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'SELECT id, name, zone, theme_config FROM countries WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: `Country con ID ${id} no encontrado.` });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al obtener la configuración del country:', err);
    res.status(500).json({ message: 'Error al obtener la configuración', detail: err.message });
  }
};

/**
 * Actualiza la configuración de marca blanca (theme_config JSONB) de un Country.
 * @param {Object} req - Petición HTTP Express
 * @param {Object} res - Respuesta HTTP Express
 */
const updateCountryConfig = async (req, res) => {
  const { id } = req.params;
  const { theme_config } = req.body;
  
  if (!id || id === 'undefined' || id === 'null') {
    return res.status(400).json({ message: 'ID de country inválido o no proporcionado.' });
  }

  try {
    const query = `
      UPDATE countries 
      SET theme_config = $1::jsonb 
      WHERE id = $2 
      RETURNING id, name, zone, theme_config;
    `;
    
    const jsonValue = typeof theme_config === 'string' ? theme_config : JSON.stringify(theme_config);
    const values = [jsonValue, id];
    
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: `No se encontró el country con ID ${id} para actualizar.` });
    }

    res.json({
      message: 'Configuración visual actualizada con éxito',
      country: result.rows[0]
    });
  } catch (err) {
    console.error('Error detallado al actualizar theme_config:', err);
    res.status(500).json({ 
      message: 'Fallo al actualizar theme_config en la base de datos', 
      error: err.message,
      code: err.code 
    });
  }
};

module.exports = {
  getCountriesList,
  getCountryConfig,
  updateCountryConfig
};