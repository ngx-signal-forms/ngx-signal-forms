import { signal } from '@angular/core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createCharacterCountLengthSignal } from './character-count-length';

describe('createCharacterCountLengthSignal', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reports a string value by its length', () => {
    const length = createCharacterCountLengthSignal(() => 'hello', 'Test');
    expect(length()).toBe(5);
  });

  it('reports an empty string as 0', () => {
    const length = createCharacterCountLengthSignal(() => '', 'Test');
    expect(length()).toBe(0);
  });

  it('reports an array value by its length', () => {
    const length = createCharacterCountLengthSignal(
      () => ['a', 'b', 'c'],
      'Test',
    );
    expect(length()).toBe(3);
  });

  it('reports null as 0, without a dev warning', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const length = createCharacterCountLengthSignal(() => null, 'Test');

    expect(length()).toBe(0);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('reports undefined as 0, without a dev warning', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const length = createCharacterCountLengthSignal(() => undefined, 'Test');

    expect(length()).toBe(0);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('reports 0 and emits one dev-mode warning for an unsupported value type', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const length = createCharacterCountLengthSignal(() => 42, 'MyComponent');

    expect(length()).toBe(0);
    expect(warnSpy).toHaveBeenCalledOnce();
    expect(warnSpy.mock.calls[0]?.[0]).toContain('MyComponent');
    expect(warnSpy.mock.calls[0]?.[0]).toContain('unsupported value type');
  });

  it('names the actual constructor for an unsupported object value', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const length = createCharacterCountLengthSignal(
      () => new Date(),
      'MyComponent',
    );

    expect(length()).toBe(0);
    expect(warnSpy.mock.calls[0]?.[1]).toBe('Date');
  });

  it('never logs the raw unsupported value itself, only its type descriptor', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const secretValue = { password: 'sensitive-value' };
    const length = createCharacterCountLengthSignal(
      () => secretValue,
      'MyComponent',
    );

    length();

    const loggedArgs = warnSpy.mock.calls.flat();
    expect(loggedArgs).not.toContain(secretValue);
    expect(loggedArgs.map(String).join(' ')).not.toContain('sensitive-value');
  });

  it('warns at most once per returned signal, even across repeated recomputations', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // A changing source forces `computed()` to recompute on every read
    // (rather than reusing a cached result) — isolating the assertion to
    // `createCharacterCountLengthSignal`'s own one-shot guard.
    const current = signal(42);
    const length = createCharacterCountLengthSignal(
      () => current(),
      'MyComponent',
    );

    length();
    current.set(43);
    length();
    current.set(44);
    length();

    expect(warnSpy).toHaveBeenCalledOnce();
  });

  it('re-derives the length reactively as the underlying value changes', () => {
    const current = signal<unknown>('ab');
    const length = createCharacterCountLengthSignal(() => current(), 'Test');

    expect(length()).toBe(2);
    current.set('abcd');
    expect(length()).toBe(4);
  });
});
