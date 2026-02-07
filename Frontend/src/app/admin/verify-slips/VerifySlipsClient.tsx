"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Eye, Calendar, User, DollarSign } from 'lucide-react';
import { supabase } from '@/utils/supabase/client';
import { toast } from 'sonner';

interface Booking {
  id: number;
  user_id: string;
  class_id: number;
  payment_method: string;
  payment_status: string;
  payment_slip_url: string | null;
  payment_note: string | null;
  amount_due: number;
  created_at: string;
  classes: {
    id: number;
    title: string;
    start_time: string;
    price: number;
  } | null;
  profiles: {
    id: string;
    full_name: string;
    email: string;
  } | null;
}

interface VerifySlipsClientProps {
  initialBookings: Booking[];
  userId: string;
}

export function VerifySlipsClient({ initialBookings, userId }: VerifySlipsClientProps) {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [processing, setProcessing] = useState<number | null>(null);

  const handleApprove = async (bookingId: number) => {
    setProcessing(bookingId);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          payment_status: 'paid',
          status: 'booked',
          verified_by: userId,
          verified_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (error) throw error;

      toast.success('Payment approved successfully!');
      
      // Remove from list
      setBookings(bookings.filter(b => b.id !== bookingId));
      setSelectedBooking(null);
      router.refresh();
    } catch (error: any) {
      console.error('Error approving payment:', error);
      toast.error(error.message || 'Failed to approve payment');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (bookingId: number) => {
    setProcessing(bookingId);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          payment_status: 'unpaid',
          payment_slip_url: null,
          verified_by: userId,
          verified_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (error) throw error;

      toast.success('Payment rejected. User can re-upload slip.');
      
      // Remove from list
      setBookings(bookings.filter(b => b.id !== bookingId));
      setSelectedBooking(null);
      router.refresh();
    } catch (error: any) {
      console.error('Error rejecting payment:', error);
      toast.error(error.message || 'Failed to reject payment');
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

  if (bookings.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <CheckCircle size={64} className="mx-auto text-green-500 mb-4" />
        <h2 className="text-2xl font-bold text-[var(--color-earth-dark)] mb-2">
          All Clear!
        </h2>
        <p className="text-[var(--color-stone)]">
          No payment slips pending verification at the moment.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Bookings List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-[var(--color-earth-dark)] mb-4">
          Pending Verifications ({bookings.length})
        </h2>
        
        {bookings.map((booking) => (
          <div
            key={booking.id}
            onClick={() => setSelectedBooking(booking)}
            className={`bg-white rounded-xl shadow-md p-4 cursor-pointer transition-all duration-300 hover:shadow-lg ${
              selectedBooking?.id === booking.id
                ? 'ring-2 ring-[var(--color-sage)] bg-[var(--color-sage)]/5'
                : ''
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-[var(--color-earth-dark)]">
                  {booking.classes?.title || 'Unknown Class'}
                </h3>
                <div className="flex items-center gap-2 text-sm text-[var(--color-stone)] mt-1">
                  <User size={14} />
                  <span>{booking.profiles?.full_name || 'Unknown User'}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-[var(--color-clay)] font-semibold">
                  <DollarSign size={16} />
                  <span>฿{booking.amount_due}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-[var(--color-stone)]">
              <Calendar size={12} />
              <span>{formatDate(booking.created_at)}</span>
            </div>

            {booking.payment_method && (
              <div className="mt-2">
                <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                  {booking.payment_method}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Slip Preview & Actions */}
      <div className="lg:sticky lg:top-4 lg:h-fit">
        {selectedBooking ? (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-[var(--color-earth-dark)] mb-4">
              Payment Slip Details
            </h2>

            {/* User Info */}
            <div className="mb-6 p-4 bg-[var(--color-cream)] rounded-lg">
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-[var(--color-stone)]">User:</span>
                  <span className="ml-2 font-medium text-[var(--color-earth-dark)]">
                    {selectedBooking.profiles?.full_name}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--color-stone)]">Email:</span>
                  <span className="ml-2 font-medium text-[var(--color-earth-dark)]">
                    {selectedBooking.profiles?.email}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--color-stone)]">Class:</span>
                  <span className="ml-2 font-medium text-[var(--color-earth-dark)]">
                    {selectedBooking.classes?.title}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--color-stone)]">Amount:</span>
                  <span className="ml-2 font-medium text-[var(--color-clay)]">
                    ฿{selectedBooking.amount_due}
                  </span>
                </div>
                {selectedBooking.payment_note && (
                  <div>
                    <span className="text-[var(--color-stone)]">Note:</span>
                    <span className="ml-2 font-medium text-[var(--color-earth-dark)]">
                      {selectedBooking.payment_note}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Slip Image */}
            {selectedBooking.payment_slip_url ? (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-[var(--color-earth-dark)] mb-2">
                  Payment Slip
                </h3>
                <div className="relative group">
                  <img
                    src={selectedBooking.payment_slip_url}
                    alt="Payment Slip"
                    className="w-full rounded-lg border-2 border-[var(--color-sand)] cursor-pointer hover:border-[var(--color-sage)] transition-colors"
                    onClick={() => window.open(selectedBooking.payment_slip_url!, '_blank')}
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
                onClick={() => handleApprove(selectedBooking.id)}
                disabled={processing === selectedBooking.id}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <CheckCircle size={18} />
                {processing === selectedBooking.id ? 'Processing...' : 'Approve'}
              </button>
              <button
                onClick={() => handleReject(selectedBooking.id)}
                disabled={processing === selectedBooking.id}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <XCircle size={18} />
                {processing === selectedBooking.id ? 'Processing...' : 'Reject'}
              </button>
            </div>

            <p className="text-xs text-[var(--color-stone)] mt-4 text-center">
              Approving will mark the booking as paid and confirmed.
              <br />
              Rejecting will allow the user to re-upload a new slip.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <Eye size={48} className="mx-auto text-[var(--color-stone)] mb-4" />
            <p className="text-[var(--color-stone)]">
              Select a booking to view payment slip details
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
