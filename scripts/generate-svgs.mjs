import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const building = JSON.parse(fs.readFileSync(path.join(root, 'src/lib/data/math-building/building.json'), 'utf8'));
const spaces = JSON.parse(fs.readFileSync(path.join(root, 'src/lib/data/math-building/spaces.json'), 'utf8'));

const floorNames = Object.fromEntries(building.floors.map((f) => [f.id, f.name]));
const outDir = path.join(root, 'static/maps/math-building');
fs.mkdirSync(outDir, { recursive: true });

const esc = (s = '') => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

for (const floor of building.floors) {
  const floorSpaces = spaces.filter((s) => s.floor === floor.id);
  const roomRects = floorSpaces.map((s) => {
    const g = s.geometry;
    const cls = `space space-${s.kind}`;
    let lines = [s.name];
    if (s.kind === 'stairs') lines = [s.name.replace(' Stairs',''), 'Stairs'];
    else if (s.kind === 'toilet') lines = [s.name.replace(' Toilet',''), 'Toilet'];
    else if (s.subtitle) lines.push(s.subtitle);
    const tx = g.x + g.width / 2;
    const ty = g.y + g.height / 2 - (lines.length - 1) * 10;
    const tspans = lines.map((line, i) => `<tspan x="${tx}" dy="${i === 0 ? 0 : 22}">${esc(line)}</tspan>`).join('');
    return `
      <g id="space-${s.id}" data-space-id="${s.id}" data-kind="${s.kind}">
        <rect class="${cls}" x="${g.x}" y="${g.y}" width="${g.width}" height="${g.height}" rx="16" />
        <text class="space-label" x="${tx}" y="${ty}" text-anchor="middle">${tspans}</text>
      </g>`;
  }).join('\n');

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${building.canvas.width} ${building.canvas.height}" role="img" aria-labelledby="title desc">
  <title id="title">Math Building — ${esc(floorNames[floor.id])}</title>
  <desc id="desc">Prototype semantic floor plan reconstructed from the provided orientation poster. Verify geometry on site before production routing.</desc>
  <style>
    :root { color-scheme: light; }
    .bg { fill: #f8f5ee; }
    .hallway { fill: #efe0a6; stroke: #c8a94c; stroke-width: 3; }
    .space { fill: #f8fbff; stroke: #172554; stroke-width: 5; }
    .space-service, .space-lab { fill: #e8eefc; }
    .space-toilet { fill: #f4f0ff; }
    .space-stairs, .space-entrance { fill: #edf1f7; }
    .space-label { fill: #172554; font-family: Inter, system-ui, sans-serif; font-weight: 750; font-size: 22px; pointer-events: none; }
    .space-stairs .space-label, .space-toilet .space-label, .space-entrance .space-label { font-size: 15px; }
    .floor-title { fill: #172554; font-family: Inter, system-ui, sans-serif; font-size: 34px; font-weight: 800; }
    .prototype { fill: #7c6f52; font-family: Inter, system-ui, sans-serif; font-size: 16px; }
  </style>
  <rect class="bg" width="1200" height="760" />
  <text class="floor-title" x="70" y="70">${esc(floorNames[floor.id])}</text>
  <text class="prototype" x="70" y="98">Schematic prototype — site verification required</text>
  <path class="hallway" d="M105 320 H1085 V445 H170 V420 H105 Z" opacity="0.92" />
  ${roomRects}
</svg>`;

  fs.writeFileSync(path.join(outDir, `${floor.id}.svg`), svg);
}
console.log(`Generated ${building.floors.length} SVG floorplans in ${outDir}`);
