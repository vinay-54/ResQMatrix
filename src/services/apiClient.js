import axios from 'axios';
import useAuthStore from '../store/useAuthStore';

// Base URL from .env — points to Render backend
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor — attach JWT to every request ─────────────────────
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor — handle 401 globally ────────────────────────────
apiClient.interceptors.response.use(
  (response) => response.data, // unwrap — returns { success, data, message }
  (error) => {
    if (error.response?.status === 401) {
      // Token expired — clear auth and redirect to login
      useAuthStore.getState().clearAuth();
      window.location.href = '/login';
    }
    // Normalise error message
    const message =
      error.response?.data?.message ||
      error.message ||
      'Network error — check your connection';
    return Promise.reject(new Error(message));
  }
);

export default apiClient;

// ── API functions — one per endpoint ─────────────────────────────────────

export const sensorsAPI = {
  getAll:      (params)  => apiClient.get('/sensors', { params }),
  getOne:      (nodeId)  => apiClient.get(`/sensors/${nodeId}`),
  getReadings: (nodeId, params) => apiClient.get(`/sensors/${nodeId}/readings`, { params }),
  getSummary:  ()        => apiClient.get('/sensors/stats/summary'),
  create:      (data)    => apiClient.post('/sensors', data),
  update:      (nodeId, data) => apiClient.patch(`/sensors/${nodeId}`, data),
  remove:      (nodeId)  => apiClient.delete(`/sensors/${nodeId}`),
};

export const alertsAPI = {
  getAll:         (params) => apiClient.get('/alerts', { params }),
  getOne:         (id)     => apiClient.get(`/alerts/${id}`),
  create:         (data)   => apiClient.post('/alerts', data),
  acknowledge:    (id)     => apiClient.patch(`/alerts/${id}/acknowledge`),
  acknowledgeAll: ()       => apiClient.patch('/alerts/acknowledge-all'),
  remove:         (id)     => apiClient.delete(`/alerts/${id}`),
};

export const sosAPI = {
  create:       (data) => apiClient.post('/sos', data),
  getAll:       (params) => apiClient.get('/sos', { params }),
  getOne:       (ref)  => apiClient.get(`/sos/${ref}`),
  updateStatus: (ref, data) => apiClient.patch(`/sos/${ref}/status`, data),
};

export const operationsAPI = {
  getAll:  (params) => apiClient.get('/operations', { params }),
  getOne:  (id)     => apiClient.get(`/operations/${id}`),
  create:  (data)   => apiClient.post('/operations', data),
  update:  (id, data) => apiClient.patch(`/operations/${id}`, data),
  remove:  (id)     => apiClient.delete(`/operations/${id}`),
};

export const teamsAPI = {
  getAll:  (params) => apiClient.get('/teams', { params }),
  getOne:  (id)     => apiClient.get(`/teams/${id}`),
  create:  (data)   => apiClient.post('/teams', data),
  update:  (id, data) => apiClient.patch(`/teams/${id}`, data),
  remove:  (id)     => apiClient.delete(`/teams/${id}`),
};

export const campsAPI = {
  getAll:  (params) => apiClient.get('/camps', { params }),
  getOne:  (id)     => apiClient.get(`/camps/${id}`),
  create:  (data)   => apiClient.post('/camps', data),
  update:  (id, data) => apiClient.patch(`/camps/${id}`, data),
  remove:  (id)     => apiClient.delete(`/camps/${id}`),
};

export const dronesAPI = {
  getAll:   (params) => apiClient.get('/drones', { params }),
  getOne:   (id)     => apiClient.get(`/drones/${id}`),
  create:   (data)   => apiClient.post('/drones', data),
  update:   (id, data)  => apiClient.patch(`/drones/${id}`, data),
  remove:   (id)        => apiClient.delete(`/drones/${id}`),
  updateTelemetry: (id, data) => apiClient.patch(`/drones/${id}/telemetry`, data),
};

export const predictionAPI = {
  predictNode: (nodeId, params) => apiClient.get(`/prediction/${nodeId}`, { params }),
  predictAll:  (params) => apiClient.get('/prediction/all', { params }),
  listModels:  ()       => apiClient.get('/prediction/models'),
  health:      ()       => apiClient.get('/prediction/health'),
};

export const authAPI = {
  login:       (firebaseToken, body) => apiClient.post('/auth/login', body, {
    headers: { Authorization: `Bearer ${firebaseToken}` },
  }),
  getMe:       ()       => apiClient.get('/auth/me'),
  updateMe:    (data)   => apiClient.patch('/auth/me', data),
  refresh:     ()       => apiClient.post('/auth/refresh'),
  logout:      ()       => apiClient.post('/auth/logout'),
  listUsers:   (params) => apiClient.get('/auth/users', { params }),
  setRole:     (data)   => apiClient.patch('/auth/set-role', data),
};
