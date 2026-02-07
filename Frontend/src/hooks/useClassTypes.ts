import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '../types/database.types';

type ClassType = Tables<'class_types'>;
type ClassTypeInsert = TablesInsert<'class_types'>;
type ClassTypeUpdate = TablesUpdate<'class_types'>;

interface UseClassTypesOptions {
  autoFetch?: boolean;
}

export function useClassTypes(options: UseClassTypesOptions = {}) {
  const { autoFetch = true } = options;
  const [classTypes, setClassTypes] = useState<ClassType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchClassTypes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('class_types')
        .select('*')
        .order('title', { ascending: true });

      if (fetchError) throw fetchError;

      setClassTypes(data || []);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching class types:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoFetch) {
      fetchClassTypes();
    }
  }, [autoFetch, fetchClassTypes]);

  const createClassType = async (classTypeData: ClassTypeInsert) => {
    try {
      const { data, error: createError } = await supabase
        .from('class_types')
        .insert(classTypeData)
        .select()
        .single();

      if (createError) throw createError;

      setClassTypes(prev => [...prev, data]);
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  };

  const updateClassType = async (id: number, updates: ClassTypeUpdate) => {
    try {
      const { data, error: updateError } = await supabase
        .from('class_types')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      setClassTypes(prev => prev.map(ct => (ct.id === id ? data : ct)));
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  };

  const deleteClassType = async (id: number) => {
    try {
      const { error: deleteError } = await supabase
        .from('class_types')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setClassTypes(prev => prev.filter(ct => ct.id !== id));
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  return {
    classTypes,
    loading,
    error,
    fetchClassTypes,
    createClassType,
    updateClassType,
    deleteClassType,
  };
}
