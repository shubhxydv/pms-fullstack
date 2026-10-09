// Writes audit-log entries (who did what, to what, from where) for security-relevant actions.
import type { Prisma } from '@prisma/client';
import { prisma } from './prisma.js';

export interface AuditEntry {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Prisma.InputJsonValue;
  ip?: string | null;
}

// Persists one audit-log row
export async function recordAudit(entry: AuditEntry): Promise<void> {
  await prisma.auditLog.create({
    data: {
      userId: entry.userId ?? null,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId ?? null,
      metadata: entry.metadata,
      ip: entry.ip ?? null,
    },
  });
}
