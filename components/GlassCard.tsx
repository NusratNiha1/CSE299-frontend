import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, ViewStyle, Animated, Easing, StyleProp, ImageBackground, ImageSourcePropType } from 'react-native';
import { theme } from '@/constants/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  className?: string;
  contentClassName?: string;
  /** Optional background image for the entire card (behind content). */
  backgroundImage?: string | ImageSourcePropType;
  /** Optional overlay color above the background image. Set to 'transparent' or undefined to disable. */
  overlayColor?: string;
}

export function GlassCard({ children, style, className, contentClassName, backgroundImage, overlayColor }: GlassCardProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translate = useRef(new Animated.Value(6)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 320, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(translate, { toValue: 0, duration: 320, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();
  }, [opacity, translate]);

  const bgSource: ImageSourcePropType | undefined =
    typeof backgroundImage === 'string' ? { uri: backgroundImage } : backgroundImage;

  return (
    <Animated.View style={[styles.container, style, { opacity, transform: [{ translateY: translate }] }]}>
      {bgSource ? (
        <ImageBackground
          source={bgSource}
          style={styles.bgImage}
          imageStyle={styles.bgImageRadius}
          resizeMode="cover"
        >
          {/* Optional tint for readability */}
          {overlayColor !== 'transparent' && overlayColor !== undefined && (
            <View pointerEvents="none" style={[styles.bgOverlay, { backgroundColor: overlayColor }]} />
          )}
          <View className={className as any}>
            <View style={styles.content} className={contentClassName as any}>
              {children}
            </View>
          </View>
        </ImageBackground>
      ) : (
        <View className={className as any}>
          <View style={styles.content} className={contentClassName as any}>
            {children}
          </View>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    backgroundColor: theme.colors.background,
    
  },
  bgImage: {
    width: '100%',
  },
  bgImageRadius: {
    borderRadius: theme.borderRadius.md,
  },
  bgOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(6, 28, 18, 0.35)', // default dark green translucent tint
  },
  content: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
});
