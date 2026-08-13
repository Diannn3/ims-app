import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireRole } from '$lib/server/auth';
import { getImportBatch, getImportSetup } from '$lib/data-access/imports/repository.server';

export const load: PageServerLoad = async ({ locals, params }) => {
  const supabase = locals.supabase;
  if (!supabase) throw error(503, 'Academic administration is not configured.');

  const [{ batch, rows }, setup] = await Promise.all([
    getImportBatch(supabase, params.batchId),
    getImportSetup(supabase)
  ]);
  if (!batch) throw error(404, 'Import batch not found.');

  return {
    batch,
    rows,
    source: setup.sources.find((source) => source.id === batch.source_id) ?? null,
    term: setup.terms.find((term) => term.id === batch.term_id) ?? null,
    canApply: locals.profile?.role === 'admin'
  };
};

export const actions: Actions = {
  acknowledgeWarnings: async (event) => {
    const profile = requireRole(event, ['content_editor', 'admin']);
    const supabase = event.locals.supabase;
    if (!supabase || !profile) return fail(503, { actionError: 'Administration is not configured.' });

    const { data: rows } = await supabase
      .from('import_rows')
      .select('id')
      .eq('batch_id', event.params.batchId);
    const rowIds = (rows ?? []).map((row: any) => row.id);
    if (!rowIds.length) return { acknowledged: true };

    const { error: updateError } = await supabase
      .from('import_issues')
      .update({ acknowledged_at: new Date().toISOString(), acknowledged_by: profile.user_id })
      .in('import_row_id', rowIds)
      .eq('issue_type', 'warning')
      .is('acknowledged_at', null);

    if (updateError) return fail(400, { actionError: updateError.message });
    return { acknowledged: true };
  },

  apply: async (event) => {
    requireRole(event, ['admin']);
    const supabase = event.locals.supabase;
    if (!supabase) return fail(503, { actionError: 'Administration is not configured.' });

    const form = await event.request.formData();
    const previewHash = String(form.get('previewHash') ?? '');
    if (!previewHash) return fail(400, { actionError: 'Preview hash is missing. Refresh and review the batch again.' });

    const { error: applyError } = await supabase.rpc('apply_import_batch', {
      p_batch_id: event.params.batchId,
      p_preview_hash: previewHash
    });
    if (applyError) return fail(400, { actionError: applyError.message });
    throw redirect(303, `/admin/imports/${event.params.batchId}?applied=1`);
  },

  reject: async (event) => {
    requireRole(event, ['admin']);
    const supabase = event.locals.supabase;
    if (!supabase) return fail(503, { actionError: 'Administration is not configured.' });

    const { error: rejectError } = await supabase
      .from('import_batches')
      .update({ status: 'rejected', updated_at: new Date().toISOString() })
      .eq('id', event.params.batchId)
      .in('status', ['staged', 'validation_failed', 'ready']);
    if (rejectError) return fail(400, { actionError: rejectError.message });
    throw redirect(303, `/admin/imports/${event.params.batchId}`);
  }
};
