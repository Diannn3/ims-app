import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireRole } from '$lib/server/auth';

const sourceTypes = [
  'official_web',
  'official_sheet',
  'official_csv',
  'faculty_entry',
  'admin_entry',
  'verified_report',
  'other'
] as const;

function safeHttpsUrl(value: string) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.supabase) return { sources: [] };
  const { data } = await locals.supabase
    .from('public_data_sources')
    .select('id, label, source_type, source_url, authority, created_at')
    .order('label');
  return { sources: data ?? [] };
};

export const actions: Actions = {
  create: async (event) => {
    requireRole(event, ['admin']);
    const supabase = event.locals.supabase;
    if (!supabase) return fail(503, { message: 'Administration is not configured.' });

    const form = await event.request.formData();
    const label = String(form.get('label') ?? '').trim();
    const sourceType = String(form.get('sourceType') ?? '').trim();
    const authority = String(form.get('authority') ?? '').trim() || null;
    const sourceUrlRaw = String(form.get('sourceUrl') ?? '').trim();
    const notes = String(form.get('notes') ?? '').trim() || null;

    if (!label || !sourceTypes.includes(sourceType as (typeof sourceTypes)[number])) {
      return fail(400, { message: 'Enter a source label and choose a valid source type.' });
    }

    const sourceUrl = safeHttpsUrl(sourceUrlRaw);
    if (sourceUrlRaw && !sourceUrl) {
      return fail(400, { message: 'Source URLs must be valid HTTPS URLs.' });
    }

    const { error } = await supabase.from('data_sources').insert({
      label,
      source_type: sourceType,
      source_url: sourceUrl,
      authority,
      notes
    });

    if (error) return fail(400, { message: error.message });
    return { created: true };
  }
};
