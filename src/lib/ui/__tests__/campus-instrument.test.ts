import { readFileSync, readdirSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();

function filesBelow(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesBelow(path) : [path];
  });
}

describe('Campus Instrument source contract', () => {
  it('keeps route and domain component styling in Tailwind utilities', () => {
    const candidates = [join(root, 'src', 'routes'), join(root, 'src', 'lib', 'components')]
      .flatMap(filesBelow)
      .filter((path) => extname(path) === '.svelte')
      .filter((path) => !path.includes(`${join('components', 'map')}`));

    const filesWithStyleBlocks = candidates
      .filter((path) => readFileSync(path, 'utf8').includes('<style'))
      .map((path) => relative(root, path));

    expect(filesWithStyleBlocks).toEqual([]);
  });

  it('does not restore generic global card and button abstractions', () => {
    const css = readFileSync(join(root, 'src', 'app.css'), 'utf8');
    expect(css).not.toMatch(/^\.card(?:[\s,{:.]|$)/m);
    expect(css).not.toMatch(/^\.button(?:[\s,{:.]|$)/m);
  });
});
