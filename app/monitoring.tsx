import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { ArrowLeft, Video, AlertCircle, PlayCircle } from 'lucide-react-native';
import { useMonitoring } from '@/contexts/MonitoringContext';
import { GlassCard } from '@/components/GlassCard';
import { ui } from '@/constants/ui';
import { theme } from '@/constants/theme';

export default function MonitoringScreen() {
  const router = useRouter();
  const { devices, cryEvents, isMonitoring } = useMonitoring();
  const [isCrying, setIsCrying] = useState(false);

  const pulseScale = useSharedValue(1);
  const waveOpacity = useSharedValue(0.3);

  useEffect(() => {
    if (isCrying) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 500 }),
          withTiming(1, { duration: 500 })
        ),
        -1,
        false
      );
    } else {
      pulseScale.value = withTiming(1, { duration: 300 });
    }
  }, [isCrying, pulseScale]);

  useEffect(() => {
    waveOpacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 1000, easing: Easing.ease }),
        withTiming(0.3, { duration: 1000, easing: Easing.ease })
      ),
      -1,
      false
    );
  }, [waveOpacity]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const waveStyle = useAnimatedStyle(() => ({
    opacity: waveOpacity.value,
  }));

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
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
        <Text style={styles.headerTitle}>Infant Monitoring</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {!isMonitoring ? (
          <GlassCard style={styles.notActiveCard} className={ui.cardContainer} contentClassName={ui.cardContent + ' items-center py-xxl'}>
            <AlertCircle size={48} color={theme.colors.warning} />
            <Text style={styles.notActiveTitle} className="text-text text-xl font-bold mt-lg mb-sm">No Active Device</Text>
            <Text style={styles.notActiveText} className="text-textSecondary text-md text-center mb-xl">
              Connect a monitoring device to start live monitoring
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/settings')}
              style={styles.setupButton}
            >
              <Text style={styles.setupButtonText} className="text-text text-md font-bold">Setup Device</Text>
            </TouchableOpacity>
          </GlassCard>
        ) : (
          <>
            <GlassCard style={styles.liveCard} className={ui.cardContainer} contentClassName={ui.cardContent}>
              <View style={styles.liveHeader}>
                <View style={styles.liveIndicator} className="flex-row items-center bg-[rgba(255,0,0,0.1)] px-md py-sm rounded-full">
                  <Animated.View style={[styles.liveDot, waveStyle]} />
                  <Text style={styles.liveText} className="text-error text-xs font-bold">LIVE</Text>
                </View>
                <Text style={styles.deviceName} className="text-textSecondary text-sm">{devices[0]?.device_name}</Text>
              </View>

              <View style={styles.videoPlaceholder}>
                <Animated.View style={[styles.waveformContainer, pulseStyle]}>
                  <Video
                    size={64}
                    color={isCrying ? theme.colors.error : theme.colors.primary}
                  />
                </Animated.View>
                {isCrying && (
                  <View style={styles.alertBanner}>
                    <AlertCircle size={20} color={theme.colors.text} />
                    <Text style={styles.alertText}>Cry Detected!</Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                onPress={() => setIsCrying(!isCrying)}
                style={styles.testButton}
              >
                <Text style={styles.testButtonText}>
                  {isCrying ? 'Stop Alert' : 'Test Cry Detection'}
                </Text>
              </TouchableOpacity>
            </GlassCard>

            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle} className="text-text text-lg font-bold">Recent Events</Text>
              <Text style={styles.historyCount} className="text-textSecondary text-sm">
                {cryEvents.length} event{cryEvents.length !== 1 ? 's' : ''}
              </Text>
            </View>

            {cryEvents.length === 0 ? (
              <GlassCard style={styles.emptyCard} className={ui.cardContainer} contentClassName={ui.cardContent + ' items-center py-xl'}>
                <Text style={styles.emptyText} className="text-textSecondary text-md">No cry events detected yet</Text>
              </GlassCard>
            ) : (
              <View style={styles.eventsList}>
                {cryEvents.slice(0, 10).map((event) => (
                  <GlassCard key={event.id} style={styles.eventCard} className={ui.cardContainer} contentClassName={ui.cardContent}>
                    <View style={styles.eventHeader}>
                      <View style={styles.eventIcon}>
                        <PlayCircle size={20} color={theme.colors.primary} />
                      </View>
                      <View style={styles.eventInfo}>
                        <Text style={styles.eventTime} className="text-text text-md font-medium">
                          {formatTime(event.detected_at)}
                        </Text>
                        <Text style={styles.eventDate} className="text-textSecondary text-xs mt-[2px]">
                          {formatDate(event.detected_at)}
                        </Text>
                      </View>
                      <View style={styles.eventMeta}>
                        <Text style={styles.eventDuration} className="text-primary text-sm font-medium">
                          {event.duration_seconds}s
                        </Text>
                        <Text style={styles.eventConfidence} className="text-textSecondary text-xs mt-[2px]">
                          {Math.round(event.confidence_level * 100)}%
                        </Text>
                      </View>
                    </View>
                  </GlassCard>
                ))}
              </View>
            )}
          </>
        )}
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
  notActiveCard: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  notActiveTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  notActiveText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  setupButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.md,
  },
  setupButtonText: {
    color: theme.colors.text,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
  },
  liveCard: {
    marginBottom: theme.spacing.xl,
  },
  liveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.error,
    marginRight: theme.spacing.sm,
  },
  liveText: {
    color: theme.colors.error,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
  },
  deviceName: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
  },
  videoPlaceholder: {
    height: 250,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  waveformContainer: {
    width: 120,
    height: 120,
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'rgba(1, 204, 102, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertBanner: {
    position: 'absolute',
    top: theme.spacing.lg,
    left: theme.spacing.lg,
    right: theme.spacing.lg,
    backgroundColor: theme.colors.error,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertText: {
    color: theme.colors.text,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    marginLeft: theme.spacing.sm,
  },
  testButton: {
    marginTop: theme.spacing.lg,
    backgroundColor: 'rgba(1, 204, 102, 0.1)',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  testButtonText: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  historyTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  historyCount: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  emptyText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.md,
  },
  eventsList: {
    gap: theme.spacing.md,
  },
  eventCard: {
    marginBottom: theme.spacing.md,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'rgba(1, 204, 102, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  eventInfo: {
    flex: 1,
  },
  eventTime: {
    color: theme.colors.text,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
  },
  eventDate: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
    marginTop: 2,
  },
  eventMeta: {
    alignItems: 'flex-end',
  },
  eventDuration: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
  },
  eventConfidence: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
    marginTop: 2,
  },
});
