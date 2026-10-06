import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env.js';
import { AppError } from '../lib/errors.js';

export function requireCronSecret(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined;

  if (!token || token !== env.CRON_SECRET) {
    next(AppError.unauthenticated('Invalid or missing cron secret'));
    return;
  }
  next();
}
