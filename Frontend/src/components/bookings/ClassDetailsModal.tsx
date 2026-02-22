import { X, Clock, User, MapPin, Calendar, DollarSign, CheckCircle2, UserPlus, Camera, Loader2, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useBookings } from '@/hooks/useBookings';
import { useBookingCutoff } from '@/hooks/useBookingCutoff';
import { ImageCarousel } from '@/components/ui/ImageCarousel';
import { PaymentMethodSelector } from '@/components/packages/PaymentMethodSelector';
import { sendBookingConfirmationEmail } from '@/utils/emailHelpers';
import { getDisplayLevel } from '@/constants/levels';

interface ClassDetailsModalProps {
  classData: {
    id: string;
    title: string;
    time: string;
    starts_at: string;
    instructor: string;
    level: string;
    capacity: number;
    enrolled: number;
    day: string;
    duration: string;
    description: string;
    long_description?: string | null;
    room: string;
    price: number;
    cover_image_url?: string | null;
    gallery_images?: string[] | null;
    class_types?: {
      cover_image_url?: string | null;
    };
  };
  onClose: () => void;
  onNavigate: (page: string) => void;
  onBookingSuccess?: () => void;
}

export function ClassDetailsModal({ classData, onClose, onNavigate, onBookingSuccess }: ClassDetailsModalProps) {
  const { user, profile } = useAuth();
  const { createBooking, checkUserPackage, checkExistingBooking } = useBookings({ autoFetch: false });
  const { isCutoffPassed, cutoffMinutes, loading: cutoffLoading } = useBookingCutoff(classData.starts_at);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [showPaymentSelector, setShowPaymentSelector] = useState(false);
  const [userPackage, setUserPackage] = useState<any>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [existingBooking, setExistingBooking] = useState<any>(null);
  const [checkingBooking, setCheckingBooking] = useState(true);
  const [loadingPackageData, setLoadingPackageData] = useState(true);
  const [dataLoadError, setDataLoadError] = useState<string | null>(null);
  const [localEnrolled, setLocalEnrolled] = useState(classData.enrolled);
  const [showManualBooking, setShowManualBooking] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestContact, setGuestContact] = useState('');
  const [guestHealthCondition, setGuestHealthCondition] = useState('');
  const [guestAvatarUrl, setGuestAvatarUrl] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [paymentReceived, setPaymentReceived] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (user) {
        setLoadingPackageData(true);
        setDataLoadError(null);
        
        try {
          // Load package data
          const pkg = await checkUserPackage(user.id);
          console.log('📦 User package data:', pkg);
          console.log('📦 Has active package:', !!pkg);
          console.log('📦 Credits remaining:', pkg?.credits_remaining);
          console.log('📦 Package name:', pkg?.name);
          setUserPackage(pkg);
          
          // Check if user already has a booking for this class
          const booking = await checkExistingBooking(user.id, parseInt(classData.id));
          setExistingBooking(booking);
          setCheckingBooking(false);
          setLoadingPackageData(false);
        } catch (error) {
          console.error('❌ Error loading package data:', error);
          setDataLoadError('Failed to load package information. Please try again.');
          setLoadingPackageData(false);
          setCheckingBooking(false);
        }
      } else {
        setCheckingBooking(false);
        setLoadingPackageData(false);
      }
    };
    
    loadData();
  }, [user, classData.id]);

  const handleBookingClick = () => {
    if (!user) {
      handleLoginRedirect();
      return;
    }
    // Prevent booking if already booked
    if (existingBooking) {
      return;
    }
    // Ensure data is loaded before showing payment selector
    if (loadingPackageData) {
      console.log('⏳ Still loading package data, please wait...');
      return;
    }
    setShowPaymentSelector(true);
  };

  const handlePaymentSelect = async (method: 'package' | 'cash' | 'bank_transfer' | 'promptpay', paymentNote?: string, slipUrl?: string) => {
    if (!user) return;

    try {
      setBookingLoading(true);
      setBookingError(null);
      setSelectedPaymentMethod(method);

      const bookingData: any = {
        user_id: user.id,
        class_id: parseInt(classData.id),
        amount_due: classData.price,
      };

      if (method === 'package') {
        // Package booking - payment_status is 'paid' immediately
        bookingData.kind = 'package';
        bookingData.payment_status = 'paid';
        bookingData.payment_method = 'package';
        bookingData.user_package_id = userPackage?.id;
      } else {
        // Transfer/Cash/PromptPay
        bookingData.kind = 'dropin';
        bookingData.payment_method = method;
        bookingData.payment_note = paymentNote;
        bookingData.payment_slip_url = slipUrl;
        bookingData.amount_paid = 0;
        
        // Set payment_status based on whether slip was uploaded
        if (slipUrl) {
          bookingData.payment_status = 'partial'; // Has slip - awaiting verification
        } else if (method === 'cash') {
          bookingData.payment_status = 'unpaid'; // Cash - no slip needed
        } else {
          bookingData.payment_status = 'pending_verification'; // Bank transfer - waiting for slip
        }
      }

      const result = await createBooking(bookingData);

      if (result.error) {
        throw result.error;
      }

      setBookingSuccess(true);
      setShowPaymentSelector(false);
      // Update existing booking state to prevent re-booking
      setExistingBooking(result.data);
      
      // Immediately update local enrolled count to reflect the new booking
      setLocalEnrolled(prev => prev + 1);

      // Send booking confirmation email
      if (user && result.data) {
        const packageInfo = method === 'package' && userPackage ? {
          name: userPackage.name,
          creditsRemaining: userPackage.credits_remaining,
          isUnlimited: userPackage.is_unlimited
        } : undefined;
        
        sendBookingConfirmationEmail(user, result.data, classData, packageInfo).catch(err => {
          console.error('Failed to send confirmation email:', err);
        });
      }

      if (onBookingSuccess) {
        onBookingSuccess();
      }

      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error('Booking error:', err);
      
      if (err.message?.includes('full')) {
        setBookingError('This class is fully booked. Please try another class or join the waitlist.');
      } else if (err.message?.includes('credit')) {
        setBookingError('You do not have enough credits. Please purchase a package first.');
      } else if (err.message?.includes('already booked')) {
        setBookingError('You have already booked this class.');
      } else {
        setBookingError(err.message || 'Failed to book class. Please try again.');
      }
    } finally {
      setBookingLoading(false);
    }
  };

  const handleLoginRedirect = () => {
    onClose();
    onNavigate('login');
  };

  const handleManualBooking = async () => {
    if (!guestName || !guestContact) {
      setBookingError('Please enter guest name and contact information.');
      return;
    }

    try {
      setBookingLoading(true);
      setBookingError(null);

      const result = await createBooking({
        class_id: parseInt(classData.id),
        kind: 'dropin',
        guest_name: guestName,
        guest_contact: guestContact,
        guest_health_condition: guestHealthCondition.trim() || null,
        guest_avatar_url: guestAvatarUrl || null,
        amount_due: classData.price,
        payment_method: 'bank_transfer',
        payment_status: paymentReceived ? 'paid' : 'unpaid',
      });

      if (result.error) throw result.error;

      setBookingSuccess(true);
      setShowManualBooking(false);
      setGuestName('');
      setGuestContact('');
      setGuestHealthCondition('');
      setGuestAvatarUrl('');
      setPaymentReceived(false);
      setLocalEnrolled(prev => prev + 1);

      if (onBookingSuccess) {
        onBookingSuccess();
      }

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

  const { isStaff } = useAuth();

  const spotsLeft = classData.capacity - localEnrolled;
  const isFull = spotsLeft <= 0;
  const displayPrice = classData.price > 0 ? `฿${classData.price.toLocaleString()}` : 'Free';
  const formatMoney = (amount: number) => {
    if (!amount || amount === 0) return 'Free';
    return `฿${amount.toLocaleString()}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-all duration-200 hover:scale-110"
          aria-label="Close"
        >
          <X size={24} className="text-[var(--color-earth-dark)]" />
        </button>

        {/* Scrollable Content */}
        <div className="overflow-y-auto">
          {/* Gallery Carousel or Cover Image Banner */}
          {classData.gallery_images && classData.gallery_images.length > 0 ? (
            <div className="p-6 bg-[var(--color-cream)]">
              <ImageCarousel images={classData.gallery_images} className="w-full h-96" />
            </div>
          ) : (classData.cover_image_url || classData.class_types?.cover_image_url) ? (
            <div className="relative w-full aspect-[4/3] bg-gradient-to-br from-[var(--color-sage)] to-[var(--color-clay)]">
              <img
                src={classData.cover_image_url || classData.class_types?.cover_image_url || ''}
                alt={classData.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          ) : (
            <div className="relative w-full aspect-[4/3] bg-gradient-to-br from-[var(--color-sage)] to-[var(--color-clay)] flex items-center justify-center">
              <div className="text-center text-white">
                <h3 className="text-3xl font-bold mb-2">{classData.title}</h3>
                <p className="text-lg opacity-90">{getDisplayLevel(classData.level)}</p>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="p-8">
            {/* Title & Level */}
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-[var(--color-earth-dark)] mb-2">
                {classData.title}
              </h2>
              <span className="inline-block px-4 py-1 bg-[var(--color-sage)]/10 text-[var(--color-sage)] rounded-full text-sm font-medium">
                {getDisplayLevel(classData.level)}
              </span>
            </div>

            {/* Key Details Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-3 p-4 bg-[var(--color-cream)] rounded-lg">
                <Calendar size={20} className="text-[var(--color-clay)]" />
                <div>
                  <div className="text-xs text-[var(--color-stone)]">Date & Time</div>
                  <div className="text-sm font-medium text-[var(--color-earth-dark)]">
                    {classData.day}, {classData.time}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-[var(--color-cream)] rounded-lg">
                <Clock size={20} className="text-[var(--color-clay)]" />
                <div>
                  <div className="text-xs text-[var(--color-stone)]">Duration</div>
                  <div className="text-sm font-medium text-[var(--color-earth-dark)]">
                    {classData.duration}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-[var(--color-cream)] rounded-lg">
                <User size={20} className="text-[var(--color-clay)]" />
                <div>
                  <div className="text-xs text-[var(--color-stone)]">Instructor</div>
                  <div className="text-sm font-medium text-[var(--color-earth-dark)]">
                    {classData.instructor}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-[var(--color-cream)] rounded-lg">
                <MapPin size={20} className="text-[var(--color-clay)]" />
                <div>
                  <div className="text-xs text-[var(--color-stone)]">Location</div>
                  <div className="text-sm font-medium text-[var(--color-earth-dark)]">
                    {classData.room}
                  </div>
                </div>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-center justify-between p-4 bg-[var(--color-cream)] rounded-lg mb-6">
              <div className="flex items-center gap-3">
                <DollarSign size={20} className="text-[var(--color-clay)]" />
                <span className="text-sm text-[var(--color-stone)]">Price</span>
              </div>
              <span className="text-2xl font-bold text-[var(--color-earth-dark)]">
                {displayPrice}
              </span>
            </div>

            {/* Availability */}
            <div className="mb-6 p-4 bg-[var(--color-cream)] rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-[var(--color-stone)]">Availability</span>
                <span className={`text-sm font-medium ${isFull ? 'text-red-600' : 'text-green-600'}`}>
                  {isFull ? 'Fully Booked' : `${spotsLeft} spots left`}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    isFull ? 'bg-red-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${(localEnrolled / classData.capacity) * 100}%` }}
                />
              </div>
            </div>

            {/* Already Booked Banner */}
            {existingBooking && !checkingBooking && (
              <div className="mb-6 p-5 bg-gradient-to-r from-[var(--color-sage)]/10 to-[var(--color-clay)]/10 border-2 border-[var(--color-sage)] rounded-xl shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[var(--color-sage)] to-[var(--color-clay)] rounded-full flex items-center justify-center shadow-md">
                    <CheckCircle2 size={24} className="text-white" strokeWidth={2.5} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[var(--color-earth-dark)] font-bold text-lg mb-1">
                      Already Booked ✓
                    </p>
                    <p className="text-[var(--color-stone)] text-sm leading-relaxed">
                      You have an active booking for this class. View your booking details and payment status in your profile.
                    </p>
                    <a 
                      href="/profile" 
                      className="inline-block mt-3 text-sm text-[var(--color-sage)] hover:text-[var(--color-clay)] font-medium underline transition-colors"
                    >
                      Go to My Bookings →
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Description */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-[var(--color-earth-dark)] mb-3">
                About This Class
              </h3>
              <p className="text-[var(--color-stone)] leading-relaxed">
                {classData.description}
              </p>
            </div>

            {/* Long Description (if available) */}
            {classData.long_description && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-[var(--color-earth-dark)] mb-3">
                  What to Expect
                </h3>
                <div className="text-[var(--color-stone)] leading-relaxed whitespace-pre-line">
                  {classData.long_description}
                </div>
              </div>
            )}

            {/* Booking Success Message */}
            {bookingSuccess && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 text-center font-medium">
                  ✓ Booking confirmed! See you in class.
                </p>
              </div>
            )}

            {/* Data Loading Error */}
            {dataLoadError && (
              <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-orange-800 text-sm">⚠️ {dataLoadError}</p>
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

            {/* Loading Package Data */}
            {loadingPackageData && user && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  <p className="text-blue-800 text-sm">Loading payment options...</p>
                </div>
              </div>
            )}

            {/* Payment Method Selector */}
            {showPaymentSelector && !bookingSuccess && !loadingPackageData && (
              <div className="mb-6">
                <PaymentMethodSelector
                  hasActivePackage={!!userPackage}
                  packageName={userPackage?.name}
                  creditsRemaining={userPackage?.credits_remaining}
                  isUnlimited={userPackage?.is_unlimited || false}
                  classPrice={classData.price}
                  isWorkshop={false}
                  itemName={classData.title}
                  onSelect={handlePaymentSelect}
                  selectedMethod={selectedPaymentMethod}
                  userId={user?.id}
                  userFullName={user?.user_metadata?.full_name}
                />
              </div>
            )}

            {/* Manual Guest Booking Form (Admin Only) */}
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
                        htmlFor="class-guest-avatar"
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
                        id="class-guest-avatar"
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
                      id="classPaymentReceived"
                      checked={paymentReceived}
                      onChange={(e) => setPaymentReceived(e.target.checked)}
                      className="w-5 h-5 text-[var(--color-sage)] rounded focus:ring-2 focus:ring-[var(--color-sage)]"
                    />
                    <label htmlFor="classPaymentReceived" className="text-sm text-[var(--color-earth-dark)] cursor-pointer">
                      Payment Received ({formatMoney(classData.price)})
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
            {isCutoffPassed && !cutoffLoading && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
                <AlertCircle size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-yellow-800">Online booking is closed for this session</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    This class starts in less than {Math.floor(cutoffMinutes / 60)} hours. Please contact us directly via WhatsApp to book.
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              {user ? (
                !showPaymentSelector && !showManualBooking ? (
                  <>
                    {/* Show booking button only if cutoff hasn't passed */}
                    {!isCutoffPassed && (
                      <button
                        onClick={handleBookingClick}
                        disabled={bookingLoading || bookingSuccess || isFull || existingBooking || loadingPackageData}
                        className={`w-full py-4 rounded-lg font-medium transition-all duration-300 shadow-md hover:shadow-lg ${
                          bookingSuccess
                            ? 'bg-green-500 text-white cursor-default'
                            : existingBooking
                            ? 'bg-blue-300 text-blue-800 cursor-not-allowed'
                            : isFull
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : loadingPackageData
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-[var(--color-sage)] hover:bg-[var(--color-clay)] text-white'
                        }`}
                      >
                        {loadingPackageData
                          ? 'Loading...'
                          : bookingLoading
                          ? 'Booking...'
                          : bookingSuccess
                          ? 'Booked ✓'
                          : existingBooking
                          ? 'Already Booked'
                          : isFull
                          ? 'Fully Booked'
                          : 'Book This Class'}
                      </button>
                    )}
                    {/* WhatsApp button - always visible for late bookings */}
                    <a
                      href={`https://wa.me/66649249666?text=Hi, I would like to book a class: ${encodeURIComponent(classData.title)} on ${encodeURIComponent(classData.day)} at ${encodeURIComponent(classData.time)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-4 border-2 border-[var(--color-sage)] text-[var(--color-sage)] rounded-lg font-medium transition-all duration-300 hover:bg-[var(--color-sage)]/10 flex items-center justify-center gap-2"
                    >
                      <span>📱</span>
                      <span>Manual Book via WhatsApp</span>
                    </a>
                    {isStaff && (
                      <button
                        onClick={() => setShowManualBooking(true)}
                        className="w-full py-3 border-2 border-[var(--color-sage)] text-[var(--color-sage)] hover:bg-[var(--color-sage)] hover:text-white rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
                      >
                        <UserPlus size={20} />
                        <span>Manual Guest Booking (Admin)</span>
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setShowPaymentSelector(false);
                      setShowManualBooking(false);
                    }}
                    className="w-full py-4 border-2 border-[var(--color-sand)] hover:border-[var(--color-sage)] text-[var(--color-earth-dark)] rounded-lg font-medium transition-all duration-300"
                  >
                    Back
                  </button>
                )
              ) : (
                <>
                  {/* Show login button only if cutoff hasn't passed */}
                  {!isCutoffPassed && (
                    <button
                      onClick={handleLoginRedirect}
                      className="w-full py-4 bg-[var(--color-sage)] hover:bg-[var(--color-clay)] text-white rounded-lg font-medium transition-all duration-300 shadow-md hover:shadow-lg"
                    >
                      Login to Book
                    </button>
                  )}
                  {/* WhatsApp button - always visible */}
                  <a
                    href={`https://wa.me/66649249666?text=Hi, I would like to book a class: ${encodeURIComponent(classData.title)} on ${encodeURIComponent(classData.day)} at ${encodeURIComponent(classData.time)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-4 border-2 border-[var(--color-sage)] text-[var(--color-sage)] rounded-lg font-medium transition-all duration-300 hover:bg-[var(--color-sage)]/10 flex items-center justify-center gap-2"
                  >
                    <span>📱</span>
                    <span>Manual Book via WhatsApp</span>
                  </a>
                </>
              )}
              <button
                onClick={onClose}
                className="w-full py-4 border-2 border-[var(--color-sand)] hover:border-[var(--color-sage)] text-[var(--color-earth-dark)] rounded-lg font-medium transition-all duration-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
