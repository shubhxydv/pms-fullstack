import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { freshApp, registerUser, authHeader, type TestUser } from '../helpers.js';
import type { Express } from 'express';

async function createProjectFor(app: Express, user: TestUser, name: string) {
  const res = await request(app)
    .post('/api/projects')
    .set(authHeader(user))
    .send({ name, startDate: '2026-10-01', endDate: '2026-10-31' });
  expect(res.status).toBe(201);
  return res.body.data as { id: string };
}

async function createTaskFor(app: Express, user: TestUser, projectId: string, name: string) {
  const res = await request(app)
    .post('/api/tasks')
    .set(authHeader(user))
    .send({ projectId, name, dueDate: '2026-10-15' });
  expect(res.status).toBe(201);
  return res.body.data as { id: string };
}

describe('cross-user authorization isolation', () => {
  it('user B cannot GET user A project (404, not 403)', async () => {
    const app = freshApp();
    const a = await registerUser(app, { email: 'a1@example.com' });
    const b = await registerUser(app, { email: 'b1@example.com' });
    const project = await createProjectFor(app, a, 'A Project');

    const res = await request(app).get(`/api/projects/${project.id}`).set(authHeader(b));
    expect(res.status).toBe(404);
  });

  it('user B cannot PUT user A project', async () => {
    const app = freshApp();
    const a = await registerUser(app, { email: 'a2@example.com' });
    const b = await registerUser(app, { email: 'b2@example.com' });
    const project = await createProjectFor(app, a, 'A Project');

    const res = await request(app)
      .put(`/api/projects/${project.id}`)
      .set(authHeader(b))
      .send({ name: 'Hacked' });
    expect(res.status).toBe(404);
  });

  it('user B cannot DELETE user A project', async () => {
    const app = freshApp();
    const a = await registerUser(app, { email: 'a3@example.com' });
    const b = await registerUser(app, { email: 'b3@example.com' });
    const project = await createProjectFor(app, a, 'A Project');

    const res = await request(app).delete(`/api/projects/${project.id}`).set(authHeader(b));
    expect(res.status).toBe(404);

    const stillThere = await request(app).get(`/api/projects/${project.id}`).set(authHeader(a));
    expect(stillThere.status).toBe(200);
  });

  it('user B cannot GET/PUT/DELETE a task belonging to user A', async () => {
    const app = freshApp();
    const a = await registerUser(app, { email: 'a4@example.com' });
    const b = await registerUser(app, { email: 'b4@example.com' });
    const project = await createProjectFor(app, a, 'A Project');
    const task = await createTaskFor(app, a, project.id, 'A Task');

    const get = await request(app).get(`/api/tasks/${task.id}`).set(authHeader(b));
    expect(get.status).toBe(404);

    const put = await request(app)
      .put(`/api/tasks/${task.id}`)
      .set(authHeader(b))
      .send({ status: 'COMPLETED' });
    expect(put.status).toBe(404);

    const del = await request(app).delete(`/api/tasks/${task.id}`).set(authHeader(b));
    expect(del.status).toBe(404);
  });

  it('user B cannot POST a task into user A project', async () => {
    const app = freshApp();
    const a = await registerUser(app, { email: 'a5@example.com' });
    const b = await registerUser(app, { email: 'b5@example.com' });
    const project = await createProjectFor(app, a, 'A Project');

    const res = await request(app)
      .post('/api/tasks')
      .set(authHeader(b))
      .send({ projectId: project.id, name: 'Sneaky task', dueDate: '2026-10-15' });
    expect(res.status).toBe(404);
  });

  it('listing/searching projects and tasks never leaks across users', async () => {
    const app = freshApp();
    const a = await registerUser(app, { email: 'a6@example.com' });
    const b = await registerUser(app, { email: 'b6@example.com' });
    const aProject = await createProjectFor(app, a, 'Alpha Shared Keyword');
    const bProject = await createProjectFor(app, b, 'Beta Shared Keyword');
    await createTaskFor(app, a, aProject.id, 'Alpha Task Shared Keyword');
    await createTaskFor(app, b, bProject.id, 'Beta Task Shared Keyword');

    const bProjects = await request(app)
      .get('/api/projects?q=Shared Keyword')
      .set(authHeader(b));
    expect(bProjects.body.data).toHaveLength(1);
    expect(bProjects.body.data[0].id).toBe(bProject.id);

    const bTasks = await request(app).get('/api/tasks?q=Shared Keyword').set(authHeader(b));
    expect(bTasks.body.data).toHaveLength(1);

    const aTasksByProjectIdOfB = await request(app)
      .get(`/api/tasks?projectId=${bProject.id}`)
      .set(authHeader(a));
    expect(aTasksByProjectIdOfB.body.data).toHaveLength(0);
  });

  it('dashboard counts are isolated per user', async () => {
    const app = freshApp();
    const a = await registerUser(app, { email: 'a7@example.com' });
    const b = await registerUser(app, { email: 'b7@example.com' });
    const aProject = await createProjectFor(app, a, 'A Dash Project');
    await createTaskFor(app, a, aProject.id, 'A Dash Task 1');
    await createTaskFor(app, a, aProject.id, 'A Dash Task 2');

    const aDash = await request(app).get('/api/dashboard').set(authHeader(a));
    expect(aDash.body.data.totalProjects).toBe(1);
    expect(aDash.body.data.totalTasks).toBe(2);

    const bDash = await request(app).get('/api/dashboard').set(authHeader(b));
    expect(bDash.body.data.totalProjects).toBe(0);
    expect(bDash.body.data.totalTasks).toBe(0);
  });
});
