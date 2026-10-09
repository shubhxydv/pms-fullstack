// Push notification API calls: register/unregister a device token, trigger a test push.
import type { RegisterTokenInput } from '@pms/shared';
import { apiClient } from '../../lib/api/client';

// Sends this device's push token to the backend
export async function registerToken(input: RegisterTokenInput): Promise<void> {
  await apiClient.post('/notifications/register-token', input);
}

// Removes this device's push token
export async function unregisterToken(token: string): Promise<void> {
  await apiClient.post('/notifications/unregister-token', { token });
}

// Asks the backend to send a test push
export async function sendTestPush(): Promise<{ sent: number; total: number }> {
  const res = await apiClient.post<{ data: { sent: number; total: number } }>(
    '/notifications/test',
  );
  return res.data.data;
}
