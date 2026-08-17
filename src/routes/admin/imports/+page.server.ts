import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireRole } from '$lib/server/auth';
import {
  buildImportValidationContext,
  getExistingSourceHashes,
  getImportSetup,
  listImportBatches,
  persistStagedScheduleBatch
} from '$lib/data-access/imports/repository.server';
import { MAX_IMPORT_BYTES, parseScheduleCsv, ScheduleCsvInputError } from '$lib/server/imports/csv';
import { safeAdminActionError } from '$lib/server/admin-errors';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.supabase) return { setup: { sources: [], terms: [] }, batches: [] };
  const [setup, batches] = await Promise.all([
    getImportSetup(locals.supabase),
    listImportBatches(locals.supabase)
  ]);
  return { setup, batches };
};

export const actions: Actions = {
  stage: async (event) => {
    const profile = requireRole(event, ['content_editor', 'admin']);
    const supabase = event.locals.supabase;
    if (!supabase || !profile) return fail(503, { stageError: 'Academic administration is not configured.', headerIssues: [] });

    const form = await event.request.formData();
    const file = form.get('schedule');
    const sourceId = String(form.get('sourceId') ?? '').trim();
    const termId = String(form.get('termId') ?? '').trim();
    // Snapshot reconciliation is intentionally disabled until the retirement/reconciliation
    // transaction is implemented and database-tested. Never persist a misleading flag.
    const authoritativeSnapshot = false;

    if (!(file instanceof File) || file.size === 0) {
      return fail(400, { stageError: 'Choose a non-empty CSV file.', headerIssues: [] });
    }
    if (file.size > MAX_IMPORT_BYTES) {
      return fail(413, { stageError: `CSV exceeds the ${Math.round(MAX_IMPORT_BYTES / 1024 / 1024)} MB upload limit.`, headerIssues: [] });
    }
    if (!file.name.toLowerCase().endsWith('.csv')) {
      return fail(400, { stageError: 'The first importer accepts .csv files only.', headerIssues: [] });
    }
    if (!sourceId || !termId) {
      return fail(400, { stageError: 'Choose both a verified source and academic term.', headerIssues: [] });
    }

    const setup = await getImportSetup(supabase);
    if (!setup.sources.some((source) => source.id === sourceId)) {
      return fail(400, { stageError: 'The selected data source is not available.', headerIssues: [] });
    }
    if (!setup.terms.some((term) => term.id === termId)) {
      return fail(400, { stageError: 'The selected academic term is not available.', headerIssues: [] });
    }

    try {
      const [context, existingHashes] = await Promise.all([
        buildImportValidationContext(supabase),
        getExistingSourceHashes(supabase, sourceId, termId)
      ]);
      const parsed = await parseScheduleCsv({
        bytes: new Uint8Array(await file.arrayBuffer()),
        sourceId,
        termId,
        context,
        existingHashes
      });

      if (parsed.headerIssues.some((issue) => issue.severity === 'error')) {
        return fail(400, {
          stageError: 'The CSV header cannot be mapped safely. Fix the header before staging.',
          headerIssues: parsed.headerIssues
        });
      }

      const batchId = await persistStagedScheduleBatch({
        supabase,
        sourceId,
        termId,
        filename: file.name,
        previewHash: parsed.previewHash,
        authoritativeSnapshot,
        rows: parsed.rows,
        existingHashes
      });

      throw redirect(303, `/admin/imports/${batchId}`);
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error && 'location' in error) throw error;
      if (error instanceof ScheduleCsvInputError) {
        return fail(400, { stageError: error.publicMessage, headerIssues: [] });
      }
      return fail(400, {
        stageError: safeAdminActionError(error instanceof Error ? error : null, 'The CSV could not be staged.', 'imports:stage'),
        headerIssues: []
      });
    }
  }
};
