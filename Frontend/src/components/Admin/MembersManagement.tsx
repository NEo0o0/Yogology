import { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Users as UsersIcon, MoreVertical, Shield, ShieldOff } from 'lucide-react';
import { supabase } from '@/utils/supabase/client';
import { MemberDetailsModal } from '@/components/admin/MemberDetailsModal';
import { AssignPackageModal } from '@/components/admin/AssignPackageModal';
import { EditProfileModal } from '@/components/profile/EditProfileModal';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { Avatar } from '@/components/profile/UserProfileAvatar';
import { toast } from 'sonner';

type FilterType = 'all' | 'unlimited' | 'class-pack' | 'drop-in' | 'instructors';
type SortField = 'fullName' | 'joinedDate' | 'packageStatus';
type SortDirection = 'asc' | 'desc';

interface Member {
  id: string;
  fullName: string;
  email?: string; // Optional - email is in auth.users, not profiles
  phone: string;
  role: string;
  joinedDate: string;
  packageName: string;
  packageType: string | null;
  packageStatus: 'active' | 'expiring' | 'expired' | 'none';
  creditsLeft?: number;
  totalCredits?: number;
  expiryDate?: string;
  avatarUrl?: string | null;
}

export function MembersManagement() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [sortField, setSortField] = useState<SortField>('fullName');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string>('member');

  const [detailsModal, setDetailsModal] = useState<{ memberId: string; memberName: string; isInstructor: boolean } | null>(null);
  const [assignPackageModal, setAssignPackageModal] = useState<{ memberId: string; memberName: string } | null>(null);
  const [editProfileModal, setEditProfileModal] = useState<{ memberId: string; currentName: string; currentPhone: string } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant?: 'default' | 'warning' | 'success';
    confirmText: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '',
    onConfirm: () => {},
  });

  const fetchCurrentUserRole = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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
    }
  }, []);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      // STEP 1: Fetch profiles only (simple query) - email is in auth.users, not profiles
      console.log('Fetching profiles...');
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, phone, role, created_at, avatar_url, health_condition')
        .order('full_name');

      if (profilesError) {
        console.error('Profiles fetch error:', profilesError);
        throw profilesError;
      }

      console.log('Profiles fetched:', profilesData?.length || 0);

      // STEP 2: Fetch user_packages separately (no join) - using any to bypass TypeScript
      console.log('Fetching user packages...');
      const { data: userPackagesData, error: packagesError } = await supabase
        .from('user_packages')
        .select('*') as any;

      if (packagesError) {
        console.error('User packages fetch error:', packagesError);
        // Don't throw - continue without packages
      }

      console.log('User packages fetched:', userPackagesData?.length || 0);
      if (userPackagesData && userPackagesData.length > 0) {
        console.log('Sample user_package:', userPackagesData[0]);
      }

      // STEP 3: Fetch package details separately
      let packagesDetailsMap: Record<number, any> = {};
      if (userPackagesData && userPackagesData.length > 0) {
        const packageIds = [...new Set((userPackagesData as any[]).map((up: any) => up.package_id).filter(Boolean))];
        
        if (packageIds.length > 0) {
          console.log('Fetching package details for IDs:', packageIds);
          const { data: packagesDetails, error: detailsError } = await supabase
            .from('packages')
            .select('*') as any;

          if (detailsError) {
            console.error('Package details fetch error:', detailsError);
          } else {
            console.log('Packages fetched:', packagesDetails?.length || 0);
            if (packagesDetails && packagesDetails.length > 0) {
              console.log('Sample package:', packagesDetails[0]);
            }
            packagesDetailsMap = (packagesDetails || []).reduce((acc: any, pkg: any) => {
              acc[pkg.id] = pkg;
              return acc;
            }, {} as Record<number, any>);
          }
        }
      }

      // STEP 4: Client-side join and mapping
      const membersWithPackages: Member[] = (profilesData || []).map((profile: any) => {
        const activePackage = (userPackagesData || []).find((pkg: any) => pkg.user_id === profile.id);
        const packageInfo = activePackage?.package_id ? packagesDetailsMap[activePackage.package_id] : null;

        let packageStatus: 'active' | 'expiring' | 'expired' | 'none' = 'none';
        let expiryDate: string | undefined;

        if (activePackage && activePackage.expire_at) {
          expiryDate = activePackage.expire_at;
          const expiry = new Date(activePackage.expire_at);
          const now = new Date();
          const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

          // Check if package is still valid
          const isUnlimited = packageInfo?.type === 'unlimited';
          const hasCredits = activePackage.credits_remaining != null && activePackage.credits_remaining > 0;
          const isNotExpired = expiry > now;
          
          // Package is active if: Not Expired AND (Is Unlimited OR Has Credits)
          const isActive = isNotExpired && (isUnlimited || hasCredits);
          
          if (!isNotExpired) {
            packageStatus = 'expired';
          } else if (isActive) {
            // Package is valid - check if expiring soon
            if (daysUntilExpiry <= 7) {
              packageStatus = 'expiring';
            } else {
              packageStatus = 'active';
            }
          } else {
            // No credits left and not unlimited
            packageStatus = 'expired';
          }
        }

        return {
          id: profile.id,
          fullName: profile.full_name || 'Unknown',
          email: undefined, // Email is in auth.users, not accessible from profiles table
          phone: profile.phone || '',
          role: (profile.role || 'member') as 'member' | 'instructor' | 'admin',
          joinedDate: profile.created_at || new Date().toISOString(),
          packageName: packageInfo?.name || 'No Package',
          packageType: packageInfo?.type || null,
          packageStatus,
          creditsLeft: activePackage?.credits_remaining,
          totalCredits: packageInfo?.credits,
          expiryDate,
          avatarUrl: profile.avatar_url,
        };
      });

      console.log('Members mapped:', membersWithPackages.length);
      setMembers(membersWithPackages);
      toast.success(`Loaded ${membersWithPackages.length} members`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
      console.error('Error fetching members:', errorMessage, error);
      toast.error(`Failed to load members: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUserRole();
    fetchMembers();
  }, [fetchCurrentUserRole, fetchMembers]);

  const handleRoleChange = async (userId: string, userName: string, currentRole: string, newRole: string) => {
    const isPromotion = newRole === 'instructor';
    
    setConfirmModal({
      isOpen: true,
      title: isPromotion ? 'Promote to Instructor' : 'Demote to Member',
      message: `Are you sure you want to ${isPromotion ? 'promote' : 'demote'} ${userName} ${isPromotion ? 'to' : 'from'} instructor role?`,
      variant: isPromotion ? 'success' : 'warning',
      confirmText: isPromotion ? 'Promote' : 'Demote',
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from('profiles')
            .update({ role: newRole as 'admin' | 'member' | 'instructor' })
            .eq('id', userId);

          if (error) throw error;

          toast.success(`Successfully ${isPromotion ? 'promoted' : 'demoted'} ${userName}`);
          fetchMembers();
        } catch (error) {
          console.error('Error updating role:', error);
          toast.error('Failed to update role');
        }
      },
    });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredMembers = useMemo(() => {
    let filtered = members;

    if (activeFilter === 'instructors') {
      filtered = filtered.filter((m) => m.role === 'instructor' || m.role === 'admin');
    } else if (activeFilter !== 'all') {
      filtered = filtered.filter((m) => {
        if (activeFilter === 'unlimited') return m.packageType === 'unlimited';
        if (activeFilter === 'class-pack') return m.packageType === 'credit' || m.packageType === 'class-pack';
        if (activeFilter === 'drop-in') return m.packageType === null || m.packageType === 'drop-in';
        return true;
      });
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.fullName.toLowerCase().includes(query) ||
          (m.email && m.email.toLowerCase().includes(query)) ||
          m.phone.toLowerCase().includes(query)
      );
    }

    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      if (sortField === 'fullName') {
        aValue = a.fullName.toLowerCase();
        bValue = b.fullName.toLowerCase();
      } else if (sortField === 'joinedDate') {
        aValue = new Date(a.joinedDate).getTime();
        bValue = new Date(b.joinedDate).getTime();
      } else if (sortField === 'packageStatus') {
        const statusOrder = { active: 1, expiring: 2, expired: 3, none: 4 };
        aValue = statusOrder[a.packageStatus];
        bValue = statusOrder[b.packageStatus];
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [members, activeFilter, searchQuery, sortField, sortDirection]);

  const filterCounts = useMemo(() => {
    return {
      all: members.length,
      unlimited: members.filter((m) => m.packageType === 'unlimited').length,
      'class-pack': members.filter((m) => m.packageType === 'credit' || m.packageType === 'class-pack').length,
      'drop-in': members.filter((m) => m.packageType === null || m.packageType === 'drop-in').length,
      instructors: members.filter((m) => m.role === 'instructor' || m.role === 'admin').length,
    };
  }, [members]);

  const canManageRoles = currentUserRole === 'admin';
  const canAssignPackages = currentUserRole === 'admin' || currentUserRole === 'staff' || currentUserRole === 'instructor';
  const canViewDetails = currentUserRole === 'admin' || currentUserRole === 'staff' || currentUserRole === 'instructor';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[var(--color-stone)]">Loading members...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light text-[var(--color-earth-dark)]">Members</h1>
          <p className="text-[var(--color-stone)] mt-1">Manage studio members and their packages</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-[var(--color-sand)] overflow-hidden">
        <div className="p-6 border-b border-[var(--color-sand)]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-stone)]" size={20} />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[var(--color-sand)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-sage)] focus:border-transparent"
            />
          </div>

          <div className="flex gap-2 mt-4 flex-wrap">
            {(['all', 'unlimited', 'class-pack', 'drop-in', 'instructors'] as FilterType[]).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 rounded-lg text-sm transition-all duration-300 ${
                  activeFilter === filter
                    ? 'bg-[var(--color-sage)] text-white shadow-md'
                    : 'bg-[var(--color-cream)] text-[var(--color-stone)] hover:bg-[var(--color-sand)]'
                }`}
              >
                {filter === 'all' && `All (${filterCounts.all})`}
                {filter === 'unlimited' && `Unlimited (${filterCounts.unlimited})`}
                {filter === 'class-pack' && `Class Pack (${filterCounts['class-pack']})`}
                {filter === 'drop-in' && `Drop-in (${filterCounts['drop-in']})`}
                {filter === 'instructors' && `Instructors (${filterCounts.instructors})`}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-full">
            <thead className="bg-[var(--color-cream)]">
              <tr>
                <th
                  className="px-6 py-4 text-left text-xs uppercase tracking-wider text-[var(--color-stone)] cursor-pointer hover:bg-[var(--color-sand)] transition-colors"
                  onClick={() => handleSort('fullName')}
                >
                  <div className="flex items-center gap-2">
                    Member
                    {sortField === 'fullName' && (
                      <span className="text-[var(--color-sage)]">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-[var(--color-stone)]">
                  Current Package
                </th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-[var(--color-stone)]">
                  Status / Credits
                </th>
                <th
                  className="px-6 py-4 text-left text-xs uppercase tracking-wider text-[var(--color-stone)] cursor-pointer hover:bg-[var(--color-sand)] transition-colors"
                  onClick={() => handleSort('packageStatus')}
                >
                  <div className="flex items-center gap-2">
                    Package Status
                    {sortField === 'packageStatus' && (
                      <span className="text-[var(--color-sage)]">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th
                  className="px-6 py-4 text-left text-xs uppercase tracking-wider text-[var(--color-stone)] cursor-pointer hover:bg-[var(--color-sand)] transition-colors"
                  onClick={() => handleSort('joinedDate')}
                >
                  <div className="flex items-center gap-2">
                    Joined Date
                    {sortField === 'joinedDate' && (
                      <span className="text-[var(--color-sage)]">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-[var(--color-stone)]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-sand)]">
              {filteredMembers.map((member) => (
                <tr key={member.id} className="hover:bg-[var(--color-cream)]/50 transition-colors duration-150">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar 
                        src={member.avatarUrl}
                        alt={member.fullName}
                        size="md"
                        fallbackText={member.fullName}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[var(--color-earth-dark)]">{member.fullName}</span>
                          {(member.role === 'instructor' || member.role === 'admin') && (
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                              {member.role === 'admin' ? 'Admin' : 'Instructor'}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-[var(--color-stone)]">{member.phone}</div>
                        <div className="text-xs text-[var(--color-stone)]">{member.email}</div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="text-sm text-[var(--color-earth-dark)]">{member.packageName}</div>
                  </td>

                  <td className="px-6 py-4">
                    {member.packageType === 'class-pack' && member.creditsLeft !== undefined && member.totalCredits !== undefined ? (
                      <div>
                        <div className={`text-sm font-medium mb-1 ${
                          member.creditsLeft === 0 ? 'text-red-600' : 'text-[var(--color-earth-dark)]'
                        }`}>
                          {member.creditsLeft === 0 
                            ? `Out of credits (0/${member.totalCredits})`
                            : `${member.creditsLeft} / ${member.totalCredits}`
                          }
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              member.creditsLeft / member.totalCredits >= 0.5
                                ? 'bg-green-500'
                                : member.creditsLeft / member.totalCredits >= 0.25
                                ? 'bg-orange-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${(member.creditsLeft / member.totalCredits) * 100}%` }}
                          />
                        </div>
                      </div>
                    ) : member.packageType === 'unlimited' ? (
                      <div className="text-sm font-medium text-[var(--color-earth-dark)]">
                        Unlimited
                      </div>
                    ) : (
                      <div className="text-sm text-[var(--color-stone)]">Pay per class</div>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs ${
                        member.packageStatus === 'active'
                          ? 'bg-green-100 text-green-700'
                          : member.packageStatus === 'expiring'
                          ? 'bg-orange-100 text-orange-700'
                          : member.packageStatus === 'expired'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {member.packageStatus === 'active' ? (
                        member.packageType === 'unlimited' ? (
                          'Active'
                        ) : member.packageType === 'credit' && member.creditsLeft !== undefined && member.totalCredits !== undefined ? (
                          member.creditsLeft === 0 ? (
                            <span className="text-red-700">0 / {member.totalCredits}</span>
                          ) : (
                            `${member.creditsLeft} / ${member.totalCredits}`
                          )
                        ) : (
                          'Active'
                        )
                      ) : member.packageStatus === 'expiring'
                        ? 'Expiring Soon'
                        : member.packageStatus === 'expired'
                        ? 'Expired'
                        : 'No Package'}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <div className="text-sm text-[var(--color-stone)]">
                      {new Date(member.joinedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </td>

                  <td className="px-6 py-4 relative">
                    <button
                      onClick={() => setActiveMenuId(activeMenuId === member.id ? null : member.id)}
                      className="p-2 hover:bg-[var(--color-cream)] rounded-lg transition-colors duration-300"
                    >
                      <MoreVertical size={18} className="text-[var(--color-stone)]" />
                    </button>

                    {activeMenuId === member.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setActiveMenuId(null)} />
                        <div className="absolute right-8 top-12 bg-white rounded-lg shadow-xl border border-[var(--color-sand)] py-2 z-20 min-w-[200px]">
                          {canViewDetails && (
                            <button
                              onClick={() => {
                                setDetailsModal({
                                  memberId: member.id,
                                  memberName: member.fullName,
                                  isInstructor: member.role === 'instructor' || member.role === 'admin',
                                });
                                setActiveMenuId(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-[var(--color-earth-dark)] hover:bg-[var(--color-cream)] transition-colors"
                            >
                              View Details
                            </button>
                          )}
                          {canManageRoles && (
                            <button
                              onClick={() => {
                                setEditProfileModal({
                                  memberId: member.id,
                                  currentName: member.fullName,
                                  currentPhone: member.phone,
                                });
                                setActiveMenuId(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-[var(--color-earth-dark)] hover:bg-[var(--color-cream)] transition-colors"
                            >
                              Edit Profile
                            </button>
                          )}
                          {canAssignPackages && (
                            <button
                              onClick={() => {
                                setAssignPackageModal({
                                  memberId: member.id,
                                  memberName: member.fullName,
                                });
                                setActiveMenuId(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-[var(--color-earth-dark)] hover:bg-[var(--color-cream)] transition-colors"
                            >
                              Assign Package
                            </button>
                          )}
                          {canManageRoles && member.role !== 'admin' && (
                            <>
                              <div className="border-t border-[var(--color-sand)] my-2" />
                              {member.role === 'member' ? (
                                <button
                                  onClick={() => {
                                    handleRoleChange(member.id, member.fullName, member.role, 'instructor');
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-[var(--color-earth-dark)] hover:bg-[var(--color-cream)] transition-colors flex items-center gap-2"
                                >
                                  <Shield size={16} />
                                  Promote to Instructor
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    handleRoleChange(member.id, member.fullName, member.role, 'member');
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-orange-600 hover:bg-orange-50 transition-colors flex items-center gap-2"
                                >
                                  <ShieldOff size={16} />
                                  Demote to Member
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredMembers.length === 0 && (
          <div className="p-12 text-center">
            <div className="w-24 h-24 rounded-full bg-[var(--color-cream)] mx-auto mb-4 flex items-center justify-center">
              <UsersIcon size={40} className="text-[var(--color-sage)]" />
            </div>
            <h3 className="text-xl text-[var(--color-earth-dark)] mb-2">No members found</h3>
            <p className="text-[var(--color-stone)]">{searchQuery ? 'Try adjusting your search or filters' : 'Start by adding your first member'}</p>
          </div>
        )}

        {filteredMembers.length > 0 && (
          <div className="px-6 py-4 border-t border-[var(--color-sand)] bg-[var(--color-cream)]/50">
            <p className="text-sm text-[var(--color-stone)]">
              Showing {filteredMembers.length} of {members.length} members
            </p>
          </div>
        )}
      </div>

      {detailsModal && (
        <MemberDetailsModal
          memberId={detailsModal.memberId}
          memberName={detailsModal.memberName}
          isInstructor={detailsModal.isInstructor}
          onClose={() => setDetailsModal(null)}
        />
      )}

      {assignPackageModal && (
        <AssignPackageModal
          memberId={assignPackageModal.memberId}
          memberName={assignPackageModal.memberName}
          onClose={() => setAssignPackageModal(null)}
          onSuccess={() => fetchMembers()}
        />
      )}

      {editProfileModal && (
        <EditProfileModal
          memberId={editProfileModal.memberId}
          currentName={editProfileModal.currentName}
          currentPhone={editProfileModal.currentPhone}
          onClose={() => setEditProfileModal(null)}
          onSuccess={() => fetchMembers()}
        />
      )}

      {confirmModal.isOpen && (
        <ConfirmationModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          variant={confirmModal.variant}
          confirmText={confirmModal.confirmText}
          onConfirm={() => {
            confirmModal.onConfirm();
            setConfirmModal({ ...confirmModal, isOpen: false });
          }}
          onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        />
      )}
    </div>
  );
}
