import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { prisma } from '../../src/lib/prisma.js';
import { freshApp, registerUser, authHeader } from '../helpers.js';

describe('Admin RBAC', () => {
  it('rejects a normal user from /api/admin/users and /api/admin/audit-logs', async () => {
    const app = freshApp();
    const user = await registerUser(app, { email: 'plain@example.com' });

    const users = await request(app).get('/api/admin/users').set(authHeader(user));
    expect(users.status).toBe(403);

    const logs = await request(app).get('/api/admin/audit-logs').set(authHeader(user));
    expect(logs.status).toBe(403);
  });

  it('allows an ADMIN user to list users and audit logs', async () => {
    const app = freshApp();
    const admin = await registerUser(app, { email: 'admin2@example.com' });
    await prisma.user.update({ where: { id: admin.userId }, data: { role: 'ADMIN' } });

    // The original access token still carries role: USER (issued before the promotion), so re-login.
    const relogged = await request(app)
      .post('/api/auth/login')
      .set('X-Client', 'mobile')
      .send({ email: 'admin2@example.com', password: 'Password123' });

    const users = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${relogged.body.accessToken}`);
    expect(users.status).toBe(200);
    expect(users.body.data.length).toBeGreaterThan(0);

    const logs = await request(app)
      .get('/api/admin/audit-logs')
      .set('Authorization', `Bearer ${relogged.body.accessToken}`);
    expect(logs.status).toBe(200);
  });

  it('an admin still cannot read another user project/task through the normal endpoints', async () => {
    const app = freshApp();
    const admin = await registerUser(app, { email: 'admin3@example.com' });
    await prisma.user.update({ where: { id: admin.userId }, data: { role: 'ADMIN' } });
    const relogged = await request(app)
      .post('/api/auth/login')
      .set('X-Client', 'mobile')
      .send({ email: 'admin3@example.com', password: 'Password123' });
    const adminToken = relogged.body.accessToken;

    const other = await registerUser(app, { email: 'other@example.com' });
    const project = await request(app)
      .post('/api/projects')
      .set(authHeader(other))
      .send({ name: 'Private', startDate: '2026-11-01', endDate: '2026-11-30' });

    const res = await request(app)
      .get(`/api/projects/${project.body.data.id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
  });
});
