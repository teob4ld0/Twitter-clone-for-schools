import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Configurar cómo se manejan las notificaciones cuando la app está en primer plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class PushNotificationService {
  constructor() {
    this.expoPushToken = null;
    this.notificationListener = null;
    this.responseListener = null;
  }

  /**
   * Registrar para recibir notificaciones push
   * @param {Function} registerTokenCallback - Callback para registrar el token en el backend
   * @returns {Promise<string|null>} - Token de Expo o null si falla
   */
  async registerForPushNotifications(registerTokenCallback) {
    try {
      // Verificar si es un dispositivo físico
      if (!Device.isDevice) {
        console.log('Las notificaciones push solo funcionan en dispositivos físicos');
        return null;
      }

      // Obtener el estado actual de los permisos
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      console.log(`📋 Estado actual de permisos: ${existingStatus}`);

      // Si no hay permisos, solicitarlos
      if (existingStatus !== 'granted') {
        console.log('❓ Solicitando permisos de notificación...');
        console.log('⚠️  NOTA: La app se minimizará mientras el diálogo de permisos aparece (comportamiento normal de Android)');
        
        const permissionResponse = await Notifications.requestPermissionsAsync();
        finalStatus = permissionResponse.status;
        
        console.log(`📋 Resultado de solicitud de permisos: ${finalStatus}`);
        
        // Si los permisos fueron otorgados, dar un momento para estabilizar
        if (finalStatus === 'granted') {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Si el usuario denegó los permisos
      if (finalStatus !== 'granted') {
        console.log('⚠️ Permisos de notificaciones denegados o no otorgados');
        console.log('💡 La app funcionará normal pero no recibirás notificaciones push');
        return null;
      }

      console.log('✅ Permisos de notificación otorgados, obteniendo token...');

      // Obtener el token de Expo Push
      // Intentar múltiples formas de obtener el projectId
      let projectId = Constants.expoConfig?.extra?.eas?.projectId;
      
      if (!projectId) {
        // Fallback: intentar desde Constants.easConfig
        projectId = Constants.easConfig?.projectId;
      }
      
      if (!projectId) {
        // Fallback: intentar desde manifest
        projectId = Constants.manifest?.extra?.eas?.projectId;
      }
      
      console.log('🔑 Project ID encontrado:', projectId || 'NINGUNO');
      console.log('📦 App Ownership:', Constants.appOwnership);
      console.log('🏗️  Constants disponibles:', {
        hasExpoConfig: !!Constants.expoConfig,
        hasEasConfig: !!Constants.easConfig,
        hasManifest: !!Constants.manifest
      });
      
      if (!projectId && Constants.appOwnership !== 'expo') {
        console.error('❌ ERROR CRÍTICO: No se encontró projectId para build standalone');
        console.error('   Verifica que app.json tenga: extra.eas.projectId');
        throw new Error('ProjectId es requerido para builds standalone');
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      });

      this.expoPushToken = tokenData.data;
      console.log('📱 Expo Push Token obtenido:', this.expoPushToken);

      // Configuración específica de Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#1DA1F2',
          sound: 'default',
          enableVibrate: true,
          showBadge: true,
        });

        // Canal para mensajes de chat
        await Notifications.setNotificationChannelAsync('chat', {
          name: 'Mensajes de Chat',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#1DA1F2',
          sound: 'default',
        });

        // Canal para interacciones sociales
        await Notifications.setNotificationChannelAsync('social', {
          name: 'Interacciones Sociales',
          importance: Notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0, 250],
          lightColor: '#1DA1F2',
        });
      }

      // Registrar el token en el backend
      if (registerTokenCallback) {
        console.log('🔄 Registrando token en el backend...');
        try {
          await registerTokenCallback(this.expoPushToken);
          console.log('✅ Callback de registro ejecutado correctamente');
        } catch (callbackError) {
          console.error('❌ Error en el callback de registro:', callbackError);
          // No lanzar el error, solo loguearlo
        }
      }

      return this.expoPushToken;
    } catch (error) {
      console.error('❌ ERROR AL REGISTRAR NOTIFICACIONES PUSH:');
      console.error('   Tipo:', error.name);
      console.error('   Mensaje:', error.message);
      console.error('   Stack:', error.stack);
      
      // Información adicional para debugging
      console.error('📊 Estado en el momento del error:');
      console.error('   - Es dispositivo:', Device.isDevice);
      console.error('   - Platform:', Platform.OS);
      console.error('   - App Ownership:', Constants.appOwnership);
      console.error('   - ProjectId disponible:', !!Constants.expoConfig?.extra?.eas?.projectId);
      
      // No mostrar alert que puede minimizar la app, solo loguear
      return null;
    }
  }

  /**
   * Configurar listeners para notificaciones
   * @param {Function} onNotificationReceived - Callback cuando se recibe una notificación
   * @param {Function} onNotificationInteraction - Callback cuando el usuario interactúa con una notificación
   */
  setupNotificationListeners(onNotificationReceived, onNotificationInteraction) {
    // Listener para notificaciones recibidas mientras la app está abierta
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notificación recibida:', notification);
      if (onNotificationReceived) {
        onNotificationReceived(notification);
      }
    });

    // Listener para cuando el usuario toca una notificación
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Usuario interactuó con notificación:', response);
      if (onNotificationInteraction) {
        onNotificationInteraction(response);
      }
    });
  }

  /**
   * Limpiar listeners de notificaciones
   */
  removeNotificationListeners() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
      this.notificationListener = null;
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
      this.responseListener = null;
    }
  }

  /**
   * Obtener el token actual
   */
  getToken() {
    return this.expoPushToken;
  }

  /**
   * Programar una notificación local
   * @param {Object} content - Contenido de la notificación
   * @param {Object} trigger - Trigger para la notificación
   */
  async scheduleNotification(content, trigger = null) {
    try {
      await Notifications.scheduleNotificationAsync({
        content,
        trigger,
      });
    } catch (error) {
      console.error('Error al programar notificación:', error);
    }
  }

  /**
   * Cancelar todas las notificaciones programadas
   */
  async cancelAllScheduledNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error al cancelar notificaciones:', error);
    }
  }

  /**
   * Establecer el badge de la app (número de notificaciones)
   * @param {number} count - Número a mostrar
   */
  async setBadgeCount(count) {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Error al establecer badge count:', error);
    }
  }

  /**
   * Obtener todas las notificaciones presentes
   */
  async getPresentedNotifications() {
    try {
      return await Notifications.getPresentedNotificationsAsync();
    } catch (error) {
      console.error('Error al obtener notificaciones presentadas:', error);
      return [];
    }
  }

  /**
   * Descartar todas las notificaciones
   */
  async dismissAllNotifications() {
    try {
      await Notifications.dismissAllNotificationsAsync();
    } catch (error) {
      console.error('Error al descartar notificaciones:', error);
    }
  }
}

// Exportar instancia singleton
export default new PushNotificationService();
