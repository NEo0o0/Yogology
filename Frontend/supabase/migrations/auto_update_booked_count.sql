-- Create function to automatically update booked_count in classes table
CREATE OR REPLACE FUNCTION update_booked_count() RETURNS TRIGGER AS $$
BEGIN
  -- Update the booked_count for the affected class
  -- Count all non-cancelled bookings for this class
  UPDATE classes 
  SET booked_count = (
    SELECT COUNT(*) 
    FROM bookings 
    WHERE class_id = COALESCE(NEW.class_id, OLD.class_id) 
    AND status != 'cancelled'
  )
  WHERE id = COALESCE(NEW.class_id, OLD.class_id);
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS tr_update_booked_count ON bookings;

-- Create trigger that fires after INSERT, UPDATE, or DELETE on bookings
CREATE TRIGGER tr_update_booked_count 
AFTER INSERT OR UPDATE OR DELETE ON bookings
FOR EACH ROW 
EXECUTE FUNCTION update_booked_count();

-- Add comment explaining the trigger
COMMENT ON TRIGGER tr_update_booked_count ON bookings IS 
'Automatically updates the booked_count in the classes table whenever a booking is inserted, updated, or deleted';
