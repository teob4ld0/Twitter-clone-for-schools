import React, { createContext, useState, useContext, useEffect } from 'react';
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
      try {
        const savedToken = await AsyncStorage.getItem('token');
        const savedUser = await AsyncStorage.getItem('user');

        if (savedToken && savedUser && savedUser !== 'undefined') {
          // Verificar si el token no expiró
          if (!isTokenExpired(savedToken)) {
            try {
              setToken(savedToken);
              setUser(JSON.parse(savedUser));
            } catch (error) {
              console.error('Error parsing user data:', error);
              await AsyncStorage.removeItem('token');
              await AsyncStorage.removeItem('user');
            }
          } else {
            // Token expirado, limpiar
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('user');
          }
        }
      } catch (error) {
        console.error('Error loading auth data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStoredAuth();
  }, []);

  const login = async (token, userData) => {
    try {
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      setToken(token);
      setUser(userData);
    } catch (error) {
      console.error('Error saving auth data:', error);
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
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Error clearing auth data:', error);
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
      loading 
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
