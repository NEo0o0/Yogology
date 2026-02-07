-- Update payments table to support manual income entries
-- Make booking_id nullable to allow manual transactions without bookings

ALTER TABLE payments 
  ALTER COLUMN booking_id DROP NOT NULL;

-- Add new columns for manual transaction categorization
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS category TEXT CHECK (category IN ('class', 'workshop', 'product', 'package', 'other')),
  ADD COLUMN IF NOT EXISTS payment_method TEXT CHECK (payment_method IN ('cash', 'bank_transfer', 'promptpay', 'credit_card', 'other')),
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS is_manual BOOLEAN DEFAULT false;

-- Add index for manual transactions
CREATE INDEX IF NOT EXISTS idx_payments_is_manual ON payments(is_manual);
CREATE INDEX IF NOT EXISTS idx_payments_category ON payments(category);

-- Add comment
COMMENT ON COLUMN payments.booking_id IS 'Booking ID - nullable for manual income entries';
COMMENT ON COLUMN payments.category IS 'Transaction category for manual entries';
COMMENT ON COLUMN payments.payment_method IS 'Payment method used';
COMMENT ON COLUMN payments.description IS 'Additional notes or description';
COMMENT ON COLUMN payments.is_manual IS 'Flag to identify manually added transactions';
