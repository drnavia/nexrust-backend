/**
 * @file access-passes.routes.js
 * @description Enrutador para la gestión de pases de acceso y códigos QR.
 * @location /nexrust-backend/src/access-passes/access-passes.routes.js
 */

const express = require('express');
const router = express.Router();

const { 
  getPasses, 
  createPass, 
  updatePassStatus 
} = require('./access-passes.controller');

const { verifyToken } = require('../auth/auth.middleware');

router.use(verifyToken);

router.get('/', getPasses);
router.post('/', createPass);
router.put('/:id/status', updatePassStatus);

module.exports = router;