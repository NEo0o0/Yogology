import { useState } from 'react';
import { 
  User, 
  Package, 
  Calendar, 
  Clock, 
  LogOut, 
  Home,
  Settings as SettingsIcon,
  ChevronRight,
  X,
  CheckCircle,
  AlertCircle,
  Shield,
  List,
  CalendarDays,
  Info
} from 'lucide-react';
import { BuyPackageModal } from '@/components/packages/BuyPackageModal';

interface UserData {
  id: string;
  name: string;
  email: string;
  role: 'member' | 'admin';
  phone?: string;
  lineId?: string;
  packageType?: string;
  creditsLeft?: number;
  totalCredits?: number;
  expiryDate?: string;
}

interface MemberDashboardProps {
  userData: UserData;
  onLogout: () => void;
  onNavigateToAdmin: () => void;
  onNavigateHome?: () => void;
  onNavigateToPricing?: () => void;
}

interface BookedClass {
  id: string;
  className: string;
  instructor: string;
  date: string;
  time: string;
  status: 'upcoming' | 'completed' | 'cancelled';
}

// Mock data for booked classes
const mockBookedClasses: BookedClass[] = [
  {
    id: '1',
    className: 'Vinyasa Flow',
    instructor: 'Annie Bliss',
    date: '2025-12-26',
    time: '09:00 AM',
    status: 'upcoming'
  },
  {
    id: '2',
    className: 'Hatha Yoga',
    instructor: 'Sarah Johnson',
    date: '2025-12-28',
    time: '06:00 PM',
    status: 'upcoming'
  },
  {
    id: '3',
    className: 'Power Yoga',
    instructor: 'Annie Bliss',
    date: '2025-12-30',
    time: '10:00 AM',
    status: 'upcoming'
  },
  {
    id: '4',
    className: 'Yin Yoga',
    instructor: 'Emma Williams',
    date: '2025-12-20',
    time: '05:00 PM',
    status: 'completed'
  },
  {
    id: '5',
    className: 'Vinyasa Flow',
    instructor: 'Annie Bliss',
    date: '2025-12-18',
    time: '09:00 AM',
    status: 'completed'
  },
  {
    id: '6',
    className: 'Restorative Yoga',
    instructor: 'Sarah Johnson',
    date: '2025-12-15',
    time: '07:00 PM',
    status: 'completed'
  }
];

