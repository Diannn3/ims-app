import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { createAcademicRepository } from '$lib/data-access/academic/repository.server';
import { getSpaceById } from '$lib/domain/navigation/spaces';

export const load: PageServerLoad = async ({ locals, params }) => {
  const space = getSpaceById(params.id);
  if (!space) throw error(404, 'Room or facility not found.');

  const repository = createAcademicRepository(locals.supabase);
  const schedule = await repository.getRoomSchedule(space.id);

  return {
    space,
    repositoryStatus: repository.status(),
    schedule
  };
};
