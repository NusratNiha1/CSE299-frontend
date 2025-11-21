import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider } from '@/contexts/AuthContext';
import { MonitoringProvider } from '@/contexts/MonitoringContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ToastProvider } from '@/contexts/ToastContext';

export default function RootLayout() {
  useFrameworkReady();

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <MonitoringProvider>
          <ToastProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="login" />
              <Stack.Screen name="register" />
              <Stack.Screen name="forgot-password" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="+not-found" />
            </Stack>
            <StatusBar style="light" />
          </ToastProvider>
        </MonitoringProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
