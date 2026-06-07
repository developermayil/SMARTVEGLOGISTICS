import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({ baseURL: `${API_URL}/api` });

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = Cookies.get('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Redirect to login on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      Cookies.remove('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const authAPI = {
  login: (data: { username: string; password: string }) => api.post('/auth/login', data),
  register: (data: { username: string; email: string; password: string }) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/profile'),
};

// Dashboard
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
};

// Stocks
export const stocksAPI = {
  getAll: () => api.get('/stocks'),
  getSummary: () => api.get('/stocks/summary'),
  getById: (id: number) => api.get(`/stocks/${id}`),
  create: (data: any) => api.post('/stocks', data),
  update: (id: number, data: any) => api.put(`/stocks/${id}`, data),
  delete: (id: number) => api.delete(`/stocks/${id}`),
};

// Farmers
export const farmersAPI = {
  getAll: () => api.get('/farmers'),
  getById: (id: number) => api.get(`/farmers/${id}`),
  create: (data: any) => api.post('/farmers', data),
  update: (id: number, data: any) => api.put(`/farmers/${id}`, data),
  delete: (id: number) => api.delete(`/farmers/${id}`),
};

// Vehicles
export const vehiclesAPI = {
  getAll: () => api.get('/vehicles'),
  getAvailable: () => api.get('/vehicles/available'),
  getById: (id: number) => api.get(`/vehicles/${id}`),
  create: (data: any) => api.post('/vehicles', data),
  update: (id: number, data: any) => api.put(`/vehicles/${id}`, data),
  delete: (id: number) => api.delete(`/vehicles/${id}`),
};

// Deliveries
export const deliveriesAPI = {
  getAll: () => api.get('/deliveries'),
  getById: (id: number) => api.get(`/deliveries/${id}`),
  create: (data: any) => api.post('/deliveries', {
  ...data,
  latitude: Number(data.latitude),
  longitude: Number(data.longitude),
}),
  updateStatus: (id: number, data: any) => api.patch(`/deliveries/${id}/status`, data),
  delete: (id: number) => api.delete(`/deliveries/${id}`),
};

// Customers API
export const customersAPI = {
  getAll: () => api.get('/customers'),
  getById: (id: string) => api.get(`/customers/${id}`),
  create: (data: any) => api.post('/customers', data),
  update: (id: string, data: any) => api.put(`/customers/${id}`, data),
  delete: (id: string) => api.delete(`/customers/${id}`),
};

// Orders API
export const ordersAPI = {
  getAll: () => api.get('/orders'),
  getById: (id: string) => api.get(`/orders/${id}`),
  create: (data: any) => api.post('/orders', data),
  update: (id: string, data: any) => api.put(`/orders/${id}`, data),
  delete: (id: string) => api.delete(`/orders/${id}`),
};

export default api;
