// ==========================================
// UBICACIÓN: src/recurring-authorizations/recurring-authorizations.routes.js
// DESCRIPCIÓN: Enrutador para el Módulo de Autorizaciones Recurrentes
// ==========================================

const express = require('express');
const router = express.Router();
const { 
  createRecurringAuthorization, 
  getRecurringAuthorizations, 
  revokeRecurringAuthorization 
} = require('./recurring-authorizations.controller');
const { verifyToken } = require('../auth/auth.middleware');

// Todas las rutas requieren token JWT
router.use(verifyToken);

router.post('/', createRecurringAuthorization);
router.get('/', getRecurringAuthorizations);
router.put('/:id/revoke', revokeRecurringAuthorization);

module.exports = router;