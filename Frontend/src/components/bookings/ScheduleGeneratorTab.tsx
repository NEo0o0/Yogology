"use client";

import { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar, Zap, Clock, Loader2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useClassTypes, useRooms } from '@/hooks';
import { GenerateScheduleModal } from './GenerateScheduleModal';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { toast } from 'sonner';
import { supabase } from '@/utils/supabase/client';
import { DEFAULT_ROOMS } from '@/constants/rooms';
import { formatToThaiDayOfWeek, formatToThaiDateLong } from '@/utils/dateHelpers';

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function ScheduleGeneratorTab() {
  const { weeklySlots, addWeeklySlot, deleteWeeklySlot, addClass } = useApp();
  const { classTypes, loading: loadingClassTypes } = useClassTypes();
  const { rooms: roomsData, loading: loadingRooms } = useRooms();
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState('');
  const [instructors, setInstructors] = useState<{ id: string; name: string }[]>([]);
  const [loadingInstructors, setLoadingInstructors] = useState(false);
  const [submittingSlot, setSubmittingSlot] = useState(false);
  const [isGuestInstructor, setIsGuestInstructor] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showGenerateConfirm, setShowGenerateConfirm] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [pendingGeneration, setPendingGeneration] = useState<{ startDate: string; endDate: string } | null>(null);
  const [clearingPattern, setClearingPattern] = useState(false);
  const [slotData, setSlotData] = useState({
    classTypeId: '',
    day: '',
    time: '09:00',
    instructorId: '',
    instructorName: '',
    room: '',
    capacity: 12
  });
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  // Fetch instructors from profiles table
  useEffect(() => {
    const fetchInstructors = async () => {
      setLoadingInstructors(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('role', ['instructor', 'admin'])
          .order('full_name', { ascending: true });

        if (error) throw error;

        setInstructors(
          (data || []).map(profile => ({
            id: profile.id,
            name: profile.full_name || 'Unknown'
          }))
        );
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        toast.error(`Failed to load instructors: ${message}`);
      } finally {
        setLoadingInstructors(false);
      }
    };

    fetchInstructors();
  }, []);

  // Compute rooms array from hook data, fallback to DEFAULT_ROOMS if empty
  const rooms = roomsData.length > 0 ? roomsData.map(r => r.name) : [...DEFAULT_ROOMS];

  // Form validation - check if all required fields are filled
  const isFormValid = !!(
    slotData.classTypeId &&
    slotData.day &&
    slotData.time &&
    (isGuestInstructor ? slotData.instructorName.trim() : slotData.instructorId) &&
    slotData.room &&
    slotData.capacity > 0
  );

  const handleAddSlot = () => {
    console.log('=== handleAddSlot called ===');
    console.log('Current slotData:', slotData);
    console.log('Validation checks:', {
      classTypeId: !!slotData.classTypeId,
      day: !!slotData.day,
      time: !!slotData.time,
      instructorId: !!slotData.instructorId,
      room: !!slotData.room,
      capacity: slotData.capacity > 0
    });

    // Validate all required fields
    if (!slotData.classTypeId) {
      console.error('Missing classTypeId');
      toast.error('Please select a class type');
      return;
    }
    if (!slotData.day) {
      console.error('Missing day');
      toast.error('Please select a day');
      return;
    }
    if (!slotData.time) {
      console.error('Missing time');
      toast.error('Please select a time');
      return;
    }
    if (!isGuestInstructor && !slotData.instructorId) {
      console.error('Missing instructorId');
      toast.error('Please select an instructor');
      return;
    }
    if (isGuestInstructor && !slotData.instructorName.trim()) {
      console.error('Missing instructor name');
      toast.error('Please enter instructor name');
      return;
    }
    if (!slotData.room) {
      console.error('Missing room');
      toast.error('Please select a room');
      return;
    }
    if (!slotData.capacity || slotData.capacity <= 0) {
      console.error('Missing or invalid capacity');
      toast.error('Please enter a valid capacity (greater than 0)');
      return;
    }

    try {
      setSubmittingSlot(true);
      console.log('All validations passed, creating slot...');
      
      const instructor = instructors.find(i => i.id === slotData.instructorId);
      console.log('Found instructor:', instructor);
      
      const timeFormatted = formatTime(slotData.time);
      console.log('Formatted time:', timeFormatted);
      
      const newSlot = {
        classTypeId: slotData.classTypeId,
        day: slotData.day,
        time: timeFormatted,
        instructorId: isGuestInstructor ? '' : slotData.instructorId,
        instructorName: isGuestInstructor ? slotData.instructorName.trim() : '',
        room: slotData.room,
        capacity: slotData.capacity
      };
      
      console.log('Adding weekly slot:', newSlot);
      addWeeklySlot(newSlot);
      console.log('Slot added successfully');

      // Reset form
      setSlotData({
        classTypeId: '',
        day: '',
        time: '09:00',
        instructorId: '',
        instructorName: '',
        room: '',
        capacity: 12
      });
      setIsGuestInstructor(false);
      
      toast.success('Weekly slot added successfully!');
      setShowAddSlot(false);
      console.log('Modal closed');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add slot';
      console.error('Error in handleAddSlot:', error);
      toast.error(message);
    } finally {
      setSubmittingSlot(false);
      console.log('=== handleAddSlot completed ===');
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const handleDeleteSlot = (slotId: string, slotName: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Weekly Slot',
      message: `Are you sure you want to delete the ${slotName} slot? This will not affect already generated classes.`,
      onConfirm: () => {
        deleteWeeklySlot(slotId);
        toast.success('Slot removed successfully');
      }
    });
  };

  const handleClearPattern = () => {
    if (weeklySlots.length === 0) {
      toast.error('No slots to clear');
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Clear Weekly Pattern',
      message: `Are you sure you want to remove ALL ${weeklySlots.length} slots from your weekly planner? This cannot be undone.`,
      onConfirm: async () => {
        setClearingPattern(true);
        try {
          // Delete all slots one by one
          for (const slot of weeklySlots) {
            deleteWeeklySlot(slot.id);
          }
          toast.success('Weekly pattern cleared successfully');
        } catch (error) {
          toast.error('Failed to clear pattern');
        } finally {
          setClearingPattern(false);
        }
      }
    });
  };

  const handleGenerateSchedule = () => {
    if (weeklySlots.length === 0) {
      toast.error('Please add at least one weekly slot before generating a schedule');
      return;
    }
    setShowGenerateModal(true);
  };

  const handleGenerateClick = (startDate: string, endDate: string) => {
    setPendingGeneration({ startDate, endDate });
    setShowGenerateModal(false);
    setShowGenerateConfirm(true);
  };

  const handleGenerateConfirm = async () => {
    if (!pendingGeneration) return;
    
    const { startDate, endDate } = pendingGeneration;
    setShowGenerateConfirm(false);
    setIsGenerating(true);
    
    try {
      console.log('=== Schedule Generation Started ===');
      console.log('Generating for:', { startDate, endDate, weeklySlots });
      
      // Check if weeklySlots is empty
      if (!weeklySlots || weeklySlots.length === 0) {
        toast.error('No weekly slots found. Please add at least one weekly slot before generating a schedule.');
        return;
      }

      // Client-side schedule generation logic
      const start = new Date(startDate);
      const end = new Date(endDate);
      const classesToInsert = [];

      // Get current user for created_by field
      const { data: authData } = await supabase.auth.getUser();
      const creatorId = authData?.user?.id ?? null;

      console.log('Date range:', { start, end });
      console.log('Creator ID:', creatorId);

      // Iterate through all days in the date range
      const currentDate = new Date(start);
      while (currentDate <= end) {
        const dayName = formatToThaiDayOfWeek(currentDate);

        // Find all slots for this day
        const slotsForDay = weeklySlots.filter(slot => slot.day === dayName);
        
        if (slotsForDay.length > 0) {
          console.log(`${currentDate.toISOString().split('T')[0]} (${dayName}): Found ${slotsForDay.length} slots`);
        }

        for (const slot of slotsForDay) {
          const classType = classTypes.find(ct => ct.id.toString() === slot.classTypeId);
          
          console.log(`  Slot: ${slot.time} - ClassTypeId: ${slot.classTypeId}, Found: ${!!classType}`);
          
          if (classType) {
            // Parse time - handle both 24-hour format (HH:mm) and 12-hour format (h:mm AM/PM)
            let hours = 0;
            let minutes = 0;
            
            try {
              const timeStr = slot.time.trim();
              
              // Check if time contains AM/PM
              if (timeStr.includes('AM') || timeStr.includes('PM') || timeStr.includes('am') || timeStr.includes('pm')) {
                // 12-hour format
                const isPM = timeStr.toUpperCase().includes('PM');
                const timeOnly = timeStr.replace(/\s*(AM|PM|am|pm)\s*/g, '').trim();
                const [h, m] = timeOnly.split(':').map(Number);
                
                hours = h;
                minutes = m || 0;
                
                // Convert to 24-hour format
                if (isPM && hours !== 12) {
                  hours += 12;
                } else if (!isPM && hours === 12) {
                  hours = 0;
                }
              } else {
                // 24-hour format
                const [h, m] = timeStr.split(':').map(Number);
                hours = h;
                minutes = m || 0;
              }
              
              // Create date object
              const startsAt = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), hours, minutes);
              
              // Validate the date
              if (isNaN(startsAt.getTime())) {
                console.error(`Invalid Date created from slot time: "${slot.time}" -> hours: ${hours}, minutes: ${minutes}`);
                continue; // Skip this slot
              }
              
              const durationMinutes = classType.duration_minutes ?? 60;
              const endsAt = new Date(startsAt.getTime() + durationMinutes * 60000);

              classesToInsert.push({
                title: classType.title,
                description: classType.description,
                level: classType.level ?? 'All Levels',
                capacity: slot.capacity ?? 12,
                class_type_id: classType.id,
                price: classType.default_price ?? null,
                starts_at: startsAt.toISOString(),
                ends_at: endsAt.toISOString(),
                category: 'class',
                location: slot.room,
                instructor_id: slot.instructorId || null,
                instructor_name: slot.instructorName || null,
                created_by: creatorId
              });
            } catch (e) {
              console.error(`Error processing slot: ${e instanceof Error ? e.message : String(e)}`);
            }
          }
        }
        
        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }

      console.log('Total classes to insert:', classesToInsert.length);

      if (classesToInsert.length === 0) {
        console.error('No classes generated. Check day name matching and class type IDs.');
        toast.error('No classes to generate. Please check your weekly slots and ensure class types are properly configured.');
        return;
      }

      // Insert all classes
      console.log('Inserting classes into database...');
      const { error } = await supabase.from('classes').insert(classesToInsert);

      if (error) {
        console.error('Database insert error:', error);
        throw error;
      }

      console.log(`✅ Schedule generated successfully: ${classesToInsert.length} classes created`);
      
      setShowSuccessModal(true);
      setPendingGeneration(null);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      console.error('Schedule generation error:', e);
      toast.error(`Failed to generate schedule: ${message}`);
      setPendingGeneration(null);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateSchedule = (year: number, month: number) => {
    const daysInMonth = new Date(year, month, 0).getDate();
    let classesCreated = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const dayName = getDayName(date);

      // Find all slots for this day
      const slotsForDay = weeklySlots.filter(slot => slot.day === dayName);

      slotsForDay.forEach(slot => {
        const classType = classTypes.find(ct => String(ct.id) === slot.classTypeId);
        const instructor = instructors.find(i => i.id === slot.instructorId);

        if (classType && instructor) {
          addClass({
            title: classType.title,
            time: slot.time,
            instructor: instructor.name,
            level: classType.level || 'All Levels',
            capacity: slot.capacity ?? 12,
            enrolled: 0,
            day: dayName,
            duration: `${classType.duration_minutes || 60} min`,
            description: classType.description || '',
            room: slot.room,
            category: 'class'
          });
          classesCreated++;
        }
      });
    }

    toast.success(`Successfully generated ${classesCreated} class sessions!`);
  };

  const getDayName = (date: Date) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  };

  const getMonthName = (month: number) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month - 1];
  };

  // Convert time string to minutes from midnight for proper sorting
  const timeToMinutes = (timeStr: string): number => {
    const trimmed = timeStr.trim();
    let hours = 0;
    let minutes = 0;
    
    // Check if time contains AM/PM (12-hour format)
    if (trimmed.includes('AM') || trimmed.includes('PM') || trimmed.includes('am') || trimmed.includes('pm')) {
      const isPM = trimmed.toUpperCase().includes('PM');
      const timeOnly = trimmed.replace(/\s*(AM|PM|am|pm)\s*/g, '').trim();
      const [h, m] = timeOnly.split(':').map(Number);
      
      hours = h;
      minutes = m || 0;
      
      // Convert to 24-hour format
      if (isPM && hours !== 12) {
        hours += 12;
      } else if (!isPM && hours === 12) {
        hours = 0;
      }
    } else {
      // 24-hour format
      const [h, m] = trimmed.split(':').map(Number);
      hours = h;
      minutes = m || 0;
    }
    
    return hours * 60 + minutes;
  };

  const getSlotsByDay = (day: string) => {
    return weeklySlots.filter(slot => slot.day === day).sort((a, b) => {
      return timeToMinutes(a.time) - timeToMinutes(b.time);
    });
  };

  const getClassTypeName = (classTypeId: string) => {
    return classTypes.find(ct => String(ct.id) === classTypeId)?.title || 'Unknown';
  };

  const getClassTypeColor = (classTypeId: string) => {
    return classTypes.find(ct => String(ct.id) === classTypeId)?.color_code || '#8CA899';
  };

  const getClassTypeLevel = (classTypeId: string) => {
    return classTypes.find(ct => String(ct.id) === classTypeId)?.level || 'Multilevel';
  };

  const getLevelBadgeColor = (level: string) => {
    switch (level) {
      case 'Basic Level':
        return 'bg-green-100 text-green-700';
      case 'Intermediate Level':
        return 'bg-blue-100 text-blue-700';
      case 'Advanced Level':
        return 'bg-purple-100 text-purple-700';
      case 'Multilevel':
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getInstructorName = (instructorId: string) => {
    return instructors.find(i => i.id === instructorId)?.name || 'Unknown';
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl text-[var(--color-earth-dark)] mb-1">Weekly Schedule Planner</h2>
          <p className="text-sm text-[var(--color-stone)]">Build your weekly pattern and generate monthly schedules</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleClearPattern}
            disabled={weeklySlots.length === 0 || clearingPattern}
            className="border-2 border-red-500 text-red-600 hover:bg-red-50 px-6 py-3 rounded-lg flex items-center gap-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {clearingPattern ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>Clearing...</span>
              </>
            ) : (
              <>
                <Trash2 size={20} />
                <span>Clear Pattern</span>
              </>
            )}
          </button>
          <button
            onClick={() => setShowAddSlot(true)}
            className="bg-[var(--color-sage)] hover:bg-[var(--color-clay)] text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-all duration-300 shadow-md hover:shadow-lg"
          >
            <Plus size={20} />
            <span>Add Slot</span>
          </button>
          <button
            onClick={handleGenerateSchedule}
            disabled={weeklySlots.length === 0 || isGenerating}
            className="bg-[var(--color-clay)] hover:bg-[var(--color-earth-dark)] text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Zap size={20} />
            <span>Generate Schedule</span>
          </button>
        </div>
      </div>

      {classTypes.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="w-24 h-24 rounded-full bg-[var(--color-cream)] mx-auto mb-4 flex items-center justify-center">
            <Calendar size={40} className="text-[var(--color-sage)]" />
          </div>
          <h3 className="text-xl text-[var(--color-earth-dark)] mb-2">No Class Types Available</h3>
          <p className="text-[var(--color-stone)]">
            Please create class types first in the "Class Types (Templates)" tab before building your weekly schedule.
          </p>
        </div>
      ) : (
        <>
          {/* Weekly Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
            {daysOfWeek.map(day => {
              const slots = getSlotsByDay(day);
              return (
                <div key={day} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="bg-[var(--color-sage)] text-white p-3 text-center">
                    <h3 className="text-sm uppercase tracking-wide">{day.slice(0, 3)}</h3>
                  </div>
                  <div className="p-3 min-h-[200px]">
                    {slots.length === 0 ? (
                      <div className="text-center text-[var(--color-stone)] text-xs py-8">
                        No slots
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {slots.map(slot => (
                          <div
                            key={slot.id}
                            className="p-2 rounded-lg text-xs relative group hover:shadow-md transition-shadow duration-300"
                            style={{ backgroundColor: `${getClassTypeColor(slot.classTypeId)}20` }}
                          >
                            <button
                              onClick={() => handleDeleteSlot(slot.id, getClassTypeName(slot.classTypeId))}
                              className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-70 hover:opacity-100 transition-all duration-200 flex items-center justify-center shadow-md z-10"
                              title="Delete slot"
                            >
                              <Trash2 size={14} />
                            </button>
                            <div className="flex items-center gap-1 mb-1">
                              <Clock size={10} />
                              <span className="text-[var(--color-earth-dark)]">{slot.time}</span>
                            </div>
                            <div
                              className="mb-1 truncate text-[var(--color-earth-dark)] font-medium"
                              title={getClassTypeName(slot.classTypeId)}
                            >
                              {getClassTypeName(slot.classTypeId)}
                            </div>
                            <div className="mb-1">
                              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${getLevelBadgeColor(getClassTypeLevel(slot.classTypeId))}`}>
                                {getClassTypeLevel(slot.classTypeId)}
                              </span>
                            </div>
                            <div className="text-[var(--color-stone)] text-xs truncate">
                              {getInstructorName(slot.instructorId)}
                            </div>
                            <div className="text-[var(--color-stone)] text-xs">
                              {slot.room}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Info Box */}
          <div className="mt-6 bg-gradient-to-r from-[var(--color-sage)]/10 to-[var(--color-clay)]/10 p-6 rounded-lg">
            <h4 className="text-lg text-[var(--color-earth-dark)] mb-2">How it works:</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-[var(--color-stone)]">
              <li>Add weekly slots by clicking "Add Slot" and selecting a class type, day, time, and instructor</li>
              <li>Build your ideal weekly schedule pattern by adding all recurring classes</li>
              <li>Click "Generate Schedule" and enter a target month/year</li>
              <li>The system will create individual class instances for every day of that month based on your weekly pattern</li>
              <li>Generated classes will appear in your main classes list and on the public schedule page</li>
            </ol>
          </div>
        </>
      )}

      {/* Add Slot Modal */}
      {showAddSlot && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddSlot(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-[var(--color-sand)]">
              <h2 className="text-2xl text-[var(--color-earth-dark)]">Add Weekly Slot</h2>
              <button
                onClick={() => setShowAddSlot(false)}
                className="p-2 hover:bg-[var(--color-cream)] rounded-full transition-colors duration-300"
              >
                <Plus size={24} className="rotate-45" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Class Type */}
              <div>
                <label className="block text-sm text-[var(--color-stone)] mb-2">
                  Class Type *
                </label>
                <select
                  value={slotData.classTypeId}
                  onChange={(e) => setSlotData({ ...slotData, classTypeId: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-[var(--color-sand)] focus:ring-2 focus:ring-[var(--color-sage)] focus:border-transparent transition-all duration-300"
                >
                  <option value="">Select a class type...</option>
                  {classTypes.map(ct => (
                    <option key={ct.id} value={ct.id}>{ct.title}</option>
                  ))}
                </select>
              </div>

              {/* Day */}
              <div>
                <label className="block text-sm text-[var(--color-stone)] mb-2">
                  Day of Week *
                </label>
                <select
                  value={slotData.day}
                  onChange={(e) => setSlotData({ ...slotData, day: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-[var(--color-sand)] focus:ring-2 focus:ring-[var(--color-sage)] focus:border-transparent transition-all duration-300"
                >
                  <option value="">Select a day...</option>
                  {daysOfWeek.map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>

              {/* Time */}
              <div>
                <label className="block text-sm text-[var(--color-stone)] mb-2">
                  Time *
                </label>
                <input
                  type="time"
                  value={slotData.time}
                  onChange={(e) => setSlotData({ ...slotData, time: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-[var(--color-sand)] focus:ring-2 focus:ring-[var(--color-sage)] focus:border-transparent transition-all duration-300"
                />
              </div>

              {/* Instructor */}
              <div>
                <label className="block text-sm text-[var(--color-stone)] mb-2">
                  Instructor *
                </label>
                
                {/* Guest/Registered Toggle */}
                <div className="flex gap-2 p-1 bg-[var(--color-cream)] rounded-lg mb-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsGuestInstructor(false);
                      setSlotData({ ...slotData, instructorName: '' });
                    }}
                    className={`flex-1 px-3 py-2 rounded-md text-sm transition-all duration-200 ${
                      !isGuestInstructor
                        ? 'bg-white text-[var(--color-earth-dark)] shadow-sm'
                        : 'text-[var(--color-stone)] hover:text-[var(--color-earth-dark)]'
                    }`}
                  >
                    Registered
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsGuestInstructor(true);
                      setSlotData({ ...slotData, instructorId: '' });
                    }}
                    className={`flex-1 px-3 py-2 rounded-md text-sm transition-all duration-200 ${
                      isGuestInstructor
                        ? 'bg-white text-[var(--color-earth-dark)] shadow-sm'
                        : 'text-[var(--color-stone)] hover:text-[var(--color-earth-dark)]'
                    }`}
                  >
                    Guest / External
                  </button>
                </div>

                {isGuestInstructor ? (
                  <input
                    type="text"
                    value={slotData.instructorName}
                    onChange={(e) => setSlotData({ ...slotData, instructorName: e.target.value })}
                    placeholder="Enter instructor name (e.g., Master Kim)"
                    className="w-full px-4 py-3 rounded-lg border border-[var(--color-sand)] focus:ring-2 focus:ring-[var(--color-sage)] focus:border-transparent transition-all duration-300"
                  />
                ) : (
                  <select
                    value={slotData.instructorId}
                    onChange={(e) => setSlotData({ ...slotData, instructorId: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-[var(--color-sand)] focus:ring-2 focus:ring-[var(--color-sage)] focus:border-transparent transition-all duration-300"
                  >
                    <option value="">Select an instructor...</option>
                    {instructors.map(instructor => (
                      <option key={instructor.id} value={instructor.id}>{instructor.name}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Room */}
              <div>
                <label className="block text-sm text-[var(--color-stone)] mb-2">
                  Room *
                </label>
                <select
                  value={slotData.room}
                  onChange={(e) => setSlotData({ ...slotData, room: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-[var(--color-sand)] focus:ring-2 focus:ring-[var(--color-sage)] focus:border-transparent transition-all duration-300"
                >
                  <option value="">-- Select Room --</option>
                  {rooms.map(room => (
                    <option key={room} value={room}>{room}</option>
                  ))}
                </select>
              </div>

              {/* Capacity */}
              <div>
                <label className="block text-sm text-[var(--color-stone)] mb-2">
                  Capacity *
                </label>
                <input
                  type="number"
                  value={slotData.capacity}
                  onChange={(e) => setSlotData({ ...slotData, capacity: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 rounded-lg border border-[var(--color-sand)] focus:ring-2 focus:ring-[var(--color-sage)] focus:border-transparent transition-all duration-300"
                  min="1"
                  placeholder="e.g., 20"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--color-sand)]">
                <button
                  onClick={() => setShowAddSlot(false)}
                  className="px-6 py-3 rounded-lg text-[var(--color-stone)] hover:bg-[var(--color-cream)] transition-colors duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddSlot}
                  disabled={!isFormValid || submittingSlot}
                  className="bg-[var(--color-sage)] hover:bg-[var(--color-clay)] text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[var(--color-sage)]"
                >
                  {submittingSlot ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      <span>Adding...</span>
                    </>
                  ) : (
                    <>
                      <Plus size={20} />
                      <span>Add Slot</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generate Schedule Modal */}
      <GenerateScheduleModal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        onGenerate={handleGenerateClick}
      />

      {/* Generate Confirmation Modal */}
      {showGenerateConfirm && pendingGeneration && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn" onClick={() => setShowGenerateConfirm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-scaleIn" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <h2 className="text-2xl font-bold text-[var(--color-earth-dark)] mb-4">
                Confirm Schedule Generation
              </h2>
              <p className="text-[var(--color-stone)] mb-6">
                Are you sure you want to generate the schedule from <strong>{formatToThaiDateLong(pendingGeneration.startDate)}</strong> to <strong>{formatToThaiDateLong(pendingGeneration.endDate)}</strong>? This will create classes based on your weekly pattern.
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => {
                    setShowGenerateConfirm(false);
                    setPendingGeneration(null);
                  }}
                  className="px-6 py-3 rounded-lg text-[var(--color-stone)] hover:bg-[var(--color-cream)] transition-colors duration-300"
                  disabled={isGenerating}
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerateConfirm}
                  disabled={isGenerating}
                  className="bg-[var(--color-sage)] hover:bg-[var(--color-clay)] text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Zap size={20} />
                      <span>Confirm Generate</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn" onClick={() => setShowSuccessModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-scaleIn" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-[var(--color-earth-dark)] mb-4">
                Success!
              </h2>
              <p className="text-[var(--color-stone)] mb-6">
                Schedule has been generated successfully.
              </p>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="bg-[var(--color-sage)] hover:bg-[var(--color-clay)] text-white px-8 py-3 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        variant="warning"
        confirmText="Delete"
      />
    </div>
  );
}
