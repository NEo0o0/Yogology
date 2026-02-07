import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import type { Tables } from '@/types/database.types';
import { ProfileTabs } from './ProfileTabs';
import { LogoutButton } from './LogoutButton';
import { ProfileClient } from './ProfileClient';
import { BundlesClient } from './BundlesClient';
import { ProfileEditClient } from './ProfileEditClient';
import { MyPackagesClient } from './MyPackagesClient';

type ProfileRow = Tables<'profiles'>;
type BookingRow = Tables<'bookings'>;
type ClassRow = Tables<'classes'>;
type UserPackageRow = Tables<'user_packages'>;
type PackageRow = Tables<'packages'>;

type BookingWithClass = BookingRow & { classes: ClassRow | null };

type UserPackageWithPackage = UserPackageRow & { packages: PackageRow | null };

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

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const [{ data: profile }, { data: bookings }, { data: userPackages }, { data: bundles }] =
    await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single<ProfileRow>(),
      supabase
        .from('bookings')
        .select('*, classes(*)')
        .eq('user_id', user.id)
        .order('starts_at', { ascending: false, referencedTable: 'classes' })
        .returns<BookingWithClass[]>(),
      supabase
        .from('user_packages')
        .select('*, packages(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .returns<UserPackageWithPackage[]>(),
      supabase
        .from('packages')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true })
        .returns<PackageRow[]>(),
    ]);

  const now = new Date();

  const safeBookings = (bookings ?? []).filter((b) => !!b.classes);
  const upcoming = safeBookings.filter((b) => new Date(b.classes!.starts_at) > now);
  const past = safeBookings.filter((b) => new Date(b.classes!.starts_at) <= now);

  const activePackages = (userPackages ?? []).filter((up) => up.status === 'active');

  const displayName = profile?.full_name || user.email || 'Member';
  const role = profile?.role || 'member';

  const roleBadgeClass =
    role === 'admin'
      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
      : 'bg-[var(--color-cream)] text-[var(--color-earth-dark)] border border-[var(--color-sand)]';

  return (
    <main className="min-h-screen bg-gradient-to-br from-[var(--color-cream)] via-white to-[var(--color-sand)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
          <div className="flex items-start sm:items-center justify-between gap-6 flex-col sm:flex-row">
            <div className="flex items-center gap-4">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={displayName}
                  className="w-16 h-16 rounded-full object-cover border-2 border-[var(--color-sand)]"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--color-sage)] to-[var(--color-clay)] flex items-center justify-center text-white text-2xl">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl text-[var(--color-earth-dark)]">{displayName}</h1>
                  {role === 'admin' ? (
                    <Link
                      href="/admin"
                      className={`px-3 py-1 rounded-full text-xs ${roleBadgeClass} hover:opacity-90 transition-opacity`}
                    >
                      {role}
                    </Link>
                  ) : (
                    <span className={`px-3 py-1 rounded-full text-xs ${roleBadgeClass}`}>{role}</span>
                  )}
                </div>
                <p className="text-[var(--color-stone)]">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <LogoutButton />
            </div>
          </div>

          <div className="mt-8">
            <ProfileTabs
              bookings={
                <ProfileClient
                  userId={user.id}
                  upcoming={upcoming}
                  past={past}
                />
              }
              packages={
                <MyPackagesClient
                  userPackages={userPackages ?? []}
                  userId={user.id}
                />
              }
              bundles={
                <BundlesClient
                  bundles={bundles ?? []}
                  activePackages={activePackages}
                  userId={user.id}
                />
              }
              profile={
                <ProfileEditClient
                  userId={user.id}
                  initialProfile={{
                    full_name: profile?.full_name || null,
                    avatar_url: profile?.avatar_url || null,
                    health_condition: (profile as any)?.health_condition || null,
                    phone: profile?.phone || null,
                  }}
                  isAdmin={role === 'admin'}
                />
              }
            />
          </div>
        </div>
      </div>
    </main>
  );
}
