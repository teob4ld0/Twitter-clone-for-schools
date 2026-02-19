import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  ScrollView,
  Platform,
  Image
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { adminAPI, reportsAPI } from '../services/api';
import { useTheme } from '../context/ThemeContext';

const AdminScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = useAdminThemedStyles(theme);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [activeTab, setActiveTab] = useState('users');
  const [deletedStatuses, setDeletedStatuses] = useState([]);
  const [deletedMessages, setDeletedMessages] = useState([]);
  const [deletedLoading, setDeletedLoading] = useState(false);
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsTotalCount, setReportsTotalCount] = useState(0);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchQuery, users]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await adminAPI.getAllUsers();
      setUsers(response.data);
    } catch (err) {
      const errorMessage = err.message || 'Error al cargar usuarios';
      setError(errorMessage);
      console.error('Error:', err);
      if (errorMessage.includes('403')) {
        setError('No tienes permisos de administrador');
      }
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUsers();
    setRefreshing(false);
  };

  const filterUsers = () => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = users.filter(
      (user) =>
        user.username.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.id.toString().includes(query)
    );
    setFilteredUsers(filtered);
  };

  const loadDeletedStatuses = async () => {
    try {
      setDeletedLoading(true);
      const response = await adminAPI.getDeletedStatuses();
      setDeletedStatuses(response.data);
    } catch (err) {
      console.error('Error loading deleted statuses:', err);
    } finally {
      setDeletedLoading(false);
    }
  };

  const loadDeletedMessages = async () => {
    try {
      setDeletedLoading(true);
      const response = await adminAPI.getDeletedMessages();
      setDeletedMessages(response.data);
    } catch (err) {
      console.error('Error loading deleted messages:', err);
    } finally {
      setDeletedLoading(false);
    }
  };

  const loadReports = async () => {
    try {
      setReportsLoading(true);
      const response = await reportsAPI.getAll({ pageSize: 100 });
      setReports(response.data.data || []);
      setReportsTotalCount(response.data.total || 0);
    } catch (err) {
      console.error('Error loading reports:', err);
    } finally {
      setReportsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'deletedStatuses' && deletedStatuses.length === 0) {
      loadDeletedStatuses();
    } else if (activeTab === 'deletedMessages' && deletedMessages.length === 0) {
      loadDeletedMessages();
    } else if (activeTab === 'reports' && reports.length === 0) {
      loadReports();
    }
  }, [activeTab]);

  const handleBanUser = async (userId, username, isBanned) => {
    Alert.alert(
      isBanned ? t('admin.unbanUser') : t('admin.banUser'),
      `¿Estás seguro de que deseas ${isBanned ? t('admin.unbanUser').toLowerCase() : t('admin.banUser').toLowerCase()} a ${username}?`,
      [
        { text: t('common.cancel') || 'Cancelar', style: 'cancel' },
        {
          text: t('common.confirm') || 'Confirmar',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(userId);
              await adminAPI.banUser(userId);
              await loadUsers();
              Alert.alert('✓', isBanned ? t('admin.unbanSuccess') : t('admin.banSuccess'));
            } catch (err) {
              Alert.alert('Error', err.message || t('admin.actionError'));
              console.error('Error:', err);
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const handleDeleteUser = async (userId, username) => {
    Alert.alert(
      `⚠️ ${t('admin.deleteUser').toUpperCase()}`,
      `${t('admin.deleteUserConfirm').replace('este usuario', username)}\n\nEsta acción NO se puede deshacer.`,
      [
        { text: t('common.cancel') || 'Cancelar', style: 'cancel' },
        {
          text: t('admin.deleteUser').toUpperCase(),
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(userId);
              await adminAPI.deleteUser(userId);
              await loadUsers();
              Alert.alert('✓', t('admin.deleteSuccess'));
            } catch (err) {
              Alert.alert('Error', err.message || t('admin.actionError'));
              console.error('Error:', err);
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const getInitial = (username) => {
    return username ? username.charAt(0).toUpperCase() : '?';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderUserItem = ({ item }) => {
    const isStudent = item.email.endsWith('@alumno.etec.um.edu.ar');
    const isActionLoading = actionLoading === item.id;

    return (
      <View style={styles.userCard}>
        {/* Avatar y info básica */}
        <View style={styles.userHeader}>
          <View style={styles.avatarContainer}>
            {item.profilePictureUrl ? (
              <Image source={{ uri: item.profilePictureUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{getInitial(item.username)}</Text>
              </View>
            )}
          </View>

          <View style={styles.userInfo}>
            <View style={styles.usernameRow}>
              <Text style={styles.username}>{item.username}</Text>
              {item.banned && <View style={styles.bannedBadge}>
                <Text style={styles.bannedText}>{t('admin.banned')}</Text>
              </View>}
            </View>
            <Text style={styles.email}>{item.email}</Text>
            <Text style={styles.userMeta}>ID: {item.id}</Text>
            <Text style={styles.userMeta}>{t('admin.createdAt', { date: formatDate(item.createdAt) })}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Feather name="file-text" size={14} color={theme.colors.textSecondary} />
            <Text style={styles.statText}>{item.statusesCount || 0} posts</Text>
          </View>
          <View style={styles.statItem}>
            <Feather name="users" size={14} color={theme.colors.textSecondary} />
            <Text style={styles.statText}>{item.followersCount || 0} seguidores</Text>
          </View>
          <View style={styles.statItem}>
            <Feather name="user-check" size={14} color={theme.colors.textSecondary} />
            <Text style={styles.statText}>{item.followingCount || 0} siguiendo</Text>
          </View>
        </View>

        {/* Badge de tipo de usuario */}
        <View style={styles.badgeContainer}>
          <View style={isStudent ? styles.studentBadge : styles.adminBadge}>
            <Text style={styles.badgeText}>
              {isStudent ? t('admin.student') : t('admin.admin')}
            </Text>
          </View>
        </View>

        {/* Botones de acción (solo para estudiantes) */}
        {isStudent && (
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, item.banned ? styles.unbanButton : styles.banButton]}
              onPress={() => handleBanUser(item.id, item.username, item.banned)}
              disabled={isActionLoading}
            >
              {isActionLoading ? (
                <ActivityIndicator size="small" color={theme.colors.textOnPrimary} />
              ) : (
                <>
                  <Feather
                    name={item.banned ? 'unlock' : 'slash'}
                    size={16}
                    color={theme.colors.textOnPrimary}
                  />
                  <Text style={styles.actionButtonText}>
                    {item.banned ? t('admin.unbanUser') : t('admin.banUser')}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => handleDeleteUser(item.id, item.username)}
              disabled={isActionLoading}
            >
              {isActionLoading ? (
                <ActivityIndicator size="small" color={theme.colors.textOnPrimary} />
              ) : (
                <>
                  <Feather name="trash-2" size={16} color={theme.colors.textOnPrimary} />
                  <Text style={styles.actionButtonText}>{t('admin.deleteUser')}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderDeletedStatus = ({ item }) => (
    <View style={styles.userCard}>
      <View style={styles.userHeader}>
        <View style={styles.avatarContainer}>
          {item.authorProfilePictureUrl ? (
            <Image source={{ uri: item.authorProfilePictureUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{item.author?.charAt(0).toUpperCase() || '?'}</Text>
            </View>
          )}
        </View>
        <View style={styles.userInfo}>
          <View style={styles.usernameRow}>
            <Text style={styles.username}>@{item.author}</Text>
            <View style={[styles.bannedBadge, { backgroundColor: '#95a5a6' }]}>
              <Text style={styles.bannedText}>{t('admin.deleted')}</Text>
            </View>
          </View>
          <Text style={styles.userMeta}>{t('admin.statusId', { id: item.id })}</Text>
        </View>
      </View>
      <Text style={{ color: theme.colors.textPrimary, marginBottom: 8 }}>{item.content}</Text>
      {item.mediaUrl && (
          <Text style={{ color: theme.colors.primary, fontSize: 13, marginBottom: 8 }}>{t('admin.mediaAttachment')}</Text>
      )}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Feather name="clock" size={12} color={theme.colors.textSecondary} />
          <Text style={styles.statText}>{t('admin.createdAt', { date: formatDate(item.createdAt) })}</Text>
        </View>
        <View style={styles.statItem}>
          <Feather name="trash-2" size={12} color={theme.colors.textSecondary} />
          <Text style={styles.statText}>{t('admin.deletedAt', { date: formatDate(item.deletedAt) })}</Text>
        </View>
      </View>
      {item.parentStatusId && (
        <Text style={{ color: theme.colors.textSecondary, fontSize: 12, marginTop: 4 }}>
          {t('admin.replyTo', { id: item.parentStatusId })}
        </Text>
      )}
    </View>
  );

  const renderDeletedMessage = ({ item }) => (
    <View style={styles.userCard}>
      <View style={styles.userHeader}>
        <View style={styles.avatarContainer}>
          {item.senderProfilePictureUrl ? (
            <Image source={{ uri: item.senderProfilePictureUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{item.senderUsername?.charAt(0).toUpperCase() || '?'}</Text>
            </View>
          )}
        </View>
        <View style={styles.userInfo}>
          <View style={styles.usernameRow}>
            <Text style={styles.username}>@{item.senderUsername}</Text>
            <View style={[styles.bannedBadge, { backgroundColor: '#95a5a6' }]}>
              <Text style={styles.bannedText}>{t('admin.deleted')}</Text>
            </View>
          </View>
          <Text style={styles.userMeta}>{t('admin.messageId', { chatId: item.chatId, id: item.id })}</Text>
        </View>
      </View>
      <Text style={{ color: theme.colors.textPrimary, marginBottom: 8 }}>{item.content || t('admin.noText')}</Text>
      {item.mediaUrl && (
        <Text style={{ color: theme.colors.primary, fontSize: 13, marginBottom: 8 }}>{t('admin.mediaAttachment')}</Text>
      )}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Feather name="clock" size={12} color={theme.colors.textSecondary} />
          <Text style={styles.statText}>{t('admin.sentAt', { date: formatDate(item.createdAt) })}</Text>
        </View>
        <View style={styles.statItem}>
          <Feather name="trash-2" size={12} color={theme.colors.textSecondary} />
          <Text style={styles.statText}>{t('admin.deletedAt', { date: formatDate(item.deletedAt) })}</Text>
        </View>
      </View>
      <Text style={{ color: theme.colors.textSecondary, fontSize: 12, marginTop: 4 }}>
        {t('admin.betweenUsers', { user1: item.chatUser1Id, user2: item.chatUser2Id })}
      </Text>
    </View>
  );

  const renderReportItem = ({ item }) => (
    <View style={styles.userCard}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>
          {t('admin.reportId', { id: item.id }) || `Reporte #${item.id}`}
        </Text>
        <View style={{
          backgroundColor: `${theme.colors.error}22`,
          borderRadius: 8,
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderWidth: 1,
          borderColor: `${theme.colors.error}55`
        }}>
          <Text style={{ fontSize: 11, color: theme.colors.error, fontWeight: 'bold' }}>
            {item.type}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
        <Feather name="user" size={13} color={theme.colors.textSecondary} style={{ marginRight: 4 }} />
        <Text style={{ fontSize: 13, color: theme.colors.textSecondary }}>
          {t('admin.reporter') || 'Reportado por'}:{' '}
          <Text style={{ color: theme.colors.textPrimary, fontWeight: '600' }}>
            @{item.reporter?.username}
          </Text>
        </Text>
      </View>

      {item.reportedUser && (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          <Feather name="alert-circle" size={13} color={theme.colors.warning} style={{ marginRight: 4 }} />
          <Text style={{ fontSize: 13, color: theme.colors.textSecondary }}>
            {t('admin.reportedUser') || 'Usuario reportado'}:{' '}
            <Text style={{ color: theme.colors.textPrimary, fontWeight: '600' }}>
              @{item.reportedUser?.username}
            </Text>
          </Text>
        </View>
      )}

      {item.statusId && (
        <View style={{ marginBottom: 4 }}>
          <Text style={{ fontSize: 13, color: theme.colors.textSecondary, marginBottom: 4 }}>
            {t('admin.reportedPost') || 'Publicación reportada'} (#{item.statusId}):
          </Text>
          {item.statusContent && (
            <View style={{
              backgroundColor: theme.colors.backgroundSecondary,
              borderRadius: 8,
              padding: 8,
              borderWidth: 1,
              borderColor: theme.colors.border
            }}>
              <Text style={{ fontSize: 13, color: theme.colors.textPrimary }} numberOfLines={3}>
                {item.statusContent}
              </Text>
            </View>
          )}
        </View>
      )}

      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
        <Feather name="clock" size={12} color={theme.colors.textSecondary} style={{ marginRight: 4 }} />
        <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>
          {formatDate(item.createdAt)}
        </Text>
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>{t('admin.loading')}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Feather name="alert-circle" size={48} color={theme.colors.error} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadUsers}>
          <Text style={styles.retryButtonText}>{t('errors.tryAgain')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('admin.title')}</Text>
        <Text style={styles.subtitle}>{t('admin.totalUsersCount', { count: users.length })}</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'users' && styles.activeTab]}
          onPress={() => setActiveTab('users')}
        >
          <Text style={[styles.tabText, activeTab === 'users' && { color: theme.colors.primary }]}>
            👥 {t('admin.users')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'deletedStatuses' && styles.activeTab]}
          onPress={() => setActiveTab('deletedStatuses')}
        >
          <Text style={[styles.tabText, activeTab === 'deletedStatuses' && { color: theme.colors.primary }]}>
            🗑️ {t('admin.deletedStatuses')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'deletedMessages' && styles.activeTab]}
          onPress={() => setActiveTab('deletedMessages')}
        >
          <Text style={[styles.tabText, activeTab === 'deletedMessages' && { color: theme.colors.primary }]}>
            💬 {t('admin.deletedMessages')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'reports' && styles.activeTab]}
          onPress={() => setActiveTab('reports')}
        >
          <Text style={[styles.tabText, activeTab === 'reports' && { color: theme.colors.primary }]}>
            🚩 {t('admin.reportsTab') || 'Reportes'}{reportsTotalCount > 0 ? ` (${reportsTotalCount})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab: Users */}
      {activeTab === 'users' && (
        <>
      {/* Buscador */}
      <View style={styles.searchContainer}>
        <Feather name="search" size={20} color={theme.colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('admin.searchPlaceholder')}
          placeholderTextColor={theme.colors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Feather name="x" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Lista de usuarios */}
      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderUserItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="users" size={48} color={theme.colors.textSecondary} />
            <Text style={styles.emptyText}>
              {searchQuery ? t('admin.noUsersFound') : t('admin.noUsers')}
            </Text>
          </View>
        }
      />
        </>
      )}

      {/* Tab: Deleted Statuses */}
      {activeTab === 'deletedStatuses' && (
        deletedLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>{t('admin.loadingDeletedStatuses')}</Text>
          </View>
        ) : (
          <FlatList
            data={deletedStatuses}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderDeletedStatus}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={false} onRefresh={loadDeletedStatuses} tintColor={theme.colors.primary} colors={[theme.colors.primary]} />
            }
            ListHeaderComponent={
              <Text style={[styles.subtitle, { padding: 16, paddingBottom: 8 }]}>
                {t('admin.deletedStatusesCount', { count: deletedStatuses.length })}
              </Text>
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Feather name="check-circle" size={48} color={theme.colors.textSecondary} />
                <Text style={styles.emptyText}>{t('admin.noDeletedStatuses')}</Text>
              </View>
            }
          />
        )
      )}

      {/* Tab: Deleted Messages */}
      {activeTab === 'deletedMessages' && (
        deletedLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>{t('admin.loadingDeletedMessages')}</Text>
          </View>
        ) : (
          <FlatList
            data={deletedMessages}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderDeletedMessage}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={false} onRefresh={loadDeletedMessages} tintColor={theme.colors.primary} colors={[theme.colors.primary]} />
            }
            ListHeaderComponent={
              <Text style={[styles.subtitle, { padding: 16, paddingBottom: 8 }]}>
                {t('admin.deletedMessagesCount', { count: deletedMessages.length })}
              </Text>
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Feather name="check-circle" size={48} color={theme.colors.textSecondary} />
                <Text style={styles.emptyText}>{t('admin.noDeletedMessages')}</Text>
              </View>
            }
          />
        )
      )}

      {/* Tab: Reports */}
      {activeTab === 'reports' && (
        reportsLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>{t('admin.loading')}</Text>
          </View>
        ) : (
          <FlatList
            data={reports}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderReportItem}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={false} onRefresh={loadReports} tintColor={theme.colors.primary} colors={[theme.colors.primary]} />
            }
            ListHeaderComponent={
              <Text style={[styles.subtitle, { padding: 16, paddingBottom: 8 }]}>
                {t('admin.totalReports', { count: reportsTotalCount }) || `Total: ${reportsTotalCount} reportes`}
              </Text>
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Feather name="check-circle" size={48} color={theme.colors.textSecondary} />
                <Text style={styles.emptyText}>{t('admin.noReports') || 'No hay reportes'}</Text>
              </View>
            }
          />
        )
      )}
    </View>
  );
};

function useAdminThemedStyles(theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    tabBar: {
      flexDirection: 'row',
      borderBottomWidth: 2,
      borderBottomColor: theme.colors.border,
    },
    tab: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
      marginBottom: -2,
    },
    activeTab: {
      borderBottomColor: theme.colors.primary,
    },
    tabText: {
      fontSize: 13,
      fontWeight: '500',
      color: theme.colors.textSecondary,
    },
    centerContainer: {
      flex: 1,
      backgroundColor: theme.colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    header: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.textPrimary,
    },
    subtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginTop: 4,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.backgroundSecondary,
      margin: 16,
      marginBottom: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      color: theme.colors.textPrimary,
      fontSize: 16,
      paddingVertical: 4,
    },
    listContent: {
      padding: 16,
      paddingTop: 8,
    },
    userCard: {
      backgroundColor: theme.colors.cardBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    userHeader: {
      flexDirection: 'row',
      marginBottom: 12,
    },
    avatarContainer: {
      marginRight: 12,
    },
    avatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
    },
    avatarPlaceholder: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarText: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.textOnPrimary,
    },
    userInfo: {
      flex: 1,
    },
    usernameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    username: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.textPrimary,
      marginRight: 8,
    },
    email: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 4,
    },
    userMeta: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingVertical: 12,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 12,
    },
    statItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginLeft: 4,
    },
    badgeContainer: {
      marginBottom: 12,
    },
    bannedBadge: {
      backgroundColor: theme.colors.error,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
    },
    bannedText: {
      fontSize: 10,
      fontWeight: 'bold',
      color: theme.colors.textOnPrimary,
    },
    studentBadge: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      alignSelf: 'flex-start',
    },
    adminBadge: {
      backgroundColor: theme.colors.warning,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      alignSelf: 'flex-start',
    },
    badgeText: {
      fontSize: 12,
      fontWeight: 'bold',
      color: theme.colors.textOnPrimary,
    },
    actionsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      borderRadius: 8,
      marginHorizontal: 4,
    },
    banButton: {
      backgroundColor: theme.colors.warning,
    },
    unbanButton: {
      backgroundColor: theme.colors.success,
    },
    deleteButton: {
      backgroundColor: theme.colors.buttonDanger,
    },
    actionButtonText: {
      color: theme.colors.textOnPrimary,
      fontWeight: 'bold',
      marginLeft: 6,
      fontSize: 14,
    },
    loadingText: {
      color: theme.colors.textSecondary,
      marginTop: 12,
      fontSize: 16,
    },
    errorText: {
      color: theme.colors.error,
      fontSize: 16,
      textAlign: 'center',
      marginTop: 12,
      marginBottom: 20,
    },
    retryButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
    },
    retryButtonText: {
      color: theme.colors.textOnPrimary,
      fontWeight: 'bold',
      fontSize: 16,
    },
    emptyContainer: {
      alignItems: 'center',
      paddingVertical: 40,
    },
    emptyText: {
      color: theme.colors.textSecondary,
      fontSize: 16,
      marginTop: 12,
    },
  });
}

export default AdminScreen;
