"use client";

import { useMemo, useState } from 'react';
import React from 'react';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';

import { 
  Clock, 
  ChevronDown, 
  Phone, 
  MessageCircle, 
  Instagram, 
  Facebook, 
  AlertCircle,
  UserCheck,
  UserPlus,
  X,
  Activity
} from 'lucide-react';

interface Booking {
  id: string;
  studentId: string;
  name: string;
  avatar: string;
  phone: string;
  contactInfo: string;
  contactPlatform: string;
  status: 'confirmed' | 'checked-in';
  bookingTime: string;
  isGuest?: boolean;
  user_id?: string | null;
  guest_name?: string | null;
  guest_contact?: string | null;
  paymentStatus?: 'paid' | 'unpaid';
  amountDue?: number;
  amountPaid?: number;
  paidAt?: string | null;
  isAttended?: boolean;
  healthCondition?: string | null;
}

interface ClassItem {
  id: number;
  name: string;
  time: string;
  booked: number;
  capacity: number;
  instructor: string;
  room?: string;
  bookings?: Booking[];
}

interface TodaysClassesTableProps {
  classes: ClassItem[];
  bookings: Record<number, Booking[]>;
  onManualBooking?: (classId: number, className: string, classTime: string) => void;
  onMarkAsPaid?: (bookingId: string, classId: number, className: string, amount: number) => void;
  onCancelBooking?: (bookingId: string, classId: number, className: string) => void;
  onToggleAttendance?: (bookingId: string, classId: number, nextValue: boolean) => void;
  onTogglePaymentStatus?: (
    bookingId: string,
    classId: number,
    nextStatus: 'paid' | 'unpaid',
    amountDue: number
  ) => void;
}

interface ConfirmModalState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  variant?: 'default' | 'warning' | 'success';
  confirmText?: string;
}

