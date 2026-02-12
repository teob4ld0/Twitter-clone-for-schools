import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as RNLocalize from 'react-native-localize';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Importar traducciones
import es from './locales/es.json';
import en from './locales/en.json';

const LANGUAGE_STORAGE_KEY = '@twittetec:language';

// Recursos de traducción
const resources = {
  es: { translation: es },
  en: { translation: en }
};

// Función para obtener el idioma guardado o el del dispositivo
const getInitialLanguage = async () => {
  try {
    // Intentar obtener el idioma guardado
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (savedLanguage && (savedLanguage === 'es' || savedLanguage === 'en')) {
      return savedLanguage;
    }

    // Si no hay idioma guardado, usar el del dispositivo
    const locales = RNLocalize.getLocales();
    const deviceLanguage = locales[0]?.languageCode || 'es'; // 'es', 'en', etc.
    
    // Si el idioma del dispositivo es español o inglés, usarlo
    if (deviceLanguage === 'es' || deviceLanguage === 'en') {
      return deviceLanguage;
    }
    
    // Por defecto, español
    return 'es';
  } catch (error) {
    console.log('Error getting initial language:', error);
    return 'es';
  }
};

// Inicializar i18next
const initI18n = async () => {
  const initialLanguage = await getInitialLanguage();

  i18n
    .use(initReactI18next)
    .init({
      compatibilityJSON: 'v3',
      resources,
      lng: initialLanguage,
      fallbackLng: 'es',
      interpolation: {
        escapeValue: false // React Native ya escapa por defecto
      },
      react: {
        useSuspense: false
      }
    });

  return i18n;
};

// Función para cambiar el idioma y guardarlo
export const changeLanguage = async (language) => {
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    await i18n.changeLanguage(language);
  } catch (error) {
    console.error('Error changing language:', error);
  }
};

// Función para obtener el idioma actual
export const getCurrentLanguage = () => {
  return i18n.language;
};

// Función para obtener todas las traducciones disponibles
export const getAvailableLanguages = () => {
  return [
    { code: 'es', name: 'Español', nativeName: 'Español' },
    { code: 'en', name: 'English', nativeName: 'English' }
  ];
};

export { initI18n };
export default i18n;
