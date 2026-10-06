import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../lib/errors.js';

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
