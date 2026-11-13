// ==========================================
// UBICACIÓN: src/barrier-devices/barrier-devices.routes.js
// DESCRIPCIÓN: Enrutador para el Módulo de Dispositivos IoT de Barrera
// ==========================================

const express = require('express');
const router = express.Router();
const { 
  createBarrierDevice, 
  getBarrierDevices, 
  triggerBarrierOpen 
} = require('./barrier-devices.controller');
const { verifyToken } = require('../auth/auth.middleware');

router.use(verifyToken);

router.post('/', createBarrierDevice);
router.get('/', getBarrierDevices);
router.post('/:id/open', triggerBarrierOpen);

module.exports = router;