// ==========================================
// UBICACIÓN: src/notifications/notifications.controller.js
// DESCRIPCIÓN: Controlador para la Gestión de Notificaciones Internas de Usuarios
// ==========================================

const db = require('../config/db');

/**
 * @desc    Listar todas las notificaciones del usuario autenticado
 * @route   GET /api/notifications
 * @access  Privado (Requiere Token JWT)
 */
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const countryId = req.user.country_id;

    const query = `
      SELECT * FROM notifications 
      WHERE user_id = $1 AND country_id = $2 
      ORDER BY created_at DESC
    `;
    const result = await db.query(query, [userId, countryId]);

    return res.json({
      status: 'success',
      total: result.rows.length,
      notifications: result.rows
    });

  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    return res.status(500).json({ error: 'Error interno al consultar las notificaciones.' });
  }
};

/**
 * @desc    Marcar una notificación como leída
 * @route   PUT /api/notifications/:id/read
 * @access  Privado (Requiere Token JWT)
 */
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const query = `
      UPDATE notifications 
      SET is_read = true 
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;
    const result = await db.query(query, [id, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notificación no encontrada.' });
    }

    return res.json({
      message: 'Notificación marcada como leída',
      notification: result.rows[0]
    });

  } catch (error) {
    console.error('Error al actualizar notificación:', error);
    return res.status(500).json({ error: 'Error interno al actualizar la notificación.' });
  }
};

module.exports = {
  getNotifications,
  markAsRead
};