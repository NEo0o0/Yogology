-- Create app_settings table for application-wide configuration
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  label TEXT,
  type TEXT,
  category TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Insert default booking cutoff time (180 minutes = 3 hours)
INSERT INTO app_settings (key, value, label, type, category)
VALUES ('booking_cutoff_minutes', '180', 'Booking Cutoff Time (Minutes)', 'number', 'booking')
ON CONFLICT (key) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read settings
CREATE POLICY "Public can read settings" ON app_settings 
  FOR SELECT 
  USING (true);

-- Policy: Only admins can update settings
CREATE POLICY "Admins can update settings" ON app_settings 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Policy: Only admins can insert settings
CREATE POLICY "Admins can insert settings" ON app_settings 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Policy: Only admins can delete settings
CREATE POLICY "Admins can delete settings" ON app_settings 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );
