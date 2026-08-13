import type { PageServerLoad } from './$types';
import { createAcademicRepository } from '$lib/data-access/academic/repository.server';

export const load: PageServerLoad = async ({ locals, url }) => {
  const repository = createAcademicRepository(locals.supabase);
  const query = url.searchParams.get('q')?.trim() ?? '';
  const courses = await repository.listCourses({ query });

  return {
    repositoryStatus: repository.status(),
    query,
    courses
  };
};
