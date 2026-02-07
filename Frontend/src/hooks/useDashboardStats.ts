"use client";

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/utils/supabase/client';

interface DashboardStats {
  total_bookings: number;
  active_members: number;
  revenue: number;
  dropins: number;
  today_checkins: number;
  today_classes_completed: number;
  today_revenue: number;
  bookings_trend?: number;
  members_trend?: number;
  revenue_trend?: number;
  dropins_trend?: number;
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchRevenue = async (): Promise<number> => {
    // Get current month range
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Query report_revenue view for all revenue (packages + bookings)
    const { data, error: revenueError } = await supabase
      .from('report_revenue')
      .select('amount')
      .gte('transaction_date', startOfMonth.toISOString())
      .lte('transaction_date', endOfMonth.toISOString());

    if (revenueError) throw revenueError;

    return (data ?? []).reduce((sum: number, row: any) => {
      return sum + (Number(row?.amount) || 0);
    }, 0);
  };

  const fetchTodayRevenue = async (): Promise<number> => {
    // Get today's date range
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    // Query report_revenue view for today's revenue
    const { data, error: revenueError } = await supabase
      .from('report_revenue')
      .select('amount')
      .gte('transaction_date', startOfDay.toISOString())
      .lte('transaction_date', endOfDay.toISOString());

    if (revenueError) throw revenueError;

    return (data ?? []).reduce((sum: number, row: any) => {
      return sum + (Number(row?.amount) || 0);
    }, 0);
  };

  const fetchActiveMembers = async (): Promise<number> => {
    try {
      const now = new Date().toISOString();
      
      // Fetch active user packages
      const { data: userPackagesData, error: packagesError } = await supabase
        .from('user_packages')
        .select('user_id, package_id, expire_at, credits_remaining')
        .gte('expire_at', now);

      if (packagesError) throw packagesError;

      // Fetch package details to check for unlimited type
      const packageIds = [...new Set((userPackagesData || []).map((p: any) => p.package_id))];
      
      if (packageIds.length === 0) return 0;

      const { data: packagesData, error: packagesDetailsError } = await supabase
        .from('packages')
        .select('id, type')
        .in('id', packageIds);

      if (packagesDetailsError) throw packagesDetailsError;

      const packagesMap: Record<number, any> = {};
      (packagesData || []).forEach((pkg: any) => {
        packagesMap[pkg.id] = pkg;
      });

      // Count unique users with active packages (unlimited OR has credits)
      const activeUserIds = new Set<string>();
      (userPackagesData || []).forEach((userPkg: any) => {
        const packageInfo = packagesMap[userPkg.package_id];
        const isUnlimited = packageInfo?.type === 'unlimited';
        const hasCredits = userPkg.credits_remaining != null && userPkg.credits_remaining > 0;
        
        // Active if: (Is Unlimited OR Has Credits)
        if (isUnlimited || hasCredits) {
          activeUserIds.add(userPkg.user_id);
        }
      });

      return activeUserIds.size;
    } catch (err) {
      console.error('Error fetching active members:', err);
      return 0; // Return 0 instead of null to prevent "---" display
    }
  };

  const fetchStats = async (isBackgroundRefresh = false) => {
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // Stale-while-revalidate: Only show loading spinner on initial load
      setStats((prev) => {
        if (!prev || !isBackgroundRefresh) {
          setLoading(true);
        } else {
          setIsValidating(true);
        }
        return prev;
      });
      setError(null);

      const { data, error: rpcError } = await supabase.rpc('get_dashboard_stats');

      // Check if request was aborted
      if (controller.signal.aborted) return;

      if (rpcError) throw rpcError;

      const revenue = await fetchRevenue();
      const todayRevenue = await fetchTodayRevenue();
      const activeMembers = await fetchActiveMembers();

      // Check again after async operations
      if (controller.signal.aborted) return;
      
      // Override with our client-side calculations
      setStats({ 
        ...(data as unknown as DashboardStats), 
        revenue,
        today_revenue: todayRevenue,
        active_members: activeMembers 
      });
    } catch (err) {
      // Ignore abort errors
      if (controller.signal.aborted) return;

      const e: any = err;
      const asError = e instanceof Error ? e : new Error(e?.message ?? String(e));
      setError(asError);
      console.error('Error fetching dashboard stats:', {
        message: e?.message,
        details: e?.details,
        hint: e?.hint,
        code: e?.code,
        raw: err,
      });
    } finally {
      // Safety: Always reset loading states if not aborted
      if (!controller.signal.aborted) {
        setLoading(false);
        setIsValidating(false);
      }
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchStats();

    // Refetch on window focus (when user returns to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Silent background refresh
        fetchStats(true);
      }
    };

    const handleFocus = () => {
      // Silent background refresh
      fetchStats(true);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    stats,
    loading,
    isValidating,
    error,
    refetch: fetchStats,
  };
}
