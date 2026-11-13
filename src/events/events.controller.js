// ==========================================
// UBICACIÓN: src/events/events.controller.js
// DESCRIPCIÓN: Controlador para la Gestión de Eventos Masivos y Lista de Invitados
// ==========================================

const db = require('../config/db');
const crypto = require('crypto');

/**
 * @desc    Crear un nuevo evento (cumpleaños, reunión) con precarga de invitados
 * @route   POST /api/events
 * @access  Privado (Residente / Propietario)
 */
const createEvent = async (req, res) => {
  const client = await db.pool.connect();
  try {
    // 1. Iniciar transacción SQL para asegurar la atomicidad del evento y sus invitados
    await client.query('BEGIN');

    const userId = req.user.id;
    const countryId = req.user.country_id;
    const { event_name, destination_fraction, destination_lot, start_date, end_date, location_type, guests } = req.body;

    // 2. Validar campos obligatorios
    if (!event_name || !destination_lot || !start_date || !end_date) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Faltan campos obligatorios para registrar el evento.' });
    }

    // 3. Validar tipo de ubicación (propiedad privada o amenity del barrio)
    const locType = location_type || 'property';
    if (!['property', 'amenity'].includes(locType)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: "El tipo de ubicación debe ser 'property' o 'amenity'." });
    }

    // 4. Generar un token único para el evento
    const eventToken = crypto.randomBytes(24).toString('hex');

    // 5. Insertar el evento principal
    const eventQuery = `
      INSERT INTO events (user_id, country_id, event_name, destination_fraction, destination_lot, start_date, end_date, event_token, location_type)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const eventValues = [
      userId,
      countryId,
      event_name,
      destination_fraction || null,
      destination_lot,
      start_date,
      end_date,
      eventToken,
      locType
    ];

    const eventResult = await client.query(eventQuery, eventValues);
    const newEvent = eventResult.rows[0];

    // 6. Si se incluye un listado inicial de invitados, insertarlos en 'event_guests'
    const insertedGuests = [];
    if (guests && Array.isArray(guests) && guests.length > 0) {
      for (const guest of guests) {
        if (guest.first_name && guest.last_name && guest.dni) {
          const guestQuery = `
            INSERT INTO event_guests (event_id, first_name, last_name, dni)
            VALUES ($1, $2, $3, $4)
            RETURNING *
          `;
          const guestValues = [newEvent.id, guest.first_name, guest.last_name, guest.dni];
          const guestResult = await client.query(guestQuery, guestValues);
          insertedGuests.push(guestResult.rows[0]);
        }
      }
    }

    await client.query('COMMIT');

    return res.status(201).json({
      message: 'Evento masivo creado exitosamente con su lista de invitados',
      event: newEvent,
      guests: insertedGuests
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al crear evento:', error);
    return res.status(500).json({ error: 'Error interno del servidor al procesar el evento.' });
  } finally {
    client.release();
  }
};

/**
 * @desc    Listar todos los eventos del country
 * @route   GET /api/events
 * @access  Privado (Residente / Seguridad / Admin)
 */
const getEvents = async (req, res) => {
  try {
    const countryId = req.user.country_id;

    const query = `
      SELECT e.*, 
             u.first_name AS organizer_first_name, 
             u.last_name AS organizer_last_name 
      FROM events e
      JOIN users u ON e.user_id = u.id
      WHERE e.country_id = $1
      ORDER BY e.start_date DESC
    `;
    const result = await db.query(query, [countryId]);

    return res.json({
      status: 'success',
      total: result.rows.length,
      events: result.rows
    });

  } catch (error) {
    console.error('Error al obtener eventos:', error);
    return res.status(500).json({ error: 'Error interno al consultar los eventos.' });
  }
};

/**
 * @desc    Consultar el detalle de un evento específico y su lista de invitados
 * @route   GET /api/events/:id
 * @access  Privado
 */
const getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    const countryId = req.user.country_id;

    const eventQuery = `SELECT * FROM events WHERE id = $1 AND country_id = $2`;
    const eventResult = await db.query(eventQuery, [id, countryId]);

    if (eventResult.rows.length === 0) {
      return res.status(404).json({ error: 'Evento no encontrado.' });
    }

    const guestsQuery = `SELECT * FROM event_guests WHERE event_id = $1`;
    const guestsResult = await db.query(guestsQuery, [id]);

    return res.json({
      status: 'success',
      event: eventResult.rows[0],
      guests: guestsResult.rows
    });

  } catch (error) {
    console.error('Error al consultar detalle del evento:', error);
    return res.status(500).json({ error: 'Error interno al consultar el evento.' });
  }
};

module.exports = {
  createEvent,
  getEvents,
  getEventById
};