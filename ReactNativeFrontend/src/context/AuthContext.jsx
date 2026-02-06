import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { decode as base64Decode } from 'base-64';

const AuthContext = createContext();

// Función manual para decodificar JWT (usando base-64 polyfill para React Native)
const decodeJWT = (token) => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }
    // Decodificar la parte del payload (segunda parte)
    const payload = parts[1];
    // Reemplazar caracteres específicos de base64url
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    // Decodificar base64 usando polyfill
    const jsonPayload = base64Decode(base64);
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRehydrating, setIsRehydrating] = useState(true);
  const appState = useRef(AppState.currentState);

  // Función para verificar si el token expiró
  const isTokenExpired = (savedToken) => {
    if (!savedToken || typeof savedToken !== 'string' || savedToken.trim() === '') {
      return true;
    }
    try {
      const decodedToken = decodeJWT(savedToken);
      if (!decodedToken || !decodedToken.exp) {
        return true;
      }
      const currentTime = Date.now() / 1000;
      return decodedToken.exp < currentTime;
    } catch (error) {
      console.error('Error decoding token:', error);
      return true;
    }
  };

  // Al cargar, verificar si hay token guardado y si es válido
  useEffect(() => {
    const loadStoredAuth = async () => {
      console.log('🔄 [AuthContext] Iniciando carga de autenticación...');
      try {
        const savedToken = await AsyncStorage.getItem('token');
        const savedUser = await AsyncStorage.getItem('user');
        
        console.log('📦 [AuthContext] Token guardado:', savedToken ? 'Sí' : 'No');
        console.log('📦 [AuthContext] Usuario guardado:', savedUser ? 'Sí' : 'No');

        if (savedToken && savedUser && savedUser !== 'undefined') {
          // Verificar si el token no expiró
          if (!isTokenExpired(savedToken)) {
            try {
              const parsedUser = JSON.parse(savedUser);
              setToken(savedToken);
              setUser(parsedUser);
              console.log('✅ [AuthContext] Sesión restaurada para:', parsedUser.username);
            } catch (error) {
              console.error('❌ [AuthContext] Error parsing user data:', error);
              await AsyncStorage.removeItem('token');
              await AsyncStorage.removeItem('user');
            }
          } else {
            // Token expirado, limpiar
            console.log('⚠️ [AuthContext] Token expirado, limpiando...');
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('user');
          }
        } else {
          console.log('ℹ️ [AuthContext] No hay sesión guardada');
        }
      } catch (error) {
        console.error('❌ [AuthContext] Error loading auth data:', error);
      } finally {
        setLoading(false);
        setIsRehydrating(false);
        console.log('✅ [AuthContext] Carga completada');
      }
    };

    loadStoredAuth();
  }, []);

  // Manejar cambios en el estado de la app (background/foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('🔄 [AuthContext] App volvió al foreground');
        // Verificar que la sesión siga siendo válida
        if (token && isTokenExpired(token)) {
          console.log('⚠️ [AuthContext] Token expiró mientras la app estaba en background');
          logout();
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription?.remove();
    };
  }, [token]);

  const login = async (token, userData) => {
    try {
      console.log('🔐 [AuthContext] Guardando sesión para:', userData.username);
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      setToken(token);
      setUser(userData);
      console.log('✅ [AuthContext] Sesión guardada exitosamente');
    } catch (error) {
      console.error('❌ [AuthContext] Error saving auth data:', error);
    }
  };

  const updateUser = async (partialUserData) => {
    try {
      const updatedUser = { ...(user || {}), ...(partialUserData || {}) };
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error('Error updating user data:', error);
    }
  };

  const logout = async () => {
    try {
      console.log('🚪 [AuthContext] Cerrando sesión...');
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      setToken(null);
      setUser(null);
      console.log('✅ [AuthContext] Sesión cerrada');
    } catch (error) {
      console.error('❌ [AuthContext] Error clearing auth data:', error);
    }
  };

  const isAuthenticated = () => {
    if (!token || typeof token !== 'string' || token.trim() === '') {
      return false;
    }
    return !isTokenExpired(token);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      login, 
      updateUser,
      logout, 
      isAuthenticated, 
      loading,
      isRehydrating
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}
