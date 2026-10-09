// Cross-cutting schemas and types: dates, pagination, and the error shape every API response uses.
import { z } from 'zod';
import { sortOrderSchema } from './enums.js';

/** YYYY-MM-DD, must be a real calendar date (rejects e.g. 2026-02-31). */
export const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
  .refine((val) => {
    const [y, m, d] = val.split('-').map(Number) as [number, number, number];
    const date = new Date(Date.UTC(y, m - 1, d));
    return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
  }, 'Date must be a valid calendar date');

// Validates a route param is a UUID
export const idParamSchema = z.object({ id: z.string().uuid() }).strict();
export type IdParam = z.infer<typeof idParamSchema>;

// Page number + page size for list endpoints
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

// Pagination info returned alongside list results
export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// Generic shape for any paginated list response
export interface ListResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// All API error codes the backend can return
export const errorCodeSchema = z.enum([
  'VALIDATION_ERROR',
  'UNAUTHENTICATED',
  'TOKEN_EXPIRED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'RATE_LIMITED',
  'PAYLOAD_TOO_LARGE',
  'INTERNAL',
]);
export type ErrorCode = z.infer<typeof errorCodeSchema>;

// One field-level validation failure
export interface ErrorDetail {
  path: string;
  message: string;
}

// Standard JSON shape for every error response
export interface ErrorEnvelope {
  error: {
    code: ErrorCode;
    message: string;
    details?: ErrorDetail[];
  };
}

export { sortOrderSchema };
