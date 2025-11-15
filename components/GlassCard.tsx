import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, ViewStyle, Animated, Easing, StyleProp } from 'react-native';
import { theme } from '@/constants/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  className?: string;
  contentClassName?: string;
}

export function GlassCard({ children, style, className, contentClassName }: GlassCardProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translate = useRef(new Animated.Value(6)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 320, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(translate, { toValue: 0, duration: 320, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();
  }, [opacity, translate]);

  return (
    <Animated.View style={[styles.container, style, { opacity, transform: [{ translateY: translate }] }]}>
      <View className={className as any}>
        <View style={styles.content} className={contentClassName as any}>
          {children}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  content: {
    padding: theme.spacing.md,
    backgroundColor: 'transparent',
  },
});
