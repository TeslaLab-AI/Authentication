import api from './axiosInstance.js';
import { apiBaseUrl } from './config.js';

export async function login(payload) {
  try {
    console.log('authService.login payload:', payload);
    const response = await api.post('auth/login', payload);
    console.log('authService.login response:', response.data);
    return response.data;
  } catch (err) {
    console.error('authService.login error response:', err.response?.data || err.message);
    throw err;
  }
}

export async function register(payload) {
  try {
    console.log('authService.register payload:', payload);
    const response = await api.post('auth/register', payload);
    console.log('authService.register response:', response.data);
    return response.data;
  } catch (err) {
    console.error('authService.register error response:', err.response?.data || err.message);
    throw err;
  }
}

export async function sendOtp(email) {
  try {
    const response = await api.post('auth/send-otp', { email });
    return response.data;
  } catch (err) {
    console.error('authService.sendOtp error response:', err.response?.data || err.message);
    throw err;
  }
}

export async function verifyOtp(email, otp) {
  try {
    const response = await api.post('auth/verify-otp', { email, otp });
    return response.data;
  } catch (err) {
    console.error('authService.verifyOtp error response:', err.response?.data || err.message);
    throw err;
  }
}

export async function forgotPassword(email) {
  try {
    const response = await api.post('auth/forgot-password', { email });
    return response.data;
  } catch (err) {
    console.error('authService.forgotPassword error response:', err.response?.data || err.message);
    throw err;
  }
}

export async function resetPassword(email, otp, newPassword) {
  try {
    const response = await api.post('auth/reset-password', { email, otp, newPassword });
    return response.data;
  } catch (err) {
    console.error('authService.resetPassword error response:', err.response?.data || err.message);
    throw err;
  }
}

export function startGithubAuth() {
  window.location.href = `${apiBaseUrl}/auth/github`;
}

export function saveToken(token) {
  localStorage.setItem('auth_token', token);
  document.cookie = `auth_token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
}

export function clearToken() {
  localStorage.removeItem('auth_token');
  document.cookie = `auth_token=; path=/; max-age=0; SameSite=Lax`;
}

export function getToken() {
  const name = 'auth_token=';
  const decodedCookie = decodeURIComponent(document.cookie);
  const ca = decodedCookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) === 0) {
      return c.substring(name.length, c.length);
    }
  }
  return localStorage.getItem('auth_token');
}