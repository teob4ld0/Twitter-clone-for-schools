import React, { useState, useEffect } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { followersAPI, interestSignalsAPI } from '../services/api';
import { colors } from '../styles/colors';

function FollowingButton({ userId, initialIsFollowing = false, onFollowChange }) {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Si el usuario es el mismo que está viendo el perfil, no mostrar el botón
  if (!user || Number(user.id) === Number(userId)) {
    return null;
  }

  // Verificar el estado real de seguimiento al montar el componente
  useEffect(() => {
    const checkFollowStatus = async () => {
      try {
        const response = await followersAPI.getFollowStatus(userId);
        setIsFollowing(response.data.isFollowing);
      } catch (error) {
        console.error('Error al verificar estado de seguimiento:', error);
        // Mantener el valor inicial en caso de error
      } finally {
        setIsInitializing(false);
      }
    };

    checkFollowStatus();
  }, [userId]);

  const handleToggleFollow = async () => {
    if (isLoading) return;

    const previousState = isFollowing;

    // Actualización optimista
    setIsFollowing(!isFollowing);
    setIsLoading(true);

    try {
      // Para React Native, necesitamos usar follow/unfollow por separado o toggleFollow
      // Basándonos en la API web que usa toggleFollow:
      let response;
      
      // Verificar si existe toggleFollow en la API
      if (followersAPI.toggleFollow) {
        response = await followersAPI.toggleFollow(userId);
      } else {
        // Fallback: usar follow/unfollow por separado
        if (previousState) {
          response = await followersAPI.unfollow(userId);
        } else {
          response = await followersAPI.follow(userId);
        }
      }

      // Actualizar con la respuesta del servidor
      const newFollowState = response.data.isFollowing ?? !previousState;
      setIsFollowing(newFollowState);

      // Emitir señal de interés
      try {
        const signalType = newFollowState ? 'follow' : 'unfollow';
        const metadataObj = {
          from: user.id,
          to: userId,
          timestamp: new Date().toISOString(),
          source: 'FollowingButton',
        };
        const payload = {
          statusId: null, // No aplica a un status para follow/unfollow
          signalType: signalType,
          value: 1,
          metadata: JSON.stringify(metadataObj)
        };
        console.log('[InterestSignal] Enviando payload:', payload);
        await interestSignalsAPI.record(payload);
        console.log('[InterestSignal] Señal enviada correctamente');
      } catch (signalError) {
        console.error('[InterestSignal] Error al registrar señal:', signalError);
      }

      // Notificar al componente padre si existe el callback
      if (onFollowChange) {
        onFollowChange(newFollowState);
      }
    } catch (error) {
      console.error('Error al seguir/dejar de seguir:', error);
      // Revertir el estado si hay error
      setIsFollowing(previousState);
      Alert.alert('Error', 'Error al procesar la acción. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonText = () => {
    if (isLoading) return 'Cargando...';
    if (isFollowing) {
      return isPressed ? 'Dejar de seguir' : 'Siguiendo';
    }
    return 'Seguir';
  };

  const getButtonStyle = () => {
    if (isLoading) {
      return [
        styles.button,
        isFollowing ? styles.followingButton : styles.followButton,
        styles.disabled
      ];
    }

    if (isFollowing) {
      return [
        styles.button,
        styles.followingButton,
        isPressed && styles.unfollowHover
      ];
    }

    return [styles.button, styles.followButton];
  };

  // Mostrar estado de carga mientras se verifica el estado inicial
  if (isInitializing) {
    return (
      <TouchableOpacity
        style={[styles.button, styles.followButton, styles.disabled]}
        disabled
      >
        <ActivityIndicator size="small" color={colors.white} />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={handleToggleFollow}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      style={getButtonStyle()}
      disabled={isLoading}
      activeOpacity={0.7}
    >
      {isLoading ? (
        <ActivityIndicator 
          size="small" 
          color={isFollowing ? colors.primary : colors.white} 
        />
      ) : (
        <Text style={[
          styles.buttonText,
          isFollowing ? styles.followingText : styles.followText,
          isPressed && isFollowing && styles.unfollowText
        ]}>
          {getButtonText()}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
    width: '100%',
    maxWidth: '100%',
    minHeight: 36,
  },
  followButton: {
    backgroundColor: colors.primary,
  },
  followingButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  unfollowHover: {
    backgroundColor: '#ffebee',
    borderColor: '#e0245e',
  },
  disabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  followText: {
    color: colors.white,
  },
  followingText: {
    color: colors.primary,
  },
  unfollowText: {
    color: '#e0245e',
  },
});

export default FollowingButton;
