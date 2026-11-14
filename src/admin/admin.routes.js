/**
 * @file admin.routes.js
 * @description Enrutador para el módulo administrativo y de configuración de countries.
 * @location /nexrust-backend/src/admin/admin.routes.js
 */

const express = require('express');
const router = express.Router();
const { getCountriesList, getCountryConfig, updateCountryConfig } = require('./admin.controller');
const { verifyToken } = require('../auth/auth.middleware');

// Todas las rutas administrativas exigen autenticación por token
router.use(verifyToken);

// Endpoint para listar todos los countries (para selector de superadmin)
router.get('/countries', getCountriesList);

// Endpoint para obtener la configuración de un country
router.get('/countries/:id/config', getCountryConfig);

// Endpoint para actualizar la configuración de marca blanca (JSONB)
router.put('/countries/:id/config', updateCountryConfig);

module.exports = router;