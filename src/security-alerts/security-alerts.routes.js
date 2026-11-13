// src/security-alerts/security-alerts.routes.js
const express = require('express');
const router = express.Router();
const { 
  createAlert, 
  getAlerts, 
  updateAlertStatus 
} = require('./security-alerts.controller');
const { verifyToken } = require('../auth/auth.middleware');

router.use(verifyToken);

router.post('/', createAlert);
router.get('/', getAlerts);
router.put('/:id', updateAlertStatus);

module.exports = router;