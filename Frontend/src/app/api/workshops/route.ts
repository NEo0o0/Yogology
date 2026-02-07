import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { createSupabasePublicClient } from '@/utils/supabase/public';

export const revalidate = 30;

async function fetchWorkshopsFromDb() {
  const supabase = createSupabasePublicClient();

  // Fetch workshops, retreats, and special events (exclude Teacher Training and regular Classes)
  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .in('category', ['Workshop', 'Retreat', 'Special Event'])
    .eq('is_cancelled', false)
    .order('starts_at', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function GET() {
  try {
    const cached = unstable_cache(() => fetchWorkshopsFromDb(), ['api/workshops'], {
      revalidate,
    });

    const data = await cached();
    return NextResponse.json({ data });
  } catch (err: any) {
    console.error('[API /api/workshops] GET failed', err);
    return NextResponse.json(
      { error: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
