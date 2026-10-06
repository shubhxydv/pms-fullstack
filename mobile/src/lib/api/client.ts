import axios, { type InternalAxiosRequestConfig, type AxiosError } from 'axios';
import type { ErrorEnvelope } from '@pms/shared';
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from './tokenStore';

export const SESSION_EXPIRED_MESSAGE = 'Your session expired. Please sign in again.';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://pms-backend-qiir.onrender.com/api';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'X-Client': 'mobile',
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
let onForcedLogout: (() => void) | null = null;

export function setForcedLogoutHandler(handler: () => void): void {
  onForcedLogout = handler;
}

async function refreshAccessToken(): Promise<string> {
  const currentRefreshToken = getRefreshToken();
  if (!currentRefreshToken) {
    throw new Error('No refresh token available');
  }
  const response = await axios.post<{ accessToken: string; refreshToken: string }>(
    `${API_URL}/auth/refresh`,
    { refreshToken: currentRefreshToken },
    { headers: { 'X-Client': 'mobile' } },
  );
  await setTokens(response.data.accessToken, response.data.refreshToken);
  return response.data.accessToken;
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
      config.headers.set('Authorization', `Bearer ${newToken}`);
      return apiClient(config);
    } catch (refreshError) {
      await clearTokens();
      onForcedLogout?.();
      return Promise.reject(refreshError);
    } finally {
      refreshPromise = null;
    }
  },
);
