import { pgTable, uuid, text, boolean, timestamp, numeric, integer, jsonb } from 'drizzle-orm/pg-core';

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(),
  username: text('username'),
  fullName: text('full_name'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at')
});

export const devices = pgTable('devices', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id').notNull(),
  deviceName: text('device_name').notNull(),
  deviceCode: text('device_code'),
  type: text('type'),
  status: text('status'),
  isActive: boolean('is_active'),
  lastConnectedAt: timestamp('last_connected_at'),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at')
});

export const cryEvents = pgTable('cry_events', {
  id: uuid('id').primaryKey(),
  deviceId: uuid('device_id').notNull(),
  detectedAt: timestamp('detected_at'),
  confidenceLevel: numeric('confidence_level'),
  audioUrl: text('audio_url'),
  durationSeconds: integer('duration_seconds'),
  notes: text('notes'),
  createdAt: timestamp('created_at')
});

export const alertSettings = pgTable('alert_settings', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id').notNull(),
  pushEnabled: boolean('push_enabled'),
  soundEnabled: boolean('sound_enabled'),
  vibrationEnabled: boolean('vibration_enabled'),
  quietHoursStart: text('quiet_hours_start'),
  quietHoursEnd: text('quiet_hours_end'),
  updatedAt: timestamp('updated_at')
});

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id').notNull(),
  cryEventId: uuid('cry_event_id'),
  title: text('title').notNull(),
  message: text('message').notNull(),
  isRead: boolean('is_read'),
  sentAt: timestamp('sent_at')
});

export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  email: text('email').notNull(),
  passwordHash: text('password_hash').notNull(),
  name: text('name'),
  createdAt: timestamp('created_at')
});

export const monitoring = pgTable('monitoring', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id').notNull(),
  deviceId: uuid('device_id').notNull(),
  metrics: jsonb('metrics'),
  status: text('status'),
  timestamp: timestamp('timestamp')
});
