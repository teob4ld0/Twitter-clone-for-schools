import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  Dimensions,
  ActivityIndicator,
  Platform
} from 'react-native';
import { Video } from 'expo-av';
import * as ImagePicker from '../utils/imagePicker';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { statusAPI, interestSignalsAPI, mediaAPI } from '../services/api';
import ReplyList from './ReplyList';
import colors from '../styles/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function StatusItem({
  status,
  onDelete,
  onLikeUpdate,
  onQuoteCreated,
  initialShowReplies = false,
  focusReplyId = null,
  repostedByUsername = null
}) {
  const { user } = useAuth();
  const navigation = useNavigation();

  // Validación defensiva
  if (!status || !status.id) {
    console.error('Status inválido:', status);
    return null;
  }

  const isAuthor = user?.username === status.author;
  const isRepost = Boolean(status.isRepost);
  const repostLabel = isRepost
    ? `Reposteado${repostedByUsername ? ` por ${repostedByUsername}` : ''}`
    : null;

  // Estado para likes
  const [isLiked, setIsLiked] = useState(status.isLikedByCurrentUser || false);
  const [likesCount, setLikesCount] = useState(status.likes || 0);
  const [isLoadingLike, setIsLoadingLike] = useState(false);

  // Estado para reposts
  const [isReposted, setIsReposted] = useState(status.isRepostedByCurrentUser || false);
  const [repostsCount, setRepostsCount] = useState(status.repostsCount || 0);
  const [isLoadingRepost, setIsLoadingRepost] = useState(false);

  // Estado para quotes
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);

  // Estado para el menú desplegable de repost/quote
  const [showRepostMenu, setShowRepostMenu] = useState(false);

  // Estado para el modal de quote
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteContent, setQuoteContent] = useState('');
  const [quoteMediaFile, setQuoteMediaFile] = useState(null);
  const [quoteMediaPreview, setQuoteMediaPreview] = useState(null);

  // Estado para modal de confirmación de borrado
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Estado para respuestas
  const [showReplies, setShowReplies] = useState(initialShowReplies);
  const [repliesCount, setRepliesCount] = useState(status.repliesCount ?? 0);

  // Estado para avatar
  const [avatarFailed, setAvatarFailed] = useState(false);

  // Referencias para tracking de tiempo de visualización
  const viewStartTimeRef = useRef(null);
  const totalViewTimeRef = useRef(0);
  const hasRecordedSignalRef = useRef(false);
  const isMountedRef = useRef(true);

  const authorInitial = status.author ? status.author.charAt(0).toUpperCase() : '?';
  const authorAvatarUrl = status.authorProfilePictureUrl;
  const showImageAvatar = Boolean(authorAvatarUrl) && !avatarFailed;

  // Efecto para tracking de tiempo de visualización (simulado)
  useEffect(() => {
    if (!user) return;

    // Iniciar tracking cuando el componente se monta
    viewStartTimeRef.current = Date.now();

    const recordViewTime = async (timeInMs) => {
      // Solo registrar si el tiempo es mayor a 1 segundo
      if (timeInMs < 1000 || hasRecordedSignalRef.current || !isMountedRef.current) return;

      try {
        await interestSignalsAPI.record({
          statusId: status.id,
          signalType: 'view_time',
          value: Math.floor(timeInMs)
        });
        hasRecordedSignalRef.current = true;
        console.log(`Señal registrada: ${Math.floor(timeInMs)}ms en status ${status.id}`);
      } catch (error) {
        console.error('Error al registrar señal de visualización:', error);
      }
    };

    // Cleanup: registrar tiempo acumulado al desmontar
    return () => {
      isMountedRef.current = false;

      // Si estaba visible al desmontar, sumar el tiempo actual
      if (viewStartTimeRef.current) {
        const viewDuration = Date.now() - viewStartTimeRef.current;
        totalViewTimeRef.current += viewDuration;
      }

      // Registrar tiempo total acumulado
      if (totalViewTimeRef.current >= 1000 && !hasRecordedSignalRef.current) {
        recordViewTime(totalViewTimeRef.current);
      }
    };
  }, [status.id, user]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Hace unos minutos';
    if (diffInHours < 24) return `Hace ${diffInHours} horas`;
    if (diffInHours < 48) return 'Ayer';

    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    setShowDeleteModal(false);
    onDelete(status.id);
  };

  const handleOpenThread = () => {
    navigation.navigate('StatusDetail', { statusId: status.id });
  };

  const handleLike = async () => {
    if (isLoadingLike) return;

    const previousIsLiked = isLiked;
    const previousLikesCount = likesCount;
    const isGivingLike = !isLiked; // true si está dando like, false si quita like

    // Actualización optimista
    setIsLiked(!isLiked);
    setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);
    setIsLoadingLike(true);

    try {
      await statusAPI.toggleLike(status.id);

      // Registrar señal de interés solo cuando se DA like (no cuando se quita)
      if (isGivingLike) {
        try {
          await interestSignalsAPI.record({
            statusId: status.id,
            signalType: 'like',
            value: 1,
            metadata: JSON.stringify({ action: 'like' })
          });
          console.log(`✅ Señal de LIKE registrada en status ${status.id}`);
        } catch (signalError) {
          console.error('Error al registrar señal de like:', signalError);
          // No revertimos el like si falla la señal, solo loggeamos
        }
      }

      if (onLikeUpdate) {
        onLikeUpdate(status.id, !isLiked);
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

  const handleRepost = async () => {
    if (isLoadingRepost) return;

    const previousIsReposted = isReposted;
    const previousRepostsCount = repostsCount;
    const isGivingRepost = !isReposted; // true si está repostando, false si quita repost

    setIsReposted(!isReposted);
    setRepostsCount(isReposted ? repostsCount - 1 : repostsCount + 1);
    setIsLoadingRepost(true);

    try {
      const res = await statusAPI.toggleRepost(status.id);

      if (isGivingRepost) {
        try {
          await interestSignalsAPI.record({
            statusId: status.id,
            signalType: 'repost',
            value: 1,
            metadata: JSON.stringify({ action: 'repost' })
          });
          console.log(`✅ Señal de REPOST registrada en status ${status.id}`);
        } catch (signalError) {
          console.error('Error al registrar señal de repost:', signalError);
          // No revertimos el repost si falla la señal, solo loggeamos
        }
      }

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
    setQuoteMediaFile(null);
    setQuoteMediaPreview(null);
  };

  const handleMediaSelect = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert('Permiso denegado', 'Se necesita permiso para acceder a la galería.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: false,
        quality: 0.8,
        videoMaxDuration: 60
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setQuoteMediaFile(asset);
        setQuoteMediaPreview(asset.uri);
      }
    } catch (error) {
      console.error('Error al seleccionar media:', error);
      Alert.alert('Error', 'Error al seleccionar archivo.');
    }
  };

  const handleRemoveMedia = () => {
    setQuoteMediaFile(null);
    setQuoteMediaPreview(null);
  };

  const handleQuoteSubmit = async () => {
    if (isLoadingQuote || !quoteContent.trim()) return;

    setIsLoadingQuote(true);

    // Registrar señal de interés (best-effort; no bloquea el flujo)
    try {
      await interestSignalsAPI.record({
        statusId: status.id,
        signalType: 'quote',
        value: 1,
        metadata: JSON.stringify({
          contentLength: quoteContent.length,
          hasMedia: !!quoteMediaFile
        })
      });
      console.log(`✅ Señal de QUOTE registrada en status ${status.id}`);
    } catch (signalError) {
      console.error('Error al registrar señal de quote:', signalError);
      // No bloqueamos el flujo si falla la señal
    }

    try {
      let mediaUrl = null;

      // Subir media si hay archivo
      if (quoteMediaFile) {
        try {
          // Crear FormData para upload
          const formData = new FormData();
          const fileType = quoteMediaFile.mimeType || quoteMediaFile.type || 'image/jpeg';
          const fileName = quoteMediaFile.fileName || quoteMediaFile.uri.split('/').pop();

          formData.append('file', {
            uri: quoteMediaFile.uri,
            type: fileType,
            name: fileName
          });
          formData.append('category', 'quotes');

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
        quotedStatusId: status.id,
        mediaUrl
      });

      const created = res.data;
      setShowQuoteModal(false);
      setQuoteContent('');
      setQuoteMediaFile(null);
      setQuoteMediaPreview(null);
      if (onQuoteCreated) onQuoteCreated(created);
      if (created?.id) navigation.navigate('StatusDetail', { statusId: created.id });
    } catch (error) {
      console.error('Error al crear quote:', error);
      Alert.alert('Error', 'Error al crear quote. Intenta de nuevo.');
    } finally {
      setIsLoadingQuote(false);
    }
  };

  const toggleReplies = () => {
    setShowReplies(!showReplies);
  };

  const handleAuthorClick = () => {
    if (status.authorId) {
      navigation.navigate('Profile', { userId: status.authorId });
    }
  };

  const renderContentWithMentions = (content) => {
    if (!content) return null;

    // Regex para detectar @username#id
    const mentionRegex = /@(\w+)#(\d+)/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    let keyCounter = 0;

    while ((match = mentionRegex.exec(content)) !== null) {
      // Agregar texto antes de la mención
      if (match.index > lastIndex) {
        parts.push(
          <Text key={`text-${keyCounter++}`}>
            {content.substring(lastIndex, match.index)}
          </Text>
        );
      }

      // Agregar la mención como touchable
      const username = match[1];
      const userId = match[2];
      const displayText = `@${username}`; // Mostrar solo @username, no el #id

      parts.push(
        <Text
          key={`mention-${keyCounter++}`}
          style={styles.mention}
          onPress={() => {
            // Registrar señal de interés
            interestSignalsAPI
              .record({
                statusId: status.id,
                signalType: 'mention_click',
                value: 1,
                metadata: JSON.stringify({
                  mentionedUsername: username,
                  mentionedUserId: userId
                })
              })
              .catch((err) =>
                console.error('Error al registrar señal de mention_click:', err)
              );
            navigation.navigate('Profile', { userId });
          }}
        >
          {displayText}
        </Text>
      );

      lastIndex = match.index + match[0].length;
    }

    // Agregar el texto restante
    if (lastIndex < content.length) {
      parts.push(
        <Text key={`text-${keyCounter++}`}>{content.substring(lastIndex)}</Text>
      );
    }

    return parts.length > 0 ? parts : <Text>{content}</Text>;
  };

  const renderMedia = (url) => {
    if (!url) return null;
    const lower = String(url).toLowerCase();
    const isVideo =
      lower.endsWith('.mp4') ||
      lower.endsWith('.webm') ||
      lower.endsWith('.mov') ||
      lower.endsWith('.m4v');
    const isImage =
      lower.endsWith('.jpg') ||
      lower.endsWith('.jpeg') ||
      lower.endsWith('.png') ||
      lower.endsWith('.gif') ||
      lower.endsWith('.webp');

    if (isVideo) {
      return (
        <Video
          source={{ uri: url }}
          style={styles.media}
          useNativeControls
          resizeMode="contain"
          isLooping
          shouldPlay={false}
        />
      );
    }
    if (isImage) {
      return <Image source={{ uri: url }} style={styles.media} resizeMode="cover" />;
    }

    return <Text style={styles.mediaLink}>{url}</Text>;
  };

  return (
    <TouchableOpacity
      style={styles.postCard}
      activeOpacity={0.8}
      onPress={handleOpenThread}
    >
      {repostLabel && (
        <View style={styles.repostBanner}>
          <Feather name="repeat" size={14} color={colors.textSecondary} />
          <Text style={styles.repostText}>{repostLabel}</Text>
        </View>
      )}

      <View style={styles.postHeader}>
        <View style={styles.authorInfo}>
          {showImageAvatar ? (
            <Image
              source={{ uri: authorAvatarUrl }}
              style={styles.avatarImg}
              onError={() => setAvatarFailed(true)}
            />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{authorInitial}</Text>
            </View>
          )}
          <View style={styles.authorTextContainer}>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                handleAuthorClick();
              }}
            >
              <Text style={styles.authorName}>{status.author || 'Usuario'}</Text>
            </TouchableOpacity>
            <Text style={styles.date}>
              {status.createdAt ? formatDate(status.createdAt) : 'Fecha desconocida'}
            </Text>
          </View>
        </View>

        {isAuthor && (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            style={styles.deleteButton}
          >
            <Feather name="trash-2" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.contentText}>{renderContentWithMentions(status.content)}</Text>
      </View>

      {status.mediaUrl && (
        <View style={styles.mediaWrapper}>{renderMedia(status.mediaUrl)}</View>
      )}

      {status.quotedStatusId && !status.quotedStatus && (
        <View style={styles.deletedQuoteCard}>
          <View style={styles.quoteHeader}>
            <Text style={styles.quoteBadge}>Quote</Text>
            <Text style={styles.deletedQuoteText}>Post borrado</Text>
          </View>
        </View>
      )}

      {status.quotedStatus && (
        <TouchableOpacity
          style={styles.quoteCard}
          activeOpacity={0.7}
          onPress={(e) => {
            e.stopPropagation();
            status.quotedStatusId &&
              navigation.navigate('StatusDetail', { statusId: status.quotedStatusId });
          }}
        >
          <View style={styles.quoteHeader}>
            <Text style={styles.quoteBadge}>Quote</Text>
            <Text style={styles.quoteAuthor}>@{status.quotedStatus.author}</Text>
            <Text style={styles.quoteDate}>
              {status.quotedStatus.createdAt
                ? formatDate(status.quotedStatus.createdAt)
                : ''}
            </Text>
          </View>
          <View style={styles.quoteContent}>
            <Text style={styles.quoteContentText}>
              {renderContentWithMentions(status.quotedStatus.content)}
            </Text>
          </View>

          {status.quotedStatus.mediaUrl && (
            <View style={styles.quoteMediaWrapper}>
              {renderMedia(status.quotedStatus.mediaUrl)}
            </View>
          )}
        </TouchableOpacity>
      )}

      <View style={styles.footer}>
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            handleLike();
          }}
          style={styles.actionButton}
          disabled={isLoadingLike}
        >
          <Feather
            name={isLiked ? 'heart' : 'heart'}
            size={18}
            color={isLiked ? colors.error : colors.textSecondary}
            fill={isLiked ? colors.error : 'none'}
          />
          <Text
            style={[
              styles.actionButtonText,
              isLiked && { color: colors.error }
            ]}
          >
            {likesCount}
          </Text>
        </TouchableOpacity>

        <View style={styles.repostMenuContainer}>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              setShowRepostMenu(!showRepostMenu);
            }}
            style={styles.actionButton}
            disabled={isLoadingRepost || isLoadingQuote}
          >
            <Feather
              name="repeat"
              size={18}
              color={isReposted ? colors.success : colors.textSecondary}
            />
            <Text
              style={[
                styles.actionButtonText,
                isReposted && { color: colors.success }
              ]}
            >
              {repostsCount}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            toggleReplies();
          }}
          style={styles.actionButton}
        >
          <Feather
            name="message-circle"
            size={18}
            color={showReplies ? colors.primary : colors.textSecondary}
          />
          <Text
            style={[
              styles.actionButtonText,
              showReplies && { color: colors.primary }
            ]}
          >
            {repliesCount}
          </Text>
        </TouchableOpacity>
      </View>

      {showReplies && (
        <View style={styles.repliesContainer}>
          <ReplyList
            statusId={status.id}
            initialCount={repliesCount}
            onCountChange={setRepliesCount}
            focusReplyId={focusReplyId}
          />
        </View>
      )}

      {/* Modal de confirmación de borrado */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDeleteModal(false)}
        >
          <View style={styles.deleteModal}>
            <Feather name="trash-2" size={32} color={colors.error} />
            <Text style={styles.deleteModalTitle}>¿Eliminar publicación?</Text>
            <Text style={styles.deleteModalText}>Esta acción no se puede deshacer.</Text>
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                onPress={() => setShowDeleteModal(false)}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmDelete} style={styles.deleteConfirmButton}>
                <Text style={styles.deleteConfirmButtonText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal para escribir quote */}
      <Modal
        visible={showQuoteModal}
        animationType="slide"
        onRequestClose={() => {
          setShowQuoteModal(false);
          setQuoteContent('');
          setQuoteMediaFile(null);
          setQuoteMediaPreview(null);
        }}
      >
        <View style={styles.quoteModalContainer}>
          <View style={styles.quoteModalHeader}>
            <Text style={styles.quoteModalTitle}>Citar Tweet</Text>
            <TouchableOpacity
              onPress={() => {
                setShowQuoteModal(false);
                setQuoteContent('');
                setQuoteMediaFile(null);
                setQuoteMediaPreview(null);
              }}
              style={styles.quoteModalClose}
            >
              <Feather name="x" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.quoteModalContent}>
            <TextInput
              value={quoteContent}
              onChangeText={setQuoteContent}
              placeholder="Agrega un comentario..."
              style={styles.quoteTextarea}
              multiline
              maxLength={280}
              autoFocus
            />

            <Text style={styles.charCount}>{quoteContent.length}/280</Text>

            {/* Preview de media subido */}
            {quoteMediaPreview && (
              <View style={styles.uploadedMediaPreview}>
                {quoteMediaFile?.mimeType?.startsWith('image/') ||
                quoteMediaFile?.type?.startsWith('image/') ? (
                  <Image
                    source={{ uri: quoteMediaPreview }}
                    style={styles.uploadedMediaImage}
                    resizeMode="cover"
                  />
                ) : (
                  <Video
                    source={{ uri: quoteMediaPreview }}
                    style={styles.uploadedMediaImage}
                    useNativeControls
                    resizeMode="contain"
                    shouldPlay={false}
                  />
                )}
                <TouchableOpacity
                  onPress={handleRemoveMedia}
                  style={styles.removeMediaButton}
                >
                  <Feather name="x" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            )}

            {/* Preview del tweet citado */}
            <View style={styles.quotedTweetPreview}>
              <View style={styles.previewHeader}>
                <Text style={styles.previewAuthor}>@{status.author}</Text>
                <Text style={styles.previewDate}>
                  {status.createdAt ? formatDate(status.createdAt) : ''}
                </Text>
              </View>
              <Text style={styles.previewContent}>
                {renderContentWithMentions(status.content)}
              </Text>
              {status.mediaUrl && (
                <View style={styles.previewMedia}>{renderMedia(status.mediaUrl)}</View>
              )}
            </View>
          </ScrollView>

          <View style={styles.quoteModalFooter}>
            <TouchableOpacity
              onPress={handleMediaSelect}
              style={styles.mediaButton}
              disabled={isLoadingQuote || !!quoteMediaFile}
            >
              <Feather name="image" size={20} color={colors.primary} />
            </TouchableOpacity>
            <View style={styles.quoteModalActions}>
              <TouchableOpacity
                onPress={() => {
                  setShowQuoteModal(false);
                  setQuoteContent('');
                  setQuoteMediaFile(null);
                  setQuoteMediaPreview(null);
                }}
                style={styles.cancelButtonModal}
                disabled={isLoadingQuote}
              >
                <Text style={styles.cancelButtonModalText}>Cancelar</Text>
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
        </View>
      </Modal>

      {/* Modal menú de repost/quote */}
      <Modal
        visible={showRepostMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowRepostMenu(false)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setShowRepostMenu(false)}
        >
          <View style={styles.repostMenu}>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                setShowRepostMenu(false);
                handleRepost();
              }}
              style={styles.menuItem}
              disabled={isLoadingRepost}
            >
              <Feather name="repeat" size={20} color={colors.textPrimary} />
              <Text style={styles.menuItemText}>
                {isReposted ? 'Deshacer Repost' : 'Repost'}
              </Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                handleQuote();
              }}
              style={styles.menuItem}
              disabled={isLoadingQuote}
            >
              <Feather name="edit-3" size={20} color={colors.textPrimary} />
              <Text style={styles.menuItemText}>Quote</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  postCard: {
    backgroundColor: colors.backgroundPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12
  },
  repostBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12
  },
  repostText: {
    color: '#666',
    fontSize: 13,
    fontWeight: '600'
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  authorInfo: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    flex: 1
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold'
  },
  avatarImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundSecondary
  },
  authorTextContainer: {
    flex: 1
  },
  authorName: {
    fontSize: 16,
    color: '#000',
    fontWeight: 'bold'
  },
  date: {
    fontSize: 14,
    color: '#666',
    marginTop: 2
  },
  deleteButton: {
    padding: 8,
    minWidth: 40,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center'
  },
  content: {
    marginBottom: 12
  },
  contentText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#000'
  },
  mention: {
    color: colors.primary,
    fontWeight: '600'
  },
  mediaWrapper: {
    marginTop: 8,
    marginBottom: 12
  },
  media: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundSecondary
  },
  mediaLink: {
    color: colors.primary,
    textDecorationLine: 'underline'
  },
  quoteCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    backgroundColor: colors.backgroundSecondary
  },
  deletedQuoteCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    backgroundColor: colors.backgroundSecondary,
    opacity: 0.6
  },
  deletedQuoteText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#666',
    flex: 1
  },
  quoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8
  },
  quoteBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary
  },
  quoteAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    flex: 1
  },
  quoteDate: {
    fontSize: 12,
    color: '#666'
  },
  quoteContent: {
    marginTop: 4
  },
  quoteContentText: {
    fontSize: 15,
    color: '#000',
    lineHeight: 20
  },
  quoteMediaWrapper: {
    marginTop: 8
  },
  footer: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center'
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    borderRadius: 4,
    minWidth: 60,
    minHeight: 40
  },
  actionButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500'
  },
  repostMenuContainer: {
    position: 'relative'
  },
  repliesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  deleteModal: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#14171a',
    marginTop: 16,
    marginBottom: 8
  },
  deleteModalText: {
    fontSize: 15,
    color: '#657786',
    textAlign: 'center',
    marginBottom: 24
  },
  deleteModalButtons: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
    width: '100%'
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#f7f9fa',
    borderWidth: 1,
    borderColor: '#e1e8ed',
    borderRadius: 24
  },
  cancelButtonText: {
    color: '#14171a',
    fontSize: 15,
    fontWeight: 'bold'
  },
  deleteConfirmButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: colors.error,
    borderRadius: 24
  },
  deleteConfirmButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold'
  },
  quoteModalContainer: {
    flex: 1,
    backgroundColor: colors.backgroundPrimary
  },
  quoteModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  quoteModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000'
  },
  quoteModalClose: {
    padding: 8
  },
  quoteModalContent: {
    flex: 1,
    padding: 16
  },
  quoteTextarea: {
    fontSize: 18,
    lineHeight: 26,
    color: '#000',
    minHeight: 120,
    textAlignVertical: 'top'
  },
  charCount: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
    marginTop: 8,
    marginBottom: 16
  },
  uploadedMediaPreview: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16
  },
  uploadedMediaImage: {
    width: '100%',
    height: 200
  },
  removeMediaButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  quotedTweetPreview: {
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.backgroundSecondary,
    marginBottom: 16
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  previewAuthor: {
    fontWeight: 'bold',
    color: '#000',
    fontSize: 15
  },
  previewDate: {
    color: '#666',
    fontSize: 14,
    marginLeft: 8
  },
  previewContent: {
    fontSize: 15,
    color: '#000',
    lineHeight: 22
  },
  previewMedia: {
    marginTop: 8
  },
  quoteModalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12
  },
  mediaButton: {
    padding: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center'
  },
  quoteModalActions: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
    justifyContent: 'flex-end'
  },
  cancelButtonModal: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24
  },
  cancelButtonModalText: {
    color: '#666',
    fontSize: 15,
    fontWeight: 'bold'
  },
  submitButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: colors.primary,
    borderRadius: 24,
    minWidth: 80,
    alignItems: 'center'
  },
  submitButtonDisabled: {
    opacity: 0.5
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold'
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  repostMenu: {
    backgroundColor: colors.backgroundPrimary,
    borderRadius: 12,
    minWidth: 180,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000'
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.border
  }
});

export default StatusItem;
