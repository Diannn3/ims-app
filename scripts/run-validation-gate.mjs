import { spawnSync } from 'node:child_process';
import process from 'node:process';
import { getLocalSupabaseStatus } from './lib/local-supabase.mjs';

const keepDb = process.argv.includes('--keep-db');
const skipE2E = process.argv.includes('--skip-e2e');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function runCommand(label, command, args, options = {}) {
  console.log(`\n=== ${label} ===`);
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    env: process.env,
    // Windows cannot spawn a .cmd shim through the native process API without
    // a shell. Keep the command explicit so this remains portable in CI.
    shell: process.platform === 'win32' && command.toLowerCase().endsWith('.cmd'),
    ...options
  });
  if (result.error) {
    console.error(`\nGate command could not start: ${result.error.message}`);
    return { ok: false, status: null };
  }
  return { ok: result.status === 0, status: result.status };
}

function run(label, args, options = {}) {
  return runCommand(label, npm, args, options);
}

function stopWith(message, code = 1) {
  console.error(`\nVALIDATION GATE STOPPED\n${message}`);
  process.exitCode = code;
}

let dbStarted = false;

try {
  const preflight = run('Environment preflight', ['run', 'doctor:strict']);
  if (!preflight.ok) {
    stopWith('Fix the doctor blockers before running the expensive integration gate. No database state was changed.');
    process.exit();
  }

  for (const [label, args] of [
    ['Static project/data invariants', ['run', 'verify']],
    ['Framework-free domain typecheck', ['run', 'check:domain']]
  ]) {
    const result = run(label, args);
    if (!result.ok) {
      stopWith(`${label} failed. Fix this before starting the local database.`);
      process.exit();
    }
  }

  const start = run('Start local Supabase', ['run', 'db:start']);
  if (!start.ok) {
    stopWith('The local Supabase stack could not start. Confirm Docker/Podman and the pinned project CLI are working.');
    process.exit();
  }
  dbStarted = true;

  for (const [label, args] of [
    ['Replay migrations and synthetic seed from zero', ['run', 'db:reset']],
    ['Database lint', ['run', 'db:lint']],
    ['pgTAP database security/integrity tests', ['run', 'test:db']]
  ]) {
    const result = run(label, args);
    if (!result.ok) {
      stopWith(`${label} failed. Treat the schema as unvalidated until it is fixed.`);
      process.exit();
    }
  }

  const typeDrift = run('Generated database type drift check', ['run', 'types:check']);
  if (!typeDrift.ok) {
    stopWith(
      'Generated database types differ from the replayed schema. This stop is intentional: review the drift, run `npm run types:db` only if the migration changes are expected, inspect the diff, then rerun the gate.',
      2
    );
    process.exit();
  }

  let localSupabase;
  try {
    localSupabase = getLocalSupabaseStatus();
  } catch (error) {
    stopWith(error instanceof Error ? error.message : 'Could not discover the local Supabase integration environment.');
    process.exit();
  }

  // Only browser-safe values are inherited by the application/build/browser test
  // processes. The service-role key stays scoped to the one fixture-seeding child.
  process.env.PUBLIC_SUPABASE_URL = localSupabase.apiUrl;
  process.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY = localSupabase.browserKey;

  const authSeed = runCommand(
    'Prepare local-only integration staff fixtures',
    process.execPath,
    ['scripts/seed-integration-auth.mjs'],
    {
      env: {
        ...process.env,
        LOCAL_SUPABASE_URL: localSupabase.apiUrl,
        LOCAL_SUPABASE_SECRET_KEY: localSupabase.elevatedKey
      }
    }
  );
  if (!authSeed.ok) {
    stopWith('Synthetic local staff fixtures could not be prepared. No hosted Supabase project should be used for this gate.');
    process.exit();
  }

  // Explicitly remove any elevated fixture secret from this parent process even if a
  // caller happened to define similarly named values before invoking the gate.
  delete process.env.LOCAL_SUPABASE_SECRET_KEY;
  delete process.env.LOCAL_SUPABASE_SERVICE_ROLE_KEY;

  for (const [label, args] of [
    ['Svelte + TypeScript checks', ['run', 'check']],
    ['Unit/domain tests', ['run', 'test:unit']],
    ['Production build', ['run', 'build']]
  ]) {
    const result = run(label, args);
    if (!result.ok) {
      stopWith(`${label} failed.`);
      process.exit();
    }
  }

  if (!skipE2E) {
    const e2e = run('Production-preview Playwright + seeded integration journeys', ['run', 'test:e2e'], {
      env: {
        ...process.env,
        CI: '1',
        INTEGRATION_SUPABASE: '1'
      }
    });
    if (!e2e.ok) {
      stopWith('Browser journeys failed. Install Chromium on a fresh machine with `npx playwright install --with-deps chromium`.');
      process.exit();
    }
  }

  console.log('\nVALIDATION GATE PASSED');
  console.log('Application, database, and seeded local-integration checks in this runner completed successfully.');
  if (skipE2E) console.log('Note: --skip-e2e was used, so this is not the full release gate.');
} finally {
  // Elevated local status material is not needed after test orchestration.
  delete process.env.LOCAL_SUPABASE_SECRET_KEY;
  delete process.env.LOCAL_SUPABASE_SECRET_KEY;
  delete process.env.LOCAL_SUPABASE_SERVICE_ROLE_KEY;
  if (dbStarted && !keepDb) {
    run('Stop local Supabase', ['run', 'db:stop']);
  } else if (dbStarted) {
    console.log('\nLocal Supabase left running because --keep-db was supplied.');
  }
}
