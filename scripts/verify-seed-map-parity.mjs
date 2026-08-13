import { readFile } from 'node:fs/promises';

const spaces = JSON.parse(await readFile('src/lib/data/math-building/spaces.json', 'utf8'));
const seed = await readFile('supabase/seed.sql', 'utf8');
const floorIds = { ground: 'mb-gf', second: 'mb-2f', third: 'mb-3f' };
const failures = [];

function sqlQuote(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

for (const space of spaces) {
  const floorId = floorIds[space.floor];
  if (!floorId) {
    failures.push(`Unknown floor ${JSON.stringify(space.floor)} for ${space.id}`);
    continue;
  }

  const identity = `(${sqlQuote(space.id)}, 'mb', ${sqlQuote(floorId)}, ${sqlQuote(space.name)}, ${sqlQuote(space.kind)}`;
  if (!seed.includes(identity)) {
    failures.push(`Seed does not mirror map space ${space.id} (${space.floor}, ${space.kind})`);
  }
}

for (const required of ['mb304', 'mb209', 'gf-main-entrance-space']) {
  if (!spaces.some((space) => space.id === required)) failures.push(`Map dataset is missing required fixture ${required}`);
}

if (!seed.includes('"mapVerificationStatus":"needs-site-verification"')) {
  failures.push('Seeded map fixtures must preserve the site-unverified warning in metadata');
}

if (failures.length) {
  for (const failure of failures) console.error(`[FAIL] ${failure}`);
  console.error(`\nSeed/map parity verification failed with ${failures.length} issue(s).`);
  process.exit(1);
}

console.log(`Seed/map parity verification passed for ${spaces.length} Math Building spaces.`);
console.log(' - permanent space IDs, floor IDs, names, and kinds match the static map dataset');
console.log(' - development DB fixtures remain explicitly marked site-unverified');
