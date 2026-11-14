/**
 * @file access-passes.routes.js
 * @description Enrutador para la gestión de pases de acceso y códigos QR temporales.
 * @location /nexrust-backend/src/access-passes/access-passes.routes.js
 */

const express = require('express');
const router = express.Router();

// Importamos de manera segura las funciones exportadas del controlador
const { 
  getPasses, 
  createPass, 
  updatePassStatus 
} = require('./access-passes.controller');

// Importamos el middleware de autenticación
const { verifyToken } = require('../auth/auth.middleware');

// Protegemos todas las rutas exigiendo token JWT válido
router.use(verifyToken);

// Endpoint para listar los pases de acceso
router.get('/', getPasses);

// Endpoint para crear un nuevo pase con QR
router.post('/', createPass);

// Endpoint para actualizar el estado del pase
router.put('/:id/status', updatePassStatus);

module.exports = router;