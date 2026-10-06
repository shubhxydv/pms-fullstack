import { describe, expect, it } from 'vitest';
import jwt from 'jsonwebtoken';
import { signAccessToken, verifyAccessToken } from '../../src/lib/jwt.js';

describe('jwt lib', () => {
  it('signs and verifies a token round-trip', () => {
    const token = signAccessToken({ sub: 'user-1', sid: 'session-1', role: 'USER' });
    const payload = verifyAccessToken(token);
    expect(payload.sub).toBe('user-1');
    expect(payload.sid).toBe('session-1');
    expect(payload.role).toBe('USER');
  });

  it('rejects a token signed with a different secret', () => {
    const forged = jwt.sign({ sub: 'user-1', sid: 'session-1', role: 'ADMIN' }, 'wrong-secret', {
      algorithm: 'HS256',
      issuer: 'pms-api',
      audience: 'pms-clients',
    });
    expect(() => verifyAccessToken(forged)).toThrow();
  });

  it('rejects an expired token', () => {
    const expired = jwt.sign(
      { sub: 'user-1', sid: 'session-1', role: 'USER' },
      process.env.JWT_ACCESS_SECRET!,
      { algorithm: 'HS256', issuer: 'pms-api', audience: 'pms-clients', expiresIn: -10 },
    );
    expect(() => verifyAccessToken(expired)).toThrow(jwt.TokenExpiredError);
  });
});
