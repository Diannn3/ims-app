import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const errors = [];
const warnings = [];
const migrationNames = readdirSync(resolve(process.cwd(), 'supabase/migrations'))
  .filter((name) => /^\d{3}_.+\.sql$/.test(name))
  .sort();
const migrationRange = migrationNames.length
  ? `001-${migrationNames.at(-1).slice(0, 3)}`
  : 'no-migrations';

function read(path) {
  return readFileSync(resolve(root, path), 'utf8');
}

function fail(message) {
  errors.push(message);
}

function warn(message) {
  warnings.push(message);
}

function expectText(source, needle, label) {
  if (!source.includes(needle)) fail(`${label}: expected to find ${JSON.stringify(needle)}`);
}

function expectOrder(source, first, second, label) {
  const a = source.indexOf(first);
  const b = source.indexOf(second);
  if (a < 0 || b < 0) {
    fail(`${label}: missing ${a < 0 ? JSON.stringify(first) : JSON.stringify(second)}`);
    return;
  }
  if (a >= b) fail(`${label}: ${JSON.stringify(first)} must appear before ${JSON.stringify(second)}`);
}

const pkg = JSON.parse(read('package.json'));
const allDependencies = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
const exactVersion = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

if (pkg.engines?.node !== '>=22.0.0') {
  fail(`package.json engines.node must remain >=22.0.0; found ${JSON.stringify(pkg.engines?.node)}`);
}

for (const [name, version] of Object.entries(allDependencies)) {
  if (!exactVersion.test(version)) {
    fail(`dependency ${name} must use an exact version during the pre-lock validation phase; found ${version}`);
  }
}

for (const script of [
  'verify',
  'verify:data',
  'verify:project',
  'verify:seed-map',
  'verify:pgtap-plans',
  'verify:sql-security',
  'verify:syntax',
  'verify:imports',
  'verify:web-safety',
  'verify:secrets',
  'verify:lock',
  'verify:gate-config',
  'check:domain',
  'check',
  'test:unit',
  'test:db',
  'test:e2e',
  'build',
  'types:check',
  'db:lint',
  'gate'
]) {
  if (!pkg.scripts?.[script]) fail(`package.json is missing required gate script ${script}`);
}

if (!pkg.scripts?.verify?.includes('verify:pgtap-plans')) {
  fail('npm run verify must include verify:pgtap-plans');
}
if (!pkg.scripts?.verify?.includes('verify:seed-map')) {
  fail('npm run verify must include verify:seed-map');
}
if (!pkg.scripts?.verify?.includes('verify:gate-config')) {
  fail('npm run verify must include verify:gate-config');
}
if (!pkg.scripts?.verify?.includes('verify:imports')) {
  fail('npm run verify must include verify:imports');
}
if (!pkg.scripts?.verify?.includes('verify:web-safety')) {
  fail('npm run verify must include verify:web-safety');
}
if (!pkg.scripts?.verify?.includes('verify:secrets')) {
  fail('npm run verify must include verify:secrets');
}

const lockReviewCi = read('.github/workflows/dependency-lock-review.yml');
expectText(lockReviewCi, 'workflow_dispatch:', 'lockfile review is explicitly manual');
expectText(lockReviewCi, 'npm install --package-lock-only --ignore-scripts --no-audit --no-fund', 'lockfile review real-registry resolution without lifecycle scripts');
expectText(lockReviewCi, 'scripts/verify-lockfile.mjs', 'lockfile review root-pin verification');
expectText(lockReviewCi, 'package-lock.json', 'lockfile review artifact');

