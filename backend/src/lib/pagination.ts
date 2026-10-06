import type { PaginationMeta } from '@pms/shared';

export interface PageArgs {
  skip: number;
  take: number;
}

export function toPageArgs(page: number, pageSize: number): PageArgs {
  return { skip: (page - 1) * pageSize, take: pageSize };
}

export function toPaginationMeta(page: number, pageSize: number, total: number): PaginationMeta {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}
