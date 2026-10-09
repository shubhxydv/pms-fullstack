// HTTP handlers for admin-only endpoints: listing all users and viewing audit logs.
import type { Request, Response } from 'express';
import type { PaginationQuery } from '@pms/shared';
import * as adminService from './admin.service.js';

// Returns a paginated list of all users
export async function listUsersHandler(req: Request, res: Response): Promise<void> {
  const result = await adminService.listUsers(req.query as unknown as PaginationQuery);
  res.status(200).json(result);
}

// Returns a paginated list of audit logs
export async function listAuditLogsHandler(req: Request, res: Response): Promise<void> {
  const result = await adminService.listAuditLogs(req.query as unknown as PaginationQuery);
  res.status(200).json(result);
}
