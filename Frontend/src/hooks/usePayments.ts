import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase/client';
import type { Tables, TablesInsert, TablesUpdate, Enums } from '../types/database.types';

type Payment = Tables<'payments'>;
type PaymentInsert = TablesInsert<'payments'>;
type PaymentUpdate = TablesUpdate<'payments'>;
type PaymentMethod = Enums<'payment_method'>;

interface UsePaymentsOptions {
  userId?: string;
  bookingId?: number;
  userPackageId?: number;
  autoFetch?: boolean;
}

export function usePayments(options: UsePaymentsOptions = {}) {
  const { userId, bookingId, userPackageId, autoFetch = true } = options;
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('payments')
        .select('*, bookings(*), user_packages(*), profiles(*)')
        .order('paid_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      if (bookingId) {
        query = query.eq('booking_id', bookingId);
      }

      if (userPackageId) {
        query = query.eq('user_package_id', userPackageId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setPayments(data || []);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchPayments();
    }
  }, [userId, bookingId, userPackageId, autoFetch]);

  const recordPayment = async (paymentData: PaymentInsert) => {
    try {
      // Check if this is a drop-in payment for a booking
      if (paymentData.booking_id) {
        // Use record_dropin_payment RPC which handles booking updates automatically
        const { data: paymentId, error: rpcError } = await supabase.rpc('record_dropin_payment', {
          p_booking_id: paymentData.booking_id,
          p_amount: paymentData.amount,
          p_method: paymentData.method,
          p_evidence_url: paymentData.evidence_url || undefined,
          p_note: paymentData.note || undefined,
        });

        if (rpcError) throw rpcError;

        // Fetch the created payment with relations
        const { data, error: fetchError } = await supabase
          .from('payments')
          .select('*, bookings(*), user_packages(*)')
          .eq('id', paymentId)
          .single();

        if (fetchError) throw fetchError;

        setPayments(prev => [data, ...prev]);
        return { data, error: null };
      } else {
        // For package payments, use direct insert
        const { data, error: createError } = await supabase
          .from('payments')
          .insert(paymentData)
          .select('*, bookings(*), user_packages(*)')
          .single();

        if (createError) throw createError;

        setPayments(prev => [data, ...prev]);
        return { data, error: null };
      }
    } catch (err) {
      return { data: null, error: err as Error };
    }
  };

  const updatePayment = async (id: number, updates: PaymentUpdate) => {
    try {
      const { data, error: updateError } = await supabase
        .from('payments')
        .update(updates)
        .eq('id', id)
        .select('*, bookings(*), user_packages(*)')
        .single();

      if (updateError) throw updateError;

      setPayments(prev => prev.map(p => (p.id === id ? data : p)));
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  };

  const verifyPayment = async (id: number) => {
    return updatePayment(id, { log_status: 'recorded' as any });
  };

  const disputePayment = async (id: number) => {
    return updatePayment(id, { log_status: 'void' as any });
  };

  return {
    payments,
    loading,
    error,
    fetchPayments,
    recordPayment,
    updatePayment,
    verifyPayment,
    disputePayment,
  };
}
