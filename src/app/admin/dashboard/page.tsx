import { getUser } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function AdminDashboardPage() {
  const user = await getUser();
  
  if (!user) {
    redirect('/login');
  }

  const supabase = await createClient();

  // Obtener estadísticas básicas
  const [
    { count: totalWorkers },
    { count: todayEntries },
    { count: todayExits },
    { count: outsidePunches },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'worker').eq('status', 'active'),
    supabase.from('attendance_logs').select('*', { count: 'exact', head: true }).eq('type', 'entry').gte('timestamp', new Date().toISOString().split('T')[0]),
    supabase.from('attendance_logs').select('*', { count: 'exact', head: true }).eq('type', 'exit').gte('timestamp', new Date().toISOString().split('T')[0]),
    supabase.from('attendance_logs').select('*', { count: 'exact', head: true }).eq('is_outside', true).gte('timestamp', new Date().toISOString().split('T')[0]),
  ]);

  // Últimas marcaciones fuera de sede
  const { data: recentOutside } = await supabase
    .from('attendance_logs')
    .select(`
      id,
      type,
      timestamp,
      lat,
      lng,
      is_outside,
      profiles!inner(full_name, dni)
    `)
    .eq('is_outside', true)
    .order('timestamp', { ascending: false })
    .limit(5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Administrador</h1>
        <p className="mt-1 text-sm text-gray-500">Resumen del día de hoy</p>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Trabajadores Activos</dt>
                  <dd className="text-lg font-medium text-gray-900">{totalWorkers || 0}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Entradas Hoy</dt>
                  <dd className="text-lg font-medium text-gray-900">{todayEntries || 0}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Salidas Hoy</dt>
                  <dd className="text-lg font-medium text-gray-900">{todayExits || 0}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Marcaciones Fuera Sede</dt>
                  <dd className="text-lg font-medium text-gray-900">{outsidePunches || 0}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alertas recientes: marcaciones fuera de sede */}
      {recentOutside && recentOutside.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-yellow-800 mb-3">⚠️ Marcaciones Fuera de Sede Recientes</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-yellow-200">
              <thead className="bg-yellow-100">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-yellow-800 uppercase tracking-wider">Trabajador</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-yellow-800 uppercase tracking-wider">Tipo</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-yellow-800 uppercase tracking-wider">Hora</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-yellow-800 uppercase tracking-wider">Coordenadas</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-yellow-200">
                {recentOutside.map((log: any) => (
                  <tr key={log.id}>
                    <td className="px-4 py-2 text-sm text-gray-900">
                      {log.profiles?.full_name} ({log.profiles?.dni})
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-500">
                      {log.type === 'entry' ? 'Entrada' : log.type === 'exit' ? 'Salida' : log.type}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-500">
                      {new Date(log.timestamp).toLocaleString('es-PE', { timeZone: 'America/Lima' })}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-500 font-mono">
                      {log.lat.toFixed(6)}, {log.lng.toFixed(6)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Accesos rápidos */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <a href="/admin/workers" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Gestionar Personal</h3>
          <p className="mt-2 text-sm text-gray-500">Agregar, editar o desactivar trabajadores y asignar sedes.</p>
        </a>
        <a href="/admin/branches" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Configurar Sedes</h3>
          <p className="mt-2 text-sm text-gray-500">Definir ubicaciones, radios de geofencing y horarios.</p>
        </a>
        <a href="/admin/reports" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Generar Reportes</h3>
          <p className="mt-2 text-sm text-gray-500">Exportar planillas mensuales en formato SUNAFIL (Excel).</p>
        </a>
      </div>
    </div>
  );
}