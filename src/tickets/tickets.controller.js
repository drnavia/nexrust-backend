// src/tickets/tickets.controller.js

// ==========================================
// MÓDULO DE TICKETERA Y RECLAMOS (TICKETS)
// ==========================================
const db = require('../config/db');

/**
 * @desc    Crear un nuevo ticket de reclamo o mantenimiento
 * @route   POST /api/tickets
 * @access  Privado (Residente)
 */
const createTicket = async (req, res) => {
  try {
    // 1. Extraer los datos del usuario autenticado desde el token JWT
    const userId = req.user.id;
    const countryId = req.user.country_id;

    // 2. Extraer los campos enviados en el cuerpo de la petición
    const { category, description, priority } = req.body;

    // 3. Validar campos obligatorios básicos
    if (!category || !description) {
      return res.status(400).json({ 
        error: 'La categoría y la descripción son obligatorias para generar el ticket.' 
      });
    }

    // 4. Validar categorías permitidas según las reglas del negocio / esquema de BD
    const validCategories = ['lighting', 'maintenance', 'security', 'water'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ 
        error: `Categoría inválida. Las permitidas son: ${validCategories.join(', ')}` 
      });
    }

    // 5. Validar prioridades permitidas
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    const ticketPriority = priority || 'medium';
    if (!validPriorities.includes(ticketPriority)) {
      return res.status(400).json({ 
        error: `Prioridad inválida. Las permitidas son: ${validPriorities.join(', ')}` 
      });
    }

    // 6. Insertar el ticket en la base de datos PostgreSQL con estado inicial 'open'
    const query = `
      INSERT INTO tickets (country_id, user_id, category, description, priority, status)
      VALUES ($1, $2, $3, $4, $5, 'open')
      RETURNING *
    `;
    const values = [countryId, userId, category, description, ticketPriority];

    const result = await db.query(query, values);

    // 7. Responder con éxito
    return res.status(201).json({
      message: 'Ticket de reclamo creado exitosamente',
      ticket: result.rows[0]
    });

  } catch (error) {
    console.error('Error al crear ticket:', error);
    return res.status(500).json({ error: 'Error interno del servidor al crear el ticket.' });
  }
};

/**
 * @desc    Listar todos los tickets del country (con datos del residente emisor)
 * @route   GET /api/tickets
 * @access  Privado (Residente, Seguridad o Administrador)
 */
const getTickets = async (req, res) => {
  try {
    // 1. Obtener el country_id del usuario autenticado para aislar los datos del barrio
    const countryId = req.user.country_id;

    // 2. Consultar los tickets haciendo un JOIN con la tabla users para conocer los datos del vecino
    const query = `
      SELECT t.*, 
             u.first_name AS resident_first_name, 
             u.last_name AS resident_last_name, 
             u.lot_number
      FROM tickets t
      LEFT JOIN users u ON t.user_id = u.id
      WHERE t.country_id = $1
      ORDER BY t.created_at DESC
    `;
    const result = await db.query(query, [countryId]);

    // 3. Retornar el listado completo
    return res.json({
      status: 'success',
      total: result.rows.length,
      tickets: result.rows
    });

  } catch (error) {
    console.error('Error al obtener tickets:', error);
    return res.status(500).json({ error: 'Error interno del servidor al consultar los tickets.' });
  }
};

/**
 * @desc    Actualizar el estado o prioridad de un ticket (Administración / Staff)
 * @route   PUT /api/tickets/:id
 * @access  Privado (Admin / Staff)
 */
const updateTicketStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, priority } = req.body;

    // Validar estados permitidos si se envían
    if (status) {
      const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ 
          error: `Estado inválido. Los permitidos son: ${validStatuses.join(', ')}` 
        });
      }
    }

    // Validar prioridades permitidas si se envían
    if (priority) {
      const validPriorities = ['low', 'medium', 'high', 'urgent'];
      if (!validPriorities.includes(priority)) {
        return res.status(400).json({ 
          error: `Prioridad inválida. Las permitidas son: ${validPriorities.join(', ')}` 
        });
      }
    }

    // Actualizar el ticket y registrar la marca de tiempo de modificación (updated_at)
    const query = `
      UPDATE tickets 
      SET status = COALESCE($1, status),
          priority = COALESCE($2, priority),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `;
    const result = await db.query(query, [status || null, priority || null, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket no encontrado.' });
    }

    return res.json({
      message: 'Ticket actualizado exitosamente',
      ticket: result.rows[0]
    });

  } catch (error) {
    console.error('Error al actualizar ticket:', error);
    return res.status(500).json({ error: 'Error interno del servidor al actualizar el ticket.' });
  }
};

module.exports = {
  createTicket,
  getTickets,
  updateTicketStatus
};