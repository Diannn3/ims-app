import type { PageServerLoad } from './$types';
import { createAcademicRepository } from '$lib/data-access/academic/repository.server';

export const load: PageServerLoad = async ({ locals }) => {
  const repository = createAcademicRepository(locals.supabase);
  const dates = await repository.listAcademicDates();
  return {
    repositoryStatus: repository.status(),
    dates
  };
};
