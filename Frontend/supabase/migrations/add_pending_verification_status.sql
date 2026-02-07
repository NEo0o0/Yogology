-- =====================================================
-- Add 'pending_verification' to payment_status Enum
-- =====================================================

-- Add 'pending_verification' to payment_status enum
-- This status is used when a user uploads a payment slip
-- and the payment is awaiting admin verification
ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'pending_verification';

-- Update comment to reflect new status
COMMENT ON TYPE payment_status IS 'Payment status: unpaid, partial, paid, waived, refunded, pending_verification';

-- Note: After running this migration, regenerate TypeScript types:
-- npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.types.ts
