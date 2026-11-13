// ==========================================
// UBICACIÓN: src/config/db.js
// DESCRIPCIÓN: Módulo de Conexión Centralizada a la Base de Datos PostgreSQL (Nexrust)
// ==========================================

// 1. Cargar las variables de entorno desde el archivo .env (DEBE ESTAR PRIMERO QUE TODO)
require('dotenv').config();

const { Pool } = require('pg');

// 2. Configurar la instancia del Pool de conexiones usando las credenciales del entorno
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD, // Nota: Si la contraseña contiene caracteres especiales, enciérrala entre comillas en el archivo .env
  port: process.env.DB_PORT || 5432,
});

// 3. Escuchar el evento de conexión exitosa para control en consola
pool.on('connect', () => {
  console.log('📦 Conectado correctamente a la base de datos PostgreSQL de Nexrust');
});

// 4. Exportar las utilidades de base de datos para ser usadas en los controladores
module.exports = {
  /**
   * Ejecuta una consulta SQL genérica con parámetros seguros (Prepared Statements)
   * @param {string} text - Sentencia SQL a ejecutar
   * @param {Array} params - Parámetros de la consulta
   * @returns {Promise} Resultado de la consulta de PostgreSQL
   */
  query: (text, params) => pool.query(text, params),

  // Exportar la instancia de pool para permitir transacciones atómicas (BEGIN/COMMIT/ROLLBACK y .connect())
  pool 
};