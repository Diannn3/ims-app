import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireRole } from '$lib/server/auth';
import { safeAdminActionError } from '$lib/server/admin-errors';
import {
  approveMapVerificationSession,
  createMapVerificationSession,
  listMapVerificationSessions,
  rejectMapVerificationSession
} from '$lib/data-access/map-verification/repository.server';
import type { VerificationScope } from '$lib/domain/map-verification';
import { CANONICAL_MAP_REVISION } from '$lib/domain/navigation/canonical-revision';

const scopes: VerificationScope[] = ['space', 'graph', 'hallway', 'anchor', 'mixed'];

export const load: PageServerLoad = async (event) => {
  requireRole(event, ['map_editor', 'admin']);
  const { locals } = event;
  if (!locals.supabase) return { sessions: [], canonicalRevision: CANONICAL_MAP_REVISION, loadError: 'Map verification is not configured.' };
  try {
    return {
      sessions: await listMapVerificationSessions(locals.supabase),
      canonicalRevision: CANONICAL_MAP_REVISION,
      loadError: null
    };
  } catch (error) {
    return {
      sessions: [],
      canonicalRevision: CANONICAL_MAP_REVISION,
      loadError: safeAdminActionError(error instanceof Error ? error : null, 'Map verification data is unavailable.', 'map:list')
    };
  }
};

export const actions: Actions = {
  create: async (event) => {
    requireRole(event, ['map_editor', 'admin']);
    if (!event.locals.supabase) return fail(503, { mapError: 'Map verification is not configured.' });
    const form = await event.request.formData();
    const title = String(form.get('title') ?? '').trim();
    const scope = String(form.get('scope') ?? 'mixed') as VerificationScope;
    const baseRevision = String(form.get('baseRevision') ?? CANONICAL_MAP_REVISION).trim();
    if (!scopes.includes(scope) || !baseRevision) return fail(400, { mapError: 'Choose a valid verification scope and base revision.' });
    try {
      const id = await createMapVerificationSession(event.locals.supabase, { buildingId: 'mb', baseRevision, scope, title });
      throw redirect(303, `/admin/map/${id}`);
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error && 'location' in error) throw error;
      return fail(400, { mapError: safeAdminActionError(error instanceof Error ? error : null, 'Could not create the verification session.', 'map:create') });
    }
  },

  approve: async (event) => {
    requireRole(event, ['admin']);
    if (!event.locals.supabase) return fail(503, { mapError: 'Map verification is not configured.' });
    const form = await event.request.formData();
    const id = String(form.get('sessionId') ?? '').trim();
    try {
      await approveMapVerificationSession(event.locals.supabase, {
        id,
        canonicalRevision: String(form.get('canonicalRevision') ?? CANONICAL_MAP_REVISION).trim(),
        snapshot: JSON.parse(String(form.get('snapshot') ?? '{}'))
      });
      return { mapSuccess: 'Map snapshot approved and sealed.' };
    } catch (error) {
      return fail(400, { mapError: safeAdminActionError(error instanceof Error ? error : null, 'Could not approve this snapshot.', 'map:approve'), sessionId: id });
    }
  },

  reject: async (event) => {
    requireRole(event, ['admin']);
    if (!event.locals.supabase) return fail(503, { mapError: 'Map verification is not configured.' });
    const form = await event.request.formData();
    const id = String(form.get('sessionId') ?? '').trim();
    try {
      await rejectMapVerificationSession(event.locals.supabase, id, String(form.get('reason') ?? '').trim());
      return { mapSuccess: 'Map verification returned for correction.' };
    } catch (error) {
      return fail(400, { mapError: safeAdminActionError(error instanceof Error ? error : null, 'Could not reject this session.', 'map:reject'), sessionId: id });
    }
  }
};
