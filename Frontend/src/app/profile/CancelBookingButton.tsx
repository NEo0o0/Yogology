'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function CancelBookingButton({ bookingId }: { bookingId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onCancel = async () => {
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'POST',
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error || 'Failed to cancel booking');
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to cancel booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {error && <span className="text-sm text-red-600">{error}</span>}
      <button
        onClick={onCancel}
        disabled={loading}
        className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-300 border border-red-200 hover:border-red-300 disabled:opacity-60"
      >
        {loading ? 'Cancelling…' : 'Cancel Booking'}
      </button>
    </div>
  );
}
