import { Tabs } from 'expo-router';
import { Home, Settings, LineChart, MessageCircle, LayoutDashboard } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { useMonitoring } from '@/contexts/MonitoringContext';
import { View, Text, StyleSheet } from 'react-native';

export default function TabLayout() {

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.secondary,
          borderTopColor: theme.colors.glassBorder,
          borderTopWidth: 1,
          height: 70,
          paddingBottom: 30,
          paddingTop: 10,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: theme.fontSize.xs,
          fontWeight: theme.fontWeight.medium as any,
        } as any,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ size, color }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ size, color }) => <LayoutDashboard size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="statistics"
        options={{
          title: 'Stats',
          tabBarIcon: ({ size, color }) => <LineChart size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="chatbot"
        options={{
          title: 'Chat',
          tabBarIcon: ({ size, color }) => <MessageCircle size={size} color={color} />,
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ size, color }) => <Settings size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}


