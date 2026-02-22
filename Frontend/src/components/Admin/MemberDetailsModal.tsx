"use client";

import { useState, useEffect } from 'react';
import { X, Calendar, Package, GraduationCap, Loader2, Activity } from 'lucide-react';
import { supabase } from '@/utils/supabase/client';
import { Avatar } from '@/components/profile/UserProfileAvatar';
import { toast } from 'sonner';

interface MemberDetailsModalProps {
  memberId: string;
  memberName: string;
  isInstructor: boolean;
  onClose: () => void;
}

interface BookingHistoryItem {
  id: number;
  class_name: string;
  class_date: string;
  payment_method: string | null;
  amount_paid: number;
  recorded_by_name: string | null;
}

interface PackageHistoryItem {
  id: number;
  package_name: string;
  start_at: string;
  expire_at: string;
  credits_total: number | null;
  credits_remaining: number | null;
  status: 'active' | 'expired';
}

interface TeachingHistoryItem {
  id: number;
  class_name: string;
  class_date: string;
  booked_count: number;
  capacity: number;
}

export function MemberDetailsModal({ memberId, memberName, isInstructor, onClose }: MemberDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<'bookings' | 'packages' | 'teaching'>('bookings');
  const [bookingHistory, setBookingHistory] = useState<BookingHistoryItem[]>([]);
  const [packageHistory, setPackageHistory] = useState<PackageHistoryItem[]>([]);
  const [teachingHistory, setTeachingHistory] = useState<TeachingHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [memberProfile, setMemberProfile] = useState<{ avatar_url: string | null; phone: string | null; health_condition: string | null } | null>(null);

  useEffect(() => {
    // Fetch member profile data
    const fetchMemberProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('avatar_url, phone, health_condition')
        .eq('id', memberId)
        .single();
      
      if (data) {
        setMemberProfile(data);
      }
    };
    
    fetchMemberProfile();
    
    if (activeTab === 'bookings') {
      fetchBookingHistory();
    } else if (activeTab === 'packages') {
      fetchPackageHistory();
    } else if (activeTab === 'teaching' && isInstructor) {
      fetchTeachingHistory();
    }
  }, [activeTab, memberId, isInstructor]);

  const fetchBookingHistory = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          amount_paid,
          payment_method,
          classes!inner(title, starts_at),
          payments(recorded_by)
        `)
        .eq('user_id', memberId)
        .eq('status', 'booked')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const recordedByIds = data
        ?.map((b: any) => b.payments?.[0]?.recorded_by)
        .filter((id): id is string => !!id) || [];

      let recordedByNames: Record<string, string> = {};
      if (recordedByIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', recordedByIds);

        recordedByNames = (profiles || []).reduce((acc, p) => {
          acc[p.id] = p.full_name || 'Unknown';
          return acc;
        }, {} as Record<string, string>);
      }

      const formatted: BookingHistoryItem[] = (data || []).map((b: any) => ({
        id: b.id,
        class_name: b.classes?.title || 'Unknown Class',
        class_date: b.classes?.starts_at || '',
        payment_method: b.payment_method,
        amount_paid: b.amount_paid || 0,
        recorded_by_name: b.payments?.[0]?.recorded_by 
          ? recordedByNames[b.payments[0].recorded_by] || 'Unknown Admin'
          : null
      }));

      setBookingHistory(formatted);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      toast.error(`Failed to load booking history: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchPackageHistory = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_packages')
        .select(`
          id,
          start_at,
          expire_at,
          credits_remaining,
          packages!inner(name, credits)
        `)
        .eq('user_id', memberId)
        .order('start_at', { ascending: false });

      if (error) throw error;

      const now = new Date();
      const formatted: PackageHistoryItem[] = (data || []).map((p: any) => ({
        id: p.id,
        package_name: p.packages?.name || 'Unknown Package',
        start_at: p.start_at,
        expire_at: p.expire_at,
        credits_total: p.packages?.credits,
        credits_remaining: p.credits_remaining ?? null,
        status: new Date(p.expire_at) >= now ? 'active' : 'expired'
      }));

      setPackageHistory(formatted);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      toast.error(`Failed to load package history: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachingHistory = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('id, title, starts_at, booked_count, capacity')
        .eq('instructor_id', memberId)
        .order('starts_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const formatted: TeachingHistoryItem[] = (data || []).map((c: any) => ({
        id: c.id,
        class_name: c.title,
        class_date: c.starts_at,
        booked_count: c.booked_count || 0,
        capacity: c.capacity
      }));

      setTeachingHistory(formatted);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      toast.error(`Failed to load teaching history: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateOnly = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[var(--color-sand)] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar 
              src={memberProfile?.avatar_url}
              alt={memberName}
              size="xl"
              fallbackText={memberName}
            />
            <div>
              <h2 className="text-2xl text-[var(--color-earth-dark)]">{memberName}</h2>
              <p className="text-sm text-[var(--color-stone)] mt-1">
                {memberProfile?.phone || 'Member Details'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--color-cream)] rounded-lg transition-colors"
          >
            <X size={24} className="text-[var(--color-stone)]" />
          </button>
        </div>

        {/* Health Condition Alert */}
        {memberProfile?.health_condition && (
          <div className="mx-6 mt-4 bg-orange-50 border-l-4 border-orange-500 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Activity className="text-orange-600 mt-0.5 flex-shrink-0" size={20} />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-orange-800 mb-1">
                  Health Condition / Medical Note
                </h3>
                <p className="text-sm text-[var(--color-earth-dark)]">
                  {memberProfile.health_condition}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-[var(--color-sand)]">
          <div className="flex px-6">
            <button
              onClick={() => setActiveTab('bookings')}
              className={`px-4 py-3 border-b-2 transition-all duration-300 flex items-center gap-2 ${
                activeTab === 'bookings'
                  ? 'border-[var(--color-sage)] text-[var(--color-sage)]'
                  : 'border-transparent text-[var(--color-stone)] hover:text-[var(--color-earth-dark)]'
              }`}
            >
              <Calendar size={18} />
              <span>Booking History</span>
            </button>
            <button
              onClick={() => setActiveTab('packages')}
              className={`px-4 py-3 border-b-2 transition-all duration-300 flex items-center gap-2 ${
                activeTab === 'packages'
                  ? 'border-[var(--color-sage)] text-[var(--color-sage)]'
                  : 'border-transparent text-[var(--color-stone)] hover:text-[var(--color-earth-dark)]'
              }`}
            >
              <Package size={18} />
              <span>Package History</span>
            </button>
            {isInstructor && (
              <button
                onClick={() => setActiveTab('teaching')}
                className={`px-4 py-3 border-b-2 transition-all duration-300 flex items-center gap-2 ${
                  activeTab === 'teaching'
                    ? 'border-[var(--color-sage)] text-[var(--color-sage)]'
                    : 'border-transparent text-[var(--color-stone)] hover:text-[var(--color-earth-dark)]'
                }`}
              >
                <GraduationCap size={18} />
                <span>Teaching History</span>
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={32} className="animate-spin text-[var(--color-sage)]" />
            </div>
          ) : (
            <>
              {/* Booking History Tab */}
              {activeTab === 'bookings' && (
                <div className="space-y-4">
                  {bookingHistory.length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar size={48} className="mx-auto text-[var(--color-stone)] mb-4" />
                      <p className="text-[var(--color-stone)]">No booking history found</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-[var(--color-cream)]">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[var(--color-stone)]">Class Name</th>
                            <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[var(--color-stone)]">Date</th>
                            <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[var(--color-stone)]">Payment Method</th>
                            <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[var(--color-stone)]">Amount</th>
                            <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[var(--color-stone)]">Received By</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-sand)]">
                          {bookingHistory.map((booking) => (
                            <tr key={booking.id} className="hover:bg-[var(--color-cream)]/50">
                              <td className="px-4 py-3 text-sm text-[var(--color-earth-dark)]">{booking.class_name}</td>
                              <td className="px-4 py-3 text-sm text-[var(--color-stone)]">{formatDate(booking.class_date)}</td>
                              <td className="px-4 py-3 text-sm">
                                {booking.payment_method ? (
                                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                                    {booking.payment_method}
                                  </span>
                                ) : (
                                  <span className="text-[var(--color-stone)]">-</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm text-[var(--color-earth-dark)]">
                                ฿{booking.amount_paid.toFixed(2)}
                              </td>
                              <td className="px-4 py-3 text-sm text-[var(--color-stone)]">
                                {booking.payment_method === 'cash' && booking.recorded_by_name ? (
                                  <span className="text-[var(--color-earth-dark)]">{booking.recorded_by_name}</span>
                                ) : (
                                  <span>-</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Package History Tab */}
              {activeTab === 'packages' && (
                <div className="space-y-4">
                  {packageHistory.length === 0 ? (
                    <div className="text-center py-12">
                      <Package size={48} className="mx-auto text-[var(--color-stone)] mb-4" />
                      <p className="text-[var(--color-stone)]">No package history found</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {packageHistory.map((pkg) => (
                        <div key={pkg.id} className="bg-[var(--color-cream)] rounded-lg p-4 border border-[var(--color-sand)]">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg text-[var(--color-earth-dark)]">{pkg.package_name}</h3>
                                <span className={`px-2 py-1 rounded text-xs ${
                                  pkg.status === 'active' 
                                    ? 'bg-green-100 text-green-700' 
                                    : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {pkg.status === 'active' ? 'Active' : 'Expired'}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-[var(--color-stone)]">Start Date:</span>
                                  <span className="ml-2 text-[var(--color-earth-dark)]">{formatDateOnly(pkg.start_at)}</span>
                                </div>
                                <div>
                                  <span className="text-[var(--color-stone)]">Expiry Date:</span>
                                  <span className="ml-2 text-[var(--color-earth-dark)]">{formatDateOnly(pkg.expire_at)}</span>
                                </div>
                                {pkg.credits_total && (
                                  <div>
                                    <span className="text-[var(--color-stone)]">Credits:</span>
                                    <span className="ml-2 text-[var(--color-earth-dark)]">
                                      {pkg.credits_remaining ?? 0} / {pkg.credits_total} remaining
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Teaching History Tab */}
              {activeTab === 'teaching' && isInstructor && (
                <div className="space-y-4">
                  {teachingHistory.length === 0 ? (
                    <div className="text-center py-12">
                      <GraduationCap size={48} className="mx-auto text-[var(--color-stone)] mb-4" />
                      <p className="text-[var(--color-stone)]">No teaching history found</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-[var(--color-cream)]">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[var(--color-stone)]">Class Name</th>
                            <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[var(--color-stone)]">Date</th>
                            <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[var(--color-stone)]">Attendance</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-sand)]">
                          {teachingHistory.map((cls) => (
                            <tr key={cls.id} className="hover:bg-[var(--color-cream)]/50">
                              <td className="px-4 py-3 text-sm text-[var(--color-earth-dark)]">{cls.class_name}</td>
                              <td className="px-4 py-3 text-sm text-[var(--color-stone)]">{formatDate(cls.class_date)}</td>
                              <td className="px-4 py-3 text-sm text-[var(--color-earth-dark)]">
                                {cls.booked_count} / {cls.capacity}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[var(--color-sand)] flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-[var(--color-sage)] hover:bg-[var(--color-clay)] text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
