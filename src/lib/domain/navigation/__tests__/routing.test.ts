import { describe, expect, it } from 'vitest';
import graphData from '$lib/data/math-building/graph.json';
import { findRoute } from '../a-star';
import { splitRouteByFloor } from '../route-builder';
import type { GraphData } from '../types';

describe('building routing', () => {
  it('routes from the main entrance to MB 304 across all three floors', () => {
    const graph = graphData as GraphData;
    const route = findRoute(graph, 'gf-main-entrance', 'mb304-door');

    expect(route).not.toBeNull();
    expect(splitRouteByFloor(graph, route!).map((segment) => segment.floor)).toEqual([
      'ground',
      'second',
      'third'
    ]);
  });
});
