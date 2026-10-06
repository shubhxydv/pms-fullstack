import type { Request, Response } from 'express';
import { AppError } from '../lib/errors.js';

export function notFound(req: Request, res: Response): void {
  const error = AppError.notFound(`Route not found: ${req.method} ${req.path}`);
  res.status(error.status).json({ error: { code: error.code, message: error.message } });
}