const appCi = read('.github/workflows/ci.yml');
expectText(appCi, 'node-version: 22', 'app CI Node pin');
expectText(appCi, 'npm run verify', 'app CI static gate');
expectText(appCi, 'npm run check:domain', 'app CI domain typecheck');
expectText(appCi, 'npm run check', 'app CI Svelte check');
expectText(appCi, 'npm run test:unit', 'app CI unit tests');
expectText(appCi, 'npm run build', 'app CI production build');
expectText(appCi, 'npx playwright install --with-deps chromium', 'app CI Chromium-only browser install');
expectText(appCi, 'npm run test:e2e', 'app CI browser test');
expectText(appCi, 'playwright-report', 'app CI browser report artifact');
expectText(appCi, 'test-results', 'app CI browser trace/screenshot artifact');
expectOrder(appCi, 'npm run build', 'npm run test:e2e', 'app CI release-smoke ordering');

const dbCiPath = existsSync(resolve(root, '.github/workflows/database-tests.yml'))
  ? '.github/workflows/database-tests.yml'
  : '.github/workflows/db-tests.yml';
const dbCi = read(dbCiPath);
expectText(dbCi, 'supabase start', 'database CI local stack');
expectText(dbCi, 'supabase db reset', 'database CI migration replay');
expectText(dbCi, 'supabase db lint', 'database CI lint');
expectText(dbCi, 'supabase test db', 'database CI pgTAP');
expectText(dbCi, 'check-database-types.mjs', 'database CI generated type drift');
expectText(dbCi, 'validation-evidence/database.types.generated.ts', 'database CI generated-type review artifact');

const supabaseCliVersion = allDependencies.supabase;
if (!supabaseCliVersion) {
  fail('package.json must pin the Supabase CLI as a devDependency');
} else {
  const workflowPin = dbCi.match(/^\s+version:\s*['"]?([^'"\s]+)['"]?/im)?.[1];
  if (!workflowPin) fail('database CI must explicitly pin supabase/setup-cli version');
  else if (workflowPin !== supabaseCliVersion) {
    fail(`Supabase CLI drift: package.json=${supabaseCliVersion}, database CI=${workflowPin}`);
  }
}

