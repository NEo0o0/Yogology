/**
 * Date and Time Formatting Helpers
 * All times are displayed in Thailand Time (Asia/Bangkok, GMT+7)
 * regardless of the user's device timezone.
 */

const THAI_TIMEZONE = 'Asia/Bangkok';

/**
 * Format a date/time to Thailand Time (12-hour format with AM/PM)
 * @param dateInput - ISO string or Date object
 * @returns Formatted time string (e.g., "9:00 AM")
 */
export const formatToThaiTime = (dateInput: string | Date | undefined | null): string => {
  if (!dateInput) {
    console.warn('[formatToThaiTime] Received null/undefined input');
    return '--:--';
  }

  const date = new Date(dateInput);
  
  if (isNaN(date.getTime())) {
    console.error('[formatToThaiTime] Invalid date input:', dateInput);
    return '--:--';
  }

  return new Intl.DateTimeFormat('en-US', {
    timeZone: THAI_TIMEZONE,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
};

/**
 * Format a date/time to Thailand Time with date and time
 * @param dateInput - ISO string or Date object
 * @returns Formatted date and time string (e.g., "Mon, Jan 29, 9:00 AM")
 */
export const formatToThaiDateTime = (dateInput: string | Date | undefined | null): string => {
  if (!dateInput) {
    console.warn('[formatToThaiDateTime] Received null/undefined input');
    return 'N/A';
  }

  const date = new Date(dateInput);
  
  if (isNaN(date.getTime())) {
    console.error('[formatToThaiDateTime] Invalid date input:', dateInput);
    return 'N/A';
  }

  return new Intl.DateTimeFormat('en-US', {
    timeZone: THAI_TIMEZONE,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
};

/**
 * Format a date to Thailand Time (date only, no time)
 * @param dateInput - ISO string or Date object
 * @returns Formatted date string (e.g., "Mon, Jan 29")
 */
export const formatToThaiDate = (dateInput: string | Date | undefined | null): string => {
  if (!dateInput) {
    console.warn('[formatToThaiDate] Received null/undefined input');
    return 'N/A';
  }

  const date = new Date(dateInput);
  
  if (isNaN(date.getTime())) {
    console.error('[formatToThaiDate] Invalid date input:', dateInput);
    return 'N/A';
  }

  return new Intl.DateTimeFormat('en-US', {
    timeZone: THAI_TIMEZONE,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

/**
 * Format a date to Thailand Time (long date format)
 * @param dateInput - ISO string or Date object
 * @returns Formatted date string (e.g., "January 29, 2026")
 */
export const formatToThaiDateLong = (dateInput: string | Date | undefined | null): string => {
  if (!dateInput) {
    console.warn('[formatToThaiDateLong] Received null/undefined input');
    return 'N/A';
  }

  const date = new Date(dateInput);
  
  if (isNaN(date.getTime())) {
    console.error('[formatToThaiDateLong] Invalid date input:', dateInput);
    return 'N/A';
  }

  return new Intl.DateTimeFormat('en-US', {
    timeZone: THAI_TIMEZONE,
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};

/**
 * Format a time range in Thailand Time
 * @param startInput - ISO string or Date object for start time
 * @param endInput - ISO string or Date object for end time
 * @returns Formatted time range (e.g., "9:00 AM - 10:30 AM")
 */
export const formatToThaiTimeRange = (
  startInput: string | Date,
  endInput: string | Date
): string => {
  const startTime = formatToThaiTime(startInput);
  const endTime = formatToThaiTime(endInput);
  return `${startTime} - ${endTime}`;
};

/**
 * Get the current date/time in Thailand timezone
 * @returns Date object representing current time in Thailand
 */
export const getCurrentThaiTime = (): Date => {
  // Get current time as ISO string in Thai timezone
  const now = new Date();
  const thaiTimeString = now.toLocaleString('en-US', { timeZone: THAI_TIMEZONE });
  return new Date(thaiTimeString);
};

/**
 * Format day of week in Thailand Time
 * @param dateInput - ISO string or Date object
 * @returns Day of week (e.g., "Monday")
 */
export const formatToThaiDayOfWeek = (dateInput: string | Date | undefined | null): string => {
  if (!dateInput) {
    console.warn('[formatToThaiDayOfWeek] Received null/undefined input');
    return 'N/A';
  }

  const date = new Date(dateInput);
  
  if (isNaN(date.getTime())) {
    console.error('[formatToThaiDayOfWeek] Invalid date input:', dateInput);
    return 'N/A';
  }

  return new Intl.DateTimeFormat('en-US', {
    timeZone: THAI_TIMEZONE,
    weekday: 'long',
  }).format(date);
};
