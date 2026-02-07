import { createSupabaseServerClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { VerifySlipsClient } from './VerifySlipsClient';

export default async function VerifySlipsPage() {
  const supabase = await createSupabaseServerClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    redirect('/');
  }

  // Fetch bookings with partial payment status (awaiting verification)
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
    .not('user_id', 'is', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching pending bookings:', error);
    return (
      <div className="min-h-screen bg-gradient-to-br from-[var(--color-cream)] to-white">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <h2 className="text-xl font-bold text-red-800 mb-2">Error Loading Data</h2>
            <p className="text-red-700">
              Failed to fetch pending bookings. Please check the database connection and RLS policies.
            </p>
            <p className="text-sm text-red-600 mt-2">
              Error: {error.message || 'Unknown error'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--color-cream)] to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--color-earth-dark)]">
            Payment Slip Verification
          </h1>
          <p className="text-[var(--color-stone)] mt-2">
            Review and approve payment slips from users
          </p>
        </div>

        <VerifySlipsClient 
          initialBookings={(pendingBookings || []).filter(b => b.user_id !== null) as any} 
          userId={user.id}
        />
      </div>
    </div>
  );
}
