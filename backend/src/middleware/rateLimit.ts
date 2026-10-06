import rateLimit, { type Options, type RateLimitRequestHandler } from 'express-rate-limit';
import type { Request, Response } from 'express';

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

export function createLoginRateLimit(): RateLimitRequestHandler {
  return rateLimit({ ...base, windowMs: 15 * 60 * 1000, limit: 10 });
}

export function createRegisterRateLimit(): RateLimitRequestHandler {
  return rateLimit({ ...base, windowMs: 60 * 60 * 1000, limit: 5 });
}

export function createRefreshRateLimit(): RateLimitRequestHandler {
  return rateLimit({ ...base, windowMs: 15 * 60 * 1000, limit: 30 });
}

export function createGlobalRateLimit(): RateLimitRequestHandler {
  return rateLimit({ ...base, windowMs: 60 * 1000, limit: 300 });
}
