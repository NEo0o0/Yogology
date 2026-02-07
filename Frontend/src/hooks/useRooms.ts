import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';
import { toast } from 'sonner';

interface Room {
  id: number;
  name: string;
  created_at: string;
}

export function useRooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('rooms' as any)
          .select('id, name, created_at') as any;

        if (fetchError) throw fetchError;

        setRooms((data || []) as Room[]);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        console.error('Error fetching rooms:', error);
        toast.error('Failed to load rooms');
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, []);

  return { rooms, loading, error };
}
