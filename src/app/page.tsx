import { getUser } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  const user = await getUser();

  if (user) {
    // Redirigir según rol
    const supabase = await import('@/lib/supabase/server').then(m => m.createClient());
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    
    if (profile?.role === 'admin') {
      redirect('/admin/dashboard');
    } else {
      redirect('/worker/punch');
    }
  }

  redirect('/login');
}