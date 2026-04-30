import { signal, type Signal } from '@angular/core';
import type { FieldState, ValidationError } from '@angular/forms/signals';
import { describe, expect, it } from 'vitest';
import { warningError } from '../warning-error';
import { createAriaInvalidSignal } from './create-aria-invalid-signal';

type FieldStateStub = Pick<FieldState<unknown>, 'errors'>;

function fieldStateSignal(
  errors: readonly ValidationError[],
): Signal<FieldState<unknown> | null> {
  const stub: FieldStateStub = { errors: signal(errors) };
  return signal(stub as FieldState<unknown>);
}

describe('createAriaInvalidSignal', () => {
  it('returns "true" when visible and the field has a blocking error', () => {
    const fieldState = fieldStateSignal([
      { kind: 'required', message: 'Required' },
    ]);
    const visibility = signal(true);

    const ariaInvalid = createAriaInvalidSignal(fieldState, visibility);

    expect(ariaInvalid()).toBe('true');
  });

  it('returns "false" when visible but the field has no blocking errors', () => {
    const fieldState = fieldStateSignal([]);
    const visibility = signal(true);

    const ariaInvalid = createAriaInvalidSignal(fieldState, visibility);

    expect(ariaInvalid()).toBe('false');
  });

  it('returns "false" when visible and the field has only warning-kind errors', () => {
    const fieldState = fieldStateSignal([warningError('weak-password')]);
    const visibility = signal(true);

    const ariaInvalid = createAriaInvalidSignal(fieldState, visibility);

    expect(ariaInvalid()).toBe('false');
  });

  it('returns "false" when visibility is false even with blocking errors', () => {
    // The strategy says "do not show errors yet" (e.g. on-touch + untouched),
    // so aria-invalid must not announce the error.
    const fieldState = fieldStateSignal([
      { kind: 'required', message: 'Required' },
    ]);
    const visibility = signal(false);

    const ariaInvalid = createAriaInvalidSignal(fieldState, visibility);

    expect(ariaInvalid()).toBe('false');
  });

  it('returns null when the control is not laid out (isControlVisible=false)', () => {
    const fieldState = fieldStateSignal([
      { kind: 'required', message: 'Required' },
    ]);
    const visibility = signal(true);
    const isControlVisible = signal(false);

    const ariaInvalid = createAriaInvalidSignal(
      fieldState,
      visibility,
      isControlVisible,
    );

    expect(ariaInvalid()).toBeNull();
  });

  it('returns the resolved value when the control is laid out (isControlVisible=true)', () => {
    const fieldState = fieldStateSignal([
      { kind: 'required', message: 'Required' },
    ]);
    const visibility = signal(true);
    const isControlVisible = signal(true);

    const ariaInvalid = createAriaInvalidSignal(
      fieldState,
      visibility,
      isControlVisible,
    );

    expect(ariaInvalid()).toBe('true');
  });

  it('returns null when no field state is bound', () => {
    const fieldState = signal<FieldState<unknown> | null>(null);
    const visibility = signal(true);

    const ariaInvalid = createAriaInvalidSignal(fieldState, visibility);

    expect(ariaInvalid()).toBeNull();
  });

  it('reacts to errors becoming present', () => {
    const errors = signal<readonly ValidationError[]>([]);
    const stub = signal<FieldState<unknown> | null>({
      errors,
    } as FieldState<unknown>);
    const visibility = signal(true);

    const ariaInvalid = createAriaInvalidSignal(stub, visibility);
    expect(ariaInvalid()).toBe('false');

    errors.set([{ kind: 'required', message: 'Required' }]);
    expect(ariaInvalid()).toBe('true');
  });

  it('reacts to visibility flipping on', () => {
    const fieldState = fieldStateSignal([
      { kind: 'required', message: 'Required' },
    ]);
    const visibility = signal(false);

    const ariaInvalid = createAriaInvalidSignal(fieldState, visibility);
    expect(ariaInvalid()).toBe('false');

    visibility.set(true);
    expect(ariaInvalid()).toBe('true');
  });

  it('reacts to isControlVisible toggling', () => {
    const fieldState = fieldStateSignal([
      { kind: 'required', message: 'Required' },
    ]);
    const visibility = signal(true);
    const isControlVisible = signal(true);

    const ariaInvalid = createAriaInvalidSignal(
      fieldState,
      visibility,
      isControlVisible,
    );
    expect(ariaInvalid()).toBe('true');

    isControlVisible.set(false);
    expect(ariaInvalid()).toBeNull();

    isControlVisible.set(true);
    expect(ariaInvalid()).toBe('true');
  });

  it('reacts to the bound field state going from null to populated', () => {
    const populated = fieldStateSignal([
      { kind: 'required', message: 'Required' },
    ])();
    const fieldState = signal<FieldState<unknown> | null>(null);
    const visibility = signal(true);

    const ariaInvalid = createAriaInvalidSignal(fieldState, visibility);
    expect(ariaInvalid()).toBeNull();

    fieldState.set(populated);
    expect(ariaInvalid()).toBe('true');
  });
});
