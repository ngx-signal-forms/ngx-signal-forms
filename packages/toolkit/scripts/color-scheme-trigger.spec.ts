import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * The toolkit has one dark-mode trigger: the inherited CSS `color-scheme`,
 * read through `light-dark()` (#494). A second trigger in one component
 * brings back the bug where the wrapper and its messages disagree, for
 * example red error text for dark mode on a white page (1.90:1).
 *
 * This scans every stylesheet and inline `styles:` block the package ships
 * for the two old triggers.
 */
const PACKAGE_ROOT = resolve(import.meta.dirname, '..');

const ENTRY_DIRECTORIES = ['assistive', 'core', 'form-field', 'headless'];

function* walkStyleSources(directory: string): Generator<string> {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules') {
        yield* walkStyleSources(path);
      }
      continue;
    }

    const isSpec = /\.(spec|test)\.ts$/u.test(entry.name);
    if (
      entry.name.endsWith('.css') ||
      (entry.name.endsWith('.ts') && !isSpec)
    ) {
      yield path;
    }
  }
}

describe('toolkit dark-mode trigger', () => {
  it('uses no prefers-color-scheme query or .dark class context in any shipped style', () => {
    const offenders = ENTRY_DIRECTORIES.flatMap((directory) => [
      ...walkStyleSources(join(PACKAGE_ROOT, directory)),
    ])
      .filter((path) =>
        /prefers-color-scheme|:host-context\(\s*[^)]*\.dark/u.test(
          readFileSync(path, 'utf8'),
        ),
      )
      .map((path) => relative(PACKAGE_ROOT, path));

    expect(offenders).toEqual([]);
  });
});
