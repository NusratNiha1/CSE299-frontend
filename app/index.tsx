import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Baby } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { theme } from '@/constants/theme';

export default function SplashScreen() {
  const router = useRouter();
  const { session, loading } = useAuth();
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 3 });
    opacity.value = withTiming(1, { duration: 800, easing: Easing.ease });

    const timer = setTimeout(() => {
      if (!loading) {
        if (session) {
          router.replace('/(tabs)');
        } else {
          router.replace('/login');
        }
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [loading, session, router, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <LinearGradient
      colors={[theme.colors.background, theme.colors.secondary, theme.colors.background]}
      style={styles.container}
    >
      <Animated.View style={[styles.logoContainer, animatedStyle]}>
        <View style={styles.iconWrapper}>
          <Baby size={80} color={theme.colors.primary} strokeWidth={2} />
        </View>
        <Text style={styles.title}>Child Monitoring</Text>
        <Text style={styles.subtitle}>Keeping your baby safe</Text>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  iconWrapper: {
    width: 120,
    height: 120,
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'rgba(1, 204, 102, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  title: {
    fontSize: theme.fontSize.xxxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
});
