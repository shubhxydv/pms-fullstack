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

export interface AdminUserDto {
  id: string;
  fullName: string;
  email: string;
  role: string;
  createdAt: string;
}
