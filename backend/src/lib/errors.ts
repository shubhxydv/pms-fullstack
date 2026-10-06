import type { ErrorCode, ErrorDetail } from '@pms/shared';

const STATUS_BY_CODE: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHENTICATED: 401,
  TOKEN_EXPIRED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  INTERNAL: 500,
};

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details?: ErrorDetail[];

  constructor(code: ErrorCode, message: string, details?: ErrorDetail[]) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = STATUS_BY_CODE[code];
    this.details = details;
  }

  static validation(message: string, details?: ErrorDetail[]): AppError {
    return new AppError('VALIDATION_ERROR', message, details);
  }

  static unauthenticated(message = 'Authentication required'): AppError {
    return new AppError('UNAUTHENTICATED', message);
  }

  static tokenExpired(message = 'Access token expired'): AppError {
    return new AppError('TOKEN_EXPIRED', message);
  }

  static forbidden(message = 'You do not have access to this resource'): AppError {
    return new AppError('FORBIDDEN', message);
  }

  static notFound(message = 'Resource not found'): AppError {
    return new AppError('NOT_FOUND', message);
  }

  static conflict(message: string): AppError {
    return new AppError('CONFLICT', message);
  }

  static rateLimited(message = 'Too many requests'): AppError {
    return new AppError('RATE_LIMITED', message);
  }

  static internal(message = 'Internal server error'): AppError {
    return new AppError('INTERNAL', message);
  }
}
