import axios from 'axios';
import { apiBaseUrl } from './config.js';

// const getApiUrl = () => {
//   if (import.meta.env.VITE_API_URL) {
//     return import.meta.env.VITE_API_URL;
//   }
//   if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
//     return 'http://localhost:3000/api';
//   }
//   return 'https://backend-server-ai.onrender.com/api';
// };

function getTokenFromStorage() {
  try {
    const name = 'auth_token=';
    const decoded = decodeURIComponent(document.cookie || '');
    const parts = decoded.split(';');
    for (let i = 0; i < parts.length; i++) {
      let c = parts[i];
      while (c.charAt(0) === ' ') c = c.substring(1);
      if (c.indexOf(name) === 0) return c.substring(name.length, c.length);
    }
  } catch (e) {
    // ignore
  }
  return localStorage.getItem('auth_token');
}

const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});


api.interceptors.request.use((config) => {
  const token = getTokenFromStorage();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const message = error.response.data?.error || error.response.data?.message || 'An unexpected error occurred';
      return Promise.reject(new Error(message));
    }
    return Promise.reject(new Error(error.message || 'Network error'));
  }
);

export default api;
