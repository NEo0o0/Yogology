"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { PaymentSlipUpload } from '@/components/PaymentSlipUpload';
import { supabase } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { sendSlipUploadedEmail } from '@/utils/emailHelpers';
import type { Tables } from '@/types/database.types';

type BookingRow = Tables<'bookings'>;
type ClassRow = Tables<'classes'>;
type BookingWithClass = BookingRow & { classes: ClassRow | null };

interface ProfileClientProps {
  userId: string;
  upcoming: BookingWithClass[];
  past: BookingWithClass[];
}

const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getPaymentStatusBadge = (booking: BookingWithClass) => {
  const { payment_status, payment_method, kind, status } = booking;

  // Handle cancelled bookings
  if (status === 'cancelled') {
    // If it was paid before cancellation, show Refund Pending
    if (payment_status === 'paid' || payment_status === 'partial') {
      return {
        label: 'Refund Pending',
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: <AlertCircle size={14} />
      };
    }
    // If it was unpaid, don't show payment badge (return null)
    return null;
  }

  if (payment_status === 'paid' || kind === 'package') {
    return {
      label: kind === 'package' ? 'Package' : 'Paid',
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: <CheckCircle size={14} />
    };
  }

  if (payment_method === 'cash' && payment_status === 'unpaid') {
    return {
      label: 'Cash Pending',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: <Clock size={14} />
    };
  }

  // Handle partial payment status
  if (payment_status === 'partial') {
    // Differentiate between verified partial and pending verification
    if (booking.paid_at) {
      return {
        label: 'Partial Paid',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: <CheckCircle size={14} />
      };
    } else {
      return {
        label: 'Verifying',
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: <Clock size={14} />
      };
    }
  }

  if (payment_status === 'unpaid') {
    return {
      label: 'Unpaid',
      color: 'bg-orange-100 text-orange-800 border-orange-200',
      icon: <AlertCircle size={14} />
    };
  }

  return {
    label: 'Pending',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: <Clock size={14} />
  };
};

