import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, Image, ScrollView, Alert } from 'react-native';
import * as ImagePicker from '../utils/imagePicker';
import { Feather } from '@expo/vector-icons';
import { colors } from '../styles/colors';
import { mediaAPI, statusAPI } from '../services/api';

export default function CreateStatusModal({ visible, onClose, onStatusCreated }) {
  const [content, setContent] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleMediaSelect = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permiso denegado', 'Necesitas dar permisos para acceder a la galería');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        
        if (asset.fileSize && asset.fileSize > 512 * 1024 * 1024) {
          setError('El archivo es demasiado grande. Máximo 512MB.');
          return;
        }

        setMediaFile(asset);
        setMediaPreview(asset.uri);
        setError('');
      }
    } catch (err) {
      console.error('Error selecting media:', err);
      setError('Error al seleccionar archivo');
    }
  };

  const handleRemoveMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    try {
      if (mediaFile && mediaFile.fileSize && mediaFile.fileSize > 512 * 1024 * 1024) {
        setError('El archivo es demasiado pesado. Debe ser menor a 512 MB.');
        setLoading(false);
        return;
      }

      let mediaUrl = null;
      if (mediaFile) {
        const file = {
          uri: mediaFile.uri,
          type: mediaFile.type === 'video' ? 'video/mp4' : 'image/jpeg',
          name: mediaFile.fileName || `upload_${Date.now()}.${mediaFile.type === 'video' ? 'mp4' : 'jpg'}`
        };

        const uploadRes = await mediaAPI.upload(file);
        mediaUrl = uploadRes?.data?.publicUrl || null;
      }

      const response = await statusAPI.create({
        content: content,
        mediaUrl: mediaUrl
      });

      setContent('');
      setMediaFile(null);
      setMediaPreview(null);
      onStatusCreated(response.data);
      onClose();
    } catch (err) {
      const serverMsg = typeof err.response?.data === 'string' ? err.response.data : err.response?.data?.error;
      setError(serverMsg || err.message || 'Error al crear estado');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const charCount = content.length;
  const maxChars = 350;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Nuevo Post</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <TextInput
              style={styles.textInput}
              multiline
              placeholder="¿Qué estás pensando?"
              placeholderTextColor="#999"
              value={content}
              onChangeText={setContent}
              maxLength={maxChars}
              autoFocus
            />

            <Text style={styles.charCount}>{charCount}/{maxChars}</Text>

            {mediaPreview && (
              <View style={styles.mediaPreviewContainer}>
                {mediaFile?.type?.startsWith('video') ? (
                  <View style={styles.videoPlaceholder}>
                    <Feather name="video" size={48} color={colors.textSecondary} />
                    <Text style={styles.videoText}>Video seleccionado</Text>
                  </View>
                ) : (
                  <Image source={{ uri: mediaPreview }} style={styles.mediaPreview} />
                )}
                <TouchableOpacity
                  onPress={handleRemoveMedia}
                  style={styles.removeMediaButton}
                >
                  <Feather name="x" size={20} color={colors.white} />
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              onPress={handleMediaSelect}
              style={styles.mediaButton}
              disabled={loading || !!mediaFile}
            >
              <Feather name="image" size={24} color={mediaFile ? colors.textSecondary : colors.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSubmit}
              style={[
                styles.submitButton,
                (loading || !content.trim() || content.length > maxChars) && styles.submitButtonDisabled
              ]}
              disabled={loading || !content.trim() || content.length > maxChars}
            >
              <Text style={styles.submitButtonText}>
                {loading ? 'Publicando...' : 'Publicar'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  modalContent: {
    padding: 16,
  },
  errorContainer: {
    backgroundColor: '#fee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  errorText: {
    color: '#c00',
    fontSize: 14,
  },
  textInput: {
    fontSize: 16,
    color: '#000',
    minHeight: 120,
    textAlignVertical: 'top',
    paddingVertical: 8,
  },
  charCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 8,
  },
  mediaPreviewContainer: {
    marginTop: 16,
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  mediaPreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  videoPlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  videoText: {
    marginTop: 8,
    color: '#666',
  },
  removeMediaButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  mediaButton: {
    padding: 8,
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