export function MemberDashboard({ userData, onLogout, onNavigateToAdmin, onNavigateHome, onNavigateToPricing }: MemberDashboardProps) {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedClassToCancel, setSelectedClassToCancel] = useState<BookedClass | null>(null);
  const [activeView, setActiveView] = useState<'upcoming' | 'history'>('upcoming');
  const [upcomingView, setUpcomingView] = useState<'list' | 'calendar'>('list');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showBuyPackageModal, setShowBuyPackageModal] = useState(false);

  const upcomingClasses = mockBookedClasses.filter(c => c.status === 'upcoming');
  const completedClasses = mockBookedClasses.filter(c => c.status === 'completed');

  const hasActivePackage = userData.packageType && userData.packageType !== 'No Active Package';

  const handleCancelClick = (classItem: BookedClass) => {
    setSelectedClassToCancel(classItem);
    setShowCancelModal(true);
  };

  const handleConfirmCancel = () => {
    // In real app, this would call an API to cancel the booking
    console.log('Cancelling class:', selectedClassToCancel?.id);
    setShowCancelModal(false);
    setSelectedClassToCancel(null);
    // Show success message
  };

  const handleBuyPackage = () => {
    if (onNavigateToPricing) {
      onNavigateToPricing();
    } else {
      // Default behavior
      window.location.href = '/pricing';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDaysUntilExpiry = () => {
    if (!userData.expiryDate) return null;
    const today = new Date();
    const expiry = new Date(userData.expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Calendar View Functions
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const getBookingsForDate = (dateString: string) => {
    return upcomingClasses.filter(c => c.date === dateString);
  };

  const changeMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const renderCalendarView = () => {
    const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth);
    const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const days = [];
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Empty cells for days before the month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square" />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const bookingsForDay = getBookingsForDate(dateString);
      const hasBookings = bookingsForDay.length > 0;
      const isToday = new Date().toDateString() === new Date(dateString).toDateString();

      days.push(
        <div
          key={day}
          className={`aspect-square border border-[var(--color-sand)] p-2 transition-all duration-200 ${
            hasBookings 
              ? 'bg-gradient-to-br from-[var(--color-sage)]/20 to-[var(--color-clay)]/20 cursor-pointer hover:shadow-md' 
              : 'bg-white hover:bg-[var(--color-cream)]'
          } ${isToday ? 'ring-2 ring-[var(--color-sage)]' : ''}`}
        >
          <div className={`text-sm mb-1 ${hasBookings ? 'text-[var(--color-earth-dark)]' : 'text-[var(--color-stone)]'}`}>
            {day}
          </div>
          {hasBookings && (
            <div className="space-y-1">
              {bookingsForDay.map((booking) => (
                <div
                  key={booking.id}
                  className="bg-[var(--color-sage)] text-white text-xs px-2 py-1 rounded truncate hover:bg-[var(--color-clay)] transition-colors group relative"
                >
                  <div className="truncate">{booking.className}</div>
                  <div className="text-xs opacity-80">{booking.time}</div>
                  
                  {/* Tooltip/Popover on hover */}
                  <div className="absolute left-0 top-full mt-1 bg-white text-[var(--color-earth-dark)] p-3 rounded-lg shadow-xl z-10 hidden group-hover:block min-w-[200px]">
                    <div className="font-medium mb-1">{booking.className}</div>
                    <div className="text-xs text-[var(--color-stone)] space-y-1">
                      <div className="flex items-center gap-2">
                        <User size={12} />
                        {booking.instructor}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={12} />
                        {booking.time}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancelClick(booking);
                      }}
                      className="mt-2 w-full px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded border border-red-200 transition-colors"
                    >
                      Cancel Booking
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl text-[var(--color-earth-dark)]">{monthName}</h3>
          <div className="flex gap-2">
            <button
              onClick={() => changeMonth('prev')}
              className="px-3 py-1 border border-[var(--color-sand)] rounded hover:bg-[var(--color-cream)] transition-colors"
            >
              ←
            </button>
            <button
              onClick={() => changeMonth('next')}
              className="px-3 py-1 border border-[var(--color-sand)] rounded hover:bg-[var(--color-cream)] transition-colors"
            >
              →
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Weekday Headers */}
          {weekDays.map(day => (
            <div key={day} className="text-center text-sm text-[var(--color-stone)] py-2">
              {day}
            </div>
          ))}
          {/* Calendar Days */}
          {days}
        </div>

        {upcomingClasses.length === 0 && (
          <div className="text-center py-8 text-[var(--color-stone)]">
            <p>No upcoming classes booked for this month</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--color-cream)] via-white to-[var(--color-sand)]">
      {/* Header */}
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 
                onClick={onNavigateHome}
                className="text-2xl text-[var(--color-earth-dark)] cursor-pointer hover:text-[var(--color-sage)] transition-colors"
              >
                Annie Bliss Yoga
              </h1>
            </div>
            <div className="flex items-center gap-3">
              {/* Admin Access Button - Only show if user is admin */}
              {userData.role === 'admin' && (
                <button
                  onClick={onNavigateToAdmin}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  <Shield size={18} />
                  <span className="hidden sm:inline">Admin Dashboard</span>
                </button>
              )}
              {onNavigateHome && (
                <button
                  onClick={onNavigateHome}
                  className="flex items-center gap-2 px-4 py-2 text-[var(--color-stone)] hover:text-[var(--color-earth-dark)] hover:bg-[var(--color-cream)] rounded-lg transition-all duration-300"
                >
                  <Home size={18} />
                  <span className="hidden sm:inline">Back to Home</span>
                </button>
              )}
              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-4 py-2 text-[var(--color-stone)] hover:text-[var(--color-earth-dark)] hover:bg-[var(--color-cream)] rounded-lg transition-all duration-300"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Section A: My Status */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
            {/* Welcome Message */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-3xl text-[var(--color-earth-dark)] mb-2">
                  Hello, {userData.name}! 🙏
                </h2>
                <p className="text-[var(--color-stone)]">Welcome back to your yoga journey</p>
              </div>
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--color-sage)] to-[var(--color-clay)] flex items-center justify-center text-white text-2xl">
                {userData.name.charAt(0)}
              </div>
            </div>

            {/* Package Card - Upgraded with Conditional Logic */}
            <div className="bg-gradient-to-br from-[var(--color-sage)] to-[var(--color-clay)] rounded-xl p-6 text-white">
              <div className="flex items-center gap-2 mb-4">
                <Package size={24} />
                <h3 className="text-xl">Current Package</h3>
              </div>
              
              {/* State A: No Active Package */}
              {!hasActivePackage ? (
                <div className="space-y-4">
                  <div className="text-center py-6">
                    <p className="text-2xl mb-2">No Active Package</p>
                    <p className="text-white/80 text-sm">
                      Purchase a package to start booking classes
                    </p>
                  </div>
                  
                  <button 
                    onClick={() => setShowBuyPackageModal(true)}
                    className="w-full bg-white text-[var(--color-sage)] py-3 rounded-lg hover:bg-white/90 transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                  >
                    <span>Buy Package</span>
                    <ChevronRight size={18} />
                  </button>
                </div>
              ) : (
                /* State B: Has Active Package */
                <div className="space-y-4">
                  {/* Package Name */}
                  <div>
                    <p className="text-white/80 text-sm mb-1">Package Type</p>
                    <p className="text-2xl">{userData.packageType}</p>
                  </div>

                  {/* Remaining Credits */}
                  {userData.creditsLeft !== undefined && userData.totalCredits && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-white/80 text-sm">Credits Remaining</p>
                        <p className="text-xl">
                          {userData.creditsLeft} / {userData.totalCredits}
                        </p>
                      </div>
                      <div className="w-full bg-white/20 rounded-full h-2">
                        <div
                          className="bg-white rounded-full h-2 transition-all duration-500"
                          style={{ 
                            width: `${(userData.creditsLeft / userData.totalCredits) * 100}%` 
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Expiry Date */}
                  {userData.expiryDate && (
                    <div>
                      <p className="text-white/80 text-sm mb-1">Expires</p>
                      <p className="text-lg">
                        {formatDate(userData.expiryDate)}
                        {getDaysUntilExpiry() && getDaysUntilExpiry()! > 0 && (
                          <span className="text-sm ml-2">
                            ({getDaysUntilExpiry()} days left)
                          </span>
                        )}
                      </p>
                    </div>
                  )}

                  {/* Credit Logic Helper Text */}
                  <div className="bg-white/10 rounded-lg p-3 flex items-start gap-2">
                    <Info size={16} className="flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-white/90">
                      Booking a class deducts 1 credit. Cancelling early refunds the credit automatically.
                    </p>
                  </div>

                  {/* Buy Package Button (Secondary Style for Top-ups) */}
                  <button 
                    onClick={() => setShowBuyPackageModal(true)}
                    className="w-full bg-white/20 backdrop-blur-sm text-white py-3 rounded-lg hover:bg-white/30 transition-all duration-300 flex items-center justify-center gap-2 border border-white/30"
                  >
                    <span>Buy Package</span>
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </div>

            {/* Contact Info */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 bg-[var(--color-cream)] rounded-lg">
                <User size={20} className="text-[var(--color-sage)]" />
                <div>
                  <p className="text-xs text-[var(--color-stone)]">Email</p>
                  <p className="text-[var(--color-earth-dark)]">{userData.email}</p>
                </div>
              </div>
              {userData.phone && (
                <div className="flex items-center gap-3 p-4 bg-[var(--color-cream)] rounded-lg">
                  <Clock size={20} className="text-[var(--color-sage)]" />
                  <div>
                    <p className="text-xs text-[var(--color-stone)]">Phone</p>
                    <p className="text-[var(--color-earth-dark)]">{userData.phone}</p>
                  </div>
                </div>
              )}
              {userData.lineId && (
                <div className="flex items-center gap-3 p-4 bg-[var(--color-cream)] rounded-lg">
                  <SettingsIcon size={20} className="text-[var(--color-sage)]" />
                  <div>
                    <p className="text-xs text-[var(--color-stone)]">Line ID</p>
                    <p className="text-[var(--color-earth-dark)]">{userData.lineId}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section B & C: Schedule and History */}
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
          {/* Tabs */}
          <div className="flex gap-4 mb-6 border-b border-[var(--color-sand)]">
            <button
              onClick={() => setActiveView('upcoming')}
              className={`pb-3 px-4 transition-all duration-300 ${
                activeView === 'upcoming'
                  ? 'border-b-2 border-[var(--color-sage)] text-[var(--color-sage)]'
                  : 'text-[var(--color-stone)] hover:text-[var(--color-earth-dark)]'
              }`}
            >
              Upcoming Classes ({upcomingClasses.length})
            </button>
            <button
              onClick={() => setActiveView('history')}
              className={`pb-3 px-4 transition-all duration-300 ${
                activeView === 'history'
                  ? 'border-b-2 border-[var(--color-sage)] text-[var(--color-sage)]'
                  : 'text-[var(--color-stone)] hover:text-[var(--color-earth-dark)]'
              }`}
            >
              Booking History ({completedClasses.length})
            </button>
          </div>

          {/* Upcoming Classes with View Switcher */}
          {activeView === 'upcoming' && (
            <div className="space-y-4">
              {/* View Switcher Toggle */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg text-[var(--color-earth-dark)]">My Bookings</h3>
                <div className="inline-flex rounded-lg border border-[var(--color-sand)] p-1 bg-[var(--color-cream)]">
                  <button
                    onClick={() => setUpcomingView('list')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-300 ${
                      upcomingView === 'list'
                        ? 'bg-white text-[var(--color-sage)] shadow-sm'
                        : 'text-[var(--color-stone)] hover:text-[var(--color-earth-dark)]'
                    }`}
                  >
                    <List size={18} />
                    <span className="text-sm">List</span>
                  </button>
                  <button
                    onClick={() => setUpcomingView('calendar')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-300 ${
                      upcomingView === 'calendar'
                        ? 'bg-white text-[var(--color-sage)] shadow-sm'
                        : 'text-[var(--color-stone)] hover:text-[var(--color-earth-dark)]'
                    }`}
                  >
                    <CalendarDays size={18} />
                    <span className="text-sm">Calendar</span>
                  </button>
                </div>
              </div>

              {/* List View */}
              {upcomingView === 'list' && (
                <div className="space-y-4">
                  {upcomingClasses.length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar size={48} className="mx-auto text-[var(--color-sand)] mb-4" />
                      <p className="text-[var(--color-stone)]">No upcoming classes booked</p>
                      <button className="mt-4 px-6 py-2 bg-[var(--color-sage)] text-white rounded-lg hover:bg-[var(--color-clay)] transition-all duration-300">
                        Browse Classes
                      </button>
                    </div>
                  ) : (
                    upcomingClasses.map((classItem) => (
                      <div
                        key={classItem.id}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border border-[var(--color-sand)] rounded-lg hover:shadow-md transition-all duration-300"
                      >
                        <div className="flex-1 mb-4 sm:mb-0">
                          <h3 className="text-lg text-[var(--color-earth-dark)] mb-1">
                            {classItem.className}
                          </h3>
                          <div className="flex flex-wrap gap-4 text-sm text-[var(--color-stone)]">
                            <div className="flex items-center gap-2">
                              <User size={16} />
                              <span>{classItem.instructor}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar size={16} />
                              <span>{formatDate(classItem.date)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock size={16} />
                              <span>{classItem.time}</span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleCancelClick(classItem)}
                          className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-300 border border-red-200 hover:border-red-300"
                        >
                          Cancel Booking
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Calendar View */}
              {upcomingView === 'calendar' && renderCalendarView()}
            </div>
          )}

          {/* Booking History */}
          {activeView === 'history' && (
            <div className="space-y-4">
              {completedClasses.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle size={48} className="mx-auto text-[var(--color-sand)] mb-4" />
                  <p className="text-[var(--color-stone)]">No booking history yet</p>
                </div>
              ) : (
                completedClasses.map((classItem) => (
                  <div
                    key={classItem.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border border-[var(--color-sand)] rounded-lg bg-[var(--color-cream)]/30"
                  >
                    <div className="flex-1">
                      <h3 className="text-lg text-[var(--color-earth-dark)] mb-1">
                        {classItem.className}
                      </h3>
                      <div className="flex flex-wrap gap-4 text-sm text-[var(--color-stone)]">
                        <div className="flex items-center gap-2">
                          <User size={16} />
                          <span>{classItem.instructor}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar size={16} />
                          <span>{formatDate(classItem.date)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock size={16} />
                          <span>{classItem.time}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-green-600 mt-4 sm:mt-0">
                      <CheckCircle size={20} />
                      <span className="text-sm">Completed</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && selectedClassToCancel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertCircle size={20} className="text-red-600" />
                </div>
                <h3 className="text-xl text-[var(--color-earth-dark)]">Cancel Booking?</h3>
              </div>
              <button
                onClick={() => setShowCancelModal(false)}
                className="text-[var(--color-stone)] hover:text-[var(--color-earth-dark)]"
              >
                <X size={24} />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-[var(--color-stone)] mb-4">
                Are you sure you want to cancel your booking for:
              </p>
              <div className="bg-[var(--color-cream)] p-4 rounded-lg">
                <p className="text-[var(--color-earth-dark)]">{selectedClassToCancel.className}</p>
                <p className="text-sm text-[var(--color-stone)] mt-1">
                  {formatDate(selectedClassToCancel.date)} at {selectedClassToCancel.time}
                </p>
              </div>
              {userData.creditsLeft !== undefined && (
                <p className="text-sm text-green-600 mt-3">
                  ✓ Your credit will be refunded to your account
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 px-4 py-3 border border-[var(--color-sand)] text-[var(--color-stone)] rounded-lg hover:bg-[var(--color-cream)] transition-all duration-300"
              >
                Keep Booking
              </button>
              <button
                onClick={handleConfirmCancel}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-300"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Buy Package Modal */}
      {showBuyPackageModal && (
        <BuyPackageModal
          isOpen={showBuyPackageModal}
          onClose={() => setShowBuyPackageModal(false)}
          userId={userData.id}
          userName={userData.name}
        />
      )}
    </div>
  );
}