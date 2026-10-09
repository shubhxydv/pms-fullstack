// Dashboard route: a single authenticated GET endpoint.
import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import * as dashboardController from './dashboard.controller.js';

export const dashboardRouter = Router();

dashboardRouter.get('/', requireAuth, dashboardController.getHandler);
