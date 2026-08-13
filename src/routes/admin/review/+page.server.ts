import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireRole } from '$lib/server/auth';
import { safeAdminActionError } from '$lib/server/admin-errors';
import { listScheduleReviewItems } from '$lib/data-access/admin/review.server';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.supabase) return { items: [], canPublish: false };
  return {
    items: await listScheduleReviewItems(locals.supabase),
    canPublish: locals.profile?.role === 'admin'
  };
};

export const actions: Actions = {
  verify: async (event) => {
    requireRole(event, ['content_editor', 'admin']);
    if (!event.locals.supabase) return fail(503, { reviewError: 'Administration is not configured.' });
    const form = await event.request.formData();
    const sectionId = String(form.get('sectionId') ?? '');
    const note = String(form.get('note') ?? '').trim() || null;
    const { error } = await event.locals.supabase.rpc('set_schedule_section_review', {
      p_section_id: sectionId,
      p_status: 'verified',
      p_note: note
    });
    if (error) return fail(400, { reviewError: safeAdminActionError(error, 'Could not verify this schedule.', 'review:verify'), sectionId });
    return { reviewSuccess: 'Schedule verified.', sectionId };
  },

  returnForReview: async (event) => {
    requireRole(event, ['content_editor', 'admin']);
    if (!event.locals.supabase) return fail(503, { reviewError: 'Administration is not configured.' });
    const form = await event.request.formData();
    const sectionId = String(form.get('sectionId') ?? '');
    const note = String(form.get('note') ?? '').trim() || null;
    const { error } = await event.locals.supabase.rpc('set_schedule_section_review', {
      p_section_id: sectionId,
      p_status: 'needs_verification',
      p_note: note
    });
    if (error) return fail(400, { reviewError: safeAdminActionError(error, 'Could not return this schedule for correction.', 'review:return'), sectionId });
    return { reviewSuccess: 'Schedule returned for verification.', sectionId };
  },

  publish: async (event) => {
    requireRole(event, ['admin']);
    if (!event.locals.supabase) return fail(503, { reviewError: 'Administration is not configured.' });
    const form = await event.request.formData();
    const sectionId = String(form.get('sectionId') ?? '');
    const note = String(form.get('note') ?? '').trim() || null;
    const { error } = await event.locals.supabase.rpc('set_schedule_section_publication', {
      p_section_id: sectionId,
      p_publish: true,
      p_note: note
    });
    if (error) return fail(400, { reviewError: safeAdminActionError(error, 'Could not publish this schedule.', 'review:publish'), sectionId });
    return { reviewSuccess: 'Schedule published.', sectionId };
  },

  withdraw: async (event) => {
    requireRole(event, ['admin']);
    if (!event.locals.supabase) return fail(503, { reviewError: 'Administration is not configured.' });
    const form = await event.request.formData();
    const sectionId = String(form.get('sectionId') ?? '');
    const note = String(form.get('note') ?? '').trim() || null;
    const { error } = await event.locals.supabase.rpc('set_schedule_section_publication', {
      p_section_id: sectionId,
      p_publish: false,
      p_note: note
    });
    if (error) return fail(400, { reviewError: safeAdminActionError(error, 'Could not withdraw this schedule.', 'review:withdraw'), sectionId });
    return { reviewSuccess: 'Schedule withdrawn from public view.', sectionId };
  }
};
