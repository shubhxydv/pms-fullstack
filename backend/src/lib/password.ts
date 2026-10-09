// Password hashing/verification helpers, plus a timing-safe check for logins with an unknown email.
import bcrypt from 'bcryptjs';

const COST_FACTOR = 12;

// Hashes a plaintext password with bcrypt
export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, COST_FACTOR);
}

// Compares plaintext password to stored hash
export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/** Dummy hash to compare against when a user doesn't exist, so login timing doesn't reveal account existence. */
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing-safety-00', COST_FACTOR);

// Fake-checks a password to mask timing
export function verifyAgainstDummyHash(plain: string): Promise<boolean> {
  return bcrypt.compare(plain, DUMMY_HASH);
}
