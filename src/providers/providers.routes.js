/**
 * @file providers.routes.js
 * @description Rutas para la gestión de prestadores y servicios del marketplace.
 * @location /nexrust-backend/src/providers/providers.routes.js
 */

const express = require('express');
const router = express.Router();

// Importa el controlador de providers (asegúrate de que exista y exporte estas funciones)
// Si aún no tienes el controlador completo, puedes usar handlers temporales para evitar que crashee:
const { 
  getProviders = (req, res) => res.json([]), 
  createProvider = (req, res) => res.status(201).json({ message: 'Creado' }) 
} = require('./providers.controller');

// Definición de rutas
router.get('/', getProviders);
router.post('/', createProvider);

module.exports = router;