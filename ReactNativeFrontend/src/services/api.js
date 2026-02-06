import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform } from 'react-native';
import { API_URL } from '../config/config';

console.log('🌐 API URL configurada:', API_URL);

// Helper para crear headers con autorización
const getHeaders = async (isMultipart = false) => {
  const token = await AsyncStorage.getItem('token');
  const headers = {};
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  
  return headers;
};

// Helper para manejar respuestas
const handleResponse = async (response) => {
  if (response.status === 403) {
    const data = await response.json().catch(() => ({}));
    if (data.banned === true) {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      Alert.alert(
        'Cuenta Suspendida',
        'Tu cuenta ha sido suspendida. Contacta al administrador.',
        [{ text: 'OK' }]
      );
      throw new Error('Account banned');
    }
  }
  
  if (response.status === 401) {
    console.warn('Request failed with 401 Unauthorized');
  }
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
    throw new Error(errorData.message || `HTTP ${response.status}`);
  }
  
  const text = await response.text();
  return text ? JSON.parse(text) : {};
};

// API wrapper con fetch
const api = {
  get: async (url) => {
    const headers = await getHeaders();
    const response = await fetch(`${API_URL}${url}`, {
      method: 'GET',
      headers,
    });
    return { data: await handleResponse(response) };
  },
  
  post: async (url, data) => {
    const headers = await getHeaders();
    const response = await fetch(`${API_URL}${url}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    return { data: await handleResponse(response) };
  },
  
  put: async (url, data) => {
    const headers = await getHeaders();
    const response = await fetch(`${API_URL}${url}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });
    return { data: await handleResponse(response) };
  },
  
  delete: async (url) => {
    const headers = await getHeaders();
    const response = await fetch(`${API_URL}${url}`, {
      method: 'DELETE',
      headers,
    });
    return { data: await handleResponse(response) };
  },

  patch: async (url, data = null) => {
    const headers = await getHeaders();
    const response = await fetch(`${API_URL}${url}`, {
      method: 'PATCH',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });
    return { data: await handleResponse(response) };
  },
};

// API multipart para uploads
const apiMultipart = {
  post: async (url, formData) => {
    const token = await AsyncStorage.getItem('token');
    const headers = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_URL}${url}`, {
      method: 'POST',
      headers,
      body: formData,
    });
    return { data: await handleResponse(response) };
  },
};

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  googleLogin: (idToken) => api.post('/auth/google', { idToken }),
  googleStartUrl: () => 'https://io.twittetec.com/api/auth/google/start',
  googleExchangeCode: (code, state) => api.post('/auth/google/exchange', { code, state }),
  verifyEmail: (token, uid) => api.get(`/auth/verify-email?token=${token}&uid=${uid}`)
};

export const statusAPI = {
  getAll: () => api.get('/status'),
  getById: (statusId) => api.get(`/status/${statusId}`),
  create: (data) => api.post('/status', data),
  delete: (id) => api.delete(`/status/${id}`),
  getByUser: (userId) => api.get(`/users/${userId}/statuses`),
  toggleLike: (id) => api.post(`/status/${id}/like`),
  toggleRepost: (id) => api.post(`/status/${id}/repost`)
};

export const repliesAPI = {
  getByStatus: (statusId) => api.get(`/status/${statusId}/replies`),
  create: (parentStatusId, content, mediaUrl = null) => api.post(`/status`, {
    parentStatusId,
    content,
    mediaUrl
  }),
  delete: (statusId) => api.delete(`/status/${statusId}`),
  toggleLike: (id) => api.post(`/status/${id}/like`),
  toggleRepost: (id) => api.post(`/status/${id}/repost`)
};

export const mediaAPI = {
  upload: (formDataOrFile, prefix = null) => {
    let formData;
    
    // Si ya es un FormData, usarlo directamente
    if (formDataOrFile instanceof FormData) {
      formData = formDataOrFile;
      if (prefix) formData.append('prefix', prefix);
    } else {
      // Si es un archivo, crear FormData con formato correcto para Android
      formData = new FormData();
      
      // Normalizar el objeto file para React Native
      const file = {
        uri: formDataOrFile.uri,
        type: formDataOrFile.type || formDataOrFile.mimeType || 'image/jpeg',
        name: formDataOrFile.name || formDataOrFile.fileName || `upload_${Date.now()}.jpg`,
      };
      
      console.log('📤 Preparando upload:', { 
        uri: file.uri, 
        type: file.type, 
        name: file.name, 
        prefix,
        platform: Platform.OS 
      });
      
      formData.append('file', file);
      if (prefix) formData.append('prefix', prefix);
    }
    
    return apiMultipart.post('/media/upload', formData);
  }
};

export const usersAPI = {
  getById: (userId) => api.get(`/users/${userId}`),
  getLikes: (userId) => api.get(`/users/${userId}/likes`),
  getReplies: (userId) => api.get(`/users/${userId}/replies`),
  updateProfilePicture: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiMultipart.post('/users/me/profile-picture', formData);
  }
};

export const followersAPI = {
  getFollowStatus: (userId) => api.get(`/users/followers/${userId}/status`),
  toggleFollow: (userId) => api.post(`/users/followers/${userId}`),
  getMutualFollowers: (userId) => api.get(`/users/followers/${userId}/mutual`)
};

export const notificationsAPI = {
  getAll: () => api.get('/notifications'),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all')
};

export const pushAPI = {
  // Web Push (para PWA)
  getPublicKey: () => api.get('/push/public-key'),
  subscribe: (subscription) => api.post('/push/subscribe', subscription),
  unsubscribe: (subscription) => api.post('/push/unsubscribe', subscription),
  unsubscribeAll: () => api.delete('/push/unsubscribe-all'),
  getSubscriptions: () => api.get('/push/subscriptions'),
  
  // Expo Push (para React Native)
  registerExpoToken: (token, deviceInfo = {}) => 
    api.post('/push/expo/register', {
      token,
      deviceType: deviceInfo.deviceType || Platform.OS,
      deviceName: deviceInfo.deviceName || 'Unknown Device'
    }),
  unregisterExpoToken: (token) => api.delete('/push/expo/unregister', { data: { token } }),
  testExpoPush: () => api.post('/push/expo/test')
};

export const adminAPI = {
  getAllUsers: () => api.get('/users'),
  banUser: (userId) => api.put(`/users/${userId}/ban`, { userId }),
  deleteUser: (userId) => api.delete(`/users/${userId}`)
};

export const interestSignalsAPI = {
  record: async (data) => {
    console.log('🔍 [DEBUG] interestSignalsAPI.record llamado con data:', data);
    
    try {
      const response = await api.post('/interestsignals', data);
      console.log('✅ Señal registrada:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Error al registrar señal:', error.response?.data || error.message);
      console.error('   Status code:', error.response?.status);
      console.error('   Request data:', data);
      throw error;
    }
  },
  getStatusAnalytics: (statusId) => api.get(`/interestsignals/status/${statusId}/analytics`)
};

export default api;