export function TodaysClassesTable({
  classes,
  bookings,
  onManualBooking,
  onMarkAsPaid,
  onCancelBooking,
  onToggleAttendance,
  onTogglePaymentStatus,
}: TodaysClassesTableProps) {
  const [expandedClassId, setExpandedClassId] = useState<number | null>(null);
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const checkedInStudents = useMemo(() => {
    return new Set(
      Object.values(bookings)
        .flat()
        .filter((b) => Boolean((b as any).isAttended))
        .map((b) => b.id)
    );
  }, [bookings]);

  const toggleRow = (classId: number) => {
    setExpandedClassId(expandedClassId === classId ? null : classId);
  };

  const handleCheckIn = (bookingId: string, classId: number) => {
    const classBookings = bookings[classId] || [];
    const booking = classBookings.find((b) => String(b.id) === String(bookingId));
    const nextValue = !Boolean((booking as any)?.isAttended);
    onToggleAttendance?.(bookingId, classId, nextValue);
  };

  const handleTogglePayment = (booking: Booking, classId: number) => {
    if (!onTogglePaymentStatus) return;

    const amountDue = Number(booking.amountDue ?? 0);
    const isPaid = booking.paymentStatus === 'paid';

    if (!isPaid) {
      setConfirmModal({
        isOpen: true,
        title: 'Confirm Payment',
        message: `Confirm payment of ${amountDue} THB for this student?`,
        variant: 'success',
        confirmText: 'Mark as Paid',
        onConfirm: () => {
          onTogglePaymentStatus(String(booking.id), classId, 'paid', amountDue);
        },
      });
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Mark as Unpaid',
      message: 'Change status back to UNPAID? This will remove the recorded payment.',
      variant: 'warning',
      confirmText: 'Mark Unpaid',
      onConfirm: () => {
        onTogglePaymentStatus(String(booking.id), classId, 'unpaid', amountDue);
      },
    });
  };

  const getCapacityColor = (booked: number, capacity: number) => {
    const percentage = (booked / capacity) * 100;
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 70) return 'text-orange-600';
    return 'text-green-600';
  };

  const getCapacityBg = (booked: number, capacity: number) => {
    const percentage = (booked / capacity) * 100;
    if (percentage >= 90) return 'bg-red-100';
    if (percentage >= 70) return 'bg-orange-100';
    return 'bg-green-100';
  };

  const getContactIcon = (platform: string) => {
    switch (platform) {
      case 'line':
        return <MessageCircle size={16} className="text-green-600" />;
      case 'instagram':
        return <Instagram size={16} className="text-pink-600" />;
      case 'facebook':
        return <Facebook size={16} className="text-blue-600" />;
      case 'whatsapp':
        return <MessageCircle size={16} className="text-green-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-4 md:px-6 py-4 border-b border-[var(--color-sand)] flex items-center justify-between">
        <h3 className="text-base md:text-lg text-[var(--color-earth-dark)]">Today's Classes</h3>
        <span className="text-sm text-[var(--color-stone)]">{classes.length} classes</span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[var(--color-cream)]">
            <tr>
              <th className="px-4 md:px-6 py-3 text-left text-xs uppercase tracking-wider text-[var(--color-stone)]">
                Class Name
              </th>
              <th className="px-4 md:px-6 py-3 text-left text-xs uppercase tracking-wider text-[var(--color-stone)] hidden sm:table-cell">
                Time
              </th>
              <th className="px-4 md:px-6 py-3 text-left text-xs uppercase tracking-wider text-[var(--color-stone)] hidden md:table-cell">
                Instructor
              </th>
              <th className="px-4 md:px-6 py-3 text-left text-xs uppercase tracking-wider text-[var(--color-stone)] hidden lg:table-cell">
                Room
              </th>
              <th className="px-4 md:px-6 py-3 text-left text-xs uppercase tracking-wider text-[var(--color-stone)]">
                Booked
              </th>
              <th className="px-4 md:px-6 py-3 text-center text-xs uppercase tracking-wider text-[var(--color-stone)]">
                
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-sand)]">
            {classes.map((classItem) => {
              const isExpanded = expandedClassId === classItem.id;
              const classBookings = bookings[classItem.id] || [];
              
              return (
                <React.Fragment key={classItem.id}>
                  {/* Main Class Row */}
                  <tr 
                    onClick={() => toggleRow(classItem.id)}
                    className="hover:bg-[var(--color-cream)]/50 transition-colors duration-150 cursor-pointer"
                  >
                    <td className="px-4 md:px-6 py-4">
                      <div className="text-sm md:text-base text-[var(--color-earth-dark)]">{classItem.name}</div>
                      <div className="text-xs text-[var(--color-stone)] sm:hidden">{classItem.time}</div>
                    </td>
                    <td className="px-4 md:px-6 py-4 hidden sm:table-cell">
                      <div className="flex items-center gap-2 text-[var(--color-stone)] text-sm">
                        <Clock size={14} />
                        {classItem.time}
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-4 hidden md:table-cell">
                      <div className="text-sm text-[var(--color-stone)]">{classItem.instructor}</div>
                    </td>
                    <td className="px-4 md:px-6 py-4 hidden lg:table-cell">
                      <div className="text-sm text-[var(--color-stone)]">{classItem.room || '—'}</div>
                    </td>
                    <td className="px-4 md:px-6 py-4">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <span className={`text-base md:text-lg ${getCapacityColor(classItem.booked, classItem.capacity)}`}>
                          {classItem.booked}/{classItem.capacity}
                        </span>
                        <span className={`px-2 md:px-3 py-1 rounded-full text-xs ${getCapacityBg(classItem.booked, classItem.capacity)} ${getCapacityColor(classItem.booked, classItem.capacity)}`}>
                          {classItem.booked === classItem.capacity ? 'Full' : `${classItem.capacity - classItem.booked} spots`}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-4 text-center">
                      <ChevronDown 
                        size={20} 
                        className={`inline-block text-[var(--color-stone)] transition-transform duration-300 ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    </td>
                  </tr>

                  {/* Expanded Student List Row */}
                  {isExpanded && (
                    <tr>
                      <td colSpan={6} className="px-4 md:px-6 py-0">
                        <div className="bg-[var(--color-cream)]/30 py-4 animate-fadeIn">
                          {classBookings.length === 0 ? (
                            <div className="text-center py-8 text-[var(--color-stone)]">
                              <p>No students registered yet</p>
                              {onManualBooking ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onManualBooking(classItem.id, classItem.name, classItem.time);
                                  }}
                                  className="mt-4 bg-[var(--color-sage)] hover:bg-[var(--color-clay)] text-white px-4 py-2 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                                >
                                  Book Student
                                </button>
                              ) : null}
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between mb-3 px-2">
                                <h4 className="text-sm text-[var(--color-stone)]">
                                  Registered Students ({classBookings.length})
                                </h4>
                                {onManualBooking && classItem.booked < classItem.capacity && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onManualBooking(classItem.id, classItem.name, classItem.time);
                                    }}
                                    className="bg-[var(--color-sage)] hover:bg-[var(--color-clay)] text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs transition-all duration-200 shadow-sm hover:shadow-md"
                                  >
                                    <UserPlus size={14} />
                                    <span>Add Booking</span>
                                  </button>
                                )}
                              </div>
                              
                              {/* Student List */}
                              <div className="space-y-2">
                                {classBookings.map((booking) => (
                                  <div 
                                    key={booking.id}
                                    className="bg-white rounded-lg p-3 md:p-4 shadow-sm hover:shadow-md transition-shadow duration-200"
                                  >
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                                      {/* Avatar & Name */}
                                      <div className="flex items-center gap-3 flex-1 min-w-0">
                                        {/* Avatar - Image or Initials */}
                                        {booking.avatar && booking.avatar.startsWith('http') ? (
                                          <img
                                            src={booking.avatar}
                                            alt={booking.name}
                                            className="w-10 h-10 rounded-full object-cover border-2 border-[var(--color-sand)] flex-shrink-0"
                                          />
                                        ) : (
                                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-sage)] to-[var(--color-clay)] flex items-center justify-center text-white flex-shrink-0 text-sm font-semibold">
                                            {booking.avatar}
                                          </div>
                                        )}
                                        <div className="min-w-0 flex-1">
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <div className="text-sm md:text-base text-[var(--color-earth-dark)] truncate">
                                              {booking.name}
                                            </div>
                                            {booking.isGuest && (
                                              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full whitespace-nowrap">
                                                Guest
                                              </span>
                                            )}
                                            {/* Health Condition Alert */}
                                            {booking.healthCondition && (
                                              <div className="relative group" title="Health condition noted">
                                                <Activity 
                                                  size={16} 
                                                  className="text-orange-600 cursor-help" 
                                                />
                                                {/* Tooltip */}
                                                <div className="absolute left-0 top-6 z-50 hidden group-hover:block w-64 p-3 bg-white border-2 border-orange-200 rounded-lg shadow-lg">
                                                  <div className="flex items-start gap-2">
                                                    <Activity size={14} className="text-orange-600 mt-0.5 flex-shrink-0" />
                                                    <div>
                                                      <p className="text-xs font-semibold text-orange-800 mb-1">Health Condition:</p>
                                                      <p className="text-xs text-[var(--color-earth-dark)]">{booking.healthCondition}</p>
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                          <div className="text-xs text-[var(--color-stone)]">
                                            Booked: {booking.bookingTime}
                                          </div>
                                        </div>
                                      </div>

                                      {/* Contact Actions & Status */}
                                      <div className="flex items-center gap-3 sm:gap-4 flex-wrap sm:flex-nowrap">
                                        {/* Phone */}
                                        <a
                                          href={`tel:${booking.phone}`}
                                          className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 hover:bg-blue-100 transition-colors"
                                          title={`Call ${booking.phone}`}
                                        >
                                          <Phone size={16} className="text-blue-600" />
                                        </a>

                                        {/* Social Contact */}
                                        {booking.contactInfo ? (
                                          <a
                                            href={booking.contactInfo}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-50 hover:bg-green-100 transition-colors"
                                            title={`Contact via ${booking.contactPlatform}`}
                                          >
                                            {getContactIcon(booking.contactPlatform)}
                                          </a>
                                        ) : (
                                          <div
                                            className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-orange-50"
                                            title="No contact info available"
                                          >
                                            <AlertCircle size={16} className="text-orange-600" />
                                          </div>
                                        )}

                                        {/* Status Badges */}
                                        <div className="flex items-center gap-2">
                                          <span 
                                            className={`px-3 py-1 rounded-full text-xs whitespace-nowrap ${
                                              checkedInStudents.has(booking.id)
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-blue-100 text-blue-700'
                                            }`}
                                          >
                                            {checkedInStudents.has(booking.id) ? 'Checked-in' : 'Confirmed'}
                                          </span>

                                          {/* Interactive Payment Status Badge */}
                                          {onTogglePaymentStatus ? (
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleTogglePayment(booking, classItem.id);
                                              }}
                                              className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md ${
                                                booking.paymentStatus === 'paid'
                                                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                  : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                              }`}
                                              title={booking.paymentStatus === 'paid' ? 'Click to mark as unpaid' : 'Click to mark as paid'}
                                            >
                                              {booking.paymentStatus === 'paid' ? '✓ Paid' : 'Unpaid'}
                                            </button>
                                          ) : (
                                            <span
                                              className={`px-3 py-1 rounded-full text-xs whitespace-nowrap ${
                                                booking.paymentStatus === 'paid'
                                                  ? 'bg-green-100 text-green-700'
                                                  : 'bg-amber-100 text-amber-800'
                                              }`}
                                            >
                                              {booking.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                                            </span>
                                          )}
                                        </div>

                                        {/* Check-in Button */}
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleCheckIn(booking.id, classItem.id);
                                          }}
                                          className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 ${
                                            checkedInStudents.has(booking.id)
                                              ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                              : 'bg-[var(--color-sage)] text-white hover:bg-[var(--color-clay)] shadow-sm hover:shadow-md'
                                          }`}
                                        >
                                          <UserCheck size={14} />
                                          {checkedInStudents.has(booking.id) ? 'Undo' : 'Check-in'}
                                        </button>

                                        {/* Cancel Booking */}
                                        {onCancelBooking && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              onCancelBooking(booking.id, classItem.id, classItem.name);
                                            }}
                                            className="px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 bg-red-50 text-red-700 hover:bg-red-100"
                                            title="Cancel booking"
                                          >
                                            <X size={14} />
                                            Cancel
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
        confirmText={confirmModal.confirmText}
      />
    </div>
  );
}
