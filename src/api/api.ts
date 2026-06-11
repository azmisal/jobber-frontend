import { tokenStore } from "../lib/tokenStore";
import axios, { AxiosInstance } from "axios";
import { triggerLogout } from "../events/AuthEvents";

export const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});


export const createApiClient = (
  accessToken: string | null
): AxiosInstance => {
  const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL ?? "",
    withCredentials: true,
    headers: {
      "Content-Type": "application/json",
    },
  });

// ---------------------- REQUEST INTERCEPTOR ----------------------
api.interceptors.request.use((config) => {
  const token = tokenStore().getToken();
  const isRefreshCall = config.url?.includes('/refresh');
  // Attach token ONLY if not refresh call
  
  if (token && !isRefreshCall) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ---------------------- REFRESH QUEUE HANDLING ----------------------
let isRefreshing = false;

let failedQueue: {
  resolve: (token: string) => void;
  reject: (err: any) => void;
}[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token!);
  });

  failedQueue = [];
};

// ---------------------- RESPONSE INTERCEPTOR ----------------------
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    const isRefreshCall = originalRequest.url?.includes(
      '/refresh'
    );

    // If refresh fails → logout
    if (error.response?.status === 401 && isRefreshCall) {
      tokenStore().clearToken();
      triggerLogout();
      return Promise.reject(error);
    }

    // Handle normal 401 token expiry
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            },
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshResponse = await api.post(
          '/auth/refresh',
          {},
          { withCredentials: true }
        );

        const newToken = refreshResponse.data.accessToken;
        tokenStore().setToken(newToken);
        api.defaults.headers.common.Authorization = `Bearer ${newToken}`;

        processQueue(null, newToken);

        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);
        tokenStore().clearToken();
        triggerLogout();
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
  return api;
};