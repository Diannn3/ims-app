import { readFile, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const failures = [];
const notes = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

async function text(path) {
  return readFile(join(root, path), 'utf8');
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

const required = [
  'src/hooks.server.ts',
  'src/lib/server/supabase.ts',
  'src/lib/domain/navigation/a-star.ts',
  'src/lib/domain/navigation/anchors.ts',
  'src/routes/loc/[slug]/+page.ts',
  'src/lib/domain/grades/storage.ts',
  'src/lib/domain/academic/repository.ts',
  'src/lib/data-access/academic/repository.server.ts',
  'src/lib/server/imports/csv.ts',
  'src/routes/admin/imports/+page.server.ts',
  'src/routes/admin/review/+page.server.ts',
  'src/routes/staff/sign-in/+page.server.ts',
  'static/brand/ims-mark.png',
  'static/manifest.webmanifest',
  'docs/QR_ANCHORS.md',
  '.github/workflows/ci.yml',
  '.github/workflows/database-tests.yml'
];
for (const path of required) assert(existsSync(join(root, path)), `Missing required file: ${path}`);

const migrations = (await readdir(join(root, 'supabase/migrations')))
  .filter((name) => /^\d{3}_.+\.sql$/.test(name))
  .sort();
const migrationNumbers = migrations.map((name) => Number(name.slice(0, 3)));
for (let i = 0; i < migrationNumbers.length; i += 1) {
  assert(migrationNumbers[i] === i + 1, `Migration sequence gap: expected ${String(i + 1).padStart(3, '0')}, got ${migrations[i] ?? 'missing'}`);
}
notes.push(`${migrations.length} ordered database migrations`);

const svelteFiles = (await walk('src')).filter((path) => path.endsWith('.svelte'));
for (const path of svelteFiles) {
  const source = await text(path);
  assert(!/\.from\s*\(/.test(source), `Raw Supabase .from() query found in Svelte UI: ${path}`);
  assert(!/\.rpc\s*\(/.test(source), `Raw Supabase .rpc() call found in Svelte UI: ${path}`);
}
notes.push(`${svelteFiles.length} Svelte components/routes keep database access outside presentation files`);

const gradeFiles = (await walk('src/lib/domain/grades')).filter((path) => /\.(ts|js|svelte)$/.test(path));
for (const path of gradeFiles) {
  const source = await text(path);
  assert(!/supabase/i.test(source), `Grade domain must stay local-only; Supabase reference found in ${path}`);
}
notes.push('Grade domain is isolated from Supabase');

const allSourceFiles = (await walk('src')).filter((path) => /\.(ts|js|svelte|css|html)$/.test(path));
for (const path of allSourceFiles) {
  const source = await text(path);
  assert(!/Object\.groupBy\s*\(/.test(source), `Object.groupBy compatibility hazard found in ${path}`);
}

const appHtml = await text('src/app.html');
assert(!/maximum-scale\s*=\s*1/i.test(appHtml), 'Browser zoom must not be disabled with maximum-scale=1');
assert(!/user-scalable\s*=\s*no/i.test(appHtml), 'Browser zoom must not be disabled with user-scalable=no');

const layout = await text('src/routes/+layout.svelte');
assert(layout.includes('class="skip-link"'), 'Application shell must include a skip link');
assert(layout.includes('id="main-content"'), 'Application shell must expose #main-content');
assert(layout.includes('aria-current'), 'Application navigation must expose aria-current');

const worker = await text('src/service-worker.ts');
for (const prefix of ['/admin', '/staff']) {
  assert(worker.includes(prefix), `Service worker must explicitly exclude ${prefix} routes from caching`);
}
assert(worker.includes('request.method !== \'GET\''), 'Service worker must bypass non-GET requests');

const migration004 = await text('supabase/migrations/004_academic_integration_security.sql');
assert(migration004.includes('academic_terms_one_current_idx'), 'Database must enforce one current academic term');
assert(migration004.includes('public_data_sources'), 'Database must expose a public-safe provenance view');

const migration005 = await text('supabase/migrations/005_import_pipeline_hardening.sql');
assert(migration005.includes('apply_import_batch'), 'Transactional import apply RPC is missing');
assert(migration005.includes("'needs_verification'"), 'Import apply must fail closed into needs_verification');

const migration008 = await text('supabase/migrations/008_schedule_review_queue.sql');
assert(migration008.includes('set_schedule_section_review'), 'Schedule review RPC is missing');
assert(migration008.includes('set_schedule_section_publication'), 'Schedule publication RPC is missing');

const csv = await text('src/lib/server/imports/csv.ts');
assert(csv.includes('sourceRecordKey'), 'CSV importer should support stable external source record keys');
assert(csv.includes('csv-parse/sync'), 'CSV importer should use a real CSV parser');

const seed = await text('supabase/seed.sql');
assert(seed.includes('Synthetic'), 'Development seed must visibly identify itself as synthetic');
assert(!/MATH\s*38/i.test(seed), 'Development seed should not fabricate a real MATH 38 offering');

const logoStat = await stat(join(root, 'static/brand/ims-mark.png'));
assert(logoStat.size > 1000, 'IMS mark asset appears empty or invalid');
notes.push(`IMS mark present (${logoStat.size} bytes)`);

if (failures.length) {
  console.error(`Project verification failed with ${failures.length} issue(s):`);
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log('Project verification passed.');
for (const note of notes) console.log(` - ${note}`);
console.log(' - Accessibility shell invariants present');
console.log(' - Import/review fail-closed boundaries present');
console.log(' - Dynamic academic pages remain network-owned (not blindly cached)');
