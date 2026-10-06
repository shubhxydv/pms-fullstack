import type { Request, Response } from 'express';
import type { PaginationQuery } from '@pms/shared';
import * as adminService from './admin.service.js';

export async function listUsersHandler(req: Request, res: Response): Promise<void> {
  const result = await adminService.listUsers(req.query as unknown as PaginationQuery);
  res.status(200).json(result);
}

export async function listAuditLogsHandler(req: Request, res: Response): Promise<void> {
  const result = await adminService.listAuditLogs(req.query as unknown as PaginationQuery);
  res.status(200).json(result);
}
