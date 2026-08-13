import { describe, expect, it } from 'vitest';
import { parseScheduleCsv } from '../csv';
import type { ImportValidationContext } from '$lib/domain/imports/types';

const context: ImportValidationContext = {
  coursesByCode: new Map([['demo101', { id: '11111111-1111-1111-1111-111111111111', code: 'DEMO 101' }]]),
  facultyByEmail: new Map([
    ['dalpha@example.invalid', [{ id: '33333333-3333-3333-3333-333333333333', displayName: 'Prof. Demo Alpha' }]]
  ]),
  facultyByName: new Map([
    ['prof. demo alpha', [{ id: '33333333-3333-3333-3333-333333333333', displayName: 'Prof. Demo Alpha' }]]
  ]),
  roomIds: new Set(['mb304'])
};

function bytes(value: string) {
  return new TextEncoder().encode(value);
}

describe('schedule CSV adapter', () => {
  it('parses quoted commas and uses an explicit source_record_key', async () => {
    const result = await parseScheduleCsv({
      sourceId: 'source-1',
      termId: 'term-1',
      context,
      bytes: bytes([
        'source_record_key,course_code,section_code,days,start_time,end_time,room,faculty_email,faculty_name',
        'row-42,DEMO 101,A,MWF,10:00 AM,11:00 AM,MB 304,dalpha@example.invalid,"Demo Alpha, Professor"'
      ].join('\r\n'))
    });

    expect(result.counts.errors).toBe(0);
    expect(result.rows[0].canonical?.sourceRecordKey).toContain('|external|row-42');
    expect(result.rows[0].resolved?.roomId).toBe('mb304');
  });

  it('produces an unchanged row when the canonical hash already exists', async () => {
    const input = {
      sourceId: 'source-1',
      termId: 'term-1',
      context,
      bytes: bytes([
        'source_record_key,course_code,section_code,days,start_time,end_time,room',
        'stable-1,DEMO 101,A,TTh,10:00,11:30,MB304'
      ].join('\n'))
    };
    const first = await parseScheduleCsv(input);
    const key = first.rows[0].canonical!.sourceRecordKey;
    const hash = first.rows[0].contentHash!;
    const second = await parseScheduleCsv({ ...input, existingHashes: new Map([[key, hash]]) });
    expect(second.counts.unchanged).toBe(1);
  });



  it('keeps fallback source identity stable when meeting time changes', async () => {
    const first = await parseScheduleCsv({
      sourceId: 'source-1',
      termId: 'term-1',
      context,
      bytes: bytes([
        'course_code,section_code,days,start_time,end_time,room',
        'DEMO 101,A,MWF,10:00,11:00,MB304'
      ].join('\n'))
    });
    const second = await parseScheduleCsv({
      sourceId: 'source-1',
      termId: 'term-1',
      context,
      bytes: bytes([
        'course_code,section_code,days,start_time,end_time,room',
        'DEMO 101,A,TTh,13:00,14:30,MB304'
      ].join('\n'))
    });

    expect(first.rows[0].canonical?.sourceRecordKey).toBe(second.rows[0].canonical?.sourceRecordKey);
    expect(first.rows[0].contentHash).not.toBe(second.rows[0].contentHash);
  });

  it('requires an explicit source key when one section has multiple independent source rows', async () => {
    const result = await parseScheduleCsv({
      sourceId: 'source-1',
      termId: 'term-1',
      context,
      bytes: bytes([
        'course_code,section_code,days,start_time,end_time,room',
        'DEMO 101,A,M,10:00,11:00,MB304',
        'DEMO 101,A,W,13:00,14:00,MB304'
      ].join('\n'))
    });

    expect(result.counts.errors).toBeGreaterThan(0);
    expect(result.rows[1].issues.some((issue) => issue.code === 'conflicting_duplicate_source_key')).toBe(true);
  });

  it('fails closed when different source identities duplicate the same meeting pattern', async () => {
    const result = await parseScheduleCsv({
      sourceId: 'source-1',
      termId: 'term-1',
      context,
      bytes: bytes([
        'source_record_key,course_code,section_code,days,start_time,end_time,room,faculty_email',
        'meeting-a,DEMO 101,A,MWF,10:00,11:00,MB304,dalpha@example.invalid',
        'meeting-b,DEMO 101,A,MWF,10:00,11:00,MB304,'
      ].join('\n'))
    });

    expect(result.counts.errors).toBeGreaterThanOrEqual(2);
    expect(result.rows[0].issues.some((issue) => issue.code === 'duplicate_meeting_pattern')).toBe(true);
    expect(result.rows[1].issues.some((issue) => issue.code === 'duplicate_meeting_pattern')).toBe(true);
  });

  it('marks an identical duplicate source row as skipped instead of applying twice', async () => {
    const result = await parseScheduleCsv({
      sourceId: 'source-1',
      termId: 'term-1',
      context,
      bytes: bytes([
        'source_record_key,course_code,section_code,days,start_time,end_time,room',
        'same,DEMO 101,A,MWF,10:00,11:00,MB304',
        'same,DEMO 101,A,MWF,10:00,11:00,MB304'
      ].join('\n'))
    });

    expect(result.counts.errors).toBe(0);
    expect(result.counts.skipped).toBe(1);
    expect(result.rows[1].issues.some((issue) => issue.code === 'duplicate_source_row')).toBe(true);
  });


  it('rejects a header-only CSV instead of creating an empty ready batch', async () => {
    await expect(
      parseScheduleCsv({
        sourceId: 'source-1',
        termId: 'term-1',
        context,
        bytes: bytes('course_code,section_code,days,start_time,end_time,room')
      })
    ).rejects.toThrow('no data rows');
  });

  it('fails closed on conflicting duplicate source keys', async () => {
    const result = await parseScheduleCsv({
      sourceId: 'source-1',
      termId: 'term-1',
      context,
      bytes: bytes([
        'source_record_key,course_code,section_code,days,start_time,end_time,room',
        'same,DEMO 101,A,MWF,10:00,11:00,MB304',
        'same,DEMO 101,A,MWF,10:00,12:00,MB304'
      ].join('\n'))
    });
    expect(result.counts.errors).toBeGreaterThan(0);
    expect(result.rows[1].issues.some((issue) => issue.code === 'conflicting_duplicate_source_key')).toBe(true);
  });
});
