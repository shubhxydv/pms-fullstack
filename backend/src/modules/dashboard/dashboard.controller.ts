import type { Request, Response } from 'express';
import * as dashboardService from './dashboard.service.js';
import { AppError } from '../../lib/errors.js';

export async function getHandler(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthenticated();
  const summary = await dashboardService.getDashboard(req.user.id);
  res.status(200).json({ data: summary });
}
