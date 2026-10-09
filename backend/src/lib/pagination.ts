// Converts page/pageSize into Prisma skip/take, and builds the pagination metadata sent back to clients.
import type { PaginationMeta } from '@pms/shared';

export interface PageArgs {
  skip: number;
  take: number;
}

// Turns page number into Prisma skip/take
export function toPageArgs(page: number, pageSize: number): PageArgs {
  return { skip: (page - 1) * pageSize, take: pageSize };
}

// Builds the pagination metadata returned to clients
export function toPaginationMeta(page: number, pageSize: number, total: number): PaginationMeta {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}
