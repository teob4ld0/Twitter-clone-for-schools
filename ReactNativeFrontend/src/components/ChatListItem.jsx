import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
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
  let messageText = 'No messages yet';
  if (chat.lastMessage) {
    if (typeof chat.lastMessage === 'string') {
      messageText = chat.lastMessage;
    } else if (chat.lastMessage.content) {
      messageText = chat.lastMessage.content;
    } else if (chat.lastMessage.mediaUrl) {
      messageText = 'Media adjunta';
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
        timeText = date.toLocaleString('es-ES', { 
          day: '2-digit', 
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    } catch (e) {
      timeText = '';
    }
  }
  timeText = String(timeText || '');
  
  const hasUnread = Boolean(chat.unreadCount > 0);

  return (
    <TouchableOpacity 
      style={[
        styles.container, 
        selected && styles.selected
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
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.username} numberOfLines={1}>
            {username}
          </Text>
          {hasUnread && <View style={styles.unreadBadge} />}
        </View>
        
        <View style={styles.messageRow}>
          <Text 
            style={styles.lastMessage} 
            numberOfLines={1}
          >
            {messageText}
          </Text>
        </View>
      </View>

      <View style={styles.rightSection}>
        <Text style={styles.timestamp}>{timeText}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  selected: {
    backgroundColor: '#f0f8ff',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e1e8ed',
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0084ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
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
    fontSize: 15,
    fontWeight: '700',
    color: '#14171a',
    flex: 1,
  },
  unreadBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e33',
    marginLeft: 8,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 13,
    color: '#666',
    flex: 1,
  },
  rightSection: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  timestamp: {
    fontSize: 11,
    color: '#999',
  },
});
