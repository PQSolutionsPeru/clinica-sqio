const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../database.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error conectando a la base de datos:', err.message);
  } else {
    console.log('Conectado a la base de datos SQLite');
  }
});

// Crear tablas si no existen
db.serialize(() => {
  // Tabla salas
  db.run(`
    CREATE TABLE IF NOT EXISTS salas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      numero TEXT NOT NULL UNIQUE,
      nombre TEXT NOT NULL,
      estado TEXT DEFAULT 'disponible',
      capacidad INTEGER DEFAULT 1,
      equipamiento TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabla medicos
  db.run(`
    CREATE TABLE IF NOT EXISTS medicos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      apellido TEXT NOT NULL,
      especialidad TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      telefono TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabla reservas
  db.run(`
    CREATE TABLE IF NOT EXISTS reservas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sala_id INTEGER NOT NULL,
      medico_id INTEGER NOT NULL,
      fecha DATE NOT NULL,
      hora_inicio TIME NOT NULL,
      hora_fin TIME NOT NULL,
      duracion_minutos INTEGER NOT NULL,
      paciente_nombre TEXT NOT NULL,
      paciente_dni TEXT,
      tipo_cirugia TEXT NOT NULL,
      estado TEXT DEFAULT 'confirmada',
      estado_conflicto TEXT,
      reserva_conflicto_id INTEGER,
      notas TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sala_id) REFERENCES salas(id),
      FOREIGN KEY (medico_id) REFERENCES medicos(id),
      FOREIGN KEY (reserva_conflicto_id) REFERENCES reservas(id)
    )
  `);

  // Agregar columnas para manejo de conflictos si no existen (migración)
  db.run(`
    ALTER TABLE reservas ADD COLUMN estado_conflicto TEXT
  `, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error agregando columna estado_conflicto:', err.message);
    }
  });

  db.run(`
    ALTER TABLE reservas ADD COLUMN reserva_conflicto_id INTEGER
  `, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error agregando columna reserva_conflicto_id:', err.message);
    }
  });

  // Agregar columna paciente_email para filtrar reservas por paciente
  db.run(`
    ALTER TABLE reservas ADD COLUMN paciente_email TEXT
  `, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error agregando columna paciente_email:', err.message);
    }
  });
});

module.exports = db;
