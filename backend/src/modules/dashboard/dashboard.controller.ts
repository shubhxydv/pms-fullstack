// HTTP handler for the per-user dashboard summary endpoint.
import type { Request, Response } from 'express';
import * as dashboardService from './dashboard.service.js';
import { AppError } from '../../lib/errors.js';

// Returns the current user's dashboard summary
export async function getHandler(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthenticated();
  const summary = await dashboardService.getDashboard(req.user.id);
  res.status(200).json({ data: summary });
}
