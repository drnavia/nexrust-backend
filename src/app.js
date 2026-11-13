// ==========================================
// UBICACIÓN: src/app.js
// DESCRIPCIÓN: Archivo Principal y Servidor Express del Backend de Nexrust
// ==========================================

const express = require('express');
const cors = require('cors');
require('dotenv').config();

// 1. Importación de enrutadores de los módulos principales
const authRoutes = require('./auth/auth.routes');                           // Autenticación y JWT
const providerRoutes = require('./providers/providers.routes');             // Módulo de Gestión de Prestadores
const accessPassRoutes = require('./access-passes/access-passes.routes');   // Módulo de Pases y Códigos QR
const visitorLogRoutes = require('./visitor-logs/visitor-logs.routes');     // Módulo de Control de Garita y Check-in/Check-out

const expenseRoutes = require('./expenses/expenses.routes');                 // Módulo de Expensas y Comprobantes de Pago
const ticketRoutes = require('./tickets/tickets.routes');                    // Módulo de Tickets / Reclamos
const reservationRoutes = require('./reservations/reservations.routes');     // Módulo de Amenities / Reservas
const securityAlertRoutes = require('./security-alerts/security-alerts.routes'); // Módulo de Alertas de Seguridad

const recurringAuthRoutes = require('./recurring-authorizations/recurring-authorizations.routes'); // Módulo de Autorizaciones Recurrentes
const eventRoutes = require('./events/events.routes');                       // Módulo de Eventos Masivos
const infractionRoutes = require('./infractions/infractions.routes');        // Módulo de Infracciones y Multas

const barrierDeviceRoutes = require('./barrier-devices/barrier-devices.routes'); // Módulo de Dispositivos IoT de Apertura de Barreras
const notificationRoutes = require('./notifications/notifications.routes');      // Módulo de Notificaciones Internas de Usuarios

const app = express();
const PORT = process.env.PORT || 4000;

// 2. Configuración de Middlewares globales
app.use(cors());
app.use(express.json());

// 3. Montaje de rutas modularizadas bajo el prefijo /api
app.use('/api/auth', authRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/passes', accessPassRoutes); // Corregido: Referencia directa a la variable importada
app.use('/api/visitor-logs', visitorLogRoutes);

app.use('/api/expenses', expenseRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/security-alerts', securityAlertRoutes);

app.use('/api/recurring-authorizations', recurringAuthRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/infractions', infractionRoutes);

app.use('/api/barrier-devices', barrierDeviceRoutes);
app.use('/api/notifications', notificationRoutes);

// 4. Ruta raíz de verificación de estado del servidor
app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: '🚀 API global de Nexrust operando con todos los módulos principales',
  });
});

// 5. Inicialización del servidor HTTP
app.listen(PORT, () => {
  console.log(`🔥 Servidor backend corriendo en el puerto ${PORT}`);
});