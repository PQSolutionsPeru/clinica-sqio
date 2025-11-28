# 📋 PLAN DE PRUEBAS COMPLETO - SQIO MVP

## PASO 0: Iniciar Servidores (CMD de Windows, NO WSL)

```cmd
REM Terminal 1 - Backend
cd "E:\Freelancing\Freddy Alvarado - Contador HDD\Claude\clinica-sqio-clean\backend"
npm install
npm run seed
npm start

REM Terminal 2 - Frontend (en otra ventana CMD)
cd "E:\Freelancing\Freddy Alvarado - Contador HDD\Claude\clinica-sqio-clean\frontend"
npm install
npm run dev
```

**✅ Verificar:**
- Backend: "Servidor corriendo en http://localhost:3001"
- Frontend: "Local: http://localhost:5173"

---

## PRUEBA 1: Autenticación (3 min)

**Credenciales disponibles:**
- `juan.perez@clinica.com` / `demo123`
- `maria.lopez@clinica.com` / `demo123`
- `carlos.rodriguez@clinica.com` / `demo123`

### Pasos:
1. Abrir `http://localhost:5173`
2. Login con Juan Pérez
3. **✅ Verificar:** Redirige a Dashboard, muestra "Dr. Juan Pérez"
4. Recargar página (F5)
5. **✅ Verificar:** Sesión persiste, no pide login
6. Cerrar sesión
7. Intentar login con password incorrecta
8. **✅ Verificar:** Muestra error "Credenciales inválidas"

---

## PRUEBA 2: Dashboard - Vista de Salas (3 min)

Login como Juan Pérez.

**✅ Verificar estado de salas:**
- Se muestran 4 salas en grid:
  - **Sala 1 - Cirugía General**
  - **Sala 2 - Traumatología**
  - **Sala 3 - Neurocirugía**
  - **Sala 4 - Cardiología**
- Cada sala muestra:
  - Número grande en esquina derecha
  - Indicador de estado (círculo verde/rojo/amarillo)
  - Estado: "Disponible" / "En uso" / "Próxima reserva"

**✅ Verificar tema:**
- Logo SQIO: turquesa (no azul)
- Botón "Reservar Sala": turquesa

---

## PRUEBA 3: Agregar Cirugía - Proceso Completo (10 min)

### 3.1 Reserva Electiva Simple

1. Clic en **"Reservar Sala"** (botón turquesa)
2. **✅ Verificar:** Abre formulario con flecha ← para volver
3. Llenar formulario:
   - **Sala:** Sala 1 - Cirugía General
   - **Tipo:** Electiva (Programada) ← por defecto
   - **Fecha:** Mañana (seleccionar fecha futura)
   - **Hora inicio:** 10:00
   - **Duración:** 2 horas (120 minutos)
   - **Paciente:** Carlos Gomez
   - **DNI:** 12345678
   - **Notas:** Apendicectomía
4. **✅ Observar verificación automática:**
   - Aparece mensaje azul: "Verificando disponibilidad..."
   - Después de 500ms: Mensaje verde con borde: "Sala disponible"
   - Botón "Confirmar Reserva" se pone TURQUESA y habilitado
5. Clic en **"Confirmar Reserva"**
6. **✅ Verificar:** Mensaje verde "Reserva creada exitosamente"
7. **✅ Verificar:** Redirige automáticamente a Dashboard (después de 2 segundos)
8. **✅ Verificar:** Nueva reserva aparece en "Mis Reservas Hoy":
   - "Sala 1 - Sala 1 - Cirugía General"
   - Badge turquesa: "ELECTIVA"
   - Horario: "10:00 - 12:00"
   - "Paciente: Carlos Gomez"
   - Botón rojo "Cancelar"

### 3.2 Validación en Tiempo Real (Debounce)

1. Clic en "Reservar Sala"
2. Seleccionar: Sala 2, Fecha mañana, Hora 14:00
3. **✅ Observar comportamiento:**
   - Botón gris deshabilitado al principio
   - Mensaje azul "Verificando disponibilidad..." aparece
   - Esperar medio segundo (500ms)
   - Mensaje cambia a verde "Sala disponible"
   - Botón se pone turquesa
4. Cambiar hora a 15:00
5. **✅ Verificar:** Vuelve a mostrar "Verificando..." y repite proceso

