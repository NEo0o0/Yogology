'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/utils/supabase/client';
import type { Tables } from '@/types/database.types';

type PackageRow = Tables<'packages'>;

function formatCurrencyTHB(value: number | null) {
  const safe = typeof value === 'number' ? value : 0;
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    maximumFractionDigits: 0,
  }).format(safe);
}

function formatPackageType(pkg: PackageRow) {
  if (pkg.type === 'credit') return 'Credits';
  if (pkg.type === 'unlimited') return 'Unlimited';
  return pkg.type ? String(pkg.type) : 'Unknown';
}

export function AdminPackagesClient() {
  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const fetchPackages = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('packages')
        .select('*')
        .order('is_active', { ascending: false })
        .order('price', { ascending: true });

      if (fetchError) throw fetchError;

      setPackages(Array.isArray(data) ? (data as PackageRow[]) : []);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return packages;
    return packages.filter((p) => {
      const name = (p.name ?? '').toLowerCase();
      const type = String(p.type ?? '').toLowerCase();
      return name.includes(q) || type.includes(q);
    });
  }, [packages, query]);

  const toggleActive = async (pkg: PackageRow) => {
    if (typeof pkg.id !== 'number') return;

    setSavingId(pkg.id);
    setError(null);

    try {
      const next = !pkg.is_active;

      const { data, error: updateError } = await supabase
        .from('packages')
        .update({ is_active: next })
        .eq('id', pkg.id)
        .select('*')
        .single();

      if (updateError) throw updateError;

      setPackages((prev) => prev.map((p) => (p.id === pkg.id ? (data as PackageRow) : p)));
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setError(message);
    } finally {
      setSavingId(null);
    }
  };

  const deletePackage = async (pkg: PackageRow) => {
    if (typeof pkg.id !== 'number') return;

    const ok = window.confirm(`Delete package "${pkg.name ?? pkg.id}"? This cannot be undone.`);
    if (!ok) return;

    setDeletingId(pkg.id);
    setError(null);

    try {
      const { error: deleteError } = await supabase.from('packages').delete().eq('id', pkg.id);
      if (deleteError) throw deleteError;

      setPackages((prev) => prev.filter((p) => p.id !== pkg.id));
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setError(message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl text-[var(--color-earth-dark)] mb-1">Packages</h1>
          <p className="text-[var(--color-stone)]">Manage pricing packages. Changes apply immediately.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchPackages}
            className="px-4 py-2 rounded-lg border border-[var(--color-sand)] text-[var(--color-earth-dark)] hover:bg-[var(--color-cream)]/60 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search packages by name or type…"
          className="w-full max-w-md px-4 py-2 rounded-lg border border-[var(--color-sand)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-sage)]/40"
        />
      </div>

      {error ? (
        <div className="mb-4 p-4 rounded-xl border border-red-200 bg-red-50 text-red-700">
          {error}
        </div>
      ) : null}

      <div className="bg-white rounded-2xl shadow-sm border border-[var(--color-sand)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[var(--color-cream)]/50 border-b border-[var(--color-sand)]">
              <tr className="text-left text-[var(--color-stone)]">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Price</th>
                <th className="px-5 py-3 font-medium">Duration</th>
                <th className="px-5 py-3 font-medium">Credits</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-6 text-[var(--color-stone)]">
                    Loading packages…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-6 text-[var(--color-stone)]">
                    No packages found.
                  </td>
                </tr>
              ) : (
                filtered.map((pkg) => (
                  <tr key={pkg.id} className="border-b border-[var(--color-sand)] last:border-b-0">
                    <td className="px-5 py-4">
                      <div className="text-[var(--color-earth-dark)] font-medium">{pkg.name}</div>
                    </td>
                    <td className="px-5 py-4 text-[var(--color-earth-dark)]">{formatPackageType(pkg)}</td>
                    <td className="px-5 py-4 text-[var(--color-earth-dark)]">{formatCurrencyTHB(pkg.price)}</td>
                    <td className="px-5 py-4 text-[var(--color-earth-dark)]">{pkg.duration_days ? `${pkg.duration_days} days` : '—'}</td>
                    <td className="px-5 py-4 text-[var(--color-earth-dark)]">{pkg.credits ?? '—'}</td>
                    <td className="px-5 py-4">
                      {pkg.is_active ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-[var(--color-sage)]/15 text-[var(--color-sage)] border border-[var(--color-sage)]/30">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-[var(--color-cream)] text-[var(--color-stone)] border border-[var(--color-sand)]">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => toggleActive(pkg)}
                          disabled={savingId === pkg.id || deletingId === pkg.id}
                          className="px-3 py-2 rounded-lg border border-[var(--color-sand)] text-[var(--color-earth-dark)] hover:bg-[var(--color-cream)]/60 transition-colors disabled:opacity-60"
                        >
                          {savingId === pkg.id ? 'Saving…' : pkg.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          type="button"
                          onClick={() => deletePackage(pkg)}
                          disabled={savingId === pkg.id || deletingId === pkg.id}
                          className="px-3 py-2 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 transition-colors disabled:opacity-60"
                        >
                          {deletingId === pkg.id ? 'Deleting…' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 text-xs text-[var(--color-stone)]">
        If you want package changes to go through RPCs (recommended for business rules), send me the RPC names for:
        list, create, update, delete.
      </div>
    </section>
  );
}
