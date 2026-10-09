// Raw API calls for login, register, logout, and session refresh.
import type { LoginInput, RegisterInput } from '@pms/shared';
import { apiClient } from '../../lib/api/client';
import { setAccessToken } from '../../lib/api/tokenStore';
import type { UserDto } from './types';

interface AuthResponse {
  user: UserDto;
  accessToken: string;
}

// Logs in, stores access token
export async function login(input: LoginInput): Promise<UserDto> {
  const res = await apiClient.post<AuthResponse>('/auth/login', input);
  setAccessToken(res.data.accessToken);
  return res.data.user;
}

// Registers, stores access token
export async function register(input: RegisterInput): Promise<UserDto> {
  const res = await apiClient.post<AuthResponse>('/auth/register', input);
  setAccessToken(res.data.accessToken);
  return res.data.user;
}

// Logs out, clears access token
export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout');
  setAccessToken(null);
}

// Fetches the current user
export async function fetchMe(): Promise<UserDto> {
  const res = await apiClient.get<{ user: UserDto }>('/auth/me');
  return res.data.user;
}

// Refreshes session on app load
export async function silentRefresh(): Promise<UserDto | null> {
  try {
    const res = await apiClient.post<AuthResponse>('/auth/refresh');
    setAccessToken(res.data.accessToken);
    return res.data.user;
  } catch {
    return null;
  }
}
