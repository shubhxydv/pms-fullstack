// Middleware factory that validates/parses req.body, req.query, req.params against Zod schemas.
import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';

interface ValidateSchemas {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
}

// Builds middleware that parses body/query/params
export function validate(schemas: ValidateSchemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (schemas.body) {
      req.body = schemas.body.parse(req.body);
    }
    if (schemas.query) {
      // Express 5 makes req.query a getter-only accessor; define it to override.
      Object.defineProperty(req, 'query', {
        value: schemas.query.parse(req.query),
        writable: true,
        configurable: true,
        enumerable: true,
      });
    }
    if (schemas.params) {
      req.params = schemas.params.parse(req.params) as typeof req.params;
    }
    next();
  };
}
