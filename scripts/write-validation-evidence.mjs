import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import process from 'node:process';

const kindArg = process.argv.find((value) => value.startsWith('--kind='));
const kind = kindArg?.split('=')[1] ?? 'app';
if (!['app', 'database', 'integration'].includes(kind)) {
  console.error('Usage: node scripts/write-validation-evidence.mjs --kind=app|database|integration');
  process.exit(2);
}

function sha256(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function command(commandName, args = []) {
  const result = spawnSync(commandName, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  return result.status === 0 ? result.stdout.trim() : null;
}

const root = process.cwd();
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const migrationsDir = resolve(root, 'supabase/migrations');
const migrations = readdirSync(migrationsDir)
  .filter((name) => name.endsWith('.sql'))
  .sort()
  .map((name) => ({ name, sha256: sha256(join(migrationsDir, name)) }));

const gitSha = process.env.GITHUB_SHA || command('git', ['rev-parse', 'HEAD']);
const gitDirty = process.env.GITHUB_ACTIONS
  ? false
  : Boolean(command('git', ['status', '--porcelain']));

const evidence = {
  schemaVersion: 1,
  kind,
  conclusion: process.env.CI ? 'ci-gate-passed-to-evidence-step' : 'local-evidence-snapshot',
  generatedAt: new Date().toISOString(),
  repository: process.env.GITHUB_REPOSITORY ?? null,
  commit: gitSha,
  ref: process.env.GITHUB_REF ?? null,
  runId: process.env.GITHUB_RUN_ID ?? null,
  runAttempt: process.env.GITHUB_RUN_ATTEMPT ?? null,
  node: process.version,
  npm: command(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['--version']),
  package: {
    name: pkg.name,
    version: pkg.version,
    engines: pkg.engines,
    dependencies: pkg.dependencies,
    devDependencies: pkg.devDependencies,
    lockfilePresent: (() => {
      try {
        readFileSync(resolve(root, 'package-lock.json'));
        return true;
      } catch {
        return false;
      }
    })()
  },
  source: {
    dirtyWorkingTree: gitDirty,
    packageJsonSha256: sha256(resolve(root, 'package.json')),
    playwrightConfigSha256: sha256(resolve(root, 'playwright.config.ts')),
    ...(kind === 'integration'
      ? {
          integrationWorkflowSha256: sha256(resolve(root, '.github/workflows/integration-gate.yml')),
          integrationSpecSha256: sha256(resolve(root, 'tests/e2e/integration.spec.ts')),
          integrationAuthSeedSha256: sha256(resolve(root, 'scripts/seed-integration-auth.mjs')),
          localGateSha256: sha256(resolve(root, 'scripts/run-validation-gate.mjs'))
        }
      : {}),
    migrations
  },
  meaning:
    process.env.CI
      ? kind === 'app'
        ? 'The configured app CI reaches this step only after static checks, type checks, unit tests, the production build, and Playwright smoke journeys pass.'
        : kind === 'database'
          ? 'The configured database CI reaches this step only after local-stack startup, migration reset, lint, pgTAP tests, and the committed generated-type check pass.'
          : 'The configured integration CI reaches this step only after a seeded local Supabase replay, database checks, production build, and seeded browser integration journeys pass.'
      : 'Local evidence snapshot only. Running this script manually does not prove the full validation gate passed.'
};

const outputDir = resolve(root, 'validation-evidence');
mkdirSync(outputDir, { recursive: true });
const outputPath = join(outputDir, `${kind}-gate.json`);
writeFileSync(outputPath, `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
console.log(`Wrote ${basename(outputPath)} for ${gitSha ?? 'unknown commit'}.`);
