import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const dir = resolve(root, 'supabase/tests/database');
const files = readdirSync(dir).filter((name) => name.endsWith('.test.sql')).sort();
const assertionPattern = /^\s*select\s+(?:has_[a-z0-9_]+|hasnt_[a-z0-9_]+|ok|is|isnt|is_deeply|isnt_deeply|cmp_ok|like|unlike|matches|imatches|results_eq|results_ne|set_eq|bag_eq|throws_ok|throws_like|lives_ok)\s*\(/gim;
const failures = [];
let total = 0;

for (const file of files) {
  const source = readFileSync(resolve(dir, file), 'utf8');
  const plans = [...source.matchAll(/^\s*select\s+plan\s*\(\s*(\d+)\s*\)\s*;/gim)];
  if (plans.length !== 1) {
    failures.push(`${file}: expected exactly one select plan(N), found ${plans.length}`);
    continue;
  }
  const expected = Number(plans[0][1]);
  const actual = [...source.matchAll(assertionPattern)].length;
  total += actual;
  if (expected !== actual) {
    failures.push(`${file}: plan(${expected}) but found ${actual} top-level pgTAP assertions`);
  }
  if (!/^\s*select\s+\*\s+from\s+finish\s*\(\s*\)\s*;/im.test(source)) {
    failures.push(`${file}: missing select * from finish()`);
  }
  if (!/^\s*rollback\s*;/im.test(source)) {
    failures.push(`${file}: test must roll back fixture mutations`);
  }
}

if (failures.length) {
  console.error(`pgTAP plan verification failed with ${failures.length} issue(s):`);
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log(`pgTAP plan verification passed for ${files.length} file(s), ${total} assertion(s).`);
