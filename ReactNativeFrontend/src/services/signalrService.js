import * as signalR from '@microsoft/signalr';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/config';

// Extraer la base URL (sin /api al final si existe)
const BASE_URL = API_URL.replace(/\/api$/, '');
console.log('🔌 SignalR Base URL:', BASE_URL);

class SignalRService {
  constructor() {
    this.chatConnection = null;
    this.notificationConnection = null;
  }

  async buildConnection(hubPath) {
    const token = await AsyncStorage.getItem('token');
    
    return new signalR.HubConnectionBuilder()
      .withUrl(`${BASE_URL}${hubPath}`, {
        accessTokenFactory: () => token || ''
      })
      .withAutomaticReconnect()
      .build();
  }

  async startChatHub(onMessageReceived) {
    try {
      this.chatConnection = await this.buildConnection('/hubs/chat');
      
      this.chatConnection.on('ReceiveMessage', (message) => {
        console.log('Mensaje recibido:', message);
        if (onMessageReceived) {
          onMessageReceived(message);
        }
      });

      await this.chatConnection.start();
      console.log('Chat Hub conectado');
    } catch (error) {
      console.error('Error conectando al Chat Hub:', error);
    }
  }

  async startNotificationHub(onNotificationReceived) {
    try {
      this.notificationConnection = await this.buildConnection('/hubs/notifications');
      
      this.notificationConnection.on('ReceiveNotification', (notification) => {
        console.log('Notificación recibida:', notification);
        if (onNotificationReceived) {
          onNotificationReceived(notification);
        }
      });

      await this.notificationConnection.start();
      console.log('Notification Hub conectado');
    } catch (error) {
      console.error('Error conectando al Notification Hub:', error);
    }
  }

  async stopChatHub() {
    if (this.chatConnection) {
      await this.chatConnection.stop();
      this.chatConnection = null;
      console.log('Chat Hub desconectado');
    }
  }

  async stopNotificationHub() {
    if (this.notificationConnection) {
      await this.notificationConnection.stop();
      this.notificationConnection = null;
      console.log('Notification Hub desconectado');
    }
  }

  async stopAll() {
    await this.stopChatHub();
    await this.stopNotificationHub();
  }
}

export default new SignalRService();
