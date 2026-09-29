// PROTOTYPE — issue #600. Type-checks the prototype against the real forms,
// then builds demo.html from the same pure module.
//   node apps/demo/src/app/_prototype-display-controls/run.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import ts from 'typescript';

const here = import.meta.dirname;
const tsc = join(here, '../../../../../node_modules/.bin/tsc');
try {
  execFileSync(tsc, ['-p', join(here, 'tsconfig.prototype.json')], { encoding: 'utf8' });
} catch (e) {
  // Plain tsc also reports an unrelated decorator error in example-cards.ts;
  // only errors in the prototype files matter here.
  const mine = String(e.stdout).split('\n').filter((l) => l.includes('.prototype.ts'));
  if (mine.length) {
    console.error(mine.join('\n'));
    process.exit(1);
  }
}
console.log('Type check: definitions accepted, all 5 mistakes rejected.');

const src = readFileSync(join(here, 'display-controls.prototype.ts'), 'utf8');
const js = ts.transpileModule(src, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const html = readFileSync(join(here, 'demo.template.html'), 'utf8').replace('/*MODULE*/', js);
writeFileSync(join(here, 'demo.html'), html);
console.log('Built demo.html');
