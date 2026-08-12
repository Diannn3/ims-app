import type { GraphData, GraphNode, RouteResult } from './types';

export interface RouteFloorSegment {
  floor: GraphNode['floor'];
  points: GraphNode[];
}

export function splitRouteByFloor(graph: GraphData, route: RouteResult): RouteFloorSegment[] {
  const index = new Map(graph.nodes.map((n) => [n.id, n]));
  const segments: RouteFloorSegment[] = [];

  for (const nodeId of route.nodeIds) {
    const node = index.get(nodeId);
    if (!node) continue;
    const last = segments.at(-1);
    if (!last || last.floor !== node.floor) {
      segments.push({ floor: node.floor, points: [node] });
    } else {
      last.points.push(node);
    }
  }

  return segments;
}
