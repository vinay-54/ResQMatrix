import axios from 'axios';

const api = axios.create({
  baseURL:  import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout:  10000,
  headers:  { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const stored = localStorage.getItem('idms-auth');
  const token  = stored ? JSON.parse(stored)?.state?.token : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('idms-auth');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
