-- ============================================================
-- 1️⃣ CREATE PROFILES TABLE
-- ============================================================

-- Create a 'profiles' table that stores user profile information.
-- Each profile is linked to a user from the 'auth.users' table.
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,  -- Same ID as the user; if user is deleted, profile also deleted
  username text UNIQUE,                                             -- Unique username for each user
  full_name text,                                                   -- User’s full name
  avatar_url text,                                                  -- Profile picture URL
  created_at timestamptz DEFAULT now(),                             -- Timestamp when profile was created
  updated_at timestamptz DEFAULT now()                              -- Timestamp for last update
);

-- Enable Row Level Security to restrict data access to each user
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view only their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow authenticated users to update only their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow authenticated users to insert only their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- 2️⃣ CREATE DEVICES TABLE
-- ============================================================

-- Table to store connected baby monitor devices for each user
CREATE TABLE IF NOT EXISTS devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),                    -- Unique device ID
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- Linked to the user who owns the device
  device_name text NOT NULL DEFAULT 'Baby Monitor',                 -- Default device name
  device_code text UNIQUE NOT NULL,                                 -- Unique device pairing code
  is_active boolean DEFAULT true,                                   -- Whether the device is active
  last_connected_at timestamptz DEFAULT now(),                      -- Last connection time
  created_at timestamptz DEFAULT now(),                             -- Creation time
  updated_at timestamptz DEFAULT now()                              -- Last update time
);

-- Enable Row Level Security for device ownership protection
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;

-- Allow each user to view only their own devices
CREATE POLICY "Users can view own devices"
  ON devices FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow users to insert devices linked to their account
CREATE POLICY "Users can insert own devices"
  ON devices FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update only their own devices
CREATE POLICY "Users can update own devices"
  ON devices FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete only their own devices
CREATE POLICY "Users can delete own devices"
  ON devices FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes to improve query speed by user or device code
CREATE INDEX IF NOT EXISTS idx_devices_user_id ON devices(user_id);
CREATE INDEX IF NOT EXISTS idx_devices_device_code ON devices(device_code);

-- ============================================================
-- 3️⃣ CREATE CRY_EVENTS TABLE
-- ============================================================

-- Table for storing cry detection events recorded by devices
CREATE TABLE IF NOT EXISTS cry_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),                     -- Unique cry event ID
  device_id uuid NOT NULL REFERENCES devices(id) ON DELETE CASCADE,  -- Linked to the device where event was detected
  detected_at timestamptz DEFAULT now(),                             -- When the cry was detected
  confidence_level numeric(3,2) DEFAULT 0.95 CHECK (confidence_level >= 0 AND confidence_level <= 1), -- AI model confidence
  audio_url text,                                                    -- Link to recorded audio (if available)
  duration_seconds integer DEFAULT 0,                                -- Duration of the detected cry
  notes text,                                                        -- Optional notes or metadata
  created_at timestamptz DEFAULT now()                               -- When the event was saved
);

-- Enable Row Level Security to protect event data
ALTER TABLE cry_events ENABLE ROW LEVEL SECURITY;

-- Allow users to view only cry events from their own devices
CREATE POLICY "Users can view cry events from own devices"
  ON cry_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM devices
      WHERE devices.id = cry_events.device_id
      AND devices.user_id = auth.uid()
    )
  );

-- Allow the system (authenticated user) to insert cry events
-- only if the device belongs to them
CREATE POLICY "System can insert cry events"
  ON cry_events FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM devices
      WHERE devices.id = cry_events.device_id
      AND devices.user_id = auth.uid()
    )
  );

-- Create indexes to optimize queries by device or time
CREATE INDEX IF NOT EXISTS idx_cry_events_device_id ON cry_events(device_id);
CREATE INDEX IF NOT EXISTS idx_cry_events_detected_at ON cry_events(detected_at DESC);

-- ============================================================
-- 4️⃣ CREATE ALERT_SETTINGS TABLE
-- ============================================================

-- Stores each user's notification preferences and quiet hours
CREATE TABLE IF NOT EXISTS alert_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),                     -- Unique ID
  user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- Each user has one alert setting
  push_enabled boolean DEFAULT true,                                 -- Enable push notifications
  sound_enabled boolean DEFAULT true,                                -- Enable sound alerts
  vibration_enabled boolean DEFAULT true,                            -- Enable vibration alerts
  quiet_hours_start time,                                            -- Optional start time for quiet hours
  quiet_hours_end time,                                              -- Optional end time for quiet hours
  updated_at timestamptz DEFAULT now()                               -- Last updated time
);

-- Enable Row Level Security for user privacy
ALTER TABLE alert_settings ENABLE ROW LEVEL SECURITY;

-- Allow users to view only their own settings
CREATE POLICY "Users can view own alert settings"
  ON alert_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow users to insert their own alert settings
CREATE POLICY "Users can insert own alert settings"
  ON alert_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update only their own settings
CREATE POLICY "Users can update own alert settings"
  ON alert_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 5️⃣ CREATE NOTIFICATIONS TABLE
-- ============================================================

-- Table to store notifications sent to users (e.g. cry alerts)
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),                     -- Unique notification ID
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- User receiving the notification
  cry_event_id uuid REFERENCES cry_events(id) ON DELETE SET NULL,    -- Linked cry event (optional)
  title text NOT NULL,                                               -- Notification title
  message text NOT NULL,                                             -- Notification message body
  is_read boolean DEFAULT false,                                     -- Read/unread status
  sent_at timestamptz DEFAULT now()                                  -- Time notification was sent
);

-- Enable Row Level Security for notification privacy
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Allow users to view only their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow users to mark their own notifications as read
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow system to insert notifications for the user
CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for faster notification filtering
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_sent_at ON notifications(sent_at DESC);

-- ============================================================
-- 6️⃣ TRIGGERS & FUNCTIONS FOR AUTO-UPDATING TIMESTAMPS
-- ============================================================

-- Function to automatically update the 'updated_at' column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();  -- Update timestamp on every update
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to auto-update 'updated_at' for profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add trigger to auto-update 'updated_at' for devices
DROP TRIGGER IF EXISTS update_devices_updated_at ON devices;
CREATE TRIGGER update_devices_updated_at
  BEFORE UPDATE ON devices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add trigger to auto-update 'updated_at' for alert settings
DROP TRIGGER IF EXISTS update_alert_settings_updated_at ON alert_settings;
CREATE TRIGGER update_alert_settings_updated_at
  BEFORE UPDATE ON alert_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
