/**
 * @file admin.routes.js
 * @description Enrutador para las operaciones administrativas.
 * @location /nexrust-backend/src/admin/admin.routes.js
 */

const express = require('express');
const router = express.Router();
const { getCountryConfig, updateCountryConfig } = require('./admin.controller');

// Endpoints para gestión de marcas blancas por Country
router.get('/countries/:id/config', getCountryConfig);
router.put('/countries/:id/config', updateCountryConfig);

module.exports = router;