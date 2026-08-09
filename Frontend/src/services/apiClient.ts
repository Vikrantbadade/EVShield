import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
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

// Global response interceptor for standardizing error objects
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorMsg =
      error.response?.data?.error?.message ||
      error.message ||
      'Unable to connect to EVShield Security API.';

    return Promise.reject(new Error(errorMsg));
  }
);
