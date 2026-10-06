import { existsSync } from 'node:fs';
import { z } from 'zod';

if (existsSync('.env')) {
  process.loadEnvFile('.env');
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DIRECT_URL: z.string().min(1, 'DIRECT_URL is required'),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  CORS_ORIGINS: z.string().min(1, 'CORS_ORIGINS is required (comma-separated)'),
  CRON_SECRET: z.string().min(16, 'CRON_SECRET must be at least 16 characters'),
  APP_TIMEZONE: z.string().default('Asia/Kolkata'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = {
  ...parsed.data,
  CORS_ORIGINS: parsed.data.CORS_ORIGINS.split(',').map((origin) => origin.trim()),
  IS_PRODUCTION: parsed.data.NODE_ENV === 'production',
  IS_TEST: parsed.data.NODE_ENV === 'test',
};
