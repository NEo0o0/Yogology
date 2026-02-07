'use client';

import { useCallback } from 'react';
import { supabase } from '@/utils/supabase/client';
import { AppProvider } from '@/context/AppContext';
import { AdminDashboard } from '@/components/AdminDashboard';

export function LegacyAdminDashboardClient() {
  const onLogout = useCallback(async () => {
    await supabase.auth.signOut();
    await new Promise((resolve) => setTimeout(resolve, 300));
    window.location.href = '/login';
  }, []);

  return (
    <AppProvider>
      <AdminDashboard onLogout={onLogout} onNavigateHome={() => (window.location.href = '/')} />
    </AppProvider>
  );
}
