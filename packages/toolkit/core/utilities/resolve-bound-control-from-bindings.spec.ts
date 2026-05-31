import { describe, expect, it } from 'vitest';
import {
  type FormFieldBindingsState,
  resolveBoundControlFromBindings,
} from './resolve-bound-control-from-bindings';

/**
 * Builds a structural stand-in for a `FieldState` that exposes only the
 * `formFieldBindings` signal this resolver reads. Each entry is reduced to its
 * `element` — the single property the resolver consumes from a `FormField`.
 */
function fieldStateWithBindings(
  elements: readonly unknown[],
): FormFieldBindingsState {
  const bindings = elements.map((element) => ({ element }));
  return {
    formFieldBindings: () =>
      bindings as unknown as ReturnType<
        FormFieldBindingsState['formFieldBindings']
      >,
  };
}

describe('resolveBoundControlFromBindings', () => {
  it('returns null when the field state lacks a formFieldBindings signal (mock state)', () => {
    const host = document.createElement('div');
    // A partial/mock field state — the shape the wrapper unit tests bind:
    // no `formFieldBindings` signal, so the resolver must bail to its caller's
    // DOM-probe fallback rather than throw.
    const mockState = {
      invalid: () => false,
    } as unknown as FormFieldBindingsState;

    expect(resolveBoundControlFromBindings(mockState, host)).toBeNull();
  });

  it('returns null for null/undefined field state', () => {
    const host = document.createElement('div');

    expect(resolveBoundControlFromBindings(null, host)).toBeNull();
    expect(resolveBoundControlFromBindings(undefined, host)).toBeNull();
  });

  it('returns null when the binding registry is empty', () => {
    const host = document.createElement('div');

    expect(
      resolveBoundControlFromBindings(fieldStateWithBindings([]), host),
    ).toBeNull();
  });

  it('returns the first registered binding element inside the host', () => {
    const host = document.createElement('div');
    const input = document.createElement('input');
    input.id = 'control';
    host.append(input);

    expect(
      resolveBoundControlFromBindings(fieldStateWithBindings([input]), host),
    ).toBe(input);
  });

  it('skips an id-less binding host so the caller falls through to its DOM probe', () => {
    // The CSS-selector fallback only matches elements with an `[id]`. An id-less
    // `[formField]` host (e.g. `<my-control formField><input id>`) must not win
    // here — returning it would shadow the inner `<input id>` and break PR #92's
    // "identical output" invariant. The resolver returns null so the probe runs.
    const host = document.createElement('div');
    const idless = document.createElement('div');
    host.append(idless);

    expect(
      resolveBoundControlFromBindings(fieldStateWithBindings([idless]), host),
    ).toBeNull();
  });

  it('skips id-less binding hosts but still returns a later id-bearing one', () => {
    const host = document.createElement('div');
    const idless = document.createElement('div');
    const withId = document.createElement('input');
    withId.id = 'control';
    host.append(idless, withId);

    expect(
      resolveBoundControlFromBindings(
        fieldStateWithBindings([idless, withId]),
        host,
      ),
    ).toBe(withId);
  });

  it('ignores bindings whose element is outside this host (field bound across wrappers)', () => {
    const host = document.createElement('div');
    const otherHost = document.createElement('div');
    const outside = document.createElement('input');
    outside.id = 'outside';
    const inside = document.createElement('input');
    inside.id = 'inside';
    otherHost.append(outside);
    host.append(inside);

    expect(
      resolveBoundControlFromBindings(
        fieldStateWithBindings([outside, inside]),
        host,
      ),
    ).toBe(inside);
  });

  it('skips non-HTMLElement binding hosts', () => {
    const host = document.createElement('div');
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    host.append(svg);

    expect(
      resolveBoundControlFromBindings(fieldStateWithBindings([svg]), host),
    ).toBeNull();
  });
});
