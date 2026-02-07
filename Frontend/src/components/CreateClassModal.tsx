"use client";

import { X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { ImageUpload } from './ImageUpload';
import { MultiImageUpload } from './MultiImageUpload';
import type { Tables, TablesInsert } from '@/types/database.types';

interface CreateClassModalProps {
  onClose: () => void;
  onCreated?: () => void;
}

type ClassTypeRow = Tables<'class_types'>;

function formatDuration(minutes: number | null) {
  const safe = typeof minutes === 'number' && Number.isFinite(minutes) ? minutes : 60;
  return `${safe} min`;
}

function parseDurationToMinutes(value: string) {
  const match = value.match(/(\d+)/);
  const parsed = match ? Number(match[1]) : NaN;
  return Number.isFinite(parsed) ? parsed : 60;
}

export function CreateClassModal({ onClose, onCreated }: CreateClassModalProps) {
  const [classTypes, setClassTypes] = useState<ClassTypeRow[]>([]);
  const [classTypesLoading, setClassTypesLoading] = useState(false);
  const [classTypesError, setClassTypesError] = useState<string | null>(null);

  const [instructors, setInstructors] = useState<Array<{ id: string; full_name: string | null }>>([]);
  const [instructorsLoading, setInstructorsLoading] = useState(false);
  const [instructorsError, setInstructorsError] = useState<Error | null>(null);

  const [rooms, setRooms] = useState<Array<{ id: number; name: string }>>([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [roomsError, setRoomsError] = useState<string | null>(null);

  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    category: 'Class' as 'Class' | 'Workshop' | 'Teacher Training' | 'Retreat' | 'Special Event',
    classTypeId: '' as '' | string,
    title: '',
    date: '',
    end_date: '',
    time: '',
    instructorId: '' as '' | string,
    instructorName: '',
    isGuestInstructor: false,
    level: 'Multilevel',
    capacity: 12,
    duration: '75',
    description: '',
    long_description: '',
    cover_image_url: '',
    gallery_images: [] as string[],
    room: '',
    price: '',
    early_bird_price: '',
    early_bird_deadline: '',
    registration_opens_at: '',
    deposit_price: ''
  });

  const selectedClassType = useMemo(() => {
    const id = Number(formData.classTypeId);
    if (!Number.isFinite(id)) return null;
    return classTypes.find((t) => t.id === id) ?? null;
  }, [classTypes, formData.classTypeId]);

  // Set default capacity to 8 when Teacher Training is selected
  useEffect(() => {
    if (formData.category === 'Teacher Training') {
      setFormData(prev => ({ ...prev, capacity: 8 }));
    }
  }, [formData.category]);

  useEffect(() => {
    const loadTypes = async () => {
      setClassTypesLoading(true);
      setClassTypesError(null);
      try {
        const { data, error } = await supabase
          .from('class_types')
          .select('id, title, description, duration_minutes, default_price')
          .order('title', { ascending: true });
        if (error) throw error;
        setClassTypes((data ?? []) as ClassTypeRow[]);
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        setClassTypesError(message);
      } finally {
        setClassTypesLoading(false);
      }
    };

    void loadTypes();
  }, []);

  useEffect(() => {
    if (!selectedClassType) return;

    setFormData((prev) => ({
      ...prev,
      title: selectedClassType.title ?? prev.title,
      duration: String(selectedClassType.duration_minutes ?? 75),
      description: selectedClassType.description ?? prev.description,
      // Auto-fill price from class_type's default_price
      price: selectedClassType.default_price ? String(selectedClassType.default_price) : prev.price,
    }));
  }, [selectedClassType]);

  useEffect(() => {
    const loadInstructors = async () => {
      setInstructorsLoading(true);
      setInstructorsError(null);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('role', ['admin', 'instructor'])
          .order('full_name', { ascending: true });

        if (error) throw error;
        setInstructors((data ?? []) as Array<{ id: string; full_name: string | null }>);
      } catch (e) {
        const err: any = e;
        const asError = err instanceof Error ? err : new Error(err?.message ?? String(err));
        setInstructorsError(asError);
        console.error('Failed to load instructors:', {
          message: err?.message,
          details: err?.details,
          hint: err?.hint,
          code: err?.code,
          raw: e,
        });
        setInstructors([]);
      } finally {
        setInstructorsLoading(false);
      }
    };

    void loadInstructors();
  }, []);

  useEffect(() => {
    const loadRooms = async () => {
      setRoomsLoading(true);
      setRoomsError(null);
      try {
        const { data, error } = await supabase
          .from('rooms' as any)
          .select('id, name')
          .order('name', { ascending: true });

        if (error) throw error;
        setRooms((data ?? []) as any);

        setFormData((prev) => {
          if (prev.room) return prev;
          const first = (data ?? [])[0] as any;
          return first?.name ? { ...prev, room: String(first.name) } : prev;
        });
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        setRoomsError(message);
        setRooms([]);
      } finally {
        setRoomsLoading(false);
      }
    };

    void loadRooms();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // Class type is required only for 'Class' category
    const classTypeId = formData.classTypeId ? Number(formData.classTypeId) : null;
    if (formData.category === 'Class' && !Number.isFinite(classTypeId)) {
      setSubmitError('Please select a class type for regular classes');
      return;
    }
    // For Teacher Training, time is auto-set, so only validate date
    if (!formData.date) {
      setSubmitError('Please select a date');
      return;
    }
    // For other categories, validate both date and time
    if (formData.category !== 'Teacher Training' && !formData.time) {
      setSubmitError('Please select a time');
      return;
    }
    // Validate end_date for Retreat and Teacher Training
    if ((formData.category === 'Retreat' || formData.category === 'Teacher Training') && !formData.end_date) {
      setSubmitError('End date is required for retreats and teacher training');
      return;
    }
    // Validate instructor: either ID (registered) or Name (guest)
    if (!formData.isGuestInstructor && !formData.instructorId) {
      setSubmitError('Please select an instructor');
      return;
    }
    if (formData.isGuestInstructor && !formData.instructorName.trim()) {
      setSubmitError('Please enter the guest instructor name');
      return;
    }

    // For Teacher Training, use default time 08:00; otherwise use selected time
    const timeToUse = formData.category === 'Teacher Training' ? '08:00' : formData.time;
    const startsLocal = new Date(`${formData.date}T${timeToUse}`);
    if (Number.isNaN(startsLocal.getTime())) {
      setSubmitError('Invalid date/time');
      return;
    }

    // For Teacher Training, use 9-hour duration (08:00-17:00); otherwise use class type duration
    const durationMinutes = formData.category === 'Teacher Training' 
      ? 540 // 9 hours (08:00 to 17:00)
      : (selectedClassType?.duration_minutes ?? (parseInt(formData.duration) || 75));
    
    // Calculate ends_at based on whether end_date is provided
    let endsLocal: Date;
    if (formData.end_date) {
      // Multi-day event: end_date + time + duration
      const endTimeToUse = formData.category === 'Teacher Training' ? '08:00' : formData.time;
      const endDateTime = new Date(`${formData.end_date}T${endTimeToUse}`);
      if (Number.isNaN(endDateTime.getTime())) {
        setSubmitError('Invalid end date');
        return;
      }
      endsLocal = new Date(endDateTime.getTime() + durationMinutes * 60_000);
    } else {
      // Single day event: start_date + time + duration
      endsLocal = new Date(startsLocal.getTime() + durationMinutes * 60_000);
    }

    setSubmitLoading(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const creatorId = authData?.user?.id ?? null;

      // Convert registration_opens_at from local datetime-local string to UTC ISO string
      const registrationOpensAtUTC = formData.registration_opens_at 
        ? new Date(formData.registration_opens_at).toISOString()
        : null;

      const insertPayload: TablesInsert<'classes'> & { instructor_name?: string | null } = {
        title: formData.title,
        description: formData.description,
        long_description: formData.long_description || null,
        cover_image_url: formData.cover_image_url || null,
        level: formData.level,
        capacity: Number(formData.capacity),
        class_type_id: classTypeId,
        starts_at: startsLocal.toISOString(),
        ends_at: endsLocal.toISOString(),
        category: formData.category as any,
        location: formData.room,
        instructor_id: formData.isGuestInstructor ? null : (formData.instructorId || null),
        instructor_name: formData.isGuestInstructor ? formData.instructorName.trim() : null,
        created_by: creatorId,
        price: formData.price ? Number(formData.price) : null,
        early_bird_price: formData.early_bird_price ? Number(formData.early_bird_price) : null,
        early_bird_deadline: formData.early_bird_deadline || null,
        registration_opens_at: registrationOpensAtUTC,
        deposit_price: formData.deposit_price ? Number(formData.deposit_price) : null,
      };

      const { error } = await supabase.from('classes').insert(insertPayload);
      if (error) throw error;

      toast.success('Class/Event created successfully!');
      onClose();
      onCreated?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setSubmitError(message || 'Failed to create class');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    // Handle category change - clear fields that don't apply to new category
    if (name === 'category') {
      setFormData(prev => {
        const newData = { ...prev, category: value as typeof prev.category };
        
        // Clear fields based on category
        if (value === 'Class') {
          // Regular classes don't need early bird or end date fields
          newData.early_bird_price = '';
          newData.early_bird_deadline = '';
          newData.registration_opens_at = '';
          newData.end_date = '';
        } else if (value === 'Workshop') {
          // Workshops need price but not early bird
          newData.early_bird_price = '';
          newData.early_bird_deadline = '';
          newData.registration_opens_at = '';
        }
        // Retreats and Teacher Training keep all fields
        
        return newData;
      });
    } else if (name === 'isGuestInstructor') {
      // When toggling guest instructor, clear the opposite field
      setFormData(prev => ({
        ...prev,
        isGuestInstructor: checked,
        instructorId: checked ? '' : prev.instructorId,
        instructorName: checked ? prev.instructorName : ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : (name === 'capacity' ? parseInt(value) : value)
      }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-br from-[var(--color-sage)] to-[var(--color-clay)] text-white p-8 rounded-t-2xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors duration-300"
          >
            <X size={24} />
          </button>
          
          <h2 className="text-white">Create New Class</h2>
          <p className="text-white/90 mt-2">Add a new class to the schedule</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Category */}
          <div>
            <label className="block text-sm text-[var(--color-stone)] mb-2">
              Category *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-[var(--color-sand)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-sage)] transition-all duration-300"
            >
              <option value="Class">Class</option>
              <option value="Workshop">Workshop</option>
              <option value="Teacher Training">Teacher Training</option>
              <option value="Retreat">Retreat</option>
              <option value="Special Event">Special Event</option>
            </select>
          </div>

          {/* Class Type - Show only for Class category */}
          {formData.category === 'Class' && (
            <div>
              <label className="block text-sm text-[var(--color-stone)] mb-2">
                Class Type *
              </label>
              <select
                name="classTypeId"
                value={formData.classTypeId}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-[var(--color-sand)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-sage)] transition-all duration-300"
              >
                <option value="">{classTypesLoading ? 'Loading…' : 'Select a class type'}</option>
                {classTypes.map((t) => (
                  <option key={t.id} value={String(t.id)}>
                    {t.title}
                  </option>
                ))}
              </select>
              {classTypesError ? (
                <div className="mt-2 text-sm text-red-700">{classTypesError}</div>
              ) : null}
            </div>
          )}

          {/* Class Title */}
          <div>
            <label className="block text-sm text-[var(--color-stone)] mb-2">
              Class Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="e.g., Morning Flow"
              className="w-full px-4 py-3 border border-[var(--color-sand)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-sage)] transition-all duration-300"
            />
          </div>

          {/* Date Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[var(--color-stone)] mb-2">
                Start Date *
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-[var(--color-sand)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-sage)] transition-all duration-300"
              />
            </div>

            {/* End Date - Show for Workshop, Retreat, Teacher Training, Special Event */}
            {formData.category !== 'Class' && (
              <div>
                <label className="block text-sm text-[var(--color-stone)] mb-2">
                  End Date {(formData.category === 'Retreat' || formData.category === 'Teacher Training') ? '*' : '(Optional)'}
                </label>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleChange}
                  required={formData.category === 'Retreat' || formData.category === 'Teacher Training'}
                  min={formData.date}
                  className="w-full px-4 py-3 border border-[var(--color-sand)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-sage)] transition-all duration-300"
                />
                <p className="mt-1 text-xs text-[var(--color-stone)]">
                  Leave empty for single-day events
                </p>
              </div>
            )}
          </div>

          {/* Time - Hide for Teacher Training (uses default 08:00-17:00) */}
          {formData.category !== 'Teacher Training' && (
            <div>
              <label className="block text-sm text-[var(--color-stone)] mb-2">
                Time *
              </label>
              <input
                type="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-[var(--color-sand)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-sage)] transition-all duration-300"
              />
            </div>
          )}
          
          {/* Teacher Training: Date-only selection info */}
          {formData.category === 'Teacher Training' && (
            <div className="p-4 bg-[var(--color-sage)]/10 rounded-lg border border-[var(--color-sage)]/30">
              <p className="text-sm text-[var(--color-earth-dark)]">
                <span className="font-semibold">📅 Date-only selection:</span> Training sessions will automatically be set to 8:00 AM - 5:00 PM daily.
              </p>
            </div>
          )}

          {/* Guest Instructor Toggle */}
          <div className="flex items-center gap-3 p-4 bg-[var(--color-cream)] rounded-lg">
            <input
              type="checkbox"
              id="isGuestInstructor"
              name="isGuestInstructor"
              checked={formData.isGuestInstructor}
              onChange={handleChange}
              className="w-5 h-5 text-[var(--color-sage)] border-[var(--color-sand)] rounded focus:ring-2 focus:ring-[var(--color-sage)]"
            />
            <label htmlFor="isGuestInstructor" className="text-sm text-[var(--color-earth-dark)] cursor-pointer">
              Guest / External Instructor (doesn't have an account)
            </label>
          </div>

          {/* Instructor and Level Row */}
          <div className={`grid grid-cols-1 ${formData.category === 'Teacher Training' ? 'md:grid-cols-1' : 'md:grid-cols-2'} gap-4`}>
            <div>
              <label className="block text-sm text-[var(--color-stone)] mb-2">
                Instructor *
              </label>
              
              {formData.isGuestInstructor ? (
                <input
                  type="text"
                  name="instructorName"
                  value={formData.instructorName}
                  onChange={handleChange}
                  required
                  placeholder="Enter instructor name"
                  className="w-full px-4 py-3 border border-[var(--color-sand)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-sage)] transition-all duration-300"
                />
              ) : (
                <select
                  name="instructorId"
                  value={formData.instructorId}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-[var(--color-sand)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-sage)] transition-all duration-300"
                >
                  <option value="">{instructorsLoading ? 'Loading…' : 'Select an instructor'}</option>
                  {instructors.map((p) => {
                    const label = p.full_name ?? p.id;
                    return (
                      <option key={p.id} value={p.id}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              )}
              
              {instructorsError && !formData.isGuestInstructor ? (
                <div className="mt-2 text-sm text-red-700">{instructorsError.message}</div>
              ) : null}
              
              {formData.isGuestInstructor && (
                <p className="mt-1 text-xs text-[var(--color-stone)]">
                  For instructors who don't have a user account
                </p>
              )}
            </div>

            {/* Hide Level for Teacher Training */}
            {formData.category !== 'Teacher Training' && (
              <div>
                <label className="block text-sm text-[var(--color-stone)] mb-2">
                  Level *
                </label>
                <select
                  name="level"
                  value={formData.level}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-[var(--color-sand)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-sage)] transition-all duration-300"
                >
                  <option value="Multilevel">Multilevel</option>
                  <option value="Basic Level">Basic Level</option>
                  <option value="Intermediate Level">Intermediate Level</option>
                  <option value="Advanced Level">Advanced Level</option>
                </select>
              </div>
            )}
          </div>

          {/* Duration, Room, and Capacity Row */}
          <div className={`grid grid-cols-1 ${formData.category === 'Teacher Training' ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-4`}>
            {/* Hide Duration for Teacher Training */}
            {formData.category !== 'Teacher Training' && (
              <div>
                <label className="block text-sm text-[var(--color-stone)] mb-2">
                  Duration (minutes) *
                </label>
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  required
                  min="1"
                  placeholder="75"
                  className="w-full px-4 py-3 border border-[var(--color-sand)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-sage)] transition-all duration-300"
                />
              </div>
            )}

            <div>
              <label className="block text-sm text-[var(--color-stone)] mb-2">
                Room *
              </label>
              <select
                name="room"
                value={formData.room}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-[var(--color-sand)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-sage)] transition-all duration-300"
              >
                <option value="">{roomsLoading ? 'Loading…' : 'Select a room'}</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.name}>
                    {r.name}
                  </option>
                ))}
              </select>
              {roomsError ? (
                <div className="mt-2 text-sm text-red-700">{roomsError}</div>
              ) : null}
            </div>

            <div>
              <label className="block text-sm text-[var(--color-stone)] mb-2">
                Capacity *
              </label>
              <input
                type="number"
                name="capacity"
                value={formData.capacity}
                onChange={handleChange}
                required
                min="1"
                max="50"
                className="w-full px-4 py-3 border border-[var(--color-sand)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-sage)] transition-all duration-300"
              />
            </div>
          </div>

          {/* Price - Show for ALL categories */}
          {formData.category === 'Class' ? (
            <div>
              <label className="block text-sm text-[var(--color-stone)] mb-2">
                Price (฿) *
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                placeholder="Auto-filled from class type"
                className="w-full px-4 py-3 border border-[var(--color-sand)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-sage)] transition-all duration-300"
              />
              <p className="mt-1 text-xs text-[var(--color-stone)]">
                Price is auto-filled from the selected class type. You can override it if needed.
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-sm text-[var(--color-stone)] mb-2">
                Price (฿) *
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                placeholder="e.g., 1500"
                className="w-full px-4 py-3 border border-[var(--color-sand)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-sage)] transition-all duration-300"
              />
            </div>
          )}

          {/* Early Bird Fields - Show for all non-Class categories */}
          {formData.category !== 'Class' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[var(--color-stone)] mb-2">
                    Early Bird Price (฿)
                  </label>
                  <input
                    type="number"
                    name="early_bird_price"
                    value={formData.early_bird_price}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    placeholder="e.g., 1200"
                    className="w-full px-4 py-3 border border-[var(--color-sand)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-sage)] transition-all duration-300"
                  />
                </div>

                <div>
                  <label className="block text-sm text-[var(--color-stone)] mb-2">
                    Early Bird Deadline
                  </label>
                  <input
                    type="date"
                    name="early_bird_deadline"
                    value={formData.early_bird_deadline}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-[var(--color-sand)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-sage)] transition-all duration-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-[var(--color-stone)] mb-2">
                  Registration Opens At
                </label>
                <div className="flex gap-2">
                  <input
                    type="datetime-local"
                    name="registration_opens_at"
                    value={formData.registration_opens_at}
                    onChange={handleChange}
                    className="flex-1 px-4 py-3 border border-[var(--color-sand)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-sage)] transition-all duration-300"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      // Get current UTC time and format for datetime-local input
                      const now = new Date();
                      // Format: YYYY-MM-DDTHH:mm (datetime-local format)
                      const year = now.getFullYear();
                      const month = String(now.getMonth() + 1).padStart(2, '0');
                      const day = String(now.getDate()).padStart(2, '0');
                      const hours = String(now.getHours()).padStart(2, '0');
                      const minutes = String(now.getMinutes()).padStart(2, '0');
                      const localDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
                      
                      setFormData(prev => ({
                        ...prev,
                        registration_opens_at: localDateTime
                      }));
                    }}
                    className="px-4 py-2 bg-[var(--color-sage)] hover:bg-[var(--color-clay)] text-white rounded-lg transition-colors whitespace-nowrap text-sm"
                  >
                    Now
                  </button>
                </div>
                <p className="mt-1 text-xs text-[var(--color-stone)]">
                  Leave empty to open registration immediately
                </p>
              </div>
            </>
          )}

          {/* Deposit Price - Show only for Teacher Training */}
          {formData.category === 'Teacher Training' && (
            <div>
              <label className="block text-sm text-[var(--color-stone)] mb-2">
                Deposit Price (฿) <span className="text-xs text-[var(--color-stone)]">(Optional)</span>
              </label>
              <input
                type="number"
                name="deposit_price"
                value={formData.deposit_price}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="e.g., 5000"
                className="w-full px-4 py-3 border border-[var(--color-sand)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-sage)] transition-all duration-300"
              />
              <p className="mt-2 text-xs text-[var(--color-stone)]">
                If set, students can choose to pay this deposit amount to secure their spot, with the remaining balance due later.
              </p>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm text-[var(--color-stone)] mb-2">
              Description {formData.category === 'Class' ? '*' : '(Short description)'}
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required={formData.category === 'Class'}
              rows={4}
              placeholder="Describe the class, what to expect, and who it's for..."
              className="w-full px-4 py-3 border border-[var(--color-sand)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-sage)] transition-all duration-300 resize-none"
            />
          </div>

          {/* Long Description - Show for Workshop, Retreat, Teacher Training */}
          {formData.category !== 'Class' && (
            <div>
              <label className="block text-sm text-[var(--color-stone)] mb-2">
                Long Description *
              </label>
              <textarea
                name="long_description"
                value={formData.long_description}
                onChange={handleChange}
                required
                rows={6}
                placeholder="Provide detailed information about what students will learn, class flow, benefits, etc..."
                className="w-full px-4 py-3 border border-[var(--color-sand)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-sage)] transition-all duration-300 resize-none"
              />
            </div>
          )}

          {/* Cover Image Upload - Show for Workshop, Retreat, Teacher Training, Special Event */}
          {(formData.category === 'Workshop' || formData.category === 'Retreat' || formData.category === 'Teacher Training' || formData.category === 'Special Event') && (
            <div>
              <label className="block text-sm text-[var(--color-stone)] mb-2">
                Cover Image {formData.category === 'Teacher Training' ? '(Optional - for Hero Background)' : '*'}
              </label>
              <ImageUpload
                currentImageUrl={formData.cover_image_url}
                onUpload={(url) => {
                  setFormData(prev => ({
                    ...prev,
                    cover_image_url: url
                  }));
                }}
              />
              {formData.category === 'Teacher Training' && (
                <p className="mt-2 text-xs text-[var(--color-stone)]">
                  This image will be used as the hero background on the Teacher Training page
                </p>
              )}
            </div>
          )}

          {/* Gallery Images - Show for Workshop, Retreat, Special Event (NOT Teacher Training) */}
          {(formData.category === 'Workshop' || formData.category === 'Retreat' || formData.category === 'Special Event') && (
            <div>
              <label className="block text-sm text-[var(--color-stone)] mb-2">
                Gallery Images (Optional)
              </label>
              <p className="text-xs text-[var(--color-stone)] mb-3">
                Upload multiple images to showcase this class/workshop in a gallery slideshow
              </p>
              <MultiImageUpload
                images={formData.gallery_images}
                onImagesChange={(images) => {
                  setFormData(prev => ({
                    ...prev,
                    gallery_images: images
                  }));
                }}
                maxImages={10}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-[var(--color-sand)] text-[var(--color-stone)] rounded-lg hover:bg-[var(--color-cream)] transition-all duration-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitLoading}
              className="flex-1 px-6 py-3 bg-[var(--color-sage)] hover:bg-[var(--color-clay)] text-white rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              {submitLoading ? 'Creating…' : 'Create Class'}
            </button>
          </div>
          {submitError ? (
            <div className="text-sm text-red-700">{submitError}</div>
          ) : null}
        </form>
      </div>
    </div>
  );
}
