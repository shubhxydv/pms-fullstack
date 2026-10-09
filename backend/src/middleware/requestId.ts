// Attaches a unique request id to every request, reusing an incoming x-request-id header if present.
import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

declare module 'express-serve-static-core' {
  interface Request {
    id: string;
  }
}

// Assigns/propagates the request id header
export function requestId(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.headers['x-request-id'];
  req.id = typeof incoming === 'string' && incoming.length > 0 ? incoming : randomUUID();
  res.setHeader('x-request-id', req.id);
  next();
}
