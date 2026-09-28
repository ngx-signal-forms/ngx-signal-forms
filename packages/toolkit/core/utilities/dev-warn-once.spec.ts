import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createDevWarnOnce,
  devWarnOnce,
  type WarnOnceRef,
} from './dev-warn-once';

/**
 * Unit tests run in Angular dev mode (`isDevMode() === true`), so every
 * warning/error call below is expected to actually reach the console.
 */
describe('devWarnOnce', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calls console.warn with the message and extra args on the first call', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const warned: WarnOnceRef = { current: false };

    devWarnOnce(warned, 'warn', '[ngx-signal-forms] Thing: broken', 'extra');

    expect(warnSpy).toHaveBeenCalledExactlyOnceWith(
      '[ngx-signal-forms] Thing: broken',
      'extra',
    );
  });

  it('calls console.error instead of console.warn for level "error"', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const warned: WarnOnceRef = { current: false };

    devWarnOnce(warned, 'error', '[ngx-signal-forms] Thing: broken');

    expect(errorSpy).toHaveBeenCalledOnce();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('flips the ref to true on the first call', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const warned: WarnOnceRef = { current: false };

    devWarnOnce(warned, 'warn', 'message');

    expect(warned.current).toBe(true);
  });

  it('dedupes: a second call against the same ref does not warn again', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const warned: WarnOnceRef = { current: false };

    devWarnOnce(warned, 'warn', 'message');
    devWarnOnce(warned, 'warn', 'message');
    devWarnOnce(warned, 'warn', 'a different message');

    // Every subsequent call is a no-op once `warned.current` is true — not
    // just a dedupe of the identical message.
    expect(warnSpy).toHaveBeenCalledOnce();
  });

  it('does not warn (and does not flip the ref) when the ref already reads true', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const warned: WarnOnceRef = { current: true };

    devWarnOnce(warned, 'warn', 'message');

    expect(warnSpy).not.toHaveBeenCalled();
    expect(warned.current).toBe(true);
  });

  it('re-arms after a caller manually resets the ref back to false', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const warned: WarnOnceRef = { current: false };

    devWarnOnce(warned, 'warn', 'first');
    warned.current = false;
    devWarnOnce(warned, 'warn', 'second');

    expect(warnSpy).toHaveBeenCalledTimes(2);
  });
});

describe('createDevWarnOnce', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns a bound function that warns on its first call', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const warnOnce = createDevWarnOnce();

    warnOnce('warn', 'message');

    expect(warnSpy).toHaveBeenCalledExactlyOnceWith('message');
  });

  it('dedupes within its own private ref, independent of other instances', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const warnOnceA = createDevWarnOnce();
    const warnOnceB = createDevWarnOnce();

    warnOnceA('warn', 'message');
    warnOnceA('warn', 'message');
    warnOnceB('warn', 'message');

    // A's second call is deduped; B has its own ref, so it still warns once.
    expect(warnSpy).toHaveBeenCalledTimes(2);
  });
});
