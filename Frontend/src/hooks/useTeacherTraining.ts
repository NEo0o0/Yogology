"use client";

import { useCallback, useEffect, useState } from 'react';
import type { Tables } from '../types/database.types';

type Training = Tables<'classes'> & {
  early_bird_price: number | null;
  early_bird_deadline: string | null;
  registration_opens_at: string | null;
};

interface UseTeacherTrainingOptions {
  autoFetch?: boolean;
  initialTrainings?: Training[];
}

export function useTeacherTraining(options: UseTeacherTrainingOptions = {}) {
  const { autoFetch = true, initialTrainings } = options;
  const [trainings, setTrainings] = useState<Training[]>(initialTrainings ?? []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchTeacherTraining = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/teacher-training');
      if (!response.ok) {
        throw new Error(`Failed to fetch teacher training (${response.status})`);
      }

      const json = (await response.json()) as { data: Training[] };
      setTrainings(json.data ?? []);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching teacher training:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoFetch) fetchTeacherTraining();
  }, [autoFetch, fetchTeacherTraining]);

  return {
    trainings,
    loading,
    error,
  };
}
