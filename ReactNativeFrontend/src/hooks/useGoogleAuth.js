import { useState, useEffect } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Necesario para que el browser se cierre automáticamente después del auth
WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = '232927055608-g8jifbp83flvll3jkib11pqs461j4dg7.apps.googleusercontent.com';

export const useGoogleAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const promptAsync = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Generate mobile state
      const mobileState = `mobile:${Math.random().toString(36).substring(2, 15)}`;
      
      // Build OAuth URL manually
      const authUrl = 'https://accounts.google.com/o/oauth2/v2/auth' +
        `?client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}` +
        `&redirect_uri=${encodeURIComponent('https://io.twittetec.com/api/auth/google/exchange')}` +
        `&response_type=code` +
        `&scope=${encodeURIComponent('openid email profile')}` +
        `&state=${encodeURIComponent(mobileState)}` +
        `&prompt=consent`;
      
      console.log('🚀 [useGoogleAuth] Abriendo OAuth URL...');
      
      // Set up deep link listener BEFORE opening browser
      const subscription = Linking.addEventListener('url', (event) => {
        console.log('🔗 [useGoogleAuth] Deep link recibido:', event.url);
      });
      
      // Open browser
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        'mynetapp://auth'
      );
      
      console.log('📦 [useGoogleAuth] Browser result:', result);
      
      // Clean up listener
      subscription.remove();
      
      if (result.type === 'success' && result.url) {
        // Parse token from URL
        const url = result.url;
        console.log('✅ [useGoogleAuth] Success URL recibida:', url);
        
        const tokenMatch = url.match(/[?&]token=([^&]+)/);
        if (tokenMatch) {
          const token = decodeURIComponent(tokenMatch[1]);
          console.log('🎫 [useGoogleAuth] Token extraído del deep link');
          return { token };
        } else {
          console.error('❌ [useGoogleAuth] No se encontró token en la URL');
          setError('No se recibió token de autenticación');
          return null;
        }
      } else if (result.type === 'cancel') {
        console.log('⚠️ [useGoogleAuth] Usuario canceló');
        setError('Inicio de sesión cancelado');
        return null;
      } else {
        console.error('❌ [useGoogleAuth] Resultado inesperado:', result);
        setError('Error de autenticación con Google');
        return null;
      }
    } catch (err) {
      console.error('🛑 [useGoogleAuth] Error en promptAsync:', err);
      setError('Error al conectar con Google');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    promptAsync,
    loading,
    error,
    isReady: true,
  };
};
