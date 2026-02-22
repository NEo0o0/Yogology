"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';

import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  DollarSign, 
  Settings, 
  FileText, 
  UserCheck,
  CreditCard,
  User,
  Plus,
  Menu,
  X,
  Home,
  LogOut,
  ChevronDown,
  Mail,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/hooks/useAuth';
import { CreateClassModal } from '@/components/bookings/CreateClassModal';
import { ClassManagement } from './ClassManagement';
import { MembersManagement } from './MembersManagement';
import { PaymentsManagement } from './PaymentsManagement';
import { ReportsAnalytics } from './ReportsAnalytics';
import { TodaysClassesTable } from './TodaysClassesTable';
import { NewsletterSubscribers } from './NewsletterSubscribers';
import { AdminBookingModal } from './AdminBookingModal';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { VerifySlipsSection } from './VerifySlipsSection';
import { SiteSettings } from './SiteSettings';
import { ManualTransactionModal } from './ManualTransactionModal';
import { toast } from 'sonner';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { supabase } from '@/utils/supabase/client';

type AdminBooking = {
  id: string;
  studentId?: string;
  name?: string;
  avatar?: string;
  phone?: string;
  contactInfo?: string;
  contactPlatform?: string;
  status?: string;
  bookingTime?: string;
  class_id?: number;
  guest_name?: string | null;
  paymentStatus?: string;
  amountDue?: number;
  amountPaid?: number;
  paidAt?: string | null;
  isAttended?: boolean;
  healthCondition?: string | null;
};

type TodaysClassItem = {
  id: number;
  name: string;
  time: string;
  booked: number;
  capacity: number;
  instructor: string;
  room?: string;
};

interface AdminDashboardProps {
  onNavigateHome?: () => void;
  onLogout?: () => void;
}

