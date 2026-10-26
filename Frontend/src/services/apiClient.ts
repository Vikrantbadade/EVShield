import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface ApiResponseWrapper<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// Request interceptor to inject Authorization Bearer token from localStorage
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('evshield_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for standardizing error objects
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // If 401 Unauthorized, token might be invalid/expired
    if (error.response?.status === 401) {
      // If we are not on the login page or checking /auth/login, clean up token
      const isAuthCheck = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/signup');
      if (!isAuthCheck) {
        localStorage.removeItem('evshield_token');
        localStorage.removeItem('evshield_user');
      }
    }

    const errorMsg =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message ||
      'Unable to connect to EVShield Security API.';

    return Promise.reject(new Error(errorMsg));
  }
);
