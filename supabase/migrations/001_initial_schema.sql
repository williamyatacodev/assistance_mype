-- Migración inicial: Esquema completo para Sistema de Asistencia Perú
-- Tablas: profiles, branches, attendance_logs, corrections, holidays
-- RLS policies, triggers para integridad de datos

-- ============================================
-- EXTENSIONES
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- TABLA: branches (Sedes)
-- ============================================
CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    lat DECIMAL(10, 8) NOT NULL,
    lng DECIMAL(11, 8) NOT NULL,
    radius_meters INTEGER NOT NULL DEFAULT 100,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_branches_company_id ON branches(company_id);
CREATE INDEX idx_branches_is_active ON branches(is_active);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_branches_updated_at
    BEFORE UPDATE ON branches
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLA: profiles (Usuarios - extiende auth.users)
-- ============================================
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
    dni VARCHAR(8) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'worker')),
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    require_password_change BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_company_id ON profiles(company_id);
CREATE INDEX idx_profiles_branch_id ON profiles(branch_id);
CREATE INDEX idx_profiles_dni ON profiles(dni);
CREATE INDEX idx_profiles_role ON profiles(role);

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLA: attendance_logs (Registros de asistencia - INMUTABLE)
-- ============================================
CREATE TABLE attendance_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    type VARCHAR(20) NOT NULL CHECK (type IN ('entry', 'lunch_start', 'lunch_end', 'exit')),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    lat DECIMAL(10, 8) NOT NULL,
    lng DECIMAL(11, 8) NOT NULL,
    is_outside BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_attendance_logs_company_id ON attendance_logs(company_id);
CREATE INDEX idx_attendance_logs_user_id ON attendance_logs(user_id);
CREATE INDEX idx_attendance_logs_timestamp ON attendance_logs(timestamp DESC);
CREATE INDEX idx_attendance_logs_user_timestamp ON attendance_logs(user_id, timestamp DESC);
CREATE INDEX idx_attendance_logs_type ON attendance_logs(type);

-- ============================================
-- TRIGGERS DE INTEGRIDAD: attendance_logs SOLO INSERT
-- ============================================
-- Función para bloquear UPDATE y DELETE
CREATE OR REPLACE FUNCTION block_attendance_logs_modification()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        RAISE EXCEPTION 'attendance_logs es inmutable: no se permite UPDATE. Use tabla corrections para correcciones.';
    ELSIF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'attendance_logs es inmutable: no se permite DELETE.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER attendance_logs_immutable
    BEFORE UPDATE OR DELETE ON attendance_logs
    FOR EACH ROW
    EXECUTE FUNCTION block_attendance_logs_modification();

-- ============================================
-- TABLA: corrections (Correcciones de asistencia con auditoría)
-- ============================================
CREATE TABLE corrections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
    log_id UUID NOT NULL REFERENCES attendance_logs(id) ON DELETE RESTRICT,
    admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    new_timestamp TIMESTAMPTZ NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_corrections_company_id ON corrections(company_id);
CREATE INDEX idx_corrections_log_id ON corrections(log_id);
CREATE INDEX idx_corrections_admin_id ON corrections(admin_id);
CREATE INDEX idx_corrections_created_at ON corrections(created_at DESC);

CREATE TRIGGER update_corrections_updated_at
    BEFORE UPDATE ON corrections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLA: holidays (Feriados peruanos)
