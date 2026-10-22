import axios from 'axios';
import { toast } from '@/components/Toast';

const baseURL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:5000/api";

function getApiErrorMessage(error: any) {
  const message = error?.response?.data?.message;
  if (Array.isArray(message)) return message.join(" ");
  if (typeof message === "string" && message.trim()) return message;
  if (typeof error?.response?.data?.error === "string") return error.response.data.error;
  if (error?.response?.status) return `Request failed (${error.response.status}). Please try again.`;
  return "Network error. Check your connection and try again.";
}

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
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
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

    // GET requests often fail outside a page mutation handler. Show the
    // backend's exact message instead of leaving the user with console-only
    // feedback. Mutation pages already show their own contextual toast.
    if (typeof window !== 'undefined' && originalRequest?.method?.toLowerCase() === 'get') {
      toast.error(getApiErrorMessage(error), { title: 'Request Failed' });
    }
    
    return Promise.reject(error);
  }
);
