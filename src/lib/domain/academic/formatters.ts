const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function normalizeCourseCode(value: string) {
  return value.trim().toUpperCase().replace(/[\s_-]+/g, '');
}

export function normalizeHumanQuery(value: string) {
  return value.trim().normalize('NFKC').replace(/\s+/g, ' ');
}

/**
 * Normalize free-text search input before it reaches a PostgREST filter.
 *
 * `%` and `_` are SQL LIKE wildcards and a backslash is commonly used as an
 * escape character. Students searching the directory do not need wildcard
 * syntax, so strip those characters instead of letting a query accidentally
 * turn into an unbounded wildcard scan. Control characters are removed and the
 * public search contract is capped to a small, predictable length.
 */
export function normalizeSearchQuery(value: string, maxLength = 80) {
  return normalizeHumanQuery(value)
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .replace(/[%_\\]/g, '')
    .slice(0, Math.max(0, maxLength))
    .trim();
}

export function weekdayName(value: number | null) {
  if (!value || value < 1 || value > 7) return 'By arrangement';
  return WEEKDAYS[value - 1];
}

export function formatClock(value: string | null) {
  if (!value) return null;
  const [hourText, minuteText = '00'] = value.split(':');
  const hour = Number(hourText);
  const minute = Number(minuteText);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return value;

  const date = new Date(Date.UTC(2000, 0, 1, hour, minute));
  return new Intl.DateTimeFormat('en-PH', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC'
  }).format(date);
}

export function formatConsultationWindow(startsAt: string | null, endsAt: string | null) {
  const start = formatClock(startsAt);
  const end = formatClock(endsAt);
  if (!start || !end) return 'By appointment';
  return `${start}–${end}`;
}
