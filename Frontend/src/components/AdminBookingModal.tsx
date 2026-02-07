"use client";

import { useEffect, useMemo, useState } from 'react';
import { X, Search, Loader2, CheckCircle, User as UserIcon, CreditCard, DollarSign, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/utils/supabase/client';

type ProfileRow = {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  contact_info: string | null;
};

type ActivePackageInfo = {
  id: number;
  credits_remaining: number | null;
  expire_at: string;
  packages?: {
    id: number;
    name?: string | null;
    title?: string | null;
    credits?: number | null;
    duration_days?: number | null;
    price?: number | null;
  } | null;
};

type BookingType = 'package' | 'dropin';

interface AdminBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: number;
  className: string;
  classTime: string;
  defaultAmountDue?: number;
  onBookingCreated: (booking: {
    id: number | string;
    class_id: number;
    user_id: string;
    name: string;
    avatar: string;
    phone: string;
    contactInfo: string;
    contactPlatform: string;
    status: 'booked';
    bookingTime: string;
    isGuest?: false;
    paymentStatus?: 'paid' | 'unpaid';
    amountDue?: number;
    amountPaid?: number;
    paidAt?: string | null;
  }) => void;
}

export function AdminBookingModal({
  isOpen,
  onClose,
  classId,
  className,
  classTime,
  defaultAmountDue,
  onBookingCreated,
}: AdminBookingModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [userType, setUserType] = useState<'member' | 'guest'>('member');
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<unknown | null>(null);
  const [results, setResults] = useState<ProfileRow[]>([]);
  const [selectedUser, setSelectedUser] = useState<ProfileRow | null>(null);

  const [guestName, setGuestName] = useState('');
  const [guestContact, setGuestContact] = useState('');
  const [guestHealthCondition, setGuestHealthCondition] = useState('');
  const [guestNationality, setGuestNationality] = useState('');
  const [guestAvatarUrl, setGuestAvatarUrl] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [bookingType, setBookingType] = useState<BookingType>('package');
  const [amountDue, setAmountDue] = useState<number>(defaultAmountDue ?? 0);

  const [activePackage, setActivePackage] = useState<ActivePackageInfo | null>(null);
  const [packageLoading, setPackageLoading] = useState(false);
  const [packageError, setPackageError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const canContinueToStep2 = userType === 'member' ? !!selectedUser : guestName.trim().length > 0;
  const canContinueToStep3 =
    userType === 'guest'
      ? Number.isFinite(Number(amountDue)) && Number(amountDue) > 0
      : bookingType === 'package'
      ? !packageLoading && !!activePackage
      : Number.isFinite(Number(amountDue)) && Number(amountDue) > 0;

  // Set default amount to 400 for guest bookings and force drop-in
  useEffect(() => {
    if (userType === 'guest') {
      setBookingType('dropin');
      if (amountDue === 0) {
        setAmountDue(400);
      }
    }
  }, [userType, amountDue]);

  const selectedUserLabel = useMemo(() => {
    if (!selectedUser) return '';
    const pieces = [selectedUser.full_name ?? 'Unnamed'];
    if (selectedUser.contact_info) pieces.push(selectedUser.contact_info);
    if (selectedUser.phone) pieces.push(selectedUser.phone);
    return pieces.join(' • ');
  }, [selectedUser]);

  useEffect(() => {
    if (!isOpen) return;
    setStep(1);
    setUserType('member');
    setQuery('');
    setSearching(false);
    setSearchError(null);
    setResults([]);
    setSelectedUser(null);
    setGuestName('');
    setGuestContact('');
    setGuestHealthCondition('');
    setGuestNationality('');
    setGuestAvatarUrl('');
    setBookingType('package');
    setAmountDue(defaultAmountDue ?? 0);
    setActivePackage(null);
    setPackageLoading(false);
    setPackageError(null);
    setSubmitting(false);
    setSubmitError(null);
  }, [defaultAmountDue, isOpen]);

  // Debounced search
  useEffect(() => {
    if (!isOpen) return;
    if (step !== 1) return;

    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearchError(null);
      return;
    }

    const handle = setTimeout(async () => {
      setSearching(true);
      setSearchError(null);
      try {
        const safe = q.replace(/%/g, '\\%').replace(/_/g, '\\_');

        const orBase = [
          `full_name.ilike.%${safe}%`,
          `phone.ilike.%${safe}%`,
          `contact_info.ilike.%${safe}%`,
        ];

        const orFilters = orBase.join(',');
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, phone, avatar_url, contact_info')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .or(orFilters as any)
          .limit(20);
        if (error) throw error;

        setResults((data as unknown as ProfileRow[]) ?? []);
      } catch (e) {
        setSearchError(e);
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => clearTimeout(handle);
  }, [isOpen, query, step]);

  useEffect(() => {
    if (!isOpen) return;
    if (step !== 2) return;
    if (!selectedUser) return;

    const loadActivePackage = async () => {
      setPackageLoading(true);
      setPackageError(null);
      try {
        const nowIso = new Date().toISOString();
        const { data, error } = await supabase
          .from('user_packages')
          .select('id, credits_remaining, expire_at, status, packages(*)')
          .eq('user_id', selectedUser.id)
          .eq('status', 'active')
          .gt('expire_at', nowIso)
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;

        const active = (data ?? []).find(
          (up: any) => up.credits_remaining === null || (up.credits_remaining ?? 0) > 0
        ) as ActivePackageInfo | undefined;

        setActivePackage(active ?? null);
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        setPackageError(message);
        setActivePackage(null);
      } finally {
        setPackageLoading(false);
      }
    };

    loadActivePackage();
  }, [isOpen, selectedUser, step]);

  const activePackageLabel = useMemo(() => {
    if (!activePackage) return 'No active package found';
    const pkgName = activePackage.packages?.name ?? activePackage.packages?.title ?? 'Package';
    const credits = activePackage.credits_remaining;
    const creditLabel = credits == null ? 'Unlimited' : `${credits} credits left`;
    return `${pkgName} • ${creditLabel}`;
  }, [activePackage]);

  const goNext = () => {
    if (step === 1 && !canContinueToStep2) return;
    if (step === 2 && !canContinueToStep3) return;
    setStep((prev) => (prev === 3 ? 3 : ((prev + 1) as any)));
  };

  const goBack = () => {
    setSubmitError(null);
    setStep((prev) => (prev === 1 ? 1 : ((prev - 1) as any)));
  };

  const handleConfirm = async () => {
    // For guests, we don't need selectedUser
    if (userType === 'member' && !selectedUser) return;
    if (userType === 'guest' && !guestName.trim()) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      // GUEST BOOKING: Direct insert with user_id=null
      if (userType === 'guest') {
        const { data, error } = await supabase
          .from('bookings')
          .insert({
            class_id: classId,
            user_id: null,
            guest_name: guestName.trim(),
            guest_contact: guestContact.trim() || null,
            guest_health_condition: guestHealthCondition.trim() || null,
            guest_nationality: guestNationality.trim() || null,
            guest_avatar_url: guestAvatarUrl || null,
            status: 'booked',
            kind: 'dropin',
            payment_status: 'unpaid',
            amount_due: Number(amountDue ?? 0),
            amount_paid: 0,
            paid_at: null,
          })
          .select('id')
          .single();

        if (error) throw error;

        onBookingCreated({
          id: data.id,
          class_id: classId,
          user_id: '', // Guest has no user_id
          name: guestName.trim(),
          avatar: guestAvatarUrl || guestName.trim().split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
          phone: guestContact.trim(),
          contactInfo: guestContact.trim(),
          contactPlatform: '',
          status: 'booked',
          bookingTime: new Date().toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          }),
          paymentStatus: 'unpaid',
          amountDue: Number(amountDue ?? 0),
          amountPaid: 0,
          paidAt: null,
        });

        toast.success('Guest booking created successfully', { duration: 3000 });
        onClose();
        return;
      }

      // MEMBER BOOKING: Continue with existing logic
      if (!selectedUser) return;

      // Check if a booking already exists for this user + class
      const { data: existingBookings, error: checkError } = await supabase
        .from('bookings')
        .select('id, status')
        .eq('user_id', selectedUser.id)
        .eq('class_id', classId)
        .limit(1);

      if (checkError) throw checkError;

      // If booking exists and is already booked, show error
      if (existingBookings && existingBookings.length > 0) {
        const existing = existingBookings[0];
        
        if (existing.status === 'booked') {
          throw new Error(`${selectedUser.full_name ?? 'This user'} is already registered for this class`);
        }

        // If booking exists and is cancelled, UPDATE it instead of inserting
        if (existing.status === 'cancelled') {
          const { error: updateError } = await supabase
            .from('bookings')
            .update({
              status: 'booked',
              payment_status: bookingType === 'package' ? 'paid' : 'unpaid',
              amount_due: bookingType === 'dropin' ? Number(amountDue ?? 0) : 0,
              amount_paid: bookingType === 'package' ? 0 : 0,
              paid_at: null,
              cancelled_at: null,
            })
            .eq('id', existing.id);

          if (updateError) throw updateError;

          // If using package, deduct credit
          if (bookingType === 'package' && activePackage && activePackage.credits_remaining !== null) {
            const { error: packageError } = await supabase
              .from('user_packages')
              .update({
                credits_remaining: activePackage.credits_remaining - 1,
              })
              .eq('id', activePackage.id);

            if (packageError) throw packageError;
          }

          onBookingCreated({
            id: existing.id,
            class_id: classId,
            user_id: selectedUser.id,
            name: selectedUser.full_name ?? 'Unnamed',
            avatar: (selectedUser.full_name ?? 'U')
              .split(' ')
              .filter(Boolean)
              .slice(0, 2)
              .map((n) => n[0])
              .join('')
              .toUpperCase(),
            phone: selectedUser.phone ?? '',
            contactInfo: selectedUser.contact_info ?? '',
            contactPlatform: '',
            status: 'booked',
            bookingTime: new Date().toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            }),
            paymentStatus: bookingType === 'package' ? 'paid' : 'unpaid',
            amountDue: bookingType === 'dropin' ? Number(amountDue ?? 0) : 0,
            amountPaid: 0,
            paidAt: null,
          });

          toast.success('Booking reactivated successfully', { duration: 3000 });
          onClose();
          return;
        }
      }

      // No existing booking or status is neither 'booked' nor 'cancelled' - proceed with normal creation
      if (bookingType === 'package') {
        if (!activePackage) {
          throw new Error('User has no active package');
        }

        const { data, error } = await supabase.rpc('admin_book_package' as any, {
          p_user_id: selectedUser.id,
          p_class_id: classId,
        });

        if (error) throw error;

        const bookingId = data as unknown as number;

        onBookingCreated({
          id: bookingId,
          class_id: classId,
          user_id: selectedUser.id,
          name: selectedUser.full_name ?? 'Unnamed',
          avatar: (selectedUser.full_name ?? 'U')
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((n) => n[0])
            .join('')
            .toUpperCase(),
          phone: selectedUser.phone ?? '',
          contactInfo: selectedUser.contact_info ?? '',
          contactPlatform: '',
          status: 'booked',
          bookingTime: new Date().toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          }),
        });

        toast.success('Booking created via package', { duration: 3000 });
        onClose();
        return;
      }

      const { data, error } = await supabase.rpc('admin_book_dropin' as any, {
        p_user_id: selectedUser.id,
        p_class_id: classId,
        p_amount_due: Number(amountDue ?? 0),
      });

      if (error) throw error;

      const bookingId = data as unknown as number;

      try {
        await supabase
          .from('bookings')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .update(
            {
              payment_status: 'unpaid',
              amount_due: Number(amountDue ?? 0),
              amount_paid: 0,
              paid_at: null,
            } as any
          )
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .eq('id' as any, bookingId as any);
      } catch {
        // Ignore (RPC may already set these)
      }

      onBookingCreated({
        id: bookingId,
        class_id: classId,
        user_id: selectedUser.id,
        name: selectedUser.full_name ?? 'Unnamed',
        avatar: (selectedUser.full_name ?? 'U')
          .split(' ')
          .filter(Boolean)
          .slice(0, 2)
          .map((n) => n[0])
          .join('')
          .toUpperCase(),
        phone: selectedUser.phone ?? '',
        contactInfo: selectedUser.contact_info ?? '',
        contactPlatform: '',
        status: 'booked',
        bookingTime: new Date().toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }),
        paymentStatus: 'unpaid',
        amountDue: Number(amountDue ?? 0),
        amountPaid: 0,
        paidAt: null,
      });

      toast.success('Drop-in booking created', { duration: 3000 });
      onClose();
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-[var(--color-sand)]">
          <div>
            <h2 className="text-2xl text-[var(--color-earth-dark)]">Admin Booking</h2>
            <p className="text-sm text-[var(--color-stone)] mt-1">
              {className} • {classTime}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--color-cream)] rounded-full transition-colors duration-300"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 bg-[var(--color-cream)]/40 border-b border-[var(--color-sand)]">
          <div className="flex items-center gap-2 text-sm text-[var(--color-stone)]">
            <span className={step === 1 ? 'text-[var(--color-earth-dark)]' : ''}>1. Select user</span>
            <span>→</span>
            <span className={step === 2 ? 'text-[var(--color-earth-dark)]' : ''}>2. Booking type</span>
            <span>→</span>
            <span className={step === 3 ? 'text-[var(--color-earth-dark)]' : ''}>3. Confirm</span>
          </div>
        </div>

        {step === 1 && (
          <div className="flex flex-col h-[520px]">
            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto max-h-[60vh] p-6 space-y-4">
              {/* Member/Guest Toggle */}
              <div className="flex gap-2 p-1 bg-[var(--color-cream)] rounded-lg">
                <button
                  onClick={() => setUserType('member')}
                  className={`flex-1 px-4 py-2 rounded-md transition-all duration-200 ${
                    userType === 'member'
                      ? 'bg-white text-[var(--color-earth-dark)] shadow-sm'
                      : 'text-[var(--color-stone)] hover:text-[var(--color-earth-dark)]'
                  }`}
                >
                  <UserIcon size={16} className="inline mr-2" />
                  Member
                </button>
                <button
                  onClick={() => setUserType('guest')}
                  className={`flex-1 px-4 py-2 rounded-md transition-all duration-200 ${
                    userType === 'guest'
                      ? 'bg-white text-[var(--color-earth-dark)] shadow-sm'
                      : 'text-[var(--color-stone)] hover:text-[var(--color-earth-dark)]'
                  }`}
                >
                  Guest
                </button>
              </div>

              {/* Member Search */}
              {userType === 'member' && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-stone)]" size={20} />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by name, email, phone..."
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-[var(--color-sand)] focus:ring-2 focus:ring-[var(--color-sage)] focus:border-transparent"
                    autoFocus
                  />
                </div>
              )}

              {/* Guest Form */}
              {userType === 'guest' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-[var(--color-earth-dark)] mb-1">
                      Guest Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="Enter guest name"
                      className="w-full px-4 py-3 rounded-lg border border-[var(--color-sand)] focus:ring-2 focus:ring-[var(--color-sage)] focus:border-transparent"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[var(--color-earth-dark)] mb-1">
                      Contact Info <span className="text-[var(--color-stone)]">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={guestContact}
                      onChange={(e) => setGuestContact(e.target.value)}
                      placeholder="Phone or email"
                      className="w-full px-4 py-3 rounded-lg border border-[var(--color-sand)] focus:ring-2 focus:ring-[var(--color-sage)] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[var(--color-earth-dark)] mb-1">
                      Nationality <span className="text-[var(--color-stone)]">(Optional)</span>
                    </label>
                    <select
                      value={guestNationality}
                      onChange={(e) => setGuestNationality(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-[var(--color-sand)] focus:ring-2 focus:ring-[var(--color-sage)] focus:border-transparent"
                    >
                      <option value="">Select nationality</option>
                      <option value="Thai">Thai</option>
                      <option value="Chinese">Chinese</option>
                      <option value="Russian">Russian</option>
                      <option value="American">American</option>
                      <option value="British">British</option>
                      <option value="Australian">Australian</option>
                      <option value="Japanese">Japanese</option>
                      <option value="Korean">Korean</option>
                      <option value="German">German</option>
                      <option value="French">French</option>
                      <option value="Indian">Indian</option>
                      <option value="Canadian">Canadian</option>
                      <option value="Other">Other</option>
                    </select>
                    <p className="text-xs text-[var(--color-stone)] mt-1">
                      Helps with reporting and analytics
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm text-[var(--color-earth-dark)] mb-1">
                      Health Condition / Injuries <span className="text-[var(--color-stone)]">(Optional)</span>
                    </label>
                    <textarea
                      value={guestHealthCondition}
                      onChange={(e) => setGuestHealthCondition(e.target.value)}
                      placeholder="e.g., Back pain, knee injury, pregnancy..."
                      rows={3}
                      className="w-full px-4 py-3 rounded-lg border border-[var(--color-sand)] focus:ring-2 focus:ring-[var(--color-sage)] focus:border-transparent resize-none"
                    />
                    <p className="text-xs text-[var(--color-stone)] mt-1">
                      Helps instructors provide appropriate modifications
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm text-[var(--color-earth-dark)] mb-2">
                      Guest Photo <span className="text-[var(--color-stone)]">(Optional)</span>
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
                        htmlFor="guest-avatar-upload"
                        className="flex items-center gap-2 px-4 py-2 bg-[var(--color-sage)] hover:bg-[var(--color-sage)]/80 text-white rounded-lg cursor-pointer transition-colors"
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
                        id="guest-avatar-upload"
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;

                          if (file.size > 5 * 1024 * 1024) {
                            toast.error('Image must be less than 5MB');
                            return;
                          }

                          setUploadingAvatar(true);
                          try {
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
                            toast.success('Photo uploaded!');
                          } catch (error: any) {
                            console.error('Error uploading photo:', error);
                            toast.error(error.message || 'Failed to upload photo');
                          } finally {
                            setUploadingAvatar(false);
                          }
                        }}
                        disabled={uploadingAvatar}
                        className="hidden"
                      />
                    </div>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                    <strong>Note:</strong> Guest bookings are automatically set as drop-in (no package).
                  </div>
                </div>
              )}
              
              {searchError != null && (
                <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
                  {searchError instanceof Error
                    ? searchError.message
                    : (JSON.stringify(searchError) ?? String(searchError))}
                </div>
              )}

              {/* Member Search Results */}
              {userType === 'member' && (
                searching ? (
                  <div className="flex items-center justify-center py-16 text-[var(--color-stone)]">
                    <Loader2 size={20} className="animate-spin mr-2" />
                    Searching...
                  </div>
                ) : results.length === 0 ? (
                  <div className="text-center py-16 text-[var(--color-stone)]">
                    Type at least 2 characters to search.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {results.map((p) => {
                      const initials = (p.full_name ?? 'U')
                        .split(' ')
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase();

                      const isSelected = selectedUser?.id === p.id;
                      return (
                        <button
                          key={p.id}
                          onClick={() => setSelectedUser(p)}
                          className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                            isSelected
                              ? 'border-[var(--color-sage)] bg-[var(--color-sage)]/10'
                              : 'border-[var(--color-sand)] hover:border-[var(--color-sage)]/50 hover:bg-[var(--color-cream)]/50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--color-sage)] to-[var(--color-clay)] flex items-center justify-center text-white flex-shrink-0">
                              {initials}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-base text-[var(--color-earth-dark)] truncate">
                                {p.full_name ?? 'Unnamed'}
                              </div>
                              <div className="text-sm text-[var(--color-stone)] truncate">
                                {p.contact_info ?? ''}
                              </div>
                              <div className="text-xs text-[var(--color-stone)] truncate">{p.phone ?? ''}</div>
                            </div>
                            {isSelected && <CheckCircle size={18} className="text-[var(--color-sage)]" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )
              )}
            </div>

            {/* Fixed Footer */}
            <div className="p-6 border-t border-[var(--color-sand)] flex items-center justify-between gap-3">
              <button
                onClick={onClose}
                className="px-6 py-3 rounded-lg text-[var(--color-stone)] hover:bg-[var(--color-cream)] transition-colors"
              >
                Close
              </button>
              <button
                onClick={goNext}
                disabled={!canContinueToStep2}
                className="bg-[var(--color-sage)] hover:bg-[var(--color-clay)] text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="p-6">
            <div className="mb-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--color-cream)] flex items-center justify-center">
                <UserIcon size={18} className="text-[var(--color-earth-dark)]" />
              </div>
              <div>
                <div className="text-sm text-[var(--color-stone)]">
                  {userType === 'guest' ? 'Guest' : 'Selected user'}
                </div>
                <div className="text-base text-[var(--color-earth-dark)]">
                  {userType === 'guest' ? guestName : selectedUserLabel}
                </div>
                {userType === 'guest' && guestContact && (
                  <div className="text-sm text-[var(--color-stone)]">{guestContact}</div>
                )}
              </div>
            </div>

            {userType === 'guest' ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Guest Booking:</strong> Automatically set as drop-in payment. Guests cannot use packages.
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm text-[var(--color-stone)] mb-3">Booking Type</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => setBookingType('package')}
                    className={`p-5 rounded-xl border-2 text-left transition-all duration-200 ${
                      bookingType === 'package'
                        ? 'border-[var(--color-sage)] bg-[var(--color-sage)]/10'
                        : 'border-[var(--color-sand)] hover:border-[var(--color-sage)]/50 hover:bg-[var(--color-cream)]/40'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <CreditCard size={18} className="text-[var(--color-sage)]" />
                      <div className="text-[var(--color-earth-dark)]">Use Package</div>
                    </div>
                    <div className="text-sm text-[var(--color-stone)]">
                      {packageLoading ? 'Checking active package…' : packageError ? packageError : activePackageLabel}
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setBookingType('dropin');
                      setAmountDue(400);
                    }}
                    className={`p-5 rounded-xl border-2 text-left transition-all duration-200 ${
                      bookingType === 'dropin'
                        ? 'border-[var(--color-clay)] bg-[var(--color-clay)]/10'
                        : 'border-[var(--color-sand)] hover:border-[var(--color-clay)]/50 hover:bg-[var(--color-cream)]/40'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <DollarSign size={18} className="text-[var(--color-clay)]" />
                      <div className="text-[var(--color-earth-dark)]">Drop-in</div>
                    </div>
                    <div className="text-sm text-[var(--color-stone)]">Record amount due</div>
                  </button>
                </div>
              </div>
            )}

            {(userType === 'guest' || bookingType === 'dropin') && (
              <div className="mt-6">
                <label className="block text-sm text-[var(--color-stone)] mb-2">Amount due (฿)</label>
                <input
                  type="number"
                  value={amountDue}
                  onChange={(e) => setAmountDue(Number(e.target.value ?? 0))}
                  className="w-full px-4 py-3 rounded-lg border border-[var(--color-sand)] focus:ring-2 focus:ring-[var(--color-sage)] focus:border-transparent"
                  min={0}
                />
              </div>
            )}

            <div className="mt-8 flex items-center justify-between gap-3">
              <button
                onClick={goBack}
                className="px-6 py-3 rounded-lg text-[var(--color-stone)] hover:bg-[var(--color-cream)] transition-colors"
              >
                Back
              </button>
              <button
                onClick={goNext}
                disabled={!canContinueToStep3}
                className="bg-[var(--color-sage)] hover:bg-[var(--color-clay)] text-white px-6 py-3 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="p-6">
            <div className="bg-[var(--color-cream)] rounded-xl p-5 border border-[var(--color-sand)]">
              <div className="text-sm text-[var(--color-stone)] mb-1">User</div>
              <div className="text-[var(--color-earth-dark)] mb-4">{selectedUserLabel}</div>

              <div className="text-sm text-[var(--color-stone)] mb-1">Booking type</div>
              <div className="text-[var(--color-earth-dark)] mb-4">
                {bookingType === 'package' ? 'Package' : `Drop-in (฿${Number(amountDue ?? 0).toLocaleString()})`}
              </div>

              {bookingType === 'package' && (
                <div className="text-sm text-[var(--color-stone)]">{activePackageLabel}</div>
              )}
            </div>

            {submitError && (
              <div className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
                {submitError}
              </div>
            )}

            <div className="mt-8 flex items-center justify-between gap-3">
              <button
                onClick={goBack}
                className="px-6 py-3 rounded-lg text-[var(--color-stone)] hover:bg-[var(--color-cream)] transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleConfirm}
                disabled={submitting}
                className="bg-[var(--color-earth-dark)] hover:bg-[var(--color-clay)] text-white px-6 py-3 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Confirming...
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} />
                    Confirm Booking
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
