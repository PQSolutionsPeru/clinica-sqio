# SQIO - Features & Process Documentation

## 📋 Table of Contents
- [Core Features](#core-features)
- [System Architecture](#system-architecture)
- [Process Flows](#process-flows)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)

## ✨ Core Features

### 1. Authentication System
- **JWT-based authentication** with secure token management
- **Password encryption** using bcryptjs (10 salt rounds)
- **Protected routes** with middleware validation
- **Session persistence** via localStorage
- **Automatic token refresh** on page reload

### 2. Operating Room Management
- **Real-time room status** display (Available, Occupied, Reserved)
- **Multi-room support** with customizable configurations
- **Room-specific equipment** tracking
- **Availability verification** before booking
- **Visual status indicators** with color coding

### 3. Reservation System
- **Priority-based scheduling** (Emergency > Urgency > Elective)
- **Real-time availability checking** with 500ms debounce
- **Automatic time calculation** for surgery duration
- **Patient information** capture (name, DNI)
- **Surgery type classification** (Emergency, Urgency, Elective)
- **Reservation cancellation** by the owning doctor
- **Past date/time prevention** validation

### 4. Conflict Resolution System
- **Automatic conflict detection** when urgencies overlap with electives
- **Visual conflict notifications** with orange indicators
- **Three-resolution options:**
  - Accept & Reschedule (cancel + create new reservation)
  - Accept (cancel current reservation)
  - Reject (deny the urgency request)
- **Pending status tracking** for urgency requests
- **Blue indicators** for pending confirmations
- **Emergency auto-cancellation** for future reservations only

### 5. Dashboard Features
- **Today's reservations** view for logged-in doctor
- **Personal schedule** management
- **Color-coded surgery types:**
  - Red: Emergency
  - Yellow: Urgency
  - Teal: Elective
  - Orange: Conflict
  - Blue: Pending
- **Quick action buttons** for reservation management
- **Responsive layout** for mobile and desktop

### 6. User Interface
- **Teal hospital theme** throughout the application
- **Responsive design** with Tailwind CSS
- **Loading states** with spinners
- **Error handling** with clear messages
- **Success feedback** with confirmations
- **Lucide icons** for visual clarity

## 🏗️ System Architecture

```mermaid
graph TB
    subgraph Frontend
        A[React 18 + Vite]
        B[Tailwind CSS]
        C[React Router]
        D[Axios API Client]
    end

    subgraph Backend
        E[Express.js Server]
        F[JWT Middleware]
        G[API Routes]
        H[Business Logic Models]
    end

    subgraph Database
        I[(SQLite3)]
        J[Medicos Table]
        K[Salas Table]
        L[Reservas Table]
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

## 🔄 Process Flows

### Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant DB

    User->>Frontend: Enter credentials
    Frontend->>API: POST /api/auth/login
    API->>DB: Verify credentials
    DB-->>API: User data
    API->>API: Generate JWT token
    API-->>Frontend: Return token + user info
    Frontend->>Frontend: Store in localStorage
    Frontend-->>User: Redirect to Dashboard
```

### Reservation Creation Flow

```mermaid
sequenceDiagram
    participant Doctor
    participant Frontend
    participant API
    participant DB

    Doctor->>Frontend: Select room, date, time
    Frontend->>Frontend: Debounce 500ms
    Frontend->>API: POST /api/reservas/verificar-disponibilidad
    API->>DB: Check conflicts
    DB-->>API: Availability status
    API-->>Frontend: Available/Unavailable + affected reservations

    alt Available
        Frontend->>Frontend: Enable confirm button
        Doctor->>Frontend: Click confirm
        Frontend->>API: POST /api/reservas
        API->>DB: Create reservation
        DB-->>API: Success
        API-->>Frontend: Confirmation
        Frontend-->>Doctor: Show success message
    else Unavailable
        Frontend->>Frontend: Disable button
        Frontend-->>Doctor: Show unavailability message
    end
```

### Conflict Resolution Flow (Urgency)

```mermaid
flowchart TD
    A[Doctor creates URGENCY] --> B{Check availability}
    B -->|Available| C[Create confirmed reservation]
    B -->|Conflict with ELECTIVE| D[Create pending reservation]
    D --> E[Mark existing reservation as CONFLICT]
    E --> F[Show orange notification to affected doctor]

    F --> G{Affected doctor decides}
    G -->|Accept & Reschedule| H[Cancel current + Open reservation form]
    G -->|Accept| I[Cancel current reservation]
    G -->|Reject| J[Cancel urgency request]

    H --> K[Confirm urgency reservation]
    I --> K
    J --> L[Return to pending pool]
    K --> M[Update dashboard for both doctors]
```

### Emergency Override Flow

```mermaid
flowchart TD
    A[Doctor creates EMERGENCY] --> B{Check room status}
    B -->|Currently in use| C[BLOCK - Cannot override active surgery]
    B -->|Reserved for future| D[Auto-cancel future reservations]
    B -->|Available| E[Create emergency reservation]

    D --> F[Notify affected doctors]
    E --> G[Mark as confirmed]
    F --> G
    G --> H[Update all dashboards]
    C --> I[Show error message]
```

### Priority System

```mermaid
graph LR
    A[Surgery Types] --> B[Emergency - Priority 3]
    A --> C[Urgency - Priority 2]
    A --> D[Elective - Priority 1]

    B -->|Can override| C
    B -->|Can override| D
    C -->|Requires approval| D
    D -->|Cannot override| C
    D -->|Cannot override| B

    style B fill:#ff6b6b
    style C fill:#ffd93d
    style D fill:#6bcf7f
```

### Real-time Validation Flow

```mermaid
sequenceDiagram
    participant Doctor
    participant Form
    participant Timer
    participant API

    Doctor->>Form: Select room
    Form->>Timer: Start 500ms countdown
    Doctor->>Form: Select date
    Form->>Timer: Restart 500ms countdown
    Doctor->>Form: Select time
    Form->>Timer: Restart 500ms countdown

    Timer->>Timer: 500ms elapsed
    Timer->>API: Verify availability
    API-->>Form: Availability result

    alt Available
        Form->>Form: Enable confirm button (Teal)
    else Unavailable
        Form->>Form: Disable button (Gray)
    end
```

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/login` | Login with email/password | ❌ |
| POST | `/api/auth/register` | Register new doctor | ❌ |

### Operating Rooms
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/salas` | Get all operating rooms | ✅ |

### Reservations
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/reservas` | Get reservations (with filters) | ✅ |
| POST | `/api/reservas` | Create new reservation | ✅ |
| POST | `/api/reservas/verificar-disponibilidad` | Check availability | ✅ |
| POST | `/api/reservas/:id/cancelar` | Cancel reservation | ✅ |
| POST | `/api/reservas/:id/aceptar-conflicto` | Accept conflict (cancel own) | ✅ |
| POST | `/api/reservas/:id/rechazar-conflicto` | Reject conflict | ✅ |

### Query Parameters
- `fecha` - Filter by date (YYYY-MM-DD)
- `sala_id` - Filter by room ID
- `medico_id` - Filter by doctor ID

## 🗄️ Database Schema

```mermaid
erDiagram
    MEDICOS ||--o{ RESERVAS : creates
    SALAS ||--o{ RESERVAS : has

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

### Table Details

#### `medicos`
- Stores doctor information
- Passwords hashed with bcryptjs
- Email is unique identifier

#### `salas`
- Operating room configurations
- Equipment specifications
- Room status (disponible, mantenimiento, etc.)

#### `reservas`
- Surgery reservations
- **Priority levels:**
  - `emergencia` (3): Highest priority
  - `urgencia` (2): Medium priority
  - `electiva` (1): Lowest priority
- **Status types:**
  - `confirmada`: Active reservation
  - `cancelada`: Cancelled
  - `pendiente_confirmacion`: Urgency waiting approval
- **Conflict fields:**
  - `estado_conflicto`: `requiere_decision` or `pendiente_aprobacion`
  - `reserva_conflicto_id`: Links to conflicting reservation

## 🔐 Security Features

1. **Password Security**
   - Bcrypt hashing with 10 salt rounds
   - Never stored in plain text
   - Secure comparison during login

2. **JWT Tokens**
   - Signed with secret key
   - Includes doctor ID and email
   - No expiration for MVP (add in production)

3. **Protected Routes**
   - Middleware validates JWT on every request
   - Unauthorized access returns 401
   - Token sent via Authorization header

4. **Input Validation**
   - Email format validation
   - Date/time validation (no past bookings)
   - Required field checks
   - SQL injection prevention via parameterized queries

5. **CORS Configuration**
   - Development: Permissive for localhost
   - Production: Restricted to specific domain

## 📱 Responsive Design

- **Mobile breakpoints** with Tailwind CSS
- **Collapsible navigation** on small screens
- **Touch-friendly buttons** with adequate spacing
- **Readable text** on all device sizes
- **Grid layouts** adapt to screen width

## 🎨 Color System

| Status | Color | Hex |
|--------|-------|-----|
| Available | Green | `#10b981` |
| Occupied | Red | `#ef4444` |
| Reserved | Yellow | `#f59e0b` |
| Conflict | Orange | `#f97316` |
| Pending | Blue | `#3b82f6` |
| Primary (Teal) | Teal | `#14b8a6` |
| Emergency | Red | `#dc2626` |
| Urgency | Yellow | `#eab308` |
| Elective | Teal | `#14b8a6` |

## 🚀 Future Enhancements (Premium Features)

- **Calendar View** - Monthly visual calendar (already implemented, currently hidden)
- **Email Notifications** - Automatic conflict alerts
- **Push Notifications** - Real-time updates
- **Reporting Dashboard** - Analytics and statistics
- **Multi-facility Support** - Multiple hospitals/clinics
- **Role-based Access** - Admin, Doctor, Nurse roles
- **Audit Logs** - Track all system changes
- **Export Functionality** - PDF/Excel reports

---

**Last Updated:** November 28, 2025
**Version:** 1.0.0 MVP
