import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Every component this package ships runs on `OnPush`: all of their state is
 * signals, so a component that re-renders on every application-wide check
 * costs consumers change detection they cannot opt out of. Angular 22 makes
 * `OnPush` the default, so components no longer declare it. What can still
 * break the guarantee is a component that sets `changeDetection` at all: to
 * `Eager` or `Default`, or through an alias such as `changeDetection: strategy`.
 * The guard rejects the property itself. A component that needs `Eager` on
 * purpose has to change this spec, so the opt-out is a visible decision.
 *
 * Asserted against the source text rather than the compiled definition
 * because the alternative — reading `ɵcmp.onPush` — is a private Angular
 * member the toolkit does not touch anywhere else. The wrapper specs assert
 * on CSS source the same way.
 */
const PACKAGE_ROOT = resolve(import.meta.dirname, '..');

const ENTRY_DIRECTORIES = [
  'assistive',
  'core',
  'form-field',
  'headless',
  'testing',
  'vest',
];

function* walkSourceFiles(directory: string): Generator<string> {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules') {
        yield* walkSourceFiles(path);
      }
      continue;
    }

    if (
      entry.name.endsWith('.ts') &&
      !/\.(spec|test|fixture)\.ts$/u.test(entry.name)
    ) {
      yield path;
    }
  }
}

/** Whether component source sets `changeDetection`, however it spells the value. */
function setsChangeDetection(source: string): boolean {
  return /\bchangeDetection\s*:/u.test(source);
}

const componentFiles = ENTRY_DIRECTORIES.flatMap((entry) => [
  ...walkSourceFiles(join(PACKAGE_ROOT, entry)),
])
  .filter((path) => /^@Component\(\{/mu.test(readFileSync(path, 'utf8')))
  .map((path) => path.slice(PACKAGE_ROOT.length + 1))
  .toSorted();

describe('change detection', () => {
  it('finds every shipped component', () => {
    expect(componentFiles).toEqual([
      'assistive/character-count.ts',
      'assistive/form-field-error-summary.ts',
      'assistive/form-field-error.ts',
      'assistive/form-marking-legend.ts',
      'assistive/hint.ts',
      'form-field/form-field-wrapper.ts',
      'form-field/form-fieldset.ts',
    ]);
  });

  it.each([
    'changeDetection: ChangeDetectionStrategy.Eager,',
    'changeDetection: ChangeDetectionStrategy.Default,',
    'changeDetection: ChangeDetectionStrategy.OnPush,',
    'changeDetection: strategy,',
    'changeDetection:\n    strategy,',
  ])('flags a component that sets %j', (line) => {
    expect(setsChangeDetection(`@Component({\n  ${line}\n})`)).toBe(true);
  });

  it('does not flag a component that leaves the default alone', () => {
    expect(setsChangeDetection('@Component({\n  selector: "a",\n})')).toBe(
      false,
    );
  });

  it.each(componentFiles)(
    'does not set changeDetection in %s',
    (relativePath) => {
      const source = readFileSync(join(PACKAGE_ROOT, relativePath), 'utf8');

      expect(setsChangeDetection(source)).toBe(false);
    },
  );
});
