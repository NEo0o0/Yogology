-- =====================================================
-- Payment Slip Upload Support Migration
-- =====================================================

-- Add payment_slip_url column to bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_slip_url TEXT;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_bookings_payment_slip ON bookings(payment_slip_url) WHERE payment_slip_url IS NOT NULL;

-- Add comment
COMMENT ON COLUMN bookings.payment_slip_url IS 'URL to uploaded payment slip/proof of transfer image';

-- Create payment-slips storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-slips', 'payment-slips', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies for payment-slips bucket
-- Allow authenticated users to upload their own payment slips
CREATE POLICY IF NOT EXISTS "Users can upload payment slips"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'payment-slips' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access to payment slips (for admin verification)
CREATE POLICY IF NOT EXISTS "Public read access to payment slips"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'payment-slips');

-- Allow users to update their own payment slips
CREATE POLICY IF NOT EXISTS "Users can update their payment slips"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'payment-slips'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'payment-slips'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own payment slips
CREATE POLICY IF NOT EXISTS "Users can delete their payment slips"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'payment-slips'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- =====================================================
-- App Settings for PromptPay QR Code
-- =====================================================

-- Insert default PromptPay QR URL setting
INSERT INTO app_settings (key, value)
VALUES ('promptpay_qr_url', 'https://your-storage-url.com/qr-codes/promptpay.png')
ON CONFLICT (key) DO NOTHING;

-- Insert bank account details
INSERT INTO app_settings (key, value)
VALUES 
  ('bank_name', 'Kasikorn Bank (K-Bank)'),
  ('bank_account_number', '123-4-56789-0'),
  ('bank_account_name', 'Annie Bliss Yoga Studio')
ON CONFLICT (key) DO NOTHING;

-- Add comment
COMMENT ON TABLE app_settings IS 'Global application settings including payment information';

-- Grant access to app_settings
GRANT SELECT ON app_settings TO authenticated;
GRANT SELECT ON app_settings TO anon;
