import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useDispatch } from 'react-redux';
import { createOrGetChat } from '../store/chatSlice';
import { useNavigation } from '@react-navigation/native';

function MessageButton({ userId }) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);

  const styles = StyleSheet.create({
    button: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 9999,
      borderWidth: 1,
      borderColor: '#9b59b6',
      backgroundColor: theme.colors.cardBackground,
      alignItems: 'center',
    },
    disabled: {
      opacity: 0.5,
    },
    text: {
      color: '#9b59b6',
      fontSize: 15,
      fontWeight: 'bold',
    },
  });

  // No mostrar si es el propio usuario o no hay sesión
  if (!user || Number(user.id) === Number(userId)) {
    return null;
  }

  const handleSendMessage = async () => {
    if (isLoading) return;

    try {
      setIsLoading(true);
      const chat = await dispatch(createOrGetChat(Number(userId))).unwrap();
      navigation.navigate('ChatDetail', { chatId: chat.id });
    } catch (err) {
      console.error('Error opening chat:', err);
      Alert.alert('Error', 'No se pudo abrir el chat');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TouchableOpacity
      onPress={handleSendMessage}
      disabled={isLoading}
      style={[styles.button, isLoading && styles.disabled]}
    >
      <Text style={styles.text}>{isLoading ? 'Abriendo...' : 'Mensaje'}</Text>
    </TouchableOpacity>
  );
}

export default MessageButton;
