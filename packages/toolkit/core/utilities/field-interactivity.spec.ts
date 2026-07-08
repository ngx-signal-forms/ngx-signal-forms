import { signal } from '@angular/core';
import { describe, expect, it } from 'vitest';
import {
  isFieldStateHidden,
  isFieldStateInteractive,
} from './field-interactivity';

describe('isFieldStateInteractive', () => {
  it('returns true for a field state with no hidden/disabled signals (defaults to interactive)', () => {
    expect(isFieldStateInteractive({})).toBe(true);
  });

  it('returns true when hidden() and disabled() both report false', () => {
    const fieldState = {
      hidden: () => false,
      disabled: () => false,
    };
    expect(isFieldStateInteractive(fieldState)).toBe(true);
  });

  it('returns false when hidden() reports true', () => {
    const fieldState = {
      hidden: () => true,
      disabled: () => false,
    };
    expect(isFieldStateInteractive(fieldState)).toBe(false);
  });

  it('returns false when disabled() reports true', () => {
    const fieldState = {
      hidden: () => false,
      disabled: () => true,
    };
    expect(isFieldStateInteractive(fieldState)).toBe(false);
  });

  it('checks hidden() before disabled() but either alone is sufficient to short-circuit to false', () => {
    const fieldState = {
      hidden: () => true,
      disabled: () => true,
    };
    expect(isFieldStateInteractive(fieldState)).toBe(false);
  });

  it('tolerates a partial shape where hidden is not a function — defaults to interactive for that signal', () => {
    const fieldState = {
      hidden: 'not-a-function',
      disabled: () => false,
    };
    expect(isFieldStateInteractive(fieldState)).toBe(true);
  });

  it('tolerates a partial shape where disabled is not a function — defaults to interactive for that signal', () => {
    const fieldState = {
      hidden: () => false,
      disabled: 'not-a-function',
    };
    expect(isFieldStateInteractive(fieldState)).toBe(true);
  });

  it('treats readonly fields as interactive — readonly is not part of this predicate at all', () => {
    // Per the module docs: readonly() → interactive. This predicate doesn't
    // even look at a `readonly` signal, so a "readonly" field state is
    // interactive regardless of what a `readonly` property reports.
    const fieldState = {
      hidden: () => false,
      disabled: () => false,
      readonly: () => true,
    };
    expect(isFieldStateInteractive(fieldState)).toBe(true);
  });
});

describe('isFieldStateHidden', () => {
  it('returns true when hidden() reports true', () => {
    const fieldState = { hidden: signal(true) };
    expect(isFieldStateHidden(fieldState)).toBe(true);
  });

  it('returns false when hidden() reports false', () => {
    const fieldState = { hidden: signal(false) };
    expect(isFieldStateHidden(fieldState)).toBe(false);
  });

  it('does not consider disabled() at all — a disabled-but-visible field is not "hidden"', () => {
    const fieldState = {
      hidden: signal(false),
      disabled: signal(true),
    };
    expect(isFieldStateHidden(fieldState)).toBe(false);
  });

  it('defensively returns false for a partial shape without a hidden() function', () => {
    // The parameter type requires `Pick<FieldState<unknown>, 'hidden'>`, but
    // the body still guards defensively for hand-rolled partial mocks (per
    // the module docs) — this pins that defensive fallback.
    const fieldState = {} as unknown as Parameters<
      typeof isFieldStateHidden
    >[0];
    expect(isFieldStateHidden(fieldState)).toBe(false);
  });
});
