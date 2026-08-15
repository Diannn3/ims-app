import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';
import { getLocalSupabaseStatus } from './lib/local-supabase.mjs';

let url = process.env.LOCAL_SUPABASE_URL;
let elevatedKey = process.env.LOCAL_SUPABASE_SECRET_KEY || process.env.LOCAL_SUPABASE_SERVICE_ROLE_KEY;

if (!url || !elevatedKey) {
  try {
    const local = getLocalSupabaseStatus();
    url = local.apiUrl;
    elevatedKey = local.elevatedKey;
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Could not discover local Supabase fixture credentials.');
    process.exit(2);
  }
}

let parsedUrl;
try {
  parsedUrl = new URL(url);
} catch {
  console.error('LOCAL_SUPABASE_URL is not a valid URL.');
  process.exit(2);
}

if (!['127.0.0.1', 'localhost', '::1'].includes(parsedUrl.hostname)) {
  console.error(`Refusing to seed integration staff accounts against non-local Supabase host: ${parsedUrl.hostname}`);
  process.exit(3);
}

const fixtures = [
  {
    email: 'editor.integration@example.test',
    password: 'IMS-Local-Editor-2026!',
    displayName: 'Integration Editor',
    role: 'content_editor'
  },
  {
    email: 'admin.integration@example.test',
    password: 'IMS-Local-Admin-2026!',
    displayName: 'Integration Admin',
    role: 'admin'
  }
];

const fixtureRoles = new Set(['content_editor', 'admin']);

function localSupabaseBinary() {
  if (process.env.SUPABASE_BIN) return process.env.SUPABASE_BIN;

  const binary = join(
    process.cwd(),
    'node_modules',
    '.bin',
    process.platform === 'win32' ? 'supabase.cmd' : 'supabase'
  );

  if (!existsSync(binary)) {
    throw new Error('Project-local Supabase CLI is unavailable. Run npm install first.');
  }
  return binary;
}

function sqlLiteral(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function assignLocalProfile(userId, fixture) {
  if (!fixtureRoles.has(fixture.role)) {
    throw new Error(`Refusing unsupported integration fixture role: ${fixture.role}`);
  }

  const sql = `
    do $ims_fixture$
    begin
      update public.profiles
      set
        display_name = ${sqlLiteral(fixture.displayName)},
        role = ${sqlLiteral(fixture.role)}::public.app_role
      where user_id = ${sqlLiteral(userId)}::uuid;

      if not found then
        raise exception 'integration profile missing for user %', ${sqlLiteral(userId)};
      end if;
    end
    $ims_fixture$;
  `;

  const result = spawnSync(
    localSupabaseBinary(),
    ['db', 'query', '--local', '--agent=no', sql],
    {
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 20_000
    }
  );

  if (result.error) {
    throw new Error(`Could not run local profile fixture SQL: ${result.error.message}`);
  }
  if (result.status !== 0) {
    const detail = (result.stderr || result.stdout || '').trim();
    throw new Error(`Could not assign ${fixture.role} integration profile through local SQL: ${detail || `exit ${result.status}`}`);
  }
}

const supabase = createClient(url, elevatedKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
});

const { data: existingData, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
if (listError) {
  console.error(`Could not inspect local Auth users: ${listError.message}`);
  process.exit(1);
}

for (const fixture of fixtures) {
  let user = existingData.users.find((candidate) => candidate.email?.toLowerCase() === fixture.email);

  if (!user) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: fixture.email,
      password: fixture.password,
      email_confirm: true,
      user_metadata: { display_name: fixture.displayName, integration_fixture: true }
    });
    if (error || !data.user) {
      console.error(`Could not create ${fixture.role} integration user: ${error?.message ?? 'unknown error'}`);
      process.exit(1);
    }
    user = data.user;
  } else {
    const { error } = await supabase.auth.admin.updateUserById(user.id, {
      password: fixture.password,
      email_confirm: true,
      user_metadata: { display_name: fixture.displayName, integration_fixture: true }
    });
    if (error) {
      console.error(`Could not refresh ${fixture.role} integration user: ${error.message}`);
      process.exit(1);
    }
  }

  try {
    // Role is intentionally NOT writable through the public Data API. Integration
    // fixtures promote the local-only Auth users through the local Postgres admin
    // connection instead, preserving the production profile/RLS boundary.
    assignLocalProfile(user.id, fixture);
  } catch (error) {
    console.error(error instanceof Error ? error.message : `Could not assign ${fixture.role} integration profile.`);
    process.exit(1);
  }

  console.log(`Prepared local-only ${fixture.role} fixture ${fixture.email}.`);
}
