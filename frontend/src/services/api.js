const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:3000/api';
  }
  return 'https://backend-server-ai.onrender.com/api';
};

const baseUrl = getApiUrl();
console.log(
  "VITE_API_URL:",
  import.meta.env.VITE_API_URL
);

console.log(
  "BASE_URL:",
  baseUrl
);

async function request(endpoint, method = 'GET', body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${baseUrl}${endpoint}`, {
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