### 3.3 Cálculo Automático de Hora Fin

1. En formulario, seleccionar:
   - Hora inicio: 08:00
   - Duración: 3 horas
2. **✅ Verificar:** Campo "Hora Estimada de Fin" muestra "11:00"
3. Cambiar duración a 5 horas
4. **✅ Verificar:** Ahora muestra "13:00"

### 3.4 Prevención de Fechas Pasadas

1. En campo "Fecha"
2. **✅ Verificar:** No permite seleccionar fechas pasadas (atributo `min`)
3. Intentar manualmente con DevTools
4. **✅ Verificar:** Backend rechaza si se intenta

---

## PRUEBA 4: Sistema de Priorización y Conflictos (12 min)

### 4.1 Crear Conflicto: Urgencia vs Electiva

**Paso 1: Juan crea Electiva**
1. Login como `juan.perez@clinica.com`
2. Crear reserva ELECTIVA:
   - Sala 3 - Neurocirugía
   - Mañana, 10:00, 2 horas
   - Paciente: "Ana Torres"
3. **✅ Verificar:** Aparece en Dashboard con badge turquesa "ELECTIVA"

**Paso 2: María intenta Urgencia en mismo horario**
4. Cerrar sesión
5. Login como `maria.lopez@clinica.com`
6. Crear reserva URGENCIA:
   - Sala 3 - Neurocirugía
   - Mañana, 10:00, 2 horas
   - Paciente: "Luis Rojas"
7. **✅ Observar:** Sistema permite crear (mensaje verde)
8. **✅ Verificar en Dashboard de María:**
   - Reserva aparece con fondo AZUL
   - Badge amarillo: "URGENCIA"
   - Mensaje: "⏳ En espera de confirmación"
   - Texto: "Su URGENCIA está pendiente. El doctor con la reserva existente debe aceptar ceder su horario."

**Paso 3: Juan ve el conflicto**
9. Cerrar sesión
10. Login como `juan.perez@clinica.com`
11. **✅ Verificar en Dashboard:**
    - Su reserva electiva tiene fondo NARANJA
    - Border grueso naranja a la izquierda
    - Mensaje: "⚠️ Conflicto: Otro doctor solicita URGENCIA en este horario"
    - Pregunta: "¿Acepta ceder su reserva para la urgencia?"
    - **3 botones:**
      - Turquesa: "Aceptar y Reprogramar"
      - Verde: "Aceptar"
      - Rojo: "Rechazar"

### 4.2 Resolver Conflicto: Opción "Rechazar"

1. Clic en botón rojo **"Rechazar"**
2. Confirmar en diálogo
3. **✅ Verificar:**
   - Alert: "Ha mantenido su reserva. La urgencia ha sido rechazada."
   - Reserva de Juan vuelve a estado normal (sin naranja)
4. Logout, login como María
5. **✅ Verificar:** Su urgencia ya no aparece (fue cancelada)

### 4.3 Resolver Conflicto: Opción "Aceptar"

1. Crear conflicto nuevamente (repetir paso 4.1)
2. Login como Juan (quien tiene el conflicto)
3. Clic en botón verde **"Aceptar"**
4. Confirmar
5. **✅ Verificar:**
   - Alert: "Ha aceptado ceder su reserva. La urgencia ha sido confirmada."
   - Reserva de Juan desaparece del dashboard
6. Logout, login como María
7. **✅ Verificar:**
   - Reserva de urgencia ahora sin fondo azul (confirmada)
   - Badge amarillo "URGENCIA" permanece

### 4.4 Resolver Conflicto: Opción "Aceptar y Reprogramar"

1. Crear conflicto nuevamente
2. Login como Juan
3. Clic en botón turquesa **"Aceptar y Reprogramar"**
4. Confirmar
5. **✅ Verificar:**
   - Urgencia de María se confirma
   - Juan es redirigido automáticamente al formulario "Reservar Sala"
   - Puede crear nueva reserva en otro horario

### 4.5 Emergencia Cancela Automáticamente

1. Login como Carlos
2. Crear reserva EMERGENCIA:
   - Sala 4 - Cardiología
   - Mañana, cualquier hora
   - Paciente: "Pedro Mendoza"
3. **✅ Verificar:**
   - Si había reservas futuras en ese horario: se cancelan automáticamente
   - Emergencia aparece con badge rojo "EMERGENCIA"
   - Estado: Confirmada (no requiere aprobación)

