# SQIO - Características y Documentación de Procesos

## 📋 Tabla de Contenidos
- [Características Principales](#características-principales)
- [Arquitectura del Sistema](#arquitectura-del-sistema)
- [Flujos de Procesos](#flujos-de-procesos)
- [Endpoints de la API](#endpoints-de-la-api)
- [Esquema de Base de Datos](#esquema-de-base-de-datos)

## ✨ Características Principales

### 1. Sistema de Autenticación
- **Autenticación basada en JWT** con gestión segura de tokens
- **Encriptación de contraseñas** usando bcryptjs (10 salt rounds)
- **Rutas protegidas** con validación mediante middleware
- **Persistencia de sesión** vía localStorage
- **Actualización automática de tokens** al recargar la página

### 2. Gestión de Quirófanos
- **Estado en tiempo real** de las salas (Disponible, Ocupada, Reservada)
- **Soporte multi-sala** con configuraciones personalizables
- **Seguimiento de equipamiento** específico por sala
- **Verificación de disponibilidad** antes de reservar
- **Indicadores visuales de estado** con código de colores

### 3. Sistema de Reservas
- **Programación basada en prioridades** (Emergencia > Urgencia > Electiva)
- **Verificación de disponibilidad en tiempo real** con debounce de 500ms
- **Cálculo automático de tiempo** para la duración de cirugía
- **Captura de información del paciente** (nombre, DNI)
- **Clasificación de tipo de cirugía** (Emergencia, Urgencia, Electiva)
- **Cancelación de reservas** por el médico propietario
- **Prevención de fechas/horas pasadas** mediante validación

### 4. Sistema de Resolución de Conflictos
- **Detección automática de conflictos** cuando urgencias se superponen con electivas
- **Notificaciones visuales de conflicto** con indicadores naranjas
- **Tres opciones de resolución:**
  - Aceptar y Reprogramar (cancelar + crear nueva reserva)
  - Aceptar (cancelar reserva actual)
  - Rechazar (denegar la solicitud de urgencia)
- **Seguimiento de estado pendiente** para solicitudes de urgencia
- **Indicadores azules** para confirmaciones pendientes
- **Auto-cancelación de emergencias** solo para reservas futuras

### 5. Características del Dashboard
- **Vista de reservas de hoy** para el médico autenticado
- **Gestión de agenda personal**
- **Tipos de cirugía codificados por color:**
  - Rojo: Emergencia
  - Amarillo: Urgencia
  - Turquesa: Electiva
  - Naranja: Conflicto
  - Azul: Pendiente
- **Botones de acción rápida** para gestión de reservas
- **Diseño responsivo** para móvil y escritorio

### 6. Interfaz de Usuario
- **Tema turquesa hospitalario** en toda la aplicación
- **Diseño responsivo** con Tailwind CSS
- **Estados de carga** con spinners
- **Manejo de errores** con mensajes claros
- **Retroalimentación de éxito** con confirmaciones
- **Iconos Lucide** para claridad visual

## 🏗️ Arquitectura del Sistema

```mermaid
graph TB
    subgraph Frontend
        A[React 18 + Vite]
        B[Tailwind CSS]
        C[React Router]
        D[Cliente API Axios]
    end

    subgraph Backend
        E[Servidor Express.js]
        F[Middleware JWT]
        G[Rutas API]
        H[Modelos de Lógica de Negocio]
    end

    subgraph Base de Datos
        I[(SQLite3)]
        J[Tabla Medicos]
        K[Tabla Salas]
        L[Tabla Reservas]
    end

    A --> D
    B --> A
    C --> A
    D -->|HTTP/JSON| E
    E --> F
    F --> G
    G --> H
    H --> I
    I --> J
    I --> K
    I --> L
```

## 🔄 Flujos de Procesos

### Flujo de Autenticación

```mermaid
sequenceDiagram
    participant Usuario
    participant Frontend
    participant API
    participant BD

    Usuario->>Frontend: Ingresar credenciales
    Frontend->>API: POST /api/auth/login
    API->>BD: Verificar credenciales
    BD-->>API: Datos de usuario
    API->>API: Generar token JWT
    API-->>Frontend: Devolver token + info usuario
    Frontend->>Frontend: Guardar en localStorage
    Frontend-->>Usuario: Redirigir a Dashboard
```

### Flujo de Creación de Reserva

```mermaid
sequenceDiagram
    participant Doctor
    participant Frontend
    participant API
    participant BD

    Doctor->>Frontend: Seleccionar sala, fecha, hora
    Frontend->>Frontend: Debounce 500ms
    Frontend->>API: POST /api/reservas/verificar-disponibilidad
    API->>BD: Verificar conflictos
    BD-->>API: Estado de disponibilidad
    API-->>Frontend: Disponible/No disponible + reservas afectadas

    alt Disponible
        Frontend->>Frontend: Habilitar botón confirmar
        Doctor->>Frontend: Clic en confirmar
        Frontend->>API: POST /api/reservas
        API->>BD: Crear reserva
        BD-->>API: Éxito
        API-->>Frontend: Confirmación
        Frontend-->>Doctor: Mostrar mensaje de éxito
    else No disponible
        Frontend->>Frontend: Deshabilitar botón
        Frontend-->>Doctor: Mostrar mensaje de no disponibilidad
    end
```

### Flujo de Resolución de Conflictos (Urgencia)

```mermaid
flowchart TD
    A[Doctor crea URGENCIA] --> B{Verificar disponibilidad}
    B -->|Disponible| C[Crear reserva confirmada]
    B -->|Conflicto con ELECTIVA| D[Crear reserva pendiente]
    D --> E[Marcar reserva existente como CONFLICTO]
    E --> F[Mostrar notificación naranja al doctor afectado]

    F --> G{Doctor afectado decide}
    G -->|Aceptar y Reprogramar| H[Cancelar actual + Abrir formulario de reserva]
    G -->|Aceptar| I[Cancelar reserva actual]
    G -->|Rechazar| J[Cancelar solicitud de urgencia]

    H --> K[Confirmar reserva de urgencia]
    I --> K
    J --> L[Regresar a pool pendiente]
    K --> M[Actualizar dashboard de ambos doctores]
```

### Flujo de Anulación por Emergencia

```mermaid
flowchart TD
    A[Doctor crea EMERGENCIA] --> B{Verificar estado de sala}
    B -->|Actualmente en uso| C[BLOQUEAR - No puede anular cirugía activa]
    B -->|Reservada para futuro| D[Auto-cancelar reservas futuras]
    B -->|Disponible| E[Crear reserva de emergencia]

    D --> F[Notificar a doctores afectados]
    E --> G[Marcar como confirmada]
    F --> G
    G --> H[Actualizar todos los dashboards]
    C --> I[Mostrar mensaje de error]
```

### Sistema de Prioridades

```mermaid
graph LR
    A[Tipos de Cirugía] --> B[Emergencia - Prioridad 3]
    A --> C[Urgencia - Prioridad 2]
    A --> D[Electiva - Prioridad 1]

    B -->|Puede anular| C
    B -->|Puede anular| D
    C -->|Requiere aprobación| D
    D -->|No puede anular| C
    D -->|No puede anular| B

    style B fill:#ff6b6b
    style C fill:#ffd93d
    style D fill:#6bcf7f
```

### Flujo de Validación en Tiempo Real

```mermaid
sequenceDiagram
    participant Doctor
    participant Formulario
    participant Temporizador
    participant API

    Doctor->>Formulario: Seleccionar sala
    Formulario->>Temporizador: Iniciar cuenta 500ms
    Doctor->>Formulario: Seleccionar fecha
    Formulario->>Temporizador: Reiniciar cuenta 500ms
    Doctor->>Formulario: Seleccionar hora
    Formulario->>Temporizador: Reiniciar cuenta 500ms

    Temporizador->>Temporizador: 500ms transcurridos
    Temporizador->>API: Verificar disponibilidad
    API-->>Formulario: Resultado de disponibilidad

    alt Disponible
        Formulario->>Formulario: Habilitar botón confirmar (Turquesa)
    else No disponible
        Formulario->>Formulario: Deshabilitar botón (Gris)
    end
```

## 🔌 Endpoints de la API

### Autenticación
| Método | Endpoint | Descripción | Requiere Auth |
|--------|----------|-------------|---------------|
| POST | `/api/auth/login` | Login con email/contraseña | ❌ |
| POST | `/api/auth/register` | Registrar nuevo médico | ❌ |

### Quirófanos
| Método | Endpoint | Descripción | Requiere Auth |
|--------|----------|-------------|---------------|
| GET | `/api/salas` | Obtener todos los quirófanos | ✅ |

### Reservas
| Método | Endpoint | Descripción | Requiere Auth |
|--------|----------|-------------|---------------|
| GET | `/api/reservas` | Obtener reservas (con filtros) | ✅ |
| POST | `/api/reservas` | Crear nueva reserva | ✅ |
| POST | `/api/reservas/verificar-disponibilidad` | Verificar disponibilidad | ✅ |
| POST | `/api/reservas/:id/cancelar` | Cancelar reserva | ✅ |
| POST | `/api/reservas/:id/aceptar-conflicto` | Aceptar conflicto (cancelar propia) | ✅ |
| POST | `/api/reservas/:id/rechazar-conflicto` | Rechazar conflicto | ✅ |

### Parámetros de Consulta
- `fecha` - Filtrar por fecha (YYYY-MM-DD)
- `sala_id` - Filtrar por ID de sala
- `medico_id` - Filtrar por ID de médico

## 🗄️ Esquema de Base de Datos

```mermaid
erDiagram
    MEDICOS ||--o{ RESERVAS : crea
    SALAS ||--o{ RESERVAS : tiene

    MEDICOS {
        int id PK
        string email UK
        string password_hash
        string nombre
        string apellido
        string especialidad
        datetime created_at
    }

    SALAS {
        int id PK
        int numero UK
        string nombre
        string equipamiento
        string estado
    }

    RESERVAS {
        int id PK
        int sala_id FK
        int medico_id FK
        date fecha
        time hora_inicio
        time hora_fin
        int duracion_minutos
        string paciente_nombre
        string paciente_dni
        string tipo_cirugia
        string estado
        string estado_conflicto
        int reserva_conflicto_id FK
        text notas
        datetime created_at
    }
```

### Detalles de las Tablas

#### `medicos`
- Almacena información de doctores
- Contraseñas hasheadas con bcryptjs
- Email es identificador único

#### `salas`
- Configuraciones de quirófanos
- Especificaciones de equipamiento
- Estado de sala (disponible, mantenimiento, etc.)

#### `reservas`
- Reservas de cirugías
- **Niveles de prioridad:**
  - `emergencia` (3): Prioridad más alta
  - `urgencia` (2): Prioridad media
  - `electiva` (1): Prioridad más baja
- **Tipos de estado:**
  - `confirmada`: Reserva activa
  - `cancelada`: Cancelada
  - `pendiente_confirmacion`: Urgencia esperando aprobación
- **Campos de conflicto:**
  - `estado_conflicto`: `requiere_decision` o `pendiente_aprobacion`
  - `reserva_conflicto_id`: Enlaza con reserva en conflicto

## 🔐 Características de Seguridad

1. **Seguridad de Contraseñas**
   - Hashing con Bcrypt y 10 salt rounds
   - Nunca almacenadas en texto plano
   - Comparación segura durante el login

2. **Tokens JWT**
   - Firmados con clave secreta
   - Incluye ID y email del médico
   - Sin expiración para MVP (agregar en producción)

3. **Rutas Protegidas**
   - Middleware valida JWT en cada petición
   - Acceso no autorizado retorna 401
   - Token enviado vía header Authorization

4. **Validación de Entrada**
   - Validación de formato de email
   - Validación de fecha/hora (sin reservas pasadas)
   - Verificación de campos requeridos
   - Prevención de inyección SQL vía consultas parametrizadas

5. **Configuración CORS**
   - Desarrollo: Permisivo para localhost
   - Producción: Restringido a dominio específico

## 📱 Diseño Responsivo

- **Breakpoints móviles** con Tailwind CSS
- **Navegación colapsable** en pantallas pequeñas
- **Botones táctiles** con espaciado adecuado
- **Texto legible** en todos los tamaños de dispositivo
- **Layouts de grilla** se adaptan al ancho de pantalla

## 🎨 Sistema de Colores

| Estado | Color | Hex |
|--------|-------|-----|
| Disponible | Verde | `#10b981` |
| Ocupada | Rojo | `#ef4444` |
| Reservada | Amarillo | `#f59e0b` |
| Conflicto | Naranja | `#f97316` |
| Pendiente | Azul | `#3b82f6` |
| Primario (Turquesa) | Turquesa | `#14b8a6` |
| Emergencia | Rojo | `#dc2626` |
| Urgencia | Amarillo | `#eab308` |
| Electiva | Turquesa | `#14b8a6` |

## 🚀 Mejoras Futuras (Características Premium)

- **Vista de Calendario** - Calendario visual mensual (ya implementado, actualmente oculto)
- **Notificaciones por Email** - Alertas automáticas de conflictos
- **Notificaciones Push** - Actualizaciones en tiempo real
- **Dashboard de Reportes** - Analíticas y estadísticas
- **Soporte Multi-instalación** - Múltiples hospitales/clínicas
- **Acceso Basado en Roles** - Roles de Admin, Doctor, Enfermera
- **Logs de Auditoría** - Seguimiento de todos los cambios del sistema
- **Funcionalidad de Exportación** - Reportes en PDF/Excel

---

**Última Actualización:** 28 de Noviembre de 2025
**Versión:** 1.0.0 MVP
