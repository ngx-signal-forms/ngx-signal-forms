import { signal, type Signal } from '@angular/core';
import { describe, expect, it } from 'vitest';
import {
  createAriaRequiredSignal,
  type AriaRequiredFieldState,
} from './create-aria-required-signal';

function createMockFieldState(required: boolean): {
  fieldState: AriaRequiredFieldState;
  setRequired: (value: boolean) => void;
} {
  const requiredSignal = signal(required);
  return {
    fieldState: { required: requiredSignal },
    setRequired: (value) => {
      requiredSignal.set(value);
    },
  };
}

describe('createAriaRequiredSignal', () => {
  it("returns 'true' when the field is required", () => {
    const { fieldState } = createMockFieldState(true);
    const fieldStateSignal: Signal<AriaRequiredFieldState | null> =
      signal(fieldState);

    const ariaRequired = createAriaRequiredSignal(fieldStateSignal);

    expect(ariaRequired()).toBe('true');
  });

  it('returns null when the field is not required', () => {
    const { fieldState } = createMockFieldState(false);
    const fieldStateSignal: Signal<AriaRequiredFieldState | null> =
      signal(fieldState);

    const ariaRequired = createAriaRequiredSignal(fieldStateSignal);

    expect(ariaRequired()).toBeNull();
  });

  it('returns null when no field state is available', () => {
    const fieldStateSignal: Signal<AriaRequiredFieldState | null> =
      signal(null);

    const ariaRequired = createAriaRequiredSignal(fieldStateSignal);

    expect(ariaRequired()).toBeNull();
  });

  it("transitions from null to 'true' when required() flips on", () => {
    const { fieldState, setRequired } = createMockFieldState(false);
    const fieldStateSignal: Signal<AriaRequiredFieldState | null> =
      signal(fieldState);

    const ariaRequired = createAriaRequiredSignal(fieldStateSignal);

    expect(ariaRequired()).toBeNull();

    setRequired(true);
    expect(ariaRequired()).toBe('true');
  });

  it("transitions from 'true' to null when required() flips off", () => {
    const { fieldState, setRequired } = createMockFieldState(true);
    const fieldStateSignal: Signal<AriaRequiredFieldState | null> =
      signal(fieldState);

    const ariaRequired = createAriaRequiredSignal(fieldStateSignal);

    expect(ariaRequired()).toBe('true');

    setRequired(false);
    expect(ariaRequired()).toBeNull();
  });

  it('reacts when the field state itself swaps from null to a real state', () => {
    const fieldStateSignal = signal<AriaRequiredFieldState | null>(null);

    const ariaRequired = createAriaRequiredSignal(fieldStateSignal);

    expect(ariaRequired()).toBeNull();

    const { fieldState } = createMockFieldState(true);
    fieldStateSignal.set(fieldState);
    expect(ariaRequired()).toBe('true');

    fieldStateSignal.set(null);
    expect(ariaRequired()).toBeNull();
  });
});
