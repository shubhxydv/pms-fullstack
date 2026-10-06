import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { ErrorEnvelope } from '@pms/shared';
import { getAccessToken, setAccessToken } from './tokenStore';

export const SESSION_EXPIRED_MESSAGE = 'Your session expired. Please sign in again.';
const SESSION_EXPIRED_STORAGE_KEY = 'pms:sessionExpiredMessage';

export const apiClient = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'X-Client': 'web',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

interface RetryableConfig extends InternalAxiosRequestConfig {
  _retried?: boolean;
}

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const response = await axios.post<{ accessToken: string }>(
    '/api/auth/refresh',
    {},
    { withCredentials: true, headers: { 'X-Client': 'web' } },
  );
  return response.data.accessToken;
}

function forceLogout(): void {
  setAccessToken(null);
  sessionStorage.setItem(SESSION_EXPIRED_STORAGE_KEY, SESSION_EXPIRED_MESSAGE);
  window.location.href = '/login';
}

export function consumeSessionExpiredMessage(): string | null {
  const message = sessionStorage.getItem(SESSION_EXPIRED_STORAGE_KEY);
  if (message) {
    sessionStorage.removeItem(SESSION_EXPIRED_STORAGE_KEY);
  }
  return message;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ErrorEnvelope>) => {
    const config = error.config as RetryableConfig | undefined;
    const code = error.response?.data?.error?.code;

    if (error.response?.status !== 401 || code !== 'TOKEN_EXPIRED' || !config || config._retried) {
      return Promise.reject(error);
    }

    config._retried = true;

    try {
      refreshPromise ??= refreshAccessToken();
      const newToken = await refreshPromise;
      setAccessToken(newToken);
      config.headers.set('Authorization', `Bearer ${newToken}`);
      return apiClient(config);
    } catch (refreshError) {
      forceLogout();
      return Promise.reject(refreshError);
    } finally {
      refreshPromise = null;
    }
  },
);
