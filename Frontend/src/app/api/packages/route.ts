import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { createSupabasePublicClient } from '@/utils/supabase/public';

export const revalidate = 30;

async function fetchPackagesFromDb(params: { activeOnly?: boolean }) {
  const supabase = createSupabasePublicClient();

  let query = supabase.from('packages').select('*').order('price', { ascending: true });

  if (params.activeOnly) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const activeOnly = url.searchParams.get('activeOnly');
  const active = activeOnly == null ? true : activeOnly !== 'false';

  const cacheKey = ['api/packages', active ? 'active' : 'all'];

  try {
    const cached = unstable_cache(() => fetchPackagesFromDb({ activeOnly: active }), cacheKey, {
      revalidate,
    });

    const data = await cached();
    return NextResponse.json({ data });
  } catch (err: any) {
    console.error('[API /api/packages] GET failed', err);
    return NextResponse.json(
      { error: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
