#!/usr/bin/env node
// Asserts the published toolkit (`packages/toolkit/package.json`) declares no
// design-system runtime dependencies. The toolkit is consumed alongside any
// design system the user chooses; pulling Material/PrimeNG/Spartan into its
// `dependencies` or `peerDependencies` would force every consumer to install
// them, defeating the point of the seam.
//
// Wired as `pnpm check:toolkit-peer-deps`, runs in CI as a separate step from
// the build so the failure mode is unambiguous: a violation is a guardrail
// breach, not a build break.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const here = import.meta.dirname;
const pkgPath = resolve(here, '../../packages/toolkit/package.json');

const FORBIDDEN_PATTERNS = [
  /^@angular\/material(\/.*)?$/,
  /^@angular\/material-.*/,
  /^primeng(\/.*)?$/,
  /^primeicons(\/.*)?$/,
  /^@spartan-ng\/.+/,
];

const FORBIDDEN_FIELDS = ['dependencies', 'peerDependencies'];

function findViolations(pkg) {
  const violations = [];
  for (const field of FORBIDDEN_FIELDS) {
    const block = pkg[field];
    if (!block) continue;
    for (const name of Object.keys(block)) {
      const matched = FORBIDDEN_PATTERNS.find((re) => re.test(name));
      if (matched) {
        violations.push({ field, name, pattern: matched.source });
      }
    }
  }
  return violations;
}

const raw = readFileSync(pkgPath, 'utf8');
const pkg = JSON.parse(raw);
const violations = findViolations(pkg);

if (violations.length > 0) {
  console.error(`\n${pkgPath} declares forbidden design-system dependencies:`);
  for (const { field, name, pattern } of violations) {
    console.error(`  - ${field}.${name}  (matches /${pattern}/)`);
  }
  console.error(
    '\nThe toolkit must stay design-system-free. Move such deps into',
  );
  console.error(
    'the demo app(s) that wrap the toolkit, not the toolkit itself.',
  );
  process.exit(1);
}

console.log(
  `${pkg.name}@${pkg.version}: no design-system deps found in ${FORBIDDEN_FIELDS.join(' or ')}.`,
);
