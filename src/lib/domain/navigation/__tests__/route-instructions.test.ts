import { describe, expect, it } from 'vitest';
import { buildRouteInstructions } from '../route-instructions';
import type { GraphData, RouteResult } from '../types';

const graph: GraphData = {
  nodes: [
    { id: 'start', floor: 'ground', x: 0, y: 0, kind: 'entrance', label: 'Main Entrance' },
    { id: 'g1', floor: 'ground', x: 100, y: 0, kind: 'corridor', label: 'Hallway 1' },
    { id: 'g2', floor: 'ground', x: 100, y: 100, kind: 'corridor', label: 'Hallway 2' },
    { id: 'g-stairs', floor: 'ground', x: 100, y: 160, kind: 'stairs', label: 'East Stairs' },
    { id: '2-stairs', floor: 'second', x: 100, y: 160, kind: 'stairs', label: 'East Stairs' },
    { id: '2a', floor: 'second', x: 220, y: 160, kind: 'corridor', label: 'Hallway 3' },
    { id: 'dest', floor: 'second', x: 260, y: 110, kind: 'door', label: 'MB 209 door' }
  ], edges: []
};

const route: RouteResult = { nodeIds: ['start', 'g1', 'g2', 'g-stairs', '2-stairs', '2a', 'dest'], totalCost: 1 };

describe('route instructions', () => {
  it('creates start, turns, floor changes, and arrival guidance', () => {
    const steps = buildRouteInstructions(graph, route, { destinationLabel: 'MB 209', startLabel: 'Main Entrance' });
    expect(steps[0].type).toBe('start');
    expect(steps.some((step) => step.type === 'turn-right')).toBe(true);
    const floorChange = steps.find((step) => step.type === 'change-floor');
    expect(floorChange?.title).toContain('East Stairs');
    expect(floorChange?.targetFloor).toBe('second');
    expect(steps.at(-1)?.title).toBe('Arrive at MB 209');
  });

  it('keeps every instruction associated with route node ids', () => {
    expect(buildRouteInstructions(graph, route).every((step) => step.nodeIds.length > 0)).toBe(true);
  });
});
