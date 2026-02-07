ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS is_deposit_paid BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS price_at_booking DECIMAL(10,2);

COMMENT ON COLUMN bookings.is_deposit_paid IS 'True if the user only paid the deposit amount';
COMMENT ON COLUMN bookings.price_at_booking IS 'Snapshot of the full price/early bird price at the time of booking';
