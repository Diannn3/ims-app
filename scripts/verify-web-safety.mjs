import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const srcRoot = path.join(root, 'src');
const failures = [];
let svelteCount = 0;

function walk(directory) {
  const results = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) results.push(...walk(full));
    else if (entry.isFile() && entry.name.endsWith('.svelte')) results.push(full);
  }
  return results;
}

for (const file of walk(srcRoot)) {
  svelteCount += 1;
  const source = fs.readFileSync(file, 'utf8');
  const relative = path.relative(root, file);

  if (source.includes('{@html')) {
    failures.push(`${relative}: raw {@html} rendering is disallowed unless a separately reviewed sanitizer contract is introduced`);
  }
  if (/javascript\s*:/i.test(source)) {
    failures.push(`${relative}: javascript: URLs are disallowed`);
  }
  if (/tabindex\s*=\s*["']?[1-9]\d*/i.test(source)) {
    failures.push(`${relative}: positive tabindex values are disallowed; preserve natural keyboard order`);
  }

  for (const match of source.matchAll(/<a\b[^>]*\btarget\s*=\s*["']_blank["'][^>]*>/gi)) {
    const tag = match[0];
    const rel = tag.match(/\brel\s*=\s*["']([^"']+)["']/i)?.[1] ?? '';
    if (!/\b(?:noopener|noreferrer)\b/i.test(rel)) {
      failures.push(`${relative}: target="_blank" link must include rel="noopener" and/or rel="noreferrer"`);
    }
  }
}

if (failures.length) {
  console.error(`Web-safety verification failed with ${failures.length} issue(s):`);
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log(`Web-safety verification passed across ${svelteCount} Svelte component/route file(s).`);
console.log(' - no raw {@html} sinks or javascript: URLs');
console.log(' - no positive tabindex ordering overrides');
console.log(' - target=_blank links carry opener/referrer protection');
