const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const moviesRoutes = require('./routes/movies');
const favoritesRoutes = require('./routes/favorites');
const subscriptionsRoutes = require('./routes/subscriptions');
const paymentsRoutes = require('./routes/payments');
const profilesRoutes = require('./routes/profiles');
const notificationsRoutes = require('./routes/subscriptions');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/movies', moviesRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/subscriptions', subscriptionsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/profiles', profilesRoutes);
app.use('/api/notifications', notificationsRoutes);
// Ruta de prueba
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Netflix Clone API funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada'
  });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════╗
║                                               ║
║   🎬 Netflix Clone API                        ║
║                                               ║
║   ✅ Servidor corriendo en puerto ${PORT}       ║
║   🌐 http://localhost:${PORT}                 ║
║   📚 API Docs: http://localhost:${PORT}/api   ║
║                                               ║
║   Base de datos: PostgreSQL                   ║
║   Triggers: ✅ Activados                      ║
║   Stored Procedures: ✅ Disponibles           ║
║   JSON Support: ✅ JSONB habilitado           ║
║                                               ║
╚═══════════════════════════════════════════════╝
  `);
});

module.exports = app;
