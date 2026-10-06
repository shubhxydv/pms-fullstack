import bcrypt from 'bcryptjs';

const COST_FACTOR = 12;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, COST_FACTOR);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/** Dummy hash to compare against when a user doesn't exist, so login timing doesn't reveal account existence. */
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing-safety-00', COST_FACTOR);

export function verifyAgainstDummyHash(plain: string): Promise<boolean> {
  return bcrypt.compare(plain, DUMMY_HASH);
}
