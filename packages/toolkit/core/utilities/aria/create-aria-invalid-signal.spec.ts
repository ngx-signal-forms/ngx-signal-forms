import { signal, type Signal } from '@angular/core';
import type {
  FieldState,
  ReadonlyFieldTree,
  ValidationError,
} from '@angular/forms/signals';
import { describe, expect, it } from 'vitest';
import { warningError } from '../warning-error';
import { createAriaInvalidSignal } from './create-aria-invalid-signal';

type FieldStateStub = Pick<FieldState<unknown>, 'errors'>;

/**
 * `FieldState.errors` is `Signal<ValidationError.WithFieldTree[]>`: every
 * error Angular emits carries a back-reference to the (callable) node that
 * produced it. These specs used to hold bare `ValidationError`s, a shape no
 * real form ever emits. The two assertions are confined to this one factory —
 * the stub deliberately implements only the `errors` slice that this pure
 * factory reads, and the node is callable, as every real `FieldTree` is.
 */
function createFieldStateStub(initialErrors: readonly ValidationError[] = []): {
  readonly state: FieldState<unknown>;
  readonly setErrors: (next: readonly ValidationError[]) => void;
} {
  const errors = signal<ValidationError.WithFieldTree[]>([]);
  const stub: FieldStateStub = { errors };
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Narrowing a deliberate partial stub to the slice under test.
  const state = stub as FieldState<unknown>;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- A FieldTree is callable; this stand-in only serves as the errors' back-reference.
  const fieldTree = (() => state) as unknown as ReadonlyFieldTree<unknown>;
  const setErrors = (next: readonly ValidationError[]): void => {
    errors.set(next.map((error) => ({ ...error, fieldTree })));
  };

  setErrors(initialErrors);

  return { state, setErrors };
}

function fieldStateSignal(
  errors: readonly ValidationError[],
): Signal<FieldState<unknown> | null> {
  return signal(createFieldStateStub(errors).state);
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
    const { state, setErrors } = createFieldStateStub();
    const stub = signal<FieldState<unknown> | null>(state);
    const visibility = signal(true);

    const ariaInvalid = createAriaInvalidSignal(stub, visibility);
    expect(ariaInvalid()).toBe('false');

    setErrors([{ kind: 'required', message: 'Required' }]);
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
