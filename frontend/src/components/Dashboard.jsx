import { useState, useEffect } from 'react';
import { getSalas, getReservas, cancelarReserva, aceptarConflicto, rechazarConflicto } from '../services/api';
import { Calendar, Clock, User, LogOut, Plus, X, AlertTriangle, Check } from 'lucide-react';
import { politicas } from '../data/politicas';

export default function Dashboard({ medico, onLogout, onReservar, onCalendario }) {
  const [reprogramando, setReprogramando] = useState(false);
  const [salas, setSalas] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fechaActual] = useState(new Date().toISOString().split('T')[0]);
  const [mostrarPoliticas, setMostrarPoliticas] = useState(false);

  useEffect(() => {
    cargarDatos();

    // Verificar si ya se mostraron las políticas en esta sesión
    const politicasVistas = sessionStorage.getItem('politicasVistas');
    if (!politicasVistas) {
      setMostrarPoliticas(true);
    }
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);

      // Si el usuario es paciente, filtrar solo sus cirugías por email
      const filtros = { fecha: fechaActual };
      if (medico.especialidad === 'Paciente') {
        filtros.paciente_email = medico.email;
      }

      const [salasData, reservasData] = await Promise.all([
        getSalas(),
        getReservas(filtros)
      ]);
      setSalas(salasData);
      setReservas(reservasData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelar = async (reservaId, salaNombre) => {
    if (!window.confirm(`¿Está seguro que desea cancelar la reserva en ${salaNombre}?`)) {
      return;
    }

    try {
      await cancelarReserva(reservaId, 'Cancelada por el médico');
      await cargarDatos();
      alert('Reserva cancelada exitosamente');
    } catch (error) {
      alert(error.response?.data?.error || 'Error al cancelar la reserva');
    }
  };

  const handleAceptarConflicto = async (reservaId, salaNombre) => {
    if (!window.confirm(`¿Acepta ceder su reserva en ${salaNombre} para la urgencia?`)) {
      return;
    }

    try {
      await aceptarConflicto(reservaId);
      await cargarDatos();
      alert('Ha aceptado ceder su reserva. La urgencia ha sido confirmada.');
    } catch (error) {
      alert(error.response?.data?.error || 'Error al aceptar conflicto');
    }
  };

  const handleRechazarConflicto = async (reservaId, salaNombre) => {
    if (!window.confirm(`¿Está seguro que desea mantener su reserva en ${salaNombre}? Se cancelará la urgencia solicitada.`)) {
      return;
    }

    try {
      await rechazarConflicto(reservaId);
      await cargarDatos();
      alert('Ha mantenido su reserva. La urgencia ha sido rechazada.');
    } catch (error) {
      alert(error.response?.data?.error || 'Error al rechazar conflicto');
    }
  };

  const handleAceptarYReprogramar = async (reservaId) => {
    if (!window.confirm('¿Acepta ceder su reserva y desea reprogramarla?')) {
      return;
    }

    try {
      await aceptarConflicto(reservaId);
      // Redirigir al formulario de reservar
      onReservar();
    } catch (error) {
      alert(error.response?.data?.error || 'Error al aceptar conflicto');
    }
  };

  const cerrarPoliticas = () => {
    sessionStorage.setItem('politicasVistas', 'true');
    setMostrarPoliticas(false);
  };

  const getEstadoSala = (salaId) => {
    const reservasSala = reservas.filter(r => r.sala_id === salaId && r.estado !== 'cancelada');
    if (reservasSala.length === 0) return { estado: 'disponible', reserva: null };

    const ahora = new Date();
    const horaActual = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;

    const reservaActiva = reservasSala.find(r => r.hora_inicio <= horaActual && r.hora_fin > horaActual);

    if (reservaActiva) {
      return { estado: 'ocupada', reserva: reservaActiva };
    }

    const proximaReserva = reservasSala.find(r => r.hora_inicio > horaActual);
    if (proximaReserva) {
      return { estado: 'reservada', reserva: proximaReserva };
    }

    return { estado: 'disponible', reserva: null };
  };

  const formatearFecha = (fecha) => {
    const opciones = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-ES', opciones);
  };

  const misReservasHoy = reservas.filter(r =>
    r.medico_id === medico.id && r.estado !== 'cancelada'
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="bg-teal-100 rounded-full p-2">
                <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">SQIO</h1>
                <p className="text-sm font-semibold text-gray-800">{medico.nombre} {medico.apellido}</p>
                <p className="text-xs text-gray-500">{medico.especialidad}</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Fecha actual y acciones */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-gray-700">
            <Calendar className="w-5 h-5" />
            <span className="font-medium capitalize">{formatearFecha(fechaActual)}</span>
          </div>
          <div className="flex items-center space-x-3">
            {/* Calendario deshabilitado para MVP - Feature premium */}
            {/* <button
              onClick={onCalendario}
              className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition"
            >
              <Calendar className="w-5 h-5" />
              <span className="hidden sm:inline">Ver Calendario</span>
            </button> */}
            {/* Solo mostrar botón Reservar si NO es paciente */}
            {medico.especialidad !== 'Paciente' && (
              <button
                onClick={onReservar}
                className="flex items-center space-x-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg transition"
              >
                <Plus className="w-5 h-5" />
                <span>Reservar Sala</span>
              </button>
            )}
          </div>
        </div>

        {/* Estado de salas */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Estado de Salas Quirúrgicas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {salas.map((sala) => {
              const { estado, reserva } = getEstadoSala(sala.id);
              const colorMap = {
                disponible: 'bg-green-50 border-green-200',
                ocupada: 'bg-red-50 border-red-200',
                reservada: 'bg-yellow-50 border-yellow-200'
              };
              const iconColorMap = {
                disponible: 'bg-green-100 text-green-600',
                ocupada: 'bg-red-100 text-red-600',
                reservada: 'bg-yellow-100 text-yellow-600'
              };

              return (
                <div key={sala.id} className={`${colorMap[estado]} border-2 rounded-lg p-4`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className={`${iconColorMap[estado]} rounded-full p-2`}>
                      <div className="w-3 h-3 rounded-full bg-current"></div>
                    </div>
                    <span className="text-2xl font-bold text-gray-400">{sala.numero}</span>
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-1">{sala.nombre}</h3>
                  {estado === 'disponible' && (
                    <p className="text-sm text-green-700 font-medium">Disponible</p>
                  )}
                  {estado === 'ocupada' && reserva && (
                    <div className="text-sm text-red-700">
                      <p className="font-medium">En uso</p>
                      <p className="flex items-center mt-1">
                        <Clock className="w-3 h-3 mr-1" />
                        {reserva.hora_inicio} - {reserva.hora_fin}
                      </p>
                      <p className="flex items-center mt-1">
                        <User className="w-3 h-3 mr-1" />
                        Dr. {reserva.medico_nombre} {reserva.medico_apellido}
                      </p>
                    </div>
                  )}
                  {estado === 'reservada' && reserva && (
                    <div className="text-sm text-yellow-700">
                      <p className="font-medium">Próxima reserva</p>
                      <p className="flex items-center mt-1">
                        <Clock className="w-3 h-3 mr-1" />
                        {reserva.hora_inicio}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Mis reservas hoy */}
        {misReservasHoy.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Mis Reservas Hoy</h2>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {misReservasHoy.map((reserva) => {
                // Determinar el color y estado visual
                const esConflicto = reserva.estado_conflicto === 'requiere_decision';
                const esPendiente = reserva.estado === 'pendiente_confirmacion';

                return (
                  <div
                    key={reserva.id}
                    className={`border-b last:border-b-0 p-4 ${
                      esConflicto ? 'bg-orange-50 border-l-4 border-orange-500' :
                      esPendiente ? 'bg-blue-50 border-l-4 border-blue-400' :
                      'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex flex-col space-y-3">
                      {/* Título y tipo */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-gray-800">
                            Sala {reserva.sala_numero} - {reserva.sala_nombre}
                          </span>
                          <span className={`px-2 py-1 text-xs font-semibold rounded ${
                            reserva.tipo_cirugia === 'emergencia' ? 'bg-red-100 text-red-700' :
                            reserva.tipo_cirugia === 'urgencia' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-teal-100 text-teal-700'
                          }`}>
                            {reserva.tipo_cirugia.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      {/* Horario y paciente */}
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {reserva.hora_inicio} - {reserva.hora_fin}
                        </span>
                        <span>Paciente: {reserva.paciente_nombre}</span>
                      </div>

                      {/* Mensaje de conflicto */}
                      {esConflicto && (
                        <div className="bg-orange-100 border border-orange-300 rounded-lg p-3">
                          <div className="flex items-start space-x-2">
                            <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-orange-800">
                                ⚠️ Conflicto: Otro doctor solicita URGENCIA en este horario
                              </p>
                              <p className="text-xs text-orange-700 mt-1">
                                ¿Acepta ceder su reserva para la urgencia?
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-3">
                            <button
                              onClick={() => handleAceptarYReprogramar(reserva.id)}
                              className="flex items-center space-x-1 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition text-sm font-medium"
                            >
                              <Check className="w-4 h-4" />
                              <span>Aceptar y Reprogramar</span>
                            </button>
                            <button
                              onClick={() => handleAceptarConflicto(reserva.id, `Sala ${reserva.sala_numero}`)}
                              className="flex items-center space-x-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition text-sm font-medium"
                            >
                              <Check className="w-4 h-4" />
                              <span>Aceptar</span>
                            </button>
                            <button
                              onClick={() => handleRechazarConflicto(reserva.id, `Sala ${reserva.sala_numero}`)}
                              className="flex items-center space-x-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition text-sm font-medium"
                            >
                              <X className="w-4 h-4" />
                              <span>Rechazar</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Mensaje pendiente */}
                      {esPendiente && (
                        <div className="bg-blue-100 border border-blue-300 rounded-lg p-3 flex items-start space-x-2">
                          <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-blue-800">
                              ⏳ En espera de confirmación
                            </p>
                            <p className="text-xs text-blue-700 mt-1">
                              Su URGENCIA está pendiente. El doctor con la reserva existente debe aceptar ceder su horario.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Botón cancelar normal */}
                      {!esConflicto && !esPendiente && (
                        <div className="flex justify-end">
                          <button
                            onClick={() => handleCancelar(reserva.id, `Sala ${reserva.sala_numero} - ${reserva.sala_nombre}`)}
                            className="flex items-center space-x-1 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition text-sm font-medium"
                          >
                            <X className="w-4 h-4" />
                            <span>Cancelar</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Modal de Políticas */}
      {mostrarPoliticas && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header del modal */}
            <div className="bg-teal-600 text-white p-6 rounded-t-lg">
              <h2 className="text-2xl font-bold">{politicas.titulo}</h2>
              <p className="text-teal-100 mt-2">{politicas.subtitulo}</p>
            </div>

            {/* Contenido del modal */}
            <div className="p-6 space-y-6">
              {/* Políticas Generales */}
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">{politicas.politicasGenerales.titulo}</h3>
                <div className="space-y-3 text-gray-700">
                  {politicas.politicasGenerales.secciones.map((seccion, index) => (
                    <p key={index} className="leading-relaxed">
                      <strong>{seccion.titulo}</strong> {seccion.contenido}
                    </p>
                  ))}
                </div>
              </div>

              {/* Políticas de Salas */}
              <div className="border-t pt-6">
                <h3 className="text-xl font-bold text-gray-800 mb-3">{politicas.politicasSalas.titulo}</h3>
                <div className="space-y-4 text-gray-700">
                  {politicas.politicasSalas.salas.map((sala, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-800 mb-2">
                        {sala.nombre}
                      </h4>
                      <p className="text-sm leading-relaxed">{sala.descripcion}</p>
                    </div>
                  ))}

                  {/* Sistema de Priorización */}
                  <div className="bg-teal-50 border border-teal-200 p-4 rounded-lg mt-4">
                    <h4 className="font-semibold text-teal-800 mb-2">{politicas.sistemaPriorizacion.titulo}</h4>
                    <ul className="text-sm space-y-1 text-teal-900">
                      {politicas.sistemaPriorizacion.niveles.map((nivel, index) => (
                        <li key={index}>
                          <strong className={nivel.color}>• {nivel.tipo}:</strong> {nivel.descripcion}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Advertencia Importante */}
                  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                    <h4 className="font-semibold text-yellow-800 mb-2">{politicas.advertenciaImportante.titulo}</h4>
                    <p className="text-sm text-yellow-900 leading-relaxed">
                      {politicas.advertenciaImportante.contenido}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer del modal */}
            <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-end">
              <button
                onClick={cerrarPoliticas}
                className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-3 rounded-lg transition duration-200"
              >
                {politicas.botonAceptar}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
