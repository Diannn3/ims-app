import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import process from 'node:process';

const strict = process.argv.includes('--strict');
const results = [];

function add(level, label, detail) {
  results.push({ level, label, detail });
}

function commandWorks(command, args = ['--version']) {
  const executable = process.platform === 'win32' && ['npm', 'npx'].includes(command)
    ? `${command}.cmd`
    : command;
  const result = spawnSync(executable, args, {
    encoding: 'utf8',
    timeout: 4_000,
    stdio: ['ignore', 'pipe', 'pipe']
  });
  return {
    ok: !result.error && result.status === 0,
    output: `${result.stdout ?? ''}${result.stderr ?? ''}`.trim().split('\n')[0] ?? '',
    error: result.error?.message ?? null
  };
}

const major = Number(process.versions.node.split('.')[0]);
add(major >= 22 ? 'pass' : 'block', 'Node.js >= 22', `detected ${process.version}`);

const nodeModules = existsSync(join(process.cwd(), 'node_modules'));
add(nodeModules ? 'pass' : 'block', 'npm dependencies installed', nodeModules ? 'node_modules exists' : 'run npm install');

const lock = existsSync(join(process.cwd(), 'package-lock.json'));
add(lock ? 'pass' : 'warn', 'verified package-lock.json', lock ? 'present' : 'create only after a successful reviewed npm install');

const databaseTypes = existsSync(join(process.cwd(), 'src', 'lib', 'database.types.ts'));
add(
  databaseTypes ? 'pass' : 'warn',
  'generated database types',
  databaseTypes
    ? 'src/lib/database.types.ts is present; the gate will still compare it against the replayed schema'
    : 'generate only after a successful local migration replay with npm run types:db'
);

const supabaseBin = join(
  process.cwd(),
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'supabase.cmd' : 'supabase'
);
add(existsSync(supabaseBin) ? 'pass' : 'block', 'project-local Supabase CLI', existsSync(supabaseBin) ? 'installed' : 'run npm install');

const runtimes = [
  ['docker', ['version', '--format', '{{.Server.Version}}']],
  ['podman', ['version', '--format', '{{.Server.Version}}']]
];
let runtime = null;
for (const [command, args] of runtimes) {
  const result = commandWorks(command, args);
  if (result.ok) {
    runtime = `${command}${result.output ? ` ${result.output}` : ''}`;
    break;
  }
}
add(runtime ? 'pass' : 'block', 'Docker-compatible container runtime', runtime ?? 'Docker/Podman daemon not reachable');

const git = commandWorks('git');
add(git.ok ? 'pass' : 'warn', 'Git CLI', git.ok ? git.output : git.error ?? 'not available');

const symbols = { pass: 'PASS', warn: 'WARN', block: 'BLOCK' };
for (const result of results) {
  console.log(`[${symbols[result.level]}] ${result.label} — ${result.detail}`);
}

const blocks = results.filter((result) => result.level === 'block').length;
const warnings = results.filter((result) => result.level === 'warn').length;
console.log(`\nDoctor summary: ${blocks} blocker(s), ${warnings} warning(s).`);

if (strict && blocks) process.exit(1);
