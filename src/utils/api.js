import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: (formData) => api.post('/auth/register', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  login: (credentials) => api.post('/auth/login', credentials),
};

// User APIs
export const userAPI = {
  getAllUsers: () => api.get('/users'),
  getUser: (id) => api.get(`/users/${id}`),
  getUserStats: (id, params) => api.get(`/users/${id}/stats`, { params }),
  deleteUser: (id) => api.delete(`/users/${id}`),
};

// Prayer Log APIs
export const prayerLogAPI = {
  markPrayer: (data) => api.post('/prayer-logs', data),
  markBulkPrayers: (data) => api.post('/prayer-logs/bulk', data),
  getUserPrayerLogs: (userId, params) => api.get(`/prayer-logs/user/${userId}`, { params }),
  getTodayLogs: () => api.get('/prayer-logs/today'),
  getDateLogs: (date) => api.get(`/prayer-logs/by-date/${date}`),
};

// Prayer Times API
export const prayerTimesAPI = {
  getPrayerTimes: () => api.get('/prayer-times'),
};

export default api;
