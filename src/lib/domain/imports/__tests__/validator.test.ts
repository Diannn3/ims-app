import { describe, expect, it } from 'vitest';
import { canonicalizeScheduleRow, inferHeaderMap, resolveScheduleRow } from '../validator';
import type { ImportValidationContext } from '../types';

const headers = ['course_code', 'section_code', 'faculty_name', 'days', 'start_time', 'end_time', 'room'];
const mapped = inferHeaderMap(headers).map as any;
const context: ImportValidationContext = {
  coursesByCode: new Map([['demo101', { id: 'course-1', code: 'DEMO 101' }]]),
  facultyByEmail: new Map(),
  facultyByName: new Map(),
  roomIds: new Set(['mb304'])
};

describe('schedule import validator', () => {
  it('canonicalizes a valid row without inventing unresolved faculty', () => {
    const { canonical, issues } = canonicalizeScheduleRow(
      {
        course_code: 'DEMO 101',
        section_code: 'A',
        faculty_name: 'Prof. Unknown Person',
        days: 'TTh',
        start_time: '10:00 AM',
        end_time: '11:30 AM',
        room: 'MB304'
      },
      2,
      mapped,
      'key'
    );
    expect(issues).toHaveLength(0);
    expect(canonical?.roomId).toBe('mb304');
    const resolved = resolveScheduleRow(canonical!, context);
    expect(resolved.resolved.facultyId).toBeNull();
    expect(resolved.issues.some((issue) => issue.code === 'unknown_faculty')).toBe(true);
  });

  it('rejects unknown rooms', () => {
    const result = canonicalizeScheduleRow(
      { course_code: 'DEMO 101', section_code: 'A', days: 'MWF', start_time: '10:00', end_time: '11:00', room: 'MB999' },
      2,
      mapped,
      'key'
    );
    expect(result.canonical).toBeNull();
    expect(result.issues.some((issue) => issue.code === 'unknown_room')).toBe(true);
  });

  it('rejects overnight/reversed meeting ranges', () => {
    const result = canonicalizeScheduleRow(
      { course_code: 'DEMO 101', section_code: 'A', days: 'MWF', start_time: '13:00', end_time: '12:00', room: 'MB304' },
      2,
      mapped,
      'key'
    );
    expect(result.issues.some((issue) => issue.code === 'invalid_time_range')).toBe(true);
  });
});
