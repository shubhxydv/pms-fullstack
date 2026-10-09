// API calls for the admin screens: audit log and user listing.
import type { ListResponse } from '@pms/shared';
import { apiClient } from '../../lib/api/client';
import type { AdminUserDto, AuditLogDto } from './types';

// Fetches a page of audit logs
export async function listAuditLogs(page: number, pageSize: number): Promise<ListResponse<AuditLogDto>> {
  const res = await apiClient.get<ListResponse<AuditLogDto>>('/admin/audit-logs', {
    params: { page, pageSize },
  });
  return res.data;
}

// Fetches a page of users
export async function listUsers(page: number, pageSize: number): Promise<ListResponse<AdminUserDto>> {
  const res = await apiClient.get<ListResponse<AdminUserDto>>('/admin/users', {
    params: { page, pageSize },
  });
  return res.data;
}
