import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { fetchNotifications, markAsRead, markAllAsRead } from '../store/notificationSlice';
import NotificationItem from '../components/NotificationItem';
import { useTheme } from '../context/ThemeContext';

export default function NotificationsScreen({ navigation }) {
  const { theme } = useTheme();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { notifications, unreadCount, loading, error } = useSelector((state) => state.notification);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchNotifications());
    setRefreshing(false);
  };

  const handleMarkAsRead = (notificationId) => {
    dispatch(markAsRead(notificationId));
  };

  const handleMarkAllAsRead = () => {
    dispatch(markAllAsRead());
  };

  const handleNotificationPress = (notification) => {
    // Marcar como leída al hacer clic
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }

    // Navegar según el tipo
    if (notification.type === 4) {
      // Message - ir a chats
      navigation.navigate('Chats');
    } else if (notification.type === 3) {
      // Follow - ir al perfil del actor
      navigation.navigate('Profile', { userId: notification.actorId });
    } else if (notification.statusId) {
      // Like/Reply/Mention sobre un status
      navigation.navigate('StatusDetail', { statusId: notification.statusId });
    } else if (notification.threadId) {
      // Fallback: ir al thread (status raíz)
      navigation.navigate('StatusDetail', { statusId: notification.threadId });
    }
  };

  // Header component
  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Notifications</Text>
      {unreadCount > 0 && (
        <TouchableOpacity onPress={handleMarkAllAsRead}>
          <Text style={styles.markAllButton}>Mark all as read</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.cardBackground,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.cardBackground,
    },
    header: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      backgroundColor: theme.colors.cardBackground,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.textPrimary,
    },
    markAllButton: {
      color: theme.colors.primary,
      fontSize: 14,
      fontWeight: '500',
    },
    errorContainer: {
      padding: 16,
      backgroundColor: theme.colors.errorBackground,
    },
    errorText: {
      color: theme.colors.error,
      fontSize: 14,
    },
    emptyContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
      paddingHorizontal: 40,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.textPrimary,
      marginTop: 16,
      marginBottom: 8,
    },
    emptySubtext: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
  });

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      
      {/* Error message */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
        </View>
      )}

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <NotificationItem
            notification={item}
            onMarkAsRead={handleMarkAsRead}
            onPress={() => handleNotificationPress(item)}
          />
        )}
        contentContainerStyle={{ paddingBottom: 80 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="bell" size={64} color={theme.colors.textSecondary} />
            <Text style={styles.emptyText}>No notifications yet</Text>
            <Text style={styles.emptySubtext}>
              When someone interacts with you, you'll see it here
            </Text>
          </View>
        }
      />
    </View>
  );
}


