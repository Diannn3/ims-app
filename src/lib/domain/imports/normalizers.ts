import { normalizeCourseCode, normalizeHumanQuery } from '$lib/domain/academic/formatters';
import { spaces } from '$lib/domain/navigation/spaces';

const roomAliasMap = new Map<string, string>();
for (const space of spaces) {
  const values = [space.id, space.name, ...(space.aliases ?? [])];
  for (const value of values) {
    roomAliasMap.set(normalizeCompact(value), space.id);
  }
}

export function normalizeCompact(value: string) {
  return normalizeHumanQuery(value).toLowerCase().replace(/[\s_-]+/g, '');
}

export function normalizeRoom(value: string) {
  const normalized = normalizeCompact(value);
  if (!normalized || ['tba', 'tbd', 'none', 'online'].includes(normalized)) return null;
  return roomAliasMap.get(normalized) ?? undefined;
}

export function normalizeCourse(value: string) {
  return normalizeCourseCode(value);
}

export function normalizeEmail(value: string) {
  const normalized = value.trim().toLowerCase();
  return normalized || null;
}

export function normalizeFacultyName(value: string) {
  const normalized = normalizeHumanQuery(value)
    .replace(/^(dr|prof|professor)\.?\s+/i, '')
    .trim();
  return normalized || null;
}

export function normalizeWeekdays(value: string): number[] | null {
  const compact = value
    .trim()
    .toLowerCase()
    .replace(/[.\s/_-]+/g, '');

  if (!compact) return null;

  const direct: Record<string, number[]> = {
    m: [1],
    mon: [1],
    monday: [1],
    t: [2],
    tue: [2],
    tues: [2],
    tuesday: [2],
    w: [3],
    wed: [3],
    wednesday: [3],
    th: [4],
    thu: [4],
    thur: [4],
    thurs: [4],
    thursday: [4],
    f: [5],
    fri: [5],
    friday: [5],
    sa: [6],
    sat: [6],
    saturday: [6],
    su: [7],
    sun: [7],
    sunday: [7],
    mwf: [1, 3, 5],
    tth: [2, 4],
    tt: [2, 4],
    mw: [1, 3],
    wf: [3, 5],
    mf: [1, 5],
    mth: [1, 4],
    tf: [2, 5]
  };

  if (direct[compact]) return direct[compact];

  const tokens = value
    .trim()
    .split(/[,;/]+/)
    .map((token) => token.trim())
    .filter(Boolean);

  if (tokens.length > 1) {
    const result: number[] = [];
    for (const token of tokens) {
      const days = normalizeWeekdays(token);
      if (!days) return null;
      result.push(...days);
    }
    return [...new Set(result)].sort();
  }

  return null;
}

export function normalizeTime(value: string) {
  const raw = value.trim().toLowerCase().replace(/\s+/g, ' ');
  if (!raw) return null;

  const twelveHour = raw.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/i);
  if (twelveHour) {
    let hour = Number(twelveHour[1]);
    const minute = Number(twelveHour[2] ?? '0');
    if (hour < 1 || hour > 12 || minute < 0 || minute > 59) return null;
    if (twelveHour[3].toLowerCase() === 'pm' && hour !== 12) hour += 12;
    if (twelveHour[3].toLowerCase() === 'am' && hour === 12) hour = 0;
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  }

  const twentyFourHour = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (twentyFourHour) {
    const hour = Number(twentyFourHour[1]);
    const minute = Number(twentyFourHour[2]);
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  }

  return null;
}

export function minutesFromClock(value: string) {
  const [hour, minute] = value.split(':').map(Number);
  return hour * 60 + minute;
}
