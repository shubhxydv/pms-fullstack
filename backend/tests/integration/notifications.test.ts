import { describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { freshApp, registerUser, authHeader, type TestUser } from '../helpers.js';
import { todayDateString, dateOnlyToUtcMidnight } from '../../src/lib/date.js';
import { env } from '../../src/config/env.js';

const cronAuthHeader = { Authorization: `Bearer ${env.CRON_SECRET}` };

async function createProject(app: Express, user: TestUser): Promise<string> {
  const res = await request(app)
    .post('/api/projects')
    .set(authHeader(user))
    .send({ name: 'P', startDate: '2026-11-01', endDate: '2026-11-30' });
  return res.body.data.id as string;
}

function tomorrowDateString(): string {
  const tomorrow = dateOnlyToUtcMidnight(todayDateString());
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  return tomorrow.toISOString().slice(0, 10);
}

describe('Notifications', () => {
  it('registers a push token for the current user', async () => {
    const app = freshApp();
    const user = await registerUser(app);

    const res = await request(app)
      .post('/api/notifications/register-token')
      .set(authHeader(user))
      .send({ token: 'expo-fcm-token-abc', platform: 'ANDROID' });
    expect(res.status).toBe(204);
  });

  it('rejects register-token without auth', async () => {
    const app = freshApp();
    const res = await request(app)
      .post('/api/notifications/register-token')
      .send({ token: 'x', platform: 'ANDROID' });
    expect(res.status).toBe(401);
  });

  it('test push reports zero sent when FCM is not configured (never throws)', async () => {
    const app = freshApp();
    const user = await registerUser(app);
    await request(app)
      .post('/api/notifications/register-token')
      .set(authHeader(user))
      .send({ token: 'expo-fcm-token-test-push', platform: 'ANDROID' });

    const res = await request(app).post('/api/notifications/test').set(authHeader(user));
    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(1);
    expect(res.body.data.sent).toBe(0);
  });

  it('rejects the cron endpoint without the cron secret', async () => {
    const app = freshApp();
    const res = await request(app).post('/api/notifications/cron/due-soon');
    expect(res.status).toBe(401);
  });

  it('finds tasks due tomorrow once and dedupes on a second run the same day', async () => {
    const app = freshApp();
    const user = await registerUser(app);
    const projectId = await createProject(app, user);
    await request(app)
      .post('/api/tasks')
      .set(authHeader(user))
      .send({ projectId, name: 'Due tomorrow', dueDate: tomorrowDateString() });

    const first = await request(app)
      .post('/api/notifications/cron/due-soon')
      .set(cronAuthHeader);
    expect(first.status).toBe(200);
    expect(first.body.data.checked).toBe(1);

    const second = await request(app)
      .post('/api/notifications/cron/due-soon')
      .set(cronAuthHeader);
    expect(second.status).toBe(200);
    expect(second.body.data.checked).toBe(0);
  });

  it('does not notify for a completed task due tomorrow', async () => {
    const app = freshApp();
    const user = await registerUser(app);
    const projectId = await createProject(app, user);
    const create = await request(app)
      .post('/api/tasks')
      .set(authHeader(user))
      .send({ projectId, name: 'Already done', dueDate: tomorrowDateString() });
    await request(app)
      .put(`/api/tasks/${create.body.data.id}`)
      .set(authHeader(user))
      .send({ status: 'COMPLETED' });

    const res = await request(app)
      .post('/api/notifications/cron/due-soon')
      .set(cronAuthHeader);
    expect(res.status).toBe(200);
    expect(res.body.data.checked).toBe(0);
  });
});
