// ==========================================
// UBICACIÓN: src/events/events.routes.js
// DESCRIPCIÓN: Enrutador para el Módulo de Eventos Masivos
// ==========================================

const express = require('express');
const router = express.Router();
const { 
  createEvent, 
  getEvents, 
  getEventById 
} = require('./events.controller');
const { verifyToken } = require('../auth/auth.middleware');

router.use(verifyToken);

router.post('/', createEvent);
router.get('/', getEvents);
router.get('/:id', getEventById);

module.exports = router;