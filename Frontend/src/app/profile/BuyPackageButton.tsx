'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function BuyPackageButton({ packageId }: { packageId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onBuy = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/packages/buy', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ packageId }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error || 'Failed to buy bundle');
      }

      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to buy bundle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {error && <span className="text-sm text-red-600">{error}</span>}
      <button
        onClick={onBuy}
        disabled={loading}
        className="px-4 py-2 bg-[var(--color-sage)] text-white rounded-lg hover:bg-[var(--color-clay)] transition-all duration-300 disabled:opacity-60"
      >
        {loading ? 'Processing…' : 'Buy Bundle'}
      </button>
    </div>
  );
}
