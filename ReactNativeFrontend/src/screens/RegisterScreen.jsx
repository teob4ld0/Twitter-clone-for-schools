import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { colors } from '../styles/colors';

export default function RegisterScreen({ navigation }) {
  const [formData, setFormData] = useState({
    Username: '',
    Email: '',
    Password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async () => {
    setError('');

    // Validar longitud del username
    if (formData.Username.length > 25) {
      setError('El nombre de usuario no puede tener más de 25 caracteres.');
      return;
    }

    // Validar que el username no tenga espacios
    if (formData.Username.includes(' ')) {
      setError('El nombre de usuario no puede contener espacios. Usa guiones bajos (_) en su lugar.');
      return;
    }

    // Validar que el username solo contenga caracteres válidos
    if (!/^[a-zA-Z0-9_]+$/.test(formData.Username)) {
      setError('El nombre de usuario solo puede contener letras, números y guiones bajos.');
      return;
    }

    // Validar dominio del email antes de enviar
    if (!formData.Email.endsWith('@alumno.etec.um.edu.ar') && !formData.Email.endsWith('@etec.um.edu.ar')) {
      setError('Solo se permiten registros con emails @etec.um.edu.ar');
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.register(formData);
      console.log('Registro exitoso:', response.data);
      
      Alert.alert(
        '¡Registro exitoso!',
        'Por favor revisa tu email para verificar tu cuenta antes de iniciar sesión.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } catch (err) {
      setError(err.message || 'Error al registrarse');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>Registrarse</Text>
          
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
          
          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>Nombre de usuario:</Text>
              <TextInput
                style={styles.input}
                value={formData.Username}
                onChangeText={(value) => handleChange('Username', value)}
                placeholder="usuario_123"
                autoCapitalize="none"
                maxLength={25}
              />
              <Text style={styles.helperText}>
                Solo letras, números y guiones bajos (_). Máximo 25 caracteres. ({formData.Username.length}/25)
              </Text>
            </View>
            
            <View style={styles.field}>
              <Text style={styles.label}>Email:</Text>
              <TextInput
                style={styles.input}
                value={formData.Email}
                onChangeText={(value) => handleChange('Email', value)}
                placeholder="tu@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            
            <View style={styles.field}>
              <Text style={styles.label}>Contraseña:</Text>
              <TextInput
                style={styles.input}
                value={formData.Password}
                onChangeText={(value) => handleChange('Password', value)}
                placeholder="••••••"
                secureTextEntry
              />
            </View>
            
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Registrando...' : 'Registrarse'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>¿Ya tienes cuenta? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerLink}>Inicia sesión</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    padding: 24,
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 24,
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#fee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#c00',
    fontSize: 14,
  },
  form: {
    gap: 16,
  },
  field: {
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 8,
  },
  input: {
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.white,
    color: '#000',
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  button: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: '#666',
    fontSize: 14,
  },
  footerLink: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
});
