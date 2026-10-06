import { describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { freshApp, registerUser, authHeader, type TestUser } from '../helpers.js';

async function createProject(app: Express, user: TestUser): Promise<string> {
  const res = await request(app)
    .post('/api/projects')
    .set(authHeader(user))
    .send({ name: 'P', startDate: '2026-11-01', endDate: '2026-11-30' });
  return res.body.data.id as string;
}

describe('Tasks CRUD', () => {
  it('creates a task and marks it completed via partial update', async () => {
    const app = freshApp();
    const user = await registerUser(app);
    const projectId = await createProject(app, user);

    const create = await request(app)
      .post('/api/tasks')
      .set(authHeader(user))
      .send({ projectId, name: 'Write tests', dueDate: '2026-11-10' });
    expect(create.status).toBe(201);
    expect(create.body.data.status).toBe('PENDING');

    const complete = await request(app)
      .put(`/api/tasks/${create.body.data.id}`)
      .set(authHeader(user))
      .send({ status: 'COMPLETED' });
    expect(complete.status).toBe(200);
    expect(complete.body.data.status).toBe('COMPLETED');
    expect(complete.body.data.name).toBe('Write tests');
  });

  it('rejects creating a task in a project that does not belong to the caller', async () => {
    const app = freshApp();
    const owner = await registerUser(app, { email: 'owner@example.com' });
    const stranger = await registerUser(app, { email: 'stranger@example.com' });
    const projectId = await createProject(app, owner);

    const res = await request(app)
      .post('/api/tasks')
      .set(authHeader(stranger))
      .send({ projectId, name: 'Sneaky', dueDate: '2026-11-10' });
    expect(res.status).toBe(404);
  });

  it('filters by status and priority', async () => {
    const app = freshApp();
    const user = await registerUser(app);
    const projectId = await createProject(app, user);

    await request(app)
      .post('/api/tasks')
      .set(authHeader(user))
      .send({ projectId, name: 'High', priority: 'HIGH', dueDate: '2026-11-10' });
    await request(app)
      .post('/api/tasks')
      .set(authHeader(user))
      .send({ projectId, name: 'Low', priority: 'LOW', dueDate: '2026-11-10' });

    const highOnly = await request(app)
      .get(`/api/tasks?projectId=${projectId}&priority=HIGH`)
      .set(authHeader(user));
    expect(highOnly.body.data).toHaveLength(1);
    expect(highOnly.body.data[0].priority).toBe('HIGH');
  });

  it('rejects an invalid priority value', async () => {
    const app = freshApp();
    const user = await registerUser(app);
    const projectId = await createProject(app, user);

    const res = await request(app)
      .post('/api/tasks')
      .set(authHeader(user))
      .send({ projectId, name: 'X', priority: 'URGENT', dueDate: '2026-11-10' });
    expect(res.status).toBe(400);
  });

  it('deletes a task', async () => {
    const app = freshApp();
    const user = await registerUser(app);
    const projectId = await createProject(app, user);
    const create = await request(app)
      .post('/api/tasks')
      .set(authHeader(user))
      .send({ projectId, name: 'To delete', dueDate: '2026-11-10' });

    const del = await request(app).delete(`/api/tasks/${create.body.data.id}`).set(authHeader(user));
    expect(del.status).toBe(204);

    const get = await request(app).get(`/api/tasks/${create.body.data.id}`).set(authHeader(user));
    expect(get.status).toBe(404);
  });
});
