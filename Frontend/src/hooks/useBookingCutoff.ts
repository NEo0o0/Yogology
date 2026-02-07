import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';

export function useBookingCutoff(startsAt: string) {
  const [cutoffMinutes, setCutoffMinutes] = useState<number>(180); // Default 3 hours
  const [isCutoffPassed, setIsCutoffPassed] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchCutoffSetting = async () => {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'booking_cutoff_minutes')
          .single();

        if (error) {
          console.warn('Failed to fetch booking cutoff setting, using default:', error);
        } else if (data) {
          setCutoffMinutes(parseInt(data.value));
        }
      } catch (error) {
        console.warn('Error fetching booking cutoff:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCutoffSetting();
  }, []);

  useEffect(() => {
    if (!startsAt) {
      setIsCutoffPassed(false);
      return;
    }

    const checkCutoff = () => {
      const now = new Date();
      const classStartTime = new Date(startsAt);
      const timeUntilStartInMinutes = (classStartTime.getTime() - now.getTime()) / (1000 * 60);

      setIsCutoffPassed(timeUntilStartInMinutes < cutoffMinutes);
    };

    // Check immediately
    checkCutoff();

    // Check every minute to keep it updated
    const interval = setInterval(checkCutoff, 60000);

    return () => clearInterval(interval);
  }, [startsAt, cutoffMinutes]);

  return { isCutoffPassed, cutoffMinutes, loading };
}
