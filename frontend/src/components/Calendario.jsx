import { useState, useEffect } from 'react';
import { getReservas } from '../services/api';
import { ArrowLeft, ChevronLeft, ChevronRight, Clock, User } from 'lucide-react';

export default function Calendario({ medico, onVolver }) {
  const [fechaActual, setFechaActual] = useState(new Date());
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [diaSeleccionado, setDiaSeleccionado] = useState(null);

  useEffect(() => {
    cargarReservasMes();
  }, [fechaActual]);

  const cargarReservasMes = async () => {
    try {
      setLoading(true);
      // Obtener todas las reservas del mes actual
      const year = fechaActual.getFullYear();
      const month = fechaActual.getMonth();

      // Cargar reservas de todo el mes
      const primerDia = new Date(year, month, 1);
      const ultimoDia = new Date(year, month + 1, 0);

      const todasReservas = [];
      for (let dia = primerDia.getDate(); dia <= ultimoDia.getDate(); dia++) {
        const fecha = new Date(year, month, dia);
        const fechaStr = fecha.toISOString().split('T')[0];

        const reservasDia = await getReservas({ fecha: fechaStr });
        todasReservas.push(...reservasDia.filter(r => r.estado !== 'cancelada'));
      }

      setReservas(todasReservas);
    } catch (error) {
      console.error('Error al cargar reservas:', error);
    } finally {
      setLoading(false);
    }
  };

  const mesAnterior = () => {
    setFechaActual(new Date(fechaActual.getFullYear(), fechaActual.getMonth() - 1, 1));
    setDiaSeleccionado(null);
  };

  const mesSiguiente = () => {
    setFechaActual(new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 1));
    setDiaSeleccionado(null);
  };

  const getDiasDelMes = () => {
    const year = fechaActual.getFullYear();
    const month = fechaActual.getMonth();

    const primerDia = new Date(year, month, 1);
    const ultimoDia = new Date(year, month + 1, 0);

    const diasAnteriores = primerDia.getDay();
    const diasMes = ultimoDia.getDate();

    const dias = [];

    // Días del mes anterior (grises)
    for (let i = diasAnteriores - 1; i >= 0; i--) {
      const fecha = new Date(year, month, -i);
      dias.push({ fecha, esDelMes: false });
    }

    // Días del mes actual
    for (let dia = 1; dia <= diasMes; dia++) {
      const fecha = new Date(year, month, dia);
      dias.push({ fecha, esDelMes: true });
    }

    // Completar la última semana si es necesario
    const diasRestantes = 7 - (dias.length % 7);
    if (diasRestantes < 7) {
      for (let i = 1; i <= diasRestantes; i++) {
        const fecha = new Date(year, month + 1, i);
        dias.push({ fecha, esDelMes: false });
      }
    }

    return dias;
  };

  const getReservasDia = (fecha) => {
    const fechaStr = fecha.toISOString().split('T')[0];
    return reservas.filter(r => r.fecha === fechaStr);
  };

  const formatearMes = () => {
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return `${meses[fechaActual.getMonth()]} ${fechaActual.getFullYear()}`;
  };

  const esHoy = (fecha) => {
    const hoy = new Date();
    return fecha.getDate() === hoy.getDate() &&
           fecha.getMonth() === hoy.getMonth() &&
           fecha.getFullYear() === hoy.getFullYear();
  };

  const reservasDelDia = diaSeleccionado ? getReservasDia(diaSeleccionado) : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={onVolver}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Calendario de Reservas</h1>
              <p className="text-sm text-gray-600">Vista general de todas las reservas</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Controles del calendario */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={mesAnterior}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold text-gray-800">{formatearMes()}</h2>
            <button
              onClick={mesSiguiente}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendario */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {/* Días de la semana */}
              <div className="grid grid-cols-7 bg-gray-50 border-b">
                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((dia) => (
                  <div key={dia} className="p-3 text-center text-sm font-semibold text-gray-600">
                    {dia}
                  </div>
                ))}
              </div>

              {/* Días del mes */}
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Cargando...</p>
                </div>
              ) : (
                <div className="grid grid-cols-7">
                  {getDiasDelMes().map((dia, index) => {
                    const reservasDia = getReservasDia(dia.fecha);
                    const esSeleccionado = diaSeleccionado &&
                      dia.fecha.toISOString().split('T')[0] === diaSeleccionado.toISOString().split('T')[0];

                    return (
                      <button
                        key={index}
                        onClick={() => dia.esDelMes && setDiaSeleccionado(dia.fecha)}
                        className={`min-h-[80px] p-2 border-r border-b text-left transition ${
                          !dia.esDelMes ? 'bg-gray-50 text-gray-400' :
                          esSeleccionado ? 'bg-teal-50 border-2 border-teal-500' :
                          esHoy(dia.fecha) ? 'bg-yellow-50' :
                          'hover:bg-gray-50'
                        }`}
                      >
                        <div className={`text-sm font-semibold mb-1 ${
                          esHoy(dia.fecha) ? 'text-teal-600' : ''
                        }`}>
                          {dia.fecha.getDate()}
                        </div>
                        {dia.esDelMes && reservasDia.length > 0 && (
                          <div className="space-y-1">
                            {reservasDia.slice(0, 2).map((reserva) => {
                              // Determinar estilo según estado
                              const esConflicto = reserva.estado_conflicto === 'requiere_decision';
                              const esPendiente = reserva.estado === 'pendiente_confirmacion';

                              let colorClass = '';
                              let borderClass = '';

                              if (esConflicto) {
                                // Conflicto: rojo claro con borde
                                colorClass = 'bg-red-200 text-red-900';
                                borderClass = 'border border-red-400';
                              } else if (esPendiente) {
                                // Pendiente: borde punteado azul
                                colorClass = 'bg-blue-100 text-blue-700';
                                borderClass = 'border border-dashed border-blue-400';
                              } else {
                                // Normal: colores por tipo
                                colorClass = reserva.tipo_cirugia === 'emergencia' ? 'bg-red-100 text-red-700' :
                                            reserva.tipo_cirugia === 'urgencia' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-teal-100 text-teal-700';
                              }

                              return (
                                <div
                                  key={reserva.id}
                                  className={`text-xs px-1 py-0.5 rounded truncate ${colorClass} ${borderClass}`}
                                >
                                  {reserva.hora_inicio} - S{reserva.sala_numero}
                                </div>
                              );
                            })}
                            {reservasDia.length > 2 && (
                              <div className="text-xs text-gray-500">
                                +{reservasDia.length - 2} más
                              </div>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Detalles del día seleccionado */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-4 sticky top-4">
              {diaSeleccionado ? (
                <>
                  <h3 className="text-lg font-bold text-gray-800 mb-4">
                    {diaSeleccionado.toLocaleDateString('es-ES', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long'
                    })}
                  </h3>
                  {reservasDelDia.length > 0 ? (
                    <div className="space-y-3">
                      {reservasDelDia.map((reserva) => (
                        <div
                          key={reserva.id}
                          className="border rounded-lg p-3"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <span className="font-semibold text-sm">
                              Sala {reserva.sala_numero} - {reserva.sala_nombre}
                            </span>
                            <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
                              reserva.tipo_cirugia === 'emergencia' ? 'bg-red-100 text-red-700' :
                              reserva.tipo_cirugia === 'urgencia' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-teal-100 text-teal-700'
                            }`}>
                              {reserva.tipo_cirugia.toUpperCase()}
                            </span>
                          </div>
                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {reserva.hora_inicio} - {reserva.hora_fin}
                            </div>
                            <div className="flex items-center">
                              <User className="w-4 h-4 mr-1" />
                              Dr. {reserva.medico_nombre} {reserva.medico_apellido}
                            </div>
                            <div className="text-xs mt-2">
                              Paciente: {reserva.paciente_nombre}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No hay reservas para este día</p>
                  )}
                </>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <p>Seleccione un día para ver los detalles de las reservas</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
