-- Migration: Update Weekly Schedule Instructor Fields
-- Description: Rename instructor to instructor_name and add instructor_id to support both registered and guest instructors
-- Date: 2026-01-22

-- Step 1: Add new instructor_id column (nullable, references profiles)
ALTER TABLE weekly_schedule
ADD COLUMN IF NOT EXISTS instructor_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Step 2: Rename existing instructor column to instructor_name
ALTER TABLE weekly_schedule
RENAME COLUMN instructor TO instructor_name;

-- Step 3: Add comments to document the columns
COMMENT ON COLUMN weekly_schedule.instructor_id IS 'ID of registered instructor from profiles table. NULL for guest instructors.';
COMMENT ON COLUMN weekly_schedule.instructor_name IS 'Display name for guest instructors. NULL for registered instructors (name fetched from profile).';

-- Step 4: Create index for faster queries by instructor_id
CREATE INDEX IF NOT EXISTS idx_weekly_schedule_instructor_id ON weekly_schedule(instructor_id) WHERE instructor_id IS NOT NULL;

-- Note: Logic for using these fields:
-- - Guest Instructor: instructor_id = NULL, instructor_name = "Master Kim"
-- - Registered Instructor: instructor_id = UUID, instructor_name = NULL (or can store cached name)
