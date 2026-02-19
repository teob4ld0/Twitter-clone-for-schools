import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform
} from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from '../utils/imagePicker';
import { useAuth } from '../context/AuthContext';
import { usersAPI, statusAPI, followersAPI, repliesAPI, interestSignalsAPI } from '../services/api';
import StatusItem from '../components/StatusItem';
import Reply from '../components/Reply';
import FollowingButton from '../components/FollowingButton';
import MessageButton from '../components/MessageButton';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';

const ProfileScreen = ({ route, navigation }) => {
  const { userId: routeUserId } = route.params || {};
  const { user: currentUser, updateUser, isAdmin } = useAuth();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = useProfileThemedStyles(theme);

  // Determinar el userId a mostrar
  const profileUserId = routeUserId 
    ? parseInt(String(routeUserId), 10) 
    : currentUser?.id;

  const currentUserId = currentUser?.id != null
    ? parseInt(String(currentUser.id), 10)
    : null;

  // Estados
  const [user, setUser] = useState(null);
  const [statuses, setStatuses] = useState([]);
  const [likes, setLikes] = useState({ statuses: [], replies: [] });
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isMutual, setIsMutual] = useState(false);
  const [followsYou, setFollowsYou] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [activeTab, setActiveTab] = useState('statuses');
  const [mutualFollowers, setMutualFollowers] = useState([]);

  const [uploadingProfilePicture, setUploadingProfilePicture] = useState(false);
  const [avatarVersion, setAvatarVersion] = useState(0);

  // Determinar si es el propio perfil
  const isOwnProfile = currentUserId != null && profileUserId === currentUserId;

  // URL del avatar
  const avatarSrc = user?.profilePictureUrl
    ? `${user.profilePictureUrl}${user.profilePictureUrl.includes('?') ? '&' : '?'}v=${avatarVersion}`
    : `https://ui-avatars.com/api/?name=${user?.username || ''}&background=random&size=150`;

  // Cargar datos del usuario
  useEffect(() => {
    fetchUserData();
  }, [profileUserId, activeTab]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener información del usuario
      const userResponse = await usersAPI.getById(profileUserId);
      setUser(userResponse.data);
      setFollowersCount(userResponse.data.followersCount || 0);

      // Emitir señal de interés si no es el propio perfil
      if (!isOwnProfile && currentUser) {
        try {
          const metadataObj = {
            viewedUserId: profileUserId,
            viewerUserId: currentUser.id,
            timestamp: new Date().toISOString(),
            source: 'ProfileScreen'
          };
          await interestSignalsAPI.record({
            statusId: null,
            signalType: 'opening_user_profile',
            value: 1,
            metadata: JSON.stringify(metadataObj)
          });
          console.log('[InterestSignal] Señal opening_user_profile enviada');
        } catch (signalError) {
          console.warn('[InterestSignal] Error al registrar opening_user_profile:', signalError);
        }
      }

      // Obtener estado de follow y seguidores mutuos
      try {
        const followStatus = await followersAPI.getFollowStatus(profileUserId);
        setIsFollowing(followStatus.data.isFollowing);
        setIsMutual(followStatus.data.isMutual || false);
        setFollowsYou(followStatus.data.followsBack || false);

        const mutualData = await followersAPI.getMutualFollowers(profileUserId);
        setMutualFollowers(mutualData.data.mutualFollowers || []);
      } catch (followErr) {
        console.log('No se pudo obtener el estado de follow');
      }

      // Cargar datos según tab activo
      await loadTabData(activeTab);

    } catch (err) {
      console.error('Error:', err);
      setError(err.response?.data?.error || 'Error al cargar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const loadTabData = async (tab) => {
    try {
      switch (tab) {
        case 'statuses':
          const statusesResponse = await statusAPI.getByUser(profileUserId);
          setStatuses(statusesResponse.data);
          break;
        case 'likes':
          const likesResponse = await usersAPI.getLikes(profileUserId);
          setLikes(likesResponse.data);
          break;
        case 'replies':
          const repliesResponse = await usersAPI.getReplies(profileUserId);
          setReplies(repliesResponse.data);
          break;
      }
    } catch (err) {
      console.error('Error loading tab data:', err);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserData();
    setRefreshing(false);
  };

  const handleStatusDelete = (statusId) => {
    setStatuses(statuses.filter(status => status.id !== statusId));
  };

  const handleFollowChange = (newFollowStatus) => {
    setIsFollowing(newFollowStatus);
    setIsMutual(newFollowStatus && followsYou);
    setFollowersCount(prev => newFollowStatus ? prev + 1 : prev - 1);
  };

  const updateReplyInLikesState = (replyId, updater) => {
    setLikes(prev => {
      const updatedReplies = (prev.replies || []).map(r => {
        if (r.id !== replyId) return r;
        return updater(r);
      });
      return { ...prev, replies: updatedReplies };
    });
  };

  const updateReplyInRepliesTabState = (replyId, updater) => {
    setReplies(prev => (prev || []).map(r => (r.id === replyId ? updater(r) : r)));
  };

  const handleDeleteReply = async (replyId) => {
    try {
      await repliesAPI.delete(replyId);
      setReplies(prev => (prev || []).filter(r => r.id !== replyId));
      setLikes(prev => ({
        ...prev,
        replies: (prev.replies || []).filter(r => r.id !== replyId)
      }));
    } catch (err) {
      console.error('Error al eliminar la respuesta:', err);
      Alert.alert(t('common.error'), t('errors.tryAgain'));
    }
  };

  const handleGoToStatus = (statusId, replyId = null) => {
    if (!statusId) return;
    navigation.navigate('StatusDetail', { statusId, replyId });
  };



  const handlePickProfilePicture = async () => {
    if (!isOwnProfile) return;

    // Pedir permisos
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permisos necesarios', 'Necesitamos acceso a tu galería para cambiar la foto de perfil');
      return;
    }

    // Abrir selector de imagen
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      await handleProfilePictureSelected(result.assets[0]);
    }
  };

  const handleProfilePictureSelected = async (asset) => {
    try {
      setUploadingProfilePicture(true);

      // Preparar el archivo para enviar (ahora con mejor compatibilidad Android)
      const mimeType = asset.mimeType || asset.type || 'image/jpeg';
      const fileName = asset.fileName || `profile_${Date.now()}.jpg`;

      const file = {
        uri: asset.uri,
        name: fileName,
        type: mimeType,
      };

      console.log('📤 Subiendo foto de perfil:', { uri: file.uri, type: file.type, name: file.name });

      const resp = await usersAPI.updateProfilePicture(file);
      const newUrl = resp.data?.profilePictureUrl;
      if (!newUrl) throw new Error('Missing profilePictureUrl');

      setUser(prev => ({ ...prev, profilePictureUrl: newUrl }));
      if (isOwnProfile) updateUser({ profilePictureUrl: newUrl });
      setAvatarVersion(v => v + 1);
      Alert.alert('Éxito', 'Foto de perfil actualizada');
    } catch (err) {
      console.error('❌ Error updating profile picture:', err);
      Alert.alert('Error', `No se pudo actualizar la foto de perfil: ${err.message}`);
    } finally {
      setUploadingProfilePicture(false);
    }
  };

  // Renderizar loading
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </View>
    );
  }

  // Renderizar error
  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Feather name="alert-circle" size={48} color={theme.colors.error} />
        <Text style={styles.errorTitle}>Error</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Renderizar si no hay usuario
  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Usuario no encontrado</Text>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Preparar datos para la lista de likes (mezclados)
  const getLikesData = () => {
    if (activeTab !== 'likes') return [];
    
    const mixedData = [
      ...likes.statuses.map(s => ({ ...s, type: 'status' })),
      ...likes.replies.map(r => ({ ...r, type: 'reply' }))
    ].sort((a, b) => new Date(b.likedAt) - new Date(a.likedAt));

    return mixedData;
  };

  // Renderizar item de la lista
  const renderItem = ({ item }) => {
    if (activeTab === 'statuses') {
      return (
        <StatusItem
          status={item}
          onDelete={handleStatusDelete}
          repostedByUsername={item.isRepost ? user?.username : null}
        />
      );
    }

    if (activeTab === 'likes') {
      if (item.type === 'status') {
        return (
          <StatusItem
            status={item}
            onDelete={() => {}}
          />
        );
      } else {
        // Reply en likes
        return (
          <View style={styles.replyCard}>
            <View style={styles.replyHeader}>
              <View style={styles.replyHeaderLeft}>
                <View style={styles.replyBadge}>
                  <Text style={styles.replyBadgeText}>💬 {t('profile.reply')}</Text>
                </View>
              </View>
              <Text style={styles.replyDate}>
                {new Date(item.createdAt).toLocaleDateString(t('common.language') === 'en' ? 'en-US' : 'es-AR')}
              </Text>
            </View>

            <Reply
              reply={item}
              onDelete={handleDeleteReply}
              onLikeUpdate={(replyId, isLiked, likesCount) => {
                updateReplyInLikesState(replyId, r => ({
                  ...r,
                  isLikedByCurrentUser: isLiked,
                  likes: typeof likesCount === 'number' ? likesCount : r.likes
                }));
              }}
            />

            <TouchableOpacity
              onPress={() => handleGoToStatus(item.parentStatusId, item.id)}
              style={styles.replyMeta}
            >
              <Text style={styles.replyMetaText}>
                {t('profile.inReplyTo')} <Text style={styles.bold}>{item.parentAuthor}</Text>: "
                <Text style={styles.truncate} numberOfLines={2}>{item.parentContent}</Text>"
              </Text>
            </TouchableOpacity>
          </View>
        );
      }
    }

    if (activeTab === 'replies') {
      return (
        <View style={styles.replyCard}>
          <View style={styles.replyHeader}>
            <View style={styles.replyBadge}>
              <Text style={styles.replyBadgeText}>💬 {t('profile.reply')}</Text>
            </View>
            <Text style={styles.replyDate}>
              {new Date(item.createdAt).toLocaleDateString(t('common.language') === 'en' ? 'en-US' : 'es-AR')}
            </Text>
          </View>

          <Reply
            reply={item}
            onDelete={handleDeleteReply}
            onLikeUpdate={(replyId, isLiked, likesCount) => {
              updateReplyInRepliesTabState(replyId, r => ({
                ...r,
                isLikedByCurrentUser: isLiked,
                likes: typeof likesCount === 'number' ? likesCount : r.likes
              }));
            }}
          />

          <TouchableOpacity
            onPress={() => handleGoToStatus(item.parentStatusId, item.id)}
            style={styles.replyMeta}
          >
            <Text style={styles.replyMetaText}>
              {t('profile.inReplyTo')} <Text style={styles.bold}>{item.parentAuthor}</Text>: "
              {item.parentContent.substring(0, 50)}..."
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return null;
  };

  // Obtener datos según tab
  const getTabData = () => {
    switch (activeTab) {
      case 'statuses':
        return statuses;
      case 'likes':
        return getLikesData();
      case 'replies':
        return replies;
      default:
        return [];
    }
  };

  // Renderizar empty state
  const renderEmptyState = () => {
    let message = '';
    switch (activeTab) {
      case 'statuses':
        message = t('profile.emptyStates.noPosts');
        break;
      case 'likes':
        message = t('profile.emptyStates.noLikes');
        break;
      case 'replies':
        message = t('profile.emptyStates.noReplies');
        break;
    }

    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>{message}</Text>
      </View>
    );
  };

  // Renderizar header del perfil
  const renderHeader = () => (
    <View>
      {/* Header con botón volver */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonHeader}>
          <Feather name="arrow-left" size={24} color={theme.colors.primary} />
          <Text style={styles.backButtonHeaderText}>{t('common.back')}</Text>
        </TouchableOpacity>
      </View>

      {/* Información del usuario */}
      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: avatarSrc }}
            style={styles.avatar}
          />
          {isOwnProfile && (
            <TouchableOpacity
              onPress={handlePickProfilePicture}
              disabled={uploadingProfilePicture}
              style={[
                styles.changePhotoButton,
                uploadingProfilePicture && styles.changePhotoButtonDisabled
              ]}
            >
              <Text style={styles.changePhotoButtonText}>
                {uploadingProfilePicture ? t('profile.uploading') : t('profile.changePhoto')}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.nameContainer}>
            <Text style={styles.username}>
              {user.username}
              <Text style={styles.userId}> #{user.id}</Text>
            </Text>
            {isMutual && (
              <View style={styles.mutualBadge}>
                <Text style={styles.mutualBadgeText}>↔️ {t('profile.mutual')}</Text>
              </View>
            )}
            {!isMutual && followsYou && !isFollowing && (
              <View style={styles.followsYouBadge}>
                <Text style={styles.followsYouBadgeText}>{t('profile.followsYou')}</Text>
              </View>
            )}
          </View>

          {/* Botones de mensaje y seguir */}
          <View style={styles.actionButtons}>
            <MessageButton userId={profileUserId} />
            <View style={styles.followButtonContainer}>
              <FollowingButton
                userId={profileUserId}
                initialIsFollowing={isFollowing}
                onFollowChange={handleFollowChange}
              />
            </View>
          </View>

          {/* Botón de Admin - solo visible en el propio perfil si eres admin */}
          {isOwnProfile && isAdmin && isAdmin() && (
            <TouchableOpacity
              onPress={() => navigation.navigate('Admin')}
              style={styles.adminButton}
            >
              <MaterialIcons name="admin-panel-settings" size={20} color={theme.colors.textOnPrimary} />
              <Text style={styles.adminButtonText}>{t('profile.adminPanel')}</Text>
            </TouchableOpacity>
          )}

          {/* Stats */}
          <Text style={styles.stats}>
            📝 {statuses.length} {statuses.length === 1 ? t('profile.status') : t('profile.statuses')} •
            👥 {followersCount} {followersCount === 1 ? t('profile.follower') : t('profile.followers')}
          </Text>

          <Text style={styles.memberSince}>
            {t('profile.memberSince')} {new Date(user.createdAt).toLocaleDateString(t('common.language') === 'en' ? 'en-US' : 'es-AR')}
          </Text>

          {/* Seguidores mutuos */}
          {mutualFollowers.length > 0 && (
            <Text style={styles.mutualFollowersText}>
              {t('profile.followedBy')}{' '}
              {mutualFollowers.map((follower, index) => (
                <Text key={follower.id}>
                  <Text style={styles.bold}>{follower.username}</Text>
                  {index < mutualFollowers.length - 1 && (
                    index === mutualFollowers.length - 2 ? ' y ' : ', '
                  )}
                </Text>
              ))}
              {' '}{t('profile.youFollow')}
            </Text>
          )}
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          onPress={() => setActiveTab('statuses')}
          style={[
            styles.tab,
            activeTab === 'statuses' && styles.activeTab
          ]}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'statuses' && styles.activeTabText
          ]}>
            {t('profile.tabs.statuses')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('likes')}
          style={[
            styles.tab,
            activeTab === 'likes' && styles.activeTab
          ]}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'likes' && styles.activeTabText
          ]}>
            {t('profile.tabs.likes')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('replies')}
          style={[
            styles.tab,
            activeTab === 'replies' && styles.activeTab
          ]}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'replies' && styles.activeTabText
          ]}>
            {t('profile.tabs.replies')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={getTabData()}
        renderItem={renderItem}
        keyExtractor={(item, index) => 
          `${activeTab}-${item.type || 'item'}-${item.id}-${index}`
        }
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
          />
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

function useProfileThemedStyles(theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
      padding: 20,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
    errorTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.error,
      marginTop: 16,
      marginBottom: 8,
    },
    errorText: {
      fontSize: 16,
      color: theme.colors.error,
      textAlign: 'center',
      marginBottom: 16,
    },
    backButton: {
      paddingHorizontal: 24,
      paddingVertical: 12,
      backgroundColor: theme.colors.primary,
      borderRadius: 9999,
      marginTop: 16,
    },
    backButtonText: {
      color: theme.colors.textOnPrimary,
      fontSize: 16,
      fontWeight: 'bold',
    },
    listContent: {
      flexGrow: 1,
      paddingBottom: 80,
    },
    header: {
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      backgroundColor: theme.colors.cardBackground,
    },
    backButtonHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    backButtonHeaderText: {
      color: theme.colors.primary,
      fontSize: 16,
      fontWeight: 'bold',
    },
    profileCard: {
      backgroundColor: theme.colors.cardBackground,
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    avatarContainer: {
      alignItems: 'center',
      marginBottom: 16,
    },
    avatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
      borderWidth: 3,
      borderColor: theme.colors.background,
    },
    changePhotoButton: {
      marginTop: 10,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 9999,
      borderWidth: 1,
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.cardBackground,
    },
    changePhotoButtonDisabled: {
      opacity: 0.5,
    },
    changePhotoButtonText: {
      color: theme.colors.primary,
      fontSize: 14,
      fontWeight: 'bold',
    },
    infoContainer: {
      flex: 1,
    },
    nameContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 8,
    },
    username: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.textPrimary,
    },
    userId: {
      fontSize: 14,
      fontWeight: 'normal',
      color: theme.colors.textSecondary,
    },
    mutualBadge: {
      backgroundColor: theme.colors.infoBackground,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    mutualBadgeText: {
      fontSize: 12,
      color: theme.colors.primary,
      fontWeight: '600',
    },
    followsYouBadge: {
      backgroundColor: theme.colors.backgroundTertiary,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    followsYouBadgeText: {
      fontSize: 12,
      color: theme.colors.textPrimary,
      fontWeight: '600',
    },
    actionButtons: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 12,
      marginBottom: 12,
    },
    followButtonContainer: {
      flex: 1,
    },
    adminButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: theme.colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 9999,
      marginTop: 12,
    },
    adminButtonText: {
      color: theme.colors.textOnPrimary,
      fontSize: 15,
      fontWeight: 'bold',
    },
    stats: {
      fontSize: 15,
      fontWeight: 'bold',
      color: theme.colors.textPrimary,
      marginBottom: 4,
    },
    memberSince: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 8,
    },
    mutualFollowersText: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      marginTop: 4,
    },
    bold: {
      fontWeight: 'bold',
    },
    tabsContainer: {
      flexDirection: 'row',
      backgroundColor: theme.colors.cardBackground,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    tab: {
      flex: 1,
      paddingVertical: 16,
      alignItems: 'center',
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    activeTab: {
      borderBottomColor: theme.colors.primary,
    },
    tabText: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    activeTabText: {
      color: theme.colors.primary,
    },
    emptyState: {
      backgroundColor: theme.colors.background,
      padding: 40,
      margin: 16,
      borderRadius: 12,
      alignItems: 'center',
    },
    emptyStateText: {
      fontSize: 15,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    replyCard: {
      backgroundColor: theme.colors.cardBackground,
      padding: 16,
      marginHorizontal: 12,
      marginVertical: 6,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    replyHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    replyHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flex: 1,
    },
    replyBadge: {
      backgroundColor: theme.colors.infoBackground,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 12,
    },
    replyBadgeText: {
      fontSize: 12,
      color: theme.colors.primary,
      fontWeight: '600',
    },
    replyDate: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    replyMeta: {
      marginTop: 8,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: theme.colors.borderLight,
    },
    replyMetaText: {
      fontSize: 13,
      color: theme.colors.textSecondary,
    },
    truncate: {
      flex: 1,
    },
  });
}

export default ProfileScreen;
