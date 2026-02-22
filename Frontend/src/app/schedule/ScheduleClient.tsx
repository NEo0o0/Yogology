'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ClassesHero } from '@/components/classes/ClassesHero';
import { WeeklySchedule } from '@/components/bookings/WeeklySchedule';
import { ClassRules } from '@/components/classes/ClassRules';
import { CancellationPolicy } from '@/components/classes/CancellationPolicy';
import { ClassTypes } from '@/components/classes/ClassTypes';
import type { Tables } from '@/types/database.types';

type DbClass = Tables<'classes'>;

interface ScheduleClientProps {
  initialClasses: DbClass[];
}

export function ScheduleClient({ initialClasses }: ScheduleClientProps) {
  const router = useRouter();

  const onNavigate = useCallback(
    (page: string) => {
      if (page === 'login') {
        router.push('/login');
        return;
      }
      if (page === 'pricing') {
        router.push('/pricing');
        return;
      }
      if (page === 'member') {
        router.push('/profile');
        return;
      }
      if (page === 'home') {
        router.push('/');
        return;
      }
      if (page === 'workshops') {
        router.push('/workshops');
        return;
      }
      if (page === 'teacher-training') {
        router.push('/teacher-training');
        return;
      }
      if (page === 'contact') {
        router.push('/contact');
        return;
      }
      if (page === 'schedule') {
        router.push('/schedule');
        return;
      }
    },
    [router]
  );

  return (
    <>
      <ClassesHero />
      <WeeklySchedule onNavigate={onNavigate} initialClasses={initialClasses} />
      
      {/* Studio Guidelines */}
        <ClassRules />
        <CancellationPolicy />
      
      
      <ClassTypes onNavigate={onNavigate} />
    </>
  );
}
