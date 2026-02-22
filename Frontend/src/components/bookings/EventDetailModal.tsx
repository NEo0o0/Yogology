 "use client";

import { X, Calendar, MapPin, DollarSign, Users, Clock, UserPlus, Camera, Loader2, AlertCircle, Tag } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useBookings } from '@/hooks/useBookings';
import { useBookingCutoff } from '@/hooks/useBookingCutoff';
import { ImageCarousel } from '@/components/ui/ImageCarousel';
import { PaymentMethodSelector } from '@/components/packages/PaymentMethodSelector';
import { formatToThaiTime, formatToThaiDateLong } from '@/utils/dateHelpers';

interface EventDetailModalProps {
  event: {
    id: number;
    title: string;
    image: string;
    starts_at: string;
    date: string;
    time: string;
    price: string;
    location: string;
    excerpt: string;
    long_description?: string | null;
    category: string;
    gallery_images?: string[] | null;
    early_bird_price?: number | null;
    early_bird_deadline?: string | null;
  };
  onClose: () => void;
  onNavigate: (page: string) => void;
}

export function EventDetailModal({ event, onClose, onNavigate }: EventDetailModalProps) {
  const { user, profile, isStaff } = useAuth();
  const { createBooking } = useBookings({ autoFetch: false });
  const { isCutoffPassed, cutoffMinutes, loading: cutoffLoading } = useBookingCutoff(event.starts_at);
  const [showPaymentSelector, setShowPaymentSelector] = useState(false);
  const [showManualBooking, setShowManualBooking] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [guestName, setGuestName] = useState('');
  const [guestContact, setGuestContact] = useState('');
  const [guestHealthCondition, setGuestHealthCondition] = useState('');
  const [guestAvatarUrl, setGuestAvatarUrl] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [paymentReceived, setPaymentReceived] = useState(false);
  const isPastEvent = new Date(event.starts_at) < new Date();
  const hasGallery = event.gallery_images && event.gallery_images.length > 0;
  const workshopPrice = parseFloat(event.price.replace(/[^0-9.]/g, '')) || 0;
  
  // Early bird pricing logic
  const currentDate = new Date();
  const earlyBirdDeadline = event.early_bird_deadline ? new Date(event.early_bird_deadline) : null;
  const isEarlyBirdValid = earlyBirdDeadline && currentDate <= earlyBirdDeadline && event.early_bird_price;
  const displayPrice = isEarlyBirdValid ? event.early_bird_price : workshopPrice;

  const handleBookingClick = () => {
    if (!user) {
      handleLoginRedirect();
      return;
    }
    setShowPaymentSelector(true);
  };

  const handlePaymentSelect = async (method: 'package' | 'cash' | 'bank_transfer' | 'promptpay', paymentNote?: string, slipUrl?: string) => {
    if (!user) return;

    try {
      setBookingLoading(true);
      setBookingError(null);

      const bookingData: any = {
        user_id: user.id,
        class_id: event.id,
        kind: 'dropin',
        amount_due: workshopPrice,
        payment_method: method,
        payment_note: paymentNote,
        payment_slip_url: slipUrl,
        amount_paid: 0,
      };

      // Set payment_status based on whether slip was uploaded
      if (slipUrl) {
        bookingData.payment_status = 'partial'; // Has slip - awaiting verification
      } else if (method === 'cash') {
        bookingData.payment_status = 'unpaid'; // Cash - no slip needed
      } else {
        bookingData.payment_status = 'pending_verification'; // Bank transfer - waiting for slip
      }

      const result = await createBooking(bookingData);

      if (result.error) {
        throw result.error;
      }

      setBookingSuccess(true);
      setShowPaymentSelector(false);

      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error('Booking error:', err);
      setBookingError(err.message || 'Failed to register for workshop. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleManualBooking = async () => {
    if (!guestName || !guestContact) {
      setBookingError('Please enter guest name and contact information.');
      return;
    }

    try {
      setBookingLoading(true);
      setBookingError(null);

      const bookingData: any = {
        class_id: event.id,
        kind: 'dropin',
        guest_name: guestName,
        guest_contact: guestContact,
        guest_health_condition: guestHealthCondition.trim() || null,
        guest_avatar_url: guestAvatarUrl || null,
        amount_due: workshopPrice,
        payment_method: 'bank_transfer',
        payment_status: paymentReceived ? 'paid' : 'unpaid',
      };

      const result = await createBooking(bookingData);

      if (result.error) {
        throw result.error;
      }

      setBookingSuccess(true);
      setShowManualBooking(false);
      setGuestName('');
      setGuestContact('');
      setGuestHealthCondition('');
      setGuestAvatarUrl('');
      setPaymentReceived(false);

      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error('Manual booking error:', err);
      setBookingError(err.message || 'Failed to create manual booking.');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleLoginRedirect = () => {
    onClose();
    onNavigate('login');
  };

  const handleContactRedirect = () => {
    onClose();
    onNavigate('contact');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-all duration-200 hover:scale-110"
          aria-label="Close"
        >
          <X size={24} className="text-[var(--color-earth-dark)]" />
        </button>

        {/* Scrollable Content */}
        <div className="overflow-y-auto">
          {/* Gallery Carousel, Header Image, or Placeholder */}
          {hasGallery ? (
            <div className="p-6 bg-[var(--color-cream)]">
              <ImageCarousel images={event.gallery_images!} className="w-full h-96" />
            </div>
          ) : isPastEvent ? (
            <div className="relative h-64 md:h-80 bg-gradient-to-br from-[var(--color-sage)]/10 to-[var(--color-clay)]/10 flex items-center justify-center">
              <div className="text-center px-8 py-12">
                <div className="text-6xl mb-4">✨</div>
                <h3 className="text-2xl font-bold text-[var(--color-earth-dark)] mb-3">
                  Photos Coming Soon!
                </h3>
                <p className="text-[var(--color-stone)] max-w-md mx-auto">
                  We are currently uploading the event photos. Please check back soon to see the beautiful moments from this workshop!
                </p>
              </div>
            </div>
          ) : (
            <div className="relative h-64 md:h-80 overflow-hidden">
              <img
                src={event.image}
                alt={event.title}
                className="w-full h-full object-cover"
              />
              {/* Category Badge */}
              <div className="absolute bottom-4 left-4">
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/95 backdrop-blur-sm rounded-full text-sm shadow-lg">
                  <Tag size={16} className="text-[var(--color-sage)]" />
                  {event.category}
                </span>
              </div>
            </div>
          )}

        {/* Content */}
        <div className="p-8 space-y-6">
          {/* Title */}
          <div>
            <h2 className="text-[var(--color-earth-dark)]">{event.title}</h2>
          </div>

          {/* Event Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 bg-[var(--color-cream)] rounded-lg">
              <Calendar className="text-[var(--color-sage)]" size={20} />
              <div>
                <p className="text-xs text-[var(--color-stone)]">Date</p>
                <p className="text-[var(--color-earth-dark)]">{event.date}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-[var(--color-cream)] rounded-lg">
              <Clock className="text-[var(--color-sage)]" size={20} />
              <div>
                <p className="text-xs text-[var(--color-stone)]">Time</p>
                <p className="text-[var(--color-earth-dark)]">{event.time}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-[var(--color-cream)] rounded-lg">
              <MapPin className="text-[var(--color-sage)]" size={20} />
              <div>
                <p className="text-xs text-[var(--color-stone)]">Location</p>
                <p className="text-[var(--color-earth-dark)]">{event.location}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-[var(--color-cream)] rounded-lg">
              <DollarSign className="text-[var(--color-sage)]" size={20} />
              <div className="flex-1">
                <p className="text-xs text-[var(--color-stone)]">Investment</p>
                {isEarlyBirdValid ? (
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-red-600">฿{event.early_bird_price?.toLocaleString()}</span>
                        <span className="px-2 py-0.5 bg-red-600 text-white text-xs font-semibold rounded-full">EARLY BIRD</span>
                      </div>
                      <span className="text-sm text-[var(--color-stone)] line-through">฿{workshopPrice.toLocaleString()}</span>
                      <span className="text-xs text-red-600 mt-1">Until {earlyBirdDeadline ? formatToThaiDateLong(earlyBirdDeadline) : ''}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-[var(--color-earth-dark)] text-xl">{event.price}</p>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          {(event.excerpt || event.long_description) && (
            <div>
              <h3 className="text-lg font-semibold text-[var(--color-earth-dark)] mb-3">About This Event</h3>
              {event.excerpt && (
                <p className="text-[var(--color-stone)] leading-relaxed mb-4">
                  {event.excerpt}
                </p>
              )}
              {event.long_description && (
                <div className="text-[var(--color-stone)] leading-relaxed whitespace-pre-wrap">
                  {event.long_description}
                </div>
              )}
            </div>
          )}

          {/* What to Bring */}
          <div className="bg-[var(--color-cream)] p-6 rounded-lg">
            <h4 className="text-[var(--color-earth-dark)] mb-3">What to Bring</h4>
            <ul className="space-y-2 text-sm text-[var(--color-stone)]">
              <li className="flex items-start gap-2">
                <span className="text-[var(--color-sage)] mt-1">•</span>
                <span>Yoga mat (or rent one at the studio for $5)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--color-sage)] mt-1">•</span>
                <span>Water bottle to stay hydrated</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--color-sage)] mt-1">•</span>
                <span>Comfortable clothing suitable for movement</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--color-sage)] mt-1">•</span>
                <span>Open mind and positive energy!</span>
              </li>
            </ul>
          </div>

          {/* Booking Success Message */}
          {bookingSuccess && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 text-center font-medium">
                ✓ Registration confirmed! Check your email for details.
              </p>
            </div>
          )}

          {/* Booking Error Message */}
          {bookingError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start justify-between gap-3">
                <p className="text-red-800 text-sm flex-1">{bookingError}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors flex-shrink-0"
                >
                  Reload Page
                </button>
              </div>
            </div>
          )}

          {/* Payment Method Selector */}
          {showPaymentSelector && !bookingSuccess && (
            <div className="mb-6">
              <PaymentMethodSelector
                hasActivePackage={false}
                classPrice={workshopPrice}
                isWorkshop={true}
                onSelect={handlePaymentSelect}
                selectedMethod=""
              />
            </div>
          )}

          {/* Manual Booking Form (Admin Only) */}
          {showManualBooking && !bookingSuccess && (
            <div className="mb-6 p-6 bg-[var(--color-cream)] rounded-lg border-2 border-[var(--color-sage)]">
              <h3 className="text-lg font-semibold text-[var(--color-earth-dark)] mb-4 flex items-center gap-2">
                <UserPlus size={20} />
                Manual Guest Registration
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-stone)] mb-2">
                    Guest Name *
                  </label>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Enter guest full name"
                    className="w-full px-4 py-2 border border-[var(--color-sand)] rounded-lg focus:ring-2 focus:ring-[var(--color-sage)] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-stone)] mb-2">
                    Contact (Phone/Email) *
                  </label>
                  <input
                    type="text"
                    value={guestContact}
                    onChange={(e) => setGuestContact(e.target.value)}
                    placeholder="Phone number or email"
                    className="w-full px-4 py-2 border border-[var(--color-sand)] rounded-lg focus:ring-2 focus:ring-[var(--color-sage)] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-stone)] mb-2">
                    Health Condition / Injuries (Optional)
                  </label>
                  <textarea
                    value={guestHealthCondition}
                    onChange={(e) => setGuestHealthCondition(e.target.value)}
                    placeholder="e.g., Back pain, knee injury, pregnancy..."
                    rows={3}
                    className="w-full px-4 py-2 border border-[var(--color-sand)] rounded-lg focus:ring-2 focus:ring-[var(--color-sage)] focus:border-transparent resize-none"
                  />
                  <p className="text-xs text-[var(--color-stone)] mt-1">
                    Helps instructors provide appropriate modifications
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-stone)] mb-2">
                    Guest Photo (Optional)
                  </label>
                  <div className="flex items-center gap-4">
                    {guestAvatarUrl ? (
                      <img
                        src={guestAvatarUrl}
                        alt="Guest"
                        className="w-16 h-16 rounded-full object-cover border-2 border-[var(--color-sand)]"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--color-sage)] to-[var(--color-clay)] flex items-center justify-center text-white text-xl">
                        {guestName ? guestName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?'}
                      </div>
                    )}
                    <label
                      htmlFor="workshop-guest-avatar"
                      className="flex items-center gap-2 px-4 py-2 bg-[var(--color-sage)] hover:bg-[var(--color-sage)]/80 text-white rounded-lg cursor-pointer transition-colors text-sm"
                    >
                      {uploadingAvatar ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Camera size={16} />
                          Upload Photo
                        </>
                      )}
                    </label>
                    <input
                      id="workshop-guest-avatar"
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        if (file.size > 5 * 1024 * 1024) {
                          setBookingError('Image must be less than 5MB');
                          return;
                        }

                        setUploadingAvatar(true);
                        try {
                          const { supabase } = await import('@/utils/supabase/client');
                          const fileExt = file.name.split('.').pop();
                          const fileName = `guest-${Date.now()}.${fileExt}`;

                          const { error: uploadError } = await supabase.storage
                            .from('avatars')
                            .upload(fileName, file, {
                              cacheControl: '3600',
                              upsert: true
                            });

                          if (uploadError) throw uploadError;

                          const { data: { publicUrl } } = supabase.storage
                            .from('avatars')
                            .getPublicUrl(fileName);

                          setGuestAvatarUrl(publicUrl);
                        } catch (error: any) {
                          console.error('Error uploading photo:', error);
                          setBookingError(error.message || 'Failed to upload photo');
                        } finally {
                          setUploadingAvatar(false);
                        }
                      }}
                      disabled={uploadingAvatar}
                      className="hidden"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-[var(--color-sand)]">
                  <input
                    type="checkbox"
                    id="paymentReceived"
                    checked={paymentReceived}
                    onChange={(e) => setPaymentReceived(e.target.checked)}
                    className="w-5 h-5 text-[var(--color-sage)] rounded focus:ring-2 focus:ring-[var(--color-sage)]"
                  />
                  <label htmlFor="paymentReceived" className="text-sm text-[var(--color-earth-dark)] cursor-pointer">
                    Payment Received (฿{workshopPrice.toLocaleString()})
                  </label>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowManualBooking(false)}
                    className="flex-1 px-4 py-3 border-2 border-[var(--color-sand)] rounded-lg hover:border-[var(--color-sage)] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleManualBooking}
                    disabled={bookingLoading}
                    className="flex-1 px-4 py-3 bg-[var(--color-sage)] hover:bg-[var(--color-clay)] text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {bookingLoading ? 'Creating...' : 'Create Booking'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Booking Cutoff Warning */}
          {isCutoffPassed && !cutoffLoading && !isPastEvent && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
              <AlertCircle size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-yellow-800">Online booking is closed for this session</p>
                <p className="text-sm text-yellow-700 mt-1">
                  This event starts in less than {Math.floor(cutoffMinutes / 60)} hours. Please contact us directly via WhatsApp to register.
                </p>
              </div>
            </div>
          )}

          {/* Booking Section */}
          <div className="border-t border-[var(--color-sand)] pt-6">
            {isPastEvent ? (
              <button
                disabled
                className="w-full bg-[var(--color-stone)] text-white py-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-lg cursor-not-allowed opacity-80"
              >
                <Users size={20} />
                <span className="text-lg">Registration Closed</span>
              </button>
            ) : (
              <div className="space-y-3">
                {user && !showPaymentSelector && !showManualBooking ? (
                  <>
                    {/* Show register button only if cutoff hasn't passed */}
                    {!isCutoffPassed && (
                      <button
                        onClick={handleBookingClick}
                        disabled={bookingLoading || bookingSuccess}
                        className="w-full bg-[var(--color-sage)] hover:bg-[var(--color-clay)] text-white py-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-105"
                      >
                        <Users size={20} />
                        <span className="text-lg">Register for Workshop</span>
                      </button>
                    )}
                    {/* WhatsApp button - always visible */}
                    <a
                      href={`https://wa.me/66649249666?text=Hi, I would like to register for: ${encodeURIComponent(event.title)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-4 border-2 border-[var(--color-sage)] text-[var(--color-sage)] rounded-lg font-medium transition-all duration-300 hover:bg-[var(--color-sage)]/10 flex items-center justify-center gap-2"
                    >
                      <span>📱</span>
                      <span>Manual Book via WhatsApp</span>
                    </a>
                  </>
                ) : !user && !showPaymentSelector && !showManualBooking ? (
                  <>
                    {/* Show login button only if cutoff hasn't passed */}
                    {!isCutoffPassed && (
                      <button
                        onClick={handleLoginRedirect}
                        className="w-full bg-[var(--color-sage)] hover:bg-[var(--color-clay)] text-white py-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-105"
                      >
                        <span className="text-lg">Login to Register</span>
                      </button>
                    )}
                    {/* WhatsApp button - always visible */}
                    <a
                      href={`https://wa.me/66649249666?text=Hi, I would like to register for: ${encodeURIComponent(event.title)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-4 border-2 border-[var(--color-sage)] text-[var(--color-sage)] rounded-lg font-medium transition-all duration-300 hover:bg-[var(--color-sage)]/10 flex items-center justify-center gap-2"
                    >
                      <span>📱</span>
                      <span>Manual Book via WhatsApp</span>
                    </a>
                  </>
                ) : null}

                {isStaff && !showPaymentSelector && !showManualBooking && !bookingSuccess && (
                  <button
                    onClick={() => setShowManualBooking(true)}
                    className="w-full border-2 border-[var(--color-sage)] text-[var(--color-sage)] hover:bg-[var(--color-sage)] hover:text-white py-3 rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <UserPlus size={20} />
                    <span>Manual Register (Guest)</span>
                  </button>
                )}

                {(showPaymentSelector || showManualBooking) && !bookingSuccess && (
                  <button
                    onClick={() => {
                      setShowPaymentSelector(false);
                      setShowManualBooking(false);
                    }}
                    className="w-full border-2 border-[var(--color-sand)] hover:border-[var(--color-sage)] text-[var(--color-earth-dark)] py-3 rounded-lg transition-all duration-300"
                  >
                    Back
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Additional Info */}
          <div className="bg-gradient-to-r from-[var(--color-sage)]/10 to-[var(--color-clay)]/10 p-4 rounded-lg">
            <p className="text-sm text-[var(--color-stone)]">
              💡 <strong>Limited spots available.</strong> Pre-registration required. Cancellation policy: Full refund up to 48 hours before event.
            </p>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
