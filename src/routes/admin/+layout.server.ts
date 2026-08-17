import type { LayoutServerLoad } from './$types';
import { requireRole } from '$lib/server/auth';

export const load: LayoutServerLoad = async (event) => {
  const isMapWorkspace = event.url.pathname === '/admin/map' || event.url.pathname.startsWith('/admin/map/');
  const profile = requireRole(event, isMapWorkspace ? ['map_editor', 'admin'] : ['content_editor', 'admin']);
  return {
    adminProfile: profile,
    canApplyImports: profile?.role === 'admin',
    canManageMap: profile?.role === 'map_editor' || profile?.role === 'admin',
    isMapWorkspace
  };
};
