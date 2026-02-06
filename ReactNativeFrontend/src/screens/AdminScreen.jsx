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
  Platform
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { adminAPI } from '../services/api';

const colors = {
  primary: '#1DA1F2',
  background: '#15202B',
  surface: '#192734',
  border: '#38444d',
  text: '#ffffff',
  textSecondary: '#8899A6',
  error: '#f91880',
  success: '#17BF63',
  warning: '#FFAD1F',
  danger: '#E0245E',
};

const AdminScreen = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

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

  const handleBanUser = async (userId, username, isBanned) => {
    const action = isBanned ? 'desbanear' : 'banear';
    
    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)} Usuario`,
      `¿Estás seguro de que deseas ${action} a ${username}?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Confirmar',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(userId);
              await adminAPI.banUser(userId);
              await loadUsers();
              Alert.alert('Éxito', `Usuario ${isBanned ? 'desbaneado' : 'baneado'} correctamente`);
            } catch (err) {
              Alert.alert('Error', err.message || `Error al ${action} usuario`);
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
      '⚠️ ELIMINAR USUARIO',
      `¿Estás COMPLETAMENTE seguro de que deseas ELIMINAR PERMANENTEMENTE a ${username}?\n\nEsta acción NO se puede deshacer.`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'ELIMINAR',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(userId);
              await adminAPI.deleteUser(userId);
              await loadUsers();
              Alert.alert('Éxito', 'Usuario eliminado correctamente');
            } catch (err) {
              Alert.alert('Error', err.message || 'Error al eliminar usuario');
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
                <Text style={styles.bannedText}>BANEADO</Text>
              </View>}
            </View>
            <Text style={styles.email}>{item.email}</Text>
            <Text style={styles.userMeta}>ID: {item.id}</Text>
            <Text style={styles.userMeta}>Creado: {formatDate(item.createdAt)}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Feather name="file-text" size={14} color={colors.textSecondary} />
            <Text style={styles.statText}>{item.statusesCount || 0} posts</Text>
          </View>
          <View style={styles.statItem}>
            <Feather name="users" size={14} color={colors.textSecondary} />
            <Text style={styles.statText}>{item.followersCount || 0} seguidores</Text>
          </View>
          <View style={styles.statItem}>
            <Feather name="user-check" size={14} color={colors.textSecondary} />
            <Text style={styles.statText}>{item.followingCount || 0} siguiendo</Text>
          </View>
        </View>

        {/* Badge de tipo de usuario */}
        <View style={styles.badgeContainer}>
          <View style={isStudent ? styles.studentBadge : styles.adminBadge}>
            <Text style={styles.badgeText}>
              {isStudent ? '🎓 Estudiante' : '👑 Admin'}
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
                <ActivityIndicator size="small" color={colors.text} />
              ) : (
                <>
                  <Feather
                    name={item.banned ? 'unlock' : 'slash'}
                    size={16}
                    color={colors.text}
                  />
                  <Text style={styles.actionButtonText}>
                    {item.banned ? 'Desbanear' : 'Banear'}
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
                <ActivityIndicator size="small" color={colors.text} />
              ) : (
                <>
                  <Feather name="trash-2" size={16} color={colors.text} />
                  <Text style={styles.actionButtonText}>Eliminar</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando usuarios...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Feather name="alert-circle" size={48} color={colors.error} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadUsers}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Panel Admin</Text>
        <Text style={styles.subtitle}>Total usuarios: {users.length}</Text>
      </View>

      {/* Buscador */}
      <View style={styles.searchContainer}>
        <Feather name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por usuario, email o ID..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Feather name="x" size={20} color={colors.textSecondary} />
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
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="users" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyText}>
              {searchQuery ? 'No se encontraron usuarios' : 'No hay usuarios'}
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    margin: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#000',
    fontSize: 16,
    paddingVertical: 4,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  userCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
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
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
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
    color: '#000',
    marginRight: 8,
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  userMeta: {
    fontSize: 12,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  badgeContainer: {
    marginBottom: 12,
  },
  bannedBadge: {
    backgroundColor: colors.error,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bannedText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000',
  },
  studentBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  adminBadge: {
    backgroundColor: colors.warning,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
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
    backgroundColor: colors.warning,
  },
  unbanButton: {
    backgroundColor: colors.success,
  },
  deleteButton: {
    backgroundColor: colors.danger,
  },
  actionButtonText: {
    color: '#000',
    fontWeight: 'bold',
    marginLeft: 6,
    fontSize: 14,
  },
  loadingText: {
    color: '#666',
    marginTop: 12,
    fontSize: 16,
  },
  errorText: {
    color: colors.error,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    marginTop: 12,
  },
});

export default AdminScreen;
