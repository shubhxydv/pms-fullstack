import { isAxiosError, type AxiosError } from 'axios';
import type { ErrorEnvelope } from '@pms/shared';

export function isApiError(error: unknown): error is AxiosError<ErrorEnvelope> {
  return isAxiosError(error) && Boolean(error.response?.data?.error);
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (isApiError(error) && error.response) {
    return error.response.data.error.message;
  }
  return fallback;
}
