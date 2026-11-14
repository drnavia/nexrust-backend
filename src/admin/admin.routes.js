/**
 * @file admin.routes.js
 * @description Rutas para el módulo de administración.
 * @location /nexrust-backend/src/admin/admin.routes.js
 */

const express = require('express');
const router = express.Router();
const { getCountryConfig, updateCountryConfig } = require('./admin.controller');

// Definición de rutas conectadas a los controladores
router.get('/countries/:id/config', getCountryConfig);
router.put('/countries/:id/config', updateCountryConfig);

module.exports = router;