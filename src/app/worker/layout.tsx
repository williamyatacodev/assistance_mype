import { getUser } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function WorkerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  
  if (!user) {
    redirect('/login');
  }

  const supabase = await import('@/lib/supabase/server').then(m => m.createClient());
  const { data: profile } = await supabase.from('profiles').select('full_name, branch_id').eq('id', user.id).single();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-primary-600 shadow-sm">
        <div className="max-w-md mx-auto px-4">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Link href="/worker/punch" className="text-xl font-bold text-white">
                Asistencia Perú
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-white/90">{profile?.full_name || 'Trabajador'}</span>
              <form action="/api/auth/signout" method="POST">
                <button type="submit" className="text-sm text-white/90 hover:text-white">
                  Salir
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-md mx-auto py-6 px-4">
        {children}
      </main>
    </div>
  );
}