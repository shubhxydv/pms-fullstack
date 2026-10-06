import type { LoginInput, RegisterInput } from '@pms/shared';
import { apiClient } from '../../lib/api/client';
import { setAccessToken } from '../../lib/api/tokenStore';
import type { UserDto } from './types';

interface AuthResponse {
  user: UserDto;
  accessToken: string;
}

export async function login(input: LoginInput): Promise<UserDto> {
  const res = await apiClient.post<AuthResponse>('/auth/login', input);
  setAccessToken(res.data.accessToken);
  return res.data.user;
}

export async function register(input: RegisterInput): Promise<UserDto> {
  const res = await apiClient.post<AuthResponse>('/auth/register', input);
  setAccessToken(res.data.accessToken);
  return res.data.user;
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout');
  setAccessToken(null);
}

export async function fetchMe(): Promise<UserDto> {
  const res = await apiClient.get<{ user: UserDto }>('/auth/me');
  return res.data.user;
}

export async function silentRefresh(): Promise<UserDto | null> {
  try {
    const res = await apiClient.post<AuthResponse>('/auth/refresh');
    setAccessToken(res.data.accessToken);
    return res.data.user;
  } catch {
    return null;
  }
}
