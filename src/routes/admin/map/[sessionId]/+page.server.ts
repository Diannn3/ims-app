import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireRole } from '$lib/server/auth';
import { safeAdminActionError } from '$lib/server/admin-errors';
import {
  addMapVerificationEvidence,
  approveMapVerificationSession,
  getMapVerificationDetail,
  rebaseMapVerificationSession,
  rejectMapVerificationSession,
  saveMapVerificationSession,
  submitMapVerificationSession,
  upsertMapVerificationChange
} from '$lib/data-access/map-verification/repository.server';
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

function jsonValue(form: FormData, name: string) {
  try {
    return JSON.parse(String(form.get(name) ?? '{}'));
  } catch {
    throw new Error(`${name} must be valid JSON.`);
  }
}

export const load: PageServerLoad = async (event) => {
  requireRole(event, ['map_editor', 'admin']);
  if (!event.locals.supabase) return { detail: null, canonicalRevision: CANONICAL_MAP_REVISION, loadError: 'Map verification is not configured.' };
  const detail = await getMapVerificationDetail(event.locals.supabase, event.params.sessionId);
  if (!detail) return { detail: null, canonicalRevision: CANONICAL_MAP_REVISION, loadError: 'Verification session not found.' };
  return { detail, canonicalRevision: CANONICAL_MAP_REVISION, loadError: null };
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
      return { mapSuccess: 'Draft saved.' };
    } catch (error) {
      return fail(400, { mapError: safeAdminActionError(error instanceof Error ? error : null, 'Could not save the draft.', 'map:save') });
    }
  },

  change: async (event) => {
    requireRole(event, ['map_editor', 'admin']);
    if (!event.locals.supabase) return fail(503, { mapError: 'Map verification is not configured.' });
    const form = await event.request.formData();
    try {
      await upsertMapVerificationChange(event.locals.supabase, {
        sessionId: event.params.sessionId,
        entityType: String(form.get('entityType') ?? 'space') as VerificationEntityType,
        entityId: String(form.get('entityId') ?? '').trim(),
        changeKind: String(form.get('changeKind') ?? 'update') as 'update' | 'insert' | 'delete',
        beforeValue: jsonValue(form, 'beforeValue'),
        afterValue: jsonValue(form, 'afterValue')
      });
      return { mapSuccess: 'Map delta recorded.' };
    } catch (error) {
      return fail(400, { mapError: safeAdminActionError(error instanceof Error ? error : null, 'Could not record this map delta.', 'map:change') });
    }
  },

  evidence: async (event) => {
    requireRole(event, ['map_editor', 'admin']);
    if (!event.locals.supabase) return fail(503, { mapError: 'Map verification is not configured.' });
    const form = await event.request.formData();
    try {
      await addMapVerificationEvidence(event.locals.supabase, {
        sessionId: event.params.sessionId,
        kind: String(form.get('kind') ?? 'note') as 'photo' | 'note' | 'qr' | 'reference',
        storagePath: String(form.get('storagePath') ?? '').trim(),
        caption: String(form.get('caption') ?? '').trim(),
        metadata: jsonValue(form, 'metadata')
      });
      return { mapSuccess: 'Evidence metadata attached.' };
    } catch (error) {
      return fail(400, { mapError: safeAdminActionError(error instanceof Error ? error : null, 'Could not attach evidence.', 'map:evidence') });
    }
  },

  submit: async (event) => {
    requireRole(event, ['map_editor', 'admin']);
    if (!event.locals.supabase) return fail(503, { mapError: 'Map verification is not configured.' });
    try {
      await submitMapVerificationSession(event.locals.supabase, event.params.sessionId);
      return { mapSuccess: 'Submitted for administrator review.' };
    } catch (error) {
      return fail(400, { mapError: safeAdminActionError(error instanceof Error ? error : null, 'The physical verification checklist is not complete.', 'map:submit') });
    }
  },

  reject: async (event) => {
    requireRole(event, ['admin']);
    if (!event.locals.supabase) return fail(503, { mapError: 'Map verification is not configured.' });
    const form = await event.request.formData();
    try {
      await rejectMapVerificationSession(event.locals.supabase, event.params.sessionId, String(form.get('reason') ?? '').trim());
      return { mapSuccess: 'Session returned for correction.' };
    } catch (error) {
      return fail(400, { mapError: safeAdminActionError(error instanceof Error ? error : null, 'Could not reject this session.', 'map:reject') });
    }
  },

  approve: async (event) => {
    requireRole(event, ['admin']);
    if (!event.locals.supabase) return fail(503, { mapError: 'Map verification is not configured.' });
    const form = await event.request.formData();
    try {
      await approveMapVerificationSession(event.locals.supabase, {
        id: event.params.sessionId,
        canonicalRevision: String(form.get('canonicalRevision') ?? CANONICAL_MAP_REVISION).trim(),
        snapshot: jsonValue(form, 'snapshot')
      });
      return { mapSuccess: 'Snapshot approved and sealed. A reviewed Git change is still required to promote it.' };
    } catch (error) {
      return fail(400, { mapError: safeAdminActionError(error instanceof Error ? error : null, 'Could not approve this snapshot.', 'map:approve') });
    }
  },

  rebase: async (event) => {
    requireRole(event, ['map_editor', 'admin']);
    if (!event.locals.supabase) return fail(503, { mapError: 'Map verification is not configured.' });
    const form = await event.request.formData();
    try {
      await rebaseMapVerificationSession(event.locals.supabase, {
        id: event.params.sessionId,
        currentRevision: String(form.get('currentRevision') ?? CANONICAL_MAP_REVISION).trim(),
        currentEntities: jsonValue(form, 'currentEntities')
      });
      return { mapSuccess: 'Draft rebased safely onto the current canonical revision.' };
    } catch (error) {
      return fail(409, { mapError: safeAdminActionError(error instanceof Error ? error : null, 'Rebase blocked: canonical geometry changed. Manual review is required.', 'map:rebase') });
    }
  }
};
