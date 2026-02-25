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
import { repliesAPI, interestSignalsAPI, statusAPI, mediaAPI, reportsAPI } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import ImageViewer from './ImageViewer';
import { useTranslation } from 'react-i18next';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function Reply({ reply, onDelete, onLikeUpdate }) {
  const { user } = useAuth();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const isAuthor = user?.username === reply.author;

  const styles = StyleSheet.create({
    comment: {
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    commentHeader: {
      flexDirection: 'row',
      gap: 12,
    },
    avatarSmall: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarImg: {
      width: 32,
      height: 32,
      borderRadius: 16,
    },
    avatarText: {
      color: theme.colors.textOnPrimary,
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
      color: theme.colors.textPrimary,
    },
    date: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    content: {
      fontSize: 14,
      color: theme.colors.textPrimary,
      marginBottom: 6,
      lineHeight: 20,
    },
    mention: {
      color: theme.colors.primary,
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
      borderColor: theme.colors.border,
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
      color: theme.colors.textSecondary,
      fontWeight: '500',
    },
    likedText: {
      color: theme.colors.error,
    },
    repostedText: {
      color: theme.colors.success,
    },
    deleteButton: {
      padding: 4,
    },
    menuOverlay: {
      flex: 1,
      backgroundColor: theme.colors.modalOverlay,
      justifyContent: 'center',
      alignItems: 'center',
    },
    menuContainer: {
      backgroundColor: theme.colors.cardBackground,
      borderRadius: 12,
      minWidth: 200,
      padding: 8,
      ...Platform.select({
        ios: {
          shadowColor: theme.colors.shadowColor,
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
      color: theme.colors.textPrimary,
      fontWeight: '500',
    },
    menuDivider: {
      height: 1,
      backgroundColor: theme.colors.border,
      marginVertical: 4,
    },
    modalContainer: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.textPrimary,
    },
    modalBody: {
      flex: 1,
      padding: 16,
    },
    quoteTextarea: {
      fontSize: 16,
      color: theme.colors.textPrimary,
      minHeight: 100,
      textAlignVertical: 'top',
      lineHeight: 22,
    },
    charCount: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      textAlign: 'right',
      marginTop: 8,
    },
    uploadedMediaPreview: {
      marginVertical: 12,
      borderRadius: 12,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.colors.border,
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
      borderColor: theme.colors.border,
      borderRadius: 12,
      backgroundColor: theme.colors.cardBackground,
    },
    previewHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    previewAuthor: {
      fontWeight: 'bold',
      color: theme.colors.textPrimary,
      marginRight: 8,
    },
    previewDate: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    previewContent: {
      fontSize: 14,
      color: theme.colors.textPrimary,
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
      borderTopColor: theme.colors.border,
      gap: 12,
    },
    mediaButton: {
      padding: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.colors.primary,
    },
    cancelButton: {
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    cancelButtonText: {
      color: theme.colors.primary,
      fontSize: 14,
      fontWeight: 'bold',
    },
    submitButton: {
      paddingVertical: 10,
      paddingHorizontal: 24,
      borderRadius: 20,
      backgroundColor: theme.colors.primary,
    },
    submitButtonDisabled: {
      opacity: 0.5,
    },
    submitButtonText: {
      color: theme.colors.textOnPrimary,
      fontSize: 14,
      fontWeight: 'bold',
    },
  });

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

  // Estado para el modal de opciones (tres puntos)
  const [showOptionsModal, setShowOptionsModal] = useState(false);

  // Estado para el modal de reporte
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState(null);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  
  // Estado para el modal de quote
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteContent, setQuoteContent] = useState('');
  const [quoteMediaUri, setQuoteMediaUri] = useState(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);

  // Estado para ImageViewer
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState(null);

  const childrenCount = typeof reply.repliesCount === 'number' ? reply.repliesCount : 0;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return t('notifications.timeAgo.justNow');
    if (diffInMinutes < 60) return t('notifications.timeAgo.minutesAgo', { count: diffInMinutes });
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return t('notifications.timeAgo.hoursAgo', { count: diffInHours });
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return t('notifications.timeAgo.daysAgo', { count: diffInDays });
    
    const locale = t('common.language') === 'en' ? 'en-US' : 'es-ES';
    return date.toLocaleDateString(locale, { 
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
    setShowOptionsModal(false);
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

  const handleOpenReportModal = () => {
    setShowOptionsModal(false);
    setSelectedReason(null);
    setReportSuccess(false);
    setShowReportModal(true);
  };

  const handleSubmitReport = async () => {
    if (!selectedReason || isSubmittingReport) return;
    setIsSubmittingReport(true);
    try {
      await reportsAPI.create({ statusId: reply.id, type: selectedReason });
      setReportSuccess(true);
    } catch (err) {
      Alert.alert(t('common.error') || 'Error', err.message || t('report.error') || 'Error al enviar el reporte.');
    } finally {
      setIsSubmittingReport(false);
    }
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
      Alert.alert(t('feed.permissionDenied'), t('feed.permissionPhotos'));
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
          const filename = quoteMediaUri.split('/').pop() || `quote_${Date.now()}.jpg`;
          const match = /\.(\w+)$/.exec(filename);
          const extension = match ? match[1] : 'jpg';
          const type = `image/${extension}`;

          const file = {
            uri: quoteMediaUri,
            name: filename,
            type: type,
          };

          console.log('📤 Subiendo media para reply quote:', file);
          const uploadRes = await mediaAPI.upload(file, 'quotes');
          mediaUrl = uploadRes?.data?.publicUrl || null;
          if (!mediaUrl) {
            throw new Error('No se obtuvo URL del archivo subido');
          }
        } catch (uploadError) {
          console.error('❌ Error al subir media:', uploadError);
          Alert.alert('Error', t('feed.uploadError'));
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
      Alert.alert('Error', t('feed.quoteError'));
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
        <TouchableOpacity
          onPress={() => {
            if (isImage) {
              setSelectedImageUrl(url);
              setImageViewerVisible(true);
            }
          }}
          activeOpacity={isImage ? 0.8 : 1}
        >
          <Image
            source={{ uri: url }}
            style={styles.media}
            resizeMode="cover"
          />
        </TouchableOpacity>
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

        <TouchableOpacity
          style={styles.commentBody}
          onPress={handleOpenThread}
          activeOpacity={0.7}
        >
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
                color={isLiked ? theme.colors.error : theme.colors.textSecondary}
                fill={isLiked ? theme.colors.error : 'transparent'}
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
                color={isReposted ? theme.colors.success : theme.colors.textSecondary}
              />
              <Text style={[styles.actionText, isReposted && styles.repostedText]}>
                {repostsCount}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleOpenThread}
              style={styles.actionButton}
            >
              <Feather name="message-circle" size={16} color={theme.colors.textSecondary} />
              <Text style={styles.actionText}>{childrenCount}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {/* Botón tres puntos */}
        <TouchableOpacity
          onPress={() => setShowOptionsModal(true)}
          style={styles.deleteButton}
        >
          <Feather name="more-horizontal" size={16} color={theme.colors.textSecondary} />
        </TouchableOpacity>
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
              <Feather name="repeat" size={20} color={theme.colors.primary} />
              <Text style={styles.menuItemText}>
                {isReposted ? t('feed.undoRepost') : t('feed.repost')}
              </Text>
            </TouchableOpacity>
            
            <View style={styles.menuDivider} />
            
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleQuote}
              disabled={isLoadingQuote}
            >
              <Feather name="edit-3" size={20} color={theme.colors.primary} />
              <Text style={styles.menuItemText}>{t('feed.quote')}</Text>
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
              <Feather name="x" size={24} color={theme.colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{t('feed.quoteComment')}</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalBody}>
            <TextInput
              value={quoteContent}
              onChangeText={setQuoteContent}
              placeholder={t('feed.addComment')}
              placeholderTextColor={theme.colors.textSecondary}
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
                  <Feather name="x" size={16} color={theme.colors.textOnPrimary} />
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
              <Feather name="image" size={20} color={theme.colors.primary} />
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
              <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
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
                <ActivityIndicator color={theme.colors.textOnPrimary} />
              ) : (
                <Text style={styles.submitButtonText}>{t('feed.quote')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de opciones (tres puntos) */}
      <Modal
        visible={showOptionsModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowOptionsModal(false)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setShowOptionsModal(false)}
        >
          <View style={styles.menuContainer}>
            {isAuthor && (
              <TouchableOpacity onPress={handleDelete} style={styles.menuItem}>
                <Feather name="trash-2" size={20} color={theme.colors.error} />
                <Text style={[styles.menuItemText, { color: theme.colors.error }]}>
                  {t('common.delete') || 'Eliminar'}
                </Text>
              </TouchableOpacity>
            )}
            {!isAuthor && (
              <TouchableOpacity onPress={handleOpenReportModal} style={styles.menuItem}>
                <Feather name="flag" size={20} color={theme.colors.textPrimary} />
                <Text style={styles.menuItemText}>{t('report.reportPost') || 'Reportar respuesta'}</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal de reporte */}
      <Modal
        visible={showReportModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => { setShowReportModal(false); setReportSuccess(false); }}
      >
        <View style={[styles.menuOverlay, { justifyContent: 'flex-end' }]}>
          <View style={{
            backgroundColor: theme.colors.cardBackground,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 32,
            maxHeight: '85%'
          }}>
            {reportSuccess ? (
              <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                <Feather name="check-circle" size={48} color={theme.colors.success || '#27ae60'} />
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.colors.textPrimary, marginTop: 12 }}>
                  {t('report.submitted') || 'Reporte enviado'}
                </Text>
                <Text style={{ color: theme.colors.textSecondary, marginTop: 8, textAlign: 'center' }}>
                  Gracias. Revisaremos tu reporte a la brevedad.
                </Text>
                <TouchableOpacity
                  onPress={() => { setShowReportModal(false); setReportSuccess(false); }}
                  style={{ marginTop: 20, paddingHorizontal: 32, paddingVertical: 12, backgroundColor: theme.colors.primary, borderRadius: 24 }}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>{t('common.close') || 'Cerrar'}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <Text style={{ fontSize: 17, fontWeight: 'bold', color: theme.colors.textPrimary }}>
                    🚩 {t('report.reportPost') || 'Reportar respuesta'}
                  </Text>
                  <TouchableOpacity onPress={() => setShowReportModal(false)}>
                    <Feather name="x" size={22} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                <Text style={{ color: theme.colors.textSecondary, marginBottom: 12, fontSize: 14 }}>
                  {t('report.selectReason') || 'Selecciona el motivo del reporte:'}
                </Text>
                <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
                  {[
                    { id: 1, key: 'report.reasons.Violence', fallback: 'Violencia' },
                    { id: 2, key: 'report.reasons.Pornography', fallback: 'Pornografía' },
                    { id: 3, key: 'report.reasons.Bullying', fallback: 'Bullying / Acoso' },
                    { id: 4, key: 'report.reasons.Blackmail', fallback: 'Extorsión / Chantaje' },
                    { id: 5, key: 'report.reasons.Stalking', fallback: 'Acoso / Stalking' },
                    { id: 6, key: 'report.reasons.Abuse', fallback: 'Abuso' },
                    { id: 7, key: 'report.reasons.ScholarDamage', fallback: 'Daño a instalaciones escolares' },
                    { id: 8, key: 'report.reasons.DrugUse', fallback: 'Uso de drogas' },
                    { id: 9, key: 'report.reasons.AlcoholUse', fallback: 'Uso de alcohol' },
                    { id: 10, key: 'report.reasons.SelfHarm', fallback: 'Autolesiones' },
                    { id: 11, key: 'report.reasons.Disrespect', fallback: 'Falta de respeto / Normas escolares' }
                  ].map((reason) => (
                    <TouchableOpacity
                      key={reason.id}
                      onPress={() => setSelectedReason(reason.id)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: 11,
                        paddingHorizontal: 12,
                        borderRadius: 10,
                        marginBottom: 6,
                        borderWidth: 1.5,
                        borderColor: selectedReason === reason.id ? theme.colors.primary : theme.colors.border,
                        backgroundColor: selectedReason === reason.id
                          ? `${theme.colors.primary}18`
                          : theme.colors.cardBackground
                      }}
                    >
                      <View style={{
                        width: 16,
                        height: 16,
                        borderRadius: 8,
                        borderWidth: 2,
                        borderColor: selectedReason === reason.id ? theme.colors.primary : theme.colors.border,
                        backgroundColor: selectedReason === reason.id ? theme.colors.primary : 'transparent',
                        marginRight: 10
                      }} />
                      <Text style={{ color: theme.colors.textPrimary, fontSize: 14 }}>
                        {t(reason.key) || reason.fallback}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                  <TouchableOpacity
                    onPress={() => setShowReportModal(false)}
                    style={{ flex: 1, paddingVertical: 12, borderRadius: 24, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center' }}
                  >
                    <Text style={{ color: theme.colors.textSecondary, fontWeight: '600' }}>{t('common.cancel') || 'Cancelar'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSubmitReport}
                    disabled={!selectedReason || isSubmittingReport}
                    style={{
                      flex: 2,
                      paddingVertical: 12,
                      borderRadius: 24,
                      backgroundColor: theme.colors.primary,
                      alignItems: 'center',
                      opacity: !selectedReason || isSubmittingReport ? 0.5 : 1
                    }}
                  >
                    {isSubmittingReport ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={{ color: '#fff', fontWeight: 'bold' }}>
                        {t('report.report') || 'Enviar reporte'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Image Viewer */}
      <ImageViewer
        visible={imageViewerVisible}
        imageUrl={selectedImageUrl}
        onClose={() => {
          setImageViewerVisible(false);
          setSelectedImageUrl(null);
        }}
      />
    </View>
  );
}

export default Reply;
