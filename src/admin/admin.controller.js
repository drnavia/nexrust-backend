// ==========================================
// ARCHIVO: src/admin/admin.controller.js
// DESCRIPCIÓN: Controlador para obtener las estadísticas operativas del panel admin
// ==========================================

const db = require('../config/db'); // Importa la conexión centralizada a PostgreSQL

const getAdminStats = async (req, res) => {
  try {
    // 1. Contar vehículos ingresados hoy en la garita
    const visitorsResult = await db.query(
      "SELECT COUNT(*) FROM visitor_logs WHERE entry_time >= CURRENT_DATE"
    );

    // 2. Contar prestadores con antecedentes verificados
    const providersResult = await db.query(
      "SELECT COUNT(*) FROM providers WHERE verification_status = 'verified'"
    );

    // Devolvemos la respuesta en formato JSON
    res.json({
      success: true,
      stats: {
        visitorsToday: parseInt(visitorsResult.rows[0].count),
        activeProviders: parseInt(providersResult.rows[0].count),
        expensesSynced: "94%",
        activeAlerts: 0
      }
    });
  } catch (err) {
    console.error("Error al obtener estadísticas de admin:", err);
    res.status(500).json({ success: false, error: "Error al obtener estadísticas operativas" });
  }
};

module.exports = {
  getAdminStats
};