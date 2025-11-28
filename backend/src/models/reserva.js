const db = require('../config/database');

class Reserva {
  // Obtener todas las reservas (con filtros opcionales)
  static getAll(filters, callback) {
    let query = `
      SELECT r.*,
             s.numero as sala_numero, s.nombre as sala_nombre,
             m.nombre as medico_nombre, m.apellido as medico_apellido, m.especialidad
      FROM reservas r
      JOIN salas s ON r.sala_id = s.id
      JOIN medicos m ON r.medico_id = m.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.fecha) {
      query += ' AND r.fecha = ?';
      params.push(filters.fecha);
    }

    if (filters.medico_id) {
      query += ' AND r.medico_id = ?';
      params.push(filters.medico_id);
    }

    if (filters.sala_id) {
      query += ' AND r.sala_id = ?';
      params.push(filters.sala_id);
    }

    if (filters.estado) {
      query += ' AND r.estado = ?';
      params.push(filters.estado);
    }

    if (filters.paciente_email) {
      query += ' AND r.paciente_email = ?';
      params.push(filters.paciente_email);
    }

    query += ' ORDER BY r.fecha DESC, r.hora_inicio';

    db.all(query, params, callback);
  }

  // Obtener reserva por ID
  static getById(id, callback) {
    const query = `
      SELECT r.*,
             s.numero as sala_numero, s.nombre as sala_nombre,
             m.nombre as medico_nombre, m.apellido as medico_apellido
      FROM reservas r
      JOIN salas s ON r.sala_id = s.id
      JOIN medicos m ON r.medico_id = m.id
      WHERE r.id = ?
    `;
    db.get(query, [id], callback);
  }

  // Verificar disponibilidad con lógica de priorización
  static checkDisponibilidad(salaId, fecha, horaInicio, duracion, tipoCirugia, callback) {
    const [horas, minutos] = horaInicio.split(':');
    const horaInicioDate = new Date(2000, 0, 1, parseInt(horas), parseInt(minutos));
    const horaFinDate = new Date(horaInicioDate.getTime() + duracion * 60000);
    const horaFin = `${String(horaFinDate.getHours()).padStart(2, '0')}:${String(horaFinDate.getMinutes()).padStart(2, '0')}`;

    const query = `
      SELECT r.*, m.nombre, m.apellido
      FROM reservas r
      JOIN medicos m ON r.medico_id = m.id
      WHERE r.sala_id = ?
      AND r.fecha = ?
      AND r.estado != 'cancelada'
      AND (
        (r.hora_inicio <= ? AND r.hora_fin > ?) OR
        (r.hora_inicio < ? AND r.hora_fin >= ?) OR
        (r.hora_inicio >= ? AND r.hora_inicio < ?)
      )
    `;

    db.all(query, [salaId, fecha, horaInicio, horaInicio, horaFin, horaFin, horaInicio, horaFin], (err, reservas) => {
      if (err) return callback(err);

      // Lógica de priorización
      const prioridades = { emergencia: 3, urgencia: 2, electiva: 1 };
      const prioridadNueva = prioridades[tipoCirugia] || 1;

      // Verificar si alguna reserva está actualmente en uso
      const ahora = new Date();
      const horaActual = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;
      const reservasEnUso = reservas.filter(r => r.hora_inicio <= horaActual && r.hora_fin > horaActual);

      // Si es emergencia, puede hacer override SOLO si la sala NO está en uso actualmente
      if (tipoCirugia === 'emergencia') {
        // Si hay reservas en uso actual, NO se puede tomar ni en emergencia
        if (reservasEnUso.length > 0) {
          return callback(null, {
            disponible: false,
            override: false,
            reservasAfectadas: reservasEnUso,
            mensaje: 'EMERGENCIA: No se puede tomar una sala que está actualmente en uso. Solo el doctor que la está usando puede cancelarla.'
          });
        }

        // Si solo hay reservas futuras, sí se pueden cancelar
        return callback(null, {
          disponible: true,
          override: reservas.length > 0,
          reservasAfectadas: reservas,
          mensaje: reservas.length > 0
            ? 'EMERGENCIA: Se cancelarán automáticamente las reservas futuras'
            : 'Sala disponible para emergencia'
        });
      }

      // Si hay conflictos con reservas de mayor o igual prioridad
      const conflictos = reservas.filter(r => prioridades[r.tipo_cirugia] >= prioridadNueva);

      if (conflictos.length > 0) {
        return callback(null, {
          disponible: false,
          override: false,
          reservasAfectadas: conflictos,
          mensaje: `Conflicto con ${conflictos.length} reserva(s) de mayor o igual prioridad`
        });
      }

      // Si hay conflictos con reservas de menor prioridad
      if (reservas.length > 0) {
        return callback(null, {
          disponible: true,
          override: true,
          requiereAprobacion: tipoCirugia === 'urgencia',
          reservasAfectadas: reservas,
          mensaje: tipoCirugia === 'urgencia'
            ? 'URGENCIA: Requiere notificación a coordinador'
            : 'Se pueden reprogramar las reservas de menor prioridad'
        });
      }

      // Sin conflictos
      callback(null, {
        disponible: true,
        override: false,
        reservasAfectadas: [],
        mensaje: 'Sala disponible'
      });
    });
  }

  // Crear nueva reserva
  static create(data, callback) {
    const {
      sala_id,
      medico_id,
      fecha,
      hora_inicio,
      duracion_minutos,
      paciente_nombre,
      paciente_dni,
      paciente_email,
      tipo_cirugia,
      notas
    } = data;

    // Calcular hora_fin
    const [horas, minutos] = hora_inicio.split(':');
    const horaInicioDate = new Date(2000, 0, 1, parseInt(horas), parseInt(minutos));
    const horaFinDate = new Date(horaInicioDate.getTime() + duracion_minutos * 60000);
    const hora_fin = `${String(horaFinDate.getHours()).padStart(2, '0')}:${String(horaFinDate.getMinutes()).padStart(2, '0')}`;

    // Si es emergencia, cancelar reservas conflictivas automáticamente
    if (tipo_cirugia === 'emergencia') {
      this.checkDisponibilidad(sala_id, fecha, hora_inicio, duracion_minutos, tipo_cirugia, (err, disponibilidad) => {
        if (err) return callback(err);

        if (disponibilidad.override && disponibilidad.reservasAfectadas.length > 0) {
          // Cancelar reservas existentes
          const ids = disponibilidad.reservasAfectadas.map(r => r.id).join(',');
          db.run(
            `UPDATE reservas SET estado = 'cancelada', notas = 'Cancelada por emergencia' WHERE id IN (${ids})`,
            (err) => {
              if (err) return callback(err);
              // Crear nueva reserva
              this._insertReserva(sala_id, medico_id, fecha, hora_inicio, hora_fin, duracion_minutos, paciente_nombre, paciente_dni, paciente_email, tipo_cirugia, notas, callback);
            }
          );
        } else {
          this._insertReserva(sala_id, medico_id, fecha, hora_inicio, hora_fin, duracion_minutos, paciente_nombre, paciente_dni, paciente_email, tipo_cirugia, notas, callback);
        }
      });
    }
    // Si es urgencia, crear con estado pendiente y marcar conflicto
    else if (tipo_cirugia === 'urgencia') {
      this.checkDisponibilidad(sala_id, fecha, hora_inicio, duracion_minutos, tipo_cirugia, (err, disponibilidad) => {
        if (err) return callback(err);

        // Si hay conflicto con reservas de menor prioridad
        if (disponibilidad.override && disponibilidad.reservasAfectadas.length > 0) {
          // Crear reserva de urgencia con estado pendiente
          this._insertReservaConEstado(
            sala_id, medico_id, fecha, hora_inicio, hora_fin, duracion_minutos,
            paciente_nombre, paciente_dni, paciente_email, tipo_cirugia, notas,
            'pendiente_confirmacion', 'pendiente_aprobacion',
            (err) => {
              if (err) return callback(err);

              // Obtener el ID de la nueva reserva
              const nuevaReservaId = this.lastID;

              // Marcar las reservas existentes como en conflicto
              const ids = disponibilidad.reservasAfectadas.map(r => r.id);
              let completed = 0;
              ids.forEach(id => {
                db.run(
                  `UPDATE reservas SET estado_conflicto = 'requiere_decision', reserva_conflicto_id = ? WHERE id = ?`,
                  [nuevaReservaId, id],
                  () => {
                    completed++;
                    if (completed === ids.length) {
                      callback(null);
                    }
                  }
                );
              });
            }
          );
        } else {
          // Sin conflicto, crear normalmente
          this._insertReserva(sala_id, medico_id, fecha, hora_inicio, hora_fin, duracion_minutos, paciente_nombre, paciente_dni, paciente_email, tipo_cirugia, notas, callback);
        }
      });
    }
    // Electiva se crea normalmente
    else {
      this._insertReserva(sala_id, medico_id, fecha, hora_inicio, hora_fin, duracion_minutos, paciente_nombre, paciente_dni, paciente_email, tipo_cirugia, notas, callback);
    }
  }

  // Método auxiliar para insertar reserva
  static _insertReserva(sala_id, medico_id, fecha, hora_inicio, hora_fin, duracion_minutos, paciente_nombre, paciente_dni, paciente_email, tipo_cirugia, notas, callback) {
    db.run(
      `INSERT INTO reservas (sala_id, medico_id, fecha, hora_inicio, hora_fin, duracion_minutos, paciente_nombre, paciente_dni, paciente_email, tipo_cirugia, notas)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [sala_id, medico_id, fecha, hora_inicio, hora_fin, duracion_minutos, paciente_nombre, paciente_dni, paciente_email, tipo_cirugia, notas],
      callback
    );
  }

  // Actualizar estado de reserva
  static updateEstado(id, estado, callback) {
    db.run('UPDATE reservas SET estado = ? WHERE id = ?', [estado, id], callback);
  }

  // Método auxiliar para insertar reserva con estado personalizado
  static _insertReservaConEstado(sala_id, medico_id, fecha, hora_inicio, hora_fin, duracion_minutos, paciente_nombre, paciente_dni, paciente_email, tipo_cirugia, notas, estado, estado_conflicto, callback) {
    db.run(
      `INSERT INTO reservas (sala_id, medico_id, fecha, hora_inicio, hora_fin, duracion_minutos, paciente_nombre, paciente_dni, paciente_email, tipo_cirugia, notas, estado, estado_conflicto)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [sala_id, medico_id, fecha, hora_inicio, hora_fin, duracion_minutos, paciente_nombre, paciente_dni, paciente_email, tipo_cirugia, notas, estado, estado_conflicto],
      callback
    );
  }

  // Cancelar reserva
  static cancel(id, motivo, callback) {
    db.run(
      'UPDATE reservas SET estado = ?, notas = ? WHERE id = ?',
      ['cancelada', motivo, id],
      callback
    );
  }

  // Aceptar conflicto - el doctor acepta que su reserva sea cancelada
  static aceptarConflicto(reservaId, callback) {
    // Primero obtener la reserva para saber cuál es la reserva de urgencia
    this.getById(reservaId, (err, reserva) => {
      if (err) return callback(err);
      if (!reserva) return callback(new Error('Reserva no encontrada'));

      const reservaUrgenciaId = reserva.reserva_conflicto_id;

      // Cancelar la reserva actual
      db.run(
        'UPDATE reservas SET estado = ?, estado_conflicto = NULL, reserva_conflicto_id = NULL, notas = ? WHERE id = ?',
        ['cancelada', 'Cancelada - conflicto con urgencia aceptado', reservaId],
        (err) => {
          if (err) return callback(err);

          // Confirmar la reserva de urgencia
          db.run(
            'UPDATE reservas SET estado = ?, estado_conflicto = NULL WHERE id = ?',
            ['confirmada', reservaUrgenciaId],
            callback
          );
        }
      );
    });
  }

  // Rechazar conflicto - el doctor no acepta cancelar su reserva
  static rechazarConflicto(reservaId, callback) {
    // Primero obtener la reserva para saber cuál es la reserva de urgencia
    this.getById(reservaId, (err, reserva) => {
      if (err) return callback(err);
      if (!reserva) return callback(new Error('Reserva no encontrada'));

      const reservaUrgenciaId = reserva.reserva_conflicto_id;

      // Limpiar el estado de conflicto de la reserva actual
      db.run(
        'UPDATE reservas SET estado_conflicto = NULL, reserva_conflicto_id = NULL WHERE id = ?',
        [reservaId],
        (err) => {
          if (err) return callback(err);

          // Cancelar/rechazar la reserva de urgencia
          db.run(
            'UPDATE reservas SET estado = ?, estado_conflicto = NULL, notas = ? WHERE id = ?',
            ['cancelada', 'Rechazada - el doctor no aceptó ceder su reserva', reservaUrgenciaId],
            callback
          );
        }
      );
    });
  }
}

module.exports = Reserva;
