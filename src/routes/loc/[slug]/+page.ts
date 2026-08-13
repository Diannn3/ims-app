import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { getLocationAnchor } from '$lib/domain/navigation/anchors';

export const load: PageLoad = ({ params }) => {
  const anchor = getLocationAnchor(params.slug);
  if (!anchor) throw error(404, 'Location anchor not found.');
  return { anchor };
};
