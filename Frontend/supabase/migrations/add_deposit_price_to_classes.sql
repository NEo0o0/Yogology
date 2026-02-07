-- Add deposit_price column to classes table for Teacher Training deposit payments
-- This allows admins to set an optional deposit amount that students can pay to secure their spot

ALTER TABLE classes 
ADD COLUMN IF NOT EXISTS deposit_price DECIMAL(10,2) DEFAULT NULL;

-- Add comment to document the column purpose
COMMENT ON COLUMN classes.deposit_price IS 'Optional deposit amount for Teacher Training. If set, students can choose to pay this amount upfront and pay the remaining balance later.';
