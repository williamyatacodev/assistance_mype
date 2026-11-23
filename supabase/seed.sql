-- Seed script para inicializar Admin semilla
-- Se ejecuta con: supabase db reset (incluye seed)
-- Requiere variables de entorno: INITIAL_ADMIN_EMAIL, INITIAL_ADMIN_PASSWORD, INITIAL_ADMIN_DNI, INITIAL_ADMIN_NAME

-- ============================================
-- EMPRESA POR DEFECTO (company_id fijo para MVP)
-- ============================================
INSERT INTO branches (id, company_id, name, address, lat, lng, radius_meters, is_active)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    'Sede Principal',
    'Av. Principal 123, Lima, Perú',
    -12.0464,  -- Latitud Lima
    -77.0428,  -- Longitud Lima
    100,       -- Radio 100 metros
    true
) ON CONFLICT (id) DO NOTHING;

-- ============================================
-- USUARIO ADMIN SEED
-- ============================================
-- Nota: El usuario se crea en auth.users via Supabase Auth API
-- Este seed solo crea el perfil vinculado
-- El script de setup inicial (setup-admin.ts) crea el usuario en Auth

-- Perfil de admin (se crea después de crear el usuario en Auth)
-- Los valores vienen de variables de entorno del script de setup

-- ============================================
-- FERIADOS PERUANOS 2024-2025 (base inicial)
-- ============================================
INSERT INTO holidays (date, description, type, is_active) VALUES
-- 2024
('2024-01-01', 'Año Nuevo', 'national', true),
('2024-03-28', 'Jueves Santo', 'national', true),
('2024-03-29', 'Viernes Santo', 'national', true),
('2024-05-01', 'Día del Trabajo', 'national', true),
('2024-06-29', 'San Pedro y San Pablo', 'national', true),
('2024-07-28', 'Fiestas Patrias - Día de la Independencia', 'national', true),
('2024-07-29', 'Fiestas Patrias - Día de las Fuerzas Armadas', 'national', true),
('2024-08-06', 'Batalla de Junín', 'national', true),
('2024-08-30', 'Santa Rosa de Lima', 'national', true),
('2024-10-08', 'Combate de Angamos', 'national', true),
('2024-11-01', 'Todos los Santos', 'national', true),
('2024-12-08', 'Inmaculada Concepción', 'national', true),
('2024-12-25', 'Navidad', 'national', true),
-- 2025
('2025-01-01', 'Año Nuevo', 'national', true),
('2025-04-17', 'Jueves Santo', 'national', true),
('2025-04-18', 'Viernes Santo', 'national', true),
('2025-05-01', 'Día del Trabajo', 'national', true),
('2025-06-29', 'San Pedro y San Pablo', 'national', true),
('2025-07-28', 'Fiestas Patrias - Día de la Independencia', 'national', true),
('2025-07-29', 'Fiestas Patrias - Día de las Fuerzas Armadas', 'national', true),
('2025-08-06', 'Batalla de Junín', 'national', true),
('2025-08-30', 'Santa Rosa de Lima', 'national', true),
('2025-10-08', 'Combate de Angamos', 'national', true),
('2025-11-01', 'Todos los Santos', 'national', true),
('2025-12-08', 'Inmaculada Concepción', 'national', true),
('2025-12-25', 'Navidad', 'national', true)
ON CONFLICT (date) DO UPDATE SET
    description = EXCLUDED.description,
    type = EXCLUDED.type,
    is_active = EXCLUDED.is_active;