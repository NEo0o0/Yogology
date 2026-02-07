-- Add payment configuration to app_settings
-- This will store payment method configurations for different product types

-- Add payment_config column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'app_settings' AND column_name = 'payment_config'
  ) THEN
    ALTER TABLE app_settings 
      ADD COLUMN payment_config JSONB DEFAULT '{
        "class_booking": {
          "bank_transfer": true,
          "promptpay": true,
          "credit_card": false,
          "contact_admin": false
        },
        "workshop": {
          "bank_transfer": true,
          "promptpay": true,
          "credit_card": false,
          "contact_admin": false
        },
        "teacher_training": {
          "bank_transfer": true,
          "promptpay": false,
          "credit_card": false,
          "contact_admin": true
        },
        "packages": {
          "bank_transfer": true,
          "promptpay": true,
          "credit_card": false,
          "contact_admin": false
        }
      }'::JSONB;
  END IF;
END $$;

-- Add comment
COMMENT ON COLUMN app_settings.payment_config IS 'Payment method configuration for different product types';
