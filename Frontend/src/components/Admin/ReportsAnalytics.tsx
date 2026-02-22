"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import { TrendingUp, Users, Calendar as CalendarIcon, ShieldAlert, Download, Loader2 } from 'lucide-react';
import { MonthYearPicker } from '@/components/ui/MonthYearPicker';
import { useReportStats } from '@/hooks/useReportStats';
import { supabase } from '@/utils/supabase/client';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';

const COLORS = {
  cash: '#6B9080',
  bank_transfer: '#A4B494',
  credit_card: '#D4A574',
  promptpay: '#C89F9C',
  dropins: '#7A9FC1',
  package: '#9C7AC1'
};

export function ReportsAnalytics() {
  const [activeTab, setActiveTab] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [yearlyViewYear, setYearlyViewYear] = useState(new Date().getFullYear());
  const [currentUserRole, setCurrentUserRole] = useState<string>('member');
  const [roleLoading, setRoleLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const {
    monthlyStats,
    monthlyFinancials,
    yearlyStats,
    loading,
    fetchMonthlyStats,
    fetchMonthlyFinancials,
    fetchYearlyStats
  } = useReportStats();

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  // RBAC: Fetch current user's role
  const fetchUserRole = useCallback(async () => {
    try {
      setRoleLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setCurrentUserRole('member');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile) {
        setCurrentUserRole(profile.role);
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
      setCurrentUserRole('member');
    } finally {
      setRoleLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserRole();
  }, [fetchUserRole]);

  useEffect(() => {
    // RPCs typically expect month 1-12. UI state is 0-11.
    const monthForRpc = selectedMonth + 1;
    fetchMonthlyStats(selectedYear, monthForRpc);
    fetchMonthlyFinancials(selectedYear, monthForRpc);
  }, [fetchMonthlyFinancials, fetchMonthlyStats, selectedMonth, selectedYear]);

  useEffect(() => {
    fetchYearlyStats(yearlyViewYear);
  }, [fetchYearlyStats, yearlyViewYear]);

  const paymentBreakdownData = useMemo(() => {
    const pb = monthlyFinancials?.payment_breakdown;
    if (!pb) return [];

    return [
      { method: 'Cash', amount: pb.cash ?? 0, key: 'cash' },
      { method: 'Bank', amount: pb.bank_transfer ?? 0, key: 'bank_transfer' },
      { method: 'Card', amount: pb.credit_card ?? 0, key: 'credit_card' },
      { method: 'PromptPay', amount: pb.promptpay ?? 0, key: 'promptpay' }
    ].filter((x) => (x.amount ?? 0) > 0);
  }, [monthlyFinancials]);

  const bookingTypeData = useMemo(() => {
    const total = monthlyStats?.total_bookings ?? 0;
    const dropins = monthlyStats?.total_dropins ?? 0;
    const packageBookings = monthlyStats?.total_package_bookings ?? Math.max(0, total - dropins);
    if (total <= 0) return [];

    const mk = (name: string, value: number, colorKey: keyof typeof COLORS) => ({
      name,
      value,
      percentage: total > 0 ? ((value / total) * 100).toFixed(1) : '0.0',
      colorKey
    });

    return [
      mk('Drop-ins', dropins, 'dropins'),
      mk('Packages', packageBookings, 'package')
    ].filter((x) => x.value > 0);
  }, [monthlyStats]);

  const yearlyRevenueData = useMemo(() => {
    const breakdown = yearlyStats?.monthly_breakdown ?? [];
    return breakdown.map((m) => ({
      month: monthNames[(m.month ?? 1) - 1]?.slice(0, 3) ?? String(m.month),
      revenue: m.revenue ?? 0,
      bookings: m.bookings ?? 0
    }));
  }, [monthNames, yearlyStats]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-xl border border-[var(--color-sand)]">
          <p className="text-sm text-[var(--color-earth-dark)]">{payload[0].name}</p>
          <p className="text-lg text-[var(--color-sage)]">
            {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-xl border border-[var(--color-sand)]">
          <p className="text-sm text-[var(--color-earth-dark)]">{payload[0].name}</p>
          <p className="text-lg text-[var(--color-sage)]">
            {payload[0].value} ({payload[0].payload.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      
      // Determine period for filename and data fetch
      const month = monthNames[selectedMonth];
      const year = activeTab === 'monthly' ? selectedYear : yearlyViewYear;
      const period = activeTab === 'monthly' ? `${month}_${year}` : `${year}`;
      const filename = `financial-report-${period.toLowerCase()}.csv`;
      
      // Fetch payment data for the selected period
      const startDate = activeTab === 'monthly'
        ? new Date(selectedYear, selectedMonth, 1)
        : new Date(year, 0, 1);
      const endDate = activeTab === 'monthly'
        ? new Date(selectedYear, selectedMonth + 1, 0)
        : new Date(year, 11, 31);
      
      // Fetch bookings with user profiles and guest info
      const { data: bookingsData, error } = await supabase
        .from('bookings')
        .select('id, created_at, amount_paid, amount_due, payment_status, payment_method, user_id, guest_name, guest_contact, kind')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .neq('status', 'cancelled');
      
      if (error) throw error;
      
      // Fetch user profiles for member bookings
      const userIds = [...new Set((bookingsData || []).map((b: any) => b.user_id).filter(Boolean))];
      let usersMap: Record<string, any> = {};
      
      if (userIds.length > 0) {
        const { data: usersData } = await supabase
          .from('profiles')
          .select('id, full_name, phone')
          .in('id', userIds);
        
        (usersData || []).forEach((u: any) => {
          usersMap[u.id] = u;
        });
      }
      
      // CSV Headers
      const headers = 'Date,Name,Type,Amount Paid,Amount Due,Payment Method,Payment Status,Contact\n';
      
      // CSV Rows
      const rows = (bookingsData || []).map((booking: any) => {
        const date = new Date(booking.created_at).toLocaleDateString();
        const name = booking.guest_name || usersMap[booking.user_id]?.full_name || 'Unknown';
        const type = booking.guest_name ? 'Guest' : 'Member';
        const amountPaid = booking.amount_paid || 0;
        const amountDue = booking.amount_due || 0;
        const method = booking.payment_method || 'N/A';
        const status = booking.payment_status || 'unpaid';
        const contact = booking.guest_contact || usersMap[booking.user_id]?.phone || '';
        
        return `"${date}","${name}","${type}","${amountPaid}","${amountDue}","${method}","${status}","${contact}"`;
      }).join('\n');
      
      const csvData = headers + rows;
      
      // Create and download CSV file
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      // toast.success(`CSV exported successfully: ${filename}`);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      // toast.error('Failed to export CSV');
    } finally {
      setIsExporting(false);
    }
  };

  // RBAC: Show loading state (AFTER all hooks)
  if (roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-[var(--color-stone)]">Loading...</div>
      </div>
    );
  }

  // RBAC: Show unauthorized message for non-admins (AFTER all hooks)
  if (currentUserRole !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
            <ShieldAlert size={40} className="text-red-600" />
          </div>
          <h2 className="text-2xl text-[var(--color-earth-dark)] mb-3">Access Denied</h2>
          <p className="text-[var(--color-stone)] mb-6">
            This page is restricted to administrators only. Please contact your system administrator if you believe you should have access.
          </p>
          <div className="text-sm text-[var(--color-stone)]">
            Current role: <span className="font-medium text-[var(--color-earth-dark)]">{currentUserRole}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl text-[var(--color-earth-dark)] mb-2">Reports & Analytics</h1>
        <p className="text-[var(--color-stone)]">Track performance, trends, and insights</p>
      </div>

      {/* Tabs */}
      <div className="mb-8 border-b border-[var(--color-sand)]">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('monthly')}
            className={`px-6 py-3 border-b-2 transition-all duration-300 ${
              activeTab === 'monthly'
                ? 'border-[var(--color-sage)] text-[var(--color-sage)]'
                : 'border-transparent text-[var(--color-stone)] hover:text-[var(--color-earth-dark)]'
            }`}
          >
            Monthly Analysis
          </button>
          <button
            onClick={() => setActiveTab('yearly')}
            className={`px-6 py-3 border-b-2 transition-all duration-300 ${
              activeTab === 'yearly'
                ? 'border-[var(--color-sage)] text-[var(--color-sage)]'
                : 'border-transparent text-[var(--color-stone)] hover:text-[var(--color-earth-dark)]'
            }`}
          >
            Yearly Overview
          </button>
        </div>
      </div>

      {/* Monthly Analysis Tab */}
      {activeTab === 'monthly' && (
        <div className="space-y-8">
          {/* Month/Year Picker */}
          <div className="flex items-center justify-between">
            <MonthYearPicker
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              onMonthChange={setSelectedMonth}
              onYearChange={setSelectedYear}
            />

            {/* Export CSV Button */}
            <button
              onClick={handleExportCSV}
              disabled={isExporting}
              className="bg-white hover:bg-[var(--color-cream)] text-[var(--color-earth-dark)] border border-[var(--color-sand)] px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-300 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span className="text-sm">Exporting...</span>
                </>
              ) : (
                <>
                  <Download size={18} />
                  <span className="text-sm">Export CSV</span>
                </>
              )}
            </button>

            {/* Quick Stats */}
            <div className="flex gap-6">
              <div className="bg-white rounded-lg shadow-md px-6 py-3">
                <div className="text-sm text-[var(--color-stone)]">Total Bookings</div>
                <div className="text-2xl text-[var(--color-earth-dark)]">{loading ? '—' : (monthlyStats?.total_bookings ?? 0)}</div>
              </div>
              <div className="bg-white rounded-lg shadow-md px-6 py-3">
                <div className="text-sm text-[var(--color-stone)]">Revenue</div>
                <div className="text-2xl text-[var(--color-earth-dark)]">{loading ? '—' : `฿${Number(monthlyFinancials?.total_revenue ?? 0).toLocaleString()}`}</div>
              </div>
            </div>
          </div>

          {/* Chart 1: Payment Breakdown */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <TrendingUp size={20} className="text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl text-[var(--color-earth-dark)]">Payment Breakdown</h2>
                <p className="text-sm text-[var(--color-stone)]">Revenue by payment method</p>
              </div>
            </div>
            
            {paymentBreakdownData.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={paymentBreakdownData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8DFD8" />
                  <XAxis 
                    dataKey="method" 
                    stroke="#8B7F76"
                    style={{ fontSize: '14px' }}
                  />
                  <YAxis 
                    stroke="#8B7F76"
                    style={{ fontSize: '14px' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="amount" fill="#6B9080" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[350px] flex items-center justify-center text-[var(--color-stone)]">
                No data available for this month
              </div>
            )}
          </div>

          {/* Chart 2: Booking Breakdown */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <CalendarIcon size={20} className="text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl text-[var(--color-earth-dark)]">Booking Breakdown</h2>
                <p className="text-sm text-[var(--color-stone)]">Drop-ins vs package bookings</p>
              </div>
            </div>

            {bookingTypeData.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={bookingTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} (${percentage}%)`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {bookingTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[entry.colorKey as keyof typeof COLORS] || '#9CA3AF'} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>

                {/* Legend with actual numbers */}
                <div className="flex flex-col justify-center space-y-3">
                  {bookingTypeData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg hover:bg-[var(--color-cream)] transition-colors">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: COLORS[item.colorKey as keyof typeof COLORS] || '#9CA3AF' }}
                        />
                        <span className="text-[var(--color-earth-dark)]">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-[var(--color-earth-dark)]">{item.value} bookings</div>
                        <div className="text-xs text-[var(--color-stone)]">{item.percentage}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[350px] flex items-center justify-center text-[var(--color-stone)]">
                No data available for this month
              </div>
            )}
          </div>
        </div>
      )}

      {/* Yearly Overview Tab */}
      {activeTab === 'yearly' && (
        <div className="space-y-8">
          {/* Year Picker */}
          <div className="flex items-center justify-between">
            <MonthYearPicker
              selectedMonth={0} // Not used for yearly view
              selectedYear={yearlyViewYear}
              onMonthChange={() => {}} // No-op for yearly view
              onYearChange={setYearlyViewYear}
              showMonthOnly={true}
            />

            {/* Quick Stats */}
            <div className="flex gap-6">
              <div className="bg-white rounded-lg shadow-md px-6 py-3">
                <div className="text-sm text-[var(--color-stone)]">Annual Bookings</div>
                <div className="text-2xl text-[var(--color-earth-dark)]">{loading ? '—' : (yearlyStats?.total_bookings ?? 0)}</div>
              </div>
              <div className="bg-white rounded-lg shadow-md px-6 py-3">
                <div className="text-sm text-[var(--color-stone)]">Annual Revenue</div>
                <div className="text-2xl text-[var(--color-earth-dark)]">{loading ? '—' : `฿${Number(yearlyStats?.total_revenue ?? 0).toLocaleString()}`}</div>
              </div>
            </div>
          </div>

          {/* Chart 3: Monthly Revenue Trend */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Users size={20} className="text-green-600" />
              </div>
              <div>
                <h2 className="text-xl text-[var(--color-earth-dark)]">Monthly Revenue Trend</h2>
                <p className="text-sm text-[var(--color-stone)]">Revenue performance throughout the year</p>
              </div>
            </div>

            {yearlyRevenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={yearlyRevenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8DFD8" />
                  <XAxis 
                    dataKey="month" 
                    stroke="#8B7F76"
                    style={{ fontSize: '14px' }}
                  />
                  <YAxis 
                    stroke="#8B7F76"
                    style={{ fontSize: '14px' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #E8DFD8',
                      borderRadius: '8px',
                      padding: '12px'
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#6B9080"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[400px] flex items-center justify-center text-[var(--color-stone)]">
                No data available for this year
              </div>
            )}
          </div>

          {/* Chart 4: Monthly Bookings */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <TrendingUp size={20} className="text-orange-600" />
              </div>
              <div>
                <h2 className="text-xl text-[var(--color-earth-dark)]">Monthly Bookings ({yearlyViewYear})</h2>
                <p className="text-sm text-[var(--color-stone)]">Total bookings per month</p>
              </div>
            </div>

            {yearlyRevenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={yearlyRevenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8DFD8" />
                  <XAxis 
                    dataKey="month"
                    stroke="#8B7F76"
                    style={{ fontSize: '14px' }}
                  />
                  <YAxis 
                    stroke="#8B7F76"
                    style={{ fontSize: '14px' }}
                  />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #E8DFD8',
                      borderRadius: '8px',
                      padding: '12px'
                    }}
                  />
                  <Bar dataKey="bookings" fill="#D4A574" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[350px] flex items-center justify-center text-[var(--color-stone)]">
                No data available for this year
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}