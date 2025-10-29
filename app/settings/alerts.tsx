import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft } from 'lucide-react-native';
import { useMonitoring } from '@/contexts/MonitoringContext';
import { GlassCard } from '@/components/GlassCard';
import { theme } from '@/constants/theme';

export default function AlertSettingsScreen() {
  const router = useRouter();
  const { alertSettings, updateAlertSettings } = useMonitoring();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);

  useEffect(() => {
    if (alertSettings) {
      setPushEnabled(alertSettings.push_enabled);
      setSoundEnabled(alertSettings.sound_enabled);
      setVibrationEnabled(alertSettings.vibration_enabled);
    }
  }, [alertSettings]);

  const handleToggle = async (
    setting: 'push_enabled' | 'sound_enabled' | 'vibration_enabled',
    value: boolean
  ) => {
    try {
      await updateAlertSettings({ [setting]: value });
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update settings');
    }
  };

  return (
    <LinearGradient
      colors={[theme.colors.background, theme.colors.secondary]}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Alert Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <GlassCard style={styles.card}>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Push Notifications</Text>
              <Text style={styles.settingDescription}>
                Receive alerts when cry is detected
              </Text>
            </View>
            <Switch
              value={pushEnabled}
              onValueChange={(value) => {
                setPushEnabled(value);
                handleToggle('push_enabled', value);
              }}
              trackColor={{
                false: theme.colors.textSecondary,
                true: theme.colors.primary,
              }}
              thumbColor={theme.colors.text}
            />
          </View>

          <View style={[styles.settingItem, styles.settingItemBorder]}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Sound</Text>
              <Text style={styles.settingDescription}>
                Play alert sound for notifications
              </Text>
            </View>
            <Switch
              value={soundEnabled}
              onValueChange={(value) => {
                setSoundEnabled(value);
                handleToggle('sound_enabled', value);
              }}
              trackColor={{
                false: theme.colors.textSecondary,
                true: theme.colors.primary,
              }}
              thumbColor={theme.colors.text}
            />
          </View>

          <View style={[styles.settingItem, styles.settingItemBorder]}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Vibration</Text>
              <Text style={styles.settingDescription}>
                Vibrate on cry detection
              </Text>
            </View>
            <Switch
              value={vibrationEnabled}
              onValueChange={(value) => {
                setVibrationEnabled(value);
                handleToggle('vibration_enabled', value);
              }}
              trackColor={{
                false: theme.colors.textSecondary,
                true: theme.colors.primary,
              }}
              thumbColor={theme.colors.text}
            />
          </View>
        </GlassCard>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>About Alert Settings</Text>
          <Text style={styles.infoText}>
            These settings control how you receive notifications when your baby cries.
            Push notifications will appear even when the app is closed. Sound and
            vibration can be customized independently.
          </Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 60,
    paddingBottom: theme.spacing.md,
  },
  backButton: {
    padding: theme.spacing.sm,
  },
  headerTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  scrollContent: {
    padding: theme.spacing.lg,
  },
  card: {
    marginBottom: theme.spacing.xl,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
  },
  settingItemBorder: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.glassBorder,
  },
  settingInfo: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  settingLabel: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  settingDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  infoCard: {
    backgroundColor: 'rgba(1, 204, 102, 0.05)',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(1, 204, 102, 0.2)',
  },
  infoTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  infoText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
});
