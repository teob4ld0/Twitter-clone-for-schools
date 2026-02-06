import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import Reply from './Reply';
import ReplyForm from './ReplyForm';
import { mediaAPI, repliesAPI, interestSignalsAPI } from '../services/api';
import { colors } from '../styles/colors';

function ReplyList({
  statusId,
  initialCount,
  onCountChange,
  focusReplyId = null,
  showForm = true,
  formPlaceholder = 'Escribe una respuesta...',
  formButtonLabel = 'Responder',
  indent = 0,
  reloadSignal = 0
}) {
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadReplies = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await repliesAPI.getByStatus(statusId);
      setReplies(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Error al cargar respuestas:', err);
      setError('Error al cargar las respuestas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (statusId) {
      loadReplies();
    }
  }, [statusId, reloadSignal]);

  const handleCreateReply = async (content, file = null) => {
    try {
      setIsSubmitting(true);

      let mediaUrl = null;
      if (file) {
        // Preparar FormData para el archivo
        const formData = new FormData();
        formData.append('file', {
          uri: file.uri,
          name: file.name,
          type: file.type,
        });

        const uploadRes = await mediaAPI.upload(formData);
        mediaUrl = uploadRes?.data?.publicUrl || null;
      }

      await repliesAPI.create(statusId, content, mediaUrl);

      // Registrar señal de interés por responder
      try {
        await interestSignalsAPI.record({
          statusId: statusId,
          signalType: 'reply',
          value: 1,
          metadata: JSON.stringify({ 
            hasMedia: !!mediaUrl,
            contentLength: content.length 
          })
        });
        console.log(`✅ Señal de REPLY registrada en status ${statusId}`);
      } catch (signalError) {
        console.error('Error al registrar señal de reply:', signalError);
        // No bloqueamos el flujo si falla la señal
      }

      // Recargar respuestas para obtener la estructura completa
      const response = await repliesAPI.getByStatus(statusId);
      const newReplies = Array.isArray(response.data) ? response.data : [];
      setReplies(newReplies);

      // Actualizar contador con el número real de respuestas
      if (onCountChange) {
        onCountChange(newReplies.length);
      }

      setError(null);
    } catch (err) {
      console.error('Error al crear respuesta:', err);
      Alert.alert('Error', 'Error al publicar la respuesta');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReply = async (replyId) => {
    Alert.alert(
      'Eliminar respuesta',
      '¿Estás seguro de que deseas eliminar esta respuesta?',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await repliesAPI.delete(replyId);

              // Eliminar respuesta de la lista
              const newReplies = replies.filter(r => r.id !== replyId);
              setReplies(newReplies);

              // Actualizar contador
              if (onCountChange) {
                onCountChange(newReplies.length);
              }
            } catch (err) {
              console.error('Error al eliminar respuesta:', err);
              Alert.alert('Error', 'Error al eliminar la respuesta');
            }
          }
        }
      ]
    );
  };

  const handleLikeUpdate = (replyId, isLiked, newLikesCount) => {
    setReplies(prevReplies =>
      prevReplies.map(reply =>
        reply.id === replyId
          ? { ...reply, isLikedByCurrentUser: isLiked, likes: newLikesCount }
          : reply
      )
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando respuestas...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }

  const containerStyle = indent > 0 
    ? [styles.container, styles.nestedContainer(indent)]
    : styles.container;

  return (
    <View style={containerStyle}>
      {showForm && (
        <ReplyForm
          onSubmit={handleCreateReply}
          isLoading={isSubmitting}
          placeholder={formPlaceholder}
          buttonLabel={formButtonLabel}
        />
      )}
      
      {replies.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            No hay respuestas aún. ¡Sé el primero en responder!
          </Text>
        </View>
      ) : (
        <View>
          {replies.filter(r => r && r.id).map((reply) => {
            const isFocused = focusReplyId && reply.id === Number(focusReplyId);
            
            return (
              <View
                key={reply.id}
                style={isFocused ? styles.focusedReply : undefined}
              >
                <Reply
                  reply={reply}
                  onDelete={handleDeleteReply}
                  onLikeUpdate={handleLikeUpdate}
                />
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  nestedContainer: (indent) => ({
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 0,
    marginLeft: Math.min(indent, 6) * 16,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: colors.borderLight,
  }),
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginLeft: 10,
    color: '#666',
    fontSize: 14,
  },
  errorContainer: {
    padding: 12,
    backgroundColor: '#fee',
    borderRadius: 6,
  },
  errorText: {
    color: '#c00',
    fontSize: 14,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
  },
  focusedReply: {
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.primary,
    padding: 6,
    marginVertical: 4,
  },
});

export default ReplyList;
