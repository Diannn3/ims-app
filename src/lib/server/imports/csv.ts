import { parse } from 'csv-parse/sync';
import type {
  ImportIssue,
  ImportValidationContext,
  StagedScheduleRow
} from '$lib/domain/imports/types';
import {
  canonicalizeScheduleRow,
  inferHeaderMap,
  resolveScheduleRow
} from '$lib/domain/imports/validator';


export class ScheduleCsvInputError extends Error {
  readonly publicMessage: string;

  constructor(message: string) {
    super(message);
    this.name = 'ScheduleCsvInputError';
    this.publicMessage = message;
  }
}

function csvInputError(message: string): never {
  throw new ScheduleCsvInputError(message);
}

export const MAX_IMPORT_BYTES = 2 * 1024 * 1024;
export const MAX_IMPORT_ROWS = 5_000;
export const MAX_IMPORT_CELL_LENGTH = 2_000;

type ParseScheduleCsvInput = {
  bytes: Uint8Array;
  sourceId: string;
  termId: string;
  context: ImportValidationContext;
  existingHashes?: Map<string, string>;
};

type ParseScheduleCsvResult = {
  rows: StagedScheduleRow[];
  headerIssues: ImportIssue[];
  previewHash: string;
  counts: {
    rows: number;
    valid: number;
    changed: number;
    unchanged: number;
    skipped: number;
    invalid: number;
    errors: number;
    warnings: number;
    info: number;
  };
};

function utf8(bytes: Uint8Array) {
  if (bytes.byteLength > MAX_IMPORT_BYTES) {
    csvInputError(`CSV exceeds the ${Math.round(MAX_IMPORT_BYTES / 1024 / 1024)} MB upload limit.`);
  }
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    csvInputError('CSV must be valid UTF-8 text.');
  }
}

function normalizeHeaderForDuplicateCheck(value: string) {
  return value.trim().toLowerCase().replace(/[\s-]+/g, '_');
}

