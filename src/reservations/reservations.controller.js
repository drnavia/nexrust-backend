// src/reservations/reservations.controller.js

// ==========================================
// MÓDULO DE AMENITIES Y RESERVAS
// ==========================================
const db = require('../config/db');

/**
 * @desc    Listar todas las instalaciones (amenities) activas del country
 * @route   GET /api/reservations/amenities
 * @access  Privado (Requiere Token JWT)
 */
const getAmenities = async (req, res) => {
  try {
    // 1. Obtener el country_id del usuario autenticado
    const countryId = req.user.country_id;

    // 2. Consultar amenities activas
    const query = `
      SELECT * FROM amenities 
      WHERE country_id = $1 AND is_active = true
      ORDER BY name ASC
    `;
    const result = await db.query(query, [countryId]);

    // 3. Retornar listado
    return res.json({
      status: 'success',
      total: result.rows.length,
      amenities: result.rows
    });

  } catch (error) {
    console.error('Error al obtener amenities:', error);
    return res.status(500).json({ error: 'Error interno del servidor al consultar las instalaciones.' });
  }
};

/**
 * @desc    Crear una reserva de amenity con validación estricta de superposición
 * @route   POST /api/reservations
 * @access  Privado (Residente / Usuario)
 */
const createReservation = async (req, res) => {
  try {
    // 1. Extraer datos del usuario y del body
    const userId = req.user.id;
    const countryId = req.user.country_id;
    const { amenity_id, start_time, end_time } = req.body;

    // 2. Validar campos obligatorios
    if (!amenity_id || !start_time || !end_time) {
      return res.status(400).json({ 
        error: 'Faltan campos obligatorios (amenity_id, start_time, end_time).' 
      });
    }

    // 3. Validar lógica temporal (que la fecha de inicio sea anterior a la de fin)
    const startDate = new Date(start_time);
    const endDate = new Date(end_time);

    if (startDate >= endDate) {
      return res.status(400).json({ 
        error: 'La hora de inicio debe ser anterior a la hora de finalización.' 
      });
    }

    if (startDate < new Date()) {
      return res.status(400).json({ 
        error: 'No se pueden realizar reservas en el pasado.' 
      });
    }

    // 4. CONTROL DE DUPLICIDAD / SUPERPOSICIÓN DE HORARIOS:
    // Verificamos si ya existe una reserva 'confirmed' que se cruce con el rango solicitado
    const overlapQuery = `
      SELECT id FROM reservations 
      WHERE amenity_id = $1 
        AND status = 'confirmed' 
        AND (start_time < $3 AND end_time > $2)
    `;
    const overlapCheck = await db.query(overlapQuery, [amenity_id, start_time, end_time]);

    if (overlapCheck.rows.length > 0) {
      return res.status(400).json({ 
        error: 'La instalación ya se encuentra reservada en ese rango horario. Seleccione otro horario.' 
      });
    }

    // 5. Insertar la reserva en PostgreSQL
    const query = `
      INSERT INTO reservations (amenity_id, user_id, country_id, start_time, end_time, status)
      VALUES ($1, $2, $3, $4, $5, 'confirmed')
      RETURNING *
    `;
    const values = [amenity_id, userId, countryId, start_time, end_time];
    const result = await db.query(query, values);

    // 6. Retornar éxito
    return res.status(201).json({
      message: 'Reserva creada exitosamente',
      reservation: result.rows[0]
    });

  } catch (error) {
    console.error('Error al crear reserva:', error);
    return res.status(500).json({ error: 'Error interno del servidor al procesar la reserva.' });
  }
};

/**
 * @desc    Listar las reservas activas del country o del usuario
 * @route   GET /api/reservations
 * @access  Privado
 */
const getReservations = async (req, res) => {
  try {
    const countryId = req.user.country_id;

    const query = `
      SELECT r.*, a.name AS amenity_name, a.type AS amenity_type,
             u.first_name, u.last_name, u.lot_number
      FROM reservations r
      JOIN amenities a ON r.amenity_id = a.id
      JOIN users u ON r.user_id = u.id
      WHERE r.country_id = $1
      ORDER BY r.start_time DESC
    `;
    const result = await db.query(query, [countryId]);

    return res.json({
      status: 'success',
      total: result.rows.length,
      reservations: result.rows
    });

  } catch (error) {
    console.error('Error al obtener reservas:', error);
    return res.status(500).json({ error: 'Error interno del servidor al consultar las reservas.' });
  }
};

/**
 * @desc    Cancelar una reserva
 * @route   PUT /api/reservations/:id/cancel
 * @access  Privado
 */
const cancelReservation = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      UPDATE reservations 
      SET status = 'cancelled'
      WHERE id = $1 AND status = 'confirmed'
      RETURNING *
    `;
    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reserva no encontrada o ya se encuentra cancelada.' });
    }

    return res.json({
      message: 'Reserva cancelada exitosamente',
      reservation: result.rows[0]
    });

  } catch (error) {
    console.error('Error al cancelar reserva:', error);
    return res.status(500).json({ error: 'Error interno del servidor al cancelar la reserva.' });
  }
};

module.exports = {
  getAmenities,
  createReservation,
  getReservations,
  cancelReservation
};