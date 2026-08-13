import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const dataDir = path.join(root, 'src/lib/data/math-building');
const spaces = JSON.parse(fs.readFileSync(path.join(dataDir, 'spaces.json'), 'utf8'));
const graph = JSON.parse(fs.readFileSync(path.join(dataDir, 'graph.json'), 'utf8'));
const nodeIndex = new Map(graph.nodes.map((n) => [n.id, n]));
const errors = [];

for (const edge of graph.edges) {
  if (!nodeIndex.has(edge.from)) errors.push(`Missing edge.from node ${edge.from}`);
  if (!nodeIndex.has(edge.to)) errors.push(`Missing edge.to node ${edge.to}`);
  if (!(edge.cost >= 0)) errors.push(`Invalid edge cost ${edge.from} -> ${edge.to}`);
}
for (const space of spaces) {
  if (space.entryNode && !nodeIndex.has(space.entryNode)) errors.push(`${space.id} has missing entryNode ${space.entryNode}`);
  if (space.doorNode && !nodeIndex.has(space.doorNode)) errors.push(`${space.id} has missing doorNode ${space.doorNode}`);
}

const adjacency = new Map(graph.nodes.map((node) => [node.id, []]));
for (const edge of graph.edges) {
  if (!edge.enabled) continue;
  adjacency.get(edge.from)?.push(edge.to);
  if (edge.bidirectional) adjacency.get(edge.to)?.push(edge.from);
}

const canonicalStart = 'gf-main-entrance';
if (!nodeIndex.has(canonicalStart)) {
  errors.push(`Missing canonical route-validation anchor ${canonicalStart}`);
} else {
  const reachable = new Set([canonicalStart]);
  const pending = [canonicalStart];
  while (pending.length) {
    const current = pending.pop();
    for (const neighbor of adjacency.get(current) ?? []) {
      if (reachable.has(neighbor)) continue;
      reachable.add(neighbor);
      pending.push(neighbor);
    }
  }

  for (const space of spaces) {
    const routingNode = space.doorNode ?? space.entryNode;
    if (routingNode && !reachable.has(routingNode)) {
      errors.push(`${space.id} routing node ${routingNode} is unreachable from ${canonicalStart}`);
    }
  }

  if (reachable.size !== graph.nodes.length) {
    const unreachable = graph.nodes.filter((node) => !reachable.has(node.id)).map((node) => node.id);
    errors.push(`Navigation graph has ${unreachable.length} unreachable node(s): ${unreachable.join(', ')}`);
  }
}

const ids = spaces.map((s) => s.id);
if (new Set(ids).size !== ids.length) errors.push('Duplicate space IDs detected');

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`OK: ${spaces.length} spaces, ${graph.nodes.length} graph nodes, ${graph.edges.length} graph edges.`);
console.log('All space routing references resolve and every graph node is connected to the main-entrance anchor.');
console.log('Geometry remains site-unverified by design.');
