const fs = require('fs');
const path = require('path');
const ts = require('typescript');
const root = '/mnt/data/ims-map-navigation-next/overlay';
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const p = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(p) : [p];
  });
}
let failed = false;
for (const file of walk(root).filter((f) => f.endsWith('.svelte'))) {
  const text = fs.readFileSync(file, 'utf8');
  const match = text.match(/<script lang="ts">([\s\S]*?)<\/script>/);
  if (!match) continue;
  const result = ts.transpileModule(match[1], {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
    reportDiagnostics: true,
    fileName: file + '.ts'
  });
  const diagnostics = result.diagnostics || [];
  if (diagnostics.length) {
    failed = true;
    console.error('\n' + file);
    for (const d of diagnostics) console.error(ts.flattenDiagnosticMessageText(d.messageText, '\n'));
  }
}
if (failed) process.exit(1);
console.log('Svelte TypeScript script parse: PASS');
