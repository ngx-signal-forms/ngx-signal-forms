import { ApplicationRef, resource } from '@angular/core';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  applyEach,
  form,
  required,
  schema,
  submit,
  validate,
  validateAsync,
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

  it('marks nested-object and array subtrees as touched before reading errorSummary()', async () => {
    // Contract for the native `submit(..., { ignoreValidators: 'all' })`
    // delegation inside `submitWithWarnings()`: every leaf in the form tree —
    // including children under nested objects AND each element of an array —
    // MUST be touched before the helper filters `errorSummary()`.
    interface Address {
      street: string;
      city: string;
    }
    interface OrderModel {
      address: Address;
      items: readonly string[];
    }

    const model = signal<OrderModel>({
      address: { street: '', city: '' },
      items: ['', ''],
    });

    const orderForm: FieldTree<OrderModel> = TestBed.runInInjectionContext(() =>
      form(
        model,
        schema<OrderModel>((path) => {
          required(path.address.street, { message: 'street' });
          required(path.address.city, { message: 'city' });
          applyEach(path.items, (itemPath) => {
            required(itemPath, { message: 'item' });
          });
        }),
      ),
    );

    // Before submit: nothing is touched.
    expect(orderForm().touched()).toBe(false);
    expect(orderForm.address.street().touched()).toBe(false);
    expect(orderForm.address.city().touched()).toBe(false);
    expect(orderForm.items[0]().touched()).toBe(false);
    expect(orderForm.items[1]().touched()).toBe(false);

    const action = vi.fn(async () => {});
    await submitWithWarnings(orderForm, action);

    // Nested object leaves MUST be touched.
    expect(orderForm.address.street().touched()).toBe(true);
    expect(orderForm.address.city().touched()).toBe(true);

    // Array element leaves MUST be touched.
    expect(orderForm.items[0]().touched()).toBe(true);
    expect(orderForm.items[1]().touched()).toBe(true);

    // Root aggregates the touched state.
    expect(orderForm().touched()).toBe(true);

    // Blocking errors remain → action is not invoked.
    expect(action).not.toHaveBeenCalled();
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

  it('propagates action rejection and leaves the form re-submittable', async () => {
    // Pins the behavior of `submitWithWarnings` when the user's action rejects:
    // the rejection must surface to the caller (not swallowed), AND the form
    // must be re-submittable on the next call (Plan 001's `finally` clears the
    // in-flight WeakSet guard even when the action throws).
    //
    // Native Angular `submit()` comparison (Angular 22.0.0): native `submit()`
    // also re-throws action rejections — both helpers match on this dimension.
    // The re-submittability guarantee is unique to `submitWithWarnings` because
    // native `submit()` manages its own `submitting()` signal via its own
    // internal in-flight tracking; `submitWithWarnings` uses an external WeakSet
    // that must be explicitly cleared in `finally` to avoid a stuck form.
    const fillValidValues = (f: FieldTree<ContactModel>): void => {
      f.email().value.set('user@example.com');
      f.name().value.set('Ada Lovelace');
    };

    const actionError = new Error('server error');
    const rejectingAction = vi.fn(() => Promise.reject<void>(actionError));
    const workingAction = vi.fn(() => Promise.resolve());

    // Native submit() on a rejecting action: Angular re-throws the rejection
    // rather than swallowing it (observed with Angular 22.0.0). The native
    // `submit()` call rejects with the action's error, matching the raw
    // promise semantics: an unhandled throw in an async function propagates.
    const nativeForm = makeContactForm();
    fillValidValues(nativeForm);
    await expect(
      submit(nativeForm, async () => {
        await rejectingAction();
        return null;
      }),
    ).rejects.toThrow('server error');
    expect(rejectingAction).toHaveBeenCalledOnce();
    rejectingAction.mockClear();

    // submitWithWarnings re-throws the rejection — diverges from native submit().
    const toolkitForm = makeContactForm();
    fillValidValues(toolkitForm);

    await expect(
      submitWithWarnings(toolkitForm, rejectingAction),
    ).rejects.toThrow('server error');

    // After rejection: the in-flight guard must be cleared (finally block),
    // so a follow-up submit with a working action succeeds.
    await submitWithWarnings(toolkitForm, workingAction);
    expect(workingAction).toHaveBeenCalledOnce();
  });

  it('skips the action while an async validator is still pending', async () => {
    // Pins the `pending()` guard inside `submitWithWarnings`: if an async
    // validator has not yet resolved when `submitWithWarnings` runs, the
    // action must NOT be invoked. Once the validator settles to "valid", a
    // second `submitWithWarnings` call should proceed normally.
    //
    // `validateAsync` (stable since Angular 22.0.0) requires a `resource()`
    // factory. We hold the resource in its loading state by giving it a
    // deferred promise that we control. Angular's `pending()` on the root
    // `FieldTree` aggregates `pending()` from all descendant async validators.
    interface AsyncModel {
      username: string;
    }

    // Deferred promise — resolves when the test calls `resolveValidation()`.
    let resolveValidation!: () => void;
    const validationGate = new Promise<void>((res) => {
      resolveValidation = res;
    });

    const model = signal<AsyncModel>({ username: 'ada' });

    const asyncForm: FieldTree<AsyncModel> = TestBed.runInInjectionContext(() =>
      form(
        model,
        schema<AsyncModel>((path) => {
          validateAsync(path.username, {
            params: (ctx) => ctx.value(),
            factory: (params) =>
              resource({
                params,
                loader: async () => {
                  // Block until the test unblocks the gate.
                  await validationGate;
                  return 'valid';
                },
              }),
            onSuccess: (_result, _ctx) => null,
            onError: (_error, _ctx) => null,
          });
        }),
      ),
    );

    // Let Angular register the resource (a few microtasks for Angular's
    // effect() + resource() wiring). Do NOT await whenStable() here — that
    // would block forever because the resource loader is parked on the gate.
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    // The form should be pending — the async validator's resource is loading.
    expect(asyncForm().pending()).toBe(true);

    const action = vi.fn(async () => {});

    // submitWithWarnings must NOT call action while pending() is true.
    await submitWithWarnings(asyncForm, action);
    expect(action).not.toHaveBeenCalled();

    // Unblock the async validator and let it fully settle.
    resolveValidation();
    await TestBed.inject(ApplicationRef).whenStable();

    // The form should no longer be pending.
    expect(asyncForm().pending()).toBe(false);

    // Now submitWithWarnings should invoke the action (no blocking errors, not pending).
    await submitWithWarnings(asyncForm, action);
    expect(action).toHaveBeenCalledOnce();
  });
});
