import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Easing, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Baby, Video, Bell, Settings as SettingsIcon, LogOut } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useMonitoring } from '@/contexts/MonitoringContext';
import { GlassCard } from '@/components/GlassCard';
import { theme } from '@/constants/theme';
import { ui } from '@/constants/ui';

export default function DashboardScreen() {
  const router = useRouter();
  const { profile, signOut } = useAuth();
  const { devices, isMonitoring, unreadCount } = useMonitoring();

  const handleLogout = async () => {
    await signOut();
    router.replace('/login');
  };

  const a1 = useRef(new Animated.Value(0)).current;
  const a2 = useRef(new Animated.Value(0)).current;
  const a3 = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const make = (v: Animated.Value, delay: number) =>
      Animated.timing(v, { toValue: 1, duration: 380, delay, easing: Easing.out(Easing.quad), useNativeDriver: true });
    Animated.stagger(80, [make(a1, 0), make(a2, 60), make(a3, 120)]).start();
  }, [a1, a2, a3]);

  return (
    <LinearGradient
      colors={[theme.colors.background, theme.colors.secondary]}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.name}>{profile?.name || 'User'}</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <LogOut size={24} color={theme.colors.error} />
          </TouchableOpacity>
        </View>

        <GlassCard style={styles.statusCard} className={ui.cardContainer} contentClassName={ui.cardContent}>
          <View style={styles.statusHeader}>
            <Baby size={32} color={theme.colors.primary} />
            <View className="flex-row items-center ml-md  px-md py-sm rounded-full">
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isMonitoring ? theme.colors.success : theme.colors.textSecondary },
                ]}
              />
              <Text style={styles.statusText} className="text-text text-sm font-medium">
                {isMonitoring ? 'Monitoring Active' : 'No Active Device'}
              </Text>
            </View>
          </View>
          <Text style={styles.statusDescription} className={ui.subtle}>
            {devices.length > 0
              ? `${devices.length} device${devices.length > 1 ? 's' : ''} connected`
              : 'No devices connected'}
          </Text>
        </GlassCard>

        <View style={styles.actionsGrid}>
          <Animated.View style={{ opacity: a1, transform: [{ translateY: a1.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }}>
            <TouchableOpacity
              onPress={() => router.push('/monitoring')}
              style={styles.actionCardWrapper}
            >
              <GlassCard style={styles.actionCard} className={ui.cardContainer} contentClassName={ui.cardContent}>
                <View style={styles.actionIcon} className={ui.actionIcon + ' bg-[rgba(1,204,102,0.1)]'}>
                  <Video size={32} color={theme.colors.primary} />
                </View>
                <Text style={styles.actionTitle} className="text-text text-md font-bold">Monitoring</Text>
                <Text style={styles.actionSubtitle} className={ui.subtle + ' text-xs'}>View live feed</Text>
              </GlassCard>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={{ opacity: a2, transform: [{ translateY: a2.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }}>
            <TouchableOpacity
              onPress={() => router.push('/notifications')}
              style={styles.actionCardWrapper}
            >
              <GlassCard style={styles.actionCard} className={ui.cardContainer} contentClassName={ui.cardContent}>
                <View style={styles.actionIcon} className={ui.actionIcon + ' bg-[rgba(1,204,102,0.1)]'}>
                  <Bell size={32} color={theme.colors.primary} />
                  {unreadCount > 0 && (
                    <View style={styles.notificationBadge} className={ui.notifBadge + ' min-w-[20px] h-[20px] px-[6px]'}>
                      <Text style={styles.badgeText} className="text-[10px] text-text font-bold">{unreadCount}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.actionTitle} className="text-text text-md font-bold">Notifications</Text>
                <Text style={styles.actionSubtitle} className={ui.subtle + ' text-xs'}>
                  {unreadCount > 0 ? `${unreadCount} new` : 'View history'}
                </Text>
              </GlassCard>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={{ opacity: a3, transform: [{ translateY: a3.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }}>
            <TouchableOpacity
              onPress={() => router.push('/settings')}
              style={styles.actionCardWrapper}
            >
              <GlassCard style={styles.actionCard} className={ui.cardContainer} contentClassName={ui.cardContent}>
                <View style={styles.actionIcon} className={ui.actionIcon + ' bg-[rgba(1,204,102,0.1)]'}>
                  <SettingsIcon size={32} color={theme.colors.primary} />
                </View>
                <Text style={styles.actionTitle} className="text-text text-md font-bold">Settings</Text>
                <Text style={styles.actionSubtitle} className={ui.subtle + ' text-xs'}>Manage account</Text>
              </GlassCard>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

// Keep two cards per row at ~40vw each
const CARD_WIDTH = Math.floor(Dimensions.get('window').width * 0.40);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  greeting: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  name: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold as any,
    color: theme.colors.text,
  },
  logoutButton: {
    padding: theme.spacing.sm,
  },
  statusCard: {
    marginBottom: theme.spacing.xl,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: theme.spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: theme.borderRadius.full,
    marginRight: theme.spacing.sm,
  },
  statusText: {
    color: theme.colors.text,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium as any,
  },
  statusDescription: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCardWrapper: {
    width: CARD_WIDTH,
    marginBottom: theme.spacing.md,
  },
  actionCard: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  actionIcon: {
    width: 64,
    height: 64,
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'rgba(1, 204, 102, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    position: 'relative',
  },
  actionTitle: {
    color: theme.colors.text,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold as any,
    marginBottom: theme.spacing.xs,
  },
  actionSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
  },
  notificationBadge: {
    position: 'absolute',
    right: 4,
    top: 4,
    backgroundColor: theme.colors.error,
    borderRadius: theme.borderRadius.full,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: theme.colors.text,
    fontSize: 10,
    fontWeight: theme.fontWeight.bold as any,
  },
}) as any;
