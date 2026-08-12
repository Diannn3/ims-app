export type FloorId = 'ground' | 'second' | 'third';

export interface GraphNode {
  id: string;
  floor: FloorId;
  x: number;
  y: number;
  kind: 'corridor' | 'stairs' | 'door' | 'entrance';
  label?: string;
}

export interface GraphEdge {
  from: string;
  to: string;
  cost: number;
  kind: 'corridor' | 'connector' | 'stairs' | 'door' | 'entrance';
  bidirectional: boolean;
  enabled: boolean;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface RouteResult {
  nodeIds: string[];
  totalCost: number;
}
