import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  form,
  required,
  schema,
  submit,
  validate,
  type FieldTree,
} from '@angular/forms/signals';
import { describe, expect, it, vi } from 'vitest';
import { submitWithWarnings } from './submission-helpers';
import { warningError } from './warning-error';

/**
 * Drift guard for `submitWithWarnings`.
 *
 * `submitWithWarnings` mirrors Angular's submission flow in user land:
 * mark-all-touched → wait a microtask → filter `errorSummary()` down to
 * blocking errors → run the action. If Angular's `submit()` semantics change
 * in a future release (e.g. it stops marking fields touched on an invalid
 * short-circuit, or the `errorSummary()` shape shifts), the toolkit helper
 * drifts silently in production unless a test is exercising a **real**
 * Angular signal form rather than a hand-rolled mock.
 *
 * These tests therefore pin equivalence (or deliberate divergence) across
 * three scenarios: invalid short-circuit on blocking errors, warning-only
 * divergence (native blocks, toolkit runs), and valid submission. When one
 * of them fails after an Angular upgrade, treat it as a signal to re-read
 * `submission-helpers.ts` and realign before updating the assertion.
 *
 * @see ./submission-helpers.spec.ts — unit tests against mock field trees
 *   for warning-handling semantics (faster, no TestBed). This file is the
 *   real-form companion kept separate so the stricter Angular types don't
 *   collide with the loose duck-typing used by the mock helpers there.
 */
describe('submitWithWarnings — Angular submit() drift guard', () => {
  interface ContactModel {
    email: string;
    name: string;
  }

  const makeContactForm = (): FieldTree<ContactModel> => {
    const model = signal({ email: '', name: '' });
    return TestBed.runInInjectionContext(() =>
      form(
        model,
        schema((path) => {
          required(path.email, { message: 'Email is required' });
          required(path.name, { message: 'Name is required' });
        }),
      ),
    );
  };

  it('matches Angular submit() when the form has only blocking errors', async () => {
    const nativeForm = makeContactForm();
    const nativeAction = vi.fn(async () => {});

    await submit(nativeForm, nativeAction);

    const toolkitForm = makeContactForm();
    const toolkitAction = vi.fn(async () => {});

    await submitWithWarnings(toolkitForm, toolkitAction);

    // Both should short-circuit: action is never invoked.
    expect(nativeAction).not.toHaveBeenCalled();
    expect(toolkitAction).not.toHaveBeenCalled();

    // Both should still have marked the form touched.
    expect(toolkitForm().touched()).toBe(nativeForm().touched());
  });

  it('invokes the action when the only errors are warnings, while native submit() short-circuits', async () => {
    // This pins the warning-aware behavior that `submitWithWarnings` exists to
    // provide: Angular treats `warn:*` errors as `invalid()` and blocks `submit`,
    // while the toolkit helper must filter blocking errors from `errorSummary()`
    // and still run the action. If this test fails after an Angular upgrade,
    // Angular has likely changed how it categorizes validation errors — realign
    // `getBlockingErrors` / `isBlockingError` before updating the assertion.
    const makeWarningOnlyForm = (): FieldTree<{ username: string }> => {
      const model = signal({ username: 'abc' });
      return TestBed.runInInjectionContext(() =>
        form(
          model,
          schema<{ username: string }>((path) => {
            validate(path.username, (ctx) => {
              const value = ctx.value();
              if (value && value.length < 6) {
                return warningError(
                  'short-username',
                  'Consider using 6+ characters',
                );
              }
              return null;
            });
          }),
        ),
      );
    };

    const nativeForm = makeWarningOnlyForm();
    const nativeAction = vi.fn(async () => {});
    await submit(nativeForm, nativeAction);

    const toolkitForm = makeWarningOnlyForm();
    const toolkitAction = vi.fn(async () => {});
    await submitWithWarnings(toolkitForm, toolkitAction);

    // Angular's native submit() treats the warn:* error as blocking and
    // short-circuits — this is the foot-gun submitWithWarnings fixes.
    expect(nativeAction).not.toHaveBeenCalled();

    // The toolkit helper must see the warning and still run the action.
    expect(toolkitAction).toHaveBeenCalledOnce();

    // Both should still have marked the form touched.
    expect(toolkitForm().touched()).toBe(nativeForm().touched());
  });

  it('matches Angular submit() when the form is valid', async () => {
    const fillValidValues = (f: FieldTree<ContactModel>): void => {
      f.email().value.set('user@example.com');
      f.name().value.set('Ada Lovelace');
    };

    const nativeForm = makeContactForm();
    fillValidValues(nativeForm);
    const nativeAction = vi.fn(async () => {});

    await submit(nativeForm, nativeAction);

    const toolkitForm = makeContactForm();
    fillValidValues(toolkitForm);
    const toolkitAction = vi.fn(async () => {});

    await submitWithWarnings(toolkitForm, toolkitAction);

    // Both should invoke the action exactly once.
    expect(nativeAction).toHaveBeenCalledOnce();
    expect(toolkitAction).toHaveBeenCalledOnce();

    expect(toolkitForm().touched()).toBe(nativeForm().touched());
  });
});
