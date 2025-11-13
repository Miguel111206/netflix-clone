import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token a todas las peticiones
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

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  getStats: () => api.get('/auth/stats'),
};

// Movies API
export const moviesAPI = {
  getPopular: (page = 1) => api.get(`/movies/popular?page=${page}`),
  getTrending: () => api.get('/movies/trending'),
  getTopRated: (page = 1) => api.get(`/movies/top-rated?page=${page}`),
  getByGenre: (genreId, page = 1) => api.get(`/movies/genre/${genreId}?page=${page}`),
  search: (query, page = 1) => api.get(`/movies/search?query=${query}&page=${page}`),
  getDetails: (id) => api.get(`/movies/${id}`),
  getGenres: () => api.get('/movies/genres/list'),
};

// Favorites API
export const favoritesAPI = {
  getAll: () => api.get('/favorites'),
  add: (tmdb_id) => api.post('/favorites', { tmdb_id }),
  remove: (tmdb_id) => api.delete(`/favorites/${tmdb_id}`),
  check: (tmdb_id) => api.get(`/favorites/check/${tmdb_id}`),
  getRecommendations: (limit = 20) => api.get(`/favorites/recommendations?limit=${limit}`),
  getActivity: (limit = 50) => api.get(`/favorites/activity?limit=${limit}`),
};

export default api;
// Subscriptions API
export const subscriptionsAPI = {
  getPlans: () => api.get('/subscriptions/plans'),
  getActive: () => api.get('/subscriptions/active'),
  subscribe: (data) => api.post('/subscriptions/subscribe', data),
  cancel: (subscriptionId, immediate = false) => 
    api.post('/subscriptions/cancel', { subscription_id: subscriptionId, immediate }),
  validateCoupon: (code, planId) => 
    api.post('/subscriptions/validate-coupon', { code, plan_id: planId }),
};

// Payments API
export const paymentsAPI = {
  getMethods: () => api.get('/payments'),
  addMethod: (data) => api.post('/payments', data),
  deleteMethod: (id) => api.delete(`/payments/${id}`),
  setDefault: (id) => api.put(`/payments/${id}/default`),
  getHistory: (limit = 50) => api.get(`/payments/history?limit=${limit}`),
};

// Profiles API
export const profilesAPI = {
  getAll: () => api.get('/profiles'),
  create: (data) => api.post('/profiles', data),
  update: (id, data) => api.put(`/profiles/${id}`, data),
  delete: (id) => api.delete(`/profiles/${id}`),
  getContinueWatching: (profileId, limit = 20) => 
    api.get(`/profiles/${profileId}/continue-watching?limit=${limit}`),
  updateProgress: (profileId, data) => 
    api.post(`/profiles/${profileId}/progress`, data),
  rateMovie: (profileId, data) => 
    api.post(`/profiles/${profileId}/ratings`, data),
  getRatings: (profileId) => 
    api.get(`/profiles/${profileId}/ratings`),
};

// Notifications API
export const notificationsAPI = {
  getAll: (limit = 50) => api.get(`/notifications?limit=${limit}`),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/mark-all-read'),
};