"use client";

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Eye, Calendar, User, DollarSign, Loader2 } from 'lucide-react';
import { supabase } from '@/utils/supabase/client';
import { toast } from 'sonner';

interface Booking {
  id: number;
  user_id: string | null;
  class_id: number;
  payment_method: string | null;
  payment_status: string | null;
  payment_slip_url: string | null;
  payment_note: string | null;
  amount_due: number;
  amount_paid: number | null;
  created_at: string;
  guest_name: string | null;
  guest_contact: string | null;
  classes: {
    id: number;
    title: string | null;
    starts_at: string;
    price: number | null;
  } | null;
  profiles?: {
    id: string;
    full_name: string | null;
    phone: string | null;
  } | null;
}

interface UserPackage {
  id: number;
  user_id: string;
  package_id: number;
  payment_method: string | null;
  payment_status: string | null;
  payment_slip_url: string | null;
  payment_note: string | null;
  amount_due: number | null;
  amount_paid: number | null;
  created_at: string;
  status: string;
  packages: {
    id: number;
    name: string;
    price: number | null;
    type: string;
  } | null;
  profiles?: {
    id: string;
    full_name: string | null;
    phone: string | null;
  } | null;
}

type VerificationItem = 
  | { type: 'booking'; data: Booking }
  | { type: 'package'; data: UserPackage };

