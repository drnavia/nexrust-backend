// src/expenses/expense.routes.js
const express = require('express');
const router = express.Router();
const { 
    createExpense, 
    getExpenses, 
    reportPayment, 
    verifyAndApprovePayment, 
    rejectPayment 
} = require('./expenses.controller');
const { verifyToken } = require('../auth/auth.middleware'); // Ajusta según la ruta de tu middleware de auth

router.post('/', verifyToken, createExpense);
router.get('/', verifyToken, getExpenses);
router.put('/:id/report-payment', verifyToken, reportPayment);
router.put('/:id/approve', verifyToken, verifyAndApprovePayment);
router.put('/:id/reject', verifyToken, rejectPayment);

module.exports = router;