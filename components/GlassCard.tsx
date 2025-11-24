import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '@/constants/theme';

interface CardProps {
  children: React.ReactNode;
  variant?: 'elevated' | 'filled' | 'outlined';
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  className?: string;
  contentClassName?: string;
}

export function GlassCard({
  children,
  variant = 'filled',
  style,
  contentStyle,
  className,
  contentClassName,
}: CardProps) {
  const getCardStyle = () => {
    const baseStyle = [styles.card];

    switch (variant) {
      case 'elevated':
        return [...baseStyle, styles.elevated, theme.elevation.level1];
      case 'filled':
        return [...baseStyle, styles.filled];
      case 'outlined':
        return [...baseStyle, styles.outlined];
      default:
        return [...baseStyle, styles.filled];
    }
  };

  return (
    <View
      style={[...getCardStyle(), style]}
      className={className as any}
    >
      <View style={[styles.content, contentStyle]} className={contentClassName as any}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  elevated: {
    backgroundColor: theme.colors.surfaceContainerLow,
  },
  filled: {
    backgroundColor: theme.colors.surfaceContainerHighest,
  },
  outlined: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
  },
  content: {
    padding: theme.spacing.md,
  },
});
