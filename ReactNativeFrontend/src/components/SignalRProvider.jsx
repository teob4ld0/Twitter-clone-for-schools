import React, { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import * as signalR from '@microsoft/signalr';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { receiveMessageFromSignalR, deleteMessageFromSignalR, fetchChats } from '../store/chatSlice';
import { receiveNotificationFromSignalR } from '../store/notificationSlice';
import { API_URL } from '../config/config';

// Extraer la base URL (sin /api al final)
const HUB_BASE_URL = API_URL.replace(/\/api$/, '');
const MAX_RECONNECT_ATTEMPTS = 5;

export default function SignalRProvider({ children }) {
  const { user, token, loading } = useAuth();
  const dispatch = useDispatch();
  const chatConnectionRef = useRef(null);
  const notificationConnectionRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);

  useEffect(() => {
    // No iniciar SignalR hasta que AuthContext termine de cargar
    if (loading) {
      console.log('⏳ SignalR: Esperando a que AuthContext termine de cargar...');
      return;
    }

    // Solo iniciar si hay usuario autenticado y token disponible
    if (!user || !token) {
      console.log('🔌 SignalR: Usuario no autenticado, saltando conexión');
      // Asegurar que las conexiones están limpias
      chatConnectionRef.current = null;
      notificationConnectionRef.current = null;
      return;
    }

    console.log('🔌 SignalR: Iniciando conexiones a hubs...');
    console.log('🔌 SignalR: URL Base:', HUB_BASE_URL);
    console.log('🔌 SignalR: User ID:', user?.id);

    const startConnections = async () => {
      try {
        // Verificar si las conexiones ya están establecidas
        const chatConnected = chatConnectionRef.current && 
                             chatConnectionRef.current.state === signalR.HubConnectionState.Connected;
        const notificationsConnected = notificationConnectionRef.current && 
                                      notificationConnectionRef.current.state === signalR.HubConnectionState.Connected;

        if (chatConnected && notificationsConnected) {
          console.log('✅ SignalR: Conexiones ya establecidas');
          return;
        }

        // ====== CHAT HUB ======
        chatConnectionRef.current = new signalR.HubConnectionBuilder()
          .withUrl(`${HUB_BASE_URL}/hubs/chat`, {
            accessTokenFactory: async () => {
              const currentToken = await AsyncStorage.getItem('token');
              return currentToken || token;
            },
            skipNegotiation: false,
            transport: signalR.HttpTransportType.WebSockets | 
                      signalR.HttpTransportType.ServerSentEvents | 
                      signalR.HttpTransportType.LongPolling
          })
          .withAutomaticReconnect({
            nextRetryDelayInMilliseconds: (retryContext) => {
              if (retryContext.previousRetryCount < MAX_RECONNECT_ATTEMPTS) {
                const delay = Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000);
                console.log(`🔄 SignalR: Reintentando conexión al chat en ${delay}ms...`);
                return delay;
              }
              console.error('❌ SignalR: Máximo de reintentos alcanzado para chat');
              return null;
            }
          })
          .configureLogging(signalR.LogLevel.Information)
          .build();

        // Event handlers para Chat Hub
        chatConnectionRef.current.on('ReceiveMessage', (message) => {
          console.log('📨 SignalR: Mensaje recibido', message);
          dispatch(receiveMessageFromSignalR(message));
        });

        chatConnectionRef.current.on('MessageDeleted', (data) => {
          console.log('🗑️ SignalR: Mensaje eliminado', data);
          dispatch(deleteMessageFromSignalR(data));
        });

        chatConnectionRef.current.on('ChatUpdated', (chatId) => {
          console.log('🔄 SignalR: Chat actualizado', chatId);
          dispatch(fetchChats());
        });

        // ====== NOTIFICATION HUB ======
        notificationConnectionRef.current = new signalR.HubConnectionBuilder()
          .withUrl(`${HUB_BASE_URL}/hubs/notifications`, {
            accessTokenFactory: async () => {
              const currentToken = await AsyncStorage.getItem('token');
              return currentToken || token;
            },
            skipNegotiation: false,
            transport: signalR.HttpTransportType.WebSockets | 
                      signalR.HttpTransportType.ServerSentEvents | 
                      signalR.HttpTransportType.LongPolling
          })
          .withAutomaticReconnect({
            nextRetryDelayInMilliseconds: (retryContext) => {
              if (retryContext.previousRetryCount < MAX_RECONNECT_ATTEMPTS) {
                const delay = Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000);
                console.log(`🔄 SignalR: Reintentando conexión a notificaciones en ${delay}ms...`);
                return delay;
              }
              console.error('❌ SignalR: Máximo de reintentos alcanzado para notificaciones');
              return null;
            }
          })
          .configureLogging(signalR.LogLevel.Information)
          .build();

        // Event handlers para Notification Hub
        notificationConnectionRef.current.on('ReceiveNotification', (notification) => {
          console.log('🔔 SignalR: Notificación recibida', notification);
          dispatch(receiveNotificationFromSignalR(notification));
        });

        // ====== CONNECTION LIFECYCLE EVENTS ======
        // Chat Hub lifecycle
        chatConnectionRef.current.onreconnecting((error) => {
          console.warn('⚠️ SignalR: Reconectando chat...', error?.message);
          reconnectAttemptsRef.current++;
        });

        chatConnectionRef.current.onreconnected((connectionId) => {
          console.log('✅ SignalR: Chat reconectado', connectionId);
          reconnectAttemptsRef.current = 0;
        });

        chatConnectionRef.current.onclose((error) => {
          console.error('❌ SignalR: Conexión de chat cerrada', error?.message);
          if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
            console.error('❌ SignalR: Máximo de reintentos alcanzado para chat');
          }
        });

        // Notification Hub lifecycle
        notificationConnectionRef.current.onreconnecting((error) => {
          console.warn('⚠️ SignalR: Reconectando notificaciones...', error?.message);
          reconnectAttemptsRef.current++;
        });

        notificationConnectionRef.current.onreconnected((connectionId) => {
          console.log('✅ SignalR: Notificaciones reconectadas', connectionId);
          reconnectAttemptsRef.current = 0;
        });

        notificationConnectionRef.current.onclose((error) => {
          console.error('❌ SignalR: Conexión de notificaciones cerrada', error?.message);
          if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
            console.error('❌ SignalR: Máximo de reintentos alcanzado para notificaciones');
          }
        });

        // ====== START CONNECTIONS ======
        await Promise.all([
          chatConnectionRef.current.start(),
          notificationConnectionRef.current.start()
        ]);

        console.log('✅ SignalR: Todas las conexiones establecidas correctamente');
        reconnectAttemptsRef.current = 0;

      } catch (error) {
        console.error('❌ SignalR: Error al iniciar conexiones', error);
      }
    };

    startConnections();

    // Cleanup: cerrar conexiones al desmontar o cuando user/token cambien
    return () => {
      // Solo intentar cerrar si hay usuario (evita errores al hacer logout)
      if (!user || !token) {
        console.log('🔌 SignalR: Saltando cleanup (no autenticado)');
        return;
      }

      console.log('🔌 SignalR: Cerrando conexiones...');

      const stopConnections = async () => {
        try {
          const promises = [];
          
          if (chatConnectionRef.current?.state === signalR.HubConnectionState.Connected) {
            promises.push(chatConnectionRef.current.stop().catch(err => 
              console.warn('⚠️ Error cerrando chat:', err.message)
            ));
          }
          
          if (notificationConnectionRef.current?.state === signalR.HubConnectionState.Connected) {
            promises.push(notificationConnectionRef.current.stop().catch(err => 
              console.warn('⚠️ Error cerrando notificaciones:', err.message)
            ));
          }

          if (promises.length > 0) {
            await Promise.allSettled(promises);
          }
          
          chatConnectionRef.current = null;
          notificationConnectionRef.current = null;
          reconnectAttemptsRef.current = 0;
          
          console.log('✅ SignalR: Conexiones cerradas');
        } catch (error) {
          console.error('❌ SignalR: Error al cerrar conexiones', error);
          // Limpiar referencias de todas formas
          chatConnectionRef.current = null;
          notificationConnectionRef.current = null;
        }
      };

      stopConnections();
    };
  }, [user, token, loading, dispatch]);

  return <>{children}</>;
}
