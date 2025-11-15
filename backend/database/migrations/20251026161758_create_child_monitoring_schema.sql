/*
  # Child Monitoring System Database Schema

  ## Overview
  Complete database schema for the Child Monitoring System, supporting user authentication,
  device management, cry detection events, and notification settings.

  ## Tables Created
  
  ### 1. profiles
  - Extends Supabase auth.users with additional user profile data
  - Fields: id (uuid), username (text), full_name (text), avatar_url (text), created_at, updated_at
  
  ### 2. devices
  - Stores monitoring device information
  - Fields: id (uuid), user_id (uuid FK), device_name (text), device_code (text), 
    is_active (boolean), last_connected_at (timestamptz), created_at, updated_at
  
  ### 3. cry_events
  - Logs all detected cry events from monitoring devices
  - Fields: id (uuid), device_id (uuid FK), detected_at (timestamptz), 
    confidence_level (numeric), audio_url (text), duration_seconds (integer), notes (text)
  
  ### 4. alert_settings
  - User-specific notification and alert preferences
  - Fields: id (uuid), user_id (uuid FK), push_enabled (boolean), sound_enabled (boolean),
    vibration_enabled (boolean), quiet_hours_start (time), quiet_hours_end (time), updated_at
  
  ### 5. notifications
  - Notification history for users
  - Fields: id (uuid), user_id (uuid FK), cry_event_id (uuid FK), title (text), 
    message (text), is_read (boolean), sent_at (timestamptz)

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Policies ensure users can only access their own data
  - Device data restricted to device owners
  - Cry events accessible only through owned devices
  - Notification data restricted to recipients

  ## Indexes
  - Optimized queries for user_id lookups
  - Device code lookups for pairing
  - Cry event timestamp ordering
  - Notification read status filtering
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create devices table
CREATE TABLE IF NOT EXISTS devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_name text NOT NULL DEFAULT 'Baby Monitor',
  device_code text UNIQUE NOT NULL,
  is_active boolean DEFAULT true,
  last_connected_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own devices"
  ON devices FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own devices"
  ON devices FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own devices"
  ON devices FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own devices"
  ON devices FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for device lookups
CREATE INDEX IF NOT EXISTS idx_devices_user_id ON devices(user_id);
CREATE INDEX IF NOT EXISTS idx_devices_device_code ON devices(device_code);

-- Create cry_events table
CREATE TABLE IF NOT EXISTS cry_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id uuid NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  detected_at timestamptz DEFAULT now(),
  confidence_level numeric(3,2) DEFAULT 0.95 CHECK (confidence_level >= 0 AND confidence_level <= 1),
  audio_url text,
  duration_seconds integer DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE cry_events ENABLE ROW LEVEL SECURITY;

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

-- Create index for cry event queries
CREATE INDEX IF NOT EXISTS idx_cry_events_device_id ON cry_events(device_id);
CREATE INDEX IF NOT EXISTS idx_cry_events_detected_at ON cry_events(detected_at DESC);

-- Create alert_settings table
CREATE TABLE IF NOT EXISTS alert_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  push_enabled boolean DEFAULT true,
  sound_enabled boolean DEFAULT true,
  vibration_enabled boolean DEFAULT true,
  quiet_hours_start time,
  quiet_hours_end time,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE alert_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own alert settings"
  ON alert_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own alert settings"
  ON alert_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own alert settings"
  ON alert_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cry_event_id uuid REFERENCES cry_events(id) ON DELETE SET NULL,
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  sent_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for notification queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_sent_at ON notifications(sent_at DESC);

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at columns
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_devices_updated_at ON devices;
CREATE TRIGGER update_devices_updated_at
  BEFORE UPDATE ON devices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_alert_settings_updated_at ON alert_settings;
CREATE TRIGGER update_alert_settings_updated_at
  BEFORE UPDATE ON alert_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
