"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';

interface AppSettings {
  [key: string]: string;
}

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('app_settings')
        .select('key, value');

      if (fetchError) throw fetchError;

      const settingsMap: AppSettings = {};
      (data || []).forEach((setting) => {
        settingsMap[setting.key] = setting.value;
      });

      setSettings(settingsMap);
    } catch (err) {
      const asError = err instanceof Error ? err : new Error(String(err));
      setError(asError);
      console.error('Error fetching app settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const getSetting = (key: string, defaultValue: string = ''): string => {
    return settings[key] || defaultValue;
  };

  return {
    settings,
    loading,
    error,
    getSetting,
    refetch: fetchSettings,
  };
}
