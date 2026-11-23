import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if expired - required for Server Components
  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Public routes that don't require auth
  const publicRoutes = ['/login', '/auth/callback', '/'];
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );

  // Redirect to login if accessing protected route without user
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // If user exists, check role for route access
  if (user) {
    // Get user profile to check role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, require_password_change')
      .eq('id', user.id)
      .single();

    // Force password change for admin on first login
    if (profile?.require_password_change && pathname !== '/first-login' && pathname !== '/login') {
      const url = request.nextUrl.clone();
      url.pathname = '/first-login';
      return NextResponse.redirect(url);
    }

    // Role-based route protection
    const isAdminRoute = pathname.startsWith('/admin');
    const isWorkerRoute = pathname.startsWith('/worker');

    if (isAdminRoute && profile?.role !== 'admin') {
      const url = request.nextUrl.clone();
      url.pathname = '/worker/punch';
      return NextResponse.redirect(url);
    }

    if (isWorkerRoute && profile?.role !== 'worker') {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/dashboard';
      return NextResponse.redirect(url);
    }

    // Redirect logged in users from login page
    if (pathname === '/login') {
      const url = request.nextUrl.clone();
      url.pathname = profile?.role === 'admin' ? '/admin/dashboard' : '/worker/punch';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};