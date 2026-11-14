/**
 * @file admin.controller.js
 * @description Controlador para la gestión de configuración visual y marca blanca de los countries.
 * @location /nexrust-backend/src/admin/admin.controller.js
 */

const pool = require('../config/db');

/**
 * Obtiene la configuración de marca blanca de un Country específico.
 */
const getCountryConfig = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'SELECT id, name, zone, theme_config FROM countries WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Country no encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al obtener la configuración del country:', err);
    res.status(500).json({ message: 'Error interno del servidor', error: err.message });
  }
};

/**
 * Actualiza la configuración de marca blanca (theme_config JSONB) de un Country.
 */
const updateCountryConfig = async (req, res) => {
  const { id } = req.params;
  const { theme_config } = req.body;
  
  try {
    // Casteo explícito a ::jsonb y serialización garantizada para evitar errores de tipo en PostgreSQL
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
      return res.status(404).json({ message: 'Country no encontrado para actualizar' });
    }

    res.json({
      message: 'Configuración visual actualizada con éxito',
      country: result.rows[0]
    });
  } catch (err) {
    console.error('Error al actualizar theme_config:', err);
    res.status(500).json({ message: 'Error al actualizar la configuración visual', error: err.message });
  }
};

module.exports = {
  getCountryConfig,
  updateCountryConfig
};