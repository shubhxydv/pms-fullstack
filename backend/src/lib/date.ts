import { env } from '../config/env.js';

/** Today's calendar date (YYYY-MM-DD) as observed in APP_TIMEZONE, independent of server UTC offset. */
export function todayDateString(timezone: string = env.APP_TIMEZONE): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(new Date());
}

/** Date-only value matching how YYYY-MM-DD strings are stored (UTC midnight) for @db.Date columns. */
export function dateOnlyToUtcMidnight(dateString: string): Date {
  return new Date(`${dateString}T00:00:00.000Z`);
}
