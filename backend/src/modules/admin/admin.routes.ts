// Admin routes: everything here requires an authenticated ADMIN-role user.
import { Router } from 'express';
import { paginationQuerySchema } from '@pms/shared';
import { validate } from '../../middleware/validate.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/requireRole.js';
import * as adminController from './admin.controller.js';

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole('ADMIN'));

adminRouter.get('/users', validate({ query: paginationQuerySchema }), adminController.listUsersHandler);
adminRouter.get(
  '/audit-logs',
  validate({ query: paginationQuerySchema }),
  adminController.listAuditLogsHandler,
);
