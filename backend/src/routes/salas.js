const express = require('express');
const Sala = require('../models/sala');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Obtener todas las salas
router.get('/', (req, res) => {
  Sala.getAll((err, salas) => {
    if (err) {
      return res.status(500).json({ error: 'Error al obtener salas' });
    }
    res.json(salas);
  });
});

// Obtener sala por ID con sus reservas del día
router.get('/:id', (req, res) => {
  const salaId = req.params.id;
  const fecha = req.query.fecha || new Date().toISOString().split('T')[0];

  Sala.getById(salaId, (err, sala) => {
    if (err) {
      return res.status(500).json({ error: 'Error al obtener sala' });
    }

    if (!sala) {
      return res.status(404).json({ error: 'Sala no encontrada' });
    }

    Sala.getReservas(salaId, fecha, (err, reservas) => {
      if (err) {
        return res.status(500).json({ error: 'Error al obtener reservas' });
      }

      res.json({ ...sala, reservas });
    });
  });
});

// Obtener salas disponibles
router.get('/disponibles/buscar', (req, res) => {
  const { fecha, hora_inicio, duracion } = req.query;

  if (!fecha || !hora_inicio || !duracion) {
    return res.status(400).json({
      error: 'Se requiere fecha, hora_inicio y duracion'
    });
  }

  Sala.getDisponibles(fecha, hora_inicio, parseInt(duracion), (err, salas) => {
    if (err) {
      return res.status(500).json({ error: 'Error al buscar salas disponibles' });
    }
    res.json(salas);
  });
});

module.exports = router;
