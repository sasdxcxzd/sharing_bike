/**
 * Axios instance with interceptors.
 * - Attaches JWT Bearer token to every request
 * - Redirects to /login on 401 responses
 * - Base URL: /api/v1 (proxied via Vite dev server or nginx)
 */
import axios from 'axios';

const request = axios.create({
  baseURL: '/api/v1',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: attach token
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('bike_admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401
request.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('bike_admin_token');
      localStorage.removeItem('bike_admin_info');
      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error.response?.data || { code: 500, message: 'Network error' });
  }
);

export default request;
