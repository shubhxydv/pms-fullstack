import type { ListResponse, PaginationQuery } from '@pms/shared';
import { prisma } from '../../lib/prisma.js';
import { toPageArgs, toPaginationMeta } from '../../lib/pagination.js';
import { toUserDto, type UserDto } from '../../lib/dto.js';

export async function listUsers(query: PaginationQuery): Promise<ListResponse<UserDto>> {
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      ...toPageArgs(query.page, query.pageSize),
    }),
    prisma.user.count(),
  ]);

  return {
    data: users.map(toUserDto),
    meta: toPaginationMeta(query.page, query.pageSize, total),
  };
}

export interface AuditLogDto {
  id: string;
  userId: string | null;
  userEmail: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: unknown;
  ip: string | null;
  createdAt: string;
}

export async function listAuditLogs(query: PaginationQuery): Promise<ListResponse<AuditLogDto>> {
  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      ...toPageArgs(query.page, query.pageSize),
      include: { user: { select: { email: true } } },
    }),
    prisma.auditLog.count(),
  ]);

  return {
    data: logs.map((log) => ({
      id: log.id,
      userId: log.userId,
      userEmail: log.user?.email ?? null,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      metadata: log.metadata,
      ip: log.ip,
      createdAt: log.createdAt.toISOString(),
    })),
    meta: toPaginationMeta(query.page, query.pageSize, total),
  };
}
