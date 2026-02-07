'use client';

import { Calendar, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { useClasses } from '../hooks';
import { ClassDetailsModal } from './ClassDetailsModal';
import { supabase } from '@/utils/supabase/client';
import { getDisplayLevel } from '@/constants/levels';
import { formatToThaiTime, formatToThaiDate, formatToThaiDateLong, formatToThaiDayOfWeek } from '@/utils/dateHelpers';
import type { Tables } from '@/types/database.types';

type DbClass = Tables<'classes'>;

interface WeeklyScheduleProps {
  onNavigate: (page: string) => void;
  initialClasses?: DbClass[];
}

type ViewMode = 'day' | 'week' | 'month';

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const calendarDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function WeeklySchedule({ onNavigate, initialClasses }: WeeklyScheduleProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentWeekStart, setCurrentWeekStart] = useState(getWeekStart(new Date()));
  const [selectedClass, setSelectedClass] = useState<DbClass | null>(null);
  const [timeoutError, setTimeoutError] = useState(false);

  // Calculate dynamic date range based on viewMode
  const dateRange = useMemo(() => {
    if (viewMode === 'week') {
      // Week view: Monday to Sunday
      const start = new Date(currentWeekStart);
      start.setHours(0, 0, 0, 0);
      const end = new Date(currentWeekStart);
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      
      console.log('[WeeklySchedule] WEEK VIEW Date Range:', {
        viewMode,
        currentWeekStart: currentWeekStart.toISOString(),
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        startLocal: start.toLocaleString(),
        endLocal: end.toLocaleString(),
      });
      
      return { startDate: start.toISOString(), endDate: end.toISOString() };
    } else if (viewMode === 'month') {
      // Month view: 1st to last day of the month
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth();
      const start = new Date(year, month, 1);
      start.setHours(0, 0, 0, 0);
      const end = new Date(year, month + 1, 0); // Last day of month
      end.setHours(23, 59, 59, 999);
      
      console.log('[WeeklySchedule] MONTH VIEW Date Range:', {
        viewMode,
        year,
        month,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      });
      
      return { startDate: start.toISOString(), endDate: end.toISOString() };
    } else {
      // Day view: just the selected day
      const start = new Date(selectedDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(selectedDate);
      end.setHours(23, 59, 59, 999);
      
      console.log('[WeeklySchedule] DAY VIEW Date Range:', {
        viewMode,
        selectedDate: selectedDate.toISOString(),
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      });
      
      return { startDate: start.toISOString(), endDate: end.toISOString() };
    }
  }, [viewMode, selectedDate, currentWeekStart]);

  // Use the new useClasses hook with dynamic date filtering
  // NOTE: Do NOT use initialClasses to avoid showing stale/deleted data
  // Always fetch fresh data from API to ensure accuracy
  const { classes: dbClasses, loading, error, fetchClasses } = useClasses({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    category: 'class',
    initialClasses: undefined, // Force fresh fetch, ignore server-side initialClasses
    autoFetch: false, // We'll manually trigger fetches
  });

  // Fetch classes when date range changes (using stable string dependencies)
  useEffect(() => {
    console.log('[WeeklySchedule] Fetching classes for date range:', {
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      viewMode,
    });
    fetchClasses();
  }, [dateRange.startDate, dateRange.endDate]);

  // Timeout fallback: Force loading to stop after 10 seconds
  useEffect(() => {
    if (!loading) {
      setTimeoutError(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      if (loading) {
        console.error('[WeeklySchedule] Loading timeout after 10 seconds');
        setTimeoutError(true);
      }
    }, 10000);

    return () => clearTimeout(timeoutId);
  }, [loading]);

  // Transform database classes to UI format with null-safe handling
  const classes = useMemo(() => {
    console.log('[WeeklySchedule] Transforming classes:', {
      viewMode,
      dbClassesCount: dbClasses.length,
      dateRange,
      firstClass: dbClasses[0] ? {
        id: dbClasses[0].id,
        title: dbClasses[0].title,
        starts_at: dbClasses[0].starts_at,
        is_cancelled: dbClasses[0].is_cancelled,
      } : null,
    });
    
    return dbClasses.map((cls) => {
      // Priority: instructor_name (guest) > instructor.full_name (registered) > default
      const instructorName = (cls as any).instructor_name 
        || (cls as any).instructor?.full_name 
        || 'Annie Bliss Team';
      
      return {
        id: cls.id.toString(),
        title: cls.title,
        time: formatToThaiTime(cls.starts_at),
        instructor: instructorName,
        level: cls.level || 'All Levels',
        capacity: cls.capacity,
        enrolled: cls.booked_count,
        day: formatToThaiDayOfWeek(cls.starts_at),
        duration: cls.ends_at 
          ? `${Math.round((new Date(cls.ends_at).getTime() - new Date(cls.starts_at).getTime()) / 60000)} min`
          : '60 min',
        description: cls.description || 'A wonderful yoga class to enhance your practice.',
        room: cls.location || 'Studio A',
        category: cls.category || 'class',
        // Store original DB class for detail modal
        _dbClass: cls,
      };
    });
  }, [dbClasses]);

  // Helper function to get the start of the week (Monday)
  function getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day; // Adjust to Monday
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  // Generate array of dates for the current week
  function getWeekDates(weekStart: Date): Date[] {
    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      dates.push(date);
    }
    return dates;
  }

  // Format date as "Mon 29 Dec" in Thai timezone
  function formatDateLabel(date: Date): string {
    return formatToThaiDate(date);
  }

  // Get day name from date (e.g., "Monday")
  function getDayName(date: Date): string {
    return calendarDays[date.getDay()];
  }

  const getLevelColor = (level: string) => {
    const lowerLevel = level.toLowerCase();
    if (lowerLevel.includes('beginner') || lowerLevel.includes('basic')) return 'bg-teal-100 text-teal-800';
    if (lowerLevel.includes('intermediate')) return 'bg-orange-100 text-orange-800';
    if (lowerLevel.includes('advanced')) return 'bg-red-100 text-red-800';
    // Multilevel/All Levels
    return 'bg-purple-100 text-purple-800';
  };

  // Get current day name
  const getCurrentDayName = (date: Date) => {
    const dayIndex = date.getDay();
    return daysOfWeek[dayIndex === 0 ? 6 : dayIndex - 1];
  };

  // Navigation handlers
  const handlePrevious = () => {
    if (viewMode === 'day') {
      const newDate = new Date(selectedDate);
      newDate.setDate(newDate.getDate() - 1);
      setSelectedDate(newDate);
    } else if (viewMode === 'week') {
      const newWeekStart = new Date(currentWeekStart);
      newWeekStart.setDate(newWeekStart.getDate() - 7);
      setCurrentWeekStart(newWeekStart);
      setSelectedDate(newWeekStart);
      // Refetch will happen automatically via useEffect in useClasses
    } else {
      const newDate = new Date(selectedDate);
      newDate.setMonth(newDate.getMonth() - 1);
      setSelectedDate(newDate);
    }
  };

  const handleNext = () => {
    if (viewMode === 'day') {
      const newDate = new Date(selectedDate);
      newDate.setDate(newDate.getDate() + 1);
      setSelectedDate(newDate);
    } else if (viewMode === 'week') {
      const newWeekStart = new Date(currentWeekStart);
      newWeekStart.setDate(newWeekStart.getDate() + 7);
      setCurrentWeekStart(newWeekStart);
      setSelectedDate(newWeekStart);
      // Refetch will happen automatically via useEffect in useClasses
    } else {
      const newDate = new Date(selectedDate);
      newDate.setMonth(newDate.getMonth() + 1);
      setSelectedDate(newDate);
    }
  };

  const handleToday = () => {
    const today = new Date();
    setSelectedDate(today);
    setCurrentWeekStart(getWeekStart(today));
  };

  // Filter classes based on view mode
  const getFilteredClasses = () => {
    if (viewMode === 'day') {
      const dayName = getCurrentDayName(selectedDate);
      return classes.filter((cls) => cls.day === dayName);
    } else if (viewMode === 'week') {
      return classes;
    } else {
      // Month view - show all classes
      return classes;
    }
  };

  const filteredClasses = getFilteredClasses();

  // Loading and error states
  if (loading) {
    return (
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Calendar size={28} className="text-[var(--color-clay)] animate-pulse" />
            <h2 className="text-[var(--color-earth-dark)]">Loading Schedule...</h2>
          </div>
          <p className="text-[var(--color-stone)]">Fetching classes from the database</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Calendar size={28} className="text-red-500" />
            <h2 className="text-[var(--color-earth-dark)]">Error Loading Schedule</h2>
          </div>
          <p className="text-red-600 mb-4">{error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-[var(--color-sage)] text-white rounded-lg hover:bg-[var(--color-clay)] transition-colors"
          >
            Retry
          </button>
        </div>
      </section>
    );
  }

  if (timeoutError) {
    return (
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Calendar size={28} className="text-orange-500" />
            <h2 className="text-[var(--color-earth-dark)]">Request Timed Out</h2>
          </div>
          <p className="text-orange-600 mb-4">The request took too long to complete. Please refresh the page.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-[var(--color-sage)] text-white rounded-lg hover:bg-[var(--color-clay)] transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </section>
    );
  }

  // Group classes by day for week/month view
  const groupedClasses = daysOfWeek.reduce((acc, day) => {
    acc[day] = filteredClasses.filter((cls) => cls.day === day);
    return acc;
  }, {} as Record<string, typeof classes>);

  // Calendar grid generation for month view
  const generateCalendarGrid = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    
    // Get first day of month (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    
    // Get number of days in month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Get number of days in previous month
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    
    const calendarCells = [];
    
    // Add empty cells for days from previous month
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      calendarCells.push({
        date: daysInPrevMonth - i,
        isCurrentMonth: false,
        fullDate: new Date(year, month - 1, daysInPrevMonth - i),
      });
    }
    
    // Add cells for current month
    for (let day = 1; day <= daysInMonth; day++) {
      calendarCells.push({
        date: day,
        isCurrentMonth: true,
        fullDate: new Date(year, month, day),
      });
    }
    
    // Add cells for next month to complete the grid
    const remainingCells = 42 - calendarCells.length; // 6 rows * 7 days
    for (let day = 1; day <= remainingCells; day++) {
      calendarCells.push({
        date: day,
        isCurrentMonth: false,
        fullDate: new Date(year, month + 1, day),
      });
    }
    
    return calendarCells;
  };

  // Get classes for a specific date
  const getClassesForDate = (date: Date) => {
    return classes.filter((cls) => {
      if (!cls._dbClass?.starts_at) return false;
      const classDate = new Date(cls._dbClass.starts_at);
      return (
        classDate.getDate() === date.getDate() &&
        classDate.getMonth() === date.getMonth() &&
        classDate.getFullYear() === date.getFullYear()
      );
    });
  };

  // Check if a date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  // Handle day cell click in month view
  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setViewMode('day');
  };

  return (
    <>
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          {/* Header with View Switcher */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-3">
              <Calendar size={28} className="text-[var(--color-clay)]" />
              <h2 className="text-[var(--color-earth-dark)]">Class Schedule</h2>
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center gap-2 bg-[var(--color-cream)] rounded-lg p-1">
              {(['day', 'week', 'month'] as ViewMode[]).map((mode) => {
                // Hide month view on mobile (sm and md screens)
                if (mode === 'month') {
                  return (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      className={`hidden lg:block px-6 py-2 rounded-lg transition-all duration-300 capitalize ${
                        viewMode === mode
                          ? 'bg-[var(--color-sage)] text-white shadow-md'
                          : 'text-[var(--color-stone)] hover:text-[var(--color-earth-dark)]'
                      }`}
                    >
                      {mode}
                    </button>
                  );
                }
                return (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-6 py-2 rounded-lg transition-all duration-300 capitalize ${
                      viewMode === mode
                        ? 'bg-[var(--color-sage)] text-white shadow-md'
                        : 'text-[var(--color-stone)] hover:text-[var(--color-earth-dark)]'
                    }`}
                  >
                    {mode}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={handlePrevious}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-cream)] hover:bg-[var(--color-sand)] transition-colors duration-300"
            >
              <ChevronLeft size={20} />
              <span>Previous</span>
            </button>

            <div className="text-center">
              <div className="inline-block bg-[var(--color-sand)] px-6 py-3 rounded-full">
                <p className="text-[var(--color-earth-dark)]">
                  {viewMode === 'day' && `${getCurrentDayName(selectedDate)}, ${formatToThaiDateLong(selectedDate)}`}
                  {viewMode === 'week' && 'Full Week Schedule'}
                  {viewMode === 'month' && formatToThaiDateLong(selectedDate)}
                </p>
              </div>
            </div>

            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-cream)] hover:bg-[var(--color-sand)] transition-colors duration-300"
            >
              <span>Next</span>
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Day View */}
          {viewMode === 'day' && (
            <div className="bg-[var(--color-cream)] rounded-lg overflow-hidden shadow-lg">
              <div className="divide-y divide-[var(--color-sand)]">
                {filteredClasses.length > 0 ? (
                  filteredClasses.map((classItem) => (
                    <button
                      key={classItem.id}
                      onClick={() => setSelectedClass(classItem._dbClass)}
                      className="w-full grid grid-cols-1 md:grid-cols-5 gap-2 md:gap-4 p-6 hover:bg-white transition-colors duration-200 text-left"
                    >
                      <div className="flex items-center gap-2">
                        <Clock size={18} className="text-[var(--color-clay)]" />
                        <span className="text-[var(--color-earth-dark)]">{classItem.time}</span>
                      </div>
                      <div className="text-[var(--color-earth-dark)] md:col-span-2">
                        {classItem.title}
                      </div>
                      <div className="text-[var(--color-stone)]">{classItem.instructor}</div>
                      <div className="flex items-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-sm ${getLevelColor(getDisplayLevel(classItem.level))}`}>
                          {getDisplayLevel(classItem.level)}
                        </span>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-12 text-center text-[var(--color-stone)]">
                    No classes scheduled for this day
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Week View */}
          {viewMode === 'week' && (() => {
            const weekDates = getWeekDates(currentWeekStart);
            return (
              <div className="space-y-8">
                {weekDates.map((date, index) => {
                  const dayName = getDayName(date);
                  const dateLabel = formatDateLabel(date);
                  const dayClasses = groupedClasses[dayName] || [];
                  const isCurrentDay = isToday(date);
                  
                  return (
                    <div key={index}>
                      <div className="flex items-center gap-3 mb-4">
                        <h3 className={`text-[var(--color-earth-dark)] ${isCurrentDay ? 'text-[var(--color-sage)]' : ''}`}>
                          {dateLabel}
                        </h3>
                        {isCurrentDay && (
                          <span className="px-3 py-1 bg-[var(--color-sage)] text-white text-xs rounded-full">
                            Today
                          </span>
                        )}
                      </div>
                      <div className="bg-[var(--color-cream)] rounded-lg overflow-hidden shadow-lg">
                        <div className="divide-y divide-[var(--color-sand)]">
                          {dayClasses.length > 0 ? (
                            dayClasses.map((classItem) => (
                              <button
                                key={classItem.id}
                                onClick={() => setSelectedClass(classItem._dbClass)}
                                className="w-full grid grid-cols-1 md:grid-cols-5 gap-2 md:gap-4 p-6 hover:bg-white transition-colors duration-200 text-left"
                              >
                                <div className="flex items-center gap-2">
                                  <Clock size={18} className="text-[var(--color-clay)]" />
                                  <span className="text-[var(--color-earth-dark)]">{classItem.time}</span>
                                </div>
                                <div className="text-[var(--color-earth-dark)] md:col-span-2">
                                  {classItem.title}
                                </div>
                                <div className="text-[var(--color-stone)]">{classItem.instructor}</div>
                                <div className="flex items-center">
                                  <span className={`inline-block px-3 py-1 rounded-full text-sm ${getLevelColor(getDisplayLevel(classItem.level))}`}>
                                    {getDisplayLevel(classItem.level)}
                                  </span>
                                </div>
                              </button>
                            ))
                          ) : (
                            <div className="p-8 text-center text-[var(--color-stone)] text-sm">
                              No classes scheduled
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* Month View - Grid Layout */}
          {viewMode === 'month' && (
            <div className="bg-[var(--color-cream)] rounded-lg shadow-lg overflow-hidden">
              {/* Calendar Header - Day Names */}
              <div className="grid grid-cols-7 bg-[var(--color-sage)] text-white">
                {calendarDays.map((day) => (
                  <div key={day} className="p-3 text-center text-sm border-r border-white/20 last:border-r-0">
                    {day.slice(0, 3)}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 bg-white">
                {generateCalendarGrid().map((cell, index) => {
                  const dayClasses = getClassesForDate(cell.fullDate);
                  const isCurrentDay = isToday(cell.fullDate);
                  const maxDisplayClasses = 2;
                  const hasMoreClasses = dayClasses.length > maxDisplayClasses;
                  
                  return (
                    <button
                      key={index}
                      onClick={() => handleDayClick(cell.fullDate)}
                      className={`min-h-[120px] p-2 border border-[var(--color-sand)] hover:bg-[var(--color-cream)] transition-colors duration-200 text-left relative ${
                        !cell.isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'
                      } ${isCurrentDay ? 'ring-2 ring-[var(--color-sage)] ring-inset' : ''}`}
                    >
                      {/* Date Number */}
                      <div className={`mb-2 flex items-center justify-between ${
                        isCurrentDay ? 'bg-[var(--color-sage)] text-white rounded-full w-7 h-7 flex items-center justify-center' : ''
                      }`}>
                        <span className={`text-sm ${
                          !cell.isCurrentMonth ? 'text-gray-400' : 'text-[var(--color-earth-dark)]'
                        } ${isCurrentDay ? 'text-white mx-auto' : ''}`}>
                          {cell.date}
                        </span>
                      </div>

                      {/* Class Indicators */}
                      {cell.isCurrentMonth && dayClasses.length > 0 && (
                        <div className="space-y-1">
                          {dayClasses.slice(0, maxDisplayClasses).map((classItem, idx) => (
                            <div
                              key={idx}
                              className="text-xs p-1 bg-[var(--color-sage)]/20 rounded truncate hover:bg-[var(--color-sage)]/30 transition-colors"
                            >
                              <div className="flex items-center gap-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-sage)] flex-shrink-0"></div>
                                <span className="truncate text-[var(--color-earth-dark)]">
                                  {classItem.time.split(' ')[0]} {classItem.title}
                                </span>
                              </div>
                            </div>
                          ))}
                          
                          {/* +X More Label */}
                          {hasMoreClasses && (
                            <div className="text-xs text-[var(--color-clay)] pl-1">
                              +{dayClasses.length - maxDisplayClasses} more
                            </div>
                          )}
                        </div>
                      )}

                      {/* Empty state for days with no classes */}
                      {cell.isCurrentMonth && dayClasses.length === 0 && (
                        <div className="text-xs text-gray-400 text-center mt-4">
                          No classes
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Timezone Disclaimer & Note */}
          <div className="mt-8 text-center space-y-2">
            <p className="text-xs text-[var(--color-stone)] bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 inline-block">
              ⏰ All class times are shown in <strong>Thailand Time (GMT+7)</strong>
            </p>
            <p className="text-sm text-[var(--color-stone)] italic">
              Click on any class to view details and book your spot. Arrive 15 minutes early!
            </p>
          </div>
        </div>
      </section>

      {/* Class Detail Modal */}
      {selectedClass && (
        <ClassDetailsModal
          classData={{
            id: selectedClass.id.toString(),
            title: selectedClass.title,
            time: formatToThaiTime(selectedClass.starts_at),
            starts_at: selectedClass.starts_at,
            instructor: (selectedClass as any).instructor_name || 'Annie Bliss',
            level: selectedClass.level || 'All Levels',
            capacity: selectedClass.capacity,
            enrolled: selectedClass.booked_count,
            day: formatToThaiDayOfWeek(selectedClass.starts_at),
            duration: selectedClass.ends_at 
              ? `${Math.round((new Date(selectedClass.ends_at).getTime() - new Date(selectedClass.starts_at).getTime()) / 60000)} min`
              : '60 min',
            description: selectedClass.description || 'A wonderful yoga class to enhance your practice.',
            long_description: (selectedClass as any).long_description || null,
            room: selectedClass.location || 'Studio A',
            price: selectedClass.price ?? (selectedClass as any).class_type?.price ?? 0,
            cover_image_url: (selectedClass as any).cover_image_url || null,
            gallery_images: (selectedClass as any).gallery_images || null,
            class_types: (selectedClass as any).class_types || null,
          }}
          onClose={() => setSelectedClass(null)}
          onNavigate={onNavigate}
          onBookingSuccess={() => {
            // Refresh class data after successful booking
            fetchClasses();
          }}
        />
      )}
    </>
  );
}