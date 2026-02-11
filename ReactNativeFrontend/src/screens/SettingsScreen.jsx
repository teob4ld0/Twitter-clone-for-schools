import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { usersAPI } from '../services/api';

export default function SettingsScreen({ navigation }) {
  const { theme, themeMode, setTheme } = useTheme();
  const { logout } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    section: {
      marginTop: 20,
      paddingHorizontal: 16,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      marginBottom: 12,
      textTransform: 'uppercase',
    },
    themeOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.colors.cardBackground,
      paddingVertical: 16,
      paddingHorizontal: 16,
      borderRadius: 12,
      marginBottom: 8,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    themeOptionActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primaryActive + '10',
    },
    themeOptionLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    themeIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.backgroundSecondary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    themeInfo: {
      flex: 1,
    },
    themeTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.textPrimary,
      marginBottom: 2,
    },
    themeDescription: {
      fontSize: 13,
      color: theme.colors.textSecondary,
    },
    checkIcon: {
      marginLeft: 8,
    },
    header: {
      paddingTop: 50,
      paddingBottom: 16,
      paddingHorizontal: 16,
      backgroundColor: theme.colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
    },
    backButton: {
      padding: 8,
      marginRight: 12,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.textOnPrimary,
    },
  });

  const handleThemeChange = (mode) => {
    setTheme(mode);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'ELIMINAR') return;
    setIsDeleting(true);
    setDeleteError('');
    try {
      await usersAPI.deleteMyAccount();
      await logout();
    } catch (err) {
      setDeleteError(err.message || 'Error al eliminar la cuenta. Intenta de nuevo.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={theme.colors.textOnPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configuración</Text>
      </View>
      
      <ScrollView>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Apariencia</Text>
          
          <TouchableOpacity
            style={[styles.themeOption, themeMode === 'light' && styles.themeOptionActive]}
            onPress={() => handleThemeChange('light')}
          >
            <View style={styles.themeOptionLeft}>
              <View style={styles.themeIconContainer}>
                <Feather name="sun" size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.themeInfo}>
                <Text style={styles.themeTitle}>Tema Claro</Text>
                <Text style={styles.themeDescription}>Colores brillantes y claros</Text>
              </View>
            </View>
            {themeMode === 'light' && (
              <Feather 
                name="check-circle" 
                size={24} 
                color={theme.colors.primary} 
                style={styles.checkIcon}
              />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.themeOption, themeMode === 'dark' && styles.themeOptionActive]}
            onPress={() => handleThemeChange('dark')}
          >
            <View style={styles.themeOptionLeft}>
              <View style={styles.themeIconContainer}>
                <Feather name="moon" size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.themeInfo}>
                <Text style={styles.themeTitle}>Tema Oscuro</Text>
                <Text style={styles.themeDescription}>Colores oscuros para reducir la fatiga visual</Text>
              </View>
            </View>
            {themeMode === 'dark' && (
              <Feather 
                name="check-circle" 
                size={24} 
                color={theme.colors.primary} 
                style={styles.checkIcon}
              />
            )}
          </TouchableOpacity>
        </View>

        {/* Sección Legal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>
          
          <TouchableOpacity
            style={styles.themeOption}
            onPress={() => navigation.navigate('PrivacyPolicy')}
          >
            <View style={styles.themeOptionLeft}>
              <View style={styles.themeIconContainer}>
                <Feather name="file-text" size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.themeInfo}>
                <Text style={styles.themeTitle}>Política de Privacidad</Text>
                <Text style={styles.themeDescription}>Consulta cómo manejamos tus datos</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.themeOption}
            onPress={() => navigation.navigate('Support')}
          >
            <View style={styles.themeOptionLeft}>
              <View style={styles.themeIconContainer}>
                <Feather name="help-circle" size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.themeInfo}>
                <Text style={styles.themeTitle}>Soporte</Text>
                <Text style={styles.themeDescription}>Contacta a nuestro equipo de ayuda</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Sección Zona de Peligro */}
        <View style={[styles.section, { marginBottom: 40 }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.error || '#e74c3c' }]}>Zona de Peligro</Text>
          
          <Text style={{ fontSize: 14, color: theme.colors.textSecondary, lineHeight: 20, marginBottom: 16 }}>
            Una vez que elimines tu cuenta, se borrarán todos tus datos permanentemente: publicaciones, mensajes, likes, seguidores y toda tu información. Esta acción no se puede deshacer.
          </Text>

          {!showDeleteConfirm ? (
            <TouchableOpacity
              style={[styles.themeOption, { borderColor: theme.colors.error || '#e74c3c', borderWidth: 1 }]}
              onPress={() => setShowDeleteConfirm(true)}
            >
              <View style={styles.themeOptionLeft}>
                <View style={[styles.themeIconContainer, { backgroundColor: (theme.colors.error || '#e74c3c') + '15' }]}>
                  <Feather name="trash-2" size={20} color={theme.colors.error || '#e74c3c'} />
                </View>
                <View style={styles.themeInfo}>
                  <Text style={[styles.themeTitle, { color: theme.colors.error || '#e74c3c' }]}>Eliminar mi cuenta</Text>
                  <Text style={styles.themeDescription}>Acción irreversible</Text>
                </View>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={{
              padding: 16,
              borderRadius: 12,
              backgroundColor: (theme.colors.error || '#e74c3c') + '10',
              borderWidth: 1,
              borderColor: theme.colors.error || '#e74c3c',
            }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.error || '#e74c3c', marginBottom: 12 }}>
                ¿Estás seguro? Escribe ELIMINAR para confirmar:
              </Text>
              <TextInput
                value={deleteConfirmText}
                onChangeText={setDeleteConfirmText}
                placeholder="Escribe ELIMINAR"
                placeholderTextColor={theme.colors.textSecondary}
                autoCapitalize="characters"
                style={{
                  padding: 12,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.cardBackground,
                  color: theme.colors.textPrimary,
                  fontSize: 15,
                  marginBottom: 12,
                }}
              />
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity
                  onPress={handleDeleteAccount}
                  disabled={deleteConfirmText !== 'ELIMINAR' || isDeleting}
                  style={{
                    flex: 1,
                    padding: 12,
                    borderRadius: 10,
                    backgroundColor: deleteConfirmText === 'ELIMINAR' ? (theme.colors.error || '#e74c3c') : (theme.colors.border || '#ccc'),
                    alignItems: 'center',
                    opacity: isDeleting ? 0.7 : 1,
                  }}
                >
                  {isDeleting ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>Confirmar</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); setDeleteError(''); }}
                  style={{
                    flex: 1,
                    padding: 12,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: theme.colors.textPrimary, fontWeight: '600', fontSize: 14 }}>Cancelar</Text>
                </TouchableOpacity>
              </View>
              {deleteError ? (
                <Text style={{ marginTop: 12, fontSize: 14, color: theme.colors.error || '#e74c3c' }}>
                  {deleteError}
                </Text>
              ) : null}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
