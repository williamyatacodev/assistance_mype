'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

type PunchType = 'entry' | 'lunch_start' | 'lunch_end' | 'exit';

interface PunchRecord {
  type: PunchType;
  timestamp: string;
  is_outside: boolean;
}

const PUNCH_LABELS: Record<PunchType, string> = {
  entry: 'Entrada',
  lunch_start: 'Inicio Refrigerio',
  lunch_end: 'Fin Refrigerio',
  exit: 'Salida',
};

const PUNCH_COLORS: Record<PunchType, string> = {
  entry: 'bg-green-600 hover:bg-green-700',
  lunch_start: 'bg-yellow-600 hover:bg-yellow-700',
  lunch_end: 'bg-blue-600 hover:bg-blue-700',
  exit: 'bg-red-600 hover:bg-red-700',
};

export default function PunchPage() {
  const [userLocation, setUserLocation] = useState<GeolocationPosition | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [punching, setPunching] = useState<PunchType | null>(null);
  const [lastPunch, setLastPunch] = useState<PunchRecord | null>(null);
  const [todayPunches, setTodayPunches] = useState<PunchRecord[]>([]);
  const [branchInfo, setBranchInfo] = useState<{ name: string; radius: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  // Obtener ubicación al cargar
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocalización no soportada en este navegador');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation(pos);
        setLocationError(null);
      },
      (err) => {
        setLocationError(`Error obteniendo ubicación: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  const loadTodayData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];

      // Cargar marcaciones de hoy
      const { data: punches } = await supabase
        .from('attendance_logs')
        .select('type, timestamp, is_outside')
        .eq('user_id', user.id)
        .gte('timestamp', today)
        .order('timestamp', { ascending: true });

      if (punches) {
        setTodayPunches(punches as any);
        setLastPunch(punches[punches.length - 1] as any);
      }

      // Cargar info de sede
      const { data: profile } = await supabase
        .from('profiles')
        .select('branch_id, branches(name, radius_meters)')
        .eq('id', user.id)
        .single();

      if (profile?.branches) {
        setBranchInfo({
          name: (profile.branches as any).name,
          radius: (profile.branches as any).radius_meters,
        });
      }
    } catch (error) {
      console.error('Error loading today data:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Cargar datos iniciales
  useEffect(() => {
    loadTodayData();
  }, [loadTodayData]);

  const handlePunch = useCallback(async (type: PunchType) => {
    if (!userLocation) {
      alert('No se pudo obtener tu ubicación. Activa el GPS e intenta de nuevo.');
      return;
    }

    setPunching(type);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const { latitude: lat, longitude: lng } = userLocation.coords;

      const response = await fetch('/api/attendance/punch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          lat,
          lng,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al registrar marcación');
      }

      // Mostrar feedback
      if (result.is_outside) {
        alert(`⚠️ Marcación registrada como "Fuera de Sede" (${result.distance}m de la sede). Notificando a administrador.`);
      } else {
        alert(`✅ ${PUNCH_LABELS[type]} registrada correctamente.`);
      }

      // Recargar datos
      await loadTodayData();
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`);
    } finally {
      setPunching(null);
    }
  }, [userLocation, supabase, loadTodayData]);

  const getNextPunchType = (): PunchType | null => {
    if (!lastPunch) return 'entry';
    switch (lastPunch.type) {
      case 'entry': return 'lunch_start';
      case 'lunch_start': return 'lunch_end';
      case 'lunch_end': return 'exit';
      case 'exit': return null;
    }
  };

  const nextPunch = getNextPunchType();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <svg className="animate-spin h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con info de sede */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-semibold text-gray-900">Marcar Asistencia</h1>
          {locationError && (
            <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
              ⚠️ {locationError}
            </span>
          )}
        </div>

        {branchInfo && (
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
            <p className="text-sm font-medium text-primary-800">{branchInfo.name}</p>
            <p className="text-xs text-primary-600">Radio: {branchInfo.radius}m</p>
          </div>
        )}

        {userLocation && (
          <p className="mt-2 text-xs text-gray-500 font-mono">
            GPS: {userLocation.coords.latitude.toFixed(6)}, {userLocation.coords.longitude.toFixed(6)}
            ±{Math.round(userLocation.coords.accuracy)}m
          </p>
        )}
      </div>

      {/* Botón principal de marcación */}
      {nextPunch && (
        <button
          onClick={() => handlePunch(nextPunch)}
          disabled={punching !== null || !userLocation}
          className={`w-full py-6 rounded-xl font-semibold text-lg text-white transition-all duration-200 ${PUNCH_COLORS[nextPunch]} ${punching ? 'opacity-50 cursor-wait' : 'hover:shadow-lg active:scale-[0.98]'}`}
        >
          {punching === nextPunch ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Registrando...
            </span>
          ) : (
            PUNCH_LABELS[nextPunch]
          )}
        </button>
      )}

      {!nextPunch && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
          <svg className="mx-auto h-12 w-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-green-800">Jornada Completada</h3>
          <p className="mt-1 text-sm text-green-600">Has registrado todas las marcaciones de hoy.</p>
        </div>
      )}

      {/* Historial de hoy */}
      {todayPunches.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900">Marcaciones de Hoy</h2>
          </div>
          <ul className="divide-y divide-gray-200">
            {todayPunches.map((punch, index) => (
              <li key={index} className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${PUNCH_COLORS[punch.type]}`}>
                    <span className="text-white text-xs font-bold">
                      {index + 1}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{PUNCH_LABELS[punch.type]}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(punch.timestamp).toLocaleTimeString('es-PE', { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        timeZone: 'America/Lima'
                      })}
                    </p>
                  </div>
                </div>
                {punch.is_outside && (
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                    Fuera de Sede
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Info de secuencia */}
      <div className="bg-gray-50 rounded-xl p-4 text-center">
        <p className="text-sm text-gray-600">
          Secuencia: <span className="font-medium text-primary-600">Entrada</span> →
          <span className="font-medium text-yellow-600"> Inicio Refrigerio</span> →
          <span className="font-medium text-blue-600"> Fin Refrigerio</span> →
          <span className="font-medium text-red-600"> Salida</span>
        </p>
        <p className="mt-2 text-xs text-gray-500">
          Las coordenadas GPS se capturan automáticamente al marcar.
        </p>
      </div>
    </div>
  );
}