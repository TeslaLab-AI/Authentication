import { apiBaseUrl } from './config.js';

const baseUrl = apiBaseUrl;

async function request(endpoint, method = 'GET', body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const cleanEndpoint = endpoint ? `/${String(endpoint).replace(/^\/+/, '')}` : '';
  const response = await fetch(`${baseUrl}${cleanEndpoint}`, {
    method,
    headers,
    credentials: 'include',
    body: body ? JSON.stringify(body) : null,
  });

  const json = await response.json();
  if (!response.ok) {
    throw new Error(json.error || 'Request failed');
  }
  return json;
}

function post(endpoint, body) {
  return request(endpoint, 'POST', body);
}

function get(endpoint, token) {
  return request(endpoint, 'GET', null, token);
}

export default {
  post,
  get,
};
