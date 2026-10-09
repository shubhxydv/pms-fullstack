// HTTP handlers for auth endpoints. Web gets the refresh token as an httpOnly cookie; mobile gets it in the JSON body.
import type { Request, Response } from 'express';
import { clientTypeSchema, type ClientType, type LoginInput, type RegisterInput } from '@pms/shared';
import * as authService from './auth.service.js';
import { AppError } from '../../lib/errors.js';
import { env } from '../../config/env.js';

const REFRESH_COOKIE_NAME = 'refreshToken';
const REFRESH_COOKIE_PATH = '/api/auth';
const REFRESH_COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

// Reads/validates the X-Client header
function getClientType(req: Request): ClientType {
  const parsed = clientTypeSchema.safeParse(req.headers['x-client']);
  if (!parsed.success) {
    throw AppError.validation('Missing or invalid X-Client header (expected "web" or "mobile")');
  }
  return parsed.data;
}

// Pulls IP/user-agent for session records
function getSessionMeta(req: Request) {
  return { ip: req.ip, userAgent: req.headers['user-agent'] };
}

// Sets the httpOnly refresh-token cookie
function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.IS_PRODUCTION,
    sameSite: 'lax',
    path: REFRESH_COOKIE_PATH,
    maxAge: REFRESH_COOKIE_MAX_AGE_MS,
  });
}

// Clears the refresh-token cookie on logout
function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, { path: REFRESH_COOKIE_PATH });
}

// Sends tokens back per client type
function sendAuthResult(
  req: Request,
  res: Response,
  status: number,
  result: authService.AuthResult,
): void {
  const clientType = getClientType(req);
  if (clientType === 'web') {
    setRefreshCookie(res, result.refreshToken);
    res.status(status).json({ user: result.user, accessToken: result.accessToken });
  } else {
    res
      .status(status)
      .json({ user: result.user, accessToken: result.accessToken, refreshToken: result.refreshToken });
  }
}

// Handles new account registration
export async function registerHandler(req: Request, res: Response): Promise<void> {
  const input = req.body as RegisterInput;
  const result = await authService.register(input, getSessionMeta(req));
  sendAuthResult(req, res, 201, result);
}

// Handles email/password login
export async function loginHandler(req: Request, res: Response): Promise<void> {
  const input = req.body as LoginInput;
  const result = await authService.login(input, getSessionMeta(req));
  sendAuthResult(req, res, 200, result);
}

// Reads refresh token and rotates session
export async function refreshHandler(req: Request, res: Response): Promise<void> {
  const clientType = getClientType(req);
  const rawToken: unknown =
    clientType === 'web' ? req.cookies?.[REFRESH_COOKIE_NAME] : req.body?.refreshToken;

  if (typeof rawToken !== 'string' || rawToken.length === 0) {
    throw AppError.unauthenticated('Refresh token is missing');
  }

  const result = await authService.refresh(rawToken, getSessionMeta(req));
  sendAuthResult(req, res, 200, result);
}

// Revokes the current session
export async function logoutHandler(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw AppError.unauthenticated();
  }
  await authService.logout(req.user.id, req.user.sessionId, getSessionMeta(req));
  clearRefreshCookie(res);
  res.status(204).send();
}

// Returns the current authenticated user
export async function meHandler(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw AppError.unauthenticated();
  }
  const user = await authService.getMe(req.user.id);
  res.status(200).json({ user });
}
