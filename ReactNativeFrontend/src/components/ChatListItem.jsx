import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../styles/colors';

export default function ChatListItem({ chat, onPress, selected, currentUserId }) {
  // Validaciones
  if (!chat?.id || !chat?.otherUser?.username) {
    return null;
  }
  
  const otherUser = chat.otherUser;
  const username = String(otherUser.username || 'Usuario');
  const userInitial = username.charAt(0).toUpperCase();
  
  // Mensaje
  let messageText = 'Sin mensajes';
  if (chat.lastMessage) {
    if (typeof chat.lastMessage === 'string') {
      messageText = chat.lastMessage;
    } else if (chat.lastMessage.content) {
      messageText = chat.lastMessage.content;
    } else if (chat.lastMessage.mediaUrl) {
      messageText = '📷 Media';
    }
  }
  messageText = String(messageText);
  
  // Fecha
  let timeText = '';
  const timestamp = chat.lastMessage?.createdAt || chat.createdAt;
  if (timestamp) {
    try {
      const date = new Date(timestamp);
      if (!isNaN(date.getTime())) {
        const diff = Date.now() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (minutes < 1) timeText = 'ahora';
        else if (minutes < 60) timeText = `${minutes}m`;
        else if (hours < 24) timeText = `${hours}h`;
        else if (days < 7) timeText = `${days}d`;
        else timeText = date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
      }
    } catch (e) {
      timeText = '';
    }
  }
  timeText = String(timeText || '');
  
  const hasUnread = Boolean(chat.unreadCount > 0);
  const badgeText = chat.unreadCount > 99 ? '99+' : String(chat.unreadCount || '');

  return (
    <TouchableOpacity 
      style={[
        styles.container, 
        selected && styles.selected,
        hasUnread && styles.unread
      ]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        {otherUser.profilePictureUrl ? (
          <Image
            source={{ uri: String(otherUser.profilePictureUrl) }}
            style={styles.avatar}
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{userInitial}</Text>
          </View>
        )}
        {hasUnread ? <View style={styles.onlineDot} /> : null}
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.username} numberOfLines={1}>
            {'@' + username}
          </Text>
          <Text style={styles.timestamp}>{timeText}</Text>
        </View>
        
        <View style={styles.messageRow}>
          <Text 
            style={[styles.lastMessage, hasUnread && styles.lastMessageUnread]} 
            numberOfLines={1}
          >
            {messageText}
          </Text>
          {hasUnread ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badgeText}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <Feather name="chevron-right" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
  },
  selected: {
    backgroundColor: '#e8f5fe',
  },
  unread: {
    backgroundColor: '#f0f8ff',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.backgroundSecondary,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.white,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    flex: 1,
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  lastMessageUnread: {
    fontWeight: '600',
    color: '#000',
  },
  badge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  badgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
});
