const getApiUrl = () => {
  let url;

  if (import.meta.env.VITE_API_URL) {
    url = import.meta.env.VITE_API_URL;
  } else if (
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ) {
    url = 'http://localhost:3000';
  } else {
    url = 'https://backend-server-ai.onrender.com';
  }

  url = url.replace(/\/+$/, '');
  if (!url.endsWith('/api')) {
    url = `${url}/api`;
  }
  return url;
};

export const apiBaseUrl = getApiUrl();

export function buildEndpoint(endpoint) {
  return endpoint ? `/${String(endpoint).replace(/^\/+/, '')}` : '';
}

export default {
  apiBaseUrl,
  buildEndpoint,
};
