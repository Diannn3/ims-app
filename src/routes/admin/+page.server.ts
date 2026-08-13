import type { PageServerLoad } from './$types';
import { listImportBatches, getImportSetup } from '$lib/data-access/imports/repository.server';
import { listScheduleReviewItems } from '$lib/data-access/admin/review.server';

export const load: PageServerLoad = async ({ locals }) => {
  const supabase = locals.supabase;
  if (!supabase) return { batches: [], setup: { sources: [], terms: [] }, reviewItems: [] };
  const [batches, setup, reviewItems] = await Promise.all([
    listImportBatches(supabase),
    getImportSetup(supabase),
    listScheduleReviewItems(supabase)
  ]);
  return { batches, setup, reviewItems };
};
