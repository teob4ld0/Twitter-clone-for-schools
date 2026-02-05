import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
  Platform
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from '../utils/imagePicker';
import { colors } from '../styles/colors';

function ReplyForm({
  onSubmit,
  isLoading,
  placeholder = 'Escribe una respuesta...',
  buttonLabel = 'Responder',
  autoFocus = false,
  compact = false
}) {
  const [content, setContent] = useState('');
  const [mediaUri, setMediaUri] = useState(null);
  const [fileError, setFileError] = useState('');
  const textInputRef = useRef(null);

  useEffect(() => {
    if (autoFocus && textInputRef.current) {
      setTimeout(() => {
        textInputRef.current?.focus();
      }, 100);
    }
  }, [autoFocus]);

  const handleMediaPick = async () => {
    // Solicitar permisos
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
      const asset = result.assets[0];
      
      // Validar tamaño (512MB máximo)
      if (asset.fileSize && asset.fileSize > 512 * 1024 * 1024) {
        setFileError('El archivo es demasiado pesado. Debe ser menor a 512 MB.');
        return;
      }

      setFileError('');
      setMediaUri(asset.uri);
    }
  };

  const handleRemoveMedia = () => {
    setMediaUri(null);
  };

  const handleSubmit = async () => {
    if (content.trim() || mediaUri) {
      setFileError('');
      
      // Crear objeto similar a File para compatibilidad con la API
      let mediaFile = null;
      if (mediaUri) {
        const filename = mediaUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        mediaFile = {
          uri: mediaUri,
          name: filename,
          type: type,
        };
      }

      await onSubmit(content, mediaFile);
      setContent('');
      setMediaUri(null);
    }
  };

  const isSubmitDisabled = isLoading || (!content.trim() && !mediaUri) || content.length > 280;

  return (
    <View style={compact ? styles.compactForm : styles.form}>
      {fileError ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{fileError}</Text>
        </View>
      ) : null}

      <View style={styles.topRow}>
        <TextInput
          ref={textInputRef}
          value={content}
          onChangeText={setContent}
          placeholder={placeholder}
          placeholderTextColor="#999"
          style={styles.textarea}
          multiline
          numberOfLines={2}
          editable={!isLoading}
          maxLength={280}
        />
      </View>

      <Text style={styles.charCount}>{content.length}/280</Text>

      {mediaUri && (
        <View style={styles.mediaPreviewContainer}>
          <Image
            source={{ uri: mediaUri }}
            style={styles.mediaPreviewImage}
            resizeMode="cover"
          />
          <TouchableOpacity
            onPress={handleRemoveMedia}
            style={styles.removeMediaButton}
          >
            <Feather name="x" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.bottomRow}>
        <TouchableOpacity
          onPress={handleMediaPick}
          style={[styles.mediaButton, (isLoading || mediaUri) && styles.mediaButtonDisabled]}
          disabled={isLoading || !!mediaUri}
        >
          <Feather name="image" size={20} color={colors.primary} />
        </TouchableOpacity>

        {mediaUri && (
          <Text style={styles.fileName} numberOfLines={1}>
            📎 {mediaUri.split('/').pop()}
          </Text>
        )}

        <View style={{ flex: 1 }} />

        <TouchableOpacity
          onPress={handleSubmit}
          style={[
            styles.button,
            isSubmitDisabled && styles.buttonDisabled
          ]}
          disabled={isSubmitDisabled}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>{buttonLabel}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: colors.cardBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  compactForm: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: colors.cardBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  topRow: {
    marginBottom: 8,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  textarea: {
    fontSize: 16,
    color: '#000',
    minHeight: 60,
    textAlignVertical: 'top',
    padding: 0,
    lineHeight: 22,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  fileName: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  errorContainer: {
    padding: 8,
    backgroundColor: '#fee',
    borderRadius: 6,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#c00',
  },
  mediaButton: {
    padding: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaButtonDisabled: {
    opacity: 0.5,
  },
  mediaPreviewContainer: {
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  mediaPreviewImage: {
    width: '100%',
    height: 200,
  },
  removeMediaButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  charCount: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: 4,
  },
});

export default ReplyForm;