export function VerifySlipsSection() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [packages, setPackages] = useState<UserPackage[]>([]);
  const [unpaidGuestBookings, setUnpaidGuestBookings] = useState<Booking[]>([]);
  const [selectedItem, setSelectedItem] = useState<VerificationItem | null>(null);
  const [processing, setProcessing] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>('');
  const [paidAmount, setPaidAmount] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setUserId(user.id);

        // Fetch bookings with partial payment status (awaiting verification)
        try {
          const { data: pendingBookings, error } = await supabase
            .from('bookings')
            .select(`
              *,
              classes (
                id,
                title,
                starts_at,
                price
              ),
              profiles (
                id,
                full_name,
                phone
              )
            `)
            .filter('payment_status', 'eq', 'partial')
            .not('payment_slip_url', 'is', null)
            .order('created_at', { ascending: false });

          if (error) {
            console.error('Error fetching pending bookings:', error);
          } else {
            setBookings(pendingBookings || []);
          }
        } catch (err) {
          console.error('Error fetching pending bookings:', err);
        }

        // Fetch unpaid guest bookings (no slip uploaded) - independent of above
        try {
          const { data: unpaidGuests, error: unpaidError } = await supabase
            .from('bookings')
            .select(`
              *,
              classes (
                id,
                title,
                starts_at,
                price
              )
            `)
            .eq('payment_status', 'unpaid')
            .not('guest_name', 'is', null)
            .neq('status', 'cancelled')
            .order('created_at', { ascending: false });

          if (unpaidError) {
            console.error('Error fetching unpaid guest bookings:', unpaidError);
          } else {
            setUnpaidGuestBookings(unpaidGuests || []);
          }
        } catch (err) {
          console.error('Error fetching unpaid guest bookings:', err);
        }

        // Fetch pending packages (awaiting payment verification) - independent of above
        try {
          const { data: pendingPackages, error: packagesError } = await supabase
            .from('user_packages')
            .select(`
              *,
              packages!user_packages_package_id_fkey (
                id,
                name,
                price,
                type
              ),
              profiles (
                id,
                full_name,
                phone
              )
            `)
            .in('payment_status', ['partial', 'pending_verification'])
            .not('payment_slip_url', 'is', null)
            .order('created_at', { ascending: false });

          if (packagesError) {
            console.error('Error fetching pending packages:', packagesError);
          } else {
            setPackages(pendingPackages || []);
          }
        } catch (err) {
          console.error('Error fetching pending packages:', err);
        }
      } catch (error: any) {
        console.error('Error in fetchData:', error);
        toast.error(error.message || 'Failed to load pending items');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Update paidAmount when selectedItem changes
  useEffect(() => {
    if (selectedItem) {
      const amountDue = selectedItem.type === 'booking' 
        ? selectedItem.data.amount_due 
        : selectedItem.data.amount_due ?? 0;
      setPaidAmount(amountDue ?? 0);
    }
  }, [selectedItem]);

  // Helper function to send payment notification email
  const sendPaymentNotification = async (
    item: VerificationItem,
    status: 'approved' | 'rejected' | 'partial',
    rejectionReason?: string,
    paidAmount?: number,
    remainingBalance?: number
  ) => {
    try {
      // Get user_id from the item
      const itemUserId = item.type === 'booking' 
        ? item.data.user_id 
        : item.data.user_id;

      if (!itemUserId) {
        console.log('No user_id found for notification - might be a guest booking');
        return;
      }

      const userName = item.data.profiles?.full_name || 'Valued Customer';
      const itemName = item.type === 'booking'
        ? (item.data as Booking).classes?.title || 'Class Booking'
        : (item.data as UserPackage).packages?.name || 'Package Purchase';

      // Call notification API (email fetching happens server-side)
      const response = await fetch('/api/notify/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: itemUserId,
          userName,
          itemName,
          status,
          rejectionReason,
          paidAmount,
          remainingBalance,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Notification API error:', errorData);
      } else {
        const result = await response.json();
        console.log('Notification sent:', result);
      }
    } catch (error) {
      console.error('Error sending payment notification:', error);
      // Don't throw - this is non-blocking
    }
  };

  const handleApprove = async (item: VerificationItem) => {
    const itemId = `${item.type}-${item.data.id}`;
    setProcessing(itemId as any);
    try {
      const amountDue = item.data.amount_due ?? 0;
      const paymentStatus = paidAmount >= amountDue ? 'paid' : 'partial';

      if (item.type === 'booking') {
        // Determine if this is a deposit payment (paid less than full price)
        const isDepositPayment = paidAmount < amountDue;
        
        const updateData: any = {
          amount_paid: paidAmount,
          payment_status: paymentStatus,
          status: 'booked',
          paid_at: new Date().toISOString(),
          payment_slip_url: null // Clear the slip after processing
        };

        // CRITICAL FIX: Set is_deposit_paid flag when approving deposit payments
        if (isDepositPayment) {
          updateData.is_deposit_paid = true;
        }

        const { error } = await supabase
          .from('bookings')
          .update(updateData)
          .eq('id', item.data.id);

        if (error) throw error;
        setBookings(bookings.filter(b => b.id !== item.data.id));
      } else {
        // Package verification
        const updateData: any = {
          amount_paid: paidAmount,
          payment_status: paymentStatus,
          paid_at: new Date().toISOString(),
          payment_slip_url: null // Clear the slip after processing
        };

        // If fully paid, activate the package
        if (paymentStatus === 'paid') {
          updateData.status = 'active';
          updateData.activated_at = new Date().toISOString();
        }
        // For partial payments, don't update status - keep it as 'pending_activation'

        const { error } = await supabase
          .from('user_packages')
          .update(updateData)
          .eq('id', item.data.id);

        if (error) throw error;
        setPackages(packages.filter(p => p.id !== item.data.id));
      }

      if (paymentStatus === 'paid') {
        toast.success(`Payment approved as fully paid! ${item.type === 'package' ? 'Package activated.' : ''}`);
      } else {
        toast.success(`Partial payment approved (฿${paidAmount} of ฿${amountDue})`);
      }
      
      setSelectedItem(null);

      // Send email notification (non-blocking)
      const emailStatus = paymentStatus === 'paid' ? 'approved' : 'partial';
      const remainingBalance = paymentStatus === 'partial' ? amountDue - paidAmount : 0;
      sendPaymentNotification(item, emailStatus, undefined, paidAmount, remainingBalance).catch(err => {
        console.error('Failed to send approval notification:', err);
      });
    } catch (error: any) {
      console.error('Error approving payment:', error);
      toast.error(error.message || 'Failed to approve payment');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (item: VerificationItem) => {
    const itemId = `${item.type}-${item.data.id}`;
    setProcessing(itemId as any);
    try {
      if (item.type === 'booking') {
        const { error } = await supabase
          .from('bookings')
          .update({
            payment_status: 'unpaid',
            payment_slip_url: null,
            paid_at: null
          })
          .eq('id', item.data.id);

        if (error) throw error;
        setBookings(bookings.filter(b => b.id !== item.data.id));
      } else {
        const { error } = await supabase
          .from('user_packages')
          .update({
            payment_status: 'unpaid',
            payment_slip_url: null,
            paid_at: null,
            status: 'pending_activation'
          })
          .eq('id', item.data.id);

        if (error) throw error;
        setPackages(packages.filter(p => p.id !== item.data.id));
      }

      toast.success('Payment rejected. User can re-upload slip.');
      setSelectedItem(null);

      // Send email notification (non-blocking)
      sendPaymentNotification(item, 'rejected', 'Payment slip could not be verified').catch(err => {
        console.error('Failed to send rejection notification:', err);
      });
    } catch (error: any) {
      console.error('Error rejecting payment:', error);
      toast.error(error.message || 'Failed to reject payment');
    } finally {
      setProcessing(null);
    }
  };

  const handleMarkGuestAsPaid = async (bookingId: number) => {
    setProcessing(bookingId as any);
    try {
      const booking = unpaidGuestBookings.find(b => b.id === bookingId);
      if (!booking) throw new Error('Booking not found');

      const { error } = await supabase
        .from('bookings')
        .update({
          payment_status: 'paid',
          payment_method: 'cash',
          amount_paid: booking.amount_due ?? 0,
          paid_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (error) throw error;

      toast.success(`Guest payment marked as paid (฿${booking.amount_due})`);
      
      // Remove from unpaid list
      setUnpaidGuestBookings(unpaidGuestBookings.filter(b => b.id !== bookingId));
    } catch (error: any) {
      console.error('Error marking guest as paid:', error);
      toast.error(error.message || 'Failed to mark as paid');
    } finally {
      setProcessing(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={32} className="animate-spin text-[var(--color-sage)]" />
      </div>
    );
  }

  const hasSlipVerifications = bookings.length > 0 || packages.length > 0;
  const hasUnpaidGuests = unpaidGuestBookings.length > 0;

  // Create unified list of verification items
  const verificationItems: VerificationItem[] = [
    ...bookings.map(b => ({ type: 'booking' as const, data: b })),
    ...packages.map(p => ({ type: 'package' as const, data: p }))
  ];

  if (!hasSlipVerifications && !hasUnpaidGuests) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <CheckCircle size={64} className="mx-auto text-green-500 mb-4" />
        <h2 className="text-2xl font-bold text-[var(--color-earth-dark)] mb-2">
          All Clear!
        </h2>
        <p className="text-[var(--color-stone)]">
          No payment slips or unpaid guest bookings at the moment.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Unified Verifications List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-[var(--color-earth-dark)] mb-4">
          Pending Verifications ({verificationItems.length})
        </h2>
        
        {verificationItems.map((item) => {
          const isSelected = selectedItem?.type === item.type && selectedItem?.data.id === item.data.id;
          const itemData = item.data;
          const userName = itemData.profiles?.full_name || (item.type === 'booking' && (itemData as Booking).guest_name) || 'Unknown User';
          const itemTitle = item.type === 'booking' 
            ? (itemData as Booking).classes?.title || 'Unknown Class'
            : (itemData as UserPackage).packages?.name || 'Unknown Package';
          
          return (
            <div
              key={`${item.type}-${itemData.id}`}
              onClick={() => setSelectedItem(item)}
              className={`bg-white rounded-xl shadow-md p-4 cursor-pointer transition-all duration-300 hover:shadow-lg ${
                isSelected
                  ? 'ring-2 ring-[var(--color-sage)] bg-[var(--color-sage)]/5'
                  : ''
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-[var(--color-earth-dark)]">
                      {itemTitle}
                    </h3>
                    <span className={`inline-block px-2 py-0.5 text-xs rounded ${
                      item.type === 'booking'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {item.type === 'booking' ? 'Class Booking' : 'Package Purchase'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[var(--color-stone)] mt-1">
                    <User size={14} />
                    <span>{userName}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-[var(--color-clay)] font-semibold">
                    <DollarSign size={16} />
                    <span>฿{itemData.amount_due}</span>
                  </div>
                  {(itemData.amount_paid ?? 0) > 0 && (
                    <div className="mt-1 text-xs space-y-0.5">
                      <div className="text-green-600">
                        Paid: ฿{itemData.amount_paid ?? 0}
                      </div>
                      {(itemData.amount_paid ?? 0) < (itemData.amount_due ?? 0) && (
                        <div className="text-orange-600 font-semibold">
                          Remaining: ฿{(itemData.amount_due ?? 0) - (itemData.amount_paid ?? 0)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-[var(--color-stone)]">
                <Calendar size={12} />
                <span>{formatDate(itemData.created_at)}</span>
              </div>

              {itemData.payment_method && (
                <div className="mt-2">
                  <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                    {itemData.payment_method}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Slip Preview & Actions */}
      <div className="lg:sticky lg:top-4 lg:h-fit">
        {selectedItem ? (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-[var(--color-earth-dark)] mb-4">
              Payment Slip Details
            </h2>

            {/* Item Info */}
            <div className="mb-6 p-4 bg-[var(--color-cream)] rounded-lg">
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-[var(--color-stone)]">Type:</span>
                  <span className={`ml-2 px-2 py-0.5 text-xs rounded ${
                    selectedItem.type === 'booking'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {selectedItem.type === 'booking' ? 'Class Booking' : 'Package Purchase'}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--color-stone)]">User:</span>
                  <span className="ml-2 font-medium text-[var(--color-earth-dark)]">
                    {selectedItem.data.profiles?.full_name || (selectedItem.type === 'booking' && (selectedItem.data as Booking).guest_name) || 'Unknown'}
                  </span>
                </div>
                {selectedItem.data.profiles?.phone && (
                  <div>
                    <span className="text-[var(--color-stone)]">Phone:</span>
                    <span className="ml-2 font-medium text-[var(--color-earth-dark)]">
                      {selectedItem.data.profiles.phone}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-[var(--color-stone)]">{selectedItem.type === 'booking' ? 'Class:' : 'Package:'}:</span>
                  <span className="ml-2 font-medium text-[var(--color-earth-dark)]">
                    {selectedItem.type === 'booking' 
                      ? (selectedItem.data as Booking).classes?.title 
                      : (selectedItem.data as UserPackage).packages?.name}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--color-stone)]">Amount Due:</span>
                  <span className="ml-2 font-medium text-[var(--color-clay)]">
                    ฿{selectedItem.data.amount_due}
                  </span>
                </div>
                {selectedItem.data.payment_note && (
                  <div>
                    <span className="text-[var(--color-stone)]">Note:</span>
                    <span className="ml-2 font-medium text-[var(--color-earth-dark)]">
                      {selectedItem.data.payment_note}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Editable Paid Amount */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-[var(--color-earth-dark)] mb-2">
                Confirm Paid Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-stone)]">
                  ฿
                </span>
                <input
                  type="number"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(Number(e.target.value))}
                  min="0"
                  max={selectedItem.data.amount_due ?? 0}
                  step="1"
                  className="w-full pl-8 pr-4 py-2 border-2 border-[var(--color-sand)] rounded-lg focus:border-[var(--color-sage)] focus:ring-2 focus:ring-[var(--color-sage)]/20 outline-none transition-colors"
                />
              </div>
              {paidAmount < (selectedItem.data.amount_due ?? 0) && (
                <p className="text-xs text-orange-600 mt-1">
                  ⚠️ Partial payment: ฿{paidAmount} of ฿{selectedItem.data.amount_due ?? 0} (฿{(selectedItem.data.amount_due ?? 0) - paidAmount} remaining)
                </p>
              )}
              {paidAmount >= (selectedItem.data.amount_due ?? 0) && (
                <p className="text-xs text-green-600 mt-1">
                  ✓ Full payment confirmed
                </p>
              )}
            </div>

            {/* Payment Slip Image */}
            {selectedItem.data.payment_slip_url ? (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-[var(--color-earth-dark)] mb-2">
                  Payment Slip
                </h3>
                <div className="relative group">
                  <img
                    src={selectedItem.data.payment_slip_url}
                    alt="Payment Slip"
                    className="w-full rounded-lg border-2 border-[var(--color-sand)] cursor-pointer hover:border-[var(--color-sage)] transition-colors"
                    onClick={() => window.open(selectedItem.data.payment_slip_url!, '_blank')}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all rounded-lg flex items-center justify-center">
                    <Eye
                      size={32}
                      className="text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </div>
                </div>
                <p className="text-xs text-[var(--color-stone)] mt-2 text-center">
                  Click to view full size
                </p>
              </div>
            ) : (
              <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm text-orange-800">
                  ⚠️ No payment slip uploaded
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => handleApprove(selectedItem)}
                disabled={(processing as any) === `${selectedItem.type}-${selectedItem.data.id}`}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <CheckCircle size={18} />
                {(processing as any) === `${selectedItem.type}-${selectedItem.data.id}` ? 'Processing...' : 'Approve'}
              </button>
              <button
                onClick={() => handleReject(selectedItem)}
                disabled={(processing as any) === `${selectedItem.type}-${selectedItem.data.id}`}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <XCircle size={18} />
                {(processing as any) === `${selectedItem.type}-${selectedItem.data.id}` ? 'Processing...' : 'Reject'}
              </button>
            </div>

            <p className="text-xs text-[var(--color-stone)] mt-4 text-center">
              {paidAmount >= (selectedItem.data.amount_due ?? 0) 
                ? `Approving will mark the ${selectedItem.type === 'booking' ? 'booking' : 'package'} as fully paid and ${selectedItem.type === 'package' ? 'activate it' : 'confirmed'}.`
                : `Approving will mark ฿${paidAmount} as partial payment (฿${(selectedItem.data.amount_due ?? 0) - paidAmount} remaining).`}
              <br />
              Rejecting will allow the user to re-upload a new slip.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <Eye size={48} className="mx-auto text-[var(--color-stone)] mb-4" />
            <p className="text-[var(--color-stone)]">
              Select an item to view payment slip details
            </p>
          </div>
        )}
      </div>

      {/* Unpaid Guest Bookings Section */}
      {hasUnpaidGuests && (
        <div className="col-span-full mt-8">
          <div className="bg-orange-50 border-l-4 border-orange-500 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-orange-800 mb-2 flex items-center gap-2">
              <DollarSign size={24} />
              Pending Guest Payments (No Slip)
            </h2>
            <p className="text-sm text-orange-700">
              These are manual guest bookings where payment was not received at the time of booking.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {unpaidGuestBookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white rounded-xl shadow-md p-5 border-2 border-orange-200 hover:shadow-lg transition-shadow"
              >
                <div className="mb-4">
                  <h3 className="font-semibold text-[var(--color-earth-dark)] mb-1">
                    {booking.guest_name || 'Unknown Guest'}
                  </h3>
                  <p className="text-sm text-[var(--color-stone)]">
                    {booking.classes?.title || 'Unknown Class'}
                  </p>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <User size={14} className="text-[var(--color-stone)]" />
                    <span className="text-[var(--color-stone)]">
                      {booking.guest_contact || 'No contact info'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar size={14} className="text-[var(--color-stone)]" />
                    <span className="text-[var(--color-stone)]">
                      {formatDate(booking.created_at)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign size={16} className="text-orange-600" />
                    <span className="text-lg font-semibold text-orange-600">
                      ฿{booking.amount_due}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleMarkGuestAsPaid(booking.id)}
                  disabled={processing === (booking.id as any)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium"
                >
                  {processing === (booking.id as any) ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      Mark as Paid (Cash)
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
