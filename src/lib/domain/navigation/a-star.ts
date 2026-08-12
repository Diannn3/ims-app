import { buildNodeIndex, getNeighbors } from './graph';
import type { GraphData, GraphNode, RouteResult } from './types';

function heuristic(a: GraphNode, b: GraphNode): number {
  const planar = Math.hypot(a.x - b.x, a.y - b.y);
  const floorPenalty = a.floor === b.floor ? 0 : 110;
  return planar + floorPenalty;
}

export function findRoute(graph: GraphData, startId: string, goalId: string): RouteResult | null {
  const nodeIndex = buildNodeIndex(graph);
  const start = nodeIndex.get(startId);
  const goal = nodeIndex.get(goalId);
  if (!start || !goal) return null;

  const open = new Set<string>([startId]);
  const cameFrom = new Map<string, string>();
  const gScore = new Map<string, number>([[startId, 0]]);
  const fScore = new Map<string, number>([[startId, heuristic(start, goal)]]);

  while (open.size > 0) {
    let currentId: string | undefined;
    let best = Number.POSITIVE_INFINITY;
    for (const id of open) {
      const score = fScore.get(id) ?? Number.POSITIVE_INFINITY;
      if (score < best) {
        best = score;
        currentId = id;
      }
    }
    if (!currentId) break;

    if (currentId === goalId) {
      const nodeIds = [currentId];
      while (cameFrom.has(currentId)) {
        currentId = cameFrom.get(currentId)!;
        nodeIds.unshift(currentId);
      }
      return { nodeIds, totalCost: gScore.get(goalId) ?? 0 };
    }

    open.delete(currentId);
    for (const { node: neighbor, edge } of getNeighbors(graph, currentId)) {
      const tentative = (gScore.get(currentId) ?? Number.POSITIVE_INFINITY) + edge.cost;
      if (tentative < (gScore.get(neighbor.id) ?? Number.POSITIVE_INFINITY)) {
        cameFrom.set(neighbor.id, currentId);
        gScore.set(neighbor.id, tentative);
        fScore.set(neighbor.id, tentative + heuristic(neighbor, goal));
        open.add(neighbor.id);
      }
    }
  }

  return null;
}
