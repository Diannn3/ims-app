import type { LayoutServerLoad } from './$types';
import { requireRole } from '$lib/server/auth';

export const load: LayoutServerLoad = async (event) => {
  const profile = requireRole(event, ['content_editor', 'admin']);
  return {
    adminProfile: profile,
    canApplyImports: profile?.role === 'admin'
  };
};
