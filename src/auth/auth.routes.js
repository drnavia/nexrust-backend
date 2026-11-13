// ==========================================
// UBICACIÓN: src/auth/auth.routes.js
// DESCRIPCIÓN: Enrutador para Autenticación y Registro (Público)
// ==========================================

const express = require('express');
const router = express.Router();
const { register, login } = require('./auth.controller');

// Ruta para registrar un nuevo usuario en el sistema
router.post('/register', register);

// Ruta para iniciar sesión y emitir el Token JWT
router.post('/login', login);

module.exports = router;