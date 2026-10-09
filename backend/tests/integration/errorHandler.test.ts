import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { freshApp } from '../helpers.js';

describe('errorHandler: body-parser errors', () => {
  it('maps malformed JSON to 400 VALIDATION_ERROR', async () => {
    const app = freshApp();
    const res = await request(app)
      .post('/api/auth/register')
      .set('Content-Type', 'application/json')
      .send('{not valid json');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('maps an oversized body to 413 PAYLOAD_TOO_LARGE', async () => {
    const app = freshApp();
    const oversized = 'x'.repeat(200 * 1024); // over the 100kb express.json() limit
    const res = await request(app)
      .post('/api/auth/register')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ fullName: oversized, email: 'a@b.com', password: 'Password123' }));
    expect(res.status).toBe(413);
    expect(res.body.error.code).toBe('PAYLOAD_TOO_LARGE');
  });
});
