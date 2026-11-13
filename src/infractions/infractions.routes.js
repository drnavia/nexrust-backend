// ==========================================
// UBICACIÓN: src/infractions/infractions.routes.js
// DESCRIPCIÓN: Enrutador para el Módulo de Infracciones y Multas
// ==========================================

const express = require('express');
const router = express.Router();
const { 
  createInfraction, 
  getInfractions, 
  updateInfractionStatus 
} = require('./infractions.controller');
const { verifyToken } = require('../auth/auth.middleware');

router.use(verifyToken);

router.post('/', createInfraction);
router.get('/', getInfractions);
router.put('/:id', updateInfractionStatus);

module.exports = router;