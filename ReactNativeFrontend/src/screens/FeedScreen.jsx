import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { statusAPI } from '../services/api';
import StatusItem from '../components/StatusItem';
import CreateStatusModal from '../components/CreateStatusModal';
import colors from '../styles/colors';

export default function FeedScreen() {
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadStatuses();
  }, []);

  const loadStatuses = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await statusAPI.getAll();
      const statusesData = Array.isArray(response.data) ? response.data : [];
      setStatuses(statusesData);
    } catch (err) {
      setError('Error al cargar estados');
      console.error('Error loading statuses:', err);
      setStatuses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStatuses();
    setRefreshing(false);
  };

  const handleStatusCreated = (newStatus) => {
    setStatuses([newStatus, ...statuses]);
    setModalVisible(false);
  };

  const handleDelete = async (statusId) => {
    try {
      await statusAPI.delete(statusId);
      setStatuses(statuses.filter(status => status.id !== statusId));
    } catch (err) {
      console.error('Error deleting status:', err);
      alert('Error al eliminar estado');
    }
  };

  const onQuoteCreated = (newStatus) => {
    setStatuses([newStatus, ...statuses]);
  };

  const renderEmpty = () => {
    if (loading) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📭</Text>
        <Text style={styles.emptyText}>No hay estados aún.</Text>
        <Text style={styles.emptySubtext}>¡Sé el primero en publicar!</Text>
      </View>
    );
  };

  const renderItem = ({ item }) => (
    <StatusItem
      status={item}
      onDelete={handleDelete}
      onQuoteCreated={onQuoteCreated}
    />
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando estados...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={loadStatuses}
        >
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={statuses}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={renderEmpty}
      />

      {/* FAB - Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <Feather name="edit-3" size={24} color={colors.white} />
      </TouchableOpacity>

      {/* Create Status Modal */}
      <CreateStatusModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onStatusCreated={handleStatusCreated}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f9fa',
  },
  listContent: {
    flexGrow: 1,
    paddingTop: 8,
    paddingBottom: 80,
    paddingHorizontal: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f7f9fa',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f7f9fa',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1da1f2',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#1da1f2',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
});
