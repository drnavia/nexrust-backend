// ==========================================
// UBICACIÓN: src/visitor-logs/visitor-logs.routes.js
// DESCRIPCIÓN: Enrutador para el Control de Accesos y Bitácora en Garita (Check-in / Check-out)
// ==========================================

const express = require('express');
const router = express.Router();

// 1. Importar exactamente la función definida en el controlador
const { 
  registerEntry, 
  scanQrEntry, 
  registerExit, 
  getVisitorLogs 
} = require('./visitor-logs.controller');
const { verifyToken } = require('../auth/auth.middleware');

// Requerir autenticación para gestionar pases
router.use(verifyToken);

// Registrar ingreso manual de un visitante o prestador
router.post('/entry', registerEntry);

// Validar y registrar ingreso mediante escaneo del token QR del pase
router.post('/scan-qr', scanQrEntry);

// Registrar el egreso (check-out) por ID de registro
router.put('/:id/exit', registerExit);

// Listar la bitácora completa de ingresos y egresos del country
router.get('/', getVisitorLogs);

module.exports = router;