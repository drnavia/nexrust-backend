// ==========================================
// UBICACIÓN: src/providers/providers.routes.js
// DESCRIPCIÓN: Rutas para el Módulo de Prestadores
// ==========================================

const express = require('express');
const router = express.Router();

// 1. Importar exactamente la función definida en el controlador
const { getProviders, createProviderWithVehicle } = require('./providers.controller');
const { verifyToken } = require('../auth/auth.middleware');

// Todas las rutas de prestadores requieren autenticación JWT
router.use(verifyToken);

// Listar todos los prestadores y sus vehículos
router.get('/', getProviders);

// Registrar un nuevo prestador junto con su vehículo (Transaccional)
router.post('/', createProviderWithVehicle);

module.exports = router;