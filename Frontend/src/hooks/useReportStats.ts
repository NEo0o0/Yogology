"use client";

import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '../utils/supabase/client';

interface MonthlyReportStats {
  total_bookings: number;
  total_revenue: number;
  total_dropins: number;
  total_package_bookings: number;
  unique_members: number;
  avg_attendance_rate?: number;
  top_class_type?: string;
}

interface MonthlyFinancials {
  total_revenue: number;
  dropin_revenue: number;
  package_revenue: number;
  total_expenses?: number;
  net_profit?: number;
  payment_breakdown?: {
    cash: number;
    bank_transfer: number;
    credit_card: number;
    promptpay: number;
  };
}

interface YearlyReportStats {
  total_bookings: number;
  total_revenue: number;
  total_members: number;
  monthly_breakdown?: Array<{
    month: number;
    bookings: number;
    revenue: number;
  }>;
}

export function useReportStats() {
  const [monthlyStats, setMonthlyStats] = useState<MonthlyReportStats | null>(null);
  const [monthlyFinancials, setMonthlyFinancials] = useState<MonthlyFinancials | null>(null);
  const [yearlyStats, setYearlyStats] = useState<YearlyReportStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // AbortController refs to cancel stale requests
  const monthlyStatsAbortController = useRef<AbortController | null>(null);
  const monthlyFinancialsAbortController = useRef<AbortController | null>(null);
  const yearlyStatsAbortController = useRef<AbortController | null>(null);

  const fetchMonthlyStats = useCallback(async (year: number, month: number, isBackgroundRefresh = false) => {
    // Cancel any pending request
    if (monthlyStatsAbortController.current) {
      monthlyStatsAbortController.current.abort();
    }

    // Create new AbortController for this request
    const controller = new AbortController();
    monthlyStatsAbortController.current = controller;

    try {
      // Stale-while-revalidate: Only show loading spinner on initial load
      setMonthlyStats((prev) => {
        if (!prev || !isBackgroundRefresh) {
          setLoading(true);
        } else {
          setIsValidating(true);
        }
        return prev;
      });
      setError(null);

      const { data, error: rpcError } = await supabase.rpc('get_monthly_report_stats', {
        target_year: year,
        target_month: month,
      });

      // Check if request was aborted
      if (controller.signal.aborted) return;

      if (rpcError) throw rpcError;

      setMonthlyStats(data as unknown as MonthlyReportStats);
    } catch (err) {
      // Ignore abort errors
      if (controller.signal.aborted) return;
      
      setError(err as Error);
      console.error('Error fetching monthly stats:', err);
    } finally {
      // Only reset loading if this request wasn't aborted
      if (!controller.signal.aborted) {
        setLoading(false);
        setIsValidating(false);
      }
    }
  }, []);

  const fetchMonthlyFinancials = useCallback(async (year: number, month: number, isBackgroundRefresh = false) => {
    // Cancel any pending request
    if (monthlyFinancialsAbortController.current) {
      monthlyFinancialsAbortController.current.abort();
    }

    // Create new AbortController for this request
    const controller = new AbortController();
    monthlyFinancialsAbortController.current = controller;

    try {
      // Stale-while-revalidate: Only show loading spinner on initial load
      setMonthlyFinancials((prev) => {
        if (!prev || !isBackgroundRefresh) {
          setLoading(true);
        } else {
          setIsValidating(true);
        }
        return prev;
      });
      setError(null);

      // Calculate date range for the month
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      // Fetch revenue data from report_revenue view
      const { data: revenueData, error: revenueError } = await supabase
        .from('report_revenue')
        .select('*')
        .gte('transaction_date', startDate.toISOString())
        .lte('transaction_date', endDate.toISOString());

      // Check if request was aborted
      if (controller.signal.aborted) return;

      if (revenueError) throw revenueError;

      // Aggregate the data
      const revenues = revenueData || [];
      const totalRevenue = revenues.reduce((sum, r) => sum + (r.amount || 0), 0);
      
      // Calculate revenue by source
      const dropinRevenue = revenues
        .filter(r => (r as any).source === 'booking')
        .reduce((sum, r) => sum + (r.amount || 0), 0);
      
      const packageRevenue = revenues
        .filter(r => (r as any).source === 'package')
        .reduce((sum, r) => sum + (r.amount || 0), 0);

      // Calculate payment method breakdown
      const paymentBreakdown = {
        cash: revenues.filter(r => r.payment_method === 'cash').reduce((sum, r) => sum + (r.amount || 0), 0),
        bank_transfer: revenues.filter(r => r.payment_method === 'bank_transfer').reduce((sum, r) => sum + (r.amount || 0), 0),
        credit_card: revenues.filter(r => r.payment_method === 'credit_card' || r.payment_method === 'card').reduce((sum, r) => sum + (r.amount || 0), 0),
        promptpay: revenues.filter(r => r.payment_method === 'promptpay').reduce((sum, r) => sum + (r.amount || 0), 0),
      };

      const financials: MonthlyFinancials = {
        total_revenue: totalRevenue,
        dropin_revenue: dropinRevenue,
        package_revenue: packageRevenue,
        payment_breakdown: paymentBreakdown,
      };

      setMonthlyFinancials(financials);
    } catch (err) {
      // Ignore abort errors
      if (controller.signal.aborted) return;
      
      setError(err as Error);
      console.error('Error fetching monthly financials:', err);
    } finally {
      // Only reset loading if this request wasn't aborted
      if (!controller.signal.aborted) {
        setLoading(false);
        setIsValidating(false);
      }
    }
  }, []);

  const fetchYearlyStats = useCallback(async (year: number, isBackgroundRefresh = false) => {
    // Cancel any pending request
    if (yearlyStatsAbortController.current) {
      yearlyStatsAbortController.current.abort();
    }

    // Create new AbortController for this request
    const controller = new AbortController();
    yearlyStatsAbortController.current = controller;

    try {
      // Stale-while-revalidate: Only show loading spinner on initial load
      setYearlyStats((prev) => {
        if (!prev || !isBackgroundRefresh) {
          setLoading(true);
        } else {
          setIsValidating(true);
        }
        return prev;
      });
      setError(null);

      // Calculate date range for the year
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31, 23, 59, 59);

      // Fetch revenue data from report_revenue view
      const { data: revenueData, error: revenueError } = await supabase
        .from('report_revenue')
        .select('*')
        .gte('transaction_date', startDate.toISOString())
        .lte('transaction_date', endDate.toISOString());

      // Check if request was aborted
      if (controller.signal.aborted) return;

      if (revenueError) throw revenueError;

      // Fetch bookings count for the year
      const { count: bookingsCount, error: bookingsError } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .neq('status', 'cancelled');

      if (bookingsError) throw bookingsError;

      // Fetch unique members count
      const { data: membersData, error: membersError } = await supabase
        .from('bookings')
        .select('user_id')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .not('user_id', 'is', null)
        .neq('status', 'cancelled');

      if (membersError) throw membersError;

      const uniqueMembers = new Set((membersData || []).map(b => b.user_id)).size;

      // Aggregate revenue by month
      const revenues = revenueData || [];
      const totalRevenue = revenues.reduce((sum, r) => sum + (r.amount || 0), 0);

      // Group by month
      const monthlyBreakdown: Array<{ month: number; bookings: number; revenue: number }> = [];
      for (let month = 1; month <= 12; month++) {
        const monthStart = new Date(year, month - 1, 1);
        const monthEnd = new Date(year, month, 0, 23, 59, 59);

        const monthRevenue = revenues
          .filter(r => {
            if (!r.transaction_date) return false;
            const date = new Date(r.transaction_date);
            return date >= monthStart && date <= monthEnd;
          })
          .reduce((sum, r) => sum + (r.amount || 0), 0);

        // Get bookings count for this month
        const { count: monthBookings } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', monthStart.toISOString())
          .lte('created_at', monthEnd.toISOString())
          .neq('status', 'cancelled');

        monthlyBreakdown.push({
          month,
          bookings: monthBookings || 0,
          revenue: monthRevenue,
        });
      }

      const yearlyStats: YearlyReportStats = {
        total_bookings: bookingsCount || 0,
        total_revenue: totalRevenue,
        total_members: uniqueMembers,
        monthly_breakdown: monthlyBreakdown,
      };

      setYearlyStats(yearlyStats);
    } catch (err) {
      // Ignore abort errors
      if (controller.signal.aborted) return;
      
      setError(err as Error);
      console.error('Error fetching yearly stats:', err);
    } finally {
      // Only reset loading if this request wasn't aborted
      if (!controller.signal.aborted) {
        setLoading(false);
        setIsValidating(false);
      }
    }
  }, []);

  useEffect(() => {
    // Cleanup: Abort all pending requests on unmount
    return () => {
      if (monthlyStatsAbortController.current) {
        monthlyStatsAbortController.current.abort();
      }
      if (monthlyFinancialsAbortController.current) {
        monthlyFinancialsAbortController.current.abort();
      }
      if (yearlyStatsAbortController.current) {
        yearlyStatsAbortController.current.abort();
      }
    };
  }, []);

  return {
    monthlyStats,
    monthlyFinancials,
    yearlyStats,
    loading,
    isValidating,
    error,
    fetchMonthlyStats,
    fetchMonthlyFinancials,
    fetchYearlyStats,
  };
}
