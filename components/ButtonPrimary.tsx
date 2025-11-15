import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@/constants/theme';

interface ButtonPrimaryProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  variant?: 'primary' | 'secondary' | 'danger';
  className?: string;
  textClassName?: string;
}

export function ButtonPrimary({
  title,
  onPress,
  loading = false,
  disabled = false,
  style,
  textStyle,
  variant = 'primary',
  className,
  textClassName,
}: ButtonPrimaryProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const getColors = () => {
    switch (variant) {
      case 'secondary':
        return ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)'];
      case 'danger':
        return ['#FF4444', '#CC0000'];
      default:
        return [theme.colors.primary, '#00AA52'];
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      onPressIn={() => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, friction: 6 }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 6 }).start()}
      style={[styles.container, style as any]}
      className={className as any}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <LinearGradient
          colors={getColors() as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.text} />
          ) : (
            <Text style={[styles.text, textStyle as any]} className={textClassName as any}>
              {title}
            </Text>
          )}
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  gradient: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  text: {
    color: theme.colors.text,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold as any,
  },
}) as any;
