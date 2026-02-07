-- Migration: Add Long Description to Class Types
-- Description: Add long_description column to class_types for detailed class information
-- Date: 2026-01-22

-- Add long_description column to class_types table
ALTER TABLE class_types
ADD COLUMN IF NOT EXISTS long_description TEXT;

-- Add comment to document the column
COMMENT ON COLUMN class_types.long_description IS 'Detailed description of the class type. Displayed in "About this Class" section.';
