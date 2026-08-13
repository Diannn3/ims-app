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
      .from('data_sources')
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

  const facultyByEmail = new Map<string, Array<{ id: string; displayName: string }>>();
  const facultyByName = new Map<string, Array<{ id: string; displayName: string }>>();
  for (const row of faculty ?? []) {
    const entry = { id: row.id, displayName: row.display_name };
    if (row.official_email) {
      const email = normalizeEmail(row.official_email);
      if (email) {
        const values = facultyByEmail.get(email) ?? [];
        values.push(entry);
        facultyByEmail.set(email, values);
      }
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
  filename: string;
  previewHash: string;
  authoritativeSnapshot: boolean;
  rows: StagedScheduleRow[];
  existingHashes: Map<string, string>;
}) {
  // Staging is one SECURITY DEFINER RPC so a failed row/issue insert cannot leave a
  // partially populated batch marked ready. The RPC derives authoritative counts
  // again and records auth.uid() itself; browser/server supplied aggregate counts are
  // deliberately not part of the persistence contract.
  const rows = input.rows.map((row) => ({
    rowNumber: row.rowNumber,
    rawPayload: row.raw,
    normalizedPayload: row.resolved,
    status: statusForStagedRow(row, input.existingHashes),
    sourceRecordKey: row.canonical?.sourceRecordKey ?? null,
    contentHash: row.contentHash,
    issues: row.issues.map((issue) => ({
      severity: issue.severity,
      code: issue.code,
      message: issue.message,
      field: issue.field,
      originalValue: issue.originalValue ?? null,
      normalizedValue: issue.normalizedValue ?? null,
      suggestedValue: issue.suggestedValue ?? null
    }))
  }));

  const { data: batchId, error } = await input.supabase.rpc('stage_schedule_import_batch', {
    p_source_id: input.sourceId,
    p_term_id: input.termId,
    p_filename: input.filename,
    p_preview_hash: input.previewHash,
    p_rows: rows,
    p_schema_version: 1,
    p_authoritative_snapshot: input.authoritativeSnapshot
  } as any);

  if (error || !batchId) throw new Error(error?.message ?? 'Could not stage import batch.');
  return batchId as string;
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
