// src/security-alerts/security-alerts.controller.js

// ==========================================
// MÓDULO DE ALERTAS DE SEGURIDAD Y PÁNICO
// ==========================================
const db = require('../config/db');

/**
 * @desc    Emitir una alerta de seguridad o emergencia (Botón de Pánico)
 * @route   POST /api/security-alerts
 * @access  Privado (Residente / Usuario)
 */
const createAlert = async (req, res) => {
  try {
    // 1. Extraer los datos del usuario autenticado y su country
    const userId = req.user.id;
    const countryId = req.user.country_id;

    // 2. Extraer los campos enviados en el body
    const { destination_lot, destination_fraction, alert_type, description } = req.body;

    // 3. Validar campos obligatorios principales
    if (!destination_lot || !alert_type) {
      return res.status(400).json({ 
        error: 'El lote de destino (destination_lot) y el tipo de alerta (alert_type) son obligatorios.' 
      });
    }

    // 4. Validar tipos de alerta permitidos según la base de datos
    const validAlertTypes = ['security', 'medical', 'fire', 'perimeter', 'neighbor_alarm'];
    if (!validAlertTypes.includes(alert_type)) {
      return res.status(400).json({ 
        error: `Tipo de alerta inválido. Los permitidos son: ${validAlertTypes.join(', ')}` 
      });
    }

    // 5. Insertar la alerta en la base de datos PostgreSQL con estado inicial 'active'
    const query = `
      INSERT INTO security_alerts (
        country_id, user_id, destination_fraction, destination_lot, alert_type, description, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'active')
      RETURNING *
    `;
    const values = [
      countryId,
      userId,
      destination_fraction || null,
      destination_lot,
      alert_type,
      description || 'Emergencia reportada desde la app por el residente'
    ];

    const result = await db.query(query, values);

    // Opcional de arquitectura: Aquí se podría disparar un evento WebSockets o notificación push a la garita en tiempo real.

    // 6. Retornar éxito
    return res.status(201).json({
      message: '🚨 Alerta de emergencia emitida exitosamente a la garita de seguridad',
      security_alert: result.rows[0]
    });

  } catch (error) {
    console.error('Error al emitir alerta de seguridad:', error);
    return res.status(500).json({ error: 'Error interno del servidor al procesar la alerta de emergencia.' });
  }
};

/**
 * @desc    Listar todas las alertas de seguridad activas e históricas del country
 * @route   GET /api/security-alerts
 * @access  Privado (Seguridad / Administración)
 */
const getAlerts = async (req, res) => {
  try {
    const countryId = req.user.country_id;

    const query = `
      SELECT sa.*, 
             u.first_name AS resident_first_name, 
             u.last_name AS resident_last_name, 
             u.phone AS resident_phone
      FROM security_alerts sa
      LEFT JOIN users u ON sa.user_id = u.id
      WHERE sa.country_id = $1
      ORDER BY sa.created_at DESC
    `;
    const result = await db.query(query, [countryId]);

    return res.json({
      status: 'success',
      total: result.rows.length,
      alerts: result.rows
    });

  } catch (error) {
    console.error('Error al consultar alertas:', error);
    return res.status(500).json({ error: 'Error interno al consultar el registro de alertas.' });
  }
};

/**
 * @desc    Actualizar el estado de una alerta (Atendida o Falsa Alarma)
 * @route   PUT /api/security-alerts/:id
 * @access  Privado (Seguridad / Administración)
 */
const updateAlertStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['active', 'attended', 'false_alarm'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: `Estado inválido. Los permitidos son: ${validStatuses.join(', ')}` 
      });
    }

    const query = `
      UPDATE security_alerts 
      SET status = $1
      WHERE id = $2
      RETURNING *
    `;
    const result = await db.query(query, [status, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Alerta de seguridad no encontrada.' });
    }

    return res.json({
      message: 'Estado de la alerta actualizado exitosamente',
      security_alert: result.rows[0]
    });

  } catch (error) {
    console.error('Error al actualizar estado de alerta:', error);
    return res.status(500).json({ error: 'Error interno al actualizar la alerta.' });
  }
};

module.exports = {
  createAlert,
  getAlerts,
  updateAlertStatus
};