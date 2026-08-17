import type { FloorId, GraphData, GraphNode, RouteResult } from './types';

export type RouteInstructionType = 'start' | 'walk' | 'turn-left' | 'turn-right' | 'change-floor' | 'arrive';

export type RouteInstruction = {
  id: string;
  type: RouteInstructionType;
  floor: FloorId;
  targetFloor?: FloorId;
  title: string;
  detail?: string;
  nodeIds: string[];
  distance?: number;
};

const FLOOR_NAME: Record<FloorId, string> = {
  ground: 'Ground Floor',
  second: 'Second Floor',
  third: 'Third Floor'
};

function distance(a: GraphNode, b: GraphNode) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function routeDistance(nodes: GraphNode[]) {
  return nodes.slice(1).reduce((total, node, index) => total + distance(nodes[index], node), 0);
}

function cleanLabel(label: string | undefined, fallback: string) {
  return (label ?? fallback).replace(/\s+door$/i, '').trim();
}

function turnType(previous: GraphNode, current: GraphNode, next: GraphNode): 'turn-left' | 'turn-right' | null {
  const ax = current.x - previous.x;
  const ay = current.y - previous.y;
  const bx = next.x - current.x;
  const by = next.y - current.y;
  const lenA = Math.hypot(ax, ay);
  const lenB = Math.hypot(bx, by);
  if (lenA < 1 || lenB < 1) return null;

  const dot = (ax * bx + ay * by) / (lenA * lenB);
  const angle = Math.acos(Math.max(-1, Math.min(1, dot))) * (180 / Math.PI);
  if (angle < 38) return null;
  const cross = ax * by - ay * bx;
  return cross >= 0 ? 'turn-right' : 'turn-left';
}

function stairsLabel(from: GraphNode, to: GraphNode) {
  const candidate = from.kind === 'stairs' ? from : to.kind === 'stairs' ? to : from;
  return cleanLabel(candidate.label, 'stairs');
}

export function buildRouteInstructions(
  graph: GraphData,
  route: RouteResult,
  options: { destinationLabel?: string; startLabel?: string } = {}
): RouteInstruction[] {
  const index = new Map(graph.nodes.map((node) => [node.id, node]));
  const nodes = route.nodeIds.map((id) => index.get(id)).filter((node): node is GraphNode => Boolean(node));
  if (!nodes.length) return [];

  const destinationLabel = options.destinationLabel ?? cleanLabel(nodes.at(-1)?.label, 'destination');
  const startLabel = options.startLabel ?? cleanLabel(nodes[0].label, 'route origin');
  const instructions: RouteInstruction[] = [{
    id: 'route-start', type: 'start', floor: nodes[0].floor,
    title: `Start at ${startLabel}`, detail: `Begin on the ${FLOOR_NAME[nodes[0].floor]}.`, nodeIds: [nodes[0].id]
  }];

  let runStart = 0;
  let sequence = 1;
  const flushWalk = (endIndex: number) => {
    if (endIndex <= runStart) return;
    const walkNodes = nodes.slice(runStart, endIndex + 1);
    if (walkNodes.some((node) => node.floor !== walkNodes[0].floor)) return;
    instructions.push({
      id: `walk-${sequence++}`, type: 'walk', floor: walkNodes[0].floor,
      title: endIndex === nodes.length - 1 ? `Continue toward ${destinationLabel}` : 'Continue along the corridor',
      detail: `Stay on the ${FLOOR_NAME[walkNodes[0].floor]}.`, nodeIds: walkNodes.map((node) => node.id),
      distance: Math.round(routeDistance(walkNodes))
    });
  };

  for (let i = 1; i < nodes.length; i += 1) {
    const previous = nodes[i - 1];
    const current = nodes[i];
    if (previous.floor !== current.floor) {
      flushWalk(i - 1);
      instructions.push({
        id: `floor-${sequence++}`, type: 'change-floor', floor: previous.floor, targetFloor: current.floor,
        title: `Take ${stairsLabel(previous, current)} to the ${FLOOR_NAME[current.floor]}`,
        detail: 'Use the marked stair transition, then continue on the next floor.', nodeIds: [previous.id, current.id]
      });
      runStart = i;
      continue;
    }

    const next = nodes[i + 1];
    if (!next || next.floor !== current.floor) continue;
    const turn = turnType(previous, current, next);
    if (!turn) continue;
    flushWalk(i);
    instructions.push({
      id: `turn-${sequence++}`, type: turn, floor: current.floor,
      title: turn === 'turn-left' ? 'Turn left' : 'Turn right',
      detail: `Continue on the ${FLOOR_NAME[current.floor]}.`, nodeIds: [previous.id, current.id, next.id]
    });
    runStart = i;
  }

  flushWalk(nodes.length - 1);
  const last = nodes[nodes.length - 1];
  instructions.push({
    id: 'route-arrive', type: 'arrive', floor: last.floor,
    title: `Arrive at ${destinationLabel}`, detail: `Your destination is on the ${FLOOR_NAME[last.floor]}.`, nodeIds: [last.id]
  });
  return instructions.filter((instruction, index, list) => {
    if (instruction.type !== 'walk' || index === 0) return true;
    const previous = list[index - 1];
    return previous.type !== 'walk' || previous.nodeIds.join('|') !== instruction.nodeIds.join('|');
  });
}
