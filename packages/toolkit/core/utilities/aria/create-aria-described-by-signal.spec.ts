import { signal, type Signal } from '@angular/core';
import type { FieldState, ValidationError } from '@angular/forms/signals';
import { describe, expect, it } from 'vitest';
import { warningError } from '../warning-error';
import { createAriaDescribedBySignal } from './create-aria-described-by-signal';

type FieldStateStub = Pick<FieldState<unknown>, 'errors'>;

function fieldStateSignal(
  errors: readonly ValidationError[] = [],
): Signal<FieldState<unknown> | null> {
  const stub: FieldStateStub = { errors: signal(errors) };
  return signal(stub as FieldState<unknown>);
}

describe('createAriaDescribedBySignal', () => {
  it('preserves non-managed IDs verbatim when no hints, errors, or warnings apply', () => {
    const fieldState = fieldStateSignal([]);
    const hintIds = signal<readonly string[]>([]);
    const visibility = signal(false);

    const ariaDescribedBy = createAriaDescribedBySignal({
      fieldState,
      hintIds,
      visibility,
      preservedIds: () => 'email-description',
      fieldName: () => 'email',
    });

    expect(ariaDescribedBy()).toBe('email-description');
  });

  it('returns the preserved list verbatim when no field name is resolved', () => {
    const fieldState = fieldStateSignal([
      { kind: 'required', message: 'Required' },
    ]);
    const hintIds = signal<readonly string[]>(['ignored-hint']);
    const visibility = signal(true);

    const ariaDescribedBy = createAriaDescribedBySignal({
      fieldState,
      hintIds,
      visibility,
      preservedIds: () => 'email-description',
      fieldName: () => null,
    });

    expect(ariaDescribedBy()).toBe('email-description');
  });

  it('appends hint IDs after the preserved list', () => {
    const fieldState = fieldStateSignal([]);
    const hintIds = signal<readonly string[]>(['email-hint', 'email-hint-2']);
    const visibility = signal(false);

    const ariaDescribedBy = createAriaDescribedBySignal({
      fieldState,
      hintIds,
      visibility,
      preservedIds: () => 'email-description',
      fieldName: () => 'email',
    });

    expect(ariaDescribedBy()).toBe('email-description email-hint email-hint-2');
  });

  it('appends the error ID when the field has blocking errors and visibility is true', () => {
    const fieldState = fieldStateSignal([
      { kind: 'required', message: 'Required' },
    ]);
    const hintIds = signal<readonly string[]>([]);
    const visibility = signal(true);

    const ariaDescribedBy = createAriaDescribedBySignal({
      fieldState,
      hintIds,
      visibility,
      preservedIds: () => null,
      fieldName: () => 'email',
    });

    expect(ariaDescribedBy()).toBe('email-error');
  });

  it('does NOT append the error ID when visibility is false even with blocking errors', () => {
    const fieldState = fieldStateSignal([
      { kind: 'required', message: 'Required' },
    ]);
    const hintIds = signal<readonly string[]>([]);
    const visibility = signal(false);

    const ariaDescribedBy = createAriaDescribedBySignal({
      fieldState,
      hintIds,
      visibility,
      preservedIds: () => null,
      fieldName: () => 'email',
    });

    expect(ariaDescribedBy()).toBeNull();
  });

  it('appends the warning ID when the field has warning errors and visibility is true', () => {
    const fieldState = fieldStateSignal([warningError('weak-password')]);
    const hintIds = signal<readonly string[]>([]);
    const visibility = signal(true);

    const ariaDescribedBy = createAriaDescribedBySignal({
      fieldState,
      hintIds,
      visibility,
      preservedIds: () => null,
      fieldName: () => 'password',
    });

    expect(ariaDescribedBy()).toBe('password-warning');
  });

  it('appends both error and warning IDs when both kinds are present and visible', () => {
    const fieldState = fieldStateSignal([
      { kind: 'required', message: 'Required' },
      warningError('weak-password'),
    ]);
    const hintIds = signal<readonly string[]>([]);
    const visibility = signal(true);

    const ariaDescribedBy = createAriaDescribedBySignal({
      fieldState,
      hintIds,
      visibility,
      preservedIds: () => null,
      fieldName: () => 'password',
    });

    expect(ariaDescribedBy()).toBe('password-error password-warning');
  });

  it('composes preserved + hint + error + warning IDs in that order', () => {
    const fieldState = fieldStateSignal([
      { kind: 'required', message: 'Required' },
      warningError('weak-password'),
    ]);
    const hintIds = signal<readonly string[]>(['password-hint']);
    const visibility = signal(true);

    const ariaDescribedBy = createAriaDescribedBySignal({
      fieldState,
      hintIds,
      visibility,
      preservedIds: () => 'password-description',
      fieldName: () => 'password',
    });

    expect(ariaDescribedBy()).toBe(
      'password-description password-hint password-error password-warning',
    );
  });

  it('deduplicates IDs that already appear in the preserved list', () => {
    const fieldState = fieldStateSignal([
      { kind: 'required', message: 'Required' },
      warningError('weak-password'),
    ]);
    const hintIds = signal<readonly string[]>(['password-hint']);
    const visibility = signal(true);

    // Consumer's preserved list already contains every managed ID — the
    // factory must not duplicate them.
    const ariaDescribedBy = createAriaDescribedBySignal({
      fieldState,
      hintIds,
      visibility,
      preservedIds: () =>
        'password-hint password-error password-warning password-description',
      fieldName: () => 'password',
    });

    expect(ariaDescribedBy()).toBe(
      'password-hint password-error password-warning password-description',
    );
  });

  it('deduplicates duplicate hint IDs supplied by the input signal', () => {
    const fieldState = fieldStateSignal([]);
    const hintIds = signal<readonly string[]>(['hint-a', 'hint-a', 'hint-b']);
    const visibility = signal(false);

    const ariaDescribedBy = createAriaDescribedBySignal({
      fieldState,
      hintIds,
      visibility,
      preservedIds: () => null,
      fieldName: () => 'email',
    });

    expect(ariaDescribedBy()).toBe('hint-a hint-b');
  });

  it('returns null when nothing accumulates', () => {
    const fieldState = fieldStateSignal([]);
    const hintIds = signal<readonly string[]>([]);
    const visibility = signal(true);

    const ariaDescribedBy = createAriaDescribedBySignal({
      fieldState,
      hintIds,
      visibility,
      preservedIds: () => null,
      fieldName: () => 'email',
    });

    expect(ariaDescribedBy()).toBeNull();
  });

  it('returns null when field state is null and no preserved/hint IDs accumulate', () => {
    const fieldState = signal<FieldState<unknown> | null>(null);
    const hintIds = signal<readonly string[]>([]);
    const visibility = signal(true);

    const ariaDescribedBy = createAriaDescribedBySignal({
      fieldState,
      hintIds,
      visibility,
      preservedIds: () => null,
      fieldName: () => 'email',
    });

    expect(ariaDescribedBy()).toBeNull();
  });

  it('still appends preserved + hint IDs when field state is null', () => {
    const fieldState = signal<FieldState<unknown> | null>(null);
    const hintIds = signal<readonly string[]>(['email-hint']);
    const visibility = signal(true);

    const ariaDescribedBy = createAriaDescribedBySignal({
      fieldState,
      hintIds,
      visibility,
      preservedIds: () => 'email-description',
      fieldName: () => 'email',
    });

    expect(ariaDescribedBy()).toBe('email-description email-hint');
  });

  it('re-reads preservedIds across reactive updates', () => {
    // The directive's preserved-IDs reader is backed by `#domSnapshot()`,
    // a signal — so when the snapshot changes, the factory must pick up the
    // fresh preserved list. Drive that with a signal-backed reader here.
    const preserved = signal<string | null>('first-description');
    const fieldState = fieldStateSignal([]);
    const hintIds = signal<readonly string[]>(['email-hint']);
    const visibility = signal(false);

    const ariaDescribedBy = createAriaDescribedBySignal({
      fieldState,
      hintIds,
      visibility,
      preservedIds: () => preserved(),
      fieldName: () => 'email',
    });

    expect(ariaDescribedBy()).toBe('first-description email-hint');

    preserved.set('second-description');
    expect(ariaDescribedBy()).toBe('second-description email-hint');

    preserved.set(null);
    expect(ariaDescribedBy()).toBe('email-hint');
  });

  it('reacts to hint IDs being added and removed', () => {
    const hintIds = signal<readonly string[]>([]);
    const fieldState = fieldStateSignal([]);
    const visibility = signal(false);

    const ariaDescribedBy = createAriaDescribedBySignal({
      fieldState,
      hintIds,
      visibility,
      preservedIds: () => null,
      fieldName: () => 'email',
    });

    expect(ariaDescribedBy()).toBeNull();

    hintIds.set(['email-hint']);
    expect(ariaDescribedBy()).toBe('email-hint');

    hintIds.set([]);
    expect(ariaDescribedBy()).toBeNull();
  });

  it('reacts to visibility flipping while errors are present', () => {
    const fieldState = fieldStateSignal([
      { kind: 'required', message: 'Required' },
    ]);
    const hintIds = signal<readonly string[]>([]);
    const visibility = signal(false);

    const ariaDescribedBy = createAriaDescribedBySignal({
      fieldState,
      hintIds,
      visibility,
      preservedIds: () => null,
      fieldName: () => 'email',
    });

    expect(ariaDescribedBy()).toBeNull();

    visibility.set(true);
    expect(ariaDescribedBy()).toBe('email-error');

    visibility.set(false);
    expect(ariaDescribedBy()).toBeNull();
  });

  it('reacts to errors changing on the bound field state', () => {
    const errors = signal<readonly ValidationError[]>([]);
    const stub = signal<FieldState<unknown> | null>({
      errors,
    } as FieldState<unknown>);
    const hintIds = signal<readonly string[]>([]);
    const visibility = signal(true);

    const ariaDescribedBy = createAriaDescribedBySignal({
      fieldState: stub,
      hintIds,
      visibility,
      preservedIds: () => null,
      fieldName: () => 'email',
    });

    expect(ariaDescribedBy()).toBeNull();

    errors.set([{ kind: 'required', message: 'Required' }]);
    expect(ariaDescribedBy()).toBe('email-error');

    errors.set([warningError('weak')]);
    expect(ariaDescribedBy()).toBe('email-warning');
  });

  it('reacts to the field name reader changing', () => {
    const fieldName = signal<string | null>('email');
    const fieldState = fieldStateSignal([
      { kind: 'required', message: 'Required' },
    ]);
    const hintIds = signal<readonly string[]>([]);
    const visibility = signal(true);

    const ariaDescribedBy = createAriaDescribedBySignal({
      fieldState,
      hintIds,
      visibility,
      preservedIds: () => null,
      fieldName: () => fieldName(),
    });

    expect(ariaDescribedBy()).toBe('email-error');

    fieldName.set('username');
    expect(ariaDescribedBy()).toBe('username-error');

    fieldName.set(null);
    expect(ariaDescribedBy()).toBeNull();
  });
});
