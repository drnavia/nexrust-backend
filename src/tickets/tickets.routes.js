// src/tickets/tickets.routes.js
const express = require('express');
const router = express.Router();
const { 
  createTicket, 
  getTickets, 
  updateTicketStatus 
} = require('./tickets.controller');
const { verifyToken } = require('../auth/auth.middleware');

// Todas las rutas requieren token JWT de autenticación
router.use(verifyToken);

router.post('/', createTicket);
router.get('/', getTickets);
router.put('/:id', updateTicketStatus);

module.exports = router;