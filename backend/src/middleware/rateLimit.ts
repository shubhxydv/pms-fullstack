import rateLimit, { type Options } from 'express-rate-limit';
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

export const loginRateLimit = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 10,
});

export const registerRateLimit = rateLimit({
  ...base,
  windowMs: 60 * 60 * 1000,
  limit: 5,
});

export const refreshRateLimit = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 30,
});

export const globalRateLimit = rateLimit({
  ...base,
  windowMs: 60 * 1000,
  limit: 300,
});
