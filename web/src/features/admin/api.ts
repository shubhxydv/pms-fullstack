import type { ListResponse } from '@pms/shared';
import { apiClient } from '../../lib/api/client';
import type { AdminUserDto, AuditLogDto } from './types';

export async function listAuditLogs(page: number, pageSize: number): Promise<ListResponse<AuditLogDto>> {
  const res = await apiClient.get<ListResponse<AuditLogDto>>('/admin/audit-logs', {
    params: { page, pageSize },
  });
  return res.data;
}

export async function listUsers(page: number, pageSize: number): Promise<ListResponse<AdminUserDto>> {
  const res = await apiClient.get<ListResponse<AdminUserDto>>('/admin/users', {
    params: { page, pageSize },
  });
  return res.data;
}
