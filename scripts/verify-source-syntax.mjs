import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let ts;
try {
  ts = require('typescript');
} catch (error) {
  console.error('TypeScript is required for the dependency-light syntax check.');
  console.error('Run npm install first, or ensure a compatible TypeScript installation is available.');
  process.exit(2);
}

const ROOTS = ['src', 'tests'].map((value) => path.resolve(value)).filter(fs.existsSync);
const ROOT_TS_FILES = ['playwright.config.ts', 'vite.config.ts'].map((value) => path.resolve(value)).filter(fs.existsSync);
const SCRIPT_ROOT = path.resolve('scripts');
const SKIP_DIRS = new Set(['node_modules', '.git', '.svelte-kit']);

function walk(directory, extensions) {
  const results = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && SKIP_DIRS.has(entry.name)) continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) results.push(...walk(fullPath, extensions));
    else if (entry.isFile() && extensions.some((extension) => entry.name.endsWith(extension))) {
      results.push(fullPath);
    }
  }
  return results;
}

function extractSvelteScripts(source) {
  const blocks = [];
  const expression = /<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>/gi;
  for (const match of source.matchAll(expression)) blocks.push(match[1]);
  return blocks.join('\n');
}

const files = [...ROOTS.flatMap((root) => walk(root, ['.ts', '.svelte'])), ...ROOT_TS_FILES];
const failures = [];

for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  const scriptSource = file.endsWith('.svelte') ? extractSvelteScripts(source) : source;
  const sourceFile = ts.createSourceFile(
    file,
    scriptSource,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  );

  for (const diagnostic of sourceFile.parseDiagnostics ?? []) {
    const position = sourceFile.getLineAndCharacterOfPosition(diagnostic.start ?? 0);
    failures.push(
      `${path.relative(process.cwd(), file)}:${position.line + 1}:${position.character + 1} ${ts.flattenDiagnosticMessageText(diagnostic.messageText, ' ')}`
    );
  }
}

const nodeScripts = fs.existsSync(SCRIPT_ROOT) ? walk(SCRIPT_ROOT, ['.mjs']) : [];
for (const file of nodeScripts) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) {
    failures.push(`${path.relative(process.cwd(), file)}: Node syntax check failed: ${(result.stderr || result.stdout).trim()}`);
  }
}

if (failures.length) {
  console.error(`Source syntax verification failed with ${failures.length} issue(s):`);
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log(`Source syntax verification passed for ${files.length} TypeScript/Svelte file(s) and ${nodeScripts.length} Node script(s).`);
console.log('Note: this is a parser-level fallback only; npm run check/test remains the authoritative framework/toolchain gate.');
