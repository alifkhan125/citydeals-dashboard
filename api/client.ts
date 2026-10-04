import axios from 'axios';
import { toast } from '@/components/Toast';

const baseURL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3004/api";

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('dashboard_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => {
    if (response.data && response.data.data !== undefined) {
      return response.data.data;
    }
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = 'Bearer ' + token;
          return apiClient(originalRequest);
        }).catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('dashboard_refresh_token') : null;
        if (!refreshToken) {
          throw new Error("No refresh token");
        }
        
        const { data } = await axios.post(baseURL + '/auth/refresh', { refreshToken });
        
        const newAccessToken = data.data?.tokens?.accessToken || data.tokens?.accessToken;
        const newRefreshToken = data.data?.tokens?.refreshToken || data.tokens?.refreshToken;
        
        if (typeof window !== 'undefined' && newAccessToken && newRefreshToken) {
          localStorage.setItem('dashboard_access_token', newAccessToken);
          localStorage.setItem('dashboard_refresh_token', newRefreshToken);
        }
        
        apiClient.defaults.headers.common['Authorization'] = 'Bearer ' + newAccessToken;
        originalRequest.headers.Authorization = 'Bearer ' + newAccessToken;
        processQueue(null, newAccessToken);
        
        return apiClient(originalRequest);
      } catch (err) {
        processQueue(err, null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('dashboard_access_token');
          localStorage.removeItem('dashboard_refresh_token');
          toast.error("Your session has expired. Please sign in again.", { title: "Session Expired" });
          window.location.href = '/';
        }
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }
    
    return Promise.reject(error);
  }
);
