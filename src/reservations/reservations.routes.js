// src/reservations/reservations.routes.js
const express = require('express');
const router = express.Router();
const { 
  getAmenities, 
  createReservation, 
  getReservations, 
  cancelReservation 
} = require('./reservations.controller');
const { verifyToken } = require('../auth/auth.middleware');

router.use(verifyToken);

router.get('/amenities', getAmenities);
router.get('/', getReservations);
router.post('/', createReservation);
router.put('/:id/cancel', cancelReservation);

module.exports = router;