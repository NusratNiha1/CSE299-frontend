import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { User, Smartphone, Bell, ChevronRight } from 'lucide-react-native';
import { GlassCard } from '@/components/GlassCard';
import { theme } from '@/constants/theme';
import { ui } from '@/constants/ui';

export default function SettingsScreen() {
  const router = useRouter();

  const settingsSections = [
    {
      title: 'Profile',
      icon: User,
      items: [
        {
          label: 'Edit Profile',
          description: 'Update name, username, and avatar',
          route: '/settings/profile',
        },
      ],
    },
    {
      title: 'Devices',
      icon: Smartphone,
      items: [
        {
          label: 'Manage Devices',
          description: 'Add or remove monitoring devices',
          route: '/settings/devices',
        },
      ],
    },
    {
      title: 'Notifications',
      icon: Bell,
      items: [
        {
          label: 'Alert Settings',
          description: 'Configure push notifications and sounds',
          route: '/settings/alerts',
        },
      ],
    },
  ];

  return (
    <LinearGradient
      colors={[theme.colors.background, theme.colors.secondary]}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle} className="text-text text-2xl font-bold">Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {settingsSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <View style={styles.sectionHeader}>
              <section.icon size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle} className="text-text text-md font-bold ml-sm">{section.title}</Text>
            </View>

            <GlassCard className={ui.cardContainer} contentClassName={ui.cardContent}>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  onPress={() => router.push(item.route as any)}
                  style={[
                    styles.settingItem,
                    itemIndex < section.items.length - 1 && styles.settingItemBorder,
                  ]}
                >
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel} className="text-text text-md font-medium mb-xs">{item.label}</Text>
                    <Text style={styles.settingDescription} className="text-textSecondary text-sm">{item.description}</Text>
                  </View>
                  <ChevronRight size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              ))}
            </GlassCard>
          </View>
        ))}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 60,
    paddingBottom: theme.spacing.md,
  },
  headerTitle: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  scrollContent: {
    padding: theme.spacing.lg,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
  },
  settingItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.glassBorder,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  settingDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
});
