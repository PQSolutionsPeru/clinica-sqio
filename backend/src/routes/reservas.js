const express = require('express');
const Reserva = require('../models/reserva');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Obtener todas las reservas (con filtros)
router.get('/', (req, res) => {
  const filters = {
    fecha: req.query.fecha,
    medico_id: req.query.medico_id,
    sala_id: req.query.sala_id,
    estado: req.query.estado
  };

  Reserva.getAll(filters, (err, reservas) => {
    if (err) {
      return res.status(500).json({ error: 'Error al obtener reservas' });
    }
    res.json(reservas);
  });
});

// Obtener reserva por ID
router.get('/:id', (req, res) => {
  Reserva.getById(req.params.id, (err, reserva) => {
    if (err) {
      return res.status(500).json({ error: 'Error al obtener reserva' });
    }

    if (!reserva) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }

    res.json(reserva);
  });
});

// Verificar disponibilidad
router.post('/verificar-disponibilidad', (req, res) => {
  const { sala_id, fecha, hora_inicio, duracion_minutos, tipo_cirugia } = req.body;

  if (!sala_id || !fecha || !hora_inicio || !duracion_minutos || !tipo_cirugia) {
    return res.status(400).json({
      error: 'Se requieren todos los campos: sala_id, fecha, hora_inicio, duracion_minutos, tipo_cirugia'
    });
  }

  Reserva.checkDisponibilidad(sala_id, fecha, hora_inicio, duracion_minutos, tipo_cirugia, (err, resultado) => {
    if (err) {
      return res.status(500).json({ error: 'Error al verificar disponibilidad' });
    }
    res.json(resultado);
  });
});

// Crear nueva reserva
router.post('/', (req, res) => {
  const {
    sala_id,
    fecha,
    hora_inicio,
    duracion_minutos,
    paciente_nombre,
    paciente_dni,
    tipo_cirugia,
    notas
  } = req.body;

  // Validaciones
  if (!sala_id || !fecha || !hora_inicio || !duracion_minutos || !paciente_nombre || !tipo_cirugia) {
    return res.status(400).json({
      error: 'Faltan campos requeridos'
    });
  }

  if (!['electiva', 'urgencia', 'emergencia'].includes(tipo_cirugia)) {
    return res.status(400).json({
      error: 'tipo_cirugia debe ser: electiva, urgencia o emergencia'
    });
  }

  // Validar que no sea en el pasado
  const ahora = new Date();
  const fechaReserva = new Date(`${fecha}T${hora_inicio}:00`);

  if (fechaReserva < ahora) {
    return res.status(400).json({
      error: 'No se puede reservar en el pasado. Por favor seleccione una fecha y hora futura.'
    });
  }

  // Primero verificar disponibilidad
  Reserva.checkDisponibilidad(sala_id, fecha, hora_inicio, duracion_minutos, tipo_cirugia, (err, disponibilidad) => {
    if (err) {
      return res.status(500).json({ error: 'Error al verificar disponibilidad' });
    }

    if (!disponibilidad.disponible && tipo_cirugia !== 'emergencia') {
      return res.status(409).json({
        error: 'Sala no disponible en ese horario',
        detalles: disponibilidad
      });
    }

    // Crear reserva
    const reservaData = {
      sala_id,
      medico_id: req.medicoId,
      fecha,
      hora_inicio,
      duracion_minutos,
      paciente_nombre,
      paciente_dni,
      tipo_cirugia,
      notas
    };

    Reserva.create(reservaData, function (err) {
      if (err) {
        return res.status(500).json({ error: 'Error al crear reserva' });
      }

      // Obtener la reserva recién creada
      Reserva.getById(this.lastID, (err, reserva) => {
        if (err) {
          return res.status(500).json({ error: 'Reserva creada pero error al obtener detalles' });
        }

        res.status(201).json({
          mensaje: disponibilidad.mensaje,
          override: disponibilidad.override || false,
          requiereAprobacion: disponibilidad.requiereAprobacion || false,
          reserva
        });
      });
    });
  });
});

// Actualizar estado de reserva
router.patch('/:id', (req, res) => {
  const { estado } = req.body;

  if (!estado) {
    return res.status(400).json({ error: 'Se requiere el campo estado' });
  }

  if (!['confirmada', 'en_proceso', 'completada', 'cancelada'].includes(estado)) {
    return res.status(400).json({
      error: 'estado debe ser: confirmada, en_proceso, completada o cancelada'
    });
  }

  Reserva.updateEstado(req.params.id, estado, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Error al actualizar reserva' });
    }
    res.json({ mensaje: 'Reserva actualizada correctamente' });
  });
});

// Cancelar reserva
router.delete('/:id', (req, res) => {
  const motivo = req.body.motivo || 'Cancelada por el médico';

  // Primero verificar que la reserva pertenece al médico actual
  Reserva.getById(req.params.id, (err, reserva) => {
    if (err) {
      return res.status(500).json({ error: 'Error al obtener reserva' });
    }

    if (!reserva) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }

    // Verificar que el médico actual es el dueño de la reserva
    if (reserva.medico_id !== req.medicoId) {
      return res.status(403).json({ error: 'Solo puede cancelar sus propias reservas' });
    }

    // Cancelar la reserva
    Reserva.cancel(req.params.id, motivo, (err) => {
      if (err) {
        return res.status(500).json({ error: 'Error al cancelar reserva' });
      }
      res.json({ mensaje: 'Reserva cancelada correctamente' });
    });
  });
});

// Aceptar conflicto - el doctor acepta ceder su reserva
router.post('/:id/aceptar-conflicto', (req, res) => {
  // Verificar que la reserva pertenece al médico actual
  Reserva.getById(req.params.id, (err, reserva) => {
    if (err) {
      return res.status(500).json({ error: 'Error al obtener reserva' });
    }

    if (!reserva) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }

    if (reserva.medico_id !== req.medicoId) {
      return res.status(403).json({ error: 'Solo puede gestionar sus propias reservas' });
    }

    // Aceptar el conflicto
    Reserva.aceptarConflicto(req.params.id, (err) => {
      if (err) {
        return res.status(500).json({ error: 'Error al aceptar conflicto' });
      }
      res.json({ mensaje: 'Conflicto aceptado. Su reserva ha sido cancelada y la urgencia confirmada.' });
    });
  });
});

// Rechazar conflicto - el doctor no acepta ceder su reserva
router.post('/:id/rechazar-conflicto', (req, res) => {
  // Verificar que la reserva pertenece al médico actual
  Reserva.getById(req.params.id, (err, reserva) => {
    if (err) {
      return res.status(500).json({ error: 'Error al obtener reserva' });
    }

    if (!reserva) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }

    if (reserva.medico_id !== req.medicoId) {
      return res.status(403).json({ error: 'Solo puede gestionar sus propias reservas' });
    }

    // Rechazar el conflicto
    Reserva.rechazarConflicto(req.params.id, (err) => {
      if (err) {
        return res.status(500).json({ error: 'Error al rechazar conflicto' });
      }
      res.json({ mensaje: 'Conflicto rechazado. Su reserva se mantiene y la urgencia ha sido cancelada.' });
    });
  });
});

module.exports = router;
