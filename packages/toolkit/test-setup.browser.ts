import { commands } from 'vitest/browser';
import '@angular/compiler';
import '@analogjs/vitest-angular/setup-snapshots';
import '@analogjs/vitest-angular/setup-serializers';
import { setupTestBed } from '@analogjs/vitest-angular/setup-testbed';

// No `@testing-library/jest-dom` import here: `@vitest/browser` ships the same
// DOM matchers (`toHaveClass`, `toHaveAttribute`, `toBeVisible`, ...) and adds
// them to `expect` in browser mode. The jsdom project imports jest-dom in
// `test-setup.ts`.

setupTestBed({
  teardown: { destroyAfterEach: true },
});

// Workaround for `@vitest/browser` 5.0.3: the client reads
// `'selector' in args[0]` for every command call, so a `null` first argument
// throws `TypeError: Cannot use 'in' operator to search for 'selector' in
// null`. The emulation commands used `null` to reset an emulation, and the
// throw in the specs' `afterEach` left the emulation and TestBed in place for
// every later test. Send a `'reset'` sentinel instead; the commands in
// `vitest.browser.config.mts` map it back to `null`. Fixed upstream by
// vitest-dev/vitest#11497 (merged 2026-10-05, not in a release yet): remove
// this block, and the sentinel mapping, once a release that includes it is
// installed.
type EmulationCommand = (value: string | null) => Promise<void>;
// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the command names are registered in vitest.browser.config.mts
const emulationCommands = commands as unknown as Record<
  string,
  EmulationCommand
>;
for (const name of [
  'emulateColorScheme',
  'emulateForcedColors',
  'emulateReducedMotion',
]) {
  const send = emulationCommands[name];
  if (send !== undefined) {
    emulationCommands[name] = (value) => send(value ?? 'reset');
  }
}
