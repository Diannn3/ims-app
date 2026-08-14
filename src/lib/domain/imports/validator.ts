import type {
  CanonicalScheduleRowV1,
  ImportIssue,
  ImportValidationContext,
  ResolvedScheduleRowV1
} from './types';
import {
  normalizeCourse,
  normalizeEmail,
  normalizeFacultyName,
  normalizeRoom,
  normalizeTime,
  normalizeWeekdays,
  minutesFromClock
} from './normalizers';

type HeaderMap = {
  courseCode: string;
  sectionCode: string;
  facultyName?: string;
  facultyEmail?: string;
  days: string;
  startTime: string;
  endTime: string;
  room?: string;
  sourceRecordKey?: string;
};

const HEADER_ALIASES: Record<keyof HeaderMap, string[]> = {
  courseCode: ['course_code', 'course code', 'course', 'subject', 'coursecode'],
  sectionCode: ['section_code', 'section code', 'section', 'sectioncode'],
  facultyName: ['faculty_name', 'faculty name', 'faculty', 'instructor', 'professor'],
  facultyEmail: ['faculty_email', 'faculty email', 'email', 'instructor_email'],
  days: ['days', 'day', 'meeting_days', 'schedule_days'],
  startTime: ['start_time', 'start time', 'starts_at', 'start'],
  endTime: ['end_time', 'end time', 'ends_at', 'end'],
  room: ['room', 'room_id', 'room id', 'venue', 'location'],
  sourceRecordKey: ['source_record_key', 'source record key', 'record_id', 'record id']
};

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ').replace(/-/g, '_');
}

export function inferHeaderMap(headers: string[]): { map: Partial<HeaderMap>; issues: ImportIssue[] } {
  const normalized = headers.map((header) => ({ original: header, normalized: normalizeHeader(header) }));
  const map: Partial<HeaderMap> = {};
  const issues: ImportIssue[] = [];

  for (const [target, aliases] of Object.entries(HEADER_ALIASES) as Array<[keyof HeaderMap, string[]]>) {
    const matches = normalized.filter((header) =>
      aliases.map(normalizeHeader).includes(header.normalized)
    );

    if (matches.length > 1) {
      issues.push({
        rowNumber: 1,
        field: target,
        severity: 'error',
        code: 'duplicate_header_match',
        message: `Multiple CSV headers map to ${target}: ${matches.map((item) => item.original).join(', ')}`
      });
      continue;
    }

    if (matches[0]) map[target] = matches[0].original;
  }

  for (const required of ['courseCode', 'sectionCode', 'days', 'startTime', 'endTime'] as const) {
    if (!map[required]) {
      issues.push({
        rowNumber: 1,
        field: required,
        severity: 'error',
        code: 'missing_required_header',
        message: `Missing required header for ${required}.`
      });
    }
  }

  return { map, issues };
}

function field(raw: Record<string, string>, header?: string) {
  return header ? String(raw[header] ?? '').trim() : '';
}

