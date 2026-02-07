'use client';

import { useState } from 'react';
import { supabase } from '@/utils/supabase/client';

export function LogoutButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onLogout = async () => {
    setLoading(true);
    setError(null);

    try {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
      window.location.href = '/';
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to sign out');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {error && <span className="text-sm text-red-600">{error}</span>}
      <button
        onClick={onLogout}
        disabled={loading}
        className="px-4 py-2 text-[var(--color-stone)] hover:text-[var(--color-earth-dark)] hover:bg-[var(--color-cream)] rounded-lg transition-all duration-300 disabled:opacity-60"
      >
        {loading ? 'Signing out…' : 'Logout'}
      </button>
    </div>
  );
}
