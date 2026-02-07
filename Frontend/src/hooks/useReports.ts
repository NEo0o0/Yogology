import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/utils/supabase/client';
import { toast } from 'sonner';

export type DateFilter = 'this_month' | 'all_time';

interface ReportMetrics {
  totalRevenue: number;
  totalBookings: number;
  activeMembers: number;
}

interface RevenueTrend {
  date: string;
  revenue: number;
}

interface PopularClass {
  className: string;
  bookings: number;
}

interface ReportsData {
  metrics: ReportMetrics;
  revenueTrend: RevenueTrend[];
  popularClasses: PopularClass[];
}

export function useReports(dateFilter: DateFilter = 'this_month') {
  const [data, setData] = useState<ReportsData>({
    metrics: { totalRevenue: 0, totalBookings: 0, activeMembers: 0 },
    revenueTrend: [],
    popularClasses: [],
  });
  const [loading, setLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchReports = useCallback(async (isBackgroundRefresh = false) => {
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // Stale-while-revalidate: Only show loading spinner on initial load
      setData((prev) => {
        const hasData = prev.metrics.totalRevenue > 0 || prev.metrics.totalBookings > 0;
        if (!hasData || !isBackgroundRefresh) {
          setLoading(true);
        } else {
          setIsValidating(true);
        }
        return prev;
      });
      setError(null);

      // Calculate date range
      const now = new Date();
      let startDate: Date;
      
      if (dateFilter === 'this_month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      } else {
        // All time - go back 2 years
        startDate = new Date(now.getFullYear() - 2, 0, 1);
      }

      const startDateStr = startDate.toISOString();

      // METRIC 1: Total Revenue
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments' as any)
        .select('amount, created_at') as any;

      // Check if request was aborted
      if (controller.signal.aborted) return;

      if (paymentsError) {
        console.error('Payments fetch error:', paymentsError);
      }

      const filteredPayments = (paymentsData || []).filter((p: any) => 
        new Date(p.created_at) >= startDate
      );

      const totalRevenue = filteredPayments.reduce((sum: number, p: any) => 
        sum + (parseFloat(p.amount) || 0), 0
      );

      // METRIC 2: Total Bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('id, created_at, status')
        .gte('created_at', startDateStr);

      // Check if request was aborted
      if (controller.signal.aborted) return;

      if (bookingsError) {
        console.error('Bookings fetch error:', bookingsError);
      }

      const totalBookings = (bookingsData || []).filter((b: any) => 
        b.status !== 'cancelled'
      ).length;

      // METRIC 3: Active Members (users with active packages)
      const { data: activePackagesData, error: packagesError } = await supabase
        .from('user_packages')
        .select('user_id, expire_at')
        .gte('expire_at', now.toISOString());

      // Check if request was aborted
      if (controller.signal.aborted) return;

      if (packagesError) {
        console.error('Active packages fetch error:', packagesError);
      }

      const activeMembers = new Set((activePackagesData || []).map((p: any) => p.user_id)).size;

      // CHART 1: Revenue Trend (group by day/month)
      const revenueTrendMap: Record<string, number> = {};
      
      filteredPayments.forEach((p: any) => {
        const date = new Date(p.created_at);
        const key = dateFilter === 'this_month' 
          ? date.toISOString().split('T')[0] // Daily for this month
          : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // Monthly for all time
        
        revenueTrendMap[key] = (revenueTrendMap[key] || 0) + (parseFloat(p.amount) || 0);
      });

      const revenueTrend = Object.entries(revenueTrendMap)
        .map(([date, revenue]) => ({ date, revenue }))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-30); // Last 30 data points

      // CHART 2: Popular Classes (top 10 by bookings)
      const { data: classBookingsData, error: classBookingsError } = await supabase
        .from('bookings')
        .select('class_id, classes(title)')
        .gte('created_at', startDateStr)
        .neq('status', 'cancelled');

      // Check if request was aborted
      if (controller.signal.aborted) return;

      if (classBookingsError) {
        console.error('Class bookings fetch error:', classBookingsError);
      }

      const classBookingsMap: Record<string, number> = {};
      
      (classBookingsData || []).forEach((b: any) => {
        const className = b.classes?.title || 'Unknown Class';
        classBookingsMap[className] = (classBookingsMap[className] || 0) + 1;
      });

      const popularClasses = Object.entries(classBookingsMap)
        .map(([className, bookings]) => ({ className, bookings }))
        .sort((a, b) => b.bookings - a.bookings)
        .slice(0, 10);

      // Final check before setting state
      if (controller.signal.aborted) return;

      setData({
        metrics: {
          totalRevenue,
          totalBookings,
          activeMembers,
        },
        revenueTrend,
        popularClasses,
      });

    } catch (err) {
      // Ignore abort errors
      if (controller.signal.aborted) return;

      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error('Error fetching reports:', error);
      toast.error('Failed to load reports data');
    } finally {
      // Safety: Always reset loading states if not aborted
      if (!controller.signal.aborted) {
        setLoading(false);
        setIsValidating(false);
      }
    }
  }, [dateFilter]);

  useEffect(() => {
    // Initial fetch
    fetchReports();
  }, [fetchReports]);

  useEffect(() => {
    // Refetch on window focus (when user returns to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Silent background refresh
        fetchReports(true);
      }
    };

    const handleFocus = () => {
      // Silent background refresh
      fetchReports(true);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      // Cancel pending requests on unmount
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchReports]);

  return { data, loading, isValidating, error, refetch: fetchReports };
}
