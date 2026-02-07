-- Migration: Add Guest Instructor Support
-- Description: Allow classes to have guest instructors by name without requiring a user account
-- Date: 2026-01-22

-- Add instructor_name column to classes table
ALTER TABLE classes
ADD COLUMN IF NOT EXISTS instructor_name TEXT;

-- Make instructor_id nullable (if not already)
-- This allows classes to exist without a registered instructor user ID
ALTER TABLE classes
ALTER COLUMN instructor_id DROP NOT NULL;

-- Add a check constraint to ensure at least one instructor identifier is provided
-- Either instructor_id OR instructor_name must be present
ALTER TABLE classes
ADD CONSTRAINT check_instructor_identifier
CHECK (
  instructor_id IS NOT NULL OR 
  instructor_name IS NOT NULL
);

-- Add comment to document the column
COMMENT ON COLUMN classes.instructor_name IS 'Name of guest/external instructor who does not have a user account. Use this OR instructor_id.';

-- Create an index for faster lookups by instructor_name
CREATE INDEX IF NOT EXISTS idx_classes_instructor_name ON classes(instructor_name);
