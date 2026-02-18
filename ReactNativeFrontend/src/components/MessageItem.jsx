import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import ImageViewer from './ImageViewer';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { isEncrypted, deriveChatKey, decryptMessage } from '../services/cryptoService';
import { useTranslation } from 'react-i18next';

export default function MessageItem({ message, currentUserId, onDelete, myHash, otherHash }) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [imageViewerVisible, setImageViewerVisible] = useState(false);

  const decryptedContent = useMemo(() => {
    if (!message?.content || !isEncrypted(message.content) || !myHash || !otherHash) return message?.content;
    const key = deriveChatKey(myHash, otherHash);
    return key ? decryptMessage(key, message.content) : message.content;
  }, [message?.content, myHash, otherHash]);
  
  if (!message) return null;

  // Determine if message is from current user
  const senderId = message.senderId;
  const isOwn = currentUserId != null && senderId != null && senderId == currentUserId;
  const sender = message.sender || {};

  const hasMedia = message.mediaUrl;
  const isVideo = hasMedia && message.mediaUrl.match(/\.(mp4|webm|mov|m4v)$/i);
  const isImage = hasMedia && message.mediaUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i);

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
      backgroundColor: theme.colors.chatMessageOwn,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      color: theme.colors.chatMessageOwnText,
      fontSize: 14,
      fontWeight: 'bold',
    },
    bubble: {
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
      maxWidth: '85%',
      position: 'relative',
    },
    ownBubble: {
      backgroundColor: theme.colors.chatMessageOwn,
    },
    otherBubble: {
      backgroundColor: '#e8d4f8',
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
      color: theme.colors.chatMessageOwnText,
    },
    otherText: {
      color: '#000000',
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
      color: theme.colors.chatMessageOwnText,
    },
    videoTextOther: {
      color: theme.colors.textSecondary,
    },
    metaText: {
      fontSize: 11,
      marginTop: 6,
    },
    ownMeta: {
      color: 'rgba(255, 255, 255, 0.85)',
    },
    otherMeta: {
      color: theme.colors.textSecondary,
    },
    deleteButton: {
      position: 'absolute',
      top: 4,
      right: 4,
      padding: 4,
      borderRadius: 12,
      backgroundColor: 'rgba(0, 0, 0, 0.15)',
    },
  });

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
      )}{/* Delete Button - visible icon */}
        {isOwn && onDelete && (
          <TouchableOpacity
            onPress={onDelete}
            style={styles.deleteButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="trash-2" size={14} color="rgba(255, 255, 255, 0.9)" />
          </TouchableOpacity>
        )}

        

      <TouchableOpacity
        activeOpacity={0.8}
        onLongPress={isOwn && onDelete ? onDelete : undefined}
        delayLongPress={400}
        style={[styles.bubble, isOwn ? styles.ownBubble : styles.otherBubble]}
      >
        <View style={styles.contentWrapper}>
          <View style={styles.messageContent}>
            {/* Content */}
            {decryptedContent ? (
              <Text style={[styles.text, isOwn ? styles.ownText : styles.otherText]}>
                {decryptedContent}
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
                    <Feather name="video" size={32} color={isOwn ? theme.colors.chatMessageOwnText : theme.colors.textSecondary} />
                    <Text style={[styles.videoText, isOwn ? styles.videoTextOwn : styles.videoTextOther]}>
                      {t('chat.video')}
                    </Text>
                  </View>
                ) : null}
              </View>
            )}

            {/* Meta Info */}
            <Text style={[styles.metaText, isOwn ? styles.ownMeta : styles.otherMeta]}>
              {isOwn ? (message.isRead ? t('chat.read') : t('chat.sent')) : (sender?.username || t('chat.unknown'))}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Image Viewer */}
      {isImage && (
        <ImageViewer
          visible={imageViewerVisible}
          imageUrl={message.mediaUrl}
          onClose={() => setImageViewerVisible(false)}
        />
      )}
    </View>
  );
}
