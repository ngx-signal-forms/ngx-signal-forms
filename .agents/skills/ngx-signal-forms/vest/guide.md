# Toolkit Vest

Covers `@ngx-signal-forms/toolkit/vest`.
Requires optional peer `vest@>=6.3.0 <7.0.0` (Vest 5 and `<6.3.0` are unsupported).

## When to use Vest

| Need                                                                      | Starting point                                                         |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Field constraints, conditional or cross-field checks, async server checks | Angular validators, `validateTree`, `validateAsync`, or `validateHttp` |
| Shared data shape or API contract                                         | `validateStandardSchema()` with that schema                            |
| Existing Vest suite or policy rules shared outside Angular                | Reuse Vest with `validateVest()`                                       |
| Large grouped business-policy rules clearer as a suite                    | Consider Vest                                                          |

Async checks and cross-field rules alone are not reasons to add Vest.
For blocking-only Vest 6 suites without warnings, `only()`, or teardown reset, Angular's `validateStandardSchema()` is enough.
See [signal-forms.md#validation-choice](../references/signal-forms.md#validation-choice).

## Public API

```typescript
import {
  VEST_ERROR_KIND_PREFIX, // 'vest:'
  VEST_WARNING_KIND_PREFIX, // 'warn:vest:'
  createVestAdapter,
  sharedVestAdapter,
  validateVest,
  validateVestWarnings,
  type ValidateVestOptions,
  type VestOnlyFieldSelector,
  type VestSuiteAdapter,
} from '@ngx-signal-forms/toolkit/vest';
```

- Use `VEST_ERROR_KIND_PREFIX` and `VEST_WARNING_KIND_PREFIX` to detect Vest-origin errors instead of hardcoding string literals.
- Use `validateVest(path, suite, options?)` for blocking validation (plus optional warnings), and `validateVestWarnings(path, suite, options?)` for warning-only suites alongside Angular or Zod blocking rules.
- Reach for `createVestAdapter()` only when a custom flow needs an isolated run cache. Use `sharedVestAdapter.runVestSuite()` inside a hand-rolled validator only to share execution with `validateVest()`.
- When awaiting a manual run's outcome, always await `run.settled()`, not `run.runResult` (a newer run on the same suite can supersede `runResult` and leave its promise pending).

## `validateVest(path, suite, options?)`

The bound path's value is the **suite input** (ADR-0008): `path` and `suite` must match in shape (root path for a model suite, or subtree path for a subtree suite). Mismatched shapes fail at compile time.

| Option            | Default     | Behavior                                                                                                                                                                                                       |
| ----------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `includeWarnings` | `false`     | Maps Vest `warn()` results to toolkit warnings (`warn:vest:*`).                                                                                                                                                |
| `resetOnDestroy`  | `true`      | Calls `suite.reset()` via `DestroyRef.onDestroy()` when the registering context tears down. Pass `false` only to persist suite state across mounts.                                                            |
| `only`            | `undefined` | `(ctx) => VestFieldExclusion`: returns a field name, array of names, or `undefined` (full suite). Prefers `suite.only(field).run(value)`. Returning `false` or `[]` throws because Vest cannot run zero tests. |

### Focused runs and typed field names

Declare suites with `create<{ fields: 'email' | 'username' }>(...)` (Vest >=6.3.2 or schema-typed suites) so `validateVest` infers the field-name union for `only` and turns typos into compile errors:

```typescript
import { create, enforce, only, test } from 'vest';
import { validateVest } from '@ngx-signal-forms/toolkit/vest';

interface Model {
  email: string;
  username: string;
  lastTouched?: 'email' | 'username';
}

const typedSuite = create<{ fields: 'email' | 'username' }>(
  (data: Model, field?: string) => {
    only(field);
    test('email', 'Email is required', () => enforce(data.email).isNotBlank());
    test('username', 'Username is required', () =>
      enforce(data.username).isNotBlank(),
    );
  },
);

validateVest(path, typedSuite, {
  only: (ctx) => ctx.value().lastTouched,
});
```

Track the active field yourself (for example via a signal updated on `(focus)`) and return it from `only`.

### Field-name resolution

Vest field names resolve relative to the bound path:

- **Real child path** (for example `address.city`): attaches to that child field.
- **Virtual Vest field name** (first segment does not match any child, such as `passwordMatch`): treated as a form-level error on the bound path without throwing.
- **Invalid tail after a valid prefix** (such as `address.cityy` when `address` exists): throws in dev mode and logs `console.error()` in production while attaching to the bound field.

## Suite lifecycle and async caveats

- **Module-scope suites:** `create()` retains state across runs. Default `resetOnDestroy: true` resets the suite when the last active registration tears down (registrations are reference-counted across concurrent mounts).
- **Concurrent mounts:** overlapping unfocused (whole-suite) runs across different field trees are queued until the suite is idle. Focused `only` runs are not deferred; multiple focused registrations on the same form are supported, whereas separate forms racing with `only` on one suite need separate suite instances.
- **SSR isolation:** create the suite and an isolated adapter (`createVestAdapter()`) per request (for example in a request-scoped provider). Sharing module-scope suites or `sharedVestAdapter` across SSR requests leaks and resets state across users.
- **Async error handling:** if an async suite run rejects or throws, `validateVest` records `vest:internal-error` (using `error.message` in dev mode, and generic `'Validation could not be completed.'` in production to avoid leaking internal URLs). `validateVestWarnings` adds no error and logs in dev mode.
- **Warnings with pending async tests:** Angular starts async validators only when sync errors are absent (and warnings count as errors there). While async tests are pending under `validateVest` with `includeWarnings: true`, sync warnings wait and emit with the settled async result. `validateVestWarnings` surfaces warnings immediately.

## Warnings and submission

Vest `warn()` results map to `warn:vest:*` errors with polite `role="status"` rendering, yet Angular still treats them as invalid.
Use `submitWithWarnings()` with a single native `(submit)` handler (`novalidate` + `event.preventDefault()`, no `[formRoot]`):

```typescript
import { Component, signal } from '@angular/core';
import { form, FormField, minLength, required } from '@angular/forms/signals';
import { create, enforce, test, warn } from 'vest';
import {
  NgxSignalFormToolkit,
  submitWithWarnings,
} from '@ngx-signal-forms/toolkit';
import { NgxFormFieldError } from '@ngx-signal-forms/toolkit/assistive';
import { validateVestWarnings } from '@ngx-signal-forms/toolkit/vest';

@Component({
  selector: 'app-warning-signup',
  imports: [FormField, NgxSignalFormToolkit, NgxFormFieldError],
  template: `
    <form (submit)="save($event)" novalidate>
      <label for="password">Password</label>
      <input
        id="password"
        type="password"
        autocomplete="new-password"
        [formField]="signupForm.password"
      />
      <ngx-form-field-error
        [formField]="signupForm.password"
        fieldName="password"
      />
      <button type="submit" [disabled]="signupForm().submitting()">
        Create account
      </button>
      <p role="status">{{ saved() ? 'Account details accepted.' : '' }}</p>
    </form>
  `,
})
export class WarningSignupComponent {
  readonly #strengthSuite = create((data: { password: string }) => {
    test('password', 'Consider using 12 or more characters', () => {
      warn();
      enforce(data.password).longerThanOrEquals(12);
    });
  });
  readonly #model = signal({ password: '' });
  protected readonly saved = signal(false);
  protected readonly signupForm = form(this.#model, (path) => {
    required(path.password);
    minLength(path.password, 8);
    validateVestWarnings(path, this.#strengthSuite);
  });

  protected async save(event: Event): Promise<void> {
    event.preventDefault();
    await submitWithWarnings(this.signupForm, async () => {
      this.saved.set(true);
    });
  }
}
```

Alternatively, with `[formRoot]`, set `submission: { ignoreValidators: 'all', action }` and guard the action with `hasOnlyWarnings(tree().errorSummary())` (see [vest/README.md](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/packages/toolkit/vest/README.md#quick-start)).
For manual `'on-submit'` feedback with `submitWithWarnings()`, wire `createSubmittedStatusTracker(form, submitAttempted)` in an injection context.

## Done

Verify the checks that apply to your change:

- Bound path shape matches suite input, and field names resolve or are intentional virtual Vest field names.
- Async flows handle supersession and await `settled()` for manual runs; SSR isolates suites and adapters per request.
- Warning flows test warning-only, blocking, and pending states under the chosen submit path. Report any unrun checks.
