import { describe, expect, it } from 'vitest';
import { toPageArgs, toPaginationMeta } from '../../src/lib/pagination.js';

describe('pagination lib', () => {
  it('computes skip/take from page and pageSize', () => {
    expect(toPageArgs(1, 20)).toEqual({ skip: 0, take: 20 });
    expect(toPageArgs(3, 10)).toEqual({ skip: 20, take: 10 });
  });

  it('computes totalPages, rounding up, with a floor of 1', () => {
    expect(toPaginationMeta(1, 20, 0)).toEqual({ page: 1, pageSize: 20, total: 0, totalPages: 1 });
    expect(toPaginationMeta(1, 20, 45)).toEqual({ page: 1, pageSize: 20, total: 45, totalPages: 3 });
  });
});
