import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Bell, CheckCheck } from 'lucide-react-native';
import { useMonitoring } from '@/contexts/MonitoringContext';
import { GlassCard } from '@/components/GlassCard';
// import { ButtonPrimary } from '@/components/ButtonPrimary';
import { theme } from '@/constants/theme';
import { ui } from '@/constants/ui';

export default function NotificationsScreen() {
  const { notifications, markNotificationRead, markAllNotificationsRead, unreadCount } =
    useMonitoring();

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderNotification = ({ item }: any) => (
    <TouchableOpacity
      onPress={() => !item.is_read && markNotificationRead(item.id)}
      activeOpacity={0.7}
    >
      <GlassCard
        style={[
          styles.notificationCard,
          !item.is_read && styles.notificationCardUnread,
        ]}
        className={ui.cardContainer}
        contentClassName={ui.cardContent}
      >
        <View style={styles.notificationHeader}>
          <View
            style={[
              styles.notificationIcon,
              !item.is_read && styles.notificationIconUnread,
            ]}
          >
            <Bell size={20} color={theme.colors.primary} />
          </View>
          <View style={styles.notificationContent}>
            <Text
              style={[
                styles.notificationTitle,
                !item.is_read && styles.notificationTitleUnread,
              ]}
            >
              {item.title}
            </Text>
            <Text style={styles.notificationMessage}>{item.message}</Text>
            <Text style={styles.notificationTime}>{formatTime(item.sent_at)}</Text>
          </View>
          {!item.is_read && <View style={styles.unreadDot} />}
        </View>
      </GlassCard>
    </TouchableOpacity>
  );

  return (
    <LinearGradient
      colors={[theme.colors.background, theme.colors.secondary]}
      style={styles.container}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <Text style={styles.unreadCount}>
              {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
            </Text>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={markAllNotificationsRead}
            style={styles.markAllButton}
          >
            <CheckCheck size={20} color={theme.colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <GlassCard style={styles.emptyCard} className={ui.cardContainer} contentClassName={ui.cardContent + ' items-center py-xxl'}>
            <Bell size={48} color={theme.colors.textSecondary} />
            <Text style={styles.emptyTitle} className="text-text text-lg font-bold mt-lg mb-sm">No Notifications</Text>
            <Text style={styles.emptyText} className="text-textSecondary text-md text-center">
              You’ll see cry detection alerts here
            </Text>
          </GlassCard>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 60,
    paddingBottom: theme.spacing.md,
  },
  headerTitle: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  unreadCount: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  markAllButton: {
    padding: theme.spacing.sm,
  },
  listContent: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  notificationCard: {
    marginBottom: theme.spacing.md,
  },
  notificationCardUnread: {
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  notificationIconUnread: {
    backgroundColor: 'rgba(1, 204, 102, 0.1)',
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  notificationTitleUnread: {
    fontWeight: theme.fontWeight.bold,
  },
  notificationMessage: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  notificationTime: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primary,
    marginTop: theme.spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  emptyTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});
