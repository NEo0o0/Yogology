"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Tables, TablesInsert, TablesUpdate } from '../types/database.types';
import { supabase } from '../utils/supabase/client';

type Class = Tables<'classes'>;
type ClassInsert = TablesInsert<'classes'>;
type ClassUpdate = TablesUpdate<'classes'>;

interface UseClassesOptions {
  startDate?: string;
  endDate?: string;
  category?: string;
  classTypeId?: number;
  autoFetch?: boolean;
  initialClasses?: Class[];
}

export function useClasses(options: UseClassesOptions = {}) {
  const {
    startDate,
    endDate,
    category,
    classTypeId,
    autoFetch = true,
    initialClasses,
  } = options;
  const [classes, setClasses] = useState<Class[]>(initialClasses ?? []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchClasses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (startDate) params.set('start', startDate);
      if (endDate) params.set('end', endDate);
      if (category) params.set('category', category);
      if (classTypeId != null) params.set('classTypeId', String(classTypeId));
      
      // Cache busting: Add timestamp to force fresh data on every request
      params.set('t', String(new Date().getTime()));

      const url = `/api/classes?${params.toString()}`;
      console.log('[useClasses] Fetching classes from:', url);

      const response = await fetch(url, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[useClasses] Fetch failed:', {
          status: response.status,
          statusText: response.statusText,
          url,
          errorText,
        });
        throw new Error(`Failed to fetch classes (${response.status}): ${errorText}`);
      }

      const json = (await response.json()) as { data: Class[] };
      console.log('[useClasses] Successfully fetched', json.data?.length ?? 0, 'classes');
      setClasses(json.data ?? []);
    } catch (err: any) {
      console.error('[useClasses] Error fetching classes:', {
        message: err.message,
        stack: err.stack,
        name: err.name,
        params: { startDate, endDate, category, classTypeId },
      });
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, category, classTypeId]);

  useEffect(() => {
    if (autoFetch) {
      fetchClasses();
    }
  }, [autoFetch, fetchClasses]);

  const createClass = async (classData: ClassInsert) => {
    try {
      const { data, error: createError } = await supabase
        .from('classes')
        .insert(classData)
        .select()
        .single();

      if (createError) throw createError;

      setClasses(prev => [...prev, data]);
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  };

  const updateClass = async (id: number, updates: ClassUpdate) => {
    try {
      const { data, error: updateError } = await supabase
        .from('classes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      setClasses(prev => prev.map(c => (c.id === id ? data : c)));
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  };

  const deleteClass = async (id: number) => {
    try {
      const { error: deleteError } = await supabase
        .from('classes')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setClasses(prev => prev.filter(c => c.id !== id));
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const cancelClass = async (id: number) => {
    return updateClass(id, { is_cancelled: true });
  };

  return {
    classes,
    loading,
    error,
    fetchClasses,
    createClass,
    updateClass,
    deleteClass,
    cancelClass,
  };
}