---

## PRUEBA 5: Cancelación de Reservas (2 min)

1. Login con cualquier médico que tenga reservas
2. En una reserva SIN conflicto, clic en botón rojo **"Cancelar"**
3. Confirmar en diálogo
4. **✅ Verificar:**
   - Alert: "Reserva cancelada exitosamente"
   - Reserva desaparece del dashboard
   - Sala vuelve a estado "Disponible"

---

## PRUEBA 6: Verificación Visual del Tema (2 min)

**✅ Elementos en TURQUESA (no azul):**
- Login: fondo degradado turquesa
- Logo SQIO: ícono turquesa en círculo turquesa claro
- Botón "Reservar Sala": turquesa
- Botón "Confirmar Reserva" (cuando habilitado): turquesa
- Badge "ELECTIVA": fondo turquesa claro, texto turquesa oscuro
- Botón "Aceptar y Reprogramar": turquesa
- Spinner de carga: borde turquesa
- Focus rings en inputs: turquesa

**✅ Otros colores correctos:**
- Emergencia: Rojo (#dc2626)
- Urgencia: Amarillo (#eab308)
- Conflicto: Naranja (fondo #fef3c7, border #f97316)
- Pendiente: Azul (fondo #dbeafe, border #3b82f6)
- Verde para "disponible" y mensajes de éxito
- Rojo para "ocupada" y errores
- Amarillo para "reservada"

---

## PRUEBA 7: Diseño Responsivo (2 min)

1. F12 para abrir DevTools
2. Activar modo dispositivo (Ctrl+Shift+M)
3. Seleccionar iPhone 12 Pro
4. **✅ Verificar:**
   - Texto "Cerrar Sesión" se oculta, solo ícono visible
   - Grid de salas se convierte en columna única
   - Botones siguen siendo táctiles
   - No hay scroll horizontal

---

## ✅ RESUMEN DE CUMPLIMIENTO CON REFERENCIAS DEL CLIENTE

### Problema definido
**Requerimiento:** "Cirugías no atendidas, deficiencia en programación"
- ✅ **RESUELTO:** Sistema valida disponibilidad, previene conflictos, prioriza emergencias

### Prototipo SQIO requerido
- ✅ Sistema integrado para gestionar salas y personal
- ✅ Información en tiempo real
- ✅ Alertas automáticas (notificaciones de conflicto)
- ✅ Motor de priorización (3 niveles)

### Módulos requeridos
- ✅ Programación inteligente (validación automática)
- ✅ Dashboard en tiempo real
- ✅ Protocolos digitales (formulario estructurado)
- ✅ Coordinación interáreas (sistema de conflictos)
- ✅ Motor de priorización
- ⚠️ Reportes y analíticas (NO en MVP - planificado para premium)

### Para la entrega de esta noche tienen:
1. ✅ Login funcional
2. ✅ Dashboard con estado de salas
3. ✅ Agregar cirugía completo
4. ✅ **BONUS:** Sistema de priorización
5. ✅ **BONUS:** Gestión de conflictos
6. ✅ **BONUS:** Tema profesional turquesa

---

## 🎯 CHECKLIST RÁPIDO PARA DEMOSTRACIÓN

### Configuración (5 min)
- [ ] Backend corriendo en puerto 3001
- [ ] Frontend corriendo en puerto 5173
- [ ] Base de datos inicializada (npm run seed)

### Demostración Básica (10 min)
- [ ] Login exitoso
- [ ] Dashboard muestra 4 salas
- [ ] Crear una reserva electiva
- [ ] Reserva aparece en dashboard
- [ ] Cancelar reserva

### Demostración Avanzada (15 min)
- [ ] Crear reserva con validación en tiempo real
- [ ] Crear conflicto (urgencia vs electiva)
- [ ] Mostrar notificación naranja de conflicto
- [ ] Resolver conflicto (cualquier opción)
- [ ] Crear emergencia (opcional)

### Verificación Visual
- [ ] Tema turquesa aplicado correctamente
- [ ] Colores de prioridad correctos (rojo, amarillo, turquesa)
- [ ] Diseño responsivo funciona

---

**El proyecto está MÁS QUE COMPLETO para la entrega de hoy. 🎉**
