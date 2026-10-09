// Helpers for detecting and reading the backend's standard error shape.
import { isAxiosError, type AxiosError } from 'axios';
import type { ErrorEnvelope } from '@pms/shared';

// Checks if error is from API
export function isApiError(error: unknown): error is AxiosError<ErrorEnvelope> {
  return isAxiosError(error) && Boolean(error.response?.data?.error);
}

// Extracts a user-facing error message
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (isApiError(error) && error.response) {
    return error.response.data.error.message;
  }
  return fallback;
}
