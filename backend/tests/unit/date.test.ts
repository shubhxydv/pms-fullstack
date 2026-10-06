import { describe, expect, it } from 'vitest';
import { todayDateString, dateOnlyToUtcMidnight } from '../../src/lib/date.js';

describe('date lib', () => {
  it('returns a YYYY-MM-DD string', () => {
    expect(todayDateString('Asia/Kolkata')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('parses a date-only string as UTC midnight', () => {
    const date = dateOnlyToUtcMidnight('2026-10-08');
    expect(date.toISOString()).toBe('2026-10-08T00:00:00.000Z');
  });

  it('Asia/Kolkata (UTC+5:30) can be a day ahead of UTC late at night', () => {
    const utcLateNight = new Date('2026-10-06T19:00:00.000Z');
    const kolkata = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(utcLateNight);
    expect(kolkata).toBe('2026-10-07');
  });
});
