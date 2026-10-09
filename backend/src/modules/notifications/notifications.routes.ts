// Notification routes: token register/unregister and test push need a user; the due-soon cron needs CRON_SECRET.
import { Router } from 'express';
import { registerTokenSchema } from '@pms/shared';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireCronSecret } from '../../middleware/requireCronSecret.js';
import * as notificationsController from './notifications.controller.js';

const unregisterSchema = z.object({ token: z.string().min(1) }).strict();

export const notificationsRouter = Router();

notificationsRouter.post(
  '/register-token',
  requireAuth,
  validate({ body: registerTokenSchema }),
  notificationsController.registerTokenHandler,
);
notificationsRouter.post(
  '/unregister-token',
  requireAuth,
  validate({ body: unregisterSchema }),
  notificationsController.unregisterTokenHandler,
);
notificationsRouter.post('/test', requireAuth, notificationsController.testPushHandler);
notificationsRouter.post(
  '/cron/due-soon',
  requireCronSecret,
  notificationsController.dueSoonCronHandler,
);
