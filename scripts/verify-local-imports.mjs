import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let ts;
try {
  ts = require('typescript');
} catch {
  console.error('TypeScript is required for the dependency-light local-import verifier.');
  process.exit(2);
}

const root = process.cwd();
const sourceRoot = path.join(root, 'src');
const scanRoots = [sourceRoot, path.join(root, 'tests')].filter(fs.existsSync);
const rootFiles = ['playwright.config.ts', 'vite.config.ts'].map((value) => path.join(root, value)).filter(fs.existsSync);
const skipDirs = new Set(['node_modules', '.git', '.svelte-kit']);
const sourceExtensions = ['.ts', '.js', '.mjs', '.svelte', '.json'];

function walk(directory) {
  const results = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && skipDirs.has(entry.name)) continue;
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) results.push(...walk(full));
    else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.svelte'))) results.push(full);
  }
  return results;
}

function extractSvelteScripts(source) {
  const blocks = [];
  const expression = /<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>/gi;
  for (const match of source.matchAll(expression)) blocks.push(match[1]);
  return blocks.join('\n');
}

function candidatePaths(base) {
  const candidates = [base];
  const hasKnownSourceExtension = sourceExtensions.some((extension) => base.endsWith(extension));
  if (!hasKnownSourceExtension) {
    for (const extension of sourceExtensions) candidates.push(`${base}${extension}`);
    for (const extension of sourceExtensions) candidates.push(path.join(base, `index${extension}`));
  }
  return candidates;
}

function resolveLocalSpecifier(importer, specifier) {
  // SvelteKit generates route-local $types during `svelte-kit sync`; it is not a source-owned module.
  if (specifier === './$types' || specifier === '../$types') return null;
  if (specifier === '$lib') return path.join(sourceRoot, 'lib');
  if (specifier.startsWith('$lib/')) return path.join(sourceRoot, 'lib', specifier.slice('$lib/'.length));
  if (specifier.startsWith('./') || specifier.startsWith('../')) return path.resolve(path.dirname(importer), specifier);
  return null;
}

function collectModuleSpecifiers(file, source) {
  const parsed = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const found = [];

  function visit(node) {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteralLike(node.moduleSpecifier)) {
      found.push(node.moduleSpecifier.text);
    }
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword && node.arguments.length === 1 && ts.isStringLiteralLike(node.arguments[0])) {
      found.push(node.arguments[0].text);
    }
    ts.forEachChild(node, visit);
  }

  visit(parsed);
  return found;
}

const files = [...scanRoots.flatMap(walk), ...rootFiles];
const failures = [];
let checked = 0;

for (const file of files) {
  const raw = fs.readFileSync(file, 'utf8');
  const source = file.endsWith('.svelte') ? extractSvelteScripts(raw) : raw;
  for (const specifier of collectModuleSpecifiers(file, source)) {
    const base = resolveLocalSpecifier(file, specifier);
    if (!base) continue;
    checked += 1;
    if (!candidatePaths(base).some((candidate) => fs.existsSync(candidate))) {
      failures.push(`${path.relative(root, file)} imports ${JSON.stringify(specifier)}, but no matching local module exists`);
    }
  }
}

if (failures.length) {
  console.error(`Local-import verification failed with ${failures.length} issue(s):`);
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log(`Local-import verification passed for ${checked} relative/$lib import edge(s) across ${files.length} TypeScript/Svelte file(s).`);
console.log('Note: package imports are intentionally left to npm/SvelteKit/TypeScript in the authoritative toolchain gate.');
