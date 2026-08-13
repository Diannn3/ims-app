import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const dir = join(root, 'supabase/migrations');
const files = (await readdir(dir)).filter((name) => /^\d{3}_.+\.sql$/.test(name)).sort();
const failures = [];
let definerCount = 0;

function fail(message) {
  failures.push(message);
}

for (const file of files) {
  const source = await readFile(join(dir, file), 'utf8');
  const lower = source.toLowerCase();
  const functionPattern = /create\s+or\s+replace\s+function\s+((?:public|private)\.[a-zA-Z0-9_]+)\s*\([^)]*\)[\s\S]*?\$\$;/gi;
  let match;

  while ((match = functionPattern.exec(source)) !== null) {
    const name = match[1];
    const block = match[0];
    if (!/security\s+definer/i.test(block)) continue;
    definerCount += 1;

    if (!/set\s+search_path\s*=\s*''/i.test(block)) {
      fail(`${file}: SECURITY DEFINER ${name} must set an empty search_path`);
    }

    const revokeNeedle = `revoke execute on function ${name.toLowerCase()}`;
    if (!lower.includes(revokeNeedle)) {
      fail(`${file}: SECURITY DEFINER ${name} must explicitly revoke default PUBLIC EXECUTE`);
    }

    if (name.startsWith('public.') && name !== 'public.__unused') {
      if (!/private\.has_any_role\s*\(/i.test(block)) {
        fail(`${file}: exposed SECURITY DEFINER ${name} must perform an application-role check`);
      }
    }
  }
}

if (definerCount === 0) fail('No SECURITY DEFINER functions were discovered; verifier pattern is likely broken');

if (failures.length) {
  console.error(`SQL security verification failed with ${failures.length} issue(s):`);
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log(`SQL security verification passed for ${definerCount} SECURITY DEFINER function definition(s).`);
