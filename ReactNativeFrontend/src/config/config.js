import Constants from 'expo-constants';

// Configuración de la API
const getApiUrl = () => {
  // Prioridad: expo-constants > valor por defecto
  const apiUrl = Constants.expoConfig?.extra?.apiUrl || 'https://io.twittetec.com/api';
  console.log('[CONFIG] API URL:', apiUrl);
  return apiUrl;
};

export const API_URL = getApiUrl();

export default {
  API_URL,
};
