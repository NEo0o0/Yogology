import { ScheduleClient } from './ScheduleClient';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import type { Tables } from '@/types/database.types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type DbClass = Tables<'classes'>;

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekEnd(weekStart: Date): Date {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

export default async function SchedulePage() {
  const supabase = await createSupabaseServerClient();

  const now = new Date();
  const start = getWeekStart(now);
  const end = getWeekEnd(start);

  const { data } = await supabase
    .from('classes')
    .select('*, class_types(*)')
    .eq('is_cancelled', false)
    .eq('category', 'class')
    .gte('starts_at', start.toISOString())
    .lte('starts_at', end.toISOString())
    .order('starts_at', { ascending: true });

  const initialClasses: DbClass[] = (data ?? []) as unknown as DbClass[];

  return <ScheduleClient initialClasses={initialClasses} />;
}
