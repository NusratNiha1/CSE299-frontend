import React, { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Bell, X } from 'lucide-react-native';
import { theme } from '@/constants/theme';

interface NotificationPopupProps {
  title: string;
  message: string;
  visible: boolean;
  onDismiss: () => void;
  type?: 'info' | 'warning' | 'error';
}

export function NotificationPopup({
  title,
  message,
  visible,
  onDismiss,
  type = 'info',
}: NotificationPopupProps) {
  const translateY = useSharedValue(-200);
  const opacity = useSharedValue(0);

  const handleDismiss = useCallback(() => {
    translateY.value = withTiming(-200, { duration: 300 });
    opacity.value = withTiming(0, { duration: 300 });
    setTimeout(onDismiss, 300);
  }, [onDismiss, opacity, translateY]);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 15 });
      opacity.value = withTiming(1, { duration: 300 });

      const timer = setTimeout(() => {
        runOnJS(handleDismiss)();
      }, 5000);

      return () => clearTimeout(timer);
    } else {
      translateY.value = withTiming(-200, { duration: 300 });
      opacity.value = withTiming(0, { duration: 300 });
    }
  }, [visible, handleDismiss, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const getAccentColor = () => {
    switch (type) {
      case 'warning':
        return theme.colors.warning;
      case 'error':
        return theme.colors.error;
      default:
        return theme.colors.primary;
    }
  };

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.08)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={[styles.accent, { backgroundColor: getAccentColor() }]} />
        <View style={styles.iconContainer}>
          <Bell size={24} color={getAccentColor()} />
        </View>
        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
        </View>
        <TouchableOpacity onPress={handleDismiss} style={styles.closeButton}>
          <X size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: theme.spacing.md,
    right: theme.spacing.md,
    zIndex: 1000,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  accent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  iconContainer: {
    marginLeft: theme.spacing.sm,
    marginRight: theme.spacing.md,
  },
  content: {
    flex: 1,
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    marginBottom: theme.spacing.xs,
  },
  message: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
});
