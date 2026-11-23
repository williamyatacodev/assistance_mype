import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const punchSchema = z.object({
  type: z.enum(['entry', 'lunch_start', 'lunch_end', 'exit']),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verificar autenticación
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Validar body
    const body = await request.json();
    const validation = punchSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Datos inválidos', details: validation.error.flatten() }, { status: 400 });
    }

    const { type, lat, lng } = validation.data;

    // Verificar que el usuario es worker y está activo
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, status, branch_id, company_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 });
    }

    if (profile.role !== 'worker') {
      return NextResponse.json({ error: 'Solo trabajadores pueden marcar asistencia' }, { status: 403 });
    }

    if (profile.status !== 'active') {
      return NextResponse.json({ error: 'Usuario inactivo' }, { status: 403 });
    }

    if (!profile.branch_id) {
      return NextResponse.json({ error: 'No tienes sede asignada' }, { status: 400 });
    }

    // Obtener datos de la sede
    const { data: branch, error: branchError } = await supabase
      .from('branches')
      .select('id, name, lat, lng, radius_meters, is_active')
      .eq('id', profile.branch_id)
      .single();

    if (branchError || !branch || !branch.is_active) {
      return NextResponse.json({ error: 'Sede no encontrada o inactiva' }, { status: 404 });
    }

    // Calcular distancia (Haversine)
    const R = 6371000; // Radio de la Tierra en metros
    const phi1 = (lat * Math.PI) / 180;
    const phi2 = (branch.lat * Math.PI) / 180;
    const deltaPhi = ((branch.lat - lat) * Math.PI) / 180;
    const deltaLambda = ((branch.lng - lng) * Math.PI) / 180;

    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    const isOutside = distance > branch.radius_meters;

    // Validar secuencia de marcaciones (opcional: permitir cualquier orden pero advertir)
    const today = new Date().toISOString().split('T')[0];
    const { data: todayLogs } = await supabase
      .from('attendance_logs')
      .select('type')
      .eq('user_id', user.id)
      .gte('timestamp', today)
      .order('timestamp', { ascending: true });

    const sequence = ['entry', 'lunch_start', 'lunch_end', 'exit'];
    const lastType = todayLogs?.[todayLogs.length - 1]?.type;
    const expectedNext = lastType ? sequence[sequence.indexOf(lastType) + 1] : 'entry';

    // Solo advertir si no es la esperada, pero permitir (flexibilidad)
    const isOutOfSequence = lastType && type !== expectedNext;

    // Insertar log de asistencia
    const { data: log, error: insertError } = await supabase
      .from('attendance_logs')
      .insert({
        company_id: profile.company_id,
        user_id: user.id,
        type,
        timestamp: new Date().toISOString(),
        lat,
        lng,
        is_outside: isOutside,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error insertando attendance_log:', insertError);
      return NextResponse.json({ error: 'Error guardando marcación' }, { status: 500 });
    }

    // TODO: Enviar notificación a Admin si isOutside (Fase 2 - webhook/email)
    if (isOutside) {
      console.log(`⚠️ ALERTA: Usuario ${user.id} marcó ${type} FUERA DE SEDE (${Math.round(distance)}m > ${branch.radius_meters}m)`);
      // Aquí se integraría el webhook/email en Fase 2
    }

    return NextResponse.json({
      success: true,
      log: {
        id: log.id,
        type: log.type,
        timestamp: log.timestamp,
        is_outside: log.is_outside,
      },
      distance: Math.round(distance),
      radius: branch.radius_meters,
      isOutside,
      warning: isOutOfSequence ? `Secuencia esperada: ${expectedNext}` : undefined,
    });

  } catch (error) {
    console.error('Error en /api/attendance/punch:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}