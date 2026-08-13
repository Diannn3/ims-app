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
  '.env.example',
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
  '.github/workflows/database-tests.yml',
  'tsconfig.domain.json',
  'src/lib/server/admin-errors.ts',
  'scripts/check-database-types.mjs',
  'supabase/migrations/009_integrity_privacy_hardening.sql'
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

const hooks = await text('src/hooks.server.ts');
assert(hooks.includes("X-Frame-Options', 'DENY"), 'Server security headers must block framing');
assert(hooks.includes("frame-ancestors 'none'"), 'Server CSP must block framing with frame-ancestors');
assert(hooks.includes("Permissions-Policy"), 'Server should emit an explicit Permissions-Policy');
assert(hooks.includes("isDynamicPublicRoute"), 'Dynamic academic SSR should have an explicit cache policy boundary');
assert(hooks.includes("Cache-Control', 'no-store'"), 'Dynamic academic SSR should be no-store until public snapshots exist');

const supabaseServer = await text('src/lib/server/supabase.ts');
assert(supabaseServer.includes('sb_secret_'), 'Supabase public config must reject new-format secret keys');
assert(supabaseServer.includes("role === 'service_role'"), 'Supabase public config must reject legacy service-role JWTs');
assert(supabaseServer.includes("url.protocol === 'https:'"), 'Hosted Supabase URLs must require HTTPS');

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

const migration009 = await text('supabase/migrations/009_integrity_privacy_hardening.sql');
assert(migration009.includes('public_faculty'), 'Public-safe faculty projection is missing');
assert(migration009.includes('public_faculty_notices'), 'Public-safe faculty notice projection is missing');
assert(migration009.includes('public_route_restrictions'), 'Public-safe route restriction projection is missing');
assert(migration009.includes('before update on public.consultation_hours'), 'Consultation content edits must pass through the full update guard');
assert(migration009.includes('nulls not distinct'), 'Source-record identity must treat NULL term IDs as equal');

const academicRepository = await text('src/lib/data-access/academic/repository.server.ts');
const forbiddenPublicBaseTables = [
  'spaces', 'academic_terms', 'courses', 'sections', 'section_meetings',
  'faculty_section_assignments', 'course_prerequisites', 'faculty_offices',
  'consultation_hours', 'faculty_research_areas', 'research_areas',
  'academic_services', 'academic_resources', 'academic_dates', 'academic_events', 'faculty'
];
for (const table of forbiddenPublicBaseTables) {
  assert(!academicRepository.includes(`.from('${table}')`), `Public academic repository must not query canonical ${table} directly`);
}
assert(academicRepository.includes(".from('public_faculty')"), 'Public academic repository is not wired to public_faculty');
assert(academicRepository.includes(".from('public_courses')"), 'Public academic repository is not wired to public_courses');
assert(academicRepository.includes(".from('public_sections')"), 'Public academic repository is not wired to public_sections');
assert(academicRepository.includes(".from('public_consultation_hours')"), 'Public academic repository is not wired to public_consultation_hours');

const csv = await text('src/lib/server/imports/csv.ts');
assert(csv.includes('sourceRecordKey'), 'CSV importer should support stable external source record keys');
assert(csv.includes('csv-parse/sync'), 'CSV importer should use a real CSV parser');
assert(csv.includes("issue.code === 'duplicate_source_row'"), 'Duplicate identical source rows must be skipped');
assert(!csv.includes('input.weekdays.join'), 'Fallback source identity must not change when meeting days change');


