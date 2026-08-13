import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireRole } from '$lib/server/auth';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.supabase) return { terms: [] };
  const { data } = await locals.supabase
    .from('academic_terms')
    .select('id, academic_year, term_name, starts_on, ends_on, is_current')
    .order('starts_on', { ascending: false, nullsFirst: false });
  return { terms: data ?? [] };
};

export const actions: Actions = {
  create: async (event) => {
    requireRole(event, ['admin']);
    const supabase = event.locals.supabase;
    if (!supabase) return fail(503, { message: 'Administration is not configured.' });
    const form = await event.request.formData();
    const id = String(form.get('id') ?? '').trim();
    const academicYear = String(form.get('academicYear') ?? '').trim();
    const termName = String(form.get('termName') ?? '').trim();
    const startsOn = String(form.get('startsOn') ?? '').trim() || null;
    const endsOn = String(form.get('endsOn') ?? '').trim() || null;
    if (!id || !academicYear || !termName) return fail(400, { message: 'Term ID, academic year, and term name are required.' });
    if (startsOn && endsOn && endsOn < startsOn) return fail(400, { message: 'Term end date must be on or after the start date.' });
    const { error } = await supabase.from('academic_terms').insert({ id, academic_year: academicYear, term_name: termName, starts_on: startsOn, ends_on: endsOn, is_current: false });
    if (error) return fail(400, { message: error.message });
    return { created: true };
  },
  makeCurrent: async (event) => {
    requireRole(event, ['admin']);
    const supabase = event.locals.supabase;
    if (!supabase) return fail(503, { message: 'Administration is not configured.' });
    const form = await event.request.formData();
    const termId = String(form.get('termId') ?? '').trim();
    if (!termId) return fail(400, { message: 'Academic term is required.' });
    const { error } = await supabase.rpc('set_current_academic_term', { p_term_id: termId });
    if (error) return fail(400, { message: error.message });
    return { currentUpdated: true };
  }
};