export function canonicalizeScheduleRow(
  raw: Record<string, string>,
  rowNumber: number,
  headers: HeaderMap,
  sourceRecordKey: string
): { canonical: CanonicalScheduleRowV1 | null; issues: ImportIssue[] } {
  const issues: ImportIssue[] = [];
  const courseRaw = field(raw, headers.courseCode);
  const sectionRaw = field(raw, headers.sectionCode);
  const daysRaw = field(raw, headers.days);
  const startRaw = field(raw, headers.startTime);
  const endRaw = field(raw, headers.endTime);
  const roomRaw = field(raw, headers.room);
  const facultyNameRaw = field(raw, headers.facultyName);
  const facultyEmailRaw = field(raw, headers.facultyEmail);

  const courseCode = normalizeCourse(courseRaw);
  const sectionCode = sectionRaw.trim();
  const weekdays = normalizeWeekdays(daysRaw);
  const startsAt = normalizeTime(startRaw);
  const endsAt = normalizeTime(endRaw);
  const roomId = normalizeRoom(roomRaw);
  const facultyName = normalizeFacultyName(facultyNameRaw);
  const facultyEmail = normalizeEmail(facultyEmailRaw);

  if (!courseCode) issues.push({ rowNumber, field: 'courseCode', severity: 'error', code: 'missing_course', message: 'Course code is required.', originalValue: courseRaw });
  if (!sectionCode) issues.push({ rowNumber, field: 'sectionCode', severity: 'error', code: 'missing_section', message: 'Section code is required.', originalValue: sectionRaw });
  if (!weekdays) issues.push({ rowNumber, field: 'days', severity: 'error', code: 'invalid_days', message: 'Meeting days could not be normalized.', originalValue: daysRaw });
  if (!startsAt) issues.push({ rowNumber, field: 'startTime', severity: 'error', code: 'invalid_start_time', message: 'Start time is invalid.', originalValue: startRaw });
  if (!endsAt) issues.push({ rowNumber, field: 'endTime', severity: 'error', code: 'invalid_end_time', message: 'End time is invalid.', originalValue: endRaw });
  if (roomRaw && roomId === undefined) issues.push({ rowNumber, field: 'room', severity: 'error', code: 'unknown_room', message: `Room “${roomRaw}” is not in the verified map dictionary.`, originalValue: roomRaw });

  if (startsAt && endsAt && minutesFromClock(endsAt) <= minutesFromClock(startsAt)) {
    issues.push({
      rowNumber,
      field: 'endTime',
      severity: 'error',
      code: 'invalid_time_range',
      message: 'Meeting end time must be after the start time.',
      originalValue: `${startRaw}–${endRaw}`,
      normalizedValue: `${startsAt}–${endsAt}`
    });
  }

  if (issues.some((issue) => issue.severity === 'error')) return { canonical: null, issues };

  return {
    canonical: {
      schemaVersion: 1,
      rowNumber,
      courseCode,
      sectionCode,
      facultyName,
      facultyEmail,
      weekdays: weekdays!,
      startsAt: startsAt!,
      endsAt: endsAt!,
      roomId: roomId ?? null,
      sourceRecordKey
    },
    issues
  };
}

export function resolveScheduleRow(
  canonical: CanonicalScheduleRowV1,
  context: ImportValidationContext
): { resolved: ResolvedScheduleRowV1; issues: ImportIssue[] } {
  const issues: ImportIssue[] = [];
  const course = context.coursesByCode.get(canonical.courseCode.toLowerCase());
  let facultyId: string | null = null;

  if (!course) {
    issues.push({
      rowNumber: canonical.rowNumber,
      field: 'courseCode',
      severity: 'error',
      code: 'unknown_course',
      message: `Course ${canonical.courseCode} does not exist in the academic catalog.`,
      originalValue: canonical.courseCode
    });
  }

  if (canonical.roomId && !context.roomIds.has(canonical.roomId)) {
    issues.push({
      rowNumber: canonical.rowNumber,
      field: 'room',
      severity: 'error',
      code: 'unknown_room',
      message: `Room ${canonical.roomId} does not exist in the map dataset.`,
      normalizedValue: canonical.roomId
    });
  }

  if (canonical.facultyEmail) {
    const matches = context.facultyByEmail.get(canonical.facultyEmail) ?? [];
    if (matches.length === 1) {
      facultyId = matches[0].id;
    } else if (matches.length > 1) {
      issues.push({
        rowNumber: canonical.rowNumber,
        field: 'facultyEmail',
        severity: 'warning',
        code: 'ambiguous_faculty_email',
        message: `Faculty email “${canonical.facultyEmail}” matches multiple records and requires review.`,
        originalValue: canonical.facultyEmail
      });
    } else {
      issues.push({
        rowNumber: canonical.rowNumber,
        field: 'facultyEmail',
        severity: 'warning',
        code: 'unknown_faculty_email',
        message: `Faculty email “${canonical.facultyEmail}” does not match a known faculty record and requires review.`,
        originalValue: canonical.facultyEmail
      });
    }
  }

  if (!facultyId && canonical.facultyName) {
    const matches = context.facultyByName.get(canonical.facultyName.toLowerCase()) ?? [];
    if (matches.length === 1) {
      facultyId = matches[0].id;
    } else if (matches.length > 1) {
      issues.push({
        rowNumber: canonical.rowNumber,
        field: 'facultyName',
        severity: 'warning',
        code: 'ambiguous_faculty',
        message: `Faculty name “${canonical.facultyName}” matches multiple records and requires review.`,
        originalValue: canonical.facultyName
      });
    } else {
      issues.push({
        rowNumber: canonical.rowNumber,
        field: 'facultyName',
        severity: 'warning',
        code: 'unknown_faculty',
        message: `Faculty “${canonical.facultyName}” is unresolved. The row may be staged, but no faculty profile will be created automatically.`,
        originalValue: canonical.facultyName
      });
    }
  }

  return {
    resolved: {
      ...canonical,
      courseId: course?.id ?? null,
      facultyId
    },
    issues
  };
}
