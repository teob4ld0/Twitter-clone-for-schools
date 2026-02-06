import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import ImageViewer from './ImageViewer';
import { Feather } from '@expo/vector-icons';
import { colors } from '../styles/colors';

export default function MessageItem({ message, currentUserId, onDelete }) {
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  
  if (!message) return null;

  // Determine if message is from current user
  const senderId = message.senderId;
  const isOwn = currentUserId != null && senderId != null && senderId == currentUserId;
  const sender = message.sender || {};

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
        <View style={styles.contentWrapper}>
          <View style={styles.messageContent}>
            {/* Content */}
            {message.content ? (
              <Text style={[styles.text, isOwn ? styles.ownText : styles.otherText]}>
                {message.content}
              </Text>
            ) : null}

            {/* Media */}
            {hasMedia && (
              <View style={styles.mediaContainer}>
                {isImage ? (
                  <TouchableOpacity onPress={() => setImageViewerVisible(true)}>
                    <Image
                      source={{ uri: message.mediaUrl }}
                      style={styles.mediaImage}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
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

            {/* Meta Info */}
            <Text style={[styles.metaText, isOwn ? styles.ownMeta : styles.otherMeta]}>
              {isOwn ? (message.isRead ? 'Leído' : 'Enviado') : (sender?.username || 'Desconocido')}
            </Text>
          </View>

          {/* Delete Button - discreto como en web */}
          {isOwn && onDelete && (
            <TouchableOpacity
              onPress={onDelete}
              style={styles.deleteButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.deleteButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
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
    backgroundColor: '#0084ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  bubble: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '85%',
  },
  ownBubble: {
    backgroundColor: '#0084ff',
  },
  otherBubble: {
    backgroundColor: '#f1f1f1',
  },
  contentWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  messageContent: {
    flexShrink: 1,
  },
  text: {
    fontSize: 14,
    lineHeight: 18,
  },
  ownText: {
    color: '#fff',
  },
  otherText: {
    color: '#111',
  },
  mediaContainer: {
    marginTop: 8,
    borderRadius: 10,
    overflow: 'hidden',
  },
  mediaImage: {
    width: 240,
    height: 240,
    borderRadius: 10,
  },
  videoPlaceholder: {
    width: 240,
    height: 240,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  videoText: {
    marginTop: 8,
    fontSize: 12,
  },
  videoTextOwn: {
    color: '#fff',
  },
  videoTextOther: {
    color: '#666',
  },
  metaText: {
    fontSize: 11,
    marginTop: 6,
  },
  ownMeta: {
    color: 'rgba(255, 255, 255, 0.85)',
  },
  otherMeta: {
    color: '#666',
  },
  deleteButton: {
    paddingTop: 2,
    paddingLeft: 4,
  },
  deleteButtonText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 16,
  },
});
