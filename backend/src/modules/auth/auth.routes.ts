// Auth routes: register, login, refresh, logout, me — with rate limiting on the sensitive ones.
import { Router } from 'express';
import { registerSchema, loginSchema } from '@pms/shared';
import { validate } from '../../middleware/validate.js';
import { requireAuth } from '../../middleware/auth.js';
import {
  createLoginRateLimit,
  createRegisterRateLimit,
  createRefreshRateLimit,
} from '../../middleware/rateLimit.js';
import * as authController from './auth.controller.js';

// Builds and returns the auth router
export function createAuthRouter(): Router {
  const authRouter = Router();

  authRouter.post(
    '/register',
    createRegisterRateLimit(),
    validate({ body: registerSchema }),
    authController.registerHandler,
  );

  authRouter.post(
    '/login',
    createLoginRateLimit(),
    validate({ body: loginSchema }),
    authController.loginHandler,
  );

  authRouter.post('/refresh', createRefreshRateLimit(), authController.refreshHandler);

  authRouter.post('/logout', requireAuth, authController.logoutHandler);

  authRouter.get('/me', requireAuth, authController.meHandler);

  return authRouter;
}
