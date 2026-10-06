import { AxiosError } from 'axios';
import { isApiError, getApiErrorMessage } from '../src/lib/api/isApiError';

function makeAxiosError(overrides: Partial<AxiosError> = {}): AxiosError {
  const error = new AxiosError('Request failed');
  Object.assign(error, overrides);
  return error;
}

describe('isApiError', () => {
  it('recognizes an axios error carrying our error envelope', () => {
    const error = makeAxiosError({
      response: {
        data: { error: { code: 'VALIDATION_ERROR', message: 'Bad input' } },
        status: 400,
        statusText: 'Bad Request',
        headers: {},
        config: {} as never,
      },
    });
    expect(isApiError(error)).toBe(true);
  });

  it('rejects a plain error', () => {
    expect(isApiError(new Error('oops'))).toBe(false);
  });

  it('rejects an axios error with no response (network failure)', () => {
    expect(isApiError(makeAxiosError())).toBe(false);
  });
});

describe('getApiErrorMessage', () => {
  it('returns the server message when the error envelope is present', () => {
    const error = makeAxiosError({
      response: {
        data: { error: { code: 'UNAUTHENTICATED', message: 'Invalid email or password' } },
        status: 401,
        statusText: 'Unauthorized',
        headers: {},
        config: {} as never,
      },
    });
    expect(getApiErrorMessage(error, 'fallback')).toBe('Invalid email or password');
  });

  it('returns a network-specific message when there is no response at all', () => {
    expect(getApiErrorMessage(makeAxiosError(), 'fallback')).toBe(
      'No internet connection. Check your network and try again.',
    );
  });

  it('falls back for a non-axios error', () => {
    expect(getApiErrorMessage(new Error('weird'), 'fallback')).toBe('fallback');
  });
});
