"use client";

import { useState } from 'react';
import { Upload, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { PaymentSlipUpload } from '@/components/packages/PaymentSlipUpload';
import { supabase } from '@/utils/supabase/client';
import { toast } from 'sonner';
import type { Tables } from '@/types/database.types';

type PackageRow = Tables<'packages'>;
type UserPackageRow = Tables<'user_packages'>;
type UserPackageWithPackage = UserPackageRow & { packages: PackageRow | null };

interface MyPackagesClientProps {
  userPackages: UserPackageWithPackage[];
  userId: string;
}

export function MyPackagesClient({ userPackages: initialPackages, userId }: MyPackagesClientProps) {
  const [userPackages, setUserPackages] = useState(initialPackages);
  const [uploadingPackageId, setUploadingPackageId] = useState<number | null>(null);
  const [reuploadingPackageId, setReuploadingPackageId] = useState<number | null>(null);

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleSlipUpload = async (packageId: number, slipUrl: string) => {
    try {
      const { error } = await supabase
        .from('user_packages')
        .update({
          payment_slip_url: slipUrl,
          payment_status: 'partial' // Back to pending verification
        })
        .eq('id', packageId);

      if (error) throw error;

      // Update local state
      setUserPackages(prev => prev.map(pkg => 
        pkg.id === packageId 
          ? { ...pkg, payment_slip_url: slipUrl, payment_status: 'partial' }
          : pkg
      ));

      toast.success('Payment slip uploaded! Awaiting admin verification.');
      setUploadingPackageId(null);
      setReuploadingPackageId(null);
    } catch (error: any) {
      console.error('Error uploading slip:', error);
      toast.error(error.message || 'Failed to upload slip');
    }
  };

  const handleSlipDelete = async (packageId: number) => {
    try {
      const { error } = await supabase
        .from('user_packages')
        .update({
          payment_slip_url: null,
          payment_status: 'unpaid'
        })
        .eq('id', packageId);

      if (error) throw error;

      // Update local state
      setUserPackages(prev => prev.map(pkg => 
        pkg.id === packageId 
          ? { ...pkg, payment_slip_url: null, payment_status: 'unpaid' }
          : pkg
      ));

      toast.success('Payment slip removed');
    } catch (error: any) {
      console.error('Error deleting slip:', error);
      toast.error(error.message || 'Failed to delete slip');
    }
  };

  const getPaymentStatusBadge = (pkg: UserPackageWithPackage) => {
    const { payment_status, status } = pkg;

    // Priority 1: Check status first - if active, show green regardless of payment_status
    if (status === 'active') {
      return {
        label: 'Active',
        color: 'bg-green-100 text-green-800 border-green-200',
      };
    }

    // Priority 2: Check payment_status only if NOT active
    if (payment_status === 'paid') {
      return {
        label: 'Paid',
        color: 'bg-green-100 text-green-800 border-green-200',
      };
    }

    if (payment_status === 'partial') {
      return {
        label: 'Verifying',
        color: 'bg-blue-100 text-blue-800 border-blue-200',
      };
    }

    if (payment_status === 'rejected') {
      return {
        label: 'Rejected',
        color: 'bg-red-100 text-red-800 border-red-200',
      };
    }

    if (payment_status === 'unpaid') {
      return {
        label: 'Unpaid',
        color: 'bg-orange-100 text-orange-800 border-orange-200',
      };
    }

    return {
      label: 'Pending',
      color: 'bg-gray-100 text-gray-800 border-gray-200',
    };
  };

  const needsPaymentAction = (pkg: UserPackageWithPackage) => {
    return pkg.payment_status === 'rejected' || pkg.payment_status === 'partial' || pkg.payment_status === 'unpaid';
  };

  if (userPackages.length === 0) {
    return (
      <div className="text-[var(--color-stone)] bg-[var(--color-cream)]/40 border border-[var(--color-sand)] rounded-xl p-6">
        No packages yet. Visit the "Buy Bundles" tab to purchase a package.
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {userPackages.map((pkg) => {
          const badge = getPaymentStatusBadge(pkg);
          const showReupload = needsPaymentAction(pkg);
          const amountPaid = pkg.amount_paid || 0;
          const amountDue = pkg.amount_due || 0;
          const remaining = amountDue - amountPaid;

          return (
            <div
              key={pkg.id}
              className="p-4 border border-[var(--color-sand)] rounded-xl hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="text-[var(--color-earth-dark)] font-medium">
                      {pkg.packages?.name ?? 'Package'}
                    </div>
                    <span className={`inline-block px-2 py-0.5 text-xs rounded border ${badge.color}`}>
                      {badge.label}
                    </span>
                  </div>

                  <div className="text-sm text-[var(--color-stone)] space-y-1">
                    <div>Expires: {formatDateTime(pkg.expire_at)}</div>
                    <div>Status: <span className="font-medium">{pkg.status}</span></div>
                    
                    {/* Payment Info */}
                    {showReupload && (
                      <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded">
                        <div className="text-xs text-orange-800">
                          <div className="font-semibold mb-1">Payment Status:</div>
                          <div>Amount Due: ฿{amountDue.toLocaleString()}</div>
                          <div>Amount Paid: ฿{amountPaid.toLocaleString()}</div>
                          {remaining > 0 && (
                            <div className="font-semibold text-orange-900">
                              Remaining: ฿{remaining.toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {pkg.payment_slip_url && (
                      <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle size={14} />
                        Payment slip uploaded
                      </div>
                    )}

                    {pkg.payment_status === 'rejected' && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                        <div className="text-xs text-red-800 flex items-start gap-1">
                          <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                          <span>Your payment slip was rejected. Please upload a new one.</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Re-upload Button */}
                  {showReupload && (
                    <button
                      onClick={() => setUploadingPackageId(pkg.id)}
                      className="mt-3 flex items-center gap-2 px-4 py-2 bg-[var(--color-sage)] hover:bg-[var(--color-clay)] text-white rounded-lg transition-colors text-sm"
                    >
                      <Upload size={16} />
                      {pkg.payment_status === 'rejected' ? 'Re-upload Slip' : pkg.payment_slip_url ? 'Update Slip' : 'Upload Slip'}
                    </button>
                  )}
                </div>

                {pkg.credits_remaining !== null && (
                  <div className="text-right">
                    <div className="text-sm text-[var(--color-stone)]">Credits</div>
                    <div className="text-2xl text-[var(--color-earth-dark)]">
                      {pkg.credits_remaining}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Upload Modal */}
      {uploadingPackageId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-[var(--color-earth-dark)] mb-4">
              Upload Payment Slip
            </h3>
            <PaymentSlipUpload
              onUploadComplete={(url) => handleSlipUpload(uploadingPackageId, url)}
              currentSlipUrl={userPackages.find(p => p.id === uploadingPackageId)?.payment_slip_url || undefined}
              userId={userId}
              onDelete={() => handleSlipDelete(uploadingPackageId)}
              showPaymentInfo={true}
            />
            <button
              onClick={() => setUploadingPackageId(null)}
              className="mt-4 w-full px-4 py-2 border-2 border-[var(--color-sand)] hover:border-[var(--color-sage)] text-[var(--color-earth-dark)] rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
