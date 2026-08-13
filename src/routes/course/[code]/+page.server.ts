import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { createAcademicRepository } from '$lib/data-access/academic/repository.server';

export const load: PageServerLoad = async ({ locals, params }) => {
  const repository = createAcademicRepository(locals.supabase);

  if (!repository.status().configured) {
    return {
      repositoryStatus: repository.status(),
      course: null
    };
  }

  const course = await repository.getCourseByCode(decodeURIComponent(params.code));
  const repositoryStatus = repository.status();

  if (!repositoryStatus.available) {
    return { repositoryStatus, course: null };
  }

  if (!course) throw error(404, 'Course not found.');

  return { repositoryStatus, course };
};
