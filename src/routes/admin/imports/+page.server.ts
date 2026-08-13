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
import { MAX_IMPORT_BYTES, parseScheduleCsv } from '$lib/server/imports/csv';

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
    if (!supabase || !profile) return fail(503, { stageError: 'Academic administration is not configured.' });

    const form = await event.request.formData();
    const file = form.get('schedule');
    const sourceId = String(form.get('sourceId') ?? '').trim();
    const termId = String(form.get('termId') ?? '').trim();
    const authoritativeSnapshot = form.get('authoritativeSnapshot') === 'on';

    if (!(file instanceof File) || file.size === 0) {
      return fail(400, { stageError: 'Choose a non-empty CSV file.' });
    }
    if (file.size > MAX_IMPORT_BYTES) {
      return fail(413, { stageError: `CSV exceeds the ${Math.round(MAX_IMPORT_BYTES / 1024 / 1024)} MB upload limit.` });
    }
    if (!file.name.toLowerCase().endsWith('.csv')) {
      return fail(400, { stageError: 'The first importer accepts .csv files only.' });
    }
    if (!sourceId || !termId) {
      return fail(400, { stageError: 'Choose both a verified source and academic term.' });
    }

    const setup = await getImportSetup(supabase);
    if (!setup.sources.some((source) => source.id === sourceId)) {
      return fail(400, { stageError: 'The selected data source is not available.' });
    }
    if (!setup.terms.some((term) => term.id === termId)) {
      return fail(400, { stageError: 'The selected academic term is not available.' });
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
        importedBy: profile.user_id,
        filename: file.name,
        previewHash: parsed.previewHash,
        authoritativeSnapshot,
        rows: parsed.rows,
        existingHashes,
        counts: parsed.counts
      });

      throw redirect(303, `/admin/imports/${batchId}`);
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error && 'location' in error) throw error;
      return fail(400, {
        stageError: error instanceof Error ? error.message : 'The CSV could not be staged.'
      });
    }
  }
};
