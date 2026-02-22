import { WorkshopsEvents } from '@/components/workshops/WorkshopsEvents';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import type { Tables } from '@/types/database.types';

export const revalidate = 30;

type Workshop = Tables<'classes'>;

export default async function WorkshopsPage() {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from('classes')
    .select('*')
    .in('category', ['Workshop', 'Retreat', 'Special Event'])
    .eq('is_cancelled', false)
    .order('starts_at', { ascending: true });

  const initialWorkshops: Workshop[] = (data ?? []) as unknown as Workshop[];

  return <WorkshopsEvents initialWorkshops={initialWorkshops} />;
}
