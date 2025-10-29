import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { MessageCircle } from 'lucide-react-native';
import { theme } from '@/constants/theme';

interface FloatingChatButtonProps {
  onPress: () => void;
  style?: ViewStyle;
}

export function FloatingChatButton({ onPress, style }: FloatingChatButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1400,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const onPressIn = () => {
    Animated.spring(scale, { toValue: 0.94, useNativeDriver: true, friction: 6 }).start();
  };
  const onPressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 6 }).start();
  };

  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} style={[styles.wrapper, style]}
      accessibilityLabel="Open childcare chatbot"
      accessibilityRole="button"
    >
      <Animated.View
        style={[
          styles.pulse,
          {
            transform: [
              {
                scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.6] }),
              },
            ],
            opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0] }),
          },
        ]}
        pointerEvents="none"
      />
      <Animated.View style={[styles.button, { transform: [{ scale }] }]}>
        <MessageCircle color={theme.colors.text} size={26} />
      </Animated.View>
    </Pressable>
  );
}

const SIZE = 60;
const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    right: 16,
    bottom: 24,
  },
  pulse: {
    position: 'absolute',
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: theme.colors.primary,
  },
  button: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
});
