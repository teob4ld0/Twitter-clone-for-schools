import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export default function SettingsScreen({ navigation }) {
  const { theme, themeMode, setTheme } = useTheme();

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
      </ScrollView>
    </View>
  );
}
