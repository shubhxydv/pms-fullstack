// Signs and verifies short-lived JWT access tokens used to authenticate API requests.
import jwt from 'jsonwebtoken';
import type { Role } from '@pms/shared';
import { env } from '../config/env.js';

const ISSUER = 'pms-api';
const AUDIENCE = 'pms-clients';
const ACCESS_TOKEN_TTL = '15m';

export interface AccessTokenPayload {
  sub: string;
  sid: string;
  role: Role;
}

// Signs a new short-lived access token
export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    algorithm: 'HS256',
    expiresIn: ACCESS_TOKEN_TTL,
    issuer: ISSUER,
    audience: AUDIENCE,
  });
}

export interface VerifiedAccessToken extends AccessTokenPayload {
  iat: number;
  exp: number;
}

// Verifies signature, issuer and expiry
export function verifyAccessToken(token: string): VerifiedAccessToken {
  return jwt.verify(token, env.JWT_ACCESS_SECRET, {
    algorithms: ['HS256'],
    issuer: ISSUER,
    audience: AUDIENCE,
  }) as VerifiedAccessToken;
}
