import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  form,
  required,
  schema,
  type FieldState,
  type FieldTree,
  type ValidationError,
} from '@angular/forms/signals';
import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  type ErrorReadableState,
  type ErrorVisibilityState,
} from './field-state-types';

/**
 * Contract spec for `ErrorVisibilityState` and `ErrorReadableState`.
 *
 * These two types are `Pick<FieldState<unknown>, …>` slices published in the
 * toolkit's public API. If an Angular major-version bump renames `invalid`,
 * moves `touched`, or restructures `errors`, those types would silently change
 * shape in the published `.d.ts` — consumers would get compile errors
 * against the *toolkit* rather than against Angular directly, making the
 * root cause opaque.
 *
 * **Runtime assertions** (the enforced tripwire): build a real `FieldState`
 * inside `TestBed.runInInjectionContext` and assert the duck-typed contract the
 * toolkit actually relies on — callable members that return the right JS
 * primitives.  These assertions fail `pnpm nx test toolkit` immediately when
 * Angular moves the contract.
 *
 * **`expectTypeOf` assertions** (compile-time documentation): inert today
 * because spec files are currently not typechecked (see plans/README.md for
 * the payoff plan), but they become enforced once that debt is cleared and
 * serve as living documentation of what the Pick types are supposed to surface.
 *
 * @see ./field-state-types.ts — the two Pick types guarded here
 * @see ./submission-helpers.drift.spec.ts — real-form drift guard for the
 *   submission helpers that consume these types at runtime
 */
describe('FieldState contract — ErrorVisibilityState and ErrorReadableState', () => {
  interface TestModel {
    email: string;
  }

  /**
   * Build a real form with a failing required validator on the email leaf.
   * `form().invalid()` is true; `form.email().errors()` is non-empty.
   * The root state's `errors()` contains only direct root-level errors; child
   * errors live on the child FieldState — access via `form.email()`.
   */
  const makeFormWithInvalidEmail = (): FieldTree<TestModel> => {
    const model = signal({ email: '' });
    return TestBed.runInInjectionContext(() =>
      form(
        model,
        schema<TestModel>((path) => {
          required(path.email, { message: 'Email is required' });
        }),
      ),
    );
  };

  describe('Runtime contracts (enforced tripwire)', () => {
    it('invalid() is a callable that returns a boolean', () => {
      const f = makeFormWithInvalidEmail();
      const state = f();

      expect(typeof state.invalid).toBe('function');
      expect(typeof state.invalid()).toBe('boolean');
      // The form has a required error on an empty email field — must be invalid.
      expect(state.invalid()).toBe(true);
    });

    it('touched() is a callable that returns a boolean', () => {
      const f = makeFormWithInvalidEmail();
      const state = f();

      expect(typeof state.touched).toBe('function');
      expect(typeof state.touched()).toBe('boolean');
      // Fresh form — not yet touched.
      expect(state.touched()).toBe(false);
    });

    it('errors() is a callable that returns an array', () => {
      // errors() on a leaf field (email) is the direct error list for that field.
      const f = makeFormWithInvalidEmail();
      const emailState = f.email();

      expect(typeof emailState.errors).toBe('function');
      expect(Array.isArray(emailState.errors())).toBe(true);
    });

    it('errors() elements each have a string `kind` property', () => {
      // The required validator fires on the email leaf, not on the root — read
      // leaf state to see the non-empty error list.
      const f = makeFormWithInvalidEmail();
      const emailState = f.email();
      const errors = emailState.errors();

      // There must be at least one error for the failing required validator.
      expect(errors.length).toBeGreaterThan(0);
      for (const e of errors) {
        expect(typeof e.kind).toBe('string');
      }
    });
  });

  // ---------------------------------------------------------------------------
  // Type-level documentation (inert until spec typecheck debt is paid)
  // These assertions become enforced once tsc --noEmit passes on spec files.
  // ---------------------------------------------------------------------------
  describe('Type-level documentation (expectTypeOf)', () => {
    it('ErrorVisibilityState.invalid() returns boolean', () => {
      expectTypeOf<
        ReturnType<ErrorVisibilityState['invalid']>
      >().toEqualTypeOf<boolean>();
    });

    it('ErrorVisibilityState.touched() returns boolean', () => {
      expectTypeOf<
        ReturnType<ErrorVisibilityState['touched']>
      >().toEqualTypeOf<boolean>();
    });

    it('ErrorReadableState.errors() returns an array of ValidationError-shaped objects', () => {
      type ErrorsReturnType = ReturnType<ErrorReadableState['errors']>;
      // The element type must extend the base ValidationError shape (has `kind: string`).
      expectTypeOf<ErrorsReturnType[number]>().toExtend<ValidationError>();
    });

    it('a real FieldState<unknown> is assignable to both Pick types', () => {
      // Assigning a FieldState to the narrower Pick types must compile — these
      // are the structural subtype checks that catch renames at the source.
      type RealState = FieldState<unknown>;
      expectTypeOf<RealState>().toExtend<ErrorVisibilityState>();
      expectTypeOf<RealState>().toExtend<ErrorReadableState>();
    });
  });
});
