import { signal, type Signal } from '@angular/core';
import type {
  FieldState,
  ReadonlyFieldTree,
  ValidationError,
} from '@angular/forms/signals';
import { describe, expect, it } from 'vitest';
import { warningError } from '../warning-error';
import { createAriaDescribedBySignal } from './create-aria-described-by-signal';

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
  errors: readonly ValidationError[] = [],
): Signal<FieldState<unknown> | null> {
  return signal(createFieldStateStub(errors).state);
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

  it('appends ONLY the error ID (not warning) when both kinds are present and visible', () => {
    // The default `NgxFormFieldError` renderer suppresses its warning live
    // region whenever a blocking error is also visible (mixed error+warning
    // case) — matching README's documented "blocking errors present →
    // warnings hidden" contract and `NgxFormFieldset`'s existing behavior.
    // No `${fieldName}-warning` element exists in the DOM in that state, so
    // composing it into `aria-describedby` here would dangle.
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

    expect(ariaDescribedBy()).toBe('password-error');
  });

  /**
   * The `warningVisibility` option is optional "for backwards compatibility
   * with callers written before the two channels could diverge" (see the
   * option's JSDoc). When omitted, the factory falls back to `visibility`
   * (the **error** channel) for the warning decision too — which is only
   * correct while both display strategies agree. These specs pin the edge
   * case explicitly: a caller that omits `warningVisibility` on a form
   * where the error and warning strategies actually diverge (e.g.
   * `errorStrategy="on-submit"` + `warningStrategy="immediate"`) gets the
   * *error* channel's timing applied to the warning, not the warning
   * channel's own timing — silently suppressing (or prematurely showing)
   * warnings until the caller threads `warningVisibility` through.
   */
  describe('two-channel visibility: warningVisibility omitted while the channels diverge', () => {
    it('suppresses a warning-only field when the fallback (error) visibility is false, even though a real warning-strategy would show it', () => {
      // Simulates errorStrategy="on-submit" (visibility=false pre-submit)
      // with warningStrategy="immediate" (should be visible pre-submit).
      // Without warningVisibility, the warning incorrectly inherits the
      // error channel's "not yet visible" timing.
      const fieldState = fieldStateSignal([warningError('weak-password')]);
      const hintIds = signal<readonly string[]>([]);
      const errorChannelVisibility = signal(false);

      const ariaDescribedBy = createAriaDescribedBySignal({
        fieldState,
        hintIds,
        visibility: errorChannelVisibility,
        // warningVisibility intentionally omitted.
        preservedIds: () => null,
        fieldName: () => 'password',
      });

      expect(ariaDescribedBy()).toBeNull();
    });

    it('passing the real warning-strategy visibility as warningVisibility surfaces the warning that the fallback would have suppressed', () => {
      // Same divergent scenario as above, but now the caller threads the
      // warning channel's own resolved visibility through — the documented
      // fix for the omitted-parameter edge case.
      const fieldState = fieldStateSignal([warningError('weak-password')]);
      const hintIds = signal<readonly string[]>([]);
      const errorChannelVisibility = signal(false);
      const warningChannelVisibility = signal(true);

      const ariaDescribedBy = createAriaDescribedBySignal({
        fieldState,
        hintIds,
        visibility: errorChannelVisibility,
        warningVisibility: warningChannelVisibility,
        preservedIds: () => null,
        fieldName: () => 'password',
      });

      expect(ariaDescribedBy()).toBe('password-warning');
    });

    it('the omitted-parameter fallback can also over-show: a true error-channel visibility surfaces a warning even when the real warning strategy would still be hiding it', () => {
      // Mirror case: errorStrategy="immediate" (visibility=true) with
      // warningStrategy="on-submit" (should still be hidden pre-submit).
      // Without warningVisibility, the warning incorrectly inherits the
      // error channel's "already visible" timing.
      const fieldState = fieldStateSignal([warningError('weak-password')]);
      const hintIds = signal<readonly string[]>([]);
      const errorChannelVisibility = signal(true);

      const ariaDescribedBy = createAriaDescribedBySignal({
        fieldState,
        hintIds,
        visibility: errorChannelVisibility,
        // warningVisibility intentionally omitted — the real warning
        // strategy (on-submit, not yet submitted) would resolve to false.
        preservedIds: () => null,
        fieldName: () => 'password',
      });

      expect(ariaDescribedBy()).toBe('password-warning');
    });
  });

  it('composes preserved + hint + error IDs (warning omitted) when a blocking error is also present', () => {
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
      'password-description password-hint password-error',
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
    const { state, setErrors } = createFieldStateStub();
    const stub = signal<FieldState<unknown> | null>(state);
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

    setErrors([{ kind: 'required', message: 'Required' }]);
    expect(ariaDescribedBy()).toBe('email-error');

    setErrors([warningError('weak')]);
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
