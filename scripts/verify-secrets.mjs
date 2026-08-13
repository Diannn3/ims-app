import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const failures = [];
const ignoredDirs = new Set(['.git', 'node_modules', '.svelte-kit', 'build', 'validation-evidence', 'playwright-report', 'test-results']);
const binaryExtensions = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.zip', '.pdf']);
const secretPatterns = [
  { label: 'Supabase secret API key', regex: /\bsb_secret_[A-Za-z0-9_-]{12,}\b/g },
  { label: 'JWT-like token', regex: /\beyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g }
];

function walk(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirs.has(entry.name)) continue;
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else if (entry.isFile() && !binaryExtensions.has(path.extname(entry.name).toLowerCase())) files.push(full);
  }
  return files;
}

for (const file of walk(root)) {
  const relative = path.relative(root, file);
  if (relative === '.env.example') continue;
  let source;
  try {
    source = fs.readFileSync(file, 'utf8');
  } catch {
    continue;
  }
  for (const { label, regex } of secretPatterns) {
    regex.lastIndex = 0;
    if (regex.test(source)) failures.push(`${relative}: possible ${label}`);
  }
}

const git = spawnSync('git', ['ls-files'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
if (git.status === 0) {
  for (const tracked of git.stdout.split(/\r?\n/).filter(Boolean)) {
    const name = path.basename(tracked);
    if ((name === '.env' || name.startsWith('.env.')) && name !== '.env.example') {
      failures.push(`${tracked}: environment file must not be tracked`);
    }
  }
}

if (failures.length) {
  console.error(`Secret-safety verification failed with ${failures.length} issue(s):`);
  for (const failure of failures) console.error(` - ${failure}`);
  console.error('Rotate any real exposed credential before removing it from history.');
  process.exit(1);
}

console.log('Secret-safety verification passed.');
console.log(' - no Supabase secret-key/JWT-like literals found in source-controlled text');
console.log(' - no tracked private .env files detected');
