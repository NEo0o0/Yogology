import { TeacherTrainingClient } from './TeacherTrainingClient';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import type { Tables } from '@/types/database.types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Training = Tables<'classes'> & {
  early_bird_price: number | null;
  early_bird_deadline: string | null;
  registration_opens_at: string | null;
};

export default async function TeacherTrainingPage() {
  const supabase = await createSupabaseServerClient();

  const now = new Date().toISOString();

  // Fetch ALL upcoming teacher trainings (show all classes, even if registration hasn't opened yet)
  // Show classes that haven't started yet (starts_at >= now)
  const { data } = await supabase
    .from('classes')
    .select('*')
    .eq('category', 'Teacher Training')
    .eq('is_cancelled', false)
    .gte('starts_at', now)
    .order('starts_at', { ascending: true });

  // Pass ALL classes to component (not just first one)
  const allTrainings: Training[] = (data || []) as unknown as Training[];

  return <TeacherTrainingClient upcomingTraining={allTrainings[0] || null} allTrainings={allTrainings} />;
}
