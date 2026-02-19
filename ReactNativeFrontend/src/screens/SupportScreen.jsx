import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export default function SupportScreen({ navigation }) {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
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
    scrollContent: {
      padding: 20,
      paddingBottom: 40,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 15,
      color: theme.colors.textSecondary,
      lineHeight: 22,
      marginBottom: 24,
    },
    card: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 16,
      padding: 20,
      borderRadius: 12,
      backgroundColor: theme.colors.cardBackground,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 16,
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
    },
    cardTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      marginBottom: 4,
    },
    cardDescription: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 8,
    },
    cardLink: {
      fontSize: 15,
      fontWeight: '600',
    },
    infoCard: {
      padding: 16,
      borderRadius: 12,
      backgroundColor: theme.colors.cardBackground,
      borderWidth: 1,
      borderColor: theme.colors.border,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
    },
    infoTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      marginBottom: 8,
    },
    infoText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 20,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={theme.colors.textOnPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Soporte</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Soporte</Text>
        <Text style={styles.subtitle}>
          ¿Necesitas ayuda? Contacta a nuestro equipo de soporte a través de cualquiera de los siguientes medios.
        </Text>

        {/* Email */}
        <View style={styles.card}>
          <View style={[styles.iconContainer, { backgroundColor: (theme.colors.primaryLight || 'rgba(29,161,242,0.1)') }]}>
            <Text style={{ fontSize: 24 }}>✉️</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Correo electrónico</Text>
            <Text style={styles.cardDescription}>Escríbenos y te responderemos a la brevedad.</Text>
            <TouchableOpacity onPress={() => Linking.openURL('mailto:support@twittetec.com')}>
              <Text style={[styles.cardLink, { color: theme.colors.primary }]}>support@twittetec.com</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* WhatsApp */}
        <View style={styles.card}>
          <View style={[styles.iconContainer, { backgroundColor: '#25D36620' }]}>
            <Text style={{ fontSize: 24 }}>📱</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Teléfono / WhatsApp</Text>
            <Text style={styles.cardDescription}>Comunícate con nosotros directamente.</Text>
            <TouchableOpacity onPress={() => Linking.openURL('https://wa.me/5492616301072')}>
              <Text style={[styles.cardLink, { color: '#25D366' }]}>+54 9 261 630-1072</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Política de privacidad */}
        <View style={styles.card}>
          <View style={[styles.iconContainer, { backgroundColor: (theme.colors.primaryLight || 'rgba(29,161,242,0.1)') }]}>
            <Text style={{ fontSize: 24 }}>🔒</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Política de privacidad</Text>
            <Text style={styles.cardDescription}>Lee nuestra política de privacidad.</Text>
            <TouchableOpacity onPress={() => navigation.navigate('PrivacyPolicy')}>
              <Text style={[styles.cardLink, { color: theme.colors.primary }]}>
                Aclara cualquier duda sobre el manejo de tus datos "personales" aquí.
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Estándares de seguridad infantil */}
        <View style={styles.card}>
          <View style={[styles.iconContainer, { backgroundColor: '#FF634720' }]}>
            <Text style={{ fontSize: 24 }}>🛡️</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Seguridad infantil</Text>
            <Text style={styles.cardDescription}>Nuestros estándares contra el abuso infantil.</Text>
            <TouchableOpacity onPress={() => navigation.navigate('SafetyStandards')}>
              <Text style={[styles.cardLink, { color: '#FF6347' }]}>
                Conoce nuestras medidas de protección y seguridad.
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoCard}>
          <Text style={{ fontSize: 20, minWidth: 24 }}>ℹ️</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>Información</Text>
            <Text style={styles.infoText}>
              Nuestro equipo de soporte está disponible de lunes a viernes de 8:00 a 18:00 (hora Argentina). Los mensajes recibidos fuera de horario serán respondidos el siguiente día hábil.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
