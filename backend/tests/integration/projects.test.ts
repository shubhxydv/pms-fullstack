import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { freshApp, registerUser, authHeader } from '../helpers.js';

describe('Projects CRUD', () => {
  it('creates, lists, updates, and deletes a project', async () => {
    const app = freshApp();
    const user = await registerUser(app);

    const create = await request(app)
      .post('/api/projects')
      .set(authHeader(user))
      .send({ name: 'Launch', description: 'v1', startDate: '2026-11-01', endDate: '2026-11-30' });
    expect(create.status).toBe(201);
    const projectId = create.body.data.id;
    expect(create.body.data.taskCount).toBe(0);
    expect(create.body.data.completedCount).toBe(0);

    const list = await request(app).get('/api/projects').set(authHeader(user));
    expect(list.status).toBe(200);
    expect(list.body.data).toHaveLength(1);
    expect(list.body.meta.total).toBe(1);

    const update = await request(app)
      .put(`/api/projects/${projectId}`)
      .set(authHeader(user))
      .send({ status: 'IN_PROGRESS' });
    expect(update.status).toBe(200);
    expect(update.body.data.status).toBe('IN_PROGRESS');

    const del = await request(app).delete(`/api/projects/${projectId}`).set(authHeader(user));
    expect(del.status).toBe(204);

    const getAfterDelete = await request(app).get(`/api/projects/${projectId}`).set(authHeader(user));
    expect(getAfterDelete.status).toBe(404);
  });

  it('rejects end date before start date', async () => {
    const app = freshApp();
    const user = await registerUser(app);

    const res = await request(app)
      .post('/api/projects')
      .set(authHeader(user))
      .send({ name: 'Bad Dates', startDate: '2026-11-30', endDate: '2026-11-01' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects an invalid calendar date', async () => {
    const app = freshApp();
    const user = await registerUser(app);

    const res = await request(app)
      .post('/api/projects')
      .set(authHeader(user))
      .send({ name: 'Bad Date', startDate: '2026-02-31', endDate: '2026-03-01' });

    expect(res.status).toBe(400);
  });

  it('rejects unknown fields (.strict())', async () => {
    const app = freshApp();
    const user = await registerUser(app);

    const res = await request(app)
      .post('/api/projects')
      .set(authHeader(user))
      .send({ name: 'X', startDate: '2026-11-01', endDate: '2026-11-30', notAField: true });

    expect(res.status).toBe(400);
  });

  it('rejects an empty update body', async () => {
    const app = freshApp();
    const user = await registerUser(app);
    const create = await request(app)
      .post('/api/projects')
      .set(authHeader(user))
      .send({ name: 'X', startDate: '2026-11-01', endDate: '2026-11-30' });

    const res = await request(app)
      .put(`/api/projects/${create.body.data.id}`)
      .set(authHeader(user))
      .send({});
    expect(res.status).toBe(400);
  });

  it('cascades deleting a project to its tasks', async () => {
    const app = freshApp();
    const user = await registerUser(app);
    const create = await request(app)
      .post('/api/projects')
      .set(authHeader(user))
      .send({ name: 'Cascade', startDate: '2026-11-01', endDate: '2026-11-30' });
    const projectId = create.body.data.id;

    const task = await request(app)
      .post('/api/tasks')
      .set(authHeader(user))
      .send({ projectId, name: 'T', dueDate: '2026-11-10' });
    expect(task.status).toBe(201);

    await request(app).delete(`/api/projects/${projectId}`).set(authHeader(user));

    const getTask = await request(app).get(`/api/tasks/${task.body.data.id}`).set(authHeader(user));
    expect(getTask.status).toBe(404);
  });

  it('filters by status and supports pagination', async () => {
    const app = freshApp();
    const user = await registerUser(app);
    for (let i = 0; i < 3; i += 1) {
      await request(app)
        .post('/api/projects')
        .set(authHeader(user))
        .send({ name: `Project ${i}`, startDate: '2026-11-01', endDate: '2026-11-30' });
    }
    await request(app)
      .post('/api/projects')
      .set(authHeader(user))
      .send({
        name: 'Completed One',
        status: 'COMPLETED',
        startDate: '2026-11-01',
        endDate: '2026-11-30',
      });

    const completedOnly = await request(app)
      .get('/api/projects?status=COMPLETED')
      .set(authHeader(user));
    expect(completedOnly.body.data).toHaveLength(1);

    const page1 = await request(app).get('/api/projects?page=1&pageSize=2').set(authHeader(user));
    expect(page1.body.data).toHaveLength(2);
    expect(page1.body.meta.total).toBe(4);
    expect(page1.body.meta.totalPages).toBe(2);
  });
});
