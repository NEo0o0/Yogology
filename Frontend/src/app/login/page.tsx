'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/profile');
    }
  }, [user, authLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error('[Login] signInWithPassword failed', signInError);
        const message = signInError.message || 'Failed to sign in. Please try again.';
        setError(message);
        toast.error(message);
        return;
      }

      if (!data?.user) {
        const message = 'Login succeeded but no user was returned. Please try again.';
        console.error('[Login] Missing data.user after sign-in', data);
        setError(message);
        toast.error(message);
        return;
      }

      router.replace('/profile');
    } catch (err) {
      console.error('[Login] Unexpected error during sign-in', err);
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    user ? null :
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--color-cream)] via-white to-[var(--color-sand)]">
      <form onSubmit={handleLogin} className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl text-[var(--color-earth-dark)] mb-1">Sign in</h1>
        <p className="text-[var(--color-stone)] mb-6">Use your Supabase account credentials.</p>

        {error && (
          <div className="mb-4 p-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm">{error}</div>
        )}

        <label className="block text-sm text-[var(--color-stone)] mb-1">Email</label>
        <input
          className="w-full border border-[var(--color-sand)] rounded-lg px-3 py-2 mb-4"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label className="block text-sm text-[var(--color-stone)] mb-1">Password</label>
        <input
          className="w-full border border-[var(--color-sand)] rounded-lg px-3 py-2 mb-6"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[var(--color-sage)] text-white py-3 rounded-lg hover:bg-[var(--color-clay)] transition-all duration-300 disabled:opacity-60"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </main>
  );
}
