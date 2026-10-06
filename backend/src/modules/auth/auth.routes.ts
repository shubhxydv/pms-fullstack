import { Router } from 'express';
import { registerSchema, loginSchema } from '@pms/shared';
import { validate } from '../../middleware/validate.js';
import { requireAuth } from '../../middleware/auth.js';
import { loginRateLimit, registerRateLimit, refreshRateLimit } from '../../middleware/rateLimit.js';
import * as authController from './auth.controller.js';

export const authRouter = Router();

authRouter.post(
  '/register',
  registerRateLimit,
  validate({ body: registerSchema }),
  authController.registerHandler,
);

authRouter.post('/login', loginRateLimit, validate({ body: loginSchema }), authController.loginHandler);

authRouter.post('/refresh', refreshRateLimit, authController.refreshHandler);

authRouter.post('/logout', requireAuth, authController.logoutHandler);

authRouter.get('/me', requireAuth, authController.meHandler);
