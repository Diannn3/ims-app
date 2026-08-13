import type { SupabaseClient } from '@supabase/supabase-js';
import { spaces } from '$lib/domain/navigation/spaces';
import type { ImportValidationContext, StagedScheduleRow } from '$lib/domain/imports/types';
import { normalizeCourse, normalizeEmail, normalizeFacultyName } from '$lib/domain/imports/normalizers';
import { statusForStagedRow } from '$lib/server/imports/csv';

export type ImportSetup = {
  sources: Array<{ id: string; label: string; sourceType: string; authority: string | null }>;
  terms: Array<{ id: string; academicYear: string; termName: string; isCurrent: boolean }>;
};

export async function getImportSetup(supabase: SupabaseClient): Promise<ImportSetup> {
  const [{ data: sources }, { data: terms }] = await Promise.all([
    supabase
      .from('public_data_sources')
      .select('id, label, source_type, authority')
      .order('label'),
    supabase
      .from('academic_terms')
      .select('id, academic_year, term_name, is_current')
      .order('starts_on', { ascending: false, nullsFirst: false })
  ]);

  return {
    sources: (sources ?? []).map((row: any) => ({
      id: row.id,
      label: row.label,
      sourceType: row.source_type,
      authority: row.authority
    })),
    terms: (terms ?? []).map((row: any) => ({
      id: row.id,
      academicYear: row.academic_year,
      termName: row.term_name,
      isCurrent: Boolean(row.is_current)
    }))
  };
}

export async function buildImportValidationContext(
  supabase: SupabaseClient
): Promise<ImportValidationContext> {
  const [{ data: courses }, { data: faculty }] = await Promise.all([
    supabase.from('courses').select('id, code, normalized_code'),
    supabase.from('faculty').select('id, display_name, official_email')
  ]);

  const coursesByCode = new Map<string, { id: string; code: string }>();
  for (const row of courses ?? []) {
    coursesByCode.set(normalizeCourse(row.code), { id: row.id, code: row.code });
    if (row.normalized_code) coursesByCode.set(normalizeCourse(row.normalized_code), { id: row.id, code: row.code });
  }

  const facultyByEmail = new Map<string, { id: string; displayName: string }>();
  const facultyByName = new Map<string, Array<{ id: string; displayName: string }>>();
  for (const row of faculty ?? []) {
    const entry = { id: row.id, displayName: row.display_name };
    if (row.official_email) {
      const email = normalizeEmail(row.official_email);
      if (email) facultyByEmail.set(email, entry);
    }
    const normalizedName = normalizeFacultyName(row.display_name)?.toLowerCase();
    if (normalizedName) {
      const values = facultyByName.get(normalizedName) ?? [];
      values.push(entry);
      facultyByName.set(normalizedName, values);
    }
  }

  return {
    coursesByCode,
    facultyByEmail,
    facultyByName,
    roomIds: new Set(spaces.map((space) => space.id))
  };
}

export async function getExistingSourceHashes(
  supabase: SupabaseClient,
  sourceId: string,
  termId: string,
  entityType = 'schedule_v1'
) {
  const { data } = await supabase
    .from('source_records')
    .select('source_record_key, content_hash')
    .eq('source_id', sourceId)
    .eq('term_id', termId)
    .eq('entity_type', entityType);

  return new Map<string, string>(
    (data ?? []).map((row: any) => [row.source_record_key, row.content_hash])
  );
}

export async function persistStagedScheduleBatch(input: {
  supabase: SupabaseClient;
  sourceId: string;
  termId: string;
  importedBy: string;
  filename: string;
  previewHash: string;
  authoritativeSnapshot: boolean;
  rows: StagedScheduleRow[];
  existingHashes: Map<string, string>;
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
}) {
  const status = input.counts.errors > 0 ? 'validation_failed' : 'ready';
  const { data: batch, error: batchError } = await input.supabase
    .from('import_batches')
    .insert({
      source_id: input.sourceId,
      term_id: input.termId,
      imported_by: input.importedBy,
      status,
      row_count: input.counts.rows,
      valid_row_count: input.counts.valid + input.counts.changed + input.counts.unchanged,
      error_count: input.counts.errors,
      warning_count: input.counts.warnings,
      filename: input.filename,
      preview_hash: input.previewHash,
      schema_version: 1,
      authoritative_snapshot: input.authoritativeSnapshot,
      summary: {
        valid: input.counts.valid,
        changed: input.counts.changed,
        unchanged: input.counts.unchanged,
        invalid: input.counts.invalid,
        info: input.counts.info
      }
    })
    .select('id')
    .single();

  if (batchError || !batch) throw new Error(batchError?.message ?? 'Could not create import batch.');

  const rowPayload = input.rows.map((row) => ({
    batch_id: batch.id,
    row_number: row.rowNumber,
    entity_type: 'schedule_v1',
    raw_payload: row.raw,
    normalized_payload: row.resolved,
    status: statusForStagedRow(row, input.existingHashes),
    source_record_key: row.canonical?.sourceRecordKey ?? null,
    content_hash: row.contentHash
  }));

  const { data: insertedRows, error: rowsError } = rowPayload.length
    ? await input.supabase.from('import_rows').insert(rowPayload).select('id, row_number')
    : { data: [], error: null };

  if (rowsError) throw new Error(rowsError.message);
  const idByRow = new Map((insertedRows ?? []).map((row: any) => [row.row_number, row.id]));

  const issues = input.rows.flatMap((row) =>
    row.issues.map((issue) => ({
      import_row_id: idByRow.get(issue.rowNumber),
      issue_type: issue.severity,
      error_code: issue.code,
      message: issue.message,
      field: issue.field,
      original_value: issue.originalValue ?? null,
      normalized_value: issue.normalizedValue ?? null,
      suggested_value: issue.suggestedValue ?? null
    }))
  ).filter((issue) => Boolean(issue.import_row_id));

  if (issues.length) {
    const { error: issuesError } = await input.supabase.from('import_issues').insert(issues);
    if (issuesError) throw new Error(issuesError.message);
  }

  return batch.id as string;
}

export async function listImportBatches(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('import_batches')
    .select('id, status, filename, row_count, valid_row_count, error_count, warning_count, created_at, applied_at, source_id, term_id, summary')
    .order('created_at', { ascending: false })
    .limit(40);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getImportBatch(supabase: SupabaseClient, batchId: string) {
  const [{ data: batch, error: batchError }, { data: rows, error: rowError }] = await Promise.all([
    supabase
      .from('import_batches')
      .select('id, status, filename, row_count, valid_row_count, error_count, warning_count, created_at, applied_at, source_id, term_id, summary, preview_hash, authoritative_snapshot, imported_by')
      .eq('id', batchId)
      .maybeSingle(),
    supabase
      .from('import_rows')
      .select('id, row_number, status, raw_payload, normalized_payload, source_record_key, content_hash, import_issues(id, issue_type, error_code, message, field, original_value, normalized_value, suggested_value, acknowledged_at)')
      .eq('batch_id', batchId)
      .order('row_number')
  ]);

  if (batchError) throw new Error(batchError.message);
  if (rowError) throw new Error(rowError.message);
  return { batch, rows: rows ?? [] };
}
