import type { FloorId } from '$lib/domain/navigation/types';
import type { MapBounds } from '$lib/domain/navigation/map-camera';

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
  contentBounds: MapBounds;
  verificationStatus: 'reference-matched';
};

/**
 * Presentation geometry reconstructed from the user-supplied IMS orientation posters.
 *
 * This layer is intentionally separate from permanent navigation identity:
 * - spaces.json owns room/facility IDs and room rectangles
 * - graph.json owns routing nodes and edges
 * - floor-visuals.ts owns poster-matched hallway/wayfinding presentation
 *
 * The supplied posters are strong orientation references but are not architectural
 * drawings. All three floors remain `reference-matched`, not `site-verified`.
 */
export const floorVisuals = {
  ground: {
    shortLabel: 'GF',
    displayLabel: 'Ground Floor',
    hallwayPath:
      'M 58 336 H 118 V 246 H 1008 V 276 H 1076 V 312 H 1104 V 442 H 1132 V 505 H 1010 V 448 H 838 V 522 H 625 V 448 H 516 V 521 H 318 V 448 H 188 V 425 H 118 V 420 H 58 Z',
    exits: [
      { x: 70, y: 382, label: 'Main entrance', kind: 'entrance' },
      { x: 1087, y: 328, label: 'Emergency exit', kind: 'emergency' }
    ],
    compass: { x: 1090, y: 655 },
    contentBounds: { x: 42, y: 120, width: 1110, height: 525 },
    verificationStatus: 'reference-matched'
  },
  second: {
    shortLabel: '2F',
    displayLabel: 'Second Floor',
    hallwayPath:
      'M 78 250 H 1020 V 278 H 1076 V 312 H 1100 V 450 H 1018 V 456 H 918 V 448 H 254 V 458 H 106 V 448 H 78 Z',
    exits: [
      { x: 101, y: 286, label: 'West emergency exit', kind: 'emergency' },
      { x: 1078, y: 331, label: 'East emergency exit', kind: 'emergency' }
    ],
    compass: { x: 1090, y: 655 },
    contentBounds: { x: 68, y: 124, width: 1052, height: 515 },
    verificationStatus: 'reference-matched'
  },
  third: {
    shortLabel: '3F',
    displayLabel: 'Third Floor',
    hallwayPath:
      'M 78 250 H 1020 V 278 H 1076 V 312 H 1100 V 450 H 1018 V 456 H 918 V 448 H 254 V 458 H 106 V 448 H 78 Z',
    exits: [
      { x: 101, y: 286, label: 'West emergency exit', kind: 'emergency' },
      { x: 1078, y: 331, label: 'East emergency exit', kind: 'emergency' }
    ],
    compass: { x: 1090, y: 655 },
    contentBounds: { x: 68, y: 124, width: 1052, height: 515 },
    verificationStatus: 'reference-matched'
  }
} satisfies Record<FloorId, FloorVisual>;
