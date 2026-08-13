import type { PageServerLoad } from './$types';
import { searchAll } from '$lib/data-access/search/repository.server';
import { normalizeSearchQuery } from '$lib/domain/academic/formatters';

export const load: PageServerLoad = async ({ locals, url }) => {
  const query = normalizeSearchQuery(url.searchParams.get('q') ?? '');
  const search = await searchAll({ supabase: locals.supabase, query, limit: 30 });
  return { query, ...search };
};
