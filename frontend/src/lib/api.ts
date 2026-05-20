import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  timeout: 60000,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('cpx_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('cpx_token');
      localStorage.removeItem('cpx_user');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data: any) => api.put('/auth/profile', data),
  changePassword: (data: any) => api.put('/auth/change-password', data),
  toggleFavorite: (stationId: string) => api.post(`/auth/favorites/${stationId}`),
  getFavorites: () => api.get('/auth/favorites'),
};

// Stations
export const stationAPI = {
  getAll: (params?: any) => api.get('/stations', { params }),
  getNearby: (params: any) => api.get('/stations/nearby', { params }),
  getOne: (id: string) => api.get(`/stations/${id}`),
  create: (data: FormData | any) => api.post('/stations', data),
  update: (id: string, data: FormData | any) => api.put(`/stations/${id}`, data),
  delete: (id: string) => api.delete(`/stations/${id}`),
  addReview: (id: string, data: any) => api.post(`/stations/${id}/reviews`, data),
  getGlobalReviews: () => api.get('/stations/reviews/all'),
};

// Bookings
export const bookingAPI = {
  create: (data: any) => api.post('/bookings', data),
  getMy: (params?: any) => api.get('/bookings/my', { params }),
  getAll: (params?: any) => api.get('/bookings/all', { params }),
  getOne: (id: string) => api.get(`/bookings/${id}`),
  cancel: (id: string, reason?: string) => api.put(`/bookings/${id}/cancel`, { reason }),
  startWithPin: (pin: string) => api.put('/bookings/start-with-pin', { pin }),
};

// Payments
export const paymentAPI = {
  createOrder: (bookingId: string) => api.post('/payments/create-order', { bookingId }),
  verify: (data: any) => api.post('/payments/verify', data),
  payCash: (bookingId: string) => api.post('/payments/pay-cash', { bookingId }),
  getHistory: () => api.get('/payments/history'),
};

// Notifications
export const notifAPI = {
  getAll: () => api.get('/notifications'),
  markRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
};

// Admin
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getRevenue: (params?: any) => api.get('/admin/analytics/revenue', { params }),
  getUsers: (params?: any) => api.get('/admin/users', { params }),
  toggleUser: (id: string) => api.put(`/admin/users/${id}/toggle`),
  createMaintenance: (data: any) => api.post('/admin/maintenance', data),
  getMaintenance: (params?: any) => api.get('/admin/maintenance', { params }),
};

// Mechanic
export const mechanicAPI = {
  create: (data: any) => api.post('/mechanics', data),
  getRequests: () => api.get('/mechanics'),
  updateStatus: (id: string, status: string, cost?: number) => api.put(`/mechanics/${id}/status`, { status, cost }),
};

export default api;
