import type { PageServerLoad } from './$types';
import { searchAll } from '$lib/data-access/search/repository.server';

export const load: PageServerLoad = async ({ locals, url }) => {
  const query = url.searchParams.get('q')?.trim() ?? '';
  const search = await searchAll({ supabase: locals.supabase, query, limit: 30 });
  return { query, ...search };
};
