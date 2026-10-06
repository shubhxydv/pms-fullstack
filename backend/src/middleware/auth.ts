import type { NextFunction, Request, Response } from 'express';
import type { Role } from '@pms/shared';
import jwt from 'jsonwebtoken';
import { verifyAccessToken } from '../lib/jwt.js';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../lib/errors.js';

export interface AuthenticatedUser {
  id: string;
  role: Role;
  sessionId: string;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthenticatedUser;
  }
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    next(AppError.unauthenticated());
    return;
  }

  const token = header.slice('Bearer '.length);

  try {
    const payload = verifyAccessToken(token);

    const session = await prisma.session.findUnique({
      where: { id: payload.sid },
      select: { revokedAt: true, userId: true },
    });

    if (!session || session.revokedAt || session.userId !== payload.sub) {
      next(AppError.unauthenticated('Session is no longer valid'));
      return;
    }

    req.user = { id: payload.sub, role: payload.role, sessionId: payload.sid };
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      next(AppError.tokenExpired());
      return;
    }
    next(AppError.unauthenticated('Invalid access token'));
  }
}
