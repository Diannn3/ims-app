import spacesData from '$lib/data/math-building/spaces.json';
import type { FloorId } from './types';

export type SpaceRecord = {
  id: string;
  name: string;
  floor: FloorId;
  kind: string;
  geometry: { type: 'rect'; x: number; y: number; width: number; height: number };
  subtitle: string | null;
  aliases?: string[];
  doorNode?: string;
  entryNode?: string;
  verificationStatus: string;
};

export const spaces = spacesData as SpaceRecord[];

export function getSpaceById(id: string) {
  return spaces.find((space) => space.id === id) ?? null;
}

export function floorDisplayName(floor: FloorId) {
  return floor === 'ground' ? 'Ground Floor' : floor === 'second' ? 'Second Floor' : 'Third Floor';
}
