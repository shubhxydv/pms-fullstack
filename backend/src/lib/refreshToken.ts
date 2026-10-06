import { randomBytes, randomUUID, createHash } from 'node:crypto';

export const REFRESH_TOKEN_TTL_DAYS = 30;

export function generateOpaqueToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function newFamilyId(): string {
  return randomUUID();
}

export function refreshExpiryDate(): Date {
  const date = new Date();
  date.setDate(date.getDate() + REFRESH_TOKEN_TTL_DAYS);
  return date;
}
