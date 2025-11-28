import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para agregar token a todas las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('medico');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Auth
export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

// Salas
export const getSalas = async () => {
  const response = await api.get('/salas');
  return response.data;
};

export const getSala = async (id, fecha) => {
  const response = await api.get(`/salas/${id}`, { params: { fecha } });
  return response.data;
};

export const getSalasDisponibles = async (fecha, hora_inicio, duracion) => {
  const response = await api.get('/salas/disponibles/buscar', {
    params: { fecha, hora_inicio, duracion }
  });
  return response.data;
};

// Reservas
export const getReservas = async (filters = {}) => {
  const response = await api.get('/reservas', { params: filters });
  return response.data;
};

export const getReserva = async (id) => {
  const response = await api.get(`/reservas/${id}`);
  return response.data;
};

export const verificarDisponibilidad = async (data) => {
  const response = await api.post('/reservas/verificar-disponibilidad', data);
  return response.data;
};

export const crearReserva = async (data) => {
  const response = await api.post('/reservas', data);
  return response.data;
};

export const actualizarReserva = async (id, estado) => {
  const response = await api.patch(`/reservas/${id}`, { estado });
  return response.data;
};

export const cancelarReserva = async (id, motivo) => {
  const response = await api.delete(`/reservas/${id}`, { data: { motivo } });
  return response.data;
};

export const aceptarConflicto = async (id) => {
  const response = await api.post(`/reservas/${id}/aceptar-conflicto`);
  return response.data;
};

export const rechazarConflicto = async (id) => {
  const response = await api.post(`/reservas/${id}/rechazar-conflicto`);
  return response.data;
};

export default api;
