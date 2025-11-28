require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./config/database');

// Importar rutas
const authRoutes = require('./routes/auth');
const salasRoutes = require('./routes/salas');
const reservasRoutes = require('./routes/reservas');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
// Logging de todas las peticiones en desarrollo
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url} - Origin: ${req.headers.origin || 'No origin'}`);
    next();
  });
}

// Configurar CORS - En desarrollo permite cualquier origen
if (process.env.NODE_ENV === 'production') {
  app.use(cors());
} else {
  // En desarrollo, configuración más permisiva
  app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
}
app.use(express.json());

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/salas', salasRoutes);
app.use('/api/reservas', reservasRoutes);

// Ruta de health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'SQIO Backend'
  });
});

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🏥 SQIO Backend corriendo en puerto ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 API disponible en http://localhost:${PORT}/api`);
});

// Manejo de cierre graceful
process.on('SIGINT', () => {
  console.log('\n🛑 Cerrando servidor...');
  db.close((err) => {
    if (err) {
      console.error('Error al cerrar base de datos:', err.message);
    } else {
      console.log('✅ Base de datos cerrada correctamente');
    }
    process.exit(0);
  });
});
