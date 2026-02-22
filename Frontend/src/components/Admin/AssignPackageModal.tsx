"use client";

import { useState, useEffect } from 'react';
import { X, Package, Calendar, Loader2 } from 'lucide-react';
import { supabase } from '@/utils/supabase/client';
import type { Database } from '@/types/database.types';
import { toast } from 'sonner';

interface AssignPackageModalProps {
  memberId: string;
  memberName: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface PackageOption {
  id: number;
  name: string;
  duration_days: number;
  credits: number | null;
  price: number | null;
}

export function AssignPackageModal({ memberId, memberName, onClose, onSuccess }: AssignPackageModalProps) {
  const [packages, setPackages] = useState<PackageOption[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('packages')
        .select('id, name, duration_days, credits, price')
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (error) {
        console.error('Package fetch error details:', JSON.stringify(error, null, 2));
        throw error;
      }

      setPackages(data || []);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      console.error('Package fetch error (full):', JSON.stringify(e, null, 2));
      console.error('Package fetch error (object):', e);
      toast.error(`Failed to load packages: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const calculateExpiryDate = (startDateStr: string, durationDays: number): string => {
    const start = new Date(startDateStr);
    const expiry = new Date(start);
    expiry.setDate(expiry.getDate() + durationDays);
    return expiry.toISOString().split('T')[0];
  };

  const selectedPackage = packages.find(p => p.id === selectedPackageId);
  const expiryDate = selectedPackage ? calculateExpiryDate(startDate, selectedPackage.duration_days) : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPackageId) {
      toast.error('Please select a package');
      return;
    }

    if (!startDate) {
      toast.error('Please select a start date');
      return;
    }

    setSubmitting(true);

    try {
      const pkg = packages.find(p => p.id === selectedPackageId);
      if (!pkg) throw new Error('Package not found');

      const expireAt = calculateExpiryDate(startDate, pkg.duration_days);

      // Ensure dates are ISO strings
      const startAtISO = new Date(startDate).toISOString();
      const expireAtISO = new Date(expireAt).toISOString();

      // Strict typing for insert payload
      const insertPayload: Database['public']['Tables']['user_packages']['Insert'] = {
        user_id: memberId,
        package_id: selectedPackageId,
        start_at: startAtISO,
        expire_at: expireAtISO,
        credits_remaining: pkg.credits
      };

      const { error } = await supabase
        .from('user_packages')
        .insert(insertPayload);

      if (error) throw error;

      toast.success(`Package "${pkg.name}" assigned to ${memberName}!`, { duration: 4000 });
      onSuccess();
      onClose();
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      toast.error(`Failed to assign package: ${message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-[var(--color-sand)] flex items-center justify-between">
          <div>
            <h2 className="text-2xl text-[var(--color-earth-dark)]">Assign Package</h2>
            <p className="text-sm text-[var(--color-stone)] mt-1">Assign a package to {memberName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--color-cream)] rounded-lg transition-colors"
          >
            <X size={24} className="text-[var(--color-stone)]" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={32} className="animate-spin text-[var(--color-sage)]" />
            </div>
          ) : (
            <>
              {/* Package Selection */}
              <div>
                <label className="block text-sm text-[var(--color-earth-dark)] mb-2">
                  Select Package <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  {packages.map((pkg) => (
                    <div
                      key={pkg.id}
                      onClick={() => setSelectedPackageId(pkg.id)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                        selectedPackageId === pkg.id
                          ? 'border-[var(--color-sage)] bg-[var(--color-sage)]/5'
                          : 'border-[var(--color-sand)] hover:border-[var(--color-sage)]/50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Package size={18} className="text-[var(--color-sage)]" />
                            <h3 className="text-[var(--color-earth-dark)] font-medium">{pkg.name}</h3>
                          </div>
                          <div className="text-sm text-[var(--color-stone)] space-y-1">
                            <p>Duration: {pkg.duration_days} days</p>
                            {pkg.credits && <p>Credits: {pkg.credits} classes</p>}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg text-[var(--color-earth-dark)] font-semibold">฿{pkg.price}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {packages.length === 0 && (
                  <p className="text-sm text-[var(--color-stone)] text-center py-4">
                    No active packages available
                  </p>
                )}
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm text-[var(--color-earth-dark)] mb-2">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-stone)]" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-[var(--color-sand)] rounded-lg focus:ring-2 focus:ring-[var(--color-sage)] focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Calculated Expiry Date */}
              {selectedPackage && expiryDate && (
                <div className="bg-[var(--color-cream)] rounded-lg p-4 border border-[var(--color-sand)]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[var(--color-stone)] mb-1">Package will expire on:</p>
                      <p className="text-lg text-[var(--color-earth-dark)] font-medium">
                        {new Date(expiryDate).toLocaleDateString('en-US', { 
                          month: 'long', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </p>
                    </div>
                    <Calendar size={24} className="text-[var(--color-sage)]" />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Footer */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-2 border border-[var(--color-sand)] text-[var(--color-stone)] rounded-lg hover:bg-[var(--color-cream)] transition-colors"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-2 bg-[var(--color-sage)] hover:bg-[var(--color-clay)] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={submitting || !selectedPackageId || !startDate}
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Assigning...</span>
                </>
              ) : (
                <span>Assign Package</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
