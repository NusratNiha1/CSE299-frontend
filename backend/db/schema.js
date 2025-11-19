import { pgTable, uuid, text, boolean, timestamp, numeric, integer, jsonb, time } from 'drizzle-orm/pg-core';

// Profiles table - extends Supabase auth.users
export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(),
  username: text('username'),
  fullName: text('full_name'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true })
});

// Devices table - monitoring device information
export const devices = pgTable('devices', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  deviceName: text('device_name').notNull().default('Baby Monitor'),
  deviceCode: text('device_code').notNull(),
  isActive: boolean('is_active').default(true),
  lastConnectedAt: timestamp('last_connected_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true })
});

// Cry events table - detected cry events from monitoring devices
export const cryEvents = pgTable('cry_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  deviceId: uuid('device_id').notNull(),
  detectedAt: timestamp('detected_at', { withTimezone: true }),
  confidenceLevel: numeric('confidence_level', { precision: 3, scale: 2 }),
  audioUrl: text('audio_url'),
  durationSeconds: integer('duration_seconds').default(0),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true })
});

// Alert settings table - user-specific notification preferences
export const alertSettings = pgTable('alert_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  pushEnabled: boolean('push_enabled').default(true),
  soundEnabled: boolean('sound_enabled').default(true),
  vibrationEnabled: boolean('vibration_enabled').default(true),
  quietHoursStart: time('quiet_hours_start'),
  quietHoursEnd: time('quiet_hours_end'),
  updatedAt: timestamp('updated_at', { withTimezone: true })
});

// Notifications table - notification history for users
export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  cryEventId: uuid('cry_event_id'),
  title: text('title').notNull(),
  message: text('message').notNull(),
  isRead: boolean('is_read').default(false),
  sentAt: timestamp('sent_at', { withTimezone: true })
});

// Users table - for backend authentication (separate from Supabase auth.users)
export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  email: text('email').notNull(),
  passwordHash: text('password_hash').notNull(),
  name: text('name'),
  createdAt: timestamp('created_at', { withTimezone: true })
});

// Monitoring table - additional monitoring data
export const monitoring = pgTable('monitoring', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id').notNull(),
  deviceId: uuid('device_id').notNull(),
  metrics: jsonb('metrics'),
  status: text('status'),
  timestamp: timestamp('timestamp', { withTimezone: true })
});
