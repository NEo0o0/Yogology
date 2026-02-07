"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Tables } from '../types/database.types';

type Workshop = Tables<'classes'>;

interface UseWorkshopsOptions {
  autoFetch?: boolean;
  initialWorkshops?: Workshop[];
}

export function useWorkshops(options: UseWorkshopsOptions = {}) {
  const { autoFetch = true, initialWorkshops } = options;
  const [workshops, setWorkshops] = useState<Workshop[]>(initialWorkshops ?? []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchWorkshops = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/workshops');
      if (!response.ok) {
        throw new Error(`Failed to fetch workshops (${response.status})`);
      }

      const json = (await response.json()) as { data: Workshop[] };
      setWorkshops(json.data ?? []);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching workshops:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoFetch) fetchWorkshops();
  }, [autoFetch, fetchWorkshops]);

  return {
    workshops,
    loading,
    error,
    refetch: fetchWorkshops,
  };
}
