import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Easing, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Baby, Video, Bell, Settings as SettingsIcon, LogOut, AlertTriangle, CheckCircle } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useMonitoring } from '@/contexts/MonitoringContext';
import { GlassCard } from '@/components/GlassCard';
import { theme } from '@/constants/theme';
import { ui } from '@/constants/ui';

export default function DashboardScreen() {
  const router = useRouter();
  const { profile, signOut, isEmailVerified, user } = useAuth();
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

  // Demo data for UI preview
  const demoNotifications = [
    { id: 'n1', title: 'Cry detected', subtitle: 'Bedroom • 10:42 AM', type: 'cry' as const, read: false },
 
    { id: 'n3', title: 'Device connected', subtitle: 'Camera A • 8:51 AM', type: 'device' as const, read: true },
    { id: 'n4', title: 'Low battery', subtitle: 'Camera B • 8:20 AM', type: 'battery' as const, read: true },
    { id: 'n5', title: 'Noise spike', subtitle: 'Bedroom • 7:55 AM', type: 'noise' as const, read: true },
  ];

  const demoStats = [
    { key: 'cries', label: 'Cries Today', value: 2 },
   
    { key: 'active', label: 'Active Time', value: '2h 14m' },
  ];

  const demoAlerts = [
    { id: 'a1', severity: 'high' as const, message: 'Prolonged crying detected', time: '10:42 AM' },
    
    { id: 'a3', severity: 'low' as const, message: 'Device A reconnected', time: '8:51 AM' },
  ];

  return (
    <LinearGradient
      colors={[theme.colors.background, theme.colors.secondary]}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Top Bar */}
        <View style={styles.header}>
          <View>
            <Text style={styles.screenTitle}>Dashboard</Text>
            <Text style={styles.greeting}>Hi, {profile?.full_name?.split(' ')[0] || 'there'}</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton} accessibilityRole="button" accessibilityLabel="Sign out">
            <LogOut size={22} color={theme.colors.error} />
          </TouchableOpacity>
        </View>

        {!isEmailVerified && user?.email && (
          <View style={styles.verifyBanner}>
            <Text style={styles.verifyTitle}>Verify your account</Text>
            <Text style={styles.verifyText}>
              We sent a verification link to {user.email}. Please verify your email to unlock
              notifications and device features.
            </Text>
          </View>
        )}

        {/* Hero Glass + Image BG with Frosted Panel */}
        <GlassCard
          style={styles.statusCard}
          className={ui.cardContainer}
          contentClassName={ui.cardContent}
          backgroundImage={
            'https://images.unsplash.com/photo-1709052602790-b73e81afab70?auto=format&fit=crop&w=1400&q=60'
          }
          overlayColor="transparent"
        >
          <View style={styles.frostPanel}>
            {/* Actual blur lives behind content as an absolute overlay */}
            <BlurView intensity={90} tint="dark" style={styles.frostBlur} />
            {/* Slight green tint on top of blur for mood */}
            <View pointerEvents="none" style={styles.frostTint} />
            <View style={styles.statusHeader}>
              <Baby size={28} color={theme.colors.primary} />
              <View style={styles.statusPill}>
                <View
                  style={[styles.statusDot, { backgroundColor: isMonitoring ? theme.colors.success : theme.colors.textSecondary }]}
                />
                <Text style={styles.statusText}>{isMonitoring ? 'Active' : 'Idle'}</Text>
              </View>
            </View>
            <Text style={styles.balanceLabel}>Monitoring Status</Text>
            <Text style={styles.balanceValue}>{isMonitoring ? 'Live Monitoring' : 'Not Monitoring'}</Text>
          </View>

          {/* Quick stats below the panel */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statTitle}>Devices</Text>
              <Text style={styles.statValue}>{devices.length}</Text>
            </View>
            <View style={[styles.statBox, styles.statDivider]}>
              <Text style={styles.statTitle}>Alerts</Text>
              <Text style={styles.statValue}>{unreadCount}</Text>
            </View>
          </View>
        </GlassCard>

        {/* Quick Actions */}
        <View style={styles.actionsGrid}>
          <Animated.View style={{ opacity: a1, transform: [{ translateY: a1.interpolate({ inputRange: [0,1], outputRange: [12,0] }) }] }}>
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

          <Animated.View style={{ opacity: a2, transform: [{ translateY: a2.interpolate({ inputRange: [0,1], outputRange: [12,0] }) }] }}>
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

          <Animated.View style={{ opacity: a3, transform: [{ translateY: a3.interpolate({ inputRange: [0,1], outputRange: [12,0] }) }] }}>
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

        {/* Recent Activity */}
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <GlassCard style={{ marginBottom: theme.spacing.md }} className={ui.cardContainer} contentClassName={ui.cardContent}>
          {demoNotifications.slice(0, 3).map((item, idx, arr) => (
            <View key={item.id} style={[styles.activityRow, idx < arr.length - 1 && styles.rowDivider]}>
              <View style={[styles.activityIcon, { backgroundColor: 'rgba(255,255,255,0.06)' }]}>
                <Bell size={18} color={theme.colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.activityTitle}>{item.title}</Text>
                <Text style={styles.activitySubtitle}>{item.subtitle}</Text>
              </View>
              <View style={styles.amountPill}>
                <Text style={styles.amountPillText}>{item.read ? 'Seen' : 'New'}</Text>
              </View>
            </View>
          ))}
        </GlassCard>

        {/* Quick Stats (Demo) */}
        <Text style={styles.sectionTitle}>Quick Stats</Text>
        <GlassCard style={{ marginBottom: theme.spacing.md }} className={ui.cardContainer} contentClassName={ui.cardContent}>
          <View style={styles.smallStatGrid}>
            {demoStats.map((s) => (
              <View key={s.key} style={styles.smallStatBox}>
                <Text style={styles.smallStatLabel}>{s.label}</Text>
                <Text style={styles.smallStatValue}>{s.value}</Text>
              </View>
            ))}
          </View>
        </GlassCard>

        {/* Alerts (Demo) */}
        <Text style={styles.sectionTitle}>Alerts</Text>
        <GlassCard style={{ marginBottom: theme.spacing.xxl }} className={ui.cardContainer} contentClassName={ui.cardContent}>
          {demoAlerts.map((a, idx, arr) => {
            const color = a.severity === 'high' ? theme.colors.error : a.severity === 'medium' ? theme.colors.warning : theme.colors.success;
            const Icon = a.severity === 'low' ? CheckCircle : AlertTriangle;
            return (
              <View key={a.id} style={[styles.activityRow, idx < arr.length - 1 && styles.rowDivider]}>
                <View style={[styles.activityIcon, { backgroundColor: 'rgba(255,255,255,0.06)' }]}>
                  <Icon size={18} color={color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.activityTitle}>{a.message}</Text>
                  <Text style={styles.activitySubtitle}>{a.time}</Text>
                </View>
                <View style={[styles.severityPill, { borderColor: color }] }>
                  <Text style={[styles.severityPillText, { color }]}>{a.severity.toUpperCase()}</Text>
                </View>
              </View>
            );
          })}
        </GlassCard>
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
  screenTitle: {
    fontSize: theme.fontSize.xl,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.bold as any,
  },
  greeting: {
    marginTop: 4,
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  verifyBanner: {
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: 'rgba(255, 193, 7, 0.08)',
    borderWidth: 1,
    borderColor: theme.colors.warning,
  },
  verifyTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.warning,
    marginBottom: theme.spacing.xs,
  },
  verifyText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  logoutButton: {
    padding: theme.spacing.sm,
  },
  statusCard: {
    marginBottom: theme.spacing.xl,
  },
  frostPanel: {
    position: 'relative',
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    
  },
  frostBlur: {
    ...StyleSheet.absoluteFillObject,
  },
  frostTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(4, 20, 12, 0.18)',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: theme.spacing.md,
    backgroundColor: 'rgba(255,255,255,0.06)',
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
  balanceLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    marginBottom: 4,
  },
  balanceValue: {
    color: theme.colors.text,
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold as any,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statBox: {
    flex: 1,
    paddingVertical: theme.spacing.md,
  },
  statDivider: {
    alignItems: 'flex-end',
  },
  statTitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    marginBottom: 2,
  },
  statValue: {
    color: theme.colors.text,
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold as any,
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
  sectionTitle: {
    color: theme.colors.text,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold as any,
    marginBottom: theme.spacing.md,
  },
  smallStatGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  smallStatBox: {
    width: '31%',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  smallStatLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
    marginBottom: 4,
  },
  smallStatValue: {
    color: theme.colors.text,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold as any,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.glassBorder,
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  activityTitle: {
    color: theme.colors.text,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium as any,
  },
  activitySubtitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    marginTop: 2,
  },
  amountPill: {
    backgroundColor: 'rgba(1, 204, 102, 0.12)',
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
  },
  amountPillText: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold as any,
  },
  severityPill: {
    borderWidth: 1,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
  },
  severityPillText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold as any,
  },
}) as any;
