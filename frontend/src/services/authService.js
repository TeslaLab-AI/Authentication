import api from './axiosInstance.js';

const apiBaseUrl = import.meta.env.VITE_API_URL

export async function login(payload) {
  const response = await api.post('auth/login', payload);
  return response.data;
}

export async function register(payload) {
  const response = await api.post('auth/register', payload);
  return response.data;
}

export async function sendOtp(email) {
  const response = await api.post('auth/send-otp', { email });
  return response.data;
}

export async function verifyOtp(email, otp) {
  const response = await api.post('auth/verify-otp', { email, otp });
  return response.data;
}

export async function forgotPassword(email) {
  const response = await api.post('auth/forgot-password', { email });
  return response.data;
}

export async function resetPassword(email, otp, newPassword) {
  const response = await api.post('auth/reset-password', { email, otp, newPassword });
  return response.data;
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
  const name = "auth_token=";
  const decodedCookie = decodeURIComponent(document.cookie);
  const ca = decodedCookie.split(';');
  for(let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return localStorage.getItem('auth_token');
}