-- ============================================
CREATE TABLE holidays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL UNIQUE,
    description VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'national' CHECK (type IN ('national', 'regional', 'bridge')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_holidays_date ON holidays(date);
CREATE INDEX idx_holidays_is_active ON holidays(is_active);

CREATE TRIGGER update_holidays_updated_at
    BEFORE UPDATE ON holidays
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE corrections ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS RLS: branches
-- ============================================
-- Admin ve todas las sedes de su empresa
CREATE POLICY "Admin puede ver todas las sedes de su empresa"
    ON branches FOR SELECT
    USING (
        company_id = (
            SELECT company_id FROM profiles WHERE id = auth.uid()
        )
        AND (
            SELECT role FROM profiles WHERE id = auth.uid()
        ) = 'admin'
    );

-- Worker ve solo su sede asignada
CREATE POLICY "Worker ve su sede asignada"
    ON branches FOR SELECT
    USING (
        id = (
            SELECT branch_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Admin puede insertar/actualizar sedes
CREATE POLICY "Admin puede gestionar sedes"
    ON branches FOR ALL
    USING (
        company_id = (
            SELECT company_id FROM profiles WHERE id = auth.uid()
        )
        AND (
            SELECT role FROM profiles WHERE id = auth.uid()
        ) = 'admin'
    );

-- ============================================
-- POLÍTICAS RLS: profiles
-- ============================================
-- Usuario ve su propio perfil
CREATE POLICY "Usuario ve su propio perfil"
    ON profiles FOR SELECT
    USING (id = auth.uid());

-- Admin ve todos los perfiles de su empresa
CREATE POLICY "Admin ve perfiles de su empresa"
    ON profiles FOR SELECT
    USING (
        company_id = (
            SELECT company_id FROM profiles WHERE id = auth.uid()
        )
        AND (
            SELECT role FROM profiles WHERE id = auth.uid()
        ) = 'admin'
    );

-- Admin puede insertar/actualizar perfiles
CREATE POLICY "Admin gestiona perfiles"
    ON profiles FOR ALL
    USING (
        company_id = (
            SELECT company_id FROM profiles WHERE id = auth.uid()
        )
        AND (
            SELECT role FROM profiles WHERE id = auth.uid()
        ) = 'admin'
    );

-- ============================================
-- POLÍTICAS RLS: attendance_logs
-- ============================================
-- Worker ve solo sus propios logs
CREATE POLICY "Worker ve sus propios logs"
    ON attendance_logs FOR SELECT
    USING (user_id = auth.uid());

-- Admin ve todos los logs de su empresa
CREATE POLICY "Admin ve logs de su empresa"
    ON attendance_logs FOR SELECT
    USING (
        company_id = (
            SELECT company_id FROM profiles WHERE id = auth.uid()
        )
        AND (
            SELECT role FROM profiles WHERE id = auth.uid()
        ) = 'admin'
    );

-- Worker puede INSERTAR sus propios logs (marcación)
CREATE POLICY "Worker inserta sus marcaciones"
    ON attendance_logs FOR INSERT
    WITH CHECK (
        user_id = auth.uid()
        AND company_id = (
            SELECT company_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Admin puede INSERTAR logs (corrección manual si fuera necesario)
CREATE POLICY "Admin inserta logs"
    ON attendance_logs FOR INSERT
    WITH CHECK (
        company_id = (
            SELECT company_id FROM profiles WHERE id = auth.uid()
        )
        AND (
            SELECT role FROM profiles WHERE id = auth.uid()
        ) = 'admin'
    );

-- ============================================
-- POLÍTICAS RLS: corrections
-- ============================================
-- Admin ve todas las correcciones de su empresa
CREATE POLICY "Admin ve correcciones de su empresa"
    ON corrections FOR SELECT
    USING (
        company_id = (
            SELECT company_id FROM profiles WHERE id = auth.uid()
        )
        AND (
            SELECT role FROM profiles WHERE id = auth.uid()
        ) = 'admin'
    );

-- Worker ve solo correcciones de sus propios logs
CREATE POLICY "Worker ve correcciones de sus logs"
    ON corrections FOR SELECT
    USING (
        log_id IN (
            SELECT id FROM attendance_logs WHERE user_id = auth.uid()
        )
    );

-- Solo Admin puede crear correcciones
CREATE POLICY "Admin crea correcciones"
    ON corrections FOR INSERT
    WITH CHECK (
        company_id = (
            SELECT company_id FROM profiles WHERE id = auth.uid()
        )
        AND (
            SELECT role FROM profiles WHERE id = auth.uid()
        ) = 'admin'
        AND admin_id = auth.uid()
    );

-- Admin puede actualizar sus propias correcciones
CREATE POLICY "Admin actualiza sus correcciones"
    ON corrections FOR UPDATE
    USING (
        admin_id = auth.uid()
        AND (
            SELECT role FROM profiles WHERE id = auth.uid()
        ) = 'admin'
    );

-- ============================================
-- POLÍTICAS RLS: holidays
-- ============================================
-- Todos los usuarios autenticados ven feriados activos
CREATE POLICY "Usuarios ven feriados activos"
    ON holidays FOR SELECT
    USING (is_active = true AND auth.role() = 'authenticated');

-- Solo Admin gestiona feriados
CREATE POLICY "Admin gestiona feriados"
    ON holidays FOR ALL
    USING (
        (
            SELECT role FROM profiles WHERE id = auth.uid()
        ) = 'admin'
    );

-- ============================================
-- FUNCIÓN AUXILIAR: Haversine para geofencing
-- ============================================
CREATE OR REPLACE FUNCTION calculate_distance(
    lat1 DECIMAL, lng1 DECIMAL,
    lat2 DECIMAL, lng2 DECIMAL
)
RETURNS DECIMAL AS $$
DECLARE
    R DECIMAL := 6371000; -- Radio de la Tierra en metros
    phi1 DECIMAL := radians(lat1);
    phi2 DECIMAL := radians(lat2);
    delta_phi DECIMAL := radians(lat2 - lat1);
    delta_lambda DECIMAL := radians(lng2 - lng1);
    a DECIMAL;
    c DECIMAL;
BEGIN
    a := sin(delta_phi / 2) * sin(delta_phi / 2) +
         cos(phi1) * cos(phi2) *
         sin(delta_lambda / 2) * sin(delta_lambda / 2);
    c := 2 * atan2(sqrt(a), sqrt(1 - a));
    RETURN R * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- FUNCIÓN: Verificar si coordenadas están dentro de sede
-- ============================================
CREATE OR REPLACE FUNCTION is_within_branch_radius(
    p_user_id UUID,
    p_lat DECIMAL,
    p_lng DECIMAL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_branch_id UUID;
    v_branch_lat DECIMAL;
    v_branch_lng DECIMAL;
    v_radius INTEGER;
    v_distance DECIMAL;
BEGIN
    -- Obtener sede del usuario
    SELECT branch_id INTO v_branch_id FROM profiles WHERE id = p_user_id;
    
    IF v_branch_id IS NULL THEN
        RETURN false; -- Usuario sin sede asignada
    END IF;
    
    -- Obtener datos de la sede
    SELECT lat, lng, radius_meters 
    INTO v_branch_lat, v_branch_lng, v_radius
    FROM branches WHERE id = v_branch_id AND is_active = true;
    
    IF v_branch_lat IS NULL THEN
        RETURN false; -- Sede no encontrada o inactiva
    END IF;
    
    -- Calcular distancia
    v_distance := calculate_distance(p_lat, p_lng, v_branch_lat, v_branch_lng);
    
    RETURN v_distance <= v_radius;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCIÓN: Obtener logs consolidados con correcciones aplicadas
-- ============================================
CREATE OR REPLACE FUNCTION get_consolidated_attendance(
    p_user_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE (
    log_id UUID,
    original_timestamp TIMESTAMPTZ,
    effective_timestamp TIMESTAMPTZ,
    type VARCHAR,
    lat DECIMAL,
    lng DECIMAL,
    is_outside BOOLEAN,
    is_corrected BOOLEAN,
    correction_reason TEXT,
    correction_admin_id UUID
) AS $$
BEGIN
    RETURN QUERY
    WITH latest_corrections AS (
        SELECT DISTINCT ON (log_id)
            log_id,
            new_timestamp,
            reason,
            admin_id
        FROM corrections
        WHERE log_id IN (
            SELECT id FROM attendance_logs 
            WHERE user_id = p_user_id 
            AND timestamp::date BETWEEN p_start_date AND p_end_date
        )
        ORDER BY log_id, created_at DESC
    )
    SELECT 
        al.id AS log_id,
        al.timestamp AS original_timestamp,
        COALESCE(lc.new_timestamp, al.timestamp) AS effective_timestamp,
        al.type,
        al.lat,
        al.lng,
        al.is_outside,
        lc.new_timestamp IS NOT NULL AS is_corrected,
        lc.reason AS correction_reason,
        lc.admin_id AS correction_admin_id
    FROM attendance_logs al
    LEFT JOIN latest_corrections lc ON al.id = lc.log_id
    WHERE al.user_id = p_user_id
    AND al.timestamp::date BETWEEN p_start_date AND p_end_date
    ORDER BY al.timestamp;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;