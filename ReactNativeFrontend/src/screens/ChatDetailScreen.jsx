import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { 
  fetchMessages, 
  sendMessage, 
  deleteMessage as deleteMessageAction,
  setSelectedChat
} from '../store/chatSlice';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import MessageItem from '../components/MessageItem';
import * as ImagePicker from '../utils/imagePicker';
import { deriveChatKey, encryptMessage } from '../services/cryptoService';

export default function ChatDetailScreen({ route, navigation }) {
  const { chatId, otherUser } = route.params;
  const { theme } = useTheme();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { messages, loading, error, chats, selectedChatId } = useSelector((state) => state.chat);
  const chatMessages = messages[chatId] || [];
  
  const [messageText, setMessageText] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [sending, setSending] = useState(false);
  const [fileError, setFileError] = useState('');
  const flatListRef = useRef(null);

  // Encontrar el chat actual para obtener datos actualizados
  const selectedChat = chats.find(c => c.id === chatId);
  const currentOtherUser = selectedChat?.otherUser || otherUser;

  useEffect(() => {
    dispatch(setSelectedChat(chatId));
    dispatch(fetchMessages(chatId));
  }, [chatId, dispatch]);

  useEffect(() => {
    // Auto-scroll al final cuando llegan nuevos mensajes
    if (chatMessages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [chatMessages]);

  // Solicitar permisos de cámara/galería
  const requestMediaPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permisos requeridos',
        'Necesitamos acceso a tu galería para adjuntar archivos.'
      );
      return false;
    }
    return true;
  };

  const handlePickMedia = async () => {
    const hasPermission = await requestMediaPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        
        // Validar tamaño del archivo (512MB máximo)
        if (asset.fileSize && asset.fileSize > 512 * 1024 * 1024) {
          setFileError('El archivo es demasiado pesado. Debe ser menor a 512 MB.');
          return;
        }

        // Usar el mimeType normalizado del imagePicker
        const mimeType = asset.mimeType || asset.type || 'image/jpeg';
        const fileName = asset.fileName || `media_${Date.now()}.${mimeType.split('/')[1] || 'jpg'}`;

        setFileError('');
        setMediaFile({
          uri: asset.uri,
          type: mimeType,
          name: fileName,
          fileName: fileName,
          fileSize: asset.fileSize,
        });
        
        console.log('📎 Archivo seleccionado:', { uri: asset.uri, type: mimeType, name: fileName });
      }
    } catch (error) {
      console.error('❌ Error picking media:', error);
      Alert.alert('Error', 'No se pudo seleccionar el archivo');
    }
  };

  const handleSend = async () => {
    if (!messageText.trim() && !mediaFile) return;
    if (sending) return;

    setSending(true);
    setFileError('');
    
    // Encrypt text content before sending
    let contentToSend = messageText.trim();
    const myHash = selectedChat?.myPublicKeyHash;
    const otherHash = selectedChat?.otherUser?.publicKeyHash;
    if (myHash && otherHash && contentToSend) {
      try {
        const key = deriveChatKey(myHash, otherHash);
        if (key) contentToSend = encryptMessage(key, contentToSend);
      } catch (e) {
        console.warn('Encryption failed, sending plaintext:', e);
      }
    }
    
    try {
      await dispatch(sendMessage({ 
        chatId, 
        content: contentToSend,
        file: mediaFile 
      })).unwrap();
      
      setMessageText('');
      setMediaFile(null);
      
      // Scroll al final después de enviar
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'No se pudo enviar el mensaje');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = (messageId) => {
    Alert.alert(
      'Eliminar mensaje',
      '¿Estás seguro de que quieres eliminar este mensaje?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deleteMessageAction({ chatId, messageId })).unwrap();
            } catch (error) {
              console.error('Error deleting message:', error);
              Alert.alert('Error', 'No se pudo eliminar el mensaje');
            }
          },
        },
      ]
    );
  };

  const removeMediaFile = () => {
    setMediaFile(null);
    setFileError('');
  };

  // Header personalizado
  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <TouchableOpacity
          onPress={() => {
            if (currentOtherUser?.id) {
              navigation.navigate('Profile', { userId: currentOtherUser.id });
            }
          }}
          style={styles.headerTitleContainer}
        >
          <Text style={styles.headerTitle}>
            @{currentOtherUser?.username || 'Usuario'}
          </Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, currentOtherUser]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.cardBackground,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
      padding: 20,
    },
    loadingText: {
      marginTop: 10,
      color: theme.colors.textSecondary,
      fontSize: 14,
    },
    errorText: {
      marginTop: 12,
      fontSize: 16,
      color: theme.colors.error,
      textAlign: 'center',
    },
    retryButton: {
      marginTop: 16,
      paddingHorizontal: 24,
      paddingVertical: 12,
      backgroundColor: theme.colors.primary,
      borderRadius: 20,
    },
    retryButtonText: {
      color: theme.colors.textOnPrimary,
      fontSize: 14,
      fontWeight: '600',
    },
    headerTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    messagesList: {
      padding: 12,
      flexGrow: 1,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
      minHeight: 200,
    },
    emptyText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: 12,
    },
    inputContainer: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      backgroundColor: theme.colors.cardBackground,
      paddingHorizontal: 12,
      paddingTop: 10,
      elevation: 10,
      zIndex: 9999,
    },
    fileErrorContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      padding: 10,
      backgroundColor: theme.colors.errorBackground,
      borderRadius: 8,
      marginBottom: 8,
    },
    fileErrorText: {
      flex: 1,
      fontSize: 13,
      color: theme.colors.error,
    },
    mediaPreviewContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 10,
      backgroundColor: theme.colors.background,
      borderRadius: 8,
      marginBottom: 8,
    },
    mediaPreview: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      gap: 10,
    },
    mediaThumbnail: {
      width: 50,
      height: 50,
      borderRadius: 6,
      backgroundColor: theme.colors.border,
    },
    videoPlaceholder: {
      width: 50,
      height: 50,
      borderRadius: 6,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    mediaFileName: {
      flex: 1,
      fontSize: 13,
      color: theme.colors.textPrimary,
    },
    removeMediaButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.cardBackground,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    mediaButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'transparent',
    },
    input: {
      flex: 1,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 20,
      paddingHorizontal: 15,
      paddingVertical: 10,
      maxHeight: 100,
      fontSize: 15,
      color: theme.colors.textPrimary,
      backgroundColor: theme.colors.cardBackground,
    },
    sendButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sendButtonDisabled: {
      opacity: 0.4,
    },
  });

  // Solo mostrar loading si es la primera carga Y no hay mensajes
  const isInitialLoading = loading.messages && chatMessages.length === 0;

  if (isInitialLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Cargando mensajes...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Feather name="alert-circle" size={48} color={theme.colors.error} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => dispatch(fetchMessages(chatId))}
        >
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={100}
    >
      <FlatList
        ref={flatListRef}
        data={chatMessages}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <MessageItem
            message={item}
            currentUserId={user?.id}
            onDelete={item.senderId === user?.id ? () => handleDeleteMessage(item.id) : undefined}
            myHash={selectedChat?.myPublicKeyHash}
            otherHash={selectedChat?.otherUser?.publicKeyHash}
          />
        )}
        contentContainerStyle={styles.messagesList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="message-square" size={48} color={theme.colors.textSecondary} />
            <Text style={styles.emptyText}>
              Inicia la conversación con @{currentOtherUser?.username}
            </Text>
          </View>
        }
        onContentSizeChange={() => {
          if (chatMessages.length > 0) {
            flatListRef.current?.scrollToEnd({ animated: false });
          }
        }}
      />

      {/* Input Container */}
      <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        {/* File Error */}
        {fileError ? (
          <View style={styles.fileErrorContainer}>
            <Feather name="alert-circle" size={16} color={theme.colors.error} />
            <Text style={styles.fileErrorText}>{fileError}</Text>
          </View>
        ) : null}

        {/* Media Preview */}
        {mediaFile ? (
          <View style={styles.mediaPreviewContainer}>
            <View style={styles.mediaPreview}>
              {mediaFile.type?.startsWith('image') ? (
                <Image source={{ uri: mediaFile.uri }} style={styles.mediaThumbnail} />
              ) : (
                <View style={styles.videoPlaceholder}>
                  <Feather name="video" size={24} color={theme.colors.textOnPrimary} />
                </View>
              )}
              <Text style={styles.mediaFileName} numberOfLines={1}>
                {mediaFile.name}
              </Text>
            </View>
            <TouchableOpacity
              onPress={removeMediaFile}
              style={styles.removeMediaButton}
            >
              <Feather name="x" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Input Row */}
        <View style={styles.inputRow}>
          <TouchableOpacity
            style={styles.mediaButton}
            onPress={handlePickMedia}
            disabled={sending || !!mediaFile}
          >
            <Feather 
              name="image" 
              size={22} 
              color={mediaFile ? theme.colors.textSecondary : theme.colors.primary} 
            />
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder="Escribe un mensaje..."
            placeholderTextColor={theme.colors.textTertiary}
            value={messageText}
            onChangeText={setMessageText}
            multiline
            maxLength={500}
            editable={!sending}
          />

          <TouchableOpacity
            style={[
              styles.sendButton, 
              (!messageText.trim() && !mediaFile) && styles.sendButtonDisabled
            ]}
            onPress={handleSend}
            disabled={(!messageText.trim() && !mediaFile) || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color={theme.colors.textOnPrimary} />
            ) : (
              <Feather name="send" size={20} color={theme.colors.textOnPrimary} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}


