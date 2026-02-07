 "use client";

import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase/client';
import type { Tables, TablesInsert, TablesUpdate, Enums } from '../types/database.types';

type Booking = Tables<'bookings'>;
type BookingInsert = TablesInsert<'bookings'>;
type BookingUpdate = TablesUpdate<'bookings'>;
type BookingStatus = Enums<'booking_status'>;
type PaymentMethod = Enums<'payment_method'>;
type PaymentStatus = Enums<'payment_status'>;

interface UseBookingsOptions {
  userId?: string;
  classId?: number;
  status?: BookingStatus;
  autoFetch?: boolean;
}

interface UserPackageInfo {
  id: number;
  name: string;
  credits_remaining: number;
  is_unlimited: boolean;
  expires_at: string | null;
}

interface BookingWithPayment extends BookingInsert {
  payment_method?: PaymentMethod;
  payment_status?: PaymentStatus;
  payment_note?: string;
  payment_slip_url?: string;
  guest_name?: string;
  guest_contact?: string;
}

export function useBookings(options: UseBookingsOptions = {}) {
  const { userId, classId, status, autoFetch = true } = options;
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('bookings')
        .select('*, classes(*), user_packages(*), profiles(*)')
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      if (classId) {
        query = query.eq('class_id', classId);
      }

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setBookings(data || []);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchBookings();
    }
  }, [userId, classId, status, autoFetch]);

  const checkUserPackage = async (userId: string): Promise<UserPackageInfo | null> => {
    try {
      const { data, error } = await supabase.rpc('check_user_active_package', {
        p_user_id: userId
      });

      if (error) throw error;
      if (!data || data.length === 0) return null;

      return {
        id: data[0].package_id,
        name: data[0].package_name,
        credits_remaining: data[0].credits_remaining,
        is_unlimited: data[0].is_unlimited,
        expires_at: data[0].expires_at
      };
    } catch (err) {
      console.error('Error checking user package:', err);
      return null;
    }
  };

  const checkExistingBooking = async (userId: string, classId: number): Promise<Booking | null> => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', userId)
        .eq('class_id', classId)
        .in('status', ['booked', 'attended']) // Only check active bookings, not cancelled
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error checking existing booking:', err);
      return null;
    }
  };

  const createBooking = async (bookingData: BookingWithPayment) => {
    try {
      setLoading(true);
      
      // Check for existing cancelled booking (upsert logic)
      if (bookingData.user_id && bookingData.class_id) {
        const { data: existingBooking } = await supabase
          .from('bookings')
          .select('id, status')
          .eq('user_id', bookingData.user_id)
          .eq('class_id', bookingData.class_id)
          .eq('status', 'cancelled')
          .maybeSingle();

        if (existingBooking) {
          // Re-activate cancelled booking instead of creating new one
          return updateBooking(existingBooking.id, {
            status: 'booked',
            cancelled_at: null,
            payment_method: bookingData.payment_method,
            payment_status: bookingData.payment_status || 'unpaid',
            payment_note: bookingData.payment_note,
            amount_due: bookingData.amount_due || 0,
            amount_paid: bookingData.payment_status === 'paid' ? (bookingData.amount_due || 0) : 0
          });
        }
      }

      let data, error;
      
      if (bookingData.kind === 'package') {
        // Package booking - use RPC
        const res = await supabase.rpc('book_with_package', {
          p_class_id: Number(bookingData.class_id)
        });
        data = res.data;
        error = res.error;
      } else if (bookingData.guest_name) {
        // Guest booking - direct insert
        const guestBooking: BookingInsert = {
          class_id: bookingData.class_id,
          kind: 'dropin',
          status: 'booked',
          guest_name: bookingData.guest_name,
          guest_contact: bookingData.guest_contact,
          amount_due: bookingData.amount_due || 0,
          amount_paid: bookingData.payment_status === 'paid' ? (bookingData.amount_due || 0) : 0,
          payment_method: bookingData.payment_method,
          payment_status: bookingData.payment_status || 'unpaid',
          payment_note: bookingData.payment_note,
          paid_at: bookingData.payment_status === 'paid' ? new Date().toISOString() : null
        };
        const res = await supabase.from('bookings').insert(guestBooking).select().single();
        data = res.data;
        error = res.error;
      } else {
        // Drop-in booking with payment info
        const dropinBooking: any = {
          user_id: bookingData.user_id,
          class_id: bookingData.class_id,
          kind: 'dropin',
          status: 'booked',
          amount_due: bookingData.amount_due || 0,
          amount_paid: bookingData.payment_status === 'paid' ? (bookingData.amount_due || 0) : 0,
          payment_method: bookingData.payment_method,
          payment_status: bookingData.payment_status || 'unpaid',
          payment_note: bookingData.payment_note,
          payment_slip_url: bookingData.payment_slip_url,
          paid_at: bookingData.payment_status === 'paid' ? new Date().toISOString() : null
        };
        const res = await supabase.from('bookings').insert(dropinBooking).select().single();
        data = res.data;
        error = res.error;
      }

      if (error) throw error;

      await fetchBookings();
      
      return { data, error: null };
    } catch (err) {
      console.error('Booking failed:', err);
      return { data: null, error: err as Error };
    } finally {
      setLoading(false);
    }
  };

  const updateBookingPayment = async (bookingId: number, updates: Partial<BookingWithPayment>) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update(updates)
        .eq('id', bookingId);

      if (error) throw error;

      await fetchBookings();
      return { error: null };
    } catch (err) {
      console.error('Error updating booking payment:', err);
      return { error: err as Error };
    }
  };

  const verifyPayment = async (bookingId: number) => {
    try {
      const { data: booking, error: fetchError } = await supabase
        .from('bookings')
        .select('amount_due, user_id, classes(title, starts_at), profiles(*)')
        .eq('id', bookingId)
        .single();

      if (fetchError) throw fetchError;

      const { error } = await supabase
        .from('bookings')
        .update({
          payment_status: 'paid',
          paid_at: new Date().toISOString(),
          amount_paid: booking.amount_due
        })
        .eq('id', bookingId);

      if (error) throw error;

      // Send payment verified email
      const bookingData = booking as any;
      if (bookingData.profiles?.email && bookingData.classes) {
        const classDate = new Date(bookingData.classes.starts_at).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        const classTime = new Date(bookingData.classes.starts_at).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        });

        fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'payment_verified',
            recipientEmail: bookingData.profiles.email,
            recipientName: bookingData.profiles.full_name || bookingData.profiles.email,
            data: {
              className: bookingData.classes.title,
              classDate: classDate,
              classTime: classTime,
              amount: booking.amount_due || 0
            }
          })
        }).then(res => {
          if (res.ok) {
            console.log('✅ Payment verified email sent successfully');
          } else {
            console.error('❌ Failed to send payment verified email');
          }
        }).catch(err => {
          console.error('❌ Payment verified email error:', err);
        });
      }

      await fetchBookings();
      return { error: null };
    } catch (err) {
      console.error('Error verifying payment:', err);
      return { error: err as Error };
    }
  };

  const updateBooking = async (id: number, updates: BookingUpdate) => {
    try {
      const { data, error: updateError } = await supabase
        .from('bookings')
        .update(updates)
        .eq('id', id)
        .select('*, classes(*), user_packages(*)')
        .single();

      if (updateError) throw updateError;

      setBookings(prev => prev.map(b => (b.id === id ? data : b)));
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  };

  const cancelBooking = async (id: number) => {
    try {
      // Use cancel_booking RPC which handles credit refunds automatically
      const { error: rpcError } = await supabase.rpc('cancel_booking', {
        p_booking_id: id,
      });

      if (rpcError) throw rpcError;

      // Fetch the updated booking with relations
      const { data, error: fetchError } = await supabase
        .from('bookings')
        .select('*, classes(*), user_packages(*)')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      setBookings(prev => prev.map(b => (b.id === id ? data : b)));
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  };

  const markAsAttended = async (id: number) => {
    return updateBooking(id, { status: 'attended' });
  };

  const markAsNoShow = async (id: number) => {
    return updateBooking(id, { status: 'no_show' });
  };

  return {
    bookings,
    loading,
    error,
    fetchBookings,
    createBooking,
    updateBooking,
    updateBookingPayment,
    verifyPayment,
    cancelBooking,
    markAsAttended,
    markAsNoShow,
    checkUserPackage,
    checkExistingBooking,
  };
}
