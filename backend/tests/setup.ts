import { afterAll, beforeEach } from 'vitest';
import { env } from '../src/config/env.js';
import { prisma } from '../src/lib/prisma.js';

if (env.NODE_ENV !== 'test' || !env.DATABASE_URL.includes('pms_test')) {
  throw new Error(
    `Refusing to run tests: expected NODE_ENV=test and a pms_test DATABASE_URL, got NODE_ENV=${env.NODE_ENV} DATABASE_URL=${env.DATABASE_URL}. ` +
      'This guard exists because the test setup truncates tables on every test.',
  );
}

beforeEach(async () => {
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE "audit_logs", "notification_log", "push_tokens", "tasks", "projects", "sessions", "users" RESTART IDENTITY CASCADE`,
  );
});

afterAll(async () => {
  await prisma.$disconnect();
});
