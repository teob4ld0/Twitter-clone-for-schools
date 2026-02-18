import React, { useEffect, useRef, useState } from 'react';
import { AppState, Alert, Linking, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';

/**
 * Componente que maneja la solicitud proactiva de permisos de media (galería y cámara).
 * Funciona de manera similar a PushNotificationProvider: solicita permisos
 * cuando el usuario se autentica, y reintenta si vuelve del background.
 */
export default function MediaPermissionProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const appState = useRef(AppState.currentState);
  const [hasRequestedMedia, setHasRequestedMedia] = useState(false);
  const requestAttempted = useRef(false);

  // Manejar cambios de AppState (para detectar cuando vuelve de configuración)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('📱 [MediaPermission] App volvió al foreground');

        if (!hasRequestedMedia && isAuthenticated()) {
          const { status: mediaStatus } = await ImagePicker.getMediaLibraryPermissionsAsync();
          const { status: cameraStatus } = await ImagePicker.getCameraPermissionsAsync();

          if (mediaStatus === 'granted' && cameraStatus === 'granted') {
            console.log('✅ [MediaPermission] Permisos otorgados después de volver al foreground');
            setHasRequestedMedia(true);
          }
        }
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [hasRequestedMedia, isAuthenticated]);

  useEffect(() => {
    const authenticated = isAuthenticated();

    if (authenticated && !requestAttempted.current) {
      requestAttempted.current = true;
      console.log('🚀 [MediaPermission] Iniciando solicitud de permisos de media...');
      requestMediaPermissions();
    } else if (!authenticated) {
      console.log('⏸️  [MediaPermission] Usuario no autenticado, saltando solicitud');
      requestAttempted.current = false;
      setHasRequestedMedia(false);
    }
  }, [isAuthenticated()]);

  const requestMediaPermissions = async () => {
    try {
      // 1. Permisos de galería/media library
      const { status: mediaExisting } = await ImagePicker.getMediaLibraryPermissionsAsync();
      let mediaFinal = mediaExisting;

      console.log(`📋 [MediaPermission] Estado actual de galería: ${mediaExisting}`);

      if (mediaExisting !== 'granted') {
        console.log('❓ [MediaPermission] Solicitando permisos de galería...');
        const mediaResponse = await ImagePicker.requestMediaLibraryPermissionsAsync();
        mediaFinal = mediaResponse.status;
        console.log(`📋 [MediaPermission] Resultado de galería: ${mediaFinal}`);
      }

      // 2. Permisos de cámara
      const { status: cameraExisting } = await ImagePicker.getCameraPermissionsAsync();
      let cameraFinal = cameraExisting;

      console.log(`📋 [MediaPermission] Estado actual de cámara: ${cameraExisting}`);

      if (cameraExisting !== 'granted') {
        console.log('❓ [MediaPermission] Solicitando permisos de cámara...');
        const cameraResponse = await ImagePicker.requestCameraPermissionsAsync();
        cameraFinal = cameraResponse.status;
        console.log(`📋 [MediaPermission] Resultado de cámara: ${cameraFinal}`);
      }

      // Evaluar resultados
      if (mediaFinal === 'granted' && cameraFinal === 'granted') {
        console.log('✅ [MediaPermission] Todos los permisos de media otorgados');
        setHasRequestedMedia(true);
      } else {
        const denied = [];
        if (mediaFinal !== 'granted') denied.push('galería');
        if (cameraFinal !== 'granted') denied.push('cámara');

        console.log(`⚠️  [MediaPermission] Permisos denegados: ${denied.join(', ')}`);
        console.log('💡 [MediaPermission] La app funcionará pero no podrás adjuntar fotos/videos');

        Alert.alert(
          'Permisos de multimedia',
          `Para compartir fotos y videos necesitamos acceso a: ${denied.join(' y ')}. ` +
          'Puedes otorgar los permisos desde la configuración de tu dispositivo.',
          [
            { text: 'Ahora no', style: 'cancel' },
            {
              text: 'Abrir configuración',
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                } else {
                  Linking.openSettings();
                }
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('❌ [MediaPermission] Error solicitando permisos:', error);
    }
  };

  return <>{children}</>;
}
