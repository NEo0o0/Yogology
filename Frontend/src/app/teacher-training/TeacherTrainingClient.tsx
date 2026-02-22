'use client';

import { TeacherTrainingHero } from '@/components/about/TeacherTrainingHero';
import { Curriculum } from '@/components/about/Curriculum';
import { SchedulePricing } from '@/components/packages/SchedulePricing';
import type { Tables } from '@/types/database.types';

type Training = Tables<'classes'> & {
  early_bird_price: number | null;
  early_bird_deadline: string | null;
  registration_opens_at: string | null;
};

export function TeacherTrainingClient({ 
  upcomingTraining, 
  allTrainings 
}: { 
  upcomingTraining: Training | null;
  allTrainings?: Training[];
}) {
  return (
    <>
      <TeacherTrainingHero upcomingTraining={upcomingTraining} />
      <Curriculum />
      <SchedulePricing upcomingTraining={upcomingTraining} allTrainings={allTrainings} />
    </>
  );
}
