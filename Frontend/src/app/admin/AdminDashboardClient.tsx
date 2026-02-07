'use client';

import { useDashboardStats } from '@/hooks/useDashboardStats';

function formatCurrencyTHB(value: number) {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    maximumFractionDigits: 0,
  }).format(value);
}

export function AdminDashboardClient() {
  const { stats, loading, error, refetch } = useDashboardStats();

  return (
    <section>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl text-[var(--color-earth-dark)] mb-1">Dashboard</h1>
          <p className="text-[var(--color-stone)]">Studio overview powered by Supabase RPCs.</p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="px-4 py-2 rounded-lg border border-[var(--color-sand)] text-[var(--color-earth-dark)] hover:bg-[var(--color-cream)]/60 transition-colors"
        >
          Refresh
        </button>
      </div>

      {error ? (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-700">
          Failed to load dashboard stats: {error.message}
        </div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-[var(--color-sand)] p-5 shadow-sm">
          <div className="text-sm text-[var(--color-stone)]">Total Bookings</div>
          <div className="mt-2 text-3xl text-[var(--color-earth-dark)]">
            {loading ? '…' : (stats?.total_bookings ?? 0).toLocaleString()}
          </div>
          <div className="mt-2 text-xs text-[var(--color-stone)]">This month</div>
        </div>

        <div className="bg-white rounded-xl border border-[var(--color-sand)] p-5 shadow-sm">
          <div className="text-sm text-[var(--color-stone)]">Active Members</div>
          <div className="mt-2 text-3xl text-[var(--color-earth-dark)]">
            {loading ? '…' : (stats?.active_members ?? 0).toLocaleString()}
          </div>
          <div className="mt-2 text-xs text-[var(--color-stone)]">Current month</div>
        </div>

        <div className="bg-white rounded-xl border border-[var(--color-sand)] p-5 shadow-sm">
          <div className="text-sm text-[var(--color-stone)]">Revenue</div>
          <div className="mt-2 text-3xl text-[var(--color-earth-dark)]">
            {loading ? '…' : formatCurrencyTHB(stats?.revenue ?? 0)}
          </div>
          <div className="mt-2 text-xs text-[var(--color-stone)]">This month</div>
        </div>

        <div className="bg-white rounded-xl border border-[var(--color-sand)] p-5 shadow-sm">
          <div className="text-sm text-[var(--color-stone)]">Drop-ins</div>
          <div className="mt-2 text-3xl text-[var(--color-earth-dark)]">
            {loading ? '…' : (stats?.dropins ?? 0).toLocaleString()}
          </div>
          <div className="mt-2 text-xs text-[var(--color-stone)]">This month</div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-[var(--color-sand)] p-5 shadow-sm lg:col-span-2">
          <h2 className="text-lg text-[var(--color-earth-dark)] mb-4">Today</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-lg bg-[var(--color-cream)]/40 border border-[var(--color-sand)] p-4">
              <div className="text-xs text-[var(--color-stone)]">Check-ins</div>
              <div className="mt-1 text-2xl text-[var(--color-earth-dark)]">{loading ? '…' : (stats?.today_checkins ?? 0)}</div>
            </div>
            <div className="rounded-lg bg-[var(--color-cream)]/40 border border-[var(--color-sand)] p-4">
              <div className="text-xs text-[var(--color-stone)]">Classes Completed</div>
              <div className="mt-1 text-2xl text-[var(--color-earth-dark)]">{loading ? '…' : (stats?.today_classes_completed ?? 0)}</div>
            </div>
            <div className="rounded-lg bg-[var(--color-cream)]/40 border border-[var(--color-sand)] p-4">
              <div className="text-xs text-[var(--color-stone)]">Revenue</div>
              <div className="mt-1 text-2xl text-[var(--color-earth-dark)]">{loading ? '…' : formatCurrencyTHB(stats?.today_revenue ?? 0)}</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[var(--color-sand)] p-5 shadow-sm">
          <h2 className="text-lg text-[var(--color-earth-dark)] mb-4">Notes</h2>
          <div className="text-sm text-[var(--color-stone)] space-y-2">
            <p>
              Stats are loaded via <span className="text-[var(--color-earth-dark)]">get_dashboard_stats</span>.
            </p>
            <p>
              If you share your package CRUD RPC names, I’ll wire Packages management to use them too.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
