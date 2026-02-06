import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Platform
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from '../utils/imagePicker';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { repliesAPI, interestSignalsAPI, statusAPI, mediaAPI } from '../services/api';
import { colors } from '../styles/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function Reply({ reply, onDelete, onLikeUpdate }) {
  const { user } = useAuth();
  const navigation = useNavigation();
  const isAuthor = user?.username === reply.author;

  // Avatar
  const [avatarFailed, setAvatarFailed] = useState(false);
  const authorAvatarUrl =
    reply.authorProfilePictureUrl ||
    reply.authorAvatarUrl ||
    reply.avatarUrl ||
    reply.profileImageUrl;
  const showImageAvatar = Boolean(authorAvatarUrl) && !avatarFailed;

  // Estados para likes
  const [isLiked, setIsLiked] = useState(reply.isLikedByCurrentUser || false);
  const [likesCount, setLikesCount] = useState(reply.likes || 0);
  const [isLoadingLike, setIsLoadingLike] = useState(false);

  // Estado para reposts
  const [isReposted, setIsReposted] = useState(reply.isRepostedByCurrentUser || false);
  const [repostsCount, setRepostsCount] = useState(reply.repostsCount || 0);
  const [isLoadingRepost, setIsLoadingRepost] = useState(false);

  // Estado para el menú desplegable de repost/quote
  const [showRepostMenu, setShowRepostMenu] = useState(false);
  
  // Estado para el modal de quote
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteContent, setQuoteContent] = useState('');
  const [quoteMediaUri, setQuoteMediaUri] = useState(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);

  const childrenCount = typeof reply.repliesCount === 'number' ? reply.repliesCount : 0;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Justo ahora';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes}m`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Hace ${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `Hace ${diffInDays}d`;
    
    return date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'short'
    });
  };

  const handleLike = async () => {
    if (isLoadingLike) return;

    const previousIsLiked = isLiked;
    const previousLikesCount = likesCount;

    // Actualización optimista
    setIsLiked(!isLiked);
    setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);
    setIsLoadingLike(true);

    try {
      await repliesAPI.toggleLike(reply.id);

      if (onLikeUpdate) {
        onLikeUpdate(reply.id, !isLiked, isLiked ? likesCount - 1 : likesCount + 1);
      }
    } catch (error) {
      console.error('Error al dar/quitar like:', error);
      // Revertir cambios si hay error
      setIsLiked(previousIsLiked);
      setLikesCount(previousLikesCount);
      Alert.alert('Error', 'Error al procesar el like. Intenta de nuevo.');
    } finally {
      setIsLoadingLike(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar Respuesta',
      '¿Estás seguro de que quieres eliminar esta respuesta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => onDelete(reply.id)
        }
      ]
    );
  };

  const renderContentWithMentions = (content) => {
    if (!content) return null;

    // Regex para detectar @username#id
    const mentionRegex = /@(\w+)#(\d+)/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    let key = 0;

    while ((match = mentionRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(
          <Text key={`text-${key++}`}>
            {content.substring(lastIndex, match.index)}
          </Text>
        );
      }

      const username = match[1];
      const userId = match[2];
      const displayText = `@${username}`;
      
      parts.push(
        <Text
          key={`mention-${key++}`}
          style={styles.mention}
          onPress={() => {
            // Registrar señal de interés
            interestSignalsAPI.record({
              statusId: reply.id,
              signalType: 'mention_click',
              value: 1,
              metadata: JSON.stringify({ mentionedUsername: username, mentionedUserId: userId })
            }).catch(err => console.error('Error al registrar señal de mention_click:', err));
            navigation.navigate('Profile', { userId: parseInt(userId) });
          }}
        >
          {displayText}
        </Text>
      );

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push(
        <Text key={`text-${key++}`}>
          {content.substring(lastIndex)}
        </Text>
      );
    }

    return parts.length > 0 ? parts : content;
  };

  const handleRepost = async () => {
    if (isLoadingRepost) return;

    const previousIsReposted = isReposted;
    const previousRepostsCount = repostsCount;

    // Actualización optimista
    setIsReposted(!isReposted);
    setRepostsCount(isReposted ? repostsCount - 1 : repostsCount + 1);
    setIsLoadingRepost(true);
    setShowRepostMenu(false);

    try {
      const res = await repliesAPI.toggleRepost(reply.id);
      if (typeof res?.data?.repostsCount === 'number') {
        setRepostsCount(res.data.repostsCount);
      }
      if (typeof res?.data?.reposted === 'boolean') {
        setIsReposted(res.data.reposted);
      }
    } catch (error) {
      console.error('Error al repostear:', error);
      setIsReposted(previousIsReposted);
      setRepostsCount(previousRepostsCount);
      Alert.alert('Error', 'Error al procesar el repost. Intenta de nuevo.');
    } finally {
      setIsLoadingRepost(false);
    }
  };

  const handleQuote = () => {
    setShowRepostMenu(false);
    setShowQuoteModal(true);
    setQuoteContent('');
    setQuoteMediaUri(null);
  };

  const handleMediaPick = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso Denegado', 'Se necesita permiso para acceder a las fotos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setQuoteMediaUri(result.assets[0].uri);
    }
  };

  const handleQuoteSubmit = async () => {
    if (isLoadingQuote || !quoteContent.trim()) return;

    setIsLoadingQuote(true);

    try {
      let mediaUrl = null;

      if (quoteMediaUri) {
        try {
          const filename = quoteMediaUri.split('/').pop();
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : 'image/jpeg';

          const formData = new FormData();
          formData.append('file', {
            uri: quoteMediaUri,
            name: filename,
            type: type,
          });
          formData.append('folderName', 'quotes');

          const uploadRes = await mediaAPI.upload(formData);
          mediaUrl = uploadRes?.data?.publicUrl || null;
          if (!mediaUrl) {
            throw new Error('No se obtuvo URL del archivo subido');
          }
        } catch (uploadError) {
          console.error('Error al subir media:', uploadError);
          Alert.alert('Error', 'Error al subir el archivo. Intenta de nuevo.');
          setIsLoadingQuote(false);
          return;
        }
      }

      const res = await statusAPI.create({
        content: quoteContent.trim(),
        quotedStatusId: reply.id,
        mediaUrl
      });

      const created = res.data;
      setShowQuoteModal(false);
      setQuoteContent('');
      setQuoteMediaUri(null);
      if (created?.id) {
        navigation.navigate('StatusDetail', { statusId: created.id });
      }
    } catch (error) {
      console.error('Error al crear quote:', error);
      Alert.alert('Error', 'Error al crear quote. Intenta de nuevo.');
    } finally {
      setIsLoadingQuote(false);
    }
  };

  const handleOpenThread = () => {
    navigation.navigate('StatusDetail', { statusId: reply.id });
  };

  const renderMedia = (url) => {
    if (!url) return null;
    const lower = String(url).toLowerCase();
    const isVideo = lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.endsWith('.mov') || lower.endsWith('.m4v');
    const isImage = lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png') || lower.endsWith('.gif') || lower.endsWith('.webp');

    if (isVideo || isImage) {
      return (
        <Image
          source={{ uri: url }}
          style={styles.media}
          resizeMode="cover"
        />
      );
    }
    return null;
  };

  return (
    <View style={styles.comment}>
      <View style={styles.commentHeader}>
        <TouchableOpacity
          onPress={() => navigation.navigate('Profile', { userId: reply.userId })}
        >
          <View style={styles.avatarSmall}>
            {showImageAvatar ? (
              <Image
                source={{ uri: authorAvatarUrl }}
                style={styles.avatarImg}
                onError={() => setAvatarFailed(true)}
              />
            ) : (
              <Text style={styles.avatarText}>
                {reply.author?.charAt(0)?.toUpperCase() || '?'}
              </Text>
            )}
          </View>
        </TouchableOpacity>

        <View style={styles.commentBody}>
          <View style={styles.commentInfo}>
            <Text style={styles.authorName}>{reply.author || 'Usuario'}</Text>
            <Text style={styles.date}>{formatDate(reply.createdAt)}</Text>
          </View>
          
          <Text style={styles.content}>
            {renderContentWithMentions(reply.content)}
          </Text>

          {reply.mediaUrl && (
            <View style={styles.mediaWrapper}>
              {renderMedia(reply.mediaUrl)}
            </View>
          )}

          <View style={styles.actionsRow}>
            <TouchableOpacity
              onPress={handleLike}
              style={styles.actionButton}
              disabled={isLoadingLike}
            >
              <Feather
                name="heart"
                size={16}
                color={isLiked ? colors.error : colors.textSecondary}
                fill={isLiked ? colors.error : 'transparent'}
              />
              <Text style={[styles.actionText, isLiked && styles.likedText]}>
                {likesCount}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowRepostMenu(true)}
              style={styles.actionButton}
              disabled={isLoadingRepost || isLoadingQuote}
            >
              <Feather
                name="repeat"
                size={16}
                color={isReposted ? colors.success : colors.textSecondary}
              />
              <Text style={[styles.actionText, isReposted && styles.repostedText]}>
                {repostsCount}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleOpenThread}
              style={styles.actionButton}
            >
              <Feather name="message-circle" size={16} color={colors.textSecondary} />
              <Text style={styles.actionText}>{childrenCount}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {isAuthor && (
          <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
            <Feather name="trash-2" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Modal de menú repost/quote */}
      <Modal
        visible={showRepostMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRepostMenu(false)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setShowRepostMenu(false)}
        >
          <View style={styles.menuContainer}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleRepost}
              disabled={isLoadingRepost}
            >
              <Feather name="repeat" size={20} color={colors.primary} />
              <Text style={styles.menuItemText}>
                {isReposted ? 'Deshacer Repost' : 'Repost'}
              </Text>
            </TouchableOpacity>
            
            <View style={styles.menuDivider} />
            
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleQuote}
              disabled={isLoadingQuote}
            >
              <Feather name="edit-3" size={20} color={colors.primary} />
              <Text style={styles.menuItemText}>Quote</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal para escribir quote */}
      <Modal
        visible={showQuoteModal}
        animationType="slide"
        onRequestClose={() => setShowQuoteModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => {
                setShowQuoteModal(false);
                setQuoteContent('');
                setQuoteMediaUri(null);
              }}
            >
              <Feather name="x" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Citar Comentario</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalBody}>
            <TextInput
              value={quoteContent}
              onChangeText={setQuoteContent}
              placeholder="Agrega un comentario..."
              placeholderTextColor="#999"
              style={styles.quoteTextarea}
              multiline
              autoFocus
              maxLength={280}
            />

            <Text style={styles.charCount}>{quoteContent.length}/280</Text>

            {quoteMediaUri && (
              <View style={styles.uploadedMediaPreview}>
                <Image
                  source={{ uri: quoteMediaUri }}
                  style={styles.uploadedMediaImage}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  onPress={() => setQuoteMediaUri(null)}
                  style={styles.removeMediaButton}
                >
                  <Feather name="x" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.quotedTweetPreview}>
              <View style={styles.previewHeader}>
                <Text style={styles.previewAuthor}>@{reply.author}</Text>
                <Text style={styles.previewDate}>{formatDate(reply.createdAt)}</Text>
              </View>
              <Text style={styles.previewContent}>{reply.content}</Text>
              {reply.mediaUrl && (
                <View style={styles.previewMediaWrapper}>
                  {renderMedia(reply.mediaUrl)}
                </View>
              )}
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              onPress={handleMediaPick}
              style={styles.mediaButton}
              disabled={isLoadingQuote || !!quoteMediaUri}
            >
              <Feather name="image" size={20} color={colors.primary} />
            </TouchableOpacity>

            <View style={{ flex: 1 }} />

            <TouchableOpacity
              onPress={() => {
                setShowQuoteModal(false);
                setQuoteContent('');
                setQuoteMediaUri(null);
              }}
              style={styles.cancelButton}
              disabled={isLoadingQuote}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleQuoteSubmit}
              style={[
                styles.submitButton,
                (!quoteContent.trim() || isLoadingQuote) && styles.submitButtonDisabled
              ]}
              disabled={!quoteContent.trim() || isLoadingQuote}
            >
              {isLoadingQuote ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Citar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  comment: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  commentHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  avatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  commentBody: {
    flex: 1,
  },
  commentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  date: {
    fontSize: 12,
    color: '#666',
  },
  content: {
    fontSize: 14,
    color: '#000',
    marginBottom: 6,
    lineHeight: 20,
  },
  mention: {
    color: colors.primary,
    fontWeight: '600',
  },
  mediaWrapper: {
    marginVertical: 8,
  },
  media: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  actionText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  likedText: {
    color: colors.error,
  },
  repostedText: {
    color: colors.success,
  },
  deleteButton: {
    padding: 4,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    minWidth: 200,
    padding: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  modalBody: {
    flex: 1,
    padding: 16,
  },
  quoteTextarea: {
    fontSize: 16,
    color: '#000',
    minHeight: 100,
    textAlignVertical: 'top',
    lineHeight: 22,
  },
  charCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 8,
  },
  uploadedMediaPreview: {
    marginVertical: 12,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  uploadedMediaImage: {
    width: '100%',
    height: 200,
  },
  removeMediaButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quotedTweetPreview: {
    marginTop: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.cardBackground,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  previewAuthor: {
    fontWeight: 'bold',
    color: '#000',
    marginRight: 8,
  },
  previewDate: {
    fontSize: 12,
    color: '#666',
  },
  previewContent: {
    fontSize: 14,
    color: '#000',
    lineHeight: 20,
  },
  previewMediaWrapper: {
    marginTop: 8,
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
  },
  mediaButton: {
    padding: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  submitButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
    backgroundColor: colors.primary,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default Reply;
