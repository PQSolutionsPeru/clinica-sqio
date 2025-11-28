// Políticas de Uso - SQIO
// Este archivo contiene todo el texto de las políticas del sistema
// Puede editarse libremente sin modificar el código de la aplicación

export const politicas = {
  titulo: "Bienvenido a SQIO",
  subtitulo: "Sistema de Quirófanos Inteligente y Operativo",

  politicasGenerales: {
    titulo: "Políticas de Uso del Sistema",
    secciones: [
      {
        titulo: "Perfiles de Usuario:",
        contenido: "El sistema cuenta con tres tipos de cuentas: Administrativo (gestión completa del sistema), Doctor (creación y gestión de reservas), y Usuario (consulta de información). Actualmente usted está accediendo con perfil de Doctor."
      },
      {
        titulo: "Responsabilidad:",
        contenido: "Cada usuario es responsable de la veracidad y actualización de la información registrada. Las reservas confirmadas son vinculantes y deben respetarse salvo situaciones de emergencia."
      },
      {
        titulo: "Confidencialidad:",
        contenido: "La información de pacientes y reservas es estrictamente confidencial. No debe compartirse fuera del contexto médico autorizado."
      },
      {
        titulo: "Cancelaciones:",
        contenido: "Las cancelaciones deben realizarse con la mayor anticipación posible. Las cancelaciones de último momento afectan la eficiencia operativa de la clínica."
      }
    ]
  },

  politicasSalas: {
    titulo: "Políticas de Uso de Salas Quirúrgicas",
    salas: [
      {
        nombre: "Sala 1 - Cirugía General",
        descripcion: "Equipada con mesa quirúrgica, lámpara cialítica, monitor de signos vitales y electrobisturí. Prioridad para procedimientos de cirugía general. Capacidad para un equipo quirúrgico estándar."
      },
      {
        nombre: "Sala 2 - Traumatología",
        descripcion: "Equipada con mesa ortopédica, arco en C, taladro quirúrgico y sistema de tracción. Reservada preferentemente para procedimientos traumatológicos y ortopédicos que requieran equipamiento especializado."
      },
      {
        nombre: "Sala 3 - Neurocirugía",
        descripcion: "Equipada con microscopio quirúrgico, neuronavegador, craneótomo y monitor multiparamétrico. Uso exclusivo para procedimientos neuroquirúrgicos debido al equipamiento especializado de alto costo."
      },
      {
        nombre: "Sala 4 - Cardiología",
        descripcion: "Equipada con bypass cardiopulmonar, desfibrilador, ecocardiografía y bomba de infusión. Reservada para procedimientos cardiovasculares. Requiere personal especializado en cirugía cardíaca."
      }
    ]
  },

  sistemaPriorizacion: {
    titulo: "Sistema de Priorización",
    niveles: [
      {
        tipo: "Emergencia",
        color: "text-red-600",
        descripcion: "Máxima prioridad, puede cancelar reservas futuras automáticamente"
      },
      {
        tipo: "Urgencia",
        color: "text-yellow-600",
        descripcion: "Alta prioridad, requiere coordinación con el médico afectado"
      },
      {
        tipo: "Electiva",
        color: "text-teal-600",
        descripcion: "Programada, debe respetar reservas de mayor prioridad"
      }
    ]
  },

  advertenciaImportante: {
    titulo: "Importante",
    contenido: "El uso inadecuado de las salas, la falta de puntualidad, o el incumplimiento de estas políticas puede resultar en sanciones administrativas. En caso de emergencia real, el sistema priorizará automáticamente salvaguardando la vida del paciente."
  },

  botonAceptar: "He leído y acepto las políticas"
};
