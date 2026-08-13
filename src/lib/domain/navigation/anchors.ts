import type { FloorId } from './types';

export type LocationAnchor = {
  slug: string;
  label: string;
  shortLabel: string;
  floor: FloorId;
  nodeId: string;
  status: 'prototype' | 'verified';
};

// Prototype anchors intentionally use stable graph-node IDs. Do not print or place
// permanent QR signage until the corresponding physical locations are site-verified.
export const locationAnchors: LocationAnchor[] = [
  { slug: 'main-entrance', label: 'Main Entrance', shortLabel: 'Main entrance', floor: 'ground', nodeId: 'gf-main-entrance', status: 'prototype' },
  { slug: 'ground-west-stairs', label: 'West Stairs · Ground Floor', shortLabel: 'Ground west stairs', floor: 'ground', nodeId: 'gf-west-stairs', status: 'prototype' },
  { slug: 'ground-center-stairs', label: 'Center Stairs · Ground Floor', shortLabel: 'Ground center stairs', floor: 'ground', nodeId: 'gf-center-stairs', status: 'prototype' },
  { slug: 'ground-east-stairs', label: 'East Stairs · Ground Floor', shortLabel: 'Ground east stairs', floor: 'ground', nodeId: 'gf-east-stairs', status: 'prototype' },
  { slug: 'second-west-stairs', label: 'West Stairs · Second Floor', shortLabel: '2nd floor west stairs', floor: 'second', nodeId: '2f-west-stairs', status: 'prototype' },
  { slug: 'second-center-stairs', label: 'Center Stairs · Second Floor', shortLabel: '2nd floor center stairs', floor: 'second', nodeId: '2f-center-stairs', status: 'prototype' },
  { slug: 'second-east-stairs', label: 'East Stairs · Second Floor', shortLabel: '2nd floor east stairs', floor: 'second', nodeId: '2f-east-stairs', status: 'prototype' },
  { slug: 'third-west-stairs', label: 'West Stairs · Third Floor', shortLabel: '3rd floor west stairs', floor: 'third', nodeId: '3f-west-stairs', status: 'prototype' },
  { slug: 'third-center-stairs', label: 'Center Stairs · Third Floor', shortLabel: '3rd floor center stairs', floor: 'third', nodeId: '3f-center-stairs', status: 'prototype' },
  { slug: 'third-east-stairs', label: 'East Stairs · Third Floor', shortLabel: '3rd floor east stairs', floor: 'third', nodeId: '3f-east-stairs', status: 'prototype' }
];

export function getLocationAnchor(slug: string) {
  return locationAnchors.find((anchor) => anchor.slug === slug) ?? null;
}

export function getLocationAnchorByNode(nodeId: string) {
  return locationAnchors.find((anchor) => anchor.nodeId === nodeId) ?? null;
}
