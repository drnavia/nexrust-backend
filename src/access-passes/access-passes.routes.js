// ==========================================
// UBICACIÓN: src/access-passes/access-passes.routes.js
// DESCRIPCIÓN: Enrutador para la Generación de Pases de Acceso QR
// ==========================================

const express = require('express');
const router = express.Router();

// 1. Importar exactamente la función definida en el controlador
const { createAccessPass, getAccessPasses } = require('./access-passes.controller');
const { verifyToken } = require('../auth/auth.middleware');

// Requerir autenticación para gestionar pases
router.use(verifyToken);

// Crear un nuevo pase QR
router.post('/', createAccessPass);

// Listar los pases emitidos en el country
router.get('/', getAccessPasses);

module.exports = router;