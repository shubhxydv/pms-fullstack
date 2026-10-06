import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword, verifyAgainstDummyHash } from '../../src/lib/password.js';

describe('password lib', () => {
  it('hashes a password and verifies it back', async () => {
    const hash = await hashPassword('Password123');
    expect(hash).not.toBe('Password123');
    expect(await verifyPassword('Password123', hash)).toBe(true);
  });

  it('rejects an incorrect password', async () => {
    const hash = await hashPassword('Password123');
    expect(await verifyPassword('WrongPassword1', hash)).toBe(false);
  });

  it('dummy hash comparison always resolves without throwing', async () => {
    await expect(verifyAgainstDummyHash('anything')).resolves.toBe(false);
  });
});
