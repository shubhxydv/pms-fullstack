import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { freshApp, registerUser } from '../helpers.js';

describe('POST /api/auth/register', () => {
  it('creates a user and returns an access token (mobile client gets refresh in body)', async () => {
    const app = freshApp();
    const res = await request(app)
      .post('/api/auth/register')
      .set('X-Client', 'mobile')
      .send({ fullName: 'Alice', email: 'alice@example.com', password: 'Password123' });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe('alice@example.com');
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(typeof res.body.accessToken).toBe('string');
    expect(typeof res.body.refreshToken).toBe('string');
  });

  it('web client gets the refresh token in an httpOnly cookie, not the body', async () => {
    const app = freshApp();
    const res = await request(app)
      .post('/api/auth/register')
      .set('X-Client', 'web')
      .send({ fullName: 'Web User', email: 'webuser@example.com', password: 'Password123' });

    expect(res.status).toBe(201);
    expect(res.body.refreshToken).toBeUndefined();
    const cookie = res.headers['set-cookie']?.[0] ?? '';
    expect(cookie).toContain('refreshToken=');
    expect(cookie.toLowerCase()).toContain('httponly');
  });

  it('rejects a duplicate email with 409 CONFLICT', async () => {
    const app = freshApp();
    await registerUser(app, { email: 'dup@example.com' });
    const res = await request(app)
      .post('/api/auth/register')
      .set('X-Client', 'mobile')
      .send({ fullName: 'Dup', email: 'dup@example.com', password: 'Password123' });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('rejects invalid payloads with 400 VALIDATION_ERROR', async () => {
    const app = freshApp();
    const res = await request(app)
      .post('/api/auth/register')
      .set('X-Client', 'mobile')
      .send({ fullName: '', email: 'not-an-email', password: 'short' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.length).toBeGreaterThan(0);
  });
});

describe('POST /api/auth/login', () => {
  it('logs in with correct credentials', async () => {
    const app = freshApp();
    await registerUser(app, { email: 'login@example.com', password: 'Password123' });

    const res = await request(app)
      .post('/api/auth/login')
      .set('X-Client', 'mobile')
      .send({ email: 'login@example.com', password: 'Password123' });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('login@example.com');
  });

  it('returns a generic error for a nonexistent email', async () => {
    const app = freshApp();
    const res = await request(app)
      .post('/api/auth/login')
      .set('X-Client', 'mobile')
      .send({ email: 'nobody@example.com', password: 'Password123' });

    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe('Invalid email or password');
  });

  it('returns the same generic error for a wrong password', async () => {
    const app = freshApp();
    await registerUser(app, { email: 'wrongpw@example.com', password: 'Password123' });

    const res = await request(app)
      .post('/api/auth/login')
      .set('X-Client', 'mobile')
      .send({ email: 'wrongpw@example.com', password: 'WrongPassword1' });

    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe('Invalid email or password');
  });

  it(
    'rate-limits after 10 attempts in the window with 429 RATE_LIMITED',
    async () => {
      const app = freshApp();
      await registerUser(app, { email: 'ratelimited@example.com', password: 'Password123' });

      let lastStatus = 0;
      for (let i = 0; i < 11; i += 1) {
        const res = await request(app)
          .post('/api/auth/login')
          .set('X-Client', 'mobile')
          .send({ email: 'ratelimited@example.com', password: 'WrongPassword1' });
        lastStatus = res.status;
      }

      expect(lastStatus).toBe(429);
    },
    15000,
  );
});

describe('POST /api/auth/refresh', () => {
  it('rotates the refresh token on each use', async () => {
    const app = freshApp();
    const user = await registerUser(app, { email: 'rotate@example.com' });

    const res = await request(app)
      .post('/api/auth/refresh')
      .set('X-Client', 'mobile')
      .send({ refreshToken: user.refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.refreshToken).not.toBe(user.refreshToken);
    expect(res.body.accessToken).not.toBe(user.accessToken);
  });

  it('detects reuse of an already-rotated token and revokes the whole session family', async () => {
    const app = freshApp();
    const user = await registerUser(app, { email: 'reuse@example.com' });

    const first = await request(app)
      .post('/api/auth/refresh')
      .set('X-Client', 'mobile')
      .send({ refreshToken: user.refreshToken });
    expect(first.status).toBe(200);
    const rotatedToken = first.body.refreshToken;

    const reuseOld = await request(app)
      .post('/api/auth/refresh')
      .set('X-Client', 'mobile')
      .send({ refreshToken: user.refreshToken });
    expect(reuseOld.status).toBe(401);

    const tryRotated = await request(app)
      .post('/api/auth/refresh')
      .set('X-Client', 'mobile')
      .send({ refreshToken: rotatedToken });
    expect(tryRotated.status).toBe(401);
  });

  it('rejects an unknown refresh token', async () => {
    const app = freshApp();
    const res = await request(app)
      .post('/api/auth/refresh')
      .set('X-Client', 'mobile')
      .send({ refreshToken: 'not-a-real-token' });
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/logout', () => {
  it('revokes the session so the access token stops working immediately', async () => {
    const app = freshApp();
    const user = await registerUser(app, { email: 'logout@example.com' });

    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${user.accessToken}`);
    expect(logoutRes.status).toBe(204);

    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${user.accessToken}`);
    expect(meRes.status).toBe(401);
  });

  it('requires authentication', async () => {
    const app = freshApp();
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  it('returns the current user without the password hash', async () => {
    const app = freshApp();
    const user = await registerUser(app, { email: 'me@example.com' });

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${user.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('me@example.com');
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it('rejects a request with no token', async () => {
    const app = freshApp();
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('rejects a malformed token', async () => {
    const app = freshApp();
    const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer garbage.token.here');
    expect(res.status).toBe(401);
  });
});
