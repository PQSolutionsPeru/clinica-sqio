require('dotenv').config();
const db = require('./config/database');
const Medico = require('./models/medico');
const Sala = require('./models/sala');

console.log('🌱 Iniciando seed de base de datos...\n');

// Datos de salas
const salas = [
  {
    numero: '1',
    nombre: 'Sala 1 - Cirugía General',
    estado: 'disponible',
    capacidad: 1,
    equipamiento: 'Mesa quirúrgica, lámpara cialítica, monitor de signos vitales, electrobisturí'
  },
  {
    numero: '2',
    nombre: 'Sala 2 - Traumatología',
    estado: 'disponible',
    capacidad: 1,
    equipamiento: 'Mesa ortopédica, arco en C, taladro quirúrgico, sistema de tracción'
  },
  {
    numero: '3',
    nombre: 'Sala 3 - Neurocirugía',
    estado: 'disponible',
    capacidad: 1,
    equipamiento: 'Microscopio quirúrgico, neuronavegador, craneótomo, monitor multiparamétrico'
  },
  {
    numero: '4',
    nombre: 'Sala 4 - Cardiología',
    estado: 'disponible',
    capacidad: 1,
    equipamiento: 'Bypass cardiopulmonar, desfibrilador, ecocardiografía, bomba de infusión'
  }
];

// Datos de médicos
const medicos = [
  {
    nombre: 'Juan',
    apellido: 'Pérez',
    especialidad: 'Cirugía General',
    email: 'juan.perez@clinica.com',
    password: 'demo123',
    telefono: '+51 999 888 777'
  },
  {
    nombre: 'María',
    apellido: 'López',
    especialidad: 'Traumatología',
    email: 'maria.lopez@clinica.com',
    password: 'demo123',
    telefono: '+51 999 888 666'
  },
  {
    nombre: 'Carlos',
    apellido: 'Rodríguez',
    especialidad: 'Neurocirugía',
    email: 'carlos.rodriguez@clinica.com',
    password: 'demo123',
    telefono: '+51 999 888 555'
  }
];

// Función para insertar salas
function insertarSalas() {
  return new Promise((resolve, reject) => {
    let completed = 0;
    console.log('📍 Insertando salas...');

    salas.forEach((sala, index) => {
      Sala.create(sala, (err) => {
        if (err) {
          console.error(`❌ Error insertando sala ${sala.numero}:`, err.message);
        } else {
          console.log(`✅ Sala ${sala.numero} - ${sala.nombre}`);
        }

        completed++;
        if (completed === salas.length) {
          console.log('\n');
          resolve();
        }
      });
    });
  });
}

// Función para insertar médicos
function insertarMedicos() {
  return new Promise((resolve, reject) => {
    let completed = 0;
    console.log('👨‍⚕️ Insertando médicos...');

    medicos.forEach((medico, index) => {
      Medico.create(medico, (err) => {
        if (err) {
          console.error(`❌ Error insertando médico ${medico.nombre}:`, err.message);
        } else {
          console.log(`✅ Dr. ${medico.nombre} ${medico.apellido} - ${medico.especialidad}`);
        }

        completed++;
        if (completed === medicos.length) {
          console.log('\n');
          resolve();
        }
      });
    });
  });
}

// Ejecutar seed
async function runSeed() {
  try {
    await insertarSalas();
    await insertarMedicos();

    console.log('✅ Seed completado exitosamente!\n');
    console.log('📋 Credenciales de prueba:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    medicos.forEach(m => {
      console.log(`   Email: ${m.email}`);
      console.log(`   Password: ${m.password}`);
      console.log('   ─────────────────────────────────────');
    });
    console.log('\n');

    db.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en seed:', error);
    db.close();
    process.exit(1);
  }
}

runSeed();
