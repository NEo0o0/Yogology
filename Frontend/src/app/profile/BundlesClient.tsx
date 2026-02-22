"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, CheckCircle } from 'lucide-react';
import { PaymentMethodSelector } from '@/components/packages/PaymentMethodSelector';
import { sendBundlePurchaseEmail } from '@/utils/emailHelpers';
import type { Tables } from '@/types/database.types';

type PackageRow = Tables<'packages'>;
type UserPackageRow = Tables<'user_packages'>;
type UserPackageWithPackage = UserPackageRow & { packages: PackageRow | null };

interface BundlesClientProps {
  bundles: PackageRow[];
  activePackages: UserPackageWithPackage[];
  userId: string;
}

export function BundlesClient({ bundles, activePackages, userId }: BundlesClientProps) {
  const router = useRouter();
  const [selectedBundle, setSelectedBundle] = useState<PackageRow | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [userFullName, setUserFullName] = useState<string>('');

  // Fetch user full name for WhatsApp message
  useEffect(() => {
    const fetchUserName = async () => {
      const { supabase } = await import('@/utils/supabase/client');
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.full_name) {
        setUserFullName(user.user_metadata.full_name);
      }
    };
    fetchUserName();
  }, []);

  // Check if user has an active unlimited package (blocks ALL purchases)
  const hasActiveUnlimitedPackage = () => {
    return activePackages.some(pkg => {
      if (!pkg.packages) return false;
      return pkg.status === 'active' && pkg.packages.type === 'unlimited';
    });
  };

  // Check if user has an active package of the same type
  const hasActivePackageOfType = (packageType: 'credit' | 'unlimited') => {
    // If user has active unlimited package, block all purchases
    if (hasActiveUnlimitedPackage()) {
      return true;
    }

    return activePackages.some(pkg => {
      if (!pkg.packages) return false;
      // Check if package is active and same type
      if (pkg.status !== 'active') return false;
      if (pkg.packages.type !== packageType) return false;
      // For credit packages, check if they have remaining credits
      if (packageType === 'credit') {
        return (pkg.credits_remaining ?? 0) > 0;
      }
      // For unlimited packages, just check if active
      return true;
    });
  };

  const handleBuyClick = (bundle: PackageRow) => {
    setSelectedBundle(bundle);
    setShowPaymentModal(true);
  };

  const handlePaymentSelect = async (
    method: 'package' | 'cash' | 'bank_transfer' | 'promptpay',
    paymentNote?: string,
    slipUrl?: string
  ) => {
    if (!selectedBundle) return;

    try {
      setPurchasing(true);

      const response = await fetch('/api/packages/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: selectedBundle.id,
          paymentMethod: method,
          paymentNote,
          paymentSlipUrl: slipUrl
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to purchase bundle');
      }

      // Send bundle purchase confirmation email
      const { supabase } = await import('@/utils/supabase/client');
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user?.email) {
        sendBundlePurchaseEmail(
          user.email,
          user.user_metadata?.full_name || user.email,
          selectedBundle,
          method
        ).catch(err => {
          console.error('Failed to send bundle purchase email:', err);
        });
      }

      setShowPaymentModal(false);
      setSelectedBundle(null);
      router.refresh();
    } catch (error: any) {
      console.error('Bundle purchase error:', error);
      alert(error.message || 'Failed to purchase bundle');
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <>
      <div className="space-y-4">
        {bundles.length === 0 ? (
          <div className="text-[var(--color-stone)] bg-[var(--color-cream)]/40 border border-[var(--color-sand)] rounded-xl p-6">
            No bundles available.
          </div>
        ) : (
          bundles.map((pkg) => {
            const hasActive = hasActivePackageOfType(pkg.type);
            const isDisabled = hasActive;

            return (
              <div
                key={pkg.id}
                className="p-4 border border-[var(--color-sand)] rounded-xl hover:shadow-md transition-all duration-300"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="text-[var(--color-earth-dark)] font-medium">
                      {pkg.name}
                    </div>
                    <div className="text-sm text-[var(--color-stone)] mt-1">
                      {pkg.type === 'credit'
                        ? `${pkg.credits ?? 0} class credits`
                        : `Unlimited for ${pkg.duration_days} days`}
                      {pkg.price ? ` • ฿${pkg.price.toLocaleString()}` : ''}
                    </div>
                    {hasActive && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-green-700">
                        <CheckCircle size={14} />
                        <span>
                          {hasActiveUnlimitedPackage() && pkg.type !== 'unlimited'
                            ? 'You have an active Unlimited package'
                            : `You have an active ${pkg.type} package`}
                        </span>
                      </div>
                    )}
                  </div>

                  {isDisabled ? (
                    <button
                      disabled
                      className="px-4 py-2 bg-gray-200 text-gray-500 rounded-lg cursor-not-allowed"
                    >
                      Currently Active
                    </button>
                  ) : (
                    <button
                      onClick={() => handleBuyClick(pkg)}
                      className="flex items-center gap-2 px-4 py-2 bg-[var(--color-sage)] text-white rounded-lg hover:bg-[var(--color-clay)] transition-all duration-300"
                    >
                      <ShoppingCart size={16} />
                      Buy Bundle
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}

        <div className="text-xs text-[var(--color-stone)] mt-2">
          💡 Drop-in payments happen during booking in the Schedule flow.
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedBundle && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[var(--color-sand)]">
              <h3 className="text-xl font-bold text-[var(--color-earth-dark)]">
                Purchase Bundle
              </h3>
              <p className="text-sm text-[var(--color-stone)] mt-1">
                {selectedBundle.name}
              </p>
            </div>

            <div className="p-6">
              <div className="mb-6 p-4 bg-[var(--color-cream)] rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-[var(--color-stone)]">Package Details</div>
                    <div className="font-semibold text-[var(--color-earth-dark)] mt-1">
                      {selectedBundle.type === 'credit'
                        ? `${selectedBundle.credits} class credits`
                        : `Unlimited classes for ${selectedBundle.duration_days} days`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-[var(--color-stone)]">Total</div>
                    <div className="text-2xl font-bold text-[var(--color-earth-dark)]">
                      ฿{selectedBundle.price?.toLocaleString() || '0'}
                    </div>
                  </div>
                </div>
              </div>

              <PaymentMethodSelector
                hasActivePackage={false}
                classPrice={selectedBundle.price || 0}
                isWorkshop={false}
                isBundle={true}
                itemName={selectedBundle.name}
                onSelect={handlePaymentSelect}
                userId={userId}
                userFullName={userFullName}
              />

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  💡 <strong>Note:</strong> Your package will be activated after admin verifies your payment.
                  You'll receive a confirmation once approved.
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-[var(--color-sand)] flex gap-3">
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedBundle(null);
                }}
                disabled={purchasing}
                className="flex-1 px-4 py-3 border-2 border-[var(--color-sand)] rounded-lg hover:border-[var(--color-sage)] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
