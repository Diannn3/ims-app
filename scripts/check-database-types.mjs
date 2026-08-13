import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import process from 'node:process';

const localBin = join(
  process.cwd(),
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'supabase.cmd' : 'supabase'
);

// Local development defaults to the project-pinned CLI. CI may opt into a
// separately pinned executable (for example supabase/setup-cli) explicitly.
const configuredBin = process.env.SUPABASE_BIN?.trim();
const bin = configuredBin || localBin;

if (!configuredBin && !existsSync(localBin)) {
  console.error('Project-local Supabase CLI is not installed. Run npm install first.');
  process.exit(2);
}

const result = spawnSync(
  bin,
  ['gen', 'types', 'typescript', '--local'],
  { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }
);

if (result.error) {
  console.error(`Could not execute Supabase CLI (${bin}).`);
  console.error(result.error.message);
  process.exit(2);
}

if (result.status !== 0) {
  console.error('Could not generate database types from the local Supabase stack.');
  console.error('Start the local stack and replay migrations first: npm run db:start && npm run db:reset');
  if (result.stderr) console.error(result.stderr.trim());
  process.exit(result.status || 2);
}

function normalize(text) {
  return text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').trimEnd() + '\n';
}

const generated = normalize(result.stdout);
const generatedEvidenceDir = resolve('validation-evidence');
const generatedEvidencePath = join(generatedEvidenceDir, 'database.types.generated.ts');

function preserveGeneratedEvidence() {
  mkdirSync(generatedEvidenceDir, { recursive: true });
  writeFileSync(generatedEvidencePath, generated, 'utf8');
  console.error(`Freshly generated database types were preserved at ${generatedEvidencePath} for review.`);
}

const committedPath = 'src/lib/database.types.ts';
if (!existsSync(committedPath)) {
  preserveGeneratedEvidence();
  console.error(`${committedPath} has not been generated for the current migration set.`);
  console.error('Generate it only from a successfully replayed local schema with: npm run types:db');
  console.error('Then inspect and commit the generated diff before rerunning the gate.');
  process.exit(1);
}
const committed = normalize(readFileSync(committedPath, 'utf8'));

if (generated !== committed) {
  preserveGeneratedEvidence();
  console.error('src/lib/database.types.ts is out of date with the replayed local database schema.');
  console.error('Regenerate it with: npm run types:db');
  process.exit(1);
}

console.log('Database types match the replayed local schema.');
