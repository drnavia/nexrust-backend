// src/expenses/expenses.controller.js

// ==========================================
// MÓDULO DE EXPENSAS Y FINANZAS
// ==========================================
const db = require('../config/db');

/**
 * @desc    Crear una nueva liquidación de expensas (Admin)
 * @route   POST /api/expenses
 * @access  Privado (Admin)
 */
const createExpense = async (req, res) => {
  try {
    const countryId = req.user.country_id;
    const { destination_lot, destination_fraction, period, amount, due_date } = req.body;

    if (!destination_lot || !period || !amount || !due_date) {
      return res.status(400).json({ error: 'Faltan campos obligatorios (destination_lot, period, amount, due_date).' });
    }

    const query = `
      INSERT INTO expenses (country_id, destination_lot, destination_fraction, period, amount, due_date, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'pending')
      RETURNING *
    `;
    const values = [countryId, destination_lot, destination_fraction || null, period, amount, due_date];
    const result = await db.query(query, values);

    return res.status(201).json({
      message: 'Expensa creada exitosamente',
      expense: result.rows[0]
    });
  } catch (error) {
    if (error.code === '23505') { // Violación de constraint unique_lot_period
      return res.status(400).json({ error: 'Ya existe una expensa registrada para este lote y período.' });
    }
    console.error('Error al crear expensa:', error);
    return res.status(500).json({ error: 'Error interno del servidor al crear la expensa.' });
  }
};

/**
 * @desc    Consultar las expensas del country
 * @route   GET /api/expenses
 * @access  Privado
 */
const getExpenses = async (req, res) => {
  try {
    const countryId = req.user.country_id;

    const query = `
      SELECT * FROM expenses 
      WHERE country_id = $1
      ORDER BY period DESC, created_at DESC
    `;
    const result = await db.query(query, [countryId]);

    return res.json({
      status: 'success',
      total: result.rows.length,
      expenses: result.rows
    });
  } catch (error) {
    console.error('Error al consultar expensas:', error);
    return res.status(500).json({ error: 'Error interno del servidor al consultar las expensas.' });
  }
};

/**
 * @desc    Reportar el pago de una expensa (Residente)
 * @route   PUT /api/expenses/:id/report-payment
 * @access  Privado (Residente)
 */
const reportPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_proof } = req.body;

    if (!payment_proof) {
      return res.status(400).json({ error: 'El comprobante de pago (payment_proof) es obligatorio.' });
    }

    const query = `
      UPDATE expenses 
      SET payment_proof = $1, status = 'under_review'
      WHERE id = $2 AND status IN ('pending', 'overdue')
      RETURNING *
    `;
    const result = await db.query(query, [payment_proof, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Expensa no encontrada o ya se encuentra pagada / en revisión.' });
    }

    return res.json({
      message: 'Comprobante reportado exitosamente. En revisión por administración.',
      expense: result.rows[0]
    });
  } catch (error) {
    console.error('Error al reportar pago de expensa:', error);
    return res.status(500).json({ error: 'Error interno del servidor al reportar el pago.' });
  }
};

/**
 * @desc    Verificar y aprobar el pago de una expensa (Administración)
 * @route   PUT /api/expenses/:id/approve
 * @access  Privado (Admin)
 */
const verifyAndApprovePayment = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      UPDATE expenses 
      SET status = 'paid'
      WHERE id = $1 AND status = 'under_review'
      RETURNING *
    `;
    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Expensa no encontrada o no está en estado de revisión.' });
    }

    return res.json({
      message: 'Pago de expensa aprobado exitosamente.',
      expense: result.rows[0]
    });
  } catch (error) {
    console.error('Error al aprobar pago:', error);
    return res.status(500).json({ error: 'Error interno del servidor al aprobar el pago.' });
  }
};

/**
 * @desc    Rechazar el pago de una expensa y devolver a pendiente (Administración)
 * @route   PUT /api/expenses/:id/reject
 * @access  Privado (Admin)
 */
const rejectPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejection_reason } = req.body; // Opcional para dejar constancia

    const query = `
      UPDATE expenses 
      SET status = 'pending', payment_proof = NULL
      WHERE id = $1 AND status = 'under_review'
      RETURNING *
    `;
    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Expensa no encontrada o no está en estado de revisión.' });
    }

    return res.json({
      message: 'Pago rechazado. La expensa vuelve a estado pendiente.',
      expense: result.rows[0],
      rejection_reason: rejection_reason || 'No especificado'
    });
  } catch (error) {
    console.error('Error al rechazar pago:', error);
    return res.status(500).json({ error: 'Error interno del servidor al rechazar el pago.' });
  }
};

module.exports = {
  createExpense,
  getExpenses,
  reportPayment,
  verifyAndApprovePayment,
  rejectPayment
};