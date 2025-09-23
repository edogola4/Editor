import axios, { AxiosInstance, AxiosResponse } from 'axios';

// Create axios instance with default configuration
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for authentication
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
  (response: AxiosResponse) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const apiEndpoints = {
  // Health check
  health: () => api.get('/health'),

  // Authentication
  auth: {
    register: (data: { username: string; email: string; password: string }) =>
      api.post('/api/auth/register', data),

    login: (data: { username: string; password: string }) =>
      api.post('/api/auth/login', data),

    profile: () => api.get('/api/auth/profile'),
  },

  // User management
  users: {
    getAll: () => api.get('/api/users'),
    getById: (id: string) => api.get(`/api/users/${id}`),
    update: (id: string, data: any) => api.put(`/api/users/${id}`, data),
    delete: (id: string) => api.delete(`/api/users/${id}`),
  },

  // Room management
  rooms: {
    getAll: () => api.get('/api/rooms'),
    create: (data: any) => api.post('/api/rooms', data),
    getById: (id: string) => api.get(`/api/rooms/${id}`),
    update: (id: string, data: any) => api.put(`/api/rooms/${id}`, data),
    delete: (id: string) => api.delete(`/api/rooms/${id}`),

    // Room users
    getUsers: (roomId: string) => api.get(`/api/rooms/${roomId}/users`),
    addUser: (roomId: string, userId: string) =>
      api.post(`/api/rooms/${roomId}/users`, { userId }),
    removeUser: (roomId: string, userId: string) =>
      api.delete(`/api/rooms/${roomId}/users/${userId}`),
  },

  // Document management
  documents: {
    getAll: () => api.get('/api/documents'),
    create: (data: any) => api.post('/api/documents', data),
    getById: (id: string) => api.get(`/api/documents/${id}`),
    update: (id: string, data: any) => api.put(`/api/documents/${id}`, data),
    delete: (id: string) => api.delete(`/api/documents/${id}`),

    // Document content
    getContent: (id: string) => api.get(`/api/documents/${id}/content`),
    updateContent: (id: string, content: string) =>
      api.put(`/api/documents/${id}/content`, { content }),
  },
};

// Types for API responses
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    username: string;
    email: string;
    role: string;
  };
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export interface Room {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: string;
  title: string;
  content: string;
  language: string;
  roomId?: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export default api;
