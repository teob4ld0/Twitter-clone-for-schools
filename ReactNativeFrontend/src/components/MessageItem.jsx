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

export default function MessageItem({ message, currentUserId, onDelete }) {
  if (!message) return null;

  // Determine if message is from current user
  const senderId = message.senderId;
  const isOwn = currentUserId != null && senderId != null && senderId == currentUserId;
  const sender = message.sender || {};

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const hasMedia = message.mediaUrl;
  const isVideo = hasMedia && message.mediaUrl.match(/\.(mp4|webm|mov|m4v)$/i);
  const isImage = hasMedia && message.mediaUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i);

  return (
    <View style={[styles.container, isOwn ? styles.ownMessage : styles.otherMessage]}>
      {/* Avatar for other users */}
      {!isOwn && (
        <View style={styles.avatarContainer}>
          {sender.profilePictureUrl ? (
            <Image
              source={{ uri: sender.profilePictureUrl }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {sender.username ? sender.username.charAt(0).toUpperCase() : '?'}
              </Text>
            </View>
          )}
        </View>
      )}

      <View style={[styles.bubble, isOwn ? styles.ownBubble : styles.otherBubble]}>
        {/* Media */}
        {hasMedia && (
          <View style={styles.mediaContainer}>
            {isImage ? (
              <Image
                source={{ uri: message.mediaUrl }}
                style={styles.mediaImage}
                resizeMode="cover"
              />
            ) : isVideo ? (
              <View style={styles.videoPlaceholder}>
                <Feather name="video" size={32} color={isOwn ? colors.white : colors.textSecondary} />
                <Text style={[styles.videoText, isOwn ? styles.videoTextOwn : styles.videoTextOther]}>
                  Video
                </Text>
              </View>
            ) : null}
          </View>
        )}

        {/* Content */}
        {message.content ? (
          <Text style={[styles.text, isOwn ? styles.ownText : styles.otherText]}>
            {message.content}
          </Text>
        ) : null}

        {/* Footer Row */}
        <View style={styles.footer}>
          <Text style={[styles.timestamp, isOwn ? styles.ownTimestamp : styles.otherTimestamp]}>
            {formatTime(message.createdAt)}
          </Text>

          {/* Delete Button (solo para mensajes propios) */}
          {isOwn && onDelete && (
            <TouchableOpacity
              onPress={onDelete}
              style={styles.deleteButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather 
                name="trash-2" 
                size={14} 
                color="rgba(255, 255, 255, 0.7)"
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 5,
    maxWidth: '75%',
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  ownMessage: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  otherMessage: {
    alignSelf: 'flex-start',
  },
  avatarContainer: {
    marginHorizontal: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  bubble: {
    borderRadius: 18,
    padding: 12,
    paddingBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    flex: 1,
  },
  ownBubble: {
    backgroundColor: '#1da1f2',
  },
  otherBubble: {
    backgroundColor: '#f0f0f0',
  },
  mediaContainer: {
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  mediaImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  videoPlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  videoText: {
    marginTop: 8,
    fontSize: 14,
  },
  videoTextOwn: {
    color: colors.white,
  },
  videoTextOther: {
    color: '#666',
  },
  text: {
    fontSize: 15,
    lineHeight: 20,
  },
  ownText: {
    color: colors.white,
  },
  otherText: {
    color: '#000',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  timestamp: {
    fontSize: 11,
  },
  ownTimestamp: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  otherTimestamp: {
    color: '#666',
  },
  deleteButton: {
    marginLeft: 8,
    padding: 4,
  },
});
