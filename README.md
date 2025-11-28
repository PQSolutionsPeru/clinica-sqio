# SQIO - Sistema de Quirófanos Inteligente y Operativo

Sistema web profesional para la gestión y coordinación de salas quirúrgicas en entornos hospitalarios.

## 🏥 Descripción

SQIO es una plataforma moderna que permite a los médicos gestionar reservas de salas de operaciones de manera eficiente, con soporte para diferentes tipos de cirugías y resolución inteligente de conflictos.

## ✨ Características Principales

- **Autenticación JWT** - Sistema seguro de login para médicos
- **Dashboard en Tiempo Real** - Visualización del estado de salas quirúrgicas
- **Sistema de Reservas** - Creación y gestión de reservas de salas
- **Priorización Inteligente** - Soporte para cirugías electivas, urgencias y emergencias
- **Gestión de Conflictos** - Sistema de coordinación cuando múltiples médicos necesitan la misma sala
- **Validación en Tiempo Real** - Verificación automática de disponibilidad
- **Diseño Responsivo** - Interfaz adaptable a dispositivos móviles y desktop

## 🛠️ Tecnologías

### Backend
- Node.js 20.x
- Express.js 4.18
- SQLite3
- JWT para autenticación
- bcryptjs para encriptación

### Frontend
- React 18
- Vite 5.0
- Tailwind CSS 3.3
- Axios para peticiones HTTP
- React Router para navegación
- Lucide React para iconos

## 📦 Instalación

### Prerrequisitos
- Node.js 20.x o superior
- npm 9.x o superior

### Backend

```bash
cd backend
npm install
npm run seed  # Inicializar base de datos con datos de prueba
npm start     # Iniciar servidor en puerto 3001
```

### Frontend

```bash
cd frontend
npm install
npm run dev   # Iniciar servidor de desarrollo en puerto 5173
```

## 🚀 Uso

1. Acceder a `http://localhost:5173`
2. Iniciar sesión con credenciales de prueba
3. Visualizar estado de salas en el dashboard
4. Crear nuevas reservas desde el botón "Reservar Sala"
5. Gestionar conflictos cuando aparezcan notificaciones

## 🏗️ Estructura del Proyecto

```
clinica-sqio/
├── backend/
│   ├── src/
│   │   ├── config/        # Configuración de base de datos
│   │   ├── middleware/    # Middleware de autenticación
│   │   ├── models/        # Modelos de datos (Sala, Reserva, Medico)
│   │   ├── routes/        # Rutas de la API
│   │   ├── seed.js        # Script de inicialización
│   │   └── server.js      # Servidor principal
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/    # Componentes React
    │   ├── services/      # Servicios API
    │   └── main.jsx       # Punto de entrada
    └── package.json
```

## 🔐 Seguridad

- Passwords hasheados con bcryptjs (salt rounds: 10)
- Autenticación basada en JWT
- Validación de datos en backend y frontend
- Protección de rutas con middleware de autenticación

## 📝 API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrar nuevo médico

### Salas
- `GET /api/salas` - Obtener todas las salas

### Reservas
- `GET /api/reservas` - Obtener reservas (con filtros opcionales)
- `POST /api/reservas` - Crear nueva reserva
- `POST /api/reservas/:id/cancelar` - Cancelar reserva
- `POST /api/reservas/:id/aceptar-conflicto` - Aceptar ceder reserva
- `POST /api/reservas/:id/rechazar-conflicto` - Rechazar conflicto
- `POST /api/reservas/verificar-disponibilidad` - Verificar disponibilidad

## 🎨 Sistema de Prioridades

1. **Emergencia** (Prioridad 3) - Cancela automáticamente reservas futuras
2. **Urgencia** (Prioridad 2) - Requiere aprobación del médico afectado
3. **Electiva** (Prioridad 1) - No puede desplazar otras reservas

## 📄 Licencia

MIT License - Ver archivo LICENSE para más detalles

## 👨‍💻 Desarrollo

Proyecto desarrollado como MVP para gestión hospitalaria moderna.
