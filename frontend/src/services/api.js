import axios from 'axios';

// Default to same-origin `/api` so it works behind Nginx/Ingress on both HTTP and HTTPS.
// Override at build-time with VITE_API_URL if deploying without a reverse-proxy.
const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Separate client for multipart/form-data uploads (avoid forcing JSON Content-Type)
const apiMultipart = axios.create({
  baseURL: API_URL
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiMultipart.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor de respuesta para manejar errores 401 y 403 (usuario baneado)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Detectar si el usuario fue baneado
    if (error.response?.status === 403 && error.response?.data?.banned === true) {
      // Limpiar sesión inmediatamente
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Mostrar mensaje y redirigir al login
      alert('Tu cuenta ha sido suspendida. Contacta al administrador.');
      window.location.href = '/login';
      
      return Promise.reject(error);
    }
    
    if (error.response?.status === 401) {
      console.warn('Request failed with 401 Unauthorized');
    }
    
    return Promise.reject(error);
  }
);

apiMultipart.interceptors.response.use(
  (response) => response,
  (error) => {
    // Detectar si el usuario fue baneado
    if (error.response?.status === 403 && error.response?.data?.banned === true) {
      // Limpiar sesión inmediatamente
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Mostrar mensaje y redirigir al login
      alert('Tu cuenta ha sido suspendida. Contacta al administrador.');
      window.location.href = '/login';
      
      return Promise.reject(error);
    }
    
    if (error.response?.status === 401) {
      console.warn('Request failed with 401 Unauthorized');
    }
    
    return Promise.reject(error);
  }
);

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
  upload: (file, prefix = null) => {
    const formData = new FormData();
    formData.append('file', file);
    if (prefix) formData.append('prefix', prefix);
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
  getPublicKey: () => api.get('/push/public-key'),
  subscribe: (subscription) => api.post('/push/subscribe', subscription),
  unsubscribe: (subscription) => api.post('/push/unsubscribe', subscription),
  unsubscribeAll: () => api.delete('/push/unsubscribe-all'),
  getSubscriptions: () => api.get('/push/subscriptions')
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