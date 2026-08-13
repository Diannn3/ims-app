import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { createAcademicRepository } from '$lib/data-access/academic/repository.server';

export const load: PageServerLoad = async ({ locals, params }) => {
  const repository = createAcademicRepository(locals.supabase);

  if (!repository.status().configured) {
    return {
      repositoryStatus: repository.status(),
      faculty: null
    };
  }

  const faculty = await repository.getFacultyBySlug(params.slug);
  const repositoryStatus = repository.status();

  if (!repositoryStatus.available) {
    return { repositoryStatus, faculty: null };
  }

  if (!faculty) throw error(404, 'Faculty profile not found.');

  return { repositoryStatus, faculty };
};
