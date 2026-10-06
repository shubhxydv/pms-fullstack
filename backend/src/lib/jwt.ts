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

export function verifyAccessToken(token: string): VerifiedAccessToken {
  return jwt.verify(token, env.JWT_ACCESS_SECRET, {
    algorithms: ['HS256'],
    issuer: ISSUER,
    audience: AUDIENCE,
  }) as VerifiedAccessToken;
}
