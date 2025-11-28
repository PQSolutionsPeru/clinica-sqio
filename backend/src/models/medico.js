const db = require('../config/database');
const bcrypt = require('bcryptjs');

class Medico {
  // Obtener todos los médicos
  static getAll(callback) {
    db.all('SELECT id, nombre, apellido, especialidad, email, telefono FROM medicos', [], callback);
  }

  // Obtener médico por ID
  static getById(id, callback) {
    db.get(
      'SELECT id, nombre, apellido, especialidad, email, telefono FROM medicos WHERE id = ?',
      [id],
      callback
    );
  }

  // Obtener médico por email (para login)
  static getByEmail(email, callback) {
    db.get('SELECT * FROM medicos WHERE email = ?', [email], callback);
  }

  // Crear nuevo médico
  static async create(data, callback) {
    const { nombre, apellido, especialidad, email, password, telefono } = data;

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      db.run(
        `INSERT INTO medicos (nombre, apellido, especialidad, email, password, telefono)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [nombre, apellido, especialidad, email, hashedPassword, telefono],
        callback
      );
    } catch (error) {
      callback(error);
    }
  }

  // Verificar contraseña
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Obtener reservas de un médico
  static getReservas(medicoId, fecha, callback) {
    const query = `
      SELECT r.*, s.numero as sala_numero, s.nombre as sala_nombre
      FROM reservas r
      JOIN salas s ON r.sala_id = s.id
      WHERE r.medico_id = ? ${fecha ? 'AND r.fecha = ?' : ''} AND r.estado != 'cancelada'
      ORDER BY r.fecha DESC, r.hora_inicio
    `;
    const params = fecha ? [medicoId, fecha] : [medicoId];
    db.all(query, params, callback);
  }
}

module.exports = Medico;
