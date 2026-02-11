import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { fetchChats, createOrGetChat, clearError } from '../store/chatSlice';
import { useAuth } from '../context/AuthContext';
import ChatListItem from '../components/ChatListItem';
import { useTheme } from '../context/ThemeContext';

export default function ChatsScreen({ navigation }) {
  const { theme } = useTheme();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { chats, loading, error } = useSelector((state) => state.chat);
  const [refreshing, setRefreshing] = useState(false);
  const [otherUserIdInput, setOtherUserIdInput] = useState('');
  const [creatingChat, setCreatingChat] = useState(false);

  useEffect(() => {
    if (user?.id) {
      console.log('📱 ChatsScreen: Cargando chats para usuario', user.id);

      dispatch(fetchChats()).then((result) => {
        if (result.error) {
          console.error('❌ Error cargando chats:', result.error);
        } else {
          console.log('✅ Chats cargados:', result.payload?.length || 0);
          // Log detallado de cada chat para debugging
          result.payload?.forEach((chat, index) => {
            if (!chat.otherUser) {
              console.error(`❌ Chat ${index} (ID: ${chat.id}) sin otherUser`);
            } else if (!chat.otherUser.username) {
              console.error(`❌ Chat ${index} (ID: ${chat.id}) con otherUser sin username`);
            }
          });
        }
      }).catch((err) => {
        console.error('❌ Error fatal cargando chats:', err);
      });
    }
  }, [dispatch, user]);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
    }
  }, [error]);

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchChats());
    setRefreshing(false);
  };

  const handleChatPress = (chat) => {
    if (!chat || !chat.id) {
      Alert.alert('Error', 'Chat inválido');
      return;
    }
    navigation.navigate('ChatDetail', { 
      chatId: chat.id, 
      otherUser: chat.otherUser || {} 
    });
  };

  const handleCreateOrOpenChat = async () => {
    const otherId = parseInt(otherUserIdInput, 10);
    
    if (!otherId || isNaN(otherId)) {
      Alert.alert('Error', 'Por favor ingresa un ID válido');
      return;
    }
    
    if (otherId === user?.id) {
      Alert.alert('Error', 'No puedes crear un chat contigo mismo');
      return;
    }

    setCreatingChat(true);
    dispatch(clearError());
    
    try {
      const result = await dispatch(createOrGetChat(otherId)).unwrap();
      setOtherUserIdInput('');
      
      // Navegar al chat creado/encontrado
      navigation.navigate('ChatDetail', { 
        chatId: result.id, 
        otherUser: result.otherUser 
      });
    } catch (err) {
      Alert.alert('Error', err || 'No se pudo crear el chat');
    } finally {
      setCreatingChat(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.cardBackground,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.cardBackground,
    },
    loadingText: {
      marginTop: 10,
      color: theme.colors.textSecondary,
      fontSize: 14,
    },
    createChatContainer: {
      padding: 16,
      backgroundColor: theme.colors.cardBackground,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    userIdInput: {
      flex: 1,
      height: 44,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 22,
      paddingHorizontal: 16,
      fontSize: 15,
      color: theme.colors.textPrimary,
      backgroundColor: theme.colors.cardBackground,
    },
    createButton: {
      height: 44,
      paddingHorizontal: 20,
      backgroundColor: theme.colors.primary,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      minWidth: 100,
    },
    createButtonDisabled: {
      opacity: 0.5,
    },
    createButtonText: {
      color: theme.colors.textOnPrimary,
      fontSize: 14,
      fontWeight: '600',
    },
    emptyList: {
      flexGrow: 1,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
      minHeight: 300,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.textPrimary,
      marginTop: 16,
    },
    emptySubtext: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginTop: 8,
      textAlign: 'center',
    },
  });

  if (loading.chats && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Cargando chats...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Create/Open Chat Input */}
      <View style={styles.createChatContainer}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.userIdInput}
            placeholder="ID de usuario"
            placeholderTextColor={theme.colors.textTertiary}
            value={otherUserIdInput}
            onChangeText={setOtherUserIdInput}
            keyboardType="numeric"
            editable={!creatingChat}
          />
          <TouchableOpacity
            style={[
              styles.createButton,
              creatingChat && styles.createButtonDisabled
            ]}
            onPress={handleCreateOrOpenChat}
            disabled={creatingChat || !otherUserIdInput.trim()}
          >
            {creatingChat ? (
              <ActivityIndicator size="small" color={theme.colors.textOnPrimary} />
            ) : (
              <Text style={styles.createButtonText}>Abrir Chat</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Chats List */}
      <FlatList
        data={chats.filter(chat => {
          // Filtrar chats con datos incompletos
          if (!chat || !chat.id) return false;
          if (!chat.otherUser || !chat.otherUser.id || !chat.otherUser.username) {
            console.warn('⚠️ Filtrando chat con datos incompletos:', chat.id);
            return false;
          }
          return true;
        })}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => {
          try {
            return <ChatListItem chat={item} onPress={() => handleChatPress(item)} />;
          } catch (renderError) {
            console.error('❌ Error renderizando chat item:', renderError);
            console.error('❌ Chat data:', JSON.stringify(item, null, 2));
            return null;
          }
        }}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="message-circle" size={64} color={theme.colors.textSecondary} />
            <Text style={styles.emptyText}>No hay chats aún</Text>
            <Text style={styles.emptySubtext}>
              Ingresa un ID de usuario para comenzar una conversación
            </Text>
          </View>
        }
        contentContainerStyle={[
          chats.length === 0 ? styles.emptyList : { paddingBottom: insets.bottom + 80 }
        ]}
      />
    </View>
  );
}