const integrationCi = read('.github/workflows/integration-gate.yml');
expectText(integrationCi, 'node-version: 22', 'integration CI Node pin');
expectText(integrationCi, 'supabase start', 'integration CI local stack');
expectText(integrationCi, 'supabase db reset', 'integration CI migration/seed replay');
expectText(integrationCi, 'scripts/export-local-supabase-public-env.mjs', 'integration CI browser-safe local credential discovery');
expectText(integrationCi, 'GITHUB_ENV', 'integration CI browser-safe environment handoff');
expectText(integrationCi, 'scripts/seed-integration-auth.mjs', 'integration CI local-only staff fixtures');
expectText(integrationCi, 'npm run verify', 'integration CI static gate');
expectText(integrationCi, 'supabase test db', 'integration CI pgTAP gate');
expectText(integrationCi, 'check-database-types.mjs', 'integration CI generated type drift');
expectText(integrationCi, 'npm run build', 'integration CI production build');
expectText(integrationCi, 'tests/e2e/integration.spec.ts', 'integration CI seeded browser journey');
expectText(integrationCi, 'INTEGRATION_SUPABASE', 'integration CI explicit integration opt-in');
expectText(integrationCi, 'validation-evidence/integration-gate.json', 'integration CI evidence artifact');
expectText(integrationCi, 'validation-evidence/database.types.generated.ts', 'integration CI generated-type review artifact');
expectOrder(integrationCi, 'npm run build', 'tests/e2e/integration.spec.ts', 'integration CI release-smoke ordering');
if (/SERVICE_ROLE_KEY[^\n]*GITHUB_ENV|SECRET_KEY[^\n]*GITHUB_ENV/i.test(integrationCi)) {
  fail('integration CI must never persist an elevated local key into GITHUB_ENV');
}
if (/eval\s+["']?\$\(supabase\s+status/i.test(integrationCi)) {
  fail('integration CI should use the machine-readable local Supabase helper instead of shell-evaluating status output');
}
const integrationWorkflowPin = integrationCi.match(/^\s+version:\s*['"]?([^'"\s]+)['"]?/im)?.[1];
if (supabaseCliVersion && integrationWorkflowPin && integrationWorkflowPin !== supabaseCliVersion) {
  fail(`Supabase CLI drift: package.json=${supabaseCliVersion}, integration CI=${integrationWorkflowPin}`);
}

const integrationSpec = read('tests/e2e/integration.spec.ts');
expectText(integrationSpec, 'Apply reviewed batch', 'integration governance admin apply');
expectText(integrationSpec, 'Verify schedule', 'integration governance editor verification');
expectText(integrationSpec, 'Only administrators can publish.', 'integration governance editor publication denial');
expectText(integrationSpec, 'Schedule published.', 'integration governance explicit admin publication');
expectText(integrationSpec, 'await signOut(page)', 'integration governance anonymous boundary checks');
expectText(integrationSpec, "page.goto('/course/DEMO%20101')", 'integration public academic read model');
expectText(integrationSpec, 'governance-', 'integration run-specific source identity');

const integrationSeed = read('scripts/seed-integration-auth.mjs');
expectText(integrationSeed, "['127.0.0.1', 'localhost', '::1']", 'integration auth local-host guard');
expectText(integrationSeed, 'LOCAL_SUPABASE_SECRET_KEY', 'integration auth preferred elevated-key input');
expectText(integrationSeed, 'LOCAL_SUPABASE_SERVICE_ROLE_KEY', 'integration auth legacy elevated-key fallback');
expectText(integrationSeed, 'getLocalSupabaseStatus()', 'integration auth machine-readable local credential fallback');
expectText(integrationSeed, 'persistSession: false', 'integration auth server-only client');

const publicLocalEnv = read('scripts/export-local-supabase-public-env.mjs');
expectText(publicLocalEnv, 'getLocalSupabaseStatus()', 'integration browser environment local-status helper');
expectText(publicLocalEnv, 'PUBLIC_SUPABASE_URL', 'integration browser environment API URL');
expectText(publicLocalEnv, 'PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'integration browser environment low-privilege key');
if (/elevatedKey|serviceRoleKey|SERVICE_ROLE_KEY|SECRET_KEY/.test(publicLocalEnv)) {
  fail('browser environment exporter must never read or emit an elevated local key');
}

const localSupabaseHelper = read('scripts/lib/local-supabase.mjs');
expectText(localSupabaseHelper, "['status', '-o', 'json']", 'local gate machine-readable Supabase status');
expectText(localSupabaseHelper, "['127.0.0.1', 'localhost', '::1']", 'local gate loopback-only Supabase guard');
expectText(localSupabaseHelper, "['PUBLISHABLE_KEY', 'SUPABASE_PUBLISHABLE_KEY', 'ANON_KEY', 'SUPABASE_ANON_KEY']", 'local gate browser-key fallback');
expectText(localSupabaseHelper, "['SECRET_KEY', 'SUPABASE_SECRET_KEY', 'SERVICE_ROLE_KEY', 'SUPABASE_SERVICE_ROLE_KEY']", 'local gate elevated-key fallback');

const localGate = read('scripts/run-validation-gate.mjs');
expectText(localGate, 'getLocalSupabaseStatus()', 'local gate Supabase environment discovery');
expectText(localGate, 'PUBLIC_SUPABASE_URL', 'local gate application Supabase URL');
expectText(localGate, 'PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'local gate browser-safe key');
expectText(localGate, 'scripts/seed-integration-auth.mjs', 'local gate staff fixture preparation');
expectText(localGate, "CI: '1'", 'local gate production-preview Playwright mode');
expectText(localGate, "INTEGRATION_SUPABASE: '1'", 'local gate seeded integration opt-in');
expectOrder(localGate, "['run', 'build']", "['run', 'test:e2e']", 'local gate build-before-browser ordering');
if (/process\.env\.LOCAL_SUPABASE_(?:SECRET_KEY|SERVICE_ROLE_KEY)\s*=/.test(localGate)) {
  fail('local gate must not persist the service-role key into the parent process environment');
}

const playwright = read('playwright.config.ts');
expectText(playwright, "const isCI = Boolean(process.env.CI)", 'Playwright CI mode');
expectText(playwright, "workers: isCI ? 1 : undefined", 'Playwright deterministic CI worker count');
expectText(playwright, "'npm run preview -- --host 127.0.0.1 --port 5173'", 'Playwright production preview in CI');
expectText(playwright, 'reuseExistingServer: !isCI', 'Playwright local server reuse');
expectText(playwright, "trace: 'on-first-retry'", 'Playwright trace evidence');
expectText(playwright, "screenshot: 'only-on-failure'", 'Playwright screenshot evidence');
expectText(playwright, "video: 'retain-on-failure'", 'Playwright video evidence');

const databaseTypesPath = resolve(root, 'src/lib/database.types.ts');
if (!existsSync(databaseTypesPath)) {
  warn(`src/lib/database.types.ts is not present yet. This must be generated from a successfully replayed local schema after migrations ${migrationRange}; the full database/integration gate must remain red until that generated artifact is reviewed and committed.`);
}

const databaseTypesCheck = read('scripts/check-database-types.mjs');
expectText(databaseTypesCheck, "const committedPath = 'src/lib/database.types.ts'", 'generated database type target');
expectText(databaseTypesCheck, 'has not been generated for the current migration set', 'generated database type missing-file fail-closed guard');
expectText(databaseTypesCheck, "['gen', 'types', 'typescript', '--local']", 'generated database type local schema source');
expectText(databaseTypesCheck, 'preserveGeneratedEvidence()', 'generated database type review artifact on drift');
expectText(databaseTypesCheck, 'validation-evidence', 'generated database type evidence directory');

const lockPath = resolve(root, 'package-lock.json');
if (!existsSync(lockPath)) {
  warn('package-lock.json is not present yet. Exact top-level pins reduce direct drift, but the dependency tree is not reproducible until a reviewed lockfile is committed and CI switches to npm ci.');
} else {
  const lock = JSON.parse(read('package-lock.json'));
  const rootPackage = lock.packages?.[''];
  if (!rootPackage) {
    fail('package-lock.json does not contain packages[""] root metadata');
  } else {
    for (const group of ['dependencies', 'devDependencies']) {
      for (const [name, expected] of Object.entries(pkg[group] ?? {})) {
        const actual = rootPackage[group]?.[name];
        if (actual !== expected) {
          fail(`lockfile root ${group}.${name}=${JSON.stringify(actual)} does not match package.json=${JSON.stringify(expected)}`);
        }
      }
    }
  }

  if (appCi.includes('npm install --no-audit --no-fund')) {
    fail('package-lock.json exists, so application CI must use npm ci instead of npm install');
  }
  if (!appCi.includes('npm ci')) fail('package-lock.json exists, but application CI does not run npm ci');
  if (integrationCi.includes('npm install --no-audit --no-fund')) {
    fail('package-lock.json exists, so integration CI must use npm ci instead of npm install');
  }
  if (!integrationCi.includes('npm ci')) fail('package-lock.json exists, but integration CI does not run npm ci');
}

for (const message of warnings) console.warn(`[WARN] ${message}`);

if (errors.length) {
  for (const message of errors) console.error(`[FAIL] ${message}`);
  console.error(`\nGate configuration verification failed with ${errors.length} error(s).`);
  process.exit(1);
}

console.log(`Gate configuration verification passed${warnings.length ? ` with ${warnings.length} warning(s)` : ''}.`);
console.log(' - exact top-level dependency pins are enforced');
console.log(' - app CI builds before Playwright release smoke journeys');
console.log(' - database CI replays/lints/tests migrations and checks generated types');
console.log(' - Playwright CI uses production preview, deterministic workers, and failure evidence');
console.log(' - seeded integration CI replays Supabase and exercises academic/auth browser paths without persisting an elevated local key');
console.log(' - local validation gate mirrors the seeded production-preview path with loopback-only elevated fixture credentials');
