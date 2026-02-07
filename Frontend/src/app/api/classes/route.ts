import { NextResponse } from 'next/server';
import { createSupabasePublicClient } from '@/utils/supabase/public';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function toIsoOrNull(value: string | null): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

async function fetchClassesFromDb(params: {
  start?: string | null;
  end?: string | null;
  category?: string | null;
  classTypeId?: number | null;
}) {
  const supabase = createSupabasePublicClient();

  console.log('[fetchClassesFromDb] Query params:', {
    start: params.start,
    end: params.end,
    category: params.category,
    classTypeId: params.classTypeId
  });

  // Use LEFT JOIN for class_types so classes without valid class_type_id still appear
  let query = supabase
    .from('classes')
    .select('*, class_types!left(*)')
    .eq('is_cancelled', false) // Filter cancelled classes at DB level
    .order('starts_at', { ascending: true });

  // STRICT date range filtering: starts_at >= start AND starts_at <= end
  // Frontend sends end date with 23:59:59.999, so use <= (not <)
  // Do NOT add days or modify the date strings - use them as-is
  if (params.start) {
    query = query.gte('starts_at', params.start);
  }
  if (params.end) {
    query = query.lte('starts_at', params.end);
  }
  
  // Case-insensitive category filter
  if (params.category) {
    query = query.ilike('category', params.category);
  }
  
  if (params.classTypeId != null) query = query.eq('class_type_id', params.classTypeId);

  const { data, error } = await query;
  
  if (error) throw error;
  
  // Comprehensive debug logging: Show ALL returned classes
  console.log('[fetchClassesFromDb] Query result:', {
    count: data?.length ?? 0,
    requestedRange: {
      start: params.start,
      end: params.end,
    },
    allClasses: data?.map(c => ({
      id: c.id,
      title: c.title,
      starts_at: c.starts_at,
      category: c.category,
      is_cancelled: c.is_cancelled,
    })) ?? [],
  });
  
  // Classes are already filtered by is_cancelled at DB level
  // Return as-is (no additional JS filtering needed)
  return data ?? [];
}

export async function GET(req: Request) {
  const url = new URL(req.url);

  const start = toIsoOrNull(url.searchParams.get('start'));
  const end = toIsoOrNull(url.searchParams.get('end'));
  const category = url.searchParams.get('category');
  const classTypeIdRaw = url.searchParams.get('classTypeId');
  const classTypeId = classTypeIdRaw ? Number(classTypeIdRaw) : null;

  try {
    const data = await fetchClassesFromDb({
      start,
      end,
      category,
      classTypeId: Number.isFinite(classTypeId) ? classTypeId : null,
    });

    return NextResponse.json({ data }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store',
      },
    });
  } catch (err: any) {
    console.error('[API /api/classes] GET failed', err);
    return NextResponse.json(
      { error: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
