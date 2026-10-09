// Express error-handling middleware: the last stop for every error, turning it into a JSON response.
import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../lib/errors.js';

/** body-parser sets `.type` on malformed-body / oversized-body errors; it isn't a dedicated class. */
function bodyParserErrorType(err: unknown): string | undefined {
  if (err && typeof err === 'object' && 'type' in err && typeof err.type === 'string') {
    return err.type;
  }
  return undefined;
}

// Maps any thrown error to a JSON response
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res
      .status(err.status)
      .json({ error: { code: err.code, message: err.message, details: err.details } });
    return;
  }

  const bodyErrorType = bodyParserErrorType(err);
  if (bodyErrorType === 'entity.parse.failed') {
    res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Request body is not valid JSON' },
    });
    return;
  }
  if (bodyErrorType === 'entity.too.large') {
    res.status(413).json({
      error: { code: 'PAYLOAD_TOO_LARGE', message: 'Request body is too large' },
    });
    return;
  }

  if (err instanceof ZodError) {
    const details = err.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));
    res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Validation failed', details },
    });
    return;
  }

  req.log?.error({ err }, 'Unhandled error');

  res.status(500).json({ error: { code: 'INTERNAL', message: 'Internal server error' } });
}
