import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import process from 'node:process';

function localSupabaseBinary() {
  if (process.env.SUPABASE_BIN) return process.env.SUPABASE_BIN;
  return join(
    process.cwd(),
    'node_modules',
    '.bin',
    process.platform === 'win32' ? 'supabase.cmd' : 'supabase'
  );
}

function requireString(object, names) {
  for (const name of names) {
    const value = object?.[name];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

export function getLocalSupabaseStatus() {
  const binary = localSupabaseBinary();
  if (!process.env.SUPABASE_BIN && !existsSync(binary)) {
    throw new Error('Project-local Supabase CLI is unavailable. Run npm install first.');
  }

  const result = spawnSync(binary, ['status', '-o', 'json'], {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 20_000,
    shell: process.platform === 'win32' && binary.toLowerCase().endsWith('.cmd')
  });

  if (result.error) throw new Error(`Could not run Supabase CLI: ${result.error.message}`);
  if (result.status !== 0) {
    throw new Error(`Could not read local Supabase status: ${(result.stderr || result.stdout).trim()}`);
  }

  let parsed;
  try {
    parsed = JSON.parse(result.stdout);
  } catch {
    throw new Error('Supabase status did not return valid JSON.');
  }

  const apiUrl = requireString(parsed, ['API_URL', 'SUPABASE_URL']);
  const browserKey = requireString(parsed, ['PUBLISHABLE_KEY', 'SUPABASE_PUBLISHABLE_KEY', 'ANON_KEY', 'SUPABASE_ANON_KEY']);
  const elevatedKey = requireString(parsed, ['SECRET_KEY', 'SUPABASE_SECRET_KEY', 'SERVICE_ROLE_KEY', 'SUPABASE_SERVICE_ROLE_KEY']);

  if (!apiUrl || !browserKey || !elevatedKey) {
    throw new Error('Local Supabase status is missing API URL, browser-safe key, or elevated local key.');
  }

  let host;
  try {
    host = new URL(apiUrl).hostname;
  } catch {
    throw new Error('Local Supabase API URL is invalid.');
  }
  if (!['127.0.0.1', 'localhost', '::1'].includes(host)) {
    throw new Error(`Refusing integration gate against non-local Supabase host: ${host}`);
  }

  return { apiUrl, browserKey, elevatedKey };
}
