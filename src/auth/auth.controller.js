// ==========================================
// UBICACIÓN: src/auth/auth.controller.js
// DESCRIPCIÓN: Controlador de Autenticación y Registro de Usuarios para Nexrust
// ==========================================

const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

/**
 * @desc    Registrar un nuevo usuario en el sistema (Residente, Admin, Guardia, etc.)
 * @route   POST /api/auth/register
 * @access  Público / Privado (según reglas de alta)
 */
const register = async (req, res) => {
  try {
    // 1. Extraer los datos del cuerpo de la petición
    const { country_id, first_name, last_name, lot_number, fraction, email, phone, password, role, dni, owner_id } = req.body;

    // 2. Validar campos obligatorios básicos
    if (!country_id || !first_name || !last_name || !email || !password) {
      return res.status(400).json({ error: 'Faltan campos obligatorios (country_id, first_name, last_name, email, password).' });
    }

    // 3. Control de duplicidad: Verificar si el correo electrónico ya se encuentra registrado
    const emailCheck = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ error: 'El correo electrónico ya se encuentra registrado.' });
    }

    // 4. Encriptar la contraseña de forma segura usando bcrypt
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 5. Insertar el usuario en la base de datos PostgreSQL
    const query = `
      INSERT INTO users (country_id, first_name, last_name, lot_number, fraction, email, phone, password_hash, role, dni, owner_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id, country_id, first_name, last_name, email, role, lot_number, fraction
    `;
    const values = [
      country_id,
      first_name,
      last_name,
      lot_number || null,
      fraction || null,
      email,
      phone || null,
      passwordHash,
      role || 'resident',
      dni || null,
      owner_id || null
    ];

    const result = await db.query(query, values);

    // 6. Retornar respuesta de éxito
    return res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user: result.rows[0]
    });

  } catch (error) {
    console.error('Error en el registro de usuario:', error);
    return res.status(500).json({ error: 'Error interno del servidor al registrar el usuario.' });
  }
};

/**
 * @desc    Iniciar sesión y generar token JWT de autenticación
 * @route   POST /api/auth/login
 * @access  Público
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validar credenciales provistas
    if (!email || !password) {
      return res.status(400).json({ error: 'El correo y la contraseña son obligatorios.' });
    }

    // 2. Buscar al usuario por correo electrónico
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    const user = result.rows[0];

    // 3. Comparar la contraseña ingresada con el hash almacenado
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    // 4. Generar Token JWT con datos clave (Payload)
    const tokenPayload = {
      id: user.id,
      country_id: user.country_id,
      email: user.email,
      role: user.role,
      lot_number: user.lot_number
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET || 'secreto_super_seguro', {
      expiresIn: '8h'
    });

    // 5. Retornar token y datos del usuario
    return res.json({
      message: 'Inicio de sesión exitoso',
      token,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role,
        country_id: user.country_id
      }
    });

  } catch (error) {
    console.error('Error en el inicio de sesión:', error);
    return res.status(500).json({ error: 'Error interno del servidor al iniciar sesión.' });
  }
};

module.exports = { register, login };