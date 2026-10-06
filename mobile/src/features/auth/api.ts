import type { LoginInput, RegisterInput } from '@pms/shared';
import { apiClient } from '../../lib/api/client';
import { setTokens, clearTokens } from '../../lib/api/tokenStore';
import type { UserDto } from './types';

interface AuthResponse {
  user: UserDto;
  accessToken: string;
  refreshToken: string;
}

export async function login(input: LoginInput): Promise<UserDto> {
  const res = await apiClient.post<AuthResponse>('/auth/login', input);
  await setTokens(res.data.accessToken, res.data.refreshToken);
  return res.data.user;
}

export async function register(input: RegisterInput): Promise<UserDto> {
  const res = await apiClient.post<AuthResponse>('/auth/register', input);
  await setTokens(res.data.accessToken, res.data.refreshToken);
  return res.data.user;
}

export async function logout(): Promise<void> {
  try {
    await apiClient.post('/auth/logout');
  } finally {
    await clearTokens();
  }
}

export async function fetchMe(): Promise<UserDto> {
  const res = await apiClient.get<{ user: UserDto }>('/auth/me');
  return res.data.user;
}
