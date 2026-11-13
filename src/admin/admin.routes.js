// ==========================================
// ARCHIVO: src/admin/admin.routes.js
// DESCRIPCIÓN: Enrutador para el módulo de administración
// ==========================================

const { Router } = require('express');
const { getAdminStats } = require('./admin.controller');

const router = Router();

// Ruta: GET /api/admin/stats
router.get('/stats', getAdminStats);

module.exports = router;