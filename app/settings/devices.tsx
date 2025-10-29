import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Smartphone, Plus, Trash2, Power } from 'lucide-react-native';
import { useMonitoring } from '@/contexts/MonitoringContext';
import { Input } from '@/components/Input';
import { ButtonPrimary } from '@/components/ButtonPrimary';
import { GlassCard } from '@/components/GlassCard';
import { theme } from '@/constants/theme';

export default function DevicesSettingsScreen() {
  const router = useRouter();
  const { devices, addDevice, removeDevice, updateDevice, refreshDevices } = useMonitoring();
  const [showAddModal, setShowAddModal] = useState(false);
  const [deviceCode, setDeviceCode] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAddDevice = async () => {
    if (!deviceCode.trim() || !deviceName.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await addDevice(deviceCode, deviceName);
      setShowAddModal(false);
      setDeviceCode('');
      setDeviceName('');
      Alert.alert('Success', 'Device added successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to add device');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveDevice = (deviceId: string, deviceName: string) => {
    Alert.alert(
      'Remove Device',
      `Are you sure you want to remove ${deviceName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeDevice(deviceId);
              Alert.alert('Success', 'Device removed successfully');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to remove device');
            }
          },
        },
      ]
    );
  };

  const toggleDeviceStatus = async (deviceId: string, currentStatus: boolean) => {
    try {
      await updateDevice(deviceId, { is_active: !currentStatus });
      await refreshDevices();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update device status');
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
        <Text style={styles.headerTitle}>Manage Devices</Text>
        <TouchableOpacity
          onPress={() => setShowAddModal(true)}
          style={styles.addButton}
        >
          <Plus size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {devices.length === 0 ? (
          <GlassCard style={styles.emptyCard}>
            <Smartphone size={48} color={theme.colors.textSecondary} />
            <Text style={styles.emptyTitle}>No Devices Connected</Text>
            <Text style={styles.emptyText}>
              Add a monitoring device to start tracking
            </Text>
          </GlassCard>
        ) : (
          <View style={styles.devicesList}>
            {devices.map((device) => (
              <GlassCard key={device.id} style={styles.deviceCard}>
                <View style={styles.deviceHeader}>
                  <View style={styles.deviceIcon}>
                    <Smartphone size={24} color={theme.colors.primary} />
                  </View>
                  <View style={styles.deviceInfo}>
                    <Text style={styles.deviceName}>{device.device_name}</Text>
                    <Text style={styles.deviceCode}>Code: {device.device_code}</Text>
                    <Text style={styles.deviceStatus}>
                      {device.is_active ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>

                <View style={styles.deviceActions}>
                  <TouchableOpacity
                    onPress={() => toggleDeviceStatus(device.id, device.is_active)}
                    style={[
                      styles.actionButton,
                      device.is_active && styles.actionButtonActive,
                    ]}
                  >
                    <Power size={20} color={theme.colors.text} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleRemoveDevice(device.id, device.device_name)}
                    style={styles.actionButton}
                  >
                    <Trash2 size={20} color={theme.colors.error} />
                  </TouchableOpacity>
                </View>
              </GlassCard>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <GlassCard style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Device</Text>

            <Input
              label="Device Name"
              placeholder="e.g., Baby Monitor 1"
              value={deviceName}
              onChangeText={setDeviceName}
            />
            <Input
              label="Device Code"
              placeholder="Enter device pairing code"
              value={deviceCode}
              onChangeText={setDeviceCode}
              autoCapitalize="characters"
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <ButtonPrimary
              title="Add Device"
              onPress={handleAddDevice}
              loading={loading}
              style={styles.modalButton}
            />
            <ButtonPrimary
              title="Cancel"
              onPress={() => setShowAddModal(false)}
              variant="secondary"
              style={styles.modalButton}
            />
          </GlassCard>
        </View>
      </Modal>
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
  addButton: {
    padding: theme.spacing.sm,
  },
  scrollContent: {
    padding: theme.spacing.lg,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  emptyTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  devicesList: {
    gap: theme.spacing.md,
  },
  deviceCard: {
    marginBottom: theme.spacing.md,
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  deviceIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'rgba(1, 204, 102, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  deviceCode: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  deviceStatus: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.primary,
  },
  deviceActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  actionButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  actionButtonActive: {
    backgroundColor: 'rgba(1, 204, 102, 0.2)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  modalContent: {
    padding: theme.spacing.xl,
  },
  modalTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
  },
  modalButton: {
    marginTop: theme.spacing.md,
  },
  error: {
    color: theme.colors.error,
    fontSize: theme.fontSize.sm,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
});