export function ProfileClient({ userId, upcoming, past }: ProfileClientProps) {
  const router = useRouter();
  const [uploadingBookingId, setUploadingBookingId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleSlipUpload = async (bookingId: number, slipUrl: string) => {
    try {
      setUploading(true);

      // Find the booking to get class details for email
      const booking = [...upcoming, ...past].find(b => b.id === bookingId);

      const { error } = await supabase
        .from('bookings')
        .update({
          payment_slip_url: slipUrl,
          payment_method: 'bank_transfer',
          payment_status: 'partial'
        })
        .eq('id', bookingId);

      if (error) throw error;

      toast.success('Payment slip uploaded! Admin will verify soon.');
      
      // Send email notification
      if (booking?.classes) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          sendSlipUploadedEmail(
            user.email!,
            user.user_metadata?.full_name || user.email!,
            booking.classes,
            bookingId
          ).catch(err => console.error('Failed to send slip uploaded email:', err));
        }
      }

      setUploadingBookingId(null);
      router.refresh(); // Refresh server component data
    } catch (error: any) {
      console.error('Error uploading slip:', error);
      toast.error(error.message || 'Failed to upload payment slip');
    } finally {
      setUploading(false);
    }
  };

  const handleSlipDelete = async (bookingId: number) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          payment_slip_url: null,
          payment_status: 'unpaid'
        })
        .eq('id', bookingId);

      if (error) throw error;

      toast.success('Payment slip deleted. Status reverted to unpaid.');
      router.refresh();
    } catch (error: any) {
      console.error('Error deleting slip:', error);
      toast.error(error.message || 'Failed to delete payment slip');
    }
  };

  const canUploadSlip = (booking: BookingWithClass) => {
    // Hide upload button for cancelled bookings
    if (booking.status === 'cancelled') return false;
    // Hide for paid bookings and package bookings
    return booking.payment_status !== 'paid' && booking.kind !== 'package';
  };

  const needsRemainingPayment = (booking: BookingWithClass) => {
    // ROBUST MATH-BASED LOGIC: Show button if they paid SOMETHING but LESS than full price
    // Ignore is_deposit_paid flag completely (it's buggy - not set correctly by admin verify)
    const remaining = getRemainingAmount(booking);
    // Show if: remaining > 0 AND not cancelled
    return remaining > 0 && (booking.amount_paid ?? 0) > 0 && booking.status !== 'cancelled';
  };

  const getRemainingAmount = (booking: BookingWithClass) => {
    // DYNAMIC PRICING: Calculate remaining balance based on CURRENT date vs Early Bird deadline
    const now = new Date();
    const deadline = booking.classes?.early_bird_deadline ? new Date(booking.classes.early_bird_deadline) : null;
    
    // Check if Early Bird is still valid RIGHT NOW
    const isEarlyBirdActive = deadline && now <= deadline;

    // Determine Total Price based on current date
    const currentTotal = isEarlyBirdActive 
      ? (booking.classes?.early_bird_price ?? booking.classes?.price ?? 0)
      : (booking.classes?.price ?? 0);

    const paid = booking.amount_paid ?? 0;
    return Math.max(0, currentTotal - paid);
  };

  const getEarlyBirdDeadline = (booking: BookingWithClass) => {
    if (!booking.classes?.early_bird_deadline) return null;
    const deadline = new Date(booking.classes.early_bird_deadline);
    const now = new Date();
    return now <= deadline ? deadline : null;
  };

  return (
    <>
      <div className="space-y-10">
        <section>
          <h2 className="text-lg text-[var(--color-earth-dark)] mb-4">Upcoming</h2>
          {upcoming.length === 0 ? (
            <div className="text-[var(--color-stone)] bg-[var(--color-cream)]/40 border border-[var(--color-sand)] rounded-xl p-6">
              No upcoming bookings found.
            </div>
          ) : (
            <div className="space-y-4">
              {upcoming.map((b) => {
                const badge = getPaymentStatusBadge(b);
                const showUploadButton = canUploadSlip(b);

                return (
                  <div
                    key={b.id}
                    className="p-4 border border-[var(--color-sand)] rounded-xl hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="text-[var(--color-earth-dark)] font-medium">
                          {b.classes?.title}
                        </div>
                        <div className="text-sm text-[var(--color-stone)] mt-1">
                          {b.classes?.starts_at ? formatDateTime(b.classes.starts_at) : ''}
                          {b.classes?.location ? ` • ${b.classes.location}` : ''}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-[var(--color-stone)]">Booking Status:</span>
                          <span className="text-xs font-medium text-[var(--color-earth-dark)]">
                            {b.status}
                          </span>
                        </div>
                        {badge && (
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-[var(--color-stone)]">Payment:</span>
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${badge.color}`}>
                              {badge.icon}
                              {badge.label}
                            </span>
                          </div>
                        )}
                        {b.payment_slip_url && (
                          <div className="mt-2 text-xs text-green-600">
                            ✓ Payment slip uploaded
                          </div>
                        )}
                        {b.is_deposit_paid && (
                          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                            <div className="font-medium text-blue-800">Deposit Payment</div>
                            <div className="text-blue-700 mt-1">
                              Paid: ฿{(b.amount_paid || 0).toLocaleString()} • 
                              Remaining: ฿{getRemainingAmount(b).toLocaleString()}
                            </div>
                          </div>
                        )}

                        {/* Early Bird Warning - Show for ANY booking with remaining payment */}
                        {needsRemainingPayment(b) && getEarlyBirdDeadline(b) && (
                          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
                            <div className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                              ⏰ Early Bird Deadline: {new Date(getEarlyBirdDeadline(b)!).toLocaleDateString('en-US', { 
                                day: 'numeric', 
                                month: 'short', 
                                year: 'numeric' 
                              })}
                            </div>
                            <div className="flex flex-col gap-1.5 text-amber-800">
                              <div className="flex justify-between items-center">
                                <span>Pay now (Early Bird):</span>
                                <span className="font-bold text-green-700">฿{b.classes?.early_bird_price?.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between items-center text-amber-700">
                                <span>Pay after deadline:</span>
                                <span className="font-bold text-red-600">฿{b.classes?.price?.toLocaleString()}</span>
                              </div>
                              <div className="mt-1 pt-2 border-t border-amber-200 text-xs text-amber-700 font-medium">
                                💰 Save ฿{((b.classes?.price ?? 0) - (b.classes?.early_bird_price ?? 0)).toLocaleString()} by paying before the deadline!
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2">
                        {needsRemainingPayment(b) && (
                          <button
                            onClick={() => setUploadingBookingId(b.id)}
                            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-terracotta)] hover:bg-[var(--color-clay)] text-white rounded-lg transition-colors text-sm font-medium"
                          >
                            <Upload size={16} />
                            Pay Remaining ฿{getRemainingAmount(b).toLocaleString()}
                          </button>
                        )}
                        {showUploadButton && !needsRemainingPayment(b) && (
                          <button
                            onClick={() => setUploadingBookingId(b.id)}
                            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-sage)] hover:bg-[var(--color-clay)] text-white rounded-lg transition-colors text-sm"
                          >
                            <Upload size={16} />
                            {b.payment_slip_url ? 'Update Slip' : 'Upload Slip'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-lg text-[var(--color-earth-dark)] mb-4">Past</h2>
          {past.length === 0 ? (
            <div className="text-[var(--color-stone)] bg-[var(--color-cream)]/40 border border-[var(--color-sand)] rounded-xl p-6">
              No past bookings found.
            </div>
          ) : (
            <div className="space-y-4">
              {past.map((b) => {
                const badge = getPaymentStatusBadge(b);

                return (
                  <div
                    key={b.id}
                    className="p-4 border border-[var(--color-sand)] rounded-xl bg-[var(--color-cream)]/20"
                  >
                    <div>
                      <div className="text-[var(--color-earth-dark)] font-medium">
                        {b.classes?.title}
                      </div>
                      <div className="text-sm text-[var(--color-stone)] mt-1">
                        {b.classes?.starts_at ? formatDateTime(b.classes.starts_at) : ''}
                        {b.classes?.location ? ` • ${b.classes.location}` : ''}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-[var(--color-stone)]">Status:</span>
                        <span className="text-xs font-medium text-[var(--color-earth-dark)]">
                          {b.status}
                        </span>
                      </div>
                      {badge && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-[var(--color-stone)]">Payment:</span>
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${badge.color}`}>
                            {badge.icon}
                            {badge.label}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Upload Slip Modal */}
      {uploadingBookingId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-[var(--color-earth-dark)] mb-4">Upload Payment Slip | อัพโหลดสลิปการชำระเงิน</h3>
            <PaymentSlipUpload
              onUploadComplete={(url) => handleSlipUpload(uploadingBookingId, url)}
              currentSlipUrl={upcoming.find(b => b.id === uploadingBookingId)?.payment_slip_url || past.find(b => b.id === uploadingBookingId)?.payment_slip_url}
              userId={userId}
              onDelete={() => handleSlipDelete(uploadingBookingId)}
              showPaymentInfo={true}
            />
            <button
              onClick={() => setUploadingBookingId(null)}
              className="mt-4 w-full py-2 border-2 border-[var(--color-sand)] hover:border-[var(--color-sage)] text-[var(--color-earth-dark)] rounded-lg transition-colors"
              disabled={uploading}
            >
              Cancel | ยกเลิก
            </button>
          </div>
        </div>
      )}
    </>
  );
}
