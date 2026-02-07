-- Migration: Add Guest Nationality Support
-- Description: Add nationality field for guest bookings to support reporting
-- Date: 2026-01-22

-- Add guest_nationality column to bookings table
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS guest_nationality TEXT;

-- Add comment to document the column
COMMENT ON COLUMN bookings.guest_nationality IS 'Nationality of guest/walk-in bookings (when user_id is null). Used for reporting purposes.';

-- Create an index for faster reporting queries by nationality
CREATE INDEX IF NOT EXISTS idx_bookings_guest_nationality ON bookings(guest_nationality) WHERE guest_nationality IS NOT NULL;
