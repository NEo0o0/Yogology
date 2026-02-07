import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { CookieOptions } from '@supabase/ssr';
import type { Database } from '@/types/database.types';
import { projectId, publicAnonKey } from './info';

type CookieToSet = {
  name: string;
  value: string;
  options: CookieOptions;
};

export async function createSupabaseServerClient() {
  try {
    const cookieStore = await cookies();

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? `https://${projectId}.supabase.co`;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? publicAnonKey;

    if (!supabaseUrl) {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
    }
    if (!supabaseAnonKey) {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY');
    }

    return createServerClient<Database>(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            const anyStore = cookieStore as any;
            if (typeof anyStore.getAll === 'function') {
              return anyStore.getAll();
            }

            // Next 16 can return a cookie store without getAll().
            // Returning an empty array is safe for anon/public queries.
            return [];
          },
          setAll(cookiesToSet: CookieToSet[]) {
            try {
              cookiesToSet.forEach(({ name, value, options }: CookieToSet) => {
                (cookieStore as any).set(name, value, options);
              });
            } catch {
              // ignore (Server Components can't set cookies)
            }
          },
        },
      }
    );
  } catch (err) {
    console.error('[Supabase] Failed to create server client', {
      hasNextPublicSupabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      hasNextPublicSupabaseAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      err,
    });
    throw err;
  }
}
