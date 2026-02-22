"use client";

import { Calendar, Clock, MapPin, Check, Camera } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTeacherTraining } from '@/hooks/useTeacherTraining';
import { TrainingDetailModal } from '@/components/bookings/TrainingDetailModal';
import { GalleryManagementModal } from '@/components/admin/GalleryManagementModal';
import { useAuth } from '@/hooks/useAuth';
import type { Tables } from '@/types/database.types';

type Training = Tables<'classes'> & {
  early_bird_price: number | null;
  early_bird_deadline: string | null;
  registration_opens_at: string | null;
};

function formatDateRange(startsAt: string, endsAt: string | null) {
  const start = new Date(startsAt);
  const end = new Date(endsAt ?? startsAt);

  const sameYear = start.getFullYear() === end.getFullYear();
  const sameMonth = sameYear && start.getMonth() === end.getMonth();

  const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
  const endMonth = end.toLocaleDateString('en-US', { month: 'short' });

  if (sameMonth) {
    return `${startMonth} ${start.getDate()} - ${end.getDate()}, ${start.getFullYear()}`;
  }

  if (sameYear) {
    return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}, ${start.getFullYear()}`;
  }

  return `${startMonth} ${start.getDate()}, ${start.getFullYear()} - ${endMonth} ${end.getDate()}, ${end.getFullYear()}`;
}

function formatMoney(amount: number | null | undefined) {
  if (!amount || amount === 0) return 'Free';
  return `฿${amount.toLocaleString()}`;
}

function formatSessionLabel(startsAt: string) {
  const start = new Date(startsAt);
  return start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function SchedulePricing({ 
  upcomingTraining, 
  allTrainings 
}: { 
  upcomingTraining: Training | null;
  allTrainings?: Training[];
}) {
  const [selectedTraining, setSelectedTraining] = useState<Training | null>(null);
  const [editingGallery, setEditingGallery] = useState<Training | null>(null);
  const { profile, isStaff } = useAuth();
  // Use allTrainings if provided, otherwise fallback to single upcomingTraining
  const trainings = allTrainings && allTrainings.length > 0 ? allTrainings : (upcomingTraining ? [upcomingTraining] : []);

  const now = useMemo(() => new Date(), []);

  const standardTraining = trainings[0] ?? null;

  const earlyBirdTraining = useMemo(() => {
    return (
      trainings.find((t: Training) => {
        if (t.early_bird_price == null) return false;
        if (!t.early_bird_deadline) return false;
        const deadline = new Date(t.early_bird_deadline);
        if (Number.isNaN(deadline.getTime())) return false;
        return now <= deadline;
      }) ?? null
    );
  }, [now, trainings]);

  const paymentPlanTotal = useMemo(() => {
    if (!standardTraining?.price) return null;
    return Math.round(standardTraining.price * 1.1);
  }, [standardTraining?.price]);

  const paymentPlanMonthly = useMemo(() => {
    if (!paymentPlanTotal) return null;
    return Math.round(paymentPlanTotal / 4);
  }, [paymentPlanTotal]);

  return (
    <>
      <section className="py-20 px-6 bg-[var(--color-cream)]">
        <div className="max-w-6xl mx-auto">
          {/* Schedule Section */}
          <div className="mb-20">
            <div className="text-center mb-12">
              <h2 className="mb-4 text-[var(--color-earth-dark)]">Upcoming Sessions</h2>
              <p className="text-[var(--color-stone)] max-w-2xl mx-auto">
                Choose the session that fits your schedule. All sessions meet on weekends to accommodate working professionals.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {trainings.map((training: Training) => {
                const spotsRemaining = training.capacity - training.booked_count;
                const registrationOpensAt = training.registration_opens_at
                  ? new Date(training.registration_opens_at)
                  : null;
                const earlyBirdDeadline = training.early_bird_deadline
                  ? new Date(training.early_bird_deadline)
                  : null;

                const badgeLabel = (() => {
                  if (registrationOpensAt && now < registrationOpensAt) return 'Coming Soon';
                  if (earlyBirdDeadline && now <= earlyBirdDeadline) return 'Early Bird';
                  return null;
                })();

                return (
                  <div
                    key={training.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedTraining(training)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedTraining(training);
                      }
                    }}
                    className="bg-white rounded-lg shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 text-left overflow-hidden cursor-pointer"
                  >
                    {/* Cover Image */}
                    {training.cover_image_url ? (
                      <div className="relative w-full h-48">
                        <img
                          src={training.cover_image_url}
                          alt={training.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        {/* Admin Edit Gallery Button */}
                        {isStaff && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingGallery(training);
                            }}
                            className="absolute top-3 left-3 p-2 bg-white/95 hover:bg-white backdrop-blur-sm rounded-full shadow-lg transition-all duration-200 hover:scale-110 group"
                            title="Edit Cover Image"
                          >
                            <Camera size={18} className="text-[var(--color-sage)] group-hover:text-[var(--color-clay)]" />
                          </button>
                        )}
                        {badgeLabel && (
                          <span
                            className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs backdrop-blur-sm ${
                              badgeLabel === 'Early Bird'
                                ? 'bg-[var(--color-terracotta)]/90 text-white'
                                : 'bg-white/90 text-[var(--color-stone)]'
                            }`}
                          >
                            {badgeLabel}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="relative w-full h-48 bg-gradient-to-br from-[var(--color-sage)] to-[var(--color-clay)]">
                        {/* Admin Edit Gallery Button */}
                        {isStaff && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingGallery(training);
                            }}
                            className="absolute top-3 left-3 p-2 bg-white/95 hover:bg-white backdrop-blur-sm rounded-full shadow-lg transition-all duration-200 hover:scale-110 group"
                            title="Edit Cover Image"
                          >
                            <Camera size={18} className="text-[var(--color-sage)] group-hover:text-[var(--color-clay)]" />
                          </button>
                        )}
                        {badgeLabel && (
                          <span
                            className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs backdrop-blur-sm ${
                              badgeLabel === 'Early Bird'
                                ? 'bg-[var(--color-terracotta)]/90 text-white'
                                : 'bg-white/90 text-[var(--color-stone)]'
                            }`}
                          >
                            {badgeLabel}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Card Content */}
                    <div className="p-6">
                      {/* Title */}
                      <div className="mb-4">
                        <span className="text-2xl text-[var(--color-earth-dark)]">{training.title}</span>
                      </div>

                    {/* Dates */}
                    <div className="space-y-3 mb-4">
                      <div className="flex items-start gap-3">
                        <Calendar size={18} className="text-[var(--color-clay)] mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-sm text-[var(--color-stone)]">Dates</div>
                          <div className="text-[var(--color-earth-dark)]">
                            {formatDateRange(training.starts_at, training.ends_at)}
                            <span className="text-sm text-[var(--color-stone)] ml-2">(Sundays off)</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Clock size={18} className="text-[var(--color-clay)] mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-sm text-[var(--color-stone)]">Schedule</div>
                          <div className="text-[var(--color-earth-dark)] text-sm">Daily (Sundays off)</div>
                        </div>
                      </div>
                    </div>

                    {/* Availability */}
                    <div className="pt-4 border-t border-[var(--color-sand)]">
                      <div className="text-sm text-[var(--color-stone)]">{spotsRemaining} spots remaining</div>
                    </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Location */}
            <div className="mt-8 flex items-center justify-center gap-2 text-[var(--color-stone)]">
              <MapPin size={18} className="text-[var(--color-clay)]" />
              <span>Annie Bliss Yoga Studio, Downtown Location</span>
            </div>
          </div>

          {/* Pricing Section */}
          <div>
            <div className="text-center mb-12">
              <h2 className="mb-4 text-[var(--color-earth-dark)]">Investment & Pricing</h2>
              <p className="text-[var(--color-stone)] max-w-2xl mx-auto">
                Choose the payment option that works best for you. All packages include the same comprehensive training.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {/* Early Bird */}
              {earlyBirdTraining?.early_bird_price != null && (
                <div className="bg-white rounded-lg p-8 shadow-lg transition-all duration-300 relative ring-2 ring-[var(--color-sage)] md:-translate-y-2 hover:shadow-2xl">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-block px-4 py-1 bg-[var(--color-sage)] text-white text-xs rounded-full shadow-lg">
                      Best Value
                    </span>
                  </div>

                  <h3 className="mb-2 text-center text-[var(--color-earth-dark)]">Early Bird</h3>

                  {standardTraining && earlyBirdTraining.id !== standardTraining.id && (
                    <div className="text-center mb-3">
                      <span className="inline-block px-3 py-1 rounded-full text-xs bg-[var(--color-sand)] text-[var(--color-stone)]">
                        For {formatSessionLabel(earlyBirdTraining.starts_at)} Session
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-4">
                    <div className="flex items-center justify-center gap-2">
                      {earlyBirdTraining.price != null && (
                        <span className="text-lg text-[var(--color-stone)]/70 line-through decoration-[var(--color-stone)]/40 decoration-1">
                          {formatMoney(earlyBirdTraining.price)}
                        </span>
                      )}
                      <span className="text-4xl text-[var(--color-earth-dark)]">
                        {formatMoney(earlyBirdTraining.early_bird_price)}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-[var(--color-stone)] text-center mb-6 h-12">
                    Save{' '}
                    {earlyBirdTraining.price != null
                      ? formatMoney(earlyBirdTraining.price - earlyBirdTraining.early_bird_price)
                      : ''}{' '}
                    when you pay in full before{' '}
                    {earlyBirdTraining.early_bird_deadline
                      ? new Date(earlyBirdTraining.early_bird_deadline).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : 'the deadline'}
                    .
                  </p>

                  <div className="space-y-3 mb-6">
                    {[
                      'Complete 200-hour program',
                      'All training materials included',
                      'Yoga Alliance certification',
                      'Lifetime alumni support',
                      'Course manual & textbooks',
                    ].map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <Check size={18} className="text-[var(--color-sage)] mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-[var(--color-stone)]">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-[var(--color-sand)] my-6" />

                  <button
                    disabled={!earlyBirdTraining}
                    onClick={() => earlyBirdTraining && setSelectedTraining(earlyBirdTraining)}
                    className="w-full bg-[var(--color-sage)] hover:bg-[var(--color-clay)] disabled:opacity-50 disabled:hover:bg-[var(--color-sage)] text-white py-3 rounded-lg transition-all duration-300"
                  >
                    View Details
                  </button>
                </div>
              )}

              {/* Standard */}
              <div className="bg-white rounded-lg p-8 shadow-lg transition-all duration-300 relative hover:shadow-xl">
                <h3 className="mb-2 text-center text-[var(--color-earth-dark)]">Standard</h3>

                <div className="text-center mb-4">
                  <span className="text-4xl text-[var(--color-earth-dark)]">
                    {formatMoney(standardTraining?.price ?? null)}
                  </span>
                </div>

                <p className="text-sm text-[var(--color-stone)] text-center mb-6 h-12">
                  Full tuition for the teacher training program.
                </p>

                <div className="space-y-3 mb-6">
                  {[
                    'Complete 200-hour program',
                    'All training materials included',
                    'Yoga Alliance certification',
                    'Lifetime alumni support',
                    'Course manual & textbooks',
                  ].map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <Check size={18} className="text-[var(--color-sage)] mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-[var(--color-stone)]">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-[var(--color-sand)] my-6" />

                <button
                  disabled={!standardTraining}
                  onClick={() => standardTraining && setSelectedTraining(standardTraining)}
                  className="w-full bg-[var(--color-earth-dark)] hover:bg-[var(--color-clay)] disabled:opacity-50 disabled:hover:bg-[var(--color-earth-dark)] text-white py-3 rounded-lg transition-all duration-300"
                >
                  View Details
                </button>
              </div>

              {/* Payment Plan - HIDDEN per user request */}
            </div>

            {/* Additional Info */}
            <div className="mt-8 text-center text-sm text-[var(--color-stone)] bg-white p-6 rounded-lg">
              <p>
                <strong className="text-[var(--color-earth-dark)]">Included in all packages:</strong> Course manual, recommended reading materials, 
                unlimited studio classes during training period, post-graduation mentorship, and continuing education discounts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Training Detail Modal */}
      {selectedTraining && (
        <TrainingDetailModal
          training={selectedTraining}
          onClose={() => setSelectedTraining(null)}
        />
      )}

      {/* Gallery Management Modal for Admin */}
      {editingGallery && (
        <GalleryManagementModal
          workshopId={editingGallery.id}
          workshopTitle={editingGallery.title}
          currentGalleryImages={editingGallery.gallery_images}
          currentCoverImage={editingGallery.cover_image_url}
          onClose={() => setEditingGallery(null)}
          onSuccess={() => {
            // Refresh the page to show updated image
            window.location.reload();
          }}
        />
      )}
    </>
  );
}
