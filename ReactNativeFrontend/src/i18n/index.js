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

// Detectar idioma del dispositivo de forma síncrona
const getDeviceLanguage = () => {
  try {
    const locales = RNLocalize.getLocales();
    const deviceLanguage = locales[0]?.languageCode || 'es';
    return (deviceLanguage === 'es' || deviceLanguage === 'en') ? deviceLanguage : 'es';
  } catch {
    return 'es';
  }
};

// Inicializar i18next de forma SÍNCRONA para que las traducciones
// estén disponibles inmediatamente al importar el módulo
i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    resources,
    lng: getDeviceLanguage(),
    fallbackLng: 'es',
    interpolation: {
      escapeValue: false // React Native ya escapa por defecto
    },
    react: {
      useSuspense: false
    }
  });

// Cargar idioma guardado en AsyncStorage de forma asíncrona
// (si el usuario había elegido uno diferente al del dispositivo)
const loadSavedLanguage = async () => {
  try {
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (savedLanguage && (savedLanguage === 'es' || savedLanguage === 'en')) {
      if (savedLanguage !== i18n.language) {
        await i18n.changeLanguage(savedLanguage);
      }
    }
  } catch (error) {
    console.log('Error loading saved language:', error);
  }
};

loadSavedLanguage();

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

export default i18n;
