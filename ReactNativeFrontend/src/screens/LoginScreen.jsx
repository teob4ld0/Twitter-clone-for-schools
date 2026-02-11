import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { decode as base64Decode } from 'base-64';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import GoogleIcon from '../components/GoogleIcon';

export default function LoginScreen({ navigation }) {
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const googleAuth = useGoogleAuth();

  const parseUserFromToken = (token) => {
    const tokenPayload = JSON.parse(base64Decode(token.split('.')[1]));
    return {
      id:
        tokenPayload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ||
        tokenPayload['sub'] ||
        tokenPayload['userId'] ||
        tokenPayload['id'],
      email:
        tokenPayload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] ||
        tokenPayload['email'],
      username:
        tokenPayload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ||
        tokenPayload['name'] ||
        tokenPayload['username']
    };
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Por favor completa todos los campos');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await authAPI.login({ Email: email, Password: password });
      const { token } = response.data;
      const user = parseUserFromToken(token);
      
      if (!user.id) {
        setError('No se pudo extraer el ID del token. Contacta al administrador.');
        return;
      }
      
      await login(token, user);
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!googleAuth.isReady) {
      setError('Google Sign-In no está listo. Intenta de nuevo.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('🚀 [LoginScreen] Iniciando Google OAuth...');
      const result = await googleAuth.promptAsync();
      console.log('📦 [LoginScreen] Resultado de Google OAuth:', result ? 'Recibido' : 'Nulo');
      
      if (!result) {
        const authError = googleAuth.error;
        console.log('⚠️ [LoginScreen] Error de Google Auth:', authError);
        if (authError && !authError.includes('cancelado')) {
          setError(authError);
        }
        return;
      }

      const { token } = result;
      console.log('🎫 [LoginScreen] Token recibido:', token ? `Sí (${token.substring(0, 20)}...)` : 'No');
      
      if (!token) {
        console.error('❌ [LoginScreen] No se recibió token del backend');
        setError('No se recibió token del servidor');
        return;
      }
      
      const user = parseUserFromToken(token);
      console.log('👤 [LoginScreen] Usuario parseado:', user);
      
      if (!user.id) {
        console.error('❌ [LoginScreen] No se pudo extraer user.id del token');
        setError('No se pudo extraer el ID del token. Contacta al administrador.');
        return;
      }
      
      console.log('✅ [LoginScreen] Llamando a login() con token y user...');
      await login(token, user);
      console.log('🎉 [LoginScreen] Login completado exitosamente!');
    } catch (err) {
      console.error('🛑 [LoginScreen] Error en handleGoogleLogin:', err);
      console.error('🛑 [LoginScreen] Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      const errorMsg = err.response?.data?.error || err.message || 'Error al iniciar sesión con Google';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.cardBackground,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
    },
    content: {
      padding: 20,
      maxWidth: 600,
      width: '100%',
      alignSelf: 'center',
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 24,
      color: theme.colors.textPrimary,
    },
    errorContainer: {
      backgroundColor: theme.colors.errorBackground,
      padding: 12,
      borderRadius: 8,
      marginBottom: 16,
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.error,
    },
    errorText: {
      color: theme.colors.error,
      fontSize: 14,
    },
    form: {
      gap: 16,
    },
    field: {
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 8,
      color: theme.colors.textPrimary,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      backgroundColor: theme.colors.cardBackground,
      color: theme.colors.textPrimary,
    },
    button: {
      backgroundColor: theme.colors.primary,
      padding: 16,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 8,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    buttonText: {
      color: theme.colors.textOnPrimary,
      fontSize: 16,
      fontWeight: 'bold',
    },
    linkText: {
      color: theme.colors.primary,
      textAlign: 'center',
      marginTop: 16,
      fontSize: 14,
    },
    divider: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 16,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: theme.colors.border,
    },
    dividerText: {
      marginHorizontal: 16,
      color: theme.colors.textSecondary,
      fontSize: 14,
    },
    googleButton: {
      backgroundColor: theme.colors.cardBackground,
      padding: 16,
      borderRadius: 8,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor: theme.colors.textPrimary,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    googleButtonContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    googleButtonText: {
      color: theme.colors.textPrimary,
      fontSize: 16,
      fontWeight: '500',
    },
  });

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>Iniciar Sesión</Text>
          
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
          
          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>Email:</Text>
              <TextInput
                style={styles.input}
                placeholder="tu@email.com"
                placeholderTextColor={theme.colors.textTertiary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            </View>
            
            <View style={styles.field}>
              <Text style={styles.label}>Contraseña:</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••"
                placeholderTextColor={theme.colors.textTertiary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!loading}
              />
            </View>
            
            <TouchableOpacity 
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={theme.colors.textOnPrimary} />
              ) : (
                <Text style={styles.buttonText}>Iniciar Sesión</Text>
              )}
            </TouchableOpacity>
            
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>o</Text>
              <View style={styles.dividerLine} />
            </View>
            
            <TouchableOpacity 
              style={[styles.googleButton, loading && styles.buttonDisabled]}
              onPress={handleGoogleLogin}
              disabled={loading || !googleAuth.isReady}
            >
              <View style={styles.googleButtonContent}>
                <GoogleIcon size={20} />
                <Text style={styles.googleButtonText}>Continuar con Google</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => navigation.navigate('Register')}
              disabled={loading}
            >
              <Text style={styles.linkText}>¿No tienes cuenta? Regístrate</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}


