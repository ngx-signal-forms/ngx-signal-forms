import { afterEach, describe, expect, it, vi } from 'vitest';

// `vi.mock` is hoisted above every import in this file, so `isDevMode` reads
// `false` for every module this file imports, including `devWarnOnce` below
// -- unlike `dev-warn-once.spec.ts`, which relies on the real `isDevMode()`
// reading `true` under Angular's test runner. Kept in its own file (not a
// toggleable module-scope flag alongside the dev-mode specs) so this file's
// module graph is unambiguously production-mode throughout, with no risk of
// another test in the same file leaving the flag flipped.
vi.mock('@angular/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@angular/core')>();
  return { ...actual, isDevMode: () => false };
});

describe('devWarnOnce (production mode)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('never logs, even on the first call, when isDevMode() is false', async () => {
    const { devWarnOnce } = await import('./dev-warn-once');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    devWarnOnce({ current: false }, 'warn', 'message');
    devWarnOnce({ current: false }, 'error', 'message');

    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('does not flip the warned ref in production mode', async () => {
    const { devWarnOnce } = await import('./dev-warn-once');
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const warned = { current: false };

    devWarnOnce(warned, 'warn', 'message');

    expect(warned.current).toBe(false);
  });
});