const packageJson = JSON.parse(await text('package.json'));
assert(packageJson.devDependencies?.supabase === '2.110.0', 'Project-local Supabase CLI must be pinned exactly');
assert(packageJson.engines?.node === '>=22.0.0', 'Project Node engine must exclude EOL Node 20');
assert(packageJson.scripts?.gate === 'node scripts/run-validation-gate.mjs', 'Cross-platform validation gate runner must be wired');
assert(packageJson.scripts?.['verify:sql-security'] === 'node scripts/verify-sql-security.mjs', 'Static SECURITY DEFINER verifier must be wired');
const sourceVisibility = await text('supabase/migrations/010_source_visibility_hardening.sql');
assert(sourceVisibility.includes('public_metadata boolean not null default false'), 'Source metadata must be public only by explicit opt-in');
assert(sourceVisibility.includes('where public_metadata = true'), 'Public provenance view must filter internal sources');
const scheduleIntegrity = await text('supabase/migrations/011_schedule_child_integrity.sql');
assert(scheduleIntegrity.includes('section_meeting_material_update_invalidate'), 'Material meeting mutations must invalidate reviewed schedules');
assert(scheduleIntegrity.includes('faculty_assignment_update_invalidate'), 'Instructor assignment mutations must invalidate reviewed schedules');
const atomicStaging = await text('supabase/migrations/012_atomic_import_staging.sql');
assert(atomicStaging.includes('stage_schedule_import_batch'), 'Schedule staging must use the atomic database RPC');
assert(atomicStaging.includes('revoke insert on table public.import_batches from authenticated'), 'Direct authenticated batch inserts must be revoked');
assert(atomicStaging.includes('revoke insert on table public.import_rows from authenticated'), 'Direct authenticated staging-row inserts must be revoked');
const stagingImmutability = await text('supabase/migrations/013_import_staging_immutability.sql');
assert(stagingImmutability.includes('revoke update, delete on table public.import_rows from authenticated'), 'Staged row content must be immutable through the Data API');
assert(stagingImmutability.includes('grant update (acknowledged_at, acknowledged_by)'), 'Issue updates must be acknowledgement-only');
const assignmentOwnership = await text('supabase/migrations/014_assignment_source_ownership.sql');
assert(assignmentOwnership.includes('faculty_section_assignment_sources'), 'Faculty assignments must retain many-to-many source ownership');
assert(assignmentOwnership.includes('import_managed'), 'Import-managed faculty assignments must be distinguishable from manual assignments');
assert(assignmentOwnership.includes('final import owner disappears'), 'Faculty assignment cleanup must preserve corroborating source owners');
const importPayloadIntegrity = await text('supabase/migrations/015_import_payload_integrity.sql');
assert(importPayloadIntegrity.includes('schedule_import_row_integrity_guard'), 'Database-side staging payload integrity guard is missing');
assert(importPayloadIntegrity.includes('import_rows_batch_actionable_source_key_uidx'), 'Actionable source identities must be unique inside a staged batch');
assert(importPayloadIntegrity.includes('staging_integrity_version'), 'Apply must distinguish batches staged before/after the database integrity boundary');
const officeIntegrity = await text('supabase/migrations/016_faculty_office_integrity.sql');
assert(officeIntegrity.includes('faculty_offices_identity_uidx'), 'Permanent/term-scoped faculty office identity must treat NULL terms as equal');
assert(officeIntegrity.includes('faculty_offices_one_primary_uidx'), 'Faculty office data must enforce at most one primary office per faculty/term');
const publicReadSurfaces = await text('supabase/migrations/017_public_read_surfaces.sql');
for (const viewName of [
  'public_spaces',
  'public_courses',
  'public_sections',
  'public_section_meetings',
  'public_faculty_offices',
  'public_faculty_section_assignments',
  'public_consultation_hours',
  'public_research_areas',
  'public_academic_services',
  'public_academic_resources',
  'public_academic_events',
  'public_academic_dates'
]) {
  assert(publicReadSurfaces.includes(`view public.${viewName}`), `Missing public-safe read surface: ${viewName}`);
}
assert(publicReadSurfaces.includes('revoke select on table public.courses from anon'), 'Anonymous clients must not query canonical courses directly');
assert(publicReadSurfaces.includes('alter default privileges for role postgres in schema public'), 'Future Data API objects must use explicit least-privilege grants');
const scheduleOccurrenceIntegrity = await text('supabase/migrations/018_schedule_occurrence_integrity.sql');
assert(scheduleOccurrenceIntegrity.includes('section_meetings_identity_uidx'), 'Exact duplicate section meeting occurrences must be impossible');
assert(scheduleOccurrenceIntegrity.includes('schedule_import_weekday_canonical_guard'), 'Schedule V1 weekdays must be canonicalized at the database boundary');
const spatialParentIntegrity = await text('supabase/migrations/019_spatial_parent_integrity.sql');
assert(spatialParentIntegrity.includes('spaces_floor_building_fkey'), 'Space floor/building parent consistency must be database-enforced');
assert(spatialParentIntegrity.includes('location_anchor_space_consistency_guard'), 'Location anchors must reject cross-floor/cross-building attached spaces');
const consultationTimeIntegrity = await text('supabase/migrations/020_consultation_time_integrity.sql');
assert(consultationTimeIntegrity.includes('consultation_time_requires_weekday'), 'Fixed consultation clock windows must require a weekday');
const seedSql = await text('supabase/seed.sql');
assert(seedSql.includes('public_metadata'), 'Synthetic seed source must declare whether its provenance is public');
assert(/Never treat these academic records as real UPLB data\.',\s*true/.test(seedSql), 'Synthetic demo source must be explicitly public for provenance tests');
assert(hooks.includes("Cache-Control', 'private, no-store"), 'Admin/auth responses must be marked no-store');
assert(hooks.includes("X-Content-Type-Options', 'nosniff"), 'Baseline nosniff header must be present');
const dbWorkflow = await text('.github/workflows/database-tests.yml');
assert(dbWorkflow.includes('version: 2.110.0'), 'Database CI must use the same pinned Supabase CLI version');

const seed = await text('supabase/seed.sql');
assert(seed.includes('Synthetic'), 'Development seed must visibly identify itself as synthetic');
assert(!/MATH\s*38/i.test(seed), 'Development seed should not fabricate a real MATH 38 offering');

const logoStat = await stat(join(root, 'static/brand/ims-mark.png'));
assert(logoStat.size > 1000, 'IMS mark asset appears empty or invalid');
notes.push(`IMS mark present (${logoStat.size} bytes)`);

const adminServerFiles = (await walk('src/routes/admin')).filter((file) => file.endsWith('+page.server.ts'));
for (const file of adminServerFiles) {
  const source = await text(file);
  assert(!/fail\([^\n]*\b(?:error|updateError|applyError|rejectError)\.message/.test(source), `${file} returns a raw database error message to the browser`);
}

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
