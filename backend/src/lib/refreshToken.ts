// Helpers for opaque refresh tokens: generation, hashing for storage, and session-family ids.
import { randomBytes, randomUUID, createHash } from 'node:crypto';

export const REFRESH_TOKEN_TTL_DAYS = 30;

// Generates a random opaque refresh token
export function generateOpaqueToken(): string {
  return randomBytes(32).toString('base64url');
}

// Hashes a token before storing it in DB
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

// Creates a new session-family id
export function newFamilyId(): string {
  return randomUUID();
}

// Computes the refresh token's expiry date
export function refreshExpiryDate(): Date {
  const date = new Date();
  date.setDate(date.getDate() + REFRESH_TOKEN_TTL_DAYS);
  return date;
}
