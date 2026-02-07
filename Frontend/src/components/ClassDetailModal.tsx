import { X, Clock, User, TrendingUp, MapPin, Users } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useBookings } from '../hooks/useBookings';

interface ClassDetailModalProps {
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
    room: string;
    price: number;
  };
  onClose: () => void;
  onNavigate: (page: string) => void;
  onBookingSuccess?: () => void; // Callback to refresh class data
}

export function ClassDetailModal({ classData, onClose, onNavigate, onBookingSuccess }: ClassDetailModalProps) {
  const { user } = useAuth();
  const { createBooking } = useBookings({ autoFetch: false });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const handleBooking = async () => {
    if (!user) {
      handleLoginRedirect();
      return;
    }

    try {
      setBookingLoading(true);
      setBookingError(null);

      console.log('Creating booking for class:', classData.id, 'user:', user.id);

      // Create booking with drop-in kind (no package)
      const result = await createBooking({
        user_id: user.id,
        class_id: parseInt(classData.id),
        kind: 'dropin',
        status: 'booked',
        amount_due: classData.price,
      });

      console.log('Booking result:', result);

      if (result.error) {
        throw result.error;
      }

      // Show success state
      setBookingSuccess(true);

      // Call refresh callback if provided
      if (onBookingSuccess) {
        onBookingSuccess();
      }

      // Close modal after 2 seconds
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error('Booking error:', err);
      
      // Handle specific error cases
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

  const handleContactRedirect = () => {
    onClose();
    onNavigate('contact');
  };

  const spotsLeft = classData.capacity - classData.enrolled;
  const isFullyBooked = spotsLeft === 0;
  const isPastClass = new Date(classData.starts_at) < new Date();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-br from-[var(--color-sage)] to-[var(--color-clay)] text-white p-8 rounded-t-2xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors duration-300"
          >
            <X size={24} />
          </button>
          
          <div className="space-y-2">
            <div className="inline-block px-3 py-1 bg-white/20 rounded-full text-sm mb-2">
              {classData.day}
            </div>
            <h2 className="text-white">{classData.title}</h2>
            <p className="text-white/90">{classData.time} • {classData.duration}</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          {/* Class Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 bg-[var(--color-cream)] rounded-lg">
              <User className="text-[var(--color-sage)]" size={20} />
              <div>
                <p className="text-xs text-[var(--color-stone)]">Instructor</p>
                <p className="text-[var(--color-earth-dark)]">{classData.instructor}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-[var(--color-cream)] rounded-lg">
              <TrendingUp className="text-[var(--color-sage)]" size={20} />
              <div>
                <p className="text-xs text-[var(--color-stone)]">Level</p>
                <p className="text-[var(--color-earth-dark)]">{classData.level}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-[var(--color-cream)] rounded-lg">
              <MapPin className="text-[var(--color-sage)]" size={20} />
              <div>
                <p className="text-xs text-[var(--color-stone)]">Room</p>
                <p className="text-[var(--color-earth-dark)]">{classData.room}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-[var(--color-cream)] rounded-lg">
              <Users className="text-[var(--color-sage)]" size={20} />
              <div>
                <p className="text-xs text-[var(--color-stone)]">Availability</p>
                <p className="text-[var(--color-earth-dark)]">
                  {isFullyBooked ? 'Full' : `${spotsLeft} spots left`}
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-[var(--color-earth-dark)] mb-3">About This Class</h3>
            <p className="text-[var(--color-stone)] leading-relaxed">
              {classData.description}
            </p>
          </div>

          {/* Capacity Bar */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-[var(--color-stone)]">Class Capacity</span>
              <span className="text-[var(--color-earth-dark)]">
                {classData.enrolled} / {classData.capacity} enrolled
              </span>
            </div>
            <div className="w-full bg-[var(--color-sand)] rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-[var(--color-sage)] to-[var(--color-clay)] h-full transition-all duration-500"
                style={{ width: `${(classData.enrolled / classData.capacity) * 100}%` }}
              />
            </div>
          </div>

          {/* Price Display */}
          <div className="flex justify-between items-center mb-4 px-1">
            <span className="text-[var(--color-stone)] font-medium">Price</span>
            <span className="text-xl font-bold text-[var(--color-earth-dark)]">
              {classData.price === 0 ? 'Free' : `฿${(classData.price || 0).toLocaleString()}`}
            </span>
          </div>

          {/* Booking Section */}
          <div className="border-t border-[var(--color-sand)] pt-6">
            {/* Show error message if booking failed */}
            {bookingError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                <p className="text-sm">{bookingError}</p>
              </div>
            )}

            {/* Show success message */}
            {bookingSuccess && (
              <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                <p className="text-sm">✅ Successfully booked {classData.title}! Check your email for confirmation.</p>
              </div>
            )}

            {user ? (
              <button
                onClick={handleBooking}
                disabled={isPastClass || isFullyBooked || bookingLoading || bookingSuccess}
                className={`w-full py-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                  isPastClass || isFullyBooked || bookingLoading || bookingSuccess
                    ? 'bg-[var(--color-stone)] text-white cursor-not-allowed'
                    : 'bg-[var(--color-sage)] hover:bg-[var(--color-clay)] text-white shadow-lg hover:shadow-xl hover:scale-105'
                }`}
              >
                <Clock size={20} />
                <span className="text-lg">
                  {bookingLoading
                    ? 'Booking...'
                    : bookingSuccess
                      ? 'Booked!'
                      : isPastClass
                        ? 'Class Ended'
                        : isFullyBooked
                          ? 'Class Full - Join Waitlist'
                          : 'Book This Class'}
                </span>
              </button>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={handleLoginRedirect}
                  className="w-full bg-[var(--color-sage)] hover:bg-[var(--color-clay)] text-white py-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-105"
                >
                  <span className="text-lg">Login to Book</span>
                </button>
                <p className="text-center text-[var(--color-stone)] text-sm">
                  Or{' '}
                  <button
                    onClick={handleContactRedirect}
                    className="text-[var(--color-sage)] hover:text-[var(--color-clay)] underline transition-colors duration-300"
                  >
                    contact us to book manually
                  </button>
                </p>
              </div>
            )}
          </div>

          {/* Additional Info */}
          <div className="bg-[var(--color-cream)] p-4 rounded-lg">
            <p className="text-sm text-[var(--color-stone)]">
              💡 <strong>First class free</strong> for new students • Drop-in: ฿{(classData.price || 0).toLocaleString()} • Unlimited monthly pass available
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
