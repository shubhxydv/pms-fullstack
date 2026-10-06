import type { RegisterTokenInput } from '@pms/shared';
import { apiClient } from '../../lib/api/client';

export async function registerToken(input: RegisterTokenInput): Promise<void> {
  await apiClient.post('/notifications/register-token', input);
}

export async function unregisterToken(token: string): Promise<void> {
  await apiClient.post('/notifications/unregister-token', { token });
}

export async function sendTestPush(): Promise<{ sent: number; total: number }> {
  const res = await apiClient.post<{ data: { sent: number; total: number } }>(
    '/notifications/test',
  );
  return res.data.data;
}
