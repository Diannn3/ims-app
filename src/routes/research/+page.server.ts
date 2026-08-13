import type { PageServerLoad } from './$types';
import { createAcademicRepository } from '$lib/data-access/academic/repository.server';

export const load: PageServerLoad = async ({ locals }) => {
  const repository = createAcademicRepository(locals.supabase);
  const areas = await repository.listResearchAreas();
  return {
    repositoryStatus: repository.status(),
    areas
  };
};
