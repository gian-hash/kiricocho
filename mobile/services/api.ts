import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Cambia con il tuo IP locale o URL di produzione
const BASE_URL = 'https://kiricocho-production.up.railway.app/api';

const api = axios.create({ baseURL: BASE_URL, timeout: 10000 });

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      await SecureStore.deleteItemAsync('token');
    }
    return Promise.reject(err);
  }
);

// Auth
export const authAPI = {
  register: (data: { nome: string; cognome: string; email: string; telefono: string; password: string }) =>
    api.post('/auth/register', data),
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
};

// Prenotazioni
export const bookingsAPI = {
  availability: (date: string) => api.get(`/bookings/availability?date=${date}`),
  create: (data: { date: string; timeSlot: string; teamName?: string; notes?: string }) =>
    api.post('/bookings', data),
  myBookings: () => api.get('/bookings/my'),
  cancel: (id: string) => api.delete(`/bookings/${id}`),
  complete: (id: string) => api.post(`/bookings/${id}/complete`),
};

// Post / Bacheca
export const postsAPI = {
  list: (page = 1) => api.get(`/posts?page=${page}`),
  create: (formData: FormData) =>
    api.post('/posts', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  like: (id: string) => api.post(`/posts/${id}/like`),
  comment: (id: string, text: string) => api.post(`/posts/${id}/comment`, { text }),
  delete: (id: string) => api.delete(`/posts/${id}`),
  pin: (id: string) => api.patch(`/posts/${id}/pin`),
};

// Utente
export const usersAPI = {
  profile: () => api.get('/users/profile'),
  updateProfile: (formData: FormData) =>
    api.patch('/users/profile', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.patch('/users/password', { currentPassword, newPassword }),
};

// Admin
export const adminAPI = {
  slots: () => api.get('/admin/slots'),
  blockSlot: (slot: string, date?: string, reason?: string) =>
    api.post('/admin/slots/block', { slot, date, reason }),
  unblockSlot: (id: string) => api.delete(`/admin/slots/block/${id}`),
  allBookings: (date?: string) => api.get(`/admin/bookings${date ? `?date=${date}` : ''}`),
  bookForUser: (data: { userId: string; date: string; timeSlot: string; teamName?: string; notes?: string }) =>
    api.post('/admin/bookings', data),
  cancelBooking: (id: string) => api.delete(`/admin/bookings/${id}`),
  users: () => api.get('/admin/users'),
  setRole: (id: string, role: string) => api.patch(`/admin/users/${id}/role`, { role }),
  toggleUser: (id: string) => api.patch(`/admin/users/${id}/toggle`),
  stats: () => api.get('/admin/stats'),
};

export default api;
