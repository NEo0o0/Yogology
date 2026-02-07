import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { CookieOptions } from '@supabase/ssr';
import { projectId, publicAnonKey } from '@/utils/supabase/info';

export default async function proxy(request: NextRequest) {
  const response = NextResponse.next();

  try {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? `https://${projectId}.supabase.co`;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? publicAnonKey;

    if (!supabaseUrl) {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
    }
    if (!supabaseAnonKey) {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY');
    }

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>
        ) {
          cookiesToSet.forEach(
            ({ name, value, options }: { name: string; value: string; options: CookieOptions }) => {
              response.cookies.set(name, value, options);
            }
          );
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const isProfileRoute = request.nextUrl.pathname.startsWith('/profile');
    const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');

    if ((isProfileRoute || isAdminRoute) && !user) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirectedFrom', request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }

    if (isAdminRoute && user) {
      let isAdmin = false;

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        isAdmin = (profile as any)?.role === 'admin';
      } catch (err) {
        console.error('[Proxy] Failed to check admin role from profiles', err);
      }

      if (!isAdmin) {
        const url = request.nextUrl.clone();
        url.pathname = '/profile';
        return NextResponse.redirect(url);
      }
    }

    return response;
  } catch (err) {
    console.error('[Proxy] Failed to evaluate request', err);
    return response;
  }
}

export const config = {
  matcher: ['/profile/:path*', '/admin/:path*'],
};