function toRecord(headers: string[], cells: unknown[]) {
  const row: Record<string, string> = {};
  for (let index = 0; index < headers.length; index += 1) {
    const value = cells[index] == null ? '' : String(cells[index]);
    if (value.length > MAX_IMPORT_CELL_LENGTH) {
      csvInputError(`CSV contains a cell longer than ${MAX_IMPORT_CELL_LENGTH} characters.`);
    }
    row[headers[index]] = value;
  }
  return row;
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    const object = value as Record<string, unknown>;
    return `{${Object.keys(object)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson(object[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function canonicalSourceKey(input: {
  sourceId: string;
  termId: string;
  courseCode: string;
  sectionCode: string;
}) {
  // V1 fallback identity is intentionally stable across schedule corrections.
  // A change in days/time/room/faculty therefore updates the same source record.
  // If a source represents more than one independent meeting pattern for the same
  // course+section, it must provide an explicit source_record_key/record_id.
  return [input.sourceId, input.termId, input.courseCode, input.sectionCode]
    .map((part) => part.trim().toLowerCase())
    .join('|');
}

export async function parseScheduleCsv(input: ParseScheduleCsvInput): Promise<ParseScheduleCsvResult> {
  const text = utf8(input.bytes);
  let matrix: unknown[][];

  try {
    matrix = parse(text, {
      bom: true,
      columns: false,
      skip_empty_lines: true,
      relax_column_count: false,
      relax_quotes: false,
      trim: false
    }) as unknown[][];
  } catch (error) {
    const line = error && typeof error === 'object' && 'lines' in error && Number.isFinite(Number((error as { lines?: unknown }).lines))
      ? Number((error as { lines?: unknown }).lines)
      : null;
    csvInputError(`CSV could not be parsed${line ? ` near line ${line}` : ''}. Check the column count, quotes, and delimiters.`);
  }

  if (!matrix.length) csvInputError('CSV is empty.');
  if (matrix.length - 1 > MAX_IMPORT_ROWS) {
    csvInputError(`CSV exceeds the ${MAX_IMPORT_ROWS.toLocaleString()} row limit.`);
  }

  const headers = matrix[0].map((cell) => String(cell ?? '').trim());
  if (!headers.length || headers.every((header) => !header)) csvInputError('CSV has no header row.');

  const headerIssues: ImportIssue[] = [];
  const seenHeaders = new Map<string, string>();
  for (const header of headers) {
    const normalized = normalizeHeaderForDuplicateCheck(header);
    if (!normalized) {
      headerIssues.push({
        rowNumber: 1,
        field: null,
        severity: 'error',
        code: 'blank_header',
        message: 'CSV contains a blank header cell.'
      });
      continue;
    }
    const previous = seenHeaders.get(normalized);
    if (previous) {
      headerIssues.push({
        rowNumber: 1,
        field: header,
        severity: 'error',
        code: 'duplicate_header',
        message: `Duplicate header “${header}” conflicts with “${previous}”.`
      });
    } else {
      seenHeaders.set(normalized, header);
    }
  }

  const inferred = inferHeaderMap(headers);
  headerIssues.push(...inferred.issues);
  if (headerIssues.some((issue) => issue.severity === 'error')) {
    return {
      rows: [],
      headerIssues,
      previewHash: await sha256(stableJson({ headers, headerIssues })),
      counts: {
        rows: 0,
        valid: 0,
        changed: 0,
        unchanged: 0,
        skipped: 0,
        invalid: 0,
        errors: headerIssues.filter((issue) => issue.severity === 'error').length,
        warnings: headerIssues.filter((issue) => issue.severity === 'warning').length,
        info: headerIssues.filter((issue) => issue.severity === 'info').length
      }
    };
  }

  const headerMap = inferred.map as Parameters<typeof canonicalizeScheduleRow>[2];
  const provisionalRows: Array<{ raw: Record<string, string>; rowNumber: number }> = [];
  for (let index = 1; index < matrix.length; index += 1) {
    provisionalRows.push({ raw: toRecord(headers, matrix[index]), rowNumber: index + 1 });
  }

  if (!provisionalRows.length) csvInputError('CSV has a header row but no data rows.');

  const stagedRows: StagedScheduleRow[] = [];
  const keysInFile = new Map<string, string>();

  for (const row of provisionalRows) {
    // Canonicalization needs a key, while the best fallback key depends on normalized
    // fields. Generate once with a placeholder, then replace deterministically.
    const first = canonicalizeScheduleRow(row.raw, row.rowNumber, headerMap, 'pending');
    if (!first.canonical) {
      stagedRows.push({
        rowNumber: row.rowNumber,
        raw: row.raw,
        canonical: null,
        resolved: null,
        issues: first.issues,
        contentHash: null
      });
      continue;
    }

    const sourceKeyHeader = (headerMap as { sourceRecordKey?: string }).sourceRecordKey;
    const sourceKeyFromFile = sourceKeyHeader ? String(row.raw[sourceKeyHeader] ?? '').trim() : '';
    const sourceRecordKey = sourceKeyFromFile
      ? [input.sourceId, input.termId, 'external', sourceKeyFromFile.normalize('NFKC').trim().toLowerCase()].join('|')
      : canonicalSourceKey({
          sourceId: input.sourceId,
          termId: input.termId,
          courseCode: first.canonical.courseCode,
          sectionCode: first.canonical.sectionCode
        });

    const canonical = { ...first.canonical, sourceRecordKey };
    const resolution = resolveScheduleRow(canonical, input.context);
    const issues = [...first.issues, ...resolution.issues];

    const hashPayload = {
      schemaVersion: canonical.schemaVersion,
      courseId: resolution.resolved.courseId,
      courseCode: canonical.courseCode,
      sectionCode: canonical.sectionCode,
      facultyId: resolution.resolved.facultyId,
      facultyName: canonical.facultyName,
      facultyEmail: canonical.facultyEmail,
      weekdays: canonical.weekdays,
      startsAt: canonical.startsAt,
      endsAt: canonical.endsAt,
      roomId: canonical.roomId
    };
    const contentHash = await sha256(stableJson(hashPayload));

    const previousInFile = keysInFile.get(sourceRecordKey);
    if (previousInFile && previousInFile !== contentHash) {
      issues.push({
        rowNumber: row.rowNumber,
        field: null,
        severity: 'error',
        code: 'conflicting_duplicate_source_key',
        message: 'This CSV contains two different rows with the same source identity.'
      });
    } else if (previousInFile === contentHash) {
      issues.push({
        rowNumber: row.rowNumber,
        field: null,
        severity: 'warning',
        code: 'duplicate_source_row',
        message: 'This row duplicates another row in the same CSV.'
      });
    } else {
      keysInFile.set(sourceRecordKey, contentHash);
    }

    const existingHash = input.existingHashes?.get(sourceRecordKey);
    if (existingHash && existingHash === contentHash) {
      issues.push({
        rowNumber: row.rowNumber,
        field: null,
        severity: 'info',
        code: 'unchanged_record',
        message: 'This row matches the previously applied source record.'
      });
    } else if (existingHash && existingHash !== contentHash) {
      issues.push({
        rowNumber: row.rowNumber,
        field: null,
        severity: 'warning',
        code: 'changed_record',
        message: 'This source record changed since the previous import and will require review.'
      });
    }

    stagedRows.push({ rowNumber: row.rowNumber, raw: row.raw, canonical, resolved: resolution.resolved, issues, contentHash });
  }

  // Schedule V1 deliberately allows multiple source rows for one section only when
  // they describe distinct meeting patterns. Two independent source identities for
  // the same course/section/day/time/room would otherwise duplicate meeting rows and
  // make team-teaching ownership ambiguous. Mark both rows invalid so the reviewer is
  // never left with a silently partial instructor set.
  const meetingPatterns = new Map<string, StagedScheduleRow>();
  const duplicateMeetingRows = new Set<number>();
  for (const row of stagedRows) {
    if (!row.canonical || !row.resolved || row.issues.some((issue) => issue.severity === 'error')) continue;
    const signature = stableJson({
      courseId: row.resolved.courseId,
      sectionCode: row.canonical.sectionCode,
      weekdays: row.canonical.weekdays,
      startsAt: row.canonical.startsAt,
      endsAt: row.canonical.endsAt,
      roomId: row.canonical.roomId
    });
    const previous = meetingPatterns.get(signature);
    if (!previous) {
      meetingPatterns.set(signature, row);
      continue;
    }
    if (previous.canonical?.sourceRecordKey === row.canonical.sourceRecordKey) continue;

    duplicateMeetingRows.add(previous.rowNumber);
    duplicateMeetingRows.add(row.rowNumber);
  }

  for (const row of stagedRows) {
    if (!duplicateMeetingRows.has(row.rowNumber)) continue;
    row.issues.push({
      rowNumber: row.rowNumber,
      field: null,
      severity: 'error',
      code: 'duplicate_meeting_pattern',
      message: 'Schedule V1 requires one source row per unique meeting pattern. Merge duplicate meeting rows or resolve team-teaching data before import.'
    });
  }

  const allIssues = [...headerIssues, ...stagedRows.flatMap((row) => row.issues)];
  const statuses = stagedRows.map((row) => {
    if (row.issues.some((issue) => issue.severity === 'error')) return 'invalid' as const;
    if (row.issues.some((issue) => issue.code === 'duplicate_source_row')) return 'skipped' as const;
    const existingHash = row.canonical ? input.existingHashes?.get(row.canonical.sourceRecordKey) : null;
    if (existingHash && existingHash === row.contentHash) return 'unchanged' as const;
    if (existingHash && existingHash !== row.contentHash) return 'changed' as const;
    return 'valid' as const;
  });

  const previewHash = await sha256(
    stableJson(
      stagedRows.map((row, index) => ({
        key: row.canonical?.sourceRecordKey ?? `invalid:${stableJson(row.raw)}`,
        hash: row.contentHash,
        status: statuses[index]
      }))
    )
  );

  return {
    rows: stagedRows,
    headerIssues,
    previewHash,
    counts: {
      rows: stagedRows.length,
      valid: statuses.filter((status) => status === 'valid').length,
      changed: statuses.filter((status) => status === 'changed').length,
      unchanged: statuses.filter((status) => status === 'unchanged').length,
      skipped: statuses.filter((status) => status === 'skipped').length,
      invalid: statuses.filter((status) => status === 'invalid').length,
      errors: allIssues.filter((issue) => issue.severity === 'error').length,
      warnings: allIssues.filter((issue) => issue.severity === 'warning').length,
      info: allIssues.filter((issue) => issue.severity === 'info').length
    }
  };
}

export function statusForStagedRow(row: StagedScheduleRow, existingHashes: Map<string, string>) {
  if (row.issues.some((issue) => issue.severity === 'error')) return 'invalid';
  if (!row.canonical || !row.contentHash) return 'invalid';
  if (row.issues.some((issue) => issue.code === 'duplicate_source_row')) return 'skipped';
  const previous = existingHashes.get(row.canonical.sourceRecordKey);
  if (previous === row.contentHash) return 'unchanged';
  if (previous) return 'changed';
  return 'valid';
}
