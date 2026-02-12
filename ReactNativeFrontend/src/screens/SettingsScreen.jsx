import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { usersAPI } from '../services/api';

export default function SettingsScreen({ navigation }) {
  const { t, i18n } = useTranslation();
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

  const handleLanguageChange = (lang) => {
    i18n.changeLanguage(lang);
  };

  const handleDeleteAccount = async () => {
    const confirmWord = i18n.language === 'es' ? 'ELIMINAR' : 'DELETE';
    if (deleteConfirmText !== confirmWord) return;
    setIsDeleting(true);
    setDeleteError('');
    try {
      await usersAPI.deleteMyAccount();
      await logout();
    } catch (err) {
      setDeleteError(t('settings.deleteAccountError'));
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
        <Text style={styles.headerTitle}>{t('settings.title')}</Text>
      </View>
      
      <ScrollView>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.appearance')}</Text>
          
          <TouchableOpacity
            style={[styles.themeOption, themeMode === 'light' && styles.themeOptionActive]}
            onPress={() => handleThemeChange('light')}
          >
            <View style={styles.themeOptionLeft}>
              <View style={styles.themeIconContainer}>
                <Feather name="sun" size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.themeInfo}>
                <Text style={styles.themeTitle}>{t('settings.lightTheme')}</Text>
                <Text style={styles.themeDescription}>{t('settings.lightThemeDesc')}</Text>
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
                <Text style={styles.themeTitle}>{t('settings.darkTheme')}</Text>
                <Text style={styles.themeDescription}>{t('settings.darkThemeDesc')}</Text>
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

        {/* Sección Idioma */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.language')}</Text>
          
          <TouchableOpacity
            style={[styles.themeOption, i18n.language === 'es' && styles.themeOptionActive]}
            onPress={() => handleLanguageChange('es')}
          >
            <View style={styles.themeOptionLeft}>
              <View style={styles.themeIconContainer}>
                <Text style={{ fontSize: 20 }}>🇪🇸</Text>
              </View>
              <View style={styles.themeInfo}>
                <Text style={styles.themeTitle}>Español</Text>
                <Text style={styles.themeDescription}>Spanish</Text>
              </View>
            </View>
            {i18n.language === 'es' && (
              <Feather 
                name="check-circle" 
                size={24} 
                color={theme.colors.primary} 
                style={styles.checkIcon}
              />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.themeOption, i18n.language === 'en' && styles.themeOptionActive]}
            onPress={() => handleLanguageChange('en')}
          >
            <View style={styles.themeOptionLeft}>
              <View style={styles.themeIconContainer}>
                <Text style={{ fontSize: 20 }}>🇺🇸</Text>
              </View>
              <View style={styles.themeInfo}>
                <Text style={styles.themeTitle}>English</Text>
                <Text style={styles.themeDescription}>Inglés</Text>
              </View>
            </View>
            {i18n.language === 'en' && (
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
          <Text style={styles.sectionTitle}>{t('settings.legal')}</Text>
          
          <TouchableOpacity
            style={styles.themeOption}
            onPress={() => navigation.navigate('PrivacyPolicy')}
          >
            <View style={styles.themeOptionLeft}>
              <View style={styles.themeIconContainer}>
                <Feather name="file-text" size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.themeInfo}>
                <Text style={styles.themeTitle}>{t('settings.privacyPolicy')}</Text>
                <Text style={styles.themeDescription}>{t('settings.privacyPolicyDesc')}</Text>
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
                <Text style={styles.themeTitle}>{t('settings.support')}</Text>
                <Text style={styles.themeDescription}>{t('settings.supportDesc')}</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Sección Zona de Peligro */}
        <View style={[styles.section, { marginBottom: 40 }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.error || '#e74c3c' }]}>{t('settings.dangerZone')}</Text>
          
          <Text style={{ fontSize: 14, color: theme.colors.textSecondary, lineHeight: 20, marginBottom: 16 }}>
            {t('settings.deleteAccountWarning')}
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
                  <Text style={[styles.themeTitle, { color: theme.colors.error || '#e74c3c' }]}>{t('settings.deleteAccount')}</Text>
                  <Text style={styles.themeDescription}>{t('settings.deleteAccountIrreversible')}</Text>
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
                {t('settings.deleteAccountConfirm')}
              </Text>
              <TextInput
                value={deleteConfirmText}
                onChangeText={setDeleteConfirmText}
                placeholder={t('settings.deleteAccountPlaceholder')}
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
                  disabled={deleteConfirmText !== (i18n.language === 'es' ? 'ELIMINAR' : 'DELETE') || isDeleting}
                  style={{
                    flex: 1,
                    padding: 12,
                    borderRadius: 10,
                    backgroundColor: deleteConfirmText === (i18n.language === 'es' ? 'ELIMINAR' : 'DELETE') ? (theme.colors.error || '#e74c3c') : (theme.colors.border || '#ccc'),
                    alignItems: 'center',
                    opacity: isDeleting ? 0.7 : 1,
                  }}
                >
                  {isDeleting ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>{t('common.confirm')}</Text>
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
                  <Text style={{ color: theme.colors.textPrimary, fontWeight: '600', fontSize: 14 }}>{t('common.cancel')}</Text>
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
