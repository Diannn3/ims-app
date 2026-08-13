import { readFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';

const root = process.cwd();
const failures = [];
const notes = [];

function fail(message) {
  failures.push(message);
}

async function walk(dir) {
  const absolute = join(root, dir);
  const entries = await readdir(absolute, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(absolute, entry.name);
    if (entry.isDirectory()) files.push(...await walk(relative(root, path)));
    else files.push(relative(root, path));
  }
  return files;
}

async function text(path) {
  return readFile(join(root, path), 'utf8');
}

const migrationFiles = (await readdir(join(root, 'supabase/migrations')))
  .filter((name) => /^\d{3}_.+\.sql$/.test(name))
  .sort();

const relations = new Set();
const functions = new Set();
for (const filename of migrationFiles) {
  const source = await text(`supabase/migrations/${filename}`);
  for (const match of source.matchAll(/create\s+(?:or\s+replace\s+)?(?:table|view)\s+(?:if\s+not\s+exists\s+)?public\.([a-zA-Z0-9_]+)/gi)) {
    relations.add(match[1]);
  }
  for (const match of source.matchAll(/create\s+(?:or\s+replace\s+)?function\s+public\.([a-zA-Z0-9_]+)\s*\(/gi)) {
    functions.add(match[1]);
  }
}

const sourceFiles = (await walk('src')).filter((path) => /\.(?:ts|js)$/.test(path));
let fromCalls = 0;
let rpcCalls = 0;
for (const path of sourceFiles) {
  const source = await text(path);
  for (const match of source.matchAll(/\.from\(\s*['"]([a-zA-Z0-9_]+)['"]\s*\)/g)) {
    fromCalls += 1;
    const relation = match[1];
    if (!relations.has(relation)) {
      fail(`${path} queries ${relation}, but no public table/view with that name is created by migrations.`);
    }
  }
  for (const match of source.matchAll(/\.rpc\(\s*['"]([a-zA-Z0-9_]+)['"]/g)) {
    rpcCalls += 1;
    const fn = match[1];
    if (!functions.has(fn)) {
      fail(`${path} calls RPC ${fn}, but no public function with that name is created by migrations.`);
    }
  }
}

// Public academic/search read paths must consume the curated public projections,
// never canonical tables with review/auth/provenance-only columns.
for (const path of [
  'src/lib/data-access/academic/repository.server.ts',
  'src/lib/data-access/search/repository.server.ts'
]) {
  const source = await text(path);
  for (const match of source.matchAll(/\.from\(\s*['"]([a-zA-Z0-9_]+)['"]\s*\)/g)) {
    const relation = match[1];
    if (!relation.startsWith('public_')) {
      fail(`${path} public read path queries canonical relation ${relation}; use an audited public_* projection instead.`);
    }
  }
  if (/\.or\(\s*`[^`]*\$\{/s.test(source)) {
    fail(`${path} interpolates user-controlled data into a raw PostgREST .or() expression.`);
  }
}

// The final public-read-surface migration must revoke anonymous base-table access.
const surfaceMigration = await text('supabase/migrations/017_public_read_surfaces.sql');
const canonicalPublicData = [
  'buildings', 'floors', 'spaces', 'space_aliases', 'location_anchors',
  'academic_terms', 'courses', 'course_aliases', 'course_prerequisites',
  'faculty', 'faculty_offices', 'sections', 'section_meetings',
  'faculty_section_assignments', 'consultation_hours', 'research_areas',
  'faculty_research_areas', 'academic_services', 'academic_resources',
  'academic_events', 'academic_dates'
];
for (const relation of canonicalPublicData) {
  if (!surfaceMigration.includes(`revoke select on table public.${relation} from anon;`)) {
    fail(`017_public_read_surfaces.sql must revoke anon SELECT on canonical ${relation}.`);
  }
}

notes.push(`${relations.size} public table/view names discovered from migrations`);
notes.push(`${functions.size} public RPC names discovered from migrations`);
notes.push(`${fromCalls} source .from() calls and ${rpcCalls} .rpc() calls checked`);

if (failures.length) {
  for (const message of failures) console.error(`[FAIL] ${message}`);
  console.error(`\nData-access contract verification failed with ${failures.length} error(s).`);
  process.exit(1);
}

console.log('Data-access contract verification passed.');
for (const note of notes) console.log(` - ${note}`);
console.log(' - public academic/search read paths use curated public_* surfaces');
console.log(' - no raw interpolated PostgREST .or() filter found in public read repositories');
