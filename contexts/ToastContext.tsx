import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { theme } from '@/constants/theme';
import { CheckCircle, AlertTriangle, Info } from 'lucide-react-native';

type ToastType = 'success' | 'error' | 'info';

type ToastItem = {
  id: string;
  message: string;
  type: ToastType;
  duration?: number; // ms
};

type ToastContextValue = {
  show: (message: string, type?: ToastType, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const opacity = useRef(new Animated.Value(0)).current;
  const translate = useRef(new Animated.Value(10)).current;

  const animateIn = useCallback(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 220, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(translate, { toValue: 0, duration: 220, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();
  }, [opacity, translate]);

  const animateOut = useCallback((cb?: () => void) => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 180, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      Animated.timing(translate, { toValue: 10, duration: 180, easing: Easing.in(Easing.quad), useNativeDriver: true }),
    ]).start(() => cb?.());
  }, [opacity, translate]);

  const removeToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

  const show = useCallback((message: string, type: ToastType = 'info', duration = 2400) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const toast: ToastItem = { id, message, type, duration };
    setToasts(prev => [...prev, toast]);
    // Kick in animation for the container
    animateIn();
    // Auto dismiss
    setTimeout(() => {
      animateOut(() => removeToast(id));
    }, duration);
  }, [animateIn, animateOut]);

  const value = useMemo<ToastContextValue>(() => ({
    show,
    success: (m, d) => show(m, 'success', d),
    error: (m, d) => show(m, 'error', d),
    info: (m, d) => show(m, 'info', d),
  }), [show]);

  const iconFor = (type: ToastType) => {
    switch (type) {
      case 'success': return <CheckCircle size={18} color={theme.colors.success} />;
      case 'error': return <AlertTriangle size={18} color={theme.colors.error} />;
      default: return <Info size={18} color={theme.colors.text} />;
    }
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast stack */}
      <Animated.View
        pointerEvents="box-none"
        style={[styles.container, { opacity, transform: [{ translateY: translate }] }]}
      >
        {toasts.map(t => (
          <View key={t.id} style={styles.toastWrap}>
            <BlurView intensity={40} tint="dark" style={styles.toastBlur} />
            <View style={styles.toastTint} />
            <View style={styles.toastContent}>
              <View style={styles.icon}>{iconFor(t.type)}</View>
              <Text numberOfLines={3} style={styles.message}>{t.message}</Text>
              <Pressable onPress={() => animateOut(() => removeToast(t.id))} style={styles.dismissArea}>
                <Text style={styles.dismissText}>✕</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </Animated.View>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 20,
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  toastWrap: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    marginBottom: theme.spacing.sm,
  },
  toastBlur: {
    ...StyleSheet.absoluteFillObject,
  },
  toastTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8, 18, 12, 0.32)',
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  icon: {
    marginRight: 10,
  },
  message: {
    color: theme.colors.text,
    fontSize: theme.fontSize.md,
    flex: 1,
  },
  dismissArea: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },
  dismissText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
});
