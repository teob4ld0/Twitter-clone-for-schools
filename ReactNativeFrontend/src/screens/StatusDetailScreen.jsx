import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { statusAPI } from '../services/api';
import StatusItem from '../components/StatusItem';
import colors from '../styles/colors';

export default function StatusDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  
  // Obtener parámetros de la ruta
  const { statusId, focusReplyId } = route.params || {};

  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const loadStatus = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await statusAPI.getById(statusId);
        if (cancelled) return;
        setStatus(res.data);
      } catch (err) {
        console.error('Error loading status:', err);
        if (!cancelled) setError('No se pudo cargar el estado');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (statusId) {
      loadStatus();
    }

    return () => {
      cancelled = true;
    };
  }, [statusId]);

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleDelete = () => {
    // Volver atrás después de eliminar
    navigation.goBack();
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando estado...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleGoBack}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Empty state
  if (!status) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.emptyText}>Estado no encontrado</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleGoBack}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={handleGoBack}
          activeOpacity={0.7}
        >
          <Text style={styles.headerBackButtonText}>← Volver</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
      >
        <StatusItem
          status={status}
          onDelete={handleDelete}
          initialShowReplies={true}
          focusReplyId={focusReplyId}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.background
  },
  header: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 8,
    paddingHorizontal: 12
  },
  headerBackButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    minHeight: 44,
    justifyContent: 'center'
  },
  headerBackButtonText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 16
  },
  scrollView: {
    flex: 1
  },
  scrollViewContent: {
    paddingBottom: 20
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 16
  },
  errorText: {
    color: colors.error,
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center'
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center'
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 9999,
    minHeight: 44
  },
  backButtonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 16
  }
});
