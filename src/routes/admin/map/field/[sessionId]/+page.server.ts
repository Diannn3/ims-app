import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireRole } from '$lib/server/auth';
import { safeAdminActionError } from '$lib/server/admin-errors';
import { getMapVerificationDetail, saveMapVerificationSession, submitMapVerificationSession, upsertMapVerificationChange } from '$lib/data-access/map-verification/repository.server';
import type { PhysicalVerificationChecklist, VerificationEntityType, VerificationScope } from '$lib/domain/map-verification';
import { CANONICAL_MAP_REVISION } from '$lib/domain/navigation/canonical-revision';

function checklist(form: FormData): PhysicalVerificationChecklist {
  return {
    signage_name: form.get('signage_name') === 'on',
    doorway_location: form.get('doorway_location') === 'on',
    corridor_connection: form.get('corridor_connection') === 'on',
    nearby_context: form.get('nearby_context') === 'on',
    anchor_exact_location: form.get('anchor_exact_location') === 'on',
    anchor_mounting: form.get('anchor_mounting') === 'on'
  };
}

export const load: PageServerLoad = async (event) => {
  requireRole(event, ['map_editor', 'admin']);
  if (!event.locals.supabase) return { detail: null, canonicalRevision: CANONICAL_MAP_REVISION, loadError: 'Map verification is not configured.' };
  const detail = await getMapVerificationDetail(event.locals.supabase, event.params.sessionId);
  return { detail, canonicalRevision: CANONICAL_MAP_REVISION, loadError: detail ? null : 'Verification session not found.' };
};

export const actions: Actions = {
  save: async (event) => {
    requireRole(event, ['map_editor', 'admin']);
    if (!event.locals.supabase) return fail(503, { mapError: 'Map verification is not configured.' });
    const form = await event.request.formData();
    try {
      await saveMapVerificationSession(event.locals.supabase, {
        id: event.params.sessionId,
        scope: String(form.get('scope') ?? 'mixed') as VerificationScope,
        title: String(form.get('title') ?? '').trim(),
        checklist: checklist(form)
      });
      return { mapSuccess: 'Field checklist saved.' };
    } catch (error) {
      return fail(400, { mapError: safeAdminActionError(error instanceof Error ? error : null, 'Could not save the field checklist.', 'map:field:save') });
    }
  },
  change: async (event) => {
    requireRole(event, ['map_editor', 'admin']);
    if (!event.locals.supabase) return fail(503, { mapError: 'Map verification is not configured.' });
    const form = await event.request.formData();
    let beforeValue: unknown;
    let afterValue: unknown;
    try {
      beforeValue = JSON.parse(String(form.get('beforeValue') ?? '{}'));
      afterValue = JSON.parse(String(form.get('afterValue') ?? '{}'));
      await upsertMapVerificationChange(event.locals.supabase, {
        sessionId: event.params.sessionId,
        entityType: String(form.get('entityType') ?? 'space') as VerificationEntityType,
        entityId: String(form.get('entityId') ?? '').trim(),
        beforeValue,
        afterValue
      });
      return { mapSuccess: 'Field observation recorded.' };
    } catch (error) {
      return fail(400, { mapError: safeAdminActionError(error instanceof Error ? error : null, 'Could not record this field observation.', 'map:field:change') });
    }
  },
  submit: async (event) => {
    requireRole(event, ['map_editor', 'admin']);
    if (!event.locals.supabase) return fail(503, { mapError: 'Map verification is not configured.' });
    try {
      await submitMapVerificationSession(event.locals.supabase, event.params.sessionId);
      return { mapSuccess: 'Field session submitted for administrator review.' };
    } catch (error) {
      return fail(400, { mapError: safeAdminActionError(error instanceof Error ? error : null, 'Submission blocked until every required physical check is confirmed.', 'map:field:submit') });
    }
  }
};
