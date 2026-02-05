import React, { useEffect, useRef, useState } from 'react';
import { Platform, AppState } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import pushNotificationService from '../services/pushNotificationService';
import { pushAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

/**
 * Componente que maneja el registro y configuración de notificaciones push
 */
export default function PushNotificationProvider({ children, navigation }) {
  const { user, isAuthenticated } = useAuth();
  const notificationListener = useRef();
  const responseListener = useRef();
  const appState = useRef(AppState.currentState);
  const [hasRegistered, setHasRegistered] = useState(false);
  const registrationAttempted = useRef(false);

  // Manejar cambios de AppState (para detectar cuando vuelve del diálogo de permisos)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      // Si la app vuelve al foreground después de estar en background
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('📱 App volvió al foreground');
        
        // Si aún no se ha registrado exitosamente, intentar de nuevo
        if (!hasRegistered && Device.isDevice && isAuthenticated()) {
          console.log('🔄 Reintentando registro de notificaciones después de volver al foreground...');
          
          // Verificar si ahora tenemos permisos
          const { status } = await Notifications.getPermissionsAsync();
          if (status === 'granted') {
            console.log('✅ Permisos otorgados, obteniendo token...');
            await registerForPushNotifications();
          }
        }
      }
      
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [hasRegistered, isAuthenticated()]);

  useEffect(() => {
    // Verificar si es Expo Go (no soporta push notifications en producción)
    // Constants.appOwnership puede ser: 'expo' (Expo Go), 'standalone', null, undefined
    const isExpoGo = Constants.appOwnership === 'expo';
    const isStandalone = Constants.appOwnership === 'standalone' || !Constants.appOwnership;
    
    console.log('🔍 App Ownership:', Constants.appOwnership);
    console.log('📱 Es dispositivo físico:', Device.isDevice);
    console.log('🔐 Usuario autenticado:', isAuthenticated());
    
    // En Expo Go, las notificaciones funcionan pero no son para producción
    // En standalone builds, necesitamos FCM configurado
    if (isExpoGo) {
      console.log('ℹ️  Expo Go detectado - Notificaciones en modo desarrollo');
    } else if (isStandalone) {
      console.log('✅ Build standalone detectado - Usando FCM');
    }

    // Registrar notificaciones si el usuario está autenticado y es un dispositivo físico
    if (isAuthenticated() && Device.isDevice && !registrationAttempted.current) {
      registrationAttempted.current = true;
      console.log('🚀 Iniciando proceso de registro de notificaciones...');
      registerForPushNotifications();
      setupNotificationListeners();
    } else {
      console.log('⏸️  Registro de notificaciones omitido:');
      console.log('   - Autenticado:', isAuthenticated());
      console.log('   - Es dispositivo:', Device.isDevice);
      console.log('   - Ya intentado:', registrationAttempted.current);
    }

    // Limpiar listeners cuando el componente se desmonta
    return () => {
      pushNotificationService.removeNotificationListeners();
    };
  }, [isAuthenticated(), user?.id]);

  const registerForPushNotifications = async () => {
    try {
      console.log('🚀 Iniciando registro de notificaciones push...');
      
      const token = await pushNotificationService.registerForPushNotifications(
        async (expoPushToken) => {
          // Callback para registrar el token en el backend
          try {
            const deviceInfo = {
              deviceType: Platform.OS,
              deviceName: Device.modelName || 'Unknown Device'
            };

            await pushAPI.registerExpoToken(expoPushToken, deviceInfo);
            console.log('✅ Token de Expo registrado en el backend');
            setHasRegistered(true);
          } catch (error) {
            console.error('❌ Error al registrar token en el backend:', error);
            // Si el backend no está listo, solo loguear, no crashear la app
            console.log('ℹ️  La app funciona normal, las notificaciones se registrarán cuando el backend esté listo');
            setHasRegistered(true); // Marcar como registrado de todas formas
          }
        }
      );

      if (token) {
        console.log('🔔 Notificaciones push configuradas correctamente');
        console.log('📱 Token Expo:', token);
        setHasRegistered(true);
      } else {
        console.log('⚠️  No se pudo obtener el token (permisos no otorgados o error)');
      }
    } catch (error) {
      console.error('Error configurando notificaciones:', error);
      // No hacer nada más, dejar que la app continúe funcionando
    }
  };

  const setupNotificationListeners = () => {
    // Listener para notificaciones recibidas mientras la app está abierta
    pushNotificationService.setupNotificationListeners(
      (notification) => {
        console.log('📩 Notificación recibida:', notification);
        
        // Aquí puedes actualizar el badge o mostrar una alerta personalizada
        const { title, body, data } = notification.request.content;
        
        // Ejemplo: Si es un mensaje de chat, podrías actualizar el contador de mensajes no leídos
        if (data?.type === 'chat') {
          // Actualizar estado de chat
          console.log('💬 Mensaje de chat recibido');
        }
      },
      (response) => {
        console.log('👆 Usuario interactuó con notificación:', response);
        
        // Navegar según el tipo de notificación
        const data = response.notification.request.content.data;
        
        if (data?.type === 'chat' && data?.chatId && navigation) {
          // Navegar al chat
          navigation.navigate('ChatDetail', { chatId: data.chatId });
        } else if (data?.type === 'status' && data?.statusId && navigation) {
          // Navegar al estado
          navigation.navigate('StatusDetail', { statusId: data.statusId });
        } else if (data?.type === 'notification' && navigation) {
          // Navegar a notificaciones
          navigation.navigate('Notifications');
        }
      }
    );
  };

  // Este componente no renderiza nada, solo maneja la lógica de notificaciones push
  return <>{children}</>;
}
