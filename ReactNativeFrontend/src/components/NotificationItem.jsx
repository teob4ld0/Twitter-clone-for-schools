import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { colors } from '../styles/colors';

// Notification type labels mapping
const notificationTypeLabels = {
  1: 'liked your status',
  2: 'replied to your status',
  3: 'started following you',
  4: 'sent you a message',
  5: 'replied to your reply',
  6: 'mentioned you',
  7: 'reposted your status',
  8: 'quoted your status'
};

export default function NotificationItem({ notification, onMarkAsRead, onPress }) {
  const handleClick = () => {
    // Llamar a onPress del padre para manejar navegación
    if (onPress) {
      onPress(notification);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getTypeLabel = () => {
    // Detectar si es un like/repost/quote sobre una reply
    if (notification.type === 1 && notification.parentStatusId) {
      return 'liked your reply';
    }
    if (notification.type === 7 && notification.parentStatusId) {
      return 'reposted your reply';
    }
    if (notification.type === 8 && notification.quotedParentStatusId) {
      return 'quoted your reply';
    }
    return notificationTypeLabels[notification.type] || 'interacted with you';
  };

  const actorInitial = notification.actor?.username?.charAt(0).toUpperCase() || '?';

  return (
    <TouchableOpacity
      style={[
        styles.container,
        !notification.isRead && styles.unread
      ]}
      onPress={handleClick}
      activeOpacity={0.7}
    >
      {/* Avatar placeholder */}
      <View style={styles.avatarPlaceholder}>
        <Text style={styles.avatarText}>{actorInitial}</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.message}>
          <Text style={styles.username}>
            {notification.actor?.username || 'Someone'}
          </Text>
          <Text style={styles.action}> {getTypeLabel()}</Text>
        </Text>
        <Text style={styles.timestamp}>{formatTime(notification.createdAt)}</Text>
      </View>

      {/* Unread indicator */}
      {!notification.isRead && (
        <View style={styles.unreadDot} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'flex-start',
  },
  unread: {
    backgroundColor: '#f7f9fa',
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  avatarText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  message: {
    fontSize: 14,
    lineHeight: 19.6, // 1.4 line height
    marginBottom: 4,
  },
  username: {
    fontWeight: 'bold',
    color: '#000',
  },
  action: {
    color: '#666',
  },
  timestamp: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    flexShrink: 0,
    marginLeft: 8,
    marginTop: 6,
  },
});
