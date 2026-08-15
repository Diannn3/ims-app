import type { FloorId } from '$lib/domain/navigation/types';

export type FloorExitMarker = {
  x: number;
  y: number;
  label: string;
  kind: 'emergency' | 'entrance';
};

export type FloorVisual = {
  shortLabel: string;
  displayLabel: string;
  hallwayPath: string;
  exits: FloorExitMarker[];
  compass: { x: number; y: number };
};

/**
 * Presentation geometry only.
 *
 * Permanent room IDs, door nodes, anchors and route graph coordinates continue to
 * live in spaces.json / graph.json. These paths are an orthogonalized redraw of
 * the user-supplied IMS orientation posters so the visual layer can evolve without
 * changing navigation identity or routing contracts.
 */
export const floorVisuals = {
  ground: {
    shortLabel: 'GF',
    displayLabel: 'Ground Floor',
    hallwayPath:
      'M 72 330 H 120 V 245 H 1028 V 286 H 1082 V 445 H 1112 V 508 H 1008 V 447 H 842 V 526 H 620 V 447 H 510 V 526 H 316 V 447 H 174 V 422 H 72 Z',
    exits: [
      { x: 76, y: 378, label: 'Main entrance', kind: 'entrance' },
      { x: 1088, y: 326, label: 'Emergency exit', kind: 'emergency' }
    ],
    compass: { x: 1090, y: 658 }
  },
  second: {
    shortLabel: '2F',
    displayLabel: 'Second Floor',
    hallwayPath:
      'M 88 252 H 1036 V 286 H 1088 V 447 H 1010 V 455 H 912 V 447 H 255 V 455 H 108 V 447 H 88 Z',
    exits: [
      { x: 102, y: 286, label: 'West emergency exit', kind: 'emergency' },
      { x: 1078, y: 330, label: 'East emergency exit', kind: 'emergency' }
    ],
    compass: { x: 1090, y: 658 }
  },
  third: {
    shortLabel: '3F',
    displayLabel: 'Third Floor',
    hallwayPath:
      'M 88 252 H 1036 V 286 H 1088 V 447 H 1010 V 455 H 912 V 447 H 255 V 455 H 108 V 447 H 88 Z',
    exits: [
      { x: 102, y: 286, label: 'West emergency exit', kind: 'emergency' },
      { x: 1078, y: 330, label: 'East emergency exit', kind: 'emergency' }
    ],
    compass: { x: 1090, y: 658 }
  }
} satisfies Record<FloorId, FloorVisual>;
