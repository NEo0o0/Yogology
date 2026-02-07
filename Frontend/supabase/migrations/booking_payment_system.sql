-- =====================================================
-- Advanced Booking and Payment System Migration
-- =====================================================
-- This migration ensures all required columns exist for the booking payment system

-- The bookings table already has most required columns:
-- ✓ payment_method (enum: cash, bank_transfer, promptpay, card, other)
-- ✓ payment_status (enum: unpaid, partial, paid, waived, refunded)
-- ✓ kind (enum: package, dropin)
-- ✓ guest_name, guest_contact (for guest bookings)
-- ✓ user_package_id (for package credit bookings)
-- ✓ amount_due, amount_paid
-- ✓ paid_at, payment_note

-- Add any missing helper columns if needed
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS revenue_amount DECIMAL(10,2) GENERATED ALWAYS AS (
  CASE 
    WHEN payment_status IN ('paid', 'waived') THEN amount_paid
    ELSE 0
  END
) STORED;

-- Create index for faster payment status queries
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_method ON bookings(payment_method);
CREATE INDEX IF NOT EXISTS idx_bookings_class_date ON bookings(class_id, created_at);

-- Add comment for clarity
COMMENT ON COLUMN bookings.guest_name IS 'Name of guest for non-member bookings (when user_id is NULL)';
COMMENT ON COLUMN bookings.guest_contact IS 'Phone/email/social contact for guest bookings';
COMMENT ON COLUMN bookings.kind IS 'Type of booking: package (uses credit) or dropin (pay per class)';
COMMENT ON COLUMN bookings.payment_method IS 'How payment was/will be made: cash, bank_transfer, promptpay, card, other';
COMMENT ON COLUMN bookings.payment_status IS 'Payment state: unpaid, partial, paid, waived, refunded';
COMMENT ON COLUMN bookings.user_package_id IS 'Reference to user package if booking uses package credit';

-- Ensure RLS policies allow users to update their own payment info
CREATE POLICY IF NOT EXISTS "Users can update their own booking payment info"
ON bookings FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Admin can manually create bookings (including guest bookings)
CREATE POLICY IF NOT EXISTS "Admins can create any booking"
ON bookings FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Admin can view all bookings
CREATE POLICY IF NOT EXISTS "Admins can view all bookings"
ON bookings FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- =====================================================
-- Helper Function: Check User Package Credits
-- =====================================================
CREATE OR REPLACE FUNCTION check_user_active_package(p_user_id UUID)
RETURNS TABLE(
  package_id INTEGER,
  package_name TEXT,
  credits_remaining INTEGER,
  is_unlimited BOOLEAN,
  expires_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.id,
    p.name,
    up.credits_remaining,
    (p.type = 'unlimited'),
    up.expires_at
  FROM user_packages up
  JOIN packages p ON up.package_id = p.id
  WHERE up.user_id = p_user_id
    AND up.status = 'active'
    AND (up.expires_at IS NULL OR up.expires_at > NOW())
    AND (p.type = 'unlimited' OR up.credits_remaining > 0)
  ORDER BY 
    CASE WHEN p.type = 'unlimited' THEN 0 ELSE 1 END,
    up.expires_at ASC NULLS LAST
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Helper Function: Get Today's Class Bookings with Payment Info
-- =====================================================
CREATE OR REPLACE FUNCTION get_todays_class_bookings()
RETURNS TABLE(
  booking_id INTEGER,
  class_id INTEGER,
  class_title TEXT,
  class_starts_at TIMESTAMPTZ,
  user_id UUID,
  user_name TEXT,
  guest_name TEXT,
  payment_method TEXT,
  payment_status TEXT,
  amount_due DECIMAL,
  amount_paid DECIMAL,
  is_attended BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    c.id,
    c.title,
    c.starts_at,
    b.user_id,
    p.full_name,
    b.guest_name,
    b.payment_method::TEXT,
    b.payment_status::TEXT,
    b.amount_due,
    b.amount_paid,
    b.is_attended
  FROM bookings b
  JOIN classes c ON b.class_id = c.id
  LEFT JOIN profiles p ON b.user_id = p.id
  WHERE DATE(c.starts_at) = CURRENT_DATE
    AND b.status = 'booked'
    AND c.is_cancelled = FALSE
  ORDER BY c.starts_at, p.full_name, b.guest_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION check_user_active_package TO authenticated;
GRANT EXECUTE ON FUNCTION get_todays_class_bookings TO authenticated;
