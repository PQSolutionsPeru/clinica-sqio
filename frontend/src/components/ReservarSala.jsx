import { useState, useEffect } from 'react';
import { getSalas, crearReserva, verificarDisponibilidad } from '../services/api';
import { ArrowLeft, AlertTriangle, CheckCircle, Clock, Info } from 'lucide-react';

export default function ReservarSala({ onVolver, onReservaCreada }) {
  const [salas, setSalas] = useState([]);
  const [formData, setFormData] = useState({
    sala_id: '',
    fecha: new Date().toISOString().split('T')[0],
    hora_inicio: '08:00',
    duracion_minutos: 120,
    paciente_nombre: '',
    paciente_dni: '',
    paciente_email: '',
    tipo_cirugia: 'electiva',
    notas: ''
  });
  const [verificacion, setVerificacion] = useState(null);
  const [verificando, setVerificando] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    cargarSalas();
  }, []);

  // Verificar disponibilidad automáticamente cuando cambian los campos clave
  useEffect(() => {
    const verificarAuto = async () => {
      // Solo verificar si tenemos los datos mínimos necesarios
      if (!formData.sala_id || !formData.fecha || !formData.hora_inicio) {
        setVerificacion(null);
        return;
      }

      try {
        setVerificando(true);
        setError('');
        const resultado = await verificarDisponibilidad({
          sala_id: parseInt(formData.sala_id),
          fecha: formData.fecha,
          hora_inicio: formData.hora_inicio,
          duracion_minutos: parseInt(formData.duracion_minutos),
          tipo_cirugia: formData.tipo_cirugia
        });
        setVerificacion(resultado);
      } catch (err) {
        setError(err.response?.data?.error || 'Error al verificar disponibilidad');
        setVerificacion(null);
      } finally {
        setVerificando(false);
      }
    };

    // Debounce para evitar muchas llamadas
    const timer = setTimeout(() => {
      verificarAuto();
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.sala_id, formData.fecha, formData.hora_inicio, formData.duracion_minutos, formData.tipo_cirugia]);

  const cargarSalas = async () => {
    try {
      const data = await getSalas();
      setSalas(data.filter(s => s.estado === 'disponible'));
    } catch (error) {
      console.error('Error al cargar salas:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!verificacion) {
      setError('Esperando verificación de disponibilidad...');
      return;
    }

    if (!verificacion.disponible && formData.tipo_cirugia !== 'emergencia') {
      setError('La sala no está disponible en ese horario');
      return;
    }

    try {
      setLoading(true);
      const resultado = await crearReserva({
        ...formData,
        sala_id: parseInt(formData.sala_id),
        duracion_minutos: parseInt(formData.duracion_minutos)
      });

      setSuccess(resultado.mensaje || 'Reserva creada exitosamente');
      setTimeout(() => {
        onReservaCreada();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear reserva');
    } finally {
      setLoading(false);
    }
  };

  const calcularHoraFin = () => {
    if (!formData.hora_inicio || !formData.duracion_minutos) return '';

    const [horas, minutos] = formData.hora_inicio.split(':').map(Number);
    const totalMinutos = horas * 60 + minutos + parseInt(formData.duracion_minutos);
    const horaFin = Math.floor(totalMinutos / 60);
    const minutosFin = totalMinutos % 60;

    return `${String(horaFin).padStart(2, '0')}:${String(minutosFin).padStart(2, '0')}`;
  };

  // Determinar si el botón debe estar habilitado
  const botonHabilitado = verificacion && verificacion.disponible && !loading && !verificando;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={onVolver}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Reservar Sala</h1>
              <p className="text-sm text-gray-600">Complete la información de la cirugía</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          {/* Mensajes */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-start">
              <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded flex items-start">
              <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {/* Indicador de verificación en tiempo real */}
          {verificando && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded flex items-start">
              <Info className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
              <span>Verificando disponibilidad...</span>
            </div>
          )}

          {/* Resultado de verificación */}
          {verificacion && !verificando && (
            <div className={`border-2 rounded-lg p-4 ${
              verificacion.disponible ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'
            }`}>
              <p className="font-semibold mb-2">{verificacion.mensaje}</p>
              {verificacion.override && (
                <p className="text-sm">Se cancelarán {verificacion.reservasAfectadas.length} reserva(s) existente(s)</p>
              )}
              {verificacion.requiereAprobacion && (
                <p className="text-sm font-medium">⚠️ Se notificará al coordinador para aprobación</p>
              )}
            </div>
          )}

          {/* Información de la sala */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sala <span className="text-red-500">*</span>
              </label>
              <select
                name="sala_id"
                value={formData.sala_id}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="">Seleccione una sala</option>
                {salas.map(sala => (
                  <option key={sala.id} value={sala.id}>
                    Sala {sala.numero} - {sala.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Cirugía <span className="text-red-500">*</span>
              </label>
              <select
                name="tipo_cirugia"
                value={formData.tipo_cirugia}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="electiva">Electiva (Programada)</option>
                <option value="urgencia">Urgencia (Requiere coordinación)</option>
                <option value="emergencia">Emergencia (Prioridad absoluta)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="fecha"
                value={formData.fecha}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hora de Inicio <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                name="hora_inicio"
                value={formData.hora_inicio}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duración (minutos) <span className="text-red-500">*</span>
              </label>
              <select
                name="duracion_minutos"
                value={formData.duracion_minutos}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="60">1 hora</option>
                <option value="90">1.5 horas</option>
                <option value="120">2 horas</option>
                <option value="150">2.5 horas</option>
                <option value="180">3 horas</option>
                <option value="240">4 horas</option>
                <option value="300">5 horas</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hora Estimada de Fin
              </label>
              <div className="flex items-center px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                <Clock className="w-5 h-5 text-gray-500 mr-2" />
                <span className="font-medium">{calcularHoraFin()}</span>
              </div>
            </div>
          </div>

          {/* Información del paciente */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Información del Paciente</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Paciente <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="paciente_nombre"
                  value={formData.paciente_nombre}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="Nombres y apellidos"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  DNI del Paciente
                </label>
                <input
                  type="text"
                  name="paciente_dni"
                  value={formData.paciente_dni}
                  onChange={handleChange}
                  maxLength="8"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="12345678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email del Paciente
                </label>
                <input
                  type="email"
                  name="paciente_email"
                  value={formData.paciente_email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="paciente@email.com"
                />
              </div>
            </div>
          </div>

          {/* Notas adicionales */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notas Adicionales
            </label>
            <textarea
              name="notas"
              value={formData.notas}
              onChange={handleChange}
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="Información adicional sobre la cirugía..."
            ></textarea>
          </div>

          {/* Botón de confirmar */}
          <div className="flex flex-col gap-4 pt-6 border-t">
            <button
              type="submit"
              disabled={!botonHabilitado}
              className={`w-full font-semibold py-3 px-6 rounded-lg transition duration-200 ${
                botonHabilitado
                  ? 'bg-teal-600 hover:bg-teal-700 text-white cursor-pointer'
                  : 'bg-gray-400 text-gray-200 cursor-not-allowed'
              }`}
            >
              {loading ? 'Creando reserva...' : verificando ? 'Verificando...' : 'Confirmar Reserva'}
            </button>
            {!botonHabilitado && !verificando && !loading && (
              <p className="text-sm text-gray-500 text-center">
                Complete sala, fecha y hora para verificar disponibilidad
              </p>
            )}
          </div>
        </form>
      </main>
    </div>
  );
}
