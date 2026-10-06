import type { Express } from 'express';
import request from 'supertest';
import { createApp } from '../src/app.js';

export function freshApp(): Express {
  return createApp();
}

export interface TestUser {
  accessToken: string;
  refreshToken: string;
  userId: string;
  email: string;
}

let counter = 0;

export async function registerUser(
  app: Express,
  overrides: Partial<{ fullName: string; email: string; password: string }> = {},
): Promise<TestUser> {
  counter += 1;
  const email = overrides.email ?? `user${counter}@example.com`;
  const res = await request(app)
    .post('/api/auth/register')
    .set('X-Client', 'mobile')
    .send({
      fullName: overrides.fullName ?? `Test User ${counter}`,
      email,
      password: overrides.password ?? 'Password123',
    });

  if (res.status !== 201) {
    throw new Error(`registerUser failed: ${res.status} ${JSON.stringify(res.body)}`);
  }

  return {
    accessToken: res.body.accessToken,
    refreshToken: res.body.refreshToken,
    userId: res.body.user.id,
    email,
  };
}

export function authHeader(user: TestUser): Record<string, string> {
  return { Authorization: `Bearer ${user.accessToken}` };
}
