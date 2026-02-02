import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { followersAPI, interestSignalsAPI } from '../services/api';

function FollowingButton({ userId, initialIsFollowing = false, onFollowChange }) {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
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
      const response = await followersAPI.toggleFollow(userId);

      // Actualizar con la respuesta del servidor
      setIsFollowing(response.data.isFollowing);

      // Emitir señal de interés
      try {
        const signalType = response.data.isFollowing ? 'follow' : 'unfollow';
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
        console.error('[InterestSignal] Detalles:', signalError.response?.data);
      }

      // Notificar al componente padre si existe el callback
      if (onFollowChange) {
        onFollowChange(response.data.isFollowing);
      }
    } catch (error) {
      console.error('Error al seguir/dejar de seguir:', error);
      // Revertir el estado si hay error
      setIsFollowing(previousState);
      alert('Error al procesar la acción. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const buttonText = isFollowing
    ? (isHovered ? 'Dejar de seguir' : 'Siguiendo')
    : 'Seguir';

  const buttonStyle = {
    padding: '8px 20px',
    borderRadius: '9999px',
    border: isFollowing ? '1px solid #1da1f2' : 'none',
    backgroundColor: isFollowing
      ? (isHovered ? '#ffebee' : 'white')
      : '#1da1f2',
    color: isFollowing
      ? (isHovered ? '#e0245e' : '#1da1f2')
      : 'white',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: isLoading ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s',
    opacity: isLoading ? 0.6 : 1,
    minWidth: '120px',
    width: '100%',
    maxWidth: '100%'
  };

  // Mostrar estado de carga mientras se verifica el estado inicial
  if (isInitializing) {
    return (
      <button
        style={{
          ...buttonStyle,
          cursor: 'not-allowed',
          opacity: 0.6
        }}
        disabled
      >
        Cargando...
      </button>
    );
  }

  return (
    <button
      onClick={handleToggleFollow}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={buttonStyle}
      disabled={isLoading}
    >
      {isLoading ? 'Cargando...' : buttonText}
    </button>
  );
}

export default FollowingButton;
