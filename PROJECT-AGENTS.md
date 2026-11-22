# Project-specific instructions: Sistema de Asistencia Perú (MVP)

## Product
- **Purpose**: Control de asistencia laboral inmutable para pequeñas empresas en Perú, alineado con la normativa de SUNAFIL.
- **Primary users**: 
    - **Administrador**: Gestión de personal, horarios y exportación de planillas legales.
    - **Trabajador**: Registro de jornada (entrada, refrigerio, salida) desde móvil con validación GPS.
- **Critical workflows**: 
    - Marcación de asistencia con captura de coordenadas y validación de "Sede vs. Campo".
    - Flujo de corrección de errores con registro de auditoría (no sobreescritura).
    - Generación de reportes mensuales de horas extra y tardanzas.
    - Primer inicio de sesión del Admin para cambio de clave temporal.

## Stack and architecture
- **Frontend**: **React (Next.js App Router)**. Optimizado para dispositivos móviles como PWA.
- **Backend/API**: **Node.js (Next.js API Routes)**. Maneja la lógica de negocio y validación de horas.
- **Database**: **Supabase (PostgreSQL)**. 
    - Auth: Manejo nativo de usuarios y sesiones.
    - Storage: Para guardar reportes generados si es necesario.
    - RLS (Row Level Security): Para asegurar que un trabajador solo vea sus marcaciones.
- **Infrastructure/deployment**: **Vercel**. Despliegue continuo y hosting de la API.
- **Important modules**:
    - `GeofencingService`: Valida si el trabajador está en el radio de la sede (Haversine formula).
    - `SunafilReporter`: Genera el archivo Excel con el formato legal peruano.

## Commands (must be verified)
- **Install**: `npm install`
- **Format/lint**: `npm run lint`
- **Typecheck**: `npm run typecheck`
- **Database**: `npx supabase db push` (para migraciones).
- **Local development**: `npm run dev`
- **Build**: `npm run build`

## Project-specific conventions
- **Naming**: Tablas de base de datos en `snake_case`. Variables en `camelCase`.
- **Integridad de Datos (Mandatorio)**:
    - Tabla `attendance_logs`: Solo permite `INSERT`. El `UPDATE` y `DELETE` están bloqueados por políticas de base de datos (Trigger/RLS).
    - Tabla `attendance_corrections`: Almacena correcciones manuales vinculadas a un log original.
- **Horarios**: Todas las fechas se guardan en UTC, pero se procesan en `America/Lima` para los reportes.
- **Error handling**: Uso de códigos de error HTTP estándar. Logs de errores críticos en la consola de Vercel.

## Constraints
- **Multi-tenancy**: Diseñado para soportar 50 usuarios inicialmente, pero con columna `company_id` para escalabilidad futura a múltiples empresas.
- **Sensitive data**: Las coordenadas GPS solo se capturan en el momento de la marcación.
- **First Admin**: El sistema se inicializa con un Admin semilla (seed script) con contraseña aleatoria definida en variables de entorno (`INITIAL_ADMIN_PASSWORD`). Es obligatorio el cambio de clave en el primer login (`require_password_change: true`).

## Database Schema (Minimalista)
1.  **profiles**: `id, dni, full_name, role (admin/worker), branch_id, status (active/inactive)`.
2.  **branches**: `id, name, lat, lng, radius_meters`.
3.  **attendance_logs**: `id, user_id, type (entry/lunch_start/lunch_end/exit), timestamp, lat, lng, is_outside (boolean)`.
4.  **corrections**: `id, log_id, admin_id, new_timestamp, reason`.
5.  **holidays**: `id, date, description` (alimentado de gob.pe).

## Definition of Done
- [ ] Login funcional y flujo de cambio de contraseña obligatoria para el Admin inicial.
- [ ] Marcación de asistencia captura GPS y bloquea/notifica si está fuera de rango.
- [ ] Base de datos configurada para impedir la edición de registros originales.
- [ ] Script o proceso de carga de feriados peruanos operativo.
- [ ] Exportación a Excel con columnas: DNI, Nombre, Entrada, Salida, Horas Extra, Tardanzas.
- [ ] Notificaciones automáticas (vía Webhook o Email) al Admin cuando alguien marca "Fuera de Sede".

---

