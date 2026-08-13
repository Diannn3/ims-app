import { redirect, type RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ locals }) => {
  if (locals.supabase) {
    await locals.supabase.auth.signOut();
  }
  throw redirect(303, '/');
};
