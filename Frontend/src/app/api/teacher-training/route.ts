import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { createSupabasePublicClient } from '@/utils/supabase/public';

export const revalidate = 30;

async function fetchTeacherTrainingFromDb() {
  const supabase = createSupabasePublicClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .eq('category', 'Teacher Training')
    .gte('starts_at', now)
    .order('starts_at', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function GET() {
  try {
    const cached = unstable_cache(() => fetchTeacherTrainingFromDb(), ['api/teacher-training'], {
      revalidate,
    });

    const data = await cached();
    return NextResponse.json({ data });
  } catch (err: any) {
    console.error('[API /api/teacher-training] GET failed', err);
    return NextResponse.json(
      { error: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
