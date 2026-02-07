"use client";

import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { Package, Check, Star, ArrowRight, Loader2, Infinity } from 'lucide-react';

import { usePackages } from '../hooks';
import { SeedPackagesButton } from './SeedPackagesButton';
import type { Tables } from '../types/database.types';

type DbPackage = Tables<'packages'>;

interface PricingProps {
  isAuthenticated: boolean;
  initialPackages?: DbPackage[];
}

export function Pricing({ isAuthenticated, initialPackages }: PricingProps) {
  const router = useRouter();
  const { packages, loading, error } = usePackages({ activeOnly: true, initialPackages });

  // Debug logging
  console.log(' All Packages:', packages);
  console.log(' Package Count:', packages?.length || 0);

  // Categorize packages by type with safety checks
  const categorizedPackages = useMemo(() => {
    const safePackages = packages || [];
    console.log(' Safe Packages for filtering:', safePackages);

    const getEffectiveType = (pkg: DbPackage | null | undefined) => {
      const raw = (pkg as any)?.type;
      if (raw === 'credits' || raw === 'unlimited') return raw;
      const credits = (pkg as any)?.credits;
      if (typeof credits === 'number' && credits > 0) return 'credits';
      return 'unlimited';
    };

    const creditPacks = safePackages.filter((pkg) => {
      console.log(` Checking package: ${pkg?.name}, type: ${(pkg as any)?.type}`);
      return getEffectiveType(pkg) === 'credits';
    });

    const unlimitedPacks = safePackages.filter((pkg) => getEffectiveType(pkg) === 'unlimited');
    
    console.log(' Credit Packs:', creditPacks);
    console.log(' Unlimited Packs:', unlimitedPacks);
    
    return { creditPacks, unlimitedPacks };
  }, [packages]);

  const handleBuyClick = (packageId: number) => {
    if (isAuthenticated) {
      // Redirect to member dashboard with package ID to open modal
      router.push('/profile');
    } else {
      // Redirect to register page
      // Store intended package in sessionStorage for post-registration redirect
      sessionStorage.setItem('intendedPackage', packageId.toString());
      router.push('/login');
    }
  };

  const formatPrice = (price: number | null) => {
    return (price || 0).toLocaleString('en-US');
  };

  const isBestSeller = (pkg: DbPackage) => {
    // Mark 5-class or 10-class packages as best sellers
    return pkg?.credits === 5 || pkg?.credits === 10;
  };

  const getPackagePrice = (pkg: DbPackage): number => {
    return pkg?.price || 0;
  };

  const getEffectiveType = (pkg: DbPackage | null | undefined) => {
    const raw = (pkg as any)?.type;
    if (raw === 'credits' || raw === 'unlimited') return raw;
    const credits = (pkg as any)?.credits;
    if (typeof credits === 'number' && credits > 0) return 'credits';
    return 'unlimited';
  };

  const renderPackageCard = (pkg: DbPackage) => (
    <div
      key={pkg?.id}
      className={`relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group ${
        isBestSeller(pkg)
          ? 'ring-2 ring-[var(--color-sage)] transform hover:scale-105'
          : 'hover:-translate-y-2'
      }`}
    >
      {/* Best Seller Badge */}
      {isBestSeller(pkg) && (
        <div className="absolute top-0 right-0 bg-gradient-to-r from-[var(--color-sage)] to-[var(--color-clay)] text-white px-6 py-2 rounded-bl-2xl flex items-center gap-2 shadow-lg z-10">
          <Star size={16} fill="currentColor" />
          <span className="text-sm font-semibold">Recommended</span>
        </div>
      )}

      <div className="p-8">
        {/* Icon */}
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 ${
            isBestSeller(pkg)
              ? 'bg-gradient-to-br from-[var(--color-sage)] to-[var(--color-clay)]'
              : 'bg-[var(--color-sand)]'
          }`}
        >
          {getEffectiveType(pkg) === 'unlimited' ? (
            <Infinity
              size={32}
              className={isBestSeller(pkg) ? 'text-white' : 'text-[var(--color-earth-dark)]'}
            />
          ) : (
            <Package
              size={32}
              className={isBestSeller(pkg) ? 'text-white' : 'text-[var(--color-earth-dark)]'}
            />
          )}
        </div>

        {/* Package Name */}
        <h3 className="mb-6 text-[var(--color-earth-dark)]">
          {pkg?.name || 'Package'}
        </h3>

        {/* Price */}
        <div className="mb-6">
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold text-[var(--color-earth-dark)]">
              ฿{formatPrice(getPackagePrice(pkg))}
            </span>
          </div>
        </div>

        {/* Features */}
        <div className="space-y-3 mb-8">
          {getEffectiveType(pkg) === 'credits' ? (
            <>
              <div className="flex items-center gap-3 text-[var(--color-stone)]">
                <Check size={20} className="text-[var(--color-sage)] flex-shrink-0" />
                <span>{pkg?.credits || 0} {(pkg?.credits || 0) === 1 ? 'class' : 'classes'} included</span>
              </div>
              <div className="flex items-center gap-3 text-[var(--color-stone)]">
                <Check size={20} className="text-[var(--color-sage)] flex-shrink-0" />
                <span>Valid for {pkg?.duration_days || 30} days</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 text-[var(--color-stone)]">
                <Check size={20} className="text-[var(--color-sage)] flex-shrink-0" />
                <span>Unlimited classes</span>
              </div>
              <div className="flex items-center gap-3 text-[var(--color-stone)]">
                <Check size={20} className="text-[var(--color-sage)] flex-shrink-0" />
                <span>{pkg?.duration_days || 30}-day membership</span>
              </div>
            </>
          )}
          <div className="flex items-center gap-3 text-[var(--color-stone)]">
            <Check size={20} className="text-[var(--color-sage)] flex-shrink-0" />
            <span>All classes included</span>
          </div>
          <div className="flex items-center gap-3 text-[var(--color-stone)]">
            <Check size={20} className="text-[var(--color-sage)] flex-shrink-0" />
            <span>Book classes anytime</span>
          </div>
        </div>

        {/* Buy Now Button */}
        <button
          onClick={() => handleBuyClick(pkg.id)}
          className={`w-full py-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 group/btn shadow-md hover:shadow-lg ${
            isBestSeller(pkg)
              ? 'bg-gradient-to-r from-[var(--color-sage)] to-[var(--color-clay)] text-white hover:opacity-90'
              : 'bg-[var(--color-sage)] text-white hover:bg-[var(--color-clay)]'
          }`}
        >
          <span className="font-semibold text-lg">
            {isAuthenticated ? 'Buy Now' : 'Sign Up to Buy'}
          </span>
          <ArrowRight
            size={20}
            className="group-hover/btn:translate-x-1 transition-transform"
          />
        </button>

        {!isAuthenticated && (
          <p className="text-xs text-center text-[var(--color-stone)] mt-3">
            Create an account to purchase
          </p>
        )}
      </div>
    </div>
  );

  return (
    <section className="py-20 px-6 bg-gradient-to-b from-white to-[var(--color-cream)]">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="mb-4 text-[var(--color-earth-dark)]">
            Class Packages & Pricing
          </h1>
          <p className="text-[var(--color-stone)] max-w-2xl mx-auto text-lg">
            Choose the perfect package for your yoga journey. All packages include access to our full class schedule.
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 size={48} className="text-[var(--color-sage)] animate-spin mb-4" />
            <p className="text-[var(--color-stone)]">Loading packages...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center max-w-md mx-auto">
            <p className="text-red-800">Failed to load packages. Please try again later.</p>
          </div>
        )}

        {/* Class Packs Section */}
        {!loading && !error && categorizedPackages.creditPacks.length > 0 && (
          <div className="mb-16">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-[var(--color-earth-dark)] mb-2">Class Packs</h2>
              <p className="text-[var(--color-stone)]">Purchase credits and use them for any class</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Static Drop-in Card */}
              <div className="relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group hover:-translate-y-2">
                <div className="p-8">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6 bg-[var(--color-sand)]">
                    <Package size={32} className="text-[var(--color-earth-dark)]" />
                  </div>
                  <h3 className="mb-6 text-[var(--color-earth-dark)]">Drop-in</h3>
                  <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold text-[var(--color-earth-dark)]">฿400</span>
                    </div>
                  </div>
                  <div className="space-y-3 mb-8">
                    <div className="flex items-center gap-3 text-[var(--color-stone)]">
                      <Check size={20} className="text-[var(--color-sage)] flex-shrink-0" />
                      <span>Single class access</span>
                    </div>
                    <div className="flex items-center gap-3 text-[var(--color-stone)]">
                      <Check size={20} className="text-[var(--color-sage)] flex-shrink-0" />
                      <span>Valid for 1 day</span>
                    </div>
                    <div className="flex items-center gap-3 text-[var(--color-stone)]">
                      <Check size={20} className="text-[var(--color-sage)] flex-shrink-0" />
                      <span>Pay at studio</span>
                    </div>
                    <div className="flex items-center gap-3 text-[var(--color-stone)]">
                      <Check size={20} className="text-[var(--color-sage)] flex-shrink-0" />
                      <span>No commitment required</span>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push('/schedule')}
                    className="w-full py-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 group/btn shadow-md hover:shadow-lg bg-[var(--color-sage)] text-white hover:bg-[var(--color-clay)]"
                  >
                    <span className="font-semibold text-lg">Book Now</span>
                    <ArrowRight size={20} className="group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
              
              {categorizedPackages.creditPacks.map(renderPackageCard)}
            </div>
          </div>
        )}

        {/* Unlimited Memberships Section */}
        {!loading && !error && categorizedPackages.unlimitedPacks.length > 0 && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-[var(--color-earth-dark)] mb-2">Unlimited Memberships</h2>
              <p className="text-[var(--color-stone)]">Attend as many classes as you want</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {categorizedPackages.unlimitedPacks.map(renderPackageCard)}
            </div>
          </div>
        )}

        {/* No Packages Available */}
        {!loading && !error && packages.length === 0 && (
          <>
            <div className="text-center py-20">
              <Package size={64} className="text-[var(--color-stone)] mx-auto mb-4 opacity-50" />
              <h3 className="mb-2 text-[var(--color-earth-dark)]">
                No Packages Available
              </h3>
              <p className="text-[var(--color-stone)]">
                Check back soon for our class packages!
              </p>
            </div>
            
            {/* Seed Button - Development Helper */}
            <SeedPackagesButton />
          </>
        )}

        {/* Additional Info */}
        <div className="mt-16 bg-white rounded-2xl shadow-md p-8 max-w-4xl mx-auto">
          <h3 className="mb-6 text-center text-[var(--color-earth-dark)]">
            Frequently Asked Questions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-[var(--color-earth-dark)] mb-2">
                How do class credits work?
              </h4>
              <p className="text-sm text-[var(--color-stone)]">
                Each class booking uses one credit from your package. Credits are valid for the number of days specified in your package.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-[var(--color-earth-dark)] mb-2">
                Can I share my package?
              </h4>
              <p className="text-sm text-[var(--color-stone)]">
                Packages are non-transferable and can only be used by the purchaser. Each person needs their own package.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-[var(--color-earth-dark)] mb-2">
                What payment methods do you accept?
              </h4>
              <p className="text-sm text-[var(--color-stone)]">
                We accept bank transfers and cash payments at the studio. Contact us via WhatsApp or Instagram for cash payments.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-[var(--color-earth-dark)] mb-2">
                Can I get a refund?
              </h4>
              <p className="text-sm text-[var(--color-stone)]">
                Packages are non-refundable but can be paused in case of medical emergencies with valid documentation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}