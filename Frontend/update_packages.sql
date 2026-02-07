-- Annie Bliss Yoga - Update Packages Table with Actual Data
-- Run this SQL script in your Supabase SQL Editor

-- Step 1: Set all existing packages to inactive
UPDATE packages 
SET is_active = false
WHERE is_active = true;

-- Step 2: Insert the actual package data
INSERT INTO packages (name, type, credits, duration_days, price, is_active)
VALUES 
  ('6 Class Pass', 'credit', 6, 15, 2000, true),
  ('10 Class Pass', 'credit', 10, 45, 3500, true),
  ('Unlimited in 1 Month', 'unlimited', NULL, 30, 4500, true)
ON CONFLICT (name) 
DO UPDATE SET
  type = EXCLUDED.type,
  credits = EXCLUDED.credits,
  duration_days = EXCLUDED.duration_days,
  price = EXCLUDED.price,
  is_active = EXCLUDED.is_active;

-- Step 3: Verify the changes
SELECT id, name, type, credits, duration_days, price, is_active 
FROM packages 
WHERE is_active = true
ORDER BY price ASC;
