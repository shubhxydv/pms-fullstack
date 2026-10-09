// Builds rate limiters for sensitive routes (login, register, refresh) and one global limiter.
import rateLimit, { type Options, type RateLimitRequestHandler } from 'express-rate-limit';
import type { Request, Response } from 'express';

// Formats the 429 response body
function rateLimitHandler(_req: Request, res: Response): void {
  res.status(429).json({
    error: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later' },
  });
}

const base: Partial<Options> = {
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
};

// Limits login attempts per IP
export function createLoginRateLimit(): RateLimitRequestHandler {
  return rateLimit({ ...base, windowMs: 15 * 60 * 1000, limit: 10 });
}

// Limits registration attempts per IP
export function createRegisterRateLimit(): RateLimitRequestHandler {
  return rateLimit({ ...base, windowMs: 60 * 60 * 1000, limit: 5 });
}

// Limits refresh-token calls per IP
export function createRefreshRateLimit(): RateLimitRequestHandler {
  return rateLimit({ ...base, windowMs: 15 * 60 * 1000, limit: 30 });
}

// Limits all other traffic per IP
export function createGlobalRateLimit(): RateLimitRequestHandler {
  return rateLimit({ ...base, windowMs: 60 * 1000, limit: 300 });
}
