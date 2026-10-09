// Middleware factory that restricts a route to users with one of the given roles (e.g. ADMIN).
import type { NextFunction, Request, Response } from 'express';
import type { Role } from '@pms/shared';
import { AppError } from '../lib/errors.js';

// Builds middleware that checks req.user.role
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(AppError.unauthenticated());
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(AppError.forbidden());
      return;
    }
    next();
  };
}
