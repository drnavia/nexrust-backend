// ==========================================
// UBICACIÓN: src/notifications/notifications.routes.js
// DESCRIPCIÓN: Enrutador para el Módulo de Notificaciones
// ==========================================

const express = require('express');
const router = express.Router();
const { getNotifications, markAsRead } = require('./notifications.controller');
const { verifyToken } = require('../auth/auth.middleware');

router.use(verifyToken);

router.get('/', getNotifications);
router.put('/:id/read', markAsRead);

module.exports = router;