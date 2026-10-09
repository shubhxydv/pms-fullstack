// Catch-all handler for requests that don't match any route; returns a 404 JSON error.
import type { Request, Response } from 'express';
import { AppError } from '../lib/errors.js';

// Responds 404 for any unmatched route
export function notFound(req: Request, res: Response): void {
  const error = AppError.notFound(`Route not found: ${req.method} ${req.path}`);
  res.status(error.status).json({ error: { code: error.code, message: error.message } });
}
