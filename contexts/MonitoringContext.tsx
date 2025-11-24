import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';

interface CryEvent {
  id: string;
  device_id: string;
  detected_at: string;
  confidence_level: number;
  audio_url: string | null;
  duration_seconds: number;
  notes: string | null;
}

interface Device {
  id: string;
  user_id: string;
  device_name: string;
  device_code: string;
  is_active: boolean;
  last_connected_at: string;
}

interface AlertSettings {
  id: string;
  user_id: string;
  push_enabled: boolean;
  sound_enabled: boolean;
  vibration_enabled: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
}

interface Notification {
  id: string;
  user_id: string;
  cry_event_id: string | null;
  title: string;
  message: string;
  is_read: boolean;
  sent_at: string;
}

interface MonitoringContextType {
  devices: Device[];
  cryEvents: CryEvent[];
  notifications: Notification[];
  alertSettings: AlertSettings | null;
  isMonitoring: boolean;
  unreadCount: number;
  canAccessData: boolean;
  addDevice: (deviceCode: string, deviceName: string) => Promise<void>;
  removeDevice: (deviceId: string) => Promise<void>;
  updateDevice: (deviceId: string, updates: Partial<Device>) => Promise<void>;
  fetchCryEvents: (limit?: number) => Promise<void>;
  markNotificationRead: (notificationId: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  updateAlertSettings: (settings: Partial<AlertSettings>) => Promise<void>;
  refreshDevices: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const MonitoringContext = createContext<MonitoringContextType | undefined>(undefined);

export function MonitoringProvider({ children }: { children: React.ReactNode }) {
  const { user, isEmailVerified } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [cryEvents, setCryEvents] = useState<CryEvent[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [alertSettings, setAlertSettings] = useState<AlertSettings | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const canAccessData = !!user && isEmailVerified;

  const fetchDevices = async () => {
    if (!user || !isEmailVerified) return;

    const { data, error } = await supabase
      .from('devices')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching devices:', error);
      return;
    }

    setDevices(data || []);
    setIsMonitoring(data?.some(d => d.is_active) || false);
  };

  const fetchCryEvents = async (limit: number = 50) => {
    if (!user || !isEmailVerified || devices.length === 0) return;

    const deviceIds = devices.map(d => d.id);
    const { data, error } = await supabase
      .from('cry_events')
      .select('*')
      .in('device_id', deviceIds)
      .order('detected_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching cry events:', error);
      return;
    }

    setCryEvents(data || []);
  };

  const fetchNotifications = async () => {
    if (!user || !isEmailVerified) return;

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('sent_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching notifications:', error);
      return;
    }

    setNotifications(data || []);
  };

  const fetchAlertSettings = async () => {
    if (!user || !isEmailVerified) return;

    const { data, error } = await supabase
      .from('alert_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching alert settings:', error);
      return;
    }

    setAlertSettings(data);
  };

  useEffect(() => {
    if (user && isEmailVerified) {
      fetchDevices();
      fetchNotifications();
      fetchAlertSettings();
    }
  }, [user]);

  useEffect(() => {
    if (devices.length > 0 && isEmailVerified) {
      fetchCryEvents();
    }
  }, [devices]);

  const addDevice = async (deviceCode: string, deviceName: string) => {
    if (!user) throw new Error('No user logged in');
    if (!isEmailVerified) throw new Error('Please verify your email before adding a device');

    const { error } = await supabase.from('devices').insert({
      user_id: user.id,
      device_code: deviceCode,
      device_name: deviceName,
    });

    if (error) throw error;
    await fetchDevices();
  };

  const removeDevice = async (deviceId: string) => {
    if (!isEmailVerified) throw new Error('Please verify your email before removing a device');
    const { error } = await supabase
      .from('devices')
      .delete()
      .eq('id', deviceId);

    if (error) throw error;
    await fetchDevices();
  };

  const updateDevice = async (deviceId: string, updates: Partial<Device>) => {
    if (!isEmailVerified) throw new Error('Please verify your email before updating a device');
    const { error } = await supabase
      .from('devices')
      .update(updates)
      .eq('id', deviceId);

    if (error) throw error;
    await fetchDevices();
  };

  const markNotificationRead = async (notificationId: string) => {
    if (!isEmailVerified) throw new Error('Please verify your email to manage notifications');
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) throw error;
    await fetchNotifications();
  };

  const markAllNotificationsRead = async () => {
    if (!user || !isEmailVerified) return;

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (error) throw error;
    await fetchNotifications();
  };

  const updateAlertSettings = async (settings: Partial<AlertSettings>) => {
    if (!user) throw new Error('No user logged in');
    if (!isEmailVerified) throw new Error('Please verify your email before updating alert settings');

    const { error } = await supabase
      .from('alert_settings')
      .update(settings)
      .eq('user_id', user.id);

    if (error) throw error;
    await fetchAlertSettings();
  };

  const value = {
    devices,
    cryEvents,
    notifications,
    alertSettings,
    isMonitoring,
    unreadCount,
    canAccessData,
    addDevice,
    removeDevice,
    updateDevice,
    fetchCryEvents,
    markNotificationRead,
    markAllNotificationsRead,
    updateAlertSettings,
    refreshDevices: fetchDevices,
    refreshNotifications: fetchNotifications,
  };

  return <MonitoringContext.Provider value={value}>{children}</MonitoringContext.Provider>;
}

export function useMonitoring() {
  const context = useContext(MonitoringContext);
  if (context === undefined) {
    throw new Error('useMonitoring must be used within a MonitoringProvider');
  }
  return context;
}
