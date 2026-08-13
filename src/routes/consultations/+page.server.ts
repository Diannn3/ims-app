import type { PageServerLoad } from './$types';
import { createAcademicRepository } from '$lib/data-access/academic/repository.server';

export const load: PageServerLoad = async ({ locals, url }) => {
  const repository = createAcademicRepository(locals.supabase);
  const weekdayRaw = url.searchParams.get('day');
  const weekday = weekdayRaw ? Number(weekdayRaw) : undefined;
  const items = await repository.listConsultations({
    weekday: Number.isInteger(weekday) && weekday! >= 1 && weekday! <= 7 ? weekday : undefined
  });

  return {
    repositoryStatus: repository.status(),
    weekday: weekday ?? null,
    items
  };
};
