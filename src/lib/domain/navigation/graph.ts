import type { GraphData, GraphEdge, GraphNode } from './types';

export interface Neighbor {
  node: GraphNode;
  edge: GraphEdge;
}

export function buildNodeIndex(graph: GraphData): Map<string, GraphNode> {
  return new Map(graph.nodes.map((node) => [node.id, node]));
}

export function getNeighbors(graph: GraphData, nodeId: string): Neighbor[] {
  const nodes = buildNodeIndex(graph);
  const out: Neighbor[] = [];

  for (const edge of graph.edges) {
    if (!edge.enabled) continue;
    if (edge.from === nodeId) {
      const node = nodes.get(edge.to);
      if (node) out.push({ node, edge });
    }
    if (edge.bidirectional && edge.to === nodeId) {
      const node = nodes.get(edge.from);
      if (node) out.push({ node, edge });
    }
  }

  return out;
}
