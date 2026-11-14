/**
 * @file admin.routes.js
 * @description Enrutador para la gestión de configuración de countries.
 * @location /nexrust-backend/src/admin/admin.routes.js
 */

const express = require('express');
const router = express.Router();
const { getCountryConfig, updateCountryConfig } = require('./admin.controller');

// Nota: Si en tu app.js montas este router con app.icon('/api', adminRoutes), 
// la URL final será /api/countries/:id/config
router.get('/countries/:id/config', getCountryConfig);
router.put('/countries/:id/config', updateCountryConfig);

module.exports = router;