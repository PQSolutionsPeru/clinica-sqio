const db = require('../config/database');

class Sala {
  // Obtener todas las salas
  static getAll(callback) {
    db.all('SELECT * FROM salas ORDER BY numero', [], callback);
  }

  // Obtener sala por ID
  static getById(id, callback) {
    db.get('SELECT * FROM salas WHERE id = ?', [id], callback);
  }

  // Obtener salas disponibles en un horario específico
  static getDisponibles(fecha, horaInicio, duracion, callback) {
    const query = `
      SELECT s.* FROM salas s
      WHERE s.estado = 'disponible'
      AND s.id NOT IN (
        SELECT r.sala_id FROM reservas r
        WHERE r.fecha = ?
        AND r.estado != 'cancelada'
        AND (
          (r.hora_inicio <= ? AND r.hora_fin > ?) OR
          (r.hora_inicio < ? AND r.hora_fin >= ?)
        )
      )
    `;

    // Calcular hora fin
    const [horas, minutos] = horaInicio.split(':');
    const horaInicioDate = new Date(2000, 0, 1, parseInt(horas), parseInt(minutos));
    const horaFinDate = new Date(horaInicioDate.getTime() + duracion * 60000);
    const horaFin = `${String(horaFinDate.getHours()).padStart(2, '0')}:${String(horaFinDate.getMinutes()).padStart(2, '0')}`;

    db.all(query, [fecha, horaInicio, horaInicio, horaFin, horaFin], callback);
  }

  // Crear nueva sala
  static create(data, callback) {
    const { numero, nombre, estado, capacidad, equipamiento } = data;
    db.run(
      `INSERT INTO salas (numero, nombre, estado, capacidad, equipamiento)
       VALUES (?, ?, ?, ?, ?)`,
      [numero, nombre, estado || 'disponible', capacidad || 1, equipamiento],
      callback
    );
  }

  // Actualizar sala
  static update(id, data, callback) {
    const { nombre, estado, capacidad, equipamiento } = data;
    db.run(
      `UPDATE salas
       SET nombre = ?, estado = ?, capacidad = ?, equipamiento = ?
       WHERE id = ?`,
      [nombre, estado, capacidad, equipamiento, id],
      callback
    );
  }

  // Obtener reservas de una sala para una fecha
  static getReservas(salaId, fecha, callback) {
    const query = `
      SELECT r.*, m.nombre as medico_nombre, m.apellido as medico_apellido
      FROM reservas r
      JOIN medicos m ON r.medico_id = m.id
      WHERE r.sala_id = ? AND r.fecha = ? AND r.estado != 'cancelada'
      ORDER BY r.hora_inicio
    `;
    db.all(query, [salaId, fecha], callback);
  }
}

module.exports = Sala;
