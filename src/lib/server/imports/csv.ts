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
    invalid: number;
    errors: number;
    warnings: number;
    info: number;
  };
};

function utf8(bytes: Uint8Array) {
  if (bytes.byteLength > MAX_IMPORT_BYTES) {
    throw new Error(`CSV exceeds the ${Math.round(MAX_IMPORT_BYTES / 1024 / 1024)} MB upload limit.`);
  }
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new Error('CSV must be valid UTF-8 text.');
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
      throw new Error(`CSV contains a cell longer than ${MAX_IMPORT_CELL_LENGTH} characters.`);
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
  weekdays: number[];
  startsAt: string;
}) {
  // This fallback identity deliberately excludes room/faculty/end-time so routine
  // corrections update the same row. When the source provides source_record_key /
  // record_id, parseScheduleCsv prefers that authoritative identity instead.
  return [
    input.sourceId,
    input.termId,
    input.courseCode,
    input.sectionCode,
    input.weekdays.join('-'),
    input.startsAt
  ]
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
    throw new Error(`CSV could not be parsed: ${error instanceof Error ? error.message : 'invalid format'}`);
  }

  if (!matrix.length) throw new Error('CSV is empty.');
  if (matrix.length - 1 > MAX_IMPORT_ROWS) {
    throw new Error(`CSV exceeds the ${MAX_IMPORT_ROWS.toLocaleString()} row limit.`);
  }

  const headers = matrix[0].map((cell) => String(cell ?? '').trim());
  if (!headers.length || headers.every((header) => !header)) throw new Error('CSV has no header row.');

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
          sectionCode: first.canonical.sectionCode,
          weekdays: first.canonical.weekdays,
          startsAt: first.canonical.startsAt
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

  const allIssues = [...headerIssues, ...stagedRows.flatMap((row) => row.issues)];
  const statuses = stagedRows.map((row) => {
    if (row.issues.some((issue) => issue.severity === 'error')) return 'invalid' as const;
    const existingHash = row.canonical ? input.existingHashes?.get(row.canonical.sourceRecordKey) : null;
    if (existingHash && existingHash === row.contentHash) return 'unchanged' as const;
    if (existingHash && existingHash !== row.contentHash) return 'changed' as const;
    return 'valid' as const;
  });

  const previewHash = await sha256(
    stableJson(
      stagedRows.map((row, index) => ({
        key: row.canonical?.sourceRecordKey ?? `invalid:${row.raw}`,
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
  const previous = existingHashes.get(row.canonical.sourceRecordKey);
  if (previous === row.contentHash) return 'unchanged';
  if (previous) return 'changed';
  return 'valid';
}