export function AdminDashboard({ onNavigateHome, onLogout }: AdminDashboardProps = {}) {
  const { setIsLoggedIn } = useApp();
  const { userRole, isAdmin } = useAuth();
  const { stats, loading: statsLoading, error: statsError, refetch: refetchStats } = useDashboardStats();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentSection, setCurrentSection] = useState('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [now, setNow] = useState<Date | null>(null);

  const [showManualBookingModal, setShowManualBookingModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<{ id: number; name: string; time: string } | null>(null);
  const [selectedClassDefaultAmountDue, setSelectedClassDefaultAmountDue] = useState<number>(0);
  const [bookingsState, setBookingsState] = useState<Record<number, AdminBooking[]>>({});
  const [todaysClassesState, setTodaysClassesState] = useState<TodaysClassItem[]>([]);
  const [todaysClassesLoading, setTodaysClassesLoading] = useState(false);
  const [todaysClassesError, setTodaysClassesError] = useState<Error | null>(null);
  const [todaysBookingsLoading, setTodaysBookingsLoading] = useState(false);
  const [todaysBookingsError, setTodaysBookingsError] = useState<Error | null>(null);

  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [checkinClassId, setCheckinClassId] = useState<number | null>(null);
  const [checkinSaving, setCheckinSaving] = useState(false);

  const [showManualPaymentModal, setShowManualPaymentModal] = useState(false);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: 'default' | 'warning' | 'success';
    confirmText?: string;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  useEffect(() => {
    setIsLoggedIn(true);
  }, [setIsLoggedIn]);

  // Safety check: Redirect staff users away from restricted sections
  useEffect(() => {
    const restrictedSections = ['payments', 'reports', 'settings'];
    if (!isAdmin && restrictedSections.includes(currentSection)) {
      setCurrentSection('dashboard');
    }
  }, [isAdmin, currentSection]);

  // Initialize time on client-side only to prevent hydration mismatch
  useEffect(() => {
    setNow(new Date()); // Set initial time
    const tick = () => setNow(new Date());
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);

  const loadToday = useCallback(async () => {
    console.log('[AdminDashboard] Starting loadToday...');
    setTodaysClassesLoading(true);
    setTodaysClassesError(null);
    setTodaysBookingsLoading(true);
    setTodaysBookingsError(null);

    try {
      const now = new Date();
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);

      console.log('[AdminDashboard] Fetching today\'s classes:', {
        start: start.toISOString(),
        end: end.toISOString(),
      });

      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select(
          'id, title, starts_at, ends_at, capacity, booked_count, location, instructor_id, instructor_name, class_types!left(title), instructor:profiles!classes_instructor_id_fkey(full_name)'
        )
        .eq('is_cancelled', false)
        .ilike('category', 'class')
        .gte('starts_at', start.toISOString())
        .lte('starts_at', end.toISOString())
        .order('starts_at', { ascending: true });

      if (classesError) {
        console.error('[AdminDashboard] Error fetching classes:', {
          message: classesError.message,
          details: classesError.details,
          hint: classesError.hint,
          code: classesError.code,
        });
        throw classesError;
      }

      console.log('[AdminDashboard] Successfully fetched', classesData?.length ?? 0, 'classes');

      const mappedClasses: TodaysClassItem[] = (classesData ?? []).map((c: any) => {
        const startTime = new Date(c.starts_at);
        const endTime = c.ends_at ? new Date(c.ends_at) : null;
        const fmt = (d: Date) =>
          d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        const time = endTime ? `${fmt(startTime)} - ${fmt(endTime)}` : fmt(startTime);
        
        // Priority: instructor_name (guest) > instructor.full_name (registered) > default
        const instructorName = c.instructor_name 
          || c.instructor?.full_name 
          || 'Annie Bliss Team';
        
        return {
          id: Number(c.id),
          name: c.title,
          time,
          booked: Number(c.booked_count ?? 0),
          capacity: Number(c.capacity ?? 0),
          instructor: instructorName,
          room: c.location ?? '',
        };
      });

      setTodaysClassesState(mappedClasses);

      const classIds = mappedClasses.map((c) => c.id);
      if (classIds.length === 0) {
        setBookingsState({});
        return;
      }

      try {
        console.log('[AdminDashboard] Fetching bookings for class IDs:', classIds);
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select(
            'id, class_id, user_id, status, is_attended, payment_status, amount_due, amount_paid, paid_at, guest_name, guest_contact, guest_health_condition, guest_avatar_url, profiles(id, full_name, avatar_url, health_condition, phone, contact_info)'
          )
          .in('class_id', classIds)
          .neq('status', 'cancelled')
          .is('cancelled_at', null)
          .order('id', { ascending: false });

        if (bookingsError) {
          console.error('[AdminDashboard] Error fetching bookings:', {
            message: bookingsError.message,
            details: bookingsError.details,
            hint: bookingsError.hint,
            code: bookingsError.code,
          });
          throw bookingsError;
        }

        console.log('[AdminDashboard] Successfully fetched', bookingsData?.length ?? 0, 'bookings');

        const byClass: Record<number, AdminBooking[]> = {};
        for (const b of bookingsData ?? []) {
          const profile = (b as any).profiles;
          const isGuest = !(b as any).user_id;
          
          // Unified name logic: member OR guest
          const fullName = isGuest 
            ? ((b as any).guest_name || 'Guest')
            : (profile?.full_name ?? 'Unnamed');
          
          const initials = String(fullName)
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((n) => n[0])
            .join('')
            .toUpperCase();

          // Unified avatar logic: member OR guest
          const avatarUrl = isGuest
            ? (b as any).guest_avatar_url
            : profile?.avatar_url;

          // Unified health condition logic: member OR guest
          const healthCondition = isGuest
            ? (b as any).guest_health_condition
            : profile?.health_condition;

          // Unified contact info logic: member OR guest
          const phone = isGuest
            ? ((b as any).guest_contact || '')
            : (profile?.phone || '');
          
          const contactInfo = isGuest
            ? ''
            : (profile?.contact_info || '');

          // Detect contact platform from URL
          let contactPlatform = '';
          if (contactInfo) {
            if (contactInfo.includes('line.me')) {
              contactPlatform = 'line';
            } else if (contactInfo.includes('wa.me') || contactInfo.includes('whatsapp')) {
              contactPlatform = 'whatsapp';
            } else if (contactInfo.includes('instagram')) {
              contactPlatform = 'instagram';
            } else if (contactInfo.includes('facebook')) {
              contactPlatform = 'facebook';
            }
          }

          const classId = Number((b as any).class_id);
          byClass[classId] = byClass[classId] ?? [];
          byClass[classId].push({
            id: String((b as any).id),
            studentId: String((b as any).user_id ?? ''),
            name: fullName,
            avatar: avatarUrl || initials,
            phone: phone,
            contactInfo: contactInfo,
            contactPlatform: contactPlatform,
            status: 'confirmed',
            bookingTime: '',
            class_id: classId,
            guest_name: (b as any).guest_name ?? null,
            paymentStatus: String((b as any).payment_status ?? ''),
            amountDue: Number((b as any).amount_due ?? 0),
            amountPaid: Number((b as any).amount_paid ?? 0),
            paidAt: ((b as any).paid_at as string | null) ?? null,
            isAttended: Boolean((b as any).is_attended),
            healthCondition: healthCondition || null,
          });
        }

        setBookingsState(byClass);
      } catch (e) {
        const asError = e instanceof Error ? e : new Error(String(e));
        setTodaysBookingsError(asError);
        setBookingsState({});
      }
    } catch (e) {
      const asError = e instanceof Error ? e : new Error(String(e));
      setTodaysClassesError(asError);
      setTodaysBookingsError(asError);
      
      // Show toast notification for better UX
      const message = asError.message || 'Failed to load today\'s classes';
      toast.error(message, { duration: 5000 });
      console.error('Error loading today\'s data:', asError);
    } finally {
      setTodaysClassesLoading(false);
      setTodaysBookingsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadToday();
  }, [loadToday]);

  const handleNavigateHome = () => {
    if (onNavigateHome) {
      onNavigateHome();
    } else {
      window.location.href = '/';
    }
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      // Default logout behavior
      setIsLoggedIn(false);
      window.location.reload();
    }
  };

  const closeMobileSidebar = () => {
    setIsMobileSidebarOpen(false);
  };

  const handleSectionChange = (section: string) => {
    setCurrentSection(section);
    closeMobileSidebar();
  };

  const handleManualBooking = async (classId: number, className: string, classTime: string) => {
    setSelectedClass({ id: classId, name: className, time: classTime });
    setSelectedClassDefaultAmountDue(0);
    try {
      const { data } = await supabase
        .from('classes')
        .select('price')
        .eq('id', Number(classId))
        .maybeSingle();

      const price = Number((data as any)?.price ?? 0);
      setSelectedClassDefaultAmountDue(Number.isFinite(price) ? price : 0);
    } catch {
      // Keep default
    }
    setShowManualBookingModal(true);
  };

  const handleBookingComplete = (booking: AdminBooking, payment?: any) => {
    // Add new booking to state
    const classId = Number(booking.class_id);
    setBookingsState(prev => ({
      ...prev,
      [classId]: [...(prev[classId] || []), booking]
    }));

    // If payment info is provided (for walk-in guests), create payment record
    if (payment && payment.isPaid) {
      const paymentRecord = {
        id: `payment-${Date.now()}`,
        title: `Drop-in: ${booking.guest_name} - ${selectedClass?.name || 'Class'}`,
        category: 'income',
        amount: payment.amount,
        date: new Date().toISOString().split('T')[0],
        method: payment.method,
        status: 'completed'
      };
      
      // TODO: In real implementation, save this to database
      console.log('Payment created:', paymentRecord);
      
      toast.success(`Booking and payment (฿${payment.amount}) recorded successfully!`, {
        duration: 4000
      });
    }
  };

  const handleMarkAsPaid = async (bookingId: string, classId: number, className: string, amount: number) => {
    try {
      // Update booking payment status in state
      setBookingsState(prev => ({
        ...prev,
        [classId]: (prev[classId] || []).map((booking: AdminBooking) => 
          booking.id === bookingId 
            ? { ...booking, paymentStatus: 'paid' }
            : booking
        )
      }));

      // Create payment record
      const booking = bookingsState[classId]?.find((b: AdminBooking) => b.id === bookingId);
      const paymentRecord = {
        id: `payment-${Date.now()}`,
        title: `Drop-in: ${booking?.name} - ${className}`,
        category: 'income',
        amount: amount,
        date: new Date().toISOString().split('T')[0],
        method: 'cash',
        status: 'completed'
      };
      
      // TODO: In real implementation, call API endpoint
      // PATCH /make-server-baa97425/bookings/${bookingId}/mark-paid
      console.log('Payment created for previously unpaid booking:', paymentRecord);
      
      toast.success(`Payment (฿${amount}) recorded successfully!`, {
        duration: 4000
      });
    } catch (error) {
      console.error('Error marking booking as paid:', error);
      toast.error('Failed to record payment');
    }
  };

  const handleCancelBooking = async (bookingId: string, classId: number, className: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Cancel Booking',
      message: `Are you sure you want to cancel this booking for ${className}? This action cannot be undone.`,
      variant: 'warning',
      confirmText: 'Yes, Cancel',
      onConfirm: async () => {
        try {
          const idAsNumber = Number(bookingId);
          if (!Number.isFinite(idAsNumber)) {
            toast.error('This booking cannot be cancelled (invalid id)');
            return;
          }

          const { error } = await supabase.rpc('cancel_booking', { p_booking_id: idAsNumber });
          if (error) throw error;

          setBookingsState((prev) => ({
            ...prev,
            [classId]: (prev[classId] || []).filter((b: any) => String(b.id) !== String(bookingId)),
          }));

          setTodaysClassesState((prev) =>
            prev.map((c) => {
              if (Number(c.id) !== Number(classId)) return c;
              return { ...c, booked: Math.max(0, Number(c.booked ?? 0) - 1) };
            })
          );

          toast.success(`Booking cancelled for ${className}`, { duration: 3000 });
          await loadToday();
          void refetchStats();
        } catch (e) {
          const message = e instanceof Error ? e.message : String(e);
          toast.error(message || 'Failed to cancel booking');
        }
      },
    });
  };

  const handleToggleAttendance = async (bookingId: string, classId: number, nextValue: boolean) => {
    const bookingIdAsNumber = Number(bookingId);
    if (!Number.isFinite(bookingIdAsNumber)) {
      toast.error('Invalid booking id');
      return;
    }

    // Optimistic update
    setBookingsState((prev) => ({
      ...prev,
      [classId]: (prev[classId] || []).map((b: AdminBooking) =>
        bookingId === b.id ? { ...b, isAttended: nextValue } : b
      ),
    }));

    try {
      setCheckinSaving(true);
      const { error } = await supabase
        .from('bookings')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .update({ is_attended: nextValue } as any)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .eq('id' as any, bookingIdAsNumber as any);

      if (error) throw error;

      // Refetch to ensure fresh data
      await loadToday();
      void refetchStats();

      toast.success(
        nextValue 
          ? 'Check-in recorded successfully!' 
          : 'Check-out recorded successfully!',
        { duration: 3000 }
      );
    } catch (e) {
      // Revert on error
      setBookingsState((prev) => ({
        ...prev,
        [classId]: (prev[classId] || []).map((b: AdminBooking) =>
          bookingId === b.id ? { ...b, isAttended: !nextValue } : b
        ),
      }));
      const message = e instanceof Error ? e.message : String(e);
      toast.error(message || 'Failed to update check-in');
    } finally {
      setCheckinSaving(false);
    }
  };

  const handleTogglePaymentStatus = async (
    bookingId: string,
    classId: number,
    nextStatus: 'paid' | 'unpaid',
    amountDue: number
  ) => {
    const bookingIdAsNumber = Number(bookingId);
    if (!Number.isFinite(bookingIdAsNumber)) {
      toast.error('Invalid booking id');
      return;
    }

    const nextAmountPaid = nextStatus === 'paid' ? Number(amountDue ?? 0) : 0;
    const nextPaidAt = nextStatus === 'paid' ? new Date().toISOString() : null;

    // Optimistic update
    setBookingsState((prev) => ({
      ...prev,
      [classId]: (prev[classId] || []).map((b: AdminBooking) =>
        bookingId === b.id
          ? { ...b, paymentStatus: nextStatus, amountPaid: nextAmountPaid, paidAt: nextPaidAt }
          : b
      ),
    }));

    try {
      // Get current admin user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      // Get booking details for payment record
      const booking = bookingsState[classId]?.find((b: AdminBooking) => b.id === bookingId);
      if (!booking) {
        throw new Error('Booking not found');
      }

      // Update bookings table
      const updatePayload: Record<string, any> = {
        payment_status: nextStatus,
        amount_paid: nextAmountPaid,
        paid_at: nextPaidAt,
      };

      const { error: bookingError } = await supabase
        .from('bookings')
        .update(updatePayload)
        .eq('id', bookingIdAsNumber);

      if (bookingError) {
        console.error('Booking update error:', bookingError);
        throw bookingError;
      }

      // If marking as PAID, insert payment record for audit trail
      if (nextStatus === 'paid' && nextAmountPaid > 0) {
        const { error: paymentError } = await supabase
          .from('payments')
          .insert({
            booking_id: bookingIdAsNumber,
            user_id: booking.studentId || user.id,
            amount: nextAmountPaid,
            method: 'cash',
            log_status: 'paid',
            paid_at: nextPaidAt,
            recorded_by: user.id,
            currency: 'THB',
            note: `Payment recorded via admin dashboard for class booking #${bookingIdAsNumber}`
          } as any);

        if (paymentError) {
          console.error('Failed to create payment record:', paymentError);
          toast.warning('Payment recorded but audit log failed. Please check logs.');
        }
      }

      // Refresh revenue immediately
      void refetchStats();

      // Show success toast
      toast.success(
        nextStatus === 'paid' 
          ? `Payment of ฿${amountDue} recorded successfully!` 
          : 'Payment status updated to unpaid',
        { duration: 3000 }
      );
    } catch (e) {
      // Revert on error
      setBookingsState((prev) => ({
        ...prev,
        [classId]: (prev[classId] || []).map((b: AdminBooking) => {
          if (b.id !== bookingId) return b;
          const revertedStatus = nextStatus === 'paid' ? 'unpaid' : 'paid';
          return {
            ...b,
            paymentStatus: revertedStatus,
            amountPaid: revertedStatus === 'paid' ? Number(amountDue ?? 0) : 0,
            paidAt: revertedStatus === 'paid' ? new Date().toISOString() : null,
          };
        }),
      }));

      const message = e instanceof Error ? e.message : String(e);
      toast.error(message || 'Failed to update payment status');
    }
  };

  const renderPlaceholder = (title: string) => (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl md:text-3xl text-[var(--color-earth-dark)] mb-4">{title}</h1>
      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <p className="text-[var(--color-stone)] text-lg">This section is coming soon!</p>
      </div>
    </div>
  );

  const SidebarContent = () => (
    <>
      <div className="p-6 border-b border-[var(--color-sand)]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[var(--color-earth-dark)]">Annie Bliss Yoga</h2>
            <p className="text-xs text-[var(--color-stone)] mt-1">Admin Dashboard</p>
          </div>
          <button
            onClick={closeMobileSidebar}
            className="md:hidden p-2 hover:bg-[var(--color-cream)] rounded-lg transition-colors"
          >
            <X size={24} className="text-[var(--color-stone)]" />
          </button>
        </div>
      </div>

      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          <li>
            <button
              onClick={() => handleSectionChange('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                currentSection === 'dashboard'
                  ? 'bg-[var(--color-sage)] text-white'
                  : 'text-[var(--color-stone)] hover:bg-[var(--color-cream)]'
              }`}
            >
              <LayoutDashboard size={20} />
              <span>Dashboard</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => handleSectionChange('classes')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                currentSection === 'classes'
                  ? 'bg-[var(--color-sage)] text-white'
                  : 'text-[var(--color-stone)] hover:bg-[var(--color-cream)]'
              }`}
            >
              <Calendar size={20} />
              <span>Classes</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => handleSectionChange('members')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                currentSection === 'members'
                  ? 'bg-[var(--color-sage)] text-white'
                  : 'text-[var(--color-stone)] hover:bg-[var(--color-cream)]'
              }`}
            >
              <Users size={20} />
              <span>Members</span>
            </button>
          </li>
          {isAdmin && (
            <li>
              <button
                onClick={() => handleSectionChange('payments')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                  currentSection === 'payments'
                    ? 'bg-[var(--color-sage)] text-white'
                    : 'text-[var(--color-stone)] hover:bg-[var(--color-cream)]'
                }`}
              >
                <DollarSign size={20} />
                <span>Payments</span>
              </button>
            </li>
          )}
          <li>
            <button
              onClick={() => handleSectionChange('verify-slips')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                currentSection === 'verify-slips'
                  ? 'bg-[var(--color-sage)] text-white'
                  : 'text-[var(--color-stone)] hover:bg-[var(--color-cream)]'
              }`}
            >
              <CheckCircle2 size={20} />
              <span>Verify Payment Slips</span>
            </button>
          </li>
          {isAdmin && (
            <li>
              <button
                onClick={() => handleSectionChange('reports')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                  currentSection === 'reports'
                    ? 'bg-[var(--color-sage)] text-white'
                    : 'text-[var(--color-stone)] hover:bg-[var(--color-cream)]'
                }`}
              >
                <FileText size={20} />
                <span>Reports</span>
              </button>
            </li>
          )}
        </ul>

        <div className="my-6 border-t border-[var(--color-sand)]" />

        <ul className="space-y-2">
          <li>
            <button
              onClick={() => handleSectionChange('subscribers')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                currentSection === 'subscribers'
                  ? 'bg-[var(--color-sage)] text-white'
                  : 'text-[var(--color-stone)] hover:bg-[var(--color-cream)]'
              }`}
            >
              <Mail size={20} />
              <span>Subscribers</span>
            </button>
          </li>
          {isAdmin && (
            <li>
              <button
                onClick={() => handleSectionChange('settings')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                  currentSection === 'settings'
                    ? 'bg-[var(--color-sage)] text-white'
                    : 'text-[var(--color-stone)] hover:bg-[var(--color-cream)]'
                }`}
              >
                <Settings size={20} />
                <span>Settings</span>
              </button>
            </li>
          )}
        </ul>
      </nav>

      <div className="mt-auto border-t border-[var(--color-sand)]">
        <div className="p-4">
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[var(--color-cream)]">
            <div className="w-10 h-10 rounded-full bg-[var(--color-sage)] flex items-center justify-center text-white">
              <User size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-[var(--color-earth-dark)] truncate">
                {userRole === 'admin' ? 'Admin' : userRole === 'staff' ? 'Staff' : 'User'}
              </div>
              <div className="text-xs text-[var(--color-stone)]">{userRole} access</div>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-2">
          <button
            onClick={handleNavigateHome}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[var(--color-stone)] hover:bg-[var(--color-cream)] transition-colors duration-300"
          >
            <Home size={20} />
            <span>Back to Home</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors duration-300"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-[var(--color-cream)]">
      {/* Mobile Header - Only visible on mobile */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white shadow-md z-30">
        <div className="flex items-center justify-between p-4">
          <div>
            <h2 className="text-lg text-[var(--color-earth-dark)]">Annie Bliss Yoga</h2>
            <p className="text-xs text-[var(--color-stone)] mt-1">Admin Dashboard</p>
          </div>
          {/* Close button for mobile */}
          <button
            onClick={closeMobileSidebar}
            className="md:hidden p-2 hover:bg-[var(--color-cream)] rounded-lg transition-colors"
          >
            <X size={24} className="text-[var(--color-stone)]" />
          </button>
        </div>
      </div>

      {/* Desktop Sidebar - Hidden on mobile, visible on desktop */}
      <aside className="hidden md:flex md:w-64 bg-white shadow-xl flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar - Slide-over drawer */}
      {isMobileSidebarOpen && (
        <>
          {/* Backdrop overlay */}
          <div 
            className="md:hidden fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
            onClick={closeMobileSidebar}
          />
          
          {/* Slide-over sidebar (80% width on mobile) */}
          <aside 
            className={`md:hidden fixed top-0 left-0 bottom-0 w-4/5 max-w-sm bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ${
              isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <SidebarContent />
          </aside>
        </>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto mt-16 md:mt-0">
        {/* Render current section */}
        {currentSection === 'dashboard' && (
          <>
            {/* Top Bar */}
            <div className="bg-white shadow-sm px-4 md:px-8 py-4 md:py-6 border-b border-[var(--color-sand)]">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl text-[var(--color-earth-dark)] mb-1">Dashboard</h1>
                  <p className="text-sm md:text-base text-[var(--color-stone)]">
                    {now ? now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Loading...'}
                  </p>
                </div>
                <div className="text-left md:text-right">
                  <div className="text-xs md:text-sm text-[var(--color-stone)]">Current Time</div>
                  <div className="text-xl md:text-2xl text-[var(--color-earth-dark)]">
                    {now ? now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : '--:--'}
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 md:p-8">
              {/* Stats Overview */}
              <div className="mb-8">
                <h2 className="mb-6 text-lg md:text-xl text-[var(--color-earth-dark)]">Overview</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                  {/* Total Bookings Card */}
                  <div className="bg-white rounded-lg p-4 md:p-6 shadow-md hover:shadow-xl transition-shadow duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Calendar size={20} className="md:w-6 md:h-6 text-blue-600" />
                      </div>
                    </div>
                    <div className="text-2xl md:text-3xl text-[var(--color-earth-dark)] mb-1">
                      {statsLoading ? <Loader2 size={20} className="animate-spin" /> : statsError ? 'Error' : (stats?.total_bookings ?? '—')}
                    </div>
                    <div className="text-sm text-[var(--color-stone)]">Total Bookings</div>
                    <div className="text-xs text-[var(--color-stone)] mt-2">This month</div>
                  </div>

                  {/* Active Members Card */}
                  <div className="bg-white rounded-lg p-4 md:p-6 shadow-md hover:shadow-xl transition-shadow duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                        <Users size={20} className="md:w-6 md:h-6 text-purple-600" />
                      </div>
                    </div>
                    <div className="text-2xl md:text-3xl text-[var(--color-earth-dark)] mb-1">
                      {statsLoading ? <Loader2 size={20} className="animate-spin" /> : statsError ? 'Error' : (stats?.active_members ?? '—')}
                    </div>
                    <div className="text-sm text-[var(--color-stone)]">Active Members</div>
                    <div className="text-xs text-[var(--color-stone)] mt-2">Current month</div>
                  </div>

                  {/* Revenue Card - Hidden for Staff */}
                  {isAdmin && (
                    <div className="bg-white rounded-lg p-4 md:p-6 shadow-md hover:shadow-xl transition-shadow duration-300">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-green-100 flex items-center justify-center">
                          <DollarSign size={20} className="md:w-6 md:h-6 text-green-600" />
                        </div>
                      </div>
                      <div className="text-2xl md:text-3xl text-[var(--color-earth-dark)] mb-1">
                        {statsLoading ? <Loader2 size={20} className="animate-spin" /> : statsError ? 'Error' : stats?.revenue != null ? `฿${Number(stats.revenue).toLocaleString()}` : '—'}
                      </div>
                      <div className="text-sm text-[var(--color-stone)]">Revenue</div>
                      <div className="text-xs text-[var(--color-stone)] mt-2">This month</div>
                    </div>
                  )}

                  {/* Drop-ins Card */}
                  <div className="bg-white rounded-lg p-4 md:p-6 shadow-md hover:shadow-xl transition-shadow duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                        <UserCheck size={20} className="md:w-6 md:h-6 text-orange-600" />
                      </div>
                    </div>
                    <div className="text-2xl md:text-3xl text-[var(--color-earth-dark)] mb-1">
                      {statsLoading ? <Loader2 size={20} className="animate-spin" /> : statsError ? 'Error' : (stats?.dropins ?? '—')}
                    </div>
                    <div className="text-sm text-[var(--color-stone)]">Drop-ins</div>
                    <div className="text-xs text-[var(--color-stone)] mt-2">This month</div>
                  </div>
                </div>
              </div>

              {/* Two Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                {/* Today's Classes Table */}
                <div className="lg:col-span-2">
                  {todaysClassesLoading || todaysBookingsLoading ? (
                    <div className="bg-white rounded-lg shadow-md p-10 flex items-center justify-center text-[var(--color-stone)]">
                      <Loader2 size={20} className="animate-spin mr-2" />
                      Loading...
                    </div>
                  ) : todaysClassesError || todaysBookingsError ? (
                    <div className="bg-white rounded-lg shadow-md p-10 text-center">
                      <div className="text-red-600 mb-4">
                        <p className="text-lg mb-2">Failed to load today's classes</p>
                        <p className="text-sm text-[var(--color-stone)]">
                          {todaysClassesError?.message || todaysBookingsError?.message || 'An error occurred'}
                        </p>
                      </div>
                      <button
                        onClick={() => loadToday()}
                        className="bg-[var(--color-sage)] hover:bg-[var(--color-clay)] text-white px-6 py-3 rounded-lg transition-all duration-300"
                      >
                        Retry
                      </button>
                    </div>
                  ) : (
                    <TodaysClassesTable 
                      classes={todaysClassesState as any} 
                      bookings={bookingsState as any}
                      onManualBooking={handleManualBooking}
                      onMarkAsPaid={handleMarkAsPaid}
                      onCancelBooking={handleCancelBooking}
                      onToggleAttendance={handleToggleAttendance as any}
                      onTogglePaymentStatus={handleTogglePaymentStatus as any}
                    />
                  )}
                </div>

                {/* Quick Actions */}
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
                    <h3 className="mb-6 text-base md:text-lg text-[var(--color-earth-dark)]">Quick Actions</h3>
                    
                    <div className="space-y-4">
                      {/* Check-in User Button */}
                      <button
                        onClick={() => {
                          if (todaysClassesState.length === 0) {
                            toast.error('No classes scheduled today');
                            return;
                          }
                          // Force selecting a class in the modal (don't auto-select silently)
                          setCheckinClassId(null);
                          setShowCheckinModal(true);
                        }}
                        className="w-full bg-[var(--color-sage)] hover:bg-[var(--color-clay)] text-white px-4 md:px-6 py-3 md:py-4 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-3 group"
                      >
                        <UserCheck size={20} className="group-hover:scale-110 transition-transform duration-300" />
                        <span className="text-sm md:text-base">Check-in User</span>
                      </button>

                      {/* Record Payment Button */}
                      <button 
                        onClick={() => setShowManualPaymentModal(true)}
                        className="w-full bg-[var(--color-earth-dark)] hover:bg-[var(--color-clay)] text-white px-4 md:px-6 py-3 md:py-4 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-3 group"
                      >
                        <CreditCard size={20} className="group-hover:scale-110 transition-transform duration-300" />
                        <span className="text-sm md:text-base">Record Payment</span>
                      </button>

                      {/* Divider */}
                      <div className="border-t border-[var(--color-sand)] my-6" />

                      {/* Additional Quick Links */}
                      <div className="space-y-2">
                        <button
                          onClick={() => setShowCreateModal(true)}
                          className="w-full flex items-center gap-2 px-4 py-3 rounded-lg text-[var(--color-sage)] hover:bg-[var(--color-cream)] transition-colors duration-300 border-2 border-[var(--color-sage)] hover:border-[var(--color-clay)] text-sm md:text-base"
                        >
                          <Plus size={18} />
                          <span>Add New Class</span>
                        </button>
                        <button
                          onClick={() => handleSectionChange('classes')}
                          className="w-full text-left px-4 py-3 rounded-lg text-[var(--color-stone)] hover:bg-[var(--color-cream)] transition-colors duration-300 text-sm md:text-base"
                        >
                          → Manage Class Templates
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats Widget */}
                  <div className="bg-gradient-to-br from-[var(--color-sage)] to-[var(--color-clay)] rounded-lg shadow-md p-4 md:p-6 mt-6 text-white">
                    <h4 className="mb-4 text-base md:text-lg">Today's Summary</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs md:text-sm opacity-90">Total Check-ins</span>
                        <span className="text-xl md:text-2xl">
                          {statsLoading ? <Loader2 size={18} className="animate-spin" /> : statsError ? 'Error' : (stats?.today_checkins ?? '—')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs md:text-sm opacity-90">Classes Completed</span>
                        <span className="text-xl md:text-2xl">
                          {statsLoading ? <Loader2 size={18} className="animate-spin" /> : statsError ? 'Error' : (stats?.today_classes_completed ?? '—')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs md:text-sm opacity-90">Revenue Today</span>
                        <span className="text-xl md:text-2xl">
                          {statsLoading ? (
                            <Loader2 size={18} className="animate-spin" />
                          ) : statsError ? (
                            'Error'
                          ) : stats?.today_revenue != null ? (
                            `฿${Number(stats.today_revenue).toLocaleString()}`
                          ) : (
                            '—'
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {currentSection === 'classes' && <ClassManagement />}
        {currentSection === 'members' && <MembersManagement />}
        {isAdmin && currentSection === 'payments' && <PaymentsManagement />}
        {currentSection === 'verify-slips' && (
          <div className="p-4 md:p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-[var(--color-earth-dark)]">
                Payment Slip Verification
              </h1>
              <p className="text-[var(--color-stone)] mt-2">
                Review and approve payment slips from users
              </p>
            </div>
            <VerifySlipsSection />
          </div>
        )}
        {isAdmin && currentSection === 'reports' && <ReportsAnalytics />}
        {currentSection === 'subscribers' && <NewsletterSubscribers />}
        {isAdmin && currentSection === 'settings' && (
          <div className="p-4 md:p-8">
            <SiteSettings />
          </div>
        )}
      </main>
      
      {/* Create Class Modal */}
      {showCreateModal && (
        <CreateClassModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            void loadToday();
          }}
        />
      )}
      
      {/* Check-in Modal */}
      {showCheckinModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowCheckinModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative bg-gradient-to-br from-[var(--color-sage)] to-[var(--color-clay)] text-white p-6 rounded-t-2xl">
              <button
                onClick={() => setShowCheckinModal(false)}
                className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors duration-300"
              >
                <X size={20} />
              </button>
              <h2 className="text-white">Check-in</h2>
              <p className="text-white/90 mt-1 text-sm">Toggle attendance for today’s bookings</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-[var(--color-stone)] mb-2">Class</label>
                <select
                  value={checkinClassId ?? ''}
                  onChange={(e) => setCheckinClassId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-4 py-3 border border-[var(--color-sand)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-sage)] transition-all duration-300"
                >
                  <option value="">Select a class</option>
                  {todaysClassesState.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.time} — {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="border-t border-[var(--color-sand)]" />

              {checkinClassId == null ? (
                <div className="text-sm text-[var(--color-stone)]">Select a class to view bookings.</div>
              ) : (bookingsState[checkinClassId] ?? []).length === 0 ? (
                <div className="text-sm text-[var(--color-stone)]">
                  <div>No bookings for this class.</div>
                  <button
                    type="button"
                    onClick={() => {
                      const selected = todaysClassesState.find((c) => c.id === checkinClassId);
                      if (!selected) return;
                      setShowCheckinModal(false);
                      void handleManualBooking(selected.id, selected.name, selected.time);
                    }}
                    className="mt-4 bg-[var(--color-sage)] hover:bg-[var(--color-clay)] text-white px-4 py-2 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    Book Student
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {(bookingsState[checkinClassId] ?? []).map((b: AdminBooking) => (
                    <div
                      key={b.id}
                      className="flex items-center justify-between gap-3 bg-[var(--color-cream)]/40 border border-[var(--color-sand)] rounded-lg px-4 py-3"
                    >
                      <div className="min-w-0">
                        <div className="text-sm text-[var(--color-earth-dark)] truncate">{b.name ?? 'Unnamed'}</div>
                        <div className="text-xs text-[var(--color-stone)] truncate">{b.bookingTime ?? ''}</div>
                      </div>

                      <button
                        disabled={checkinSaving}
                        onClick={() =>
                          handleToggleAttendance(String(b.id), checkinClassId, !Boolean((b as any).isAttended))
                        }
                        className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 ${
                          Boolean((b as any).isAttended)
                            ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            : 'bg-[var(--color-sage)] text-white hover:bg-[var(--color-clay)] shadow-sm hover:shadow-md'
                        }`}
                      >
                        <UserCheck size={14} />
                        {Boolean((b as any).isAttended) ? 'Undo' : 'Check-in'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Manual Booking Modal */}
      {showManualBookingModal && selectedClass && (
        <AdminBookingModal
          isOpen={showManualBookingModal}
          onClose={() => setShowManualBookingModal(false)}
          classId={selectedClass.id}
          className={selectedClass.name}
          classTime={selectedClass.time}
          defaultAmountDue={selectedClassDefaultAmountDue}
          onBookingCreated={(booking) => {
            setBookingsState((prev) => ({
              ...prev,
              [Number(booking.class_id)]: [...(prev[Number(booking.class_id)] || []), booking as any],
            }));

            setTodaysClassesState((prev) =>
              prev.map((c) => {
                if (Number(c.id) !== Number(booking.class_id)) return c;
                return { ...c, booked: Number(c.booked ?? 0) + 1 };
              })
            );
          }}
        />
      )}
      
      {/* Manual Payment/Transaction Modal */}
      {showManualPaymentModal && (
        <ManualTransactionModal
          isOpen={showManualPaymentModal}
          onClose={() => setShowManualPaymentModal(false)}
          onSuccess={() => {
            setShowManualPaymentModal(false);
            refetchStats();
            toast.success('Payment recorded successfully!');
          }}
        />
      )}
      
      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
        confirmText={confirmModal.confirmText}
      />
    </div>
  );
}