import { existsSync, readFileSync } from 'node:fs';

if (!existsSync('package-lock.json')) {
  console.error('package-lock.json is missing. Generate it with a real npm resolver before review.');
  process.exit(1);
}

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'));
const root = lock.packages?.[''];
const failures = [];

if (!root) failures.push('package-lock.json is missing packages[""] root metadata');
if (![2, 3].includes(lock.lockfileVersion)) failures.push(`unsupported npm lockfileVersion ${lock.lockfileVersion}`);

if (root) {
  for (const group of ['dependencies', 'devDependencies']) {
    for (const [name, expected] of Object.entries(pkg[group] ?? {})) {
      const actual = root[group]?.[name];
      if (actual !== expected) failures.push(`${group}.${name}: lock root=${JSON.stringify(actual)} package.json=${JSON.stringify(expected)}`);
    }
  }
}

if (failures.length) {
  console.error(`Lockfile verification failed with ${failures.length} issue(s):`);
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log(`Lockfile verification passed (lockfileVersion ${lock.lockfileVersion}).`);
console.log('Top-level dependency/devDependency pins exactly match package.json.');
