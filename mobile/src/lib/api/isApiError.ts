import { isAxiosError, type AxiosError } from 'axios';
import type { ErrorEnvelope } from '@pms/shared';

// Helpers for turning a caught request error into a user-facing message.
// Checks if an error is an API error
export function isApiError(error: unknown): error is AxiosError<ErrorEnvelope> {
  return isAxiosError(error) && Boolean(error.response?.data?.error);
}

// Picks a display message for an error
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (isApiError(error) && error.response) {
    return error.response.data.error.message;
  }
  if (isAxiosError(error) && !error.response) {
    return 'No internet connection. Check your network and try again.';
  }
  return fallback;
}
