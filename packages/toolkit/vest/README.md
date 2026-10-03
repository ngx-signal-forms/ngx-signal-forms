---
title: '@ngx-signal-forms/toolkit/vest'
sidebarTitle: 'vest'
---

Run [Vest](https://vestjs.dev/) suites as Angular Signal Forms validators. The
adapter maps blocking Vest tests to errors and Vest `warn()` tests to toolkit
warnings, so the wrapper and the assistive components show both.

## When to use Vest

Use this entry point when one of these is true:

- You already have Vest suites and want to reuse them.
- You share business rules with code outside Angular.
- A large set of business rules reads better as grouped Vest tests.
- You want Vest `warn()` results to show as non-blocking toolkit warnings.

You do not need Vest for async or cross-field rules. Angular validators
handle field, cross-field, conditional, and async validation. Start with
Angular validators. Add a Standard Schema library, such as Zod, when you share
a data contract. See [validation choices](/docs/VALIDATION_STRATEGY).

A Vest 6 suite is also a Standard Schema. If you need only blocking errors,
Angular's `validateStandardSchema()` is enough, and you do not need this entry
point:

```typescript
import { form, validateStandardSchema } from '@angular/forms/signals';

const signupForm = form(model, (path) => {
  validateStandardSchema(path, signupSuite);
});
```

Use `validateVest()` instead when you need one of these:

- **Warnings.** Standard Schema has no warning level. The adapter shows Vest
  `warn()` results as toolkit warnings.
- **Focused runs.** The `only` option runs the tests for one field, not the
  whole suite.
- **Reset on destroy.** The adapter calls `suite.reset()` when the component
  that registered it is destroyed.

The adapter reads errors and warnings from one suite run.

## Install

Vest is an optional peer dependency. This entry point requires Vest 6
(`>=6.3.0 <7.0.0`). Install it only when you use `/vest`:

```bash
npm install vest
```

If you migrate from `ngx-vest-forms`, see
[migrating from ngx-vest-forms](/docs/MIGRATING_FROM_NGX_VEST_FORMS)
and the [Vest 6 upgrade guide](https://vestjs.dev/docs/upgrade_guide).

## Import

```typescript
import {
  validateVest,
  validateVestWarnings,
} from '@ngx-signal-forms/toolkit/vest';
```

## Quick start

The suite has one blocking test and one warning. The form submits when only
warnings remain.

```typescript
import { Component, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { create, enforce, test, warn } from 'vest';
import {
  createOnInvalidHandler,
  hasOnlyWarnings,
  NgxSignalFormToolkit,
} from '@ngx-signal-forms/toolkit';
import { NgxFormFieldError } from '@ngx-signal-forms/toolkit/assistive';
import { validateVest } from '@ngx-signal-forms/toolkit/vest';

interface SignupModel {
  email: string;
}

const signupSuite = create((data: SignupModel) => {
  test('email', 'Email is required', () => {
    enforce(data.email).isNotBlank();
  });

  test('email', 'A company email speeds up approval', () => {
    warn();
    enforce(!data.email.endsWith('@gmail.com')).isTruthy();
  });
});

@Component({
  selector: 'app-signup-form',
  imports: [FormField, NgxSignalFormToolkit, NgxFormFieldError],
  template: `
    <form [formRoot]="signupForm" ngxSignalForm>
      <label for="email">Email</label>
      <input id="email" [formField]="signupForm.email" />
      <ngx-form-field-error [formField]="signupForm.email" fieldName="email" />
      <button type="submit">Create account</button>
    </form>
  `,
})
export class SignupFormComponent {
  readonly #model = signal<SignupModel>({ email: '' });
  readonly #onInvalid = createOnInvalidHandler();

  protected readonly signupForm = form(
    this.#model,
    (path) => {
      validateVest(path, signupSuite, { includeWarnings: true });
    },
    {
      submission: {
        ignoreValidators: 'all',
        action: async (tree) => {
          if (!hasOnlyWarnings(tree().errorSummary())) {
            this.#onInvalid(tree);
            return;
          }
          console.log('Create account', tree().value());
        },
      },
    },
  );
}
```

Blocking Vest errors render with `role="alert"`. Vest warnings render with
`role="status"`.

## API reference

| Export                                        | Kind     | Use it to                                                                  |
| --------------------------------------------- | -------- | -------------------------------------------------------------------------- |
| `validateVest(path, suite, options?)`         | Function | Register a suite for errors, and for warnings with `includeWarnings`.      |
| `validateVestWarnings(path, suite, options?)` | Function | Register a suite for warnings only.                                        |
| `VEST_ERROR_KIND_PREFIX`                      | Constant | Match Vest error kinds (`'vest:'`).                                        |
| `VEST_WARNING_KIND_PREFIX`                    | Constant | Match Vest warning kinds (`'warn:vest:'`).                                 |
| `createVestAdapter(options?)`                 | Function | Create an adapter with its own run cache (advanced).                       |
| `sharedVestAdapter`                           | Constant | The adapter that `validateVest` and `validateVestWarnings` use (advanced). |
| `ValidateVestOptions`                         | Type     | Options for `validateVest`.                                                |
| `VestSuiteAdapter`, `VestAdapterOptions`      | Type     | The adapter contract and its options.                                      |
| `VestRegisterOptions`                         | Type     | Options for `VestSuiteAdapter.register`.                                   |
| `RunVestSuiteParams`, `RunVestSuiteResult`    | Type     | Input and result of `VestSuiteAdapter.runVestSuite`.                       |
| `VestFieldExclusion`, `VestOnlyFieldSelector` | Type     | The value and the callback for the `only` option.                          |
| `VestRunnableSuite`, `VestCoordinatedSuite`   | Type     | The suite shapes the adapter accepts.                                      |
| `VestResultLike`, `VestFieldPath`             | Type     | The Vest result shape and the path type the adapter accepts.               |

### validateVest()

```typescript
validateVest(path, suite); // blocking errors only
validateVest(path, suite, { includeWarnings: true }); // errors and warnings
validateVest(path, suite, { resetOnDestroy: false }); // keep suite state
validateVest(path, suite, { only: (ctx) => ctx.value().focusedField });
```

The suite runs on the value of `path`. Bind the form root to a suite written
for the whole model. Or bind a nested path to a suite written for that nested
value. If the types do not match, TypeScript reports an error.

| Option            | Default     | Description                                                                                                                          |
| ----------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `includeWarnings` | `false`     | Show `warn()` results as toolkit warnings. Their `kind` starts with `warn:vest:`.                                                    |
| `resetOnDestroy`  | `true`      | Call `suite.reset()` when the injection context that registered the validator is destroyed. See [Suite lifecycle](#suite-lifecycle). |
| `only`            | `undefined` | A callback `(ctx) => field` that returns the field names to run. See [Focused `only()` runs](#focused-only-runs).                    |

### validateVestWarnings()

Registers the suite for warnings only. Use it when Angular validators or a
Standard Schema library own the blocking rules, and Vest only gives advice:

```typescript
import { email, form, required } from '@angular/forms/signals';
import { validateVestWarnings } from '@ngx-signal-forms/toolkit/vest';

const checkoutForm = form(checkoutModel, (path) => {
  required(path.email, { message: 'Email is required' });
  email(path.email, { message: 'Enter a valid email address' });
  validateVestWarnings(path, checkoutAdvisorySuite);
});
```

It accepts the `resetOnDestroy` and `only` options. When one suite gives both
errors and warnings, use `validateVest(path, suite, { includeWarnings: true })`.

### Kind prefixes

Every error the adapter creates has a `kind` that starts with a fixed prefix.
Use the constants to filter Vest results in tests or custom strategies:

```typescript
import {
  VEST_ERROR_KIND_PREFIX, // 'vest:'
  VEST_WARNING_KIND_PREFIX, // 'warn:vest:'
} from '@ngx-signal-forms/toolkit/vest';

const isVestWarning = (kind: string) =>
  kind.startsWith(VEST_WARNING_KIND_PREFIX);
```

### createVestAdapter() / sharedVestAdapter

Most forms need only `validateVest`. Use the adapter when you write your own
validator and want to share one suite run with other registrations.

`validateVest` and `validateVestWarnings` use `sharedVestAdapter`. It caches
one run per suite, field tree, value, and focus. `createVestAdapter()` returns
an adapter with its own cache.

| Member                 | Description                                                                                         |
| ---------------------- | --------------------------------------------------------------------------------------------------- |
| `register(path, …)`    | Register the suite as Signal Forms validators. `validateVest` and `validateVestWarnings` call this. |
| `runVestSuite(params)` | Run the suite once through the cache. Returns the cached run when the inputs are the same.          |
| `invalidate(suite)`    | Drop the cached runs for a suite.                                                                   |

This custom validator shows one summary error. It shares the suite run with
any `validateVest(path, checkoutSuite)` on the same path:

```typescript
import { signal } from '@angular/core';
import { form, validateTree } from '@angular/forms/signals';
import { create, enforce, test } from 'vest';
import { sharedVestAdapter } from '@ngx-signal-forms/toolkit/vest';

interface Checkout {
  email: string;
  amount: string;
}

const checkoutSuite = create((data: Checkout) => {
  test('email', 'Email is required', () => enforce(data.email).isNotBlank());
  test('amount', 'Amount is required', () => enforce(data.amount).isNotBlank());
});

const checkoutForm = form(
  signal<Checkout>({ email: '', amount: '' }),
  (path) => {
    validateTree(path, (ctx) => {
      const { fieldTree, value } = ctx;
      const run = sharedVestAdapter.runVestSuite({
        suite: checkoutSuite,
        fieldTree,
        value: value(),
      });

      const result = run.initialResult;
      if (!result) {
        // The suite returned only a promise. This validator has no async
        // step, so add validateVest(path, checkoutSuite) for async results.
        return [];
      }

      const failing = Object.keys(result.getErrors());
      return failing.length === 0
        ? []
        : [
            {
              kind: 'vest:summary',
              message: `${failing.length} field(s) need attention`,
              fieldTree,
            },
          ];
    });
  },
);
```

#### Awaiting a manual run's outcome

Outside a validator, for example in a test or a script, await `run.settled()`.
Do not await `run.runResult`:

```typescript
const run = sharedVestAdapter.runVestSuite({ suite, fieldTree, value });
const result = await run.settled();
```

`runResult` is the raw value that `suite.run()` returned. When a later run
starts on the same suite, Vest 6 drops the earlier run's promise, and it
never settles. `settled()` waits for the suite to finish instead, so it
always resolves.

## Suite lifecycle

A suite made with `create()` keeps state between runs: the last result,
pending async tests, and memoized tests. Vest recommends one suite per module:

```typescript
// signup.suite.ts
export const signupSuite = create((data: SignupModel) => {
  /* ... */
});
```

Without a reset, that state carries over from one component to the next. A
new form can show old errors, or an old async test can report into it. For
this reason, the adapter calls `suite.reset()` by default when the
registering injection context is destroyed. Pass `{ resetOnDestroy: false }`
only when you want the state to persist.

### Concurrent mounts of the same suite

Two forms can use the same suite at the same time. The adapter counts the
registrations and resets the suite only when the last one is destroyed.

When two forms run the whole suite, the adapter queues the second run until
the first one finishes. This does not apply to `only` runs. Several `only`
registrations for fields of the same form are fine. If separate forms each
use `only` on one suite, give each form its own suite.

### Server-side rendering (SSR)

One Node SSR process serves several requests. A suite or `sharedVestAdapter`
at module scope is shared between those requests, and one request's reset
clears state that another request still uses. Create the suite, and an
adapter with `createVestAdapter()`, per request. For example, use a
request-scoped provider.

### Async caveats

- `suite.run()` returns a sync result that is also a promise. The adapter
  shows sync errors at once and then waits for pending async tests.
- If a suite's `run()` returns only a promise, the adapter validates from
  that promise.
- Only the latest run reaches the form. A new value cancels older async
  work.
- **Warnings wait for async tests.** Angular starts async validators only
  when the field has no sync errors, and a warning counts as an error there.
  So while async tests are pending, `validateVest` holds back its warnings
  and shows them with the final result. A warning can therefore appear one
  step later than a sync error. `validateVestWarnings` has no blocking
  errors, so it shows warnings at once.

<a id="focused-only-runs"></a>

### Focused `only()` runs

If the suite calls `only(field)`, pass an `only` callback. The adapter passes
the field name to the suite:

```typescript
import { create, enforce, only, test } from 'vest';

interface Model {
  email: string;
  username: string;
  lastTouched?: 'email' | 'username';
}

const suite = create((data: Model, field?: string) => {
  only(field);
  test('email', 'Email is required', () => {
    enforce(data.email).isNotBlank();
  });
  test('username', 'Username is required', () => {
    enforce(data.username).isNotBlank();
  });
});

validateVest(path, suite, {
  only: (ctx) => ctx.value().lastTouched,
});
```

The callback can return one field name, an array of names, or `undefined`
to run the whole suite. It must not return `false`: Vest cannot run zero
tests, so the adapter throws. The adapter calls `suite.only(field).run(value)`.
If the suite has no `only` method, it calls `suite.run(value, field)` with
the first field name.

Without `only`, the whole suite runs on every change. That is correct, but
slower for large suites.

#### Typed focus names

With Vest 6.3.2 or later, declare the field names with
`create<{ fields: … }>(…)`. The `only` callback then accepts only those names:

```typescript
const typedSuite = create<{ fields: 'email' | 'username' }>(
  (data: Model, field?: string) => {
    only(field);
    test('email', 'Email is required', () => {
      enforce(data.email).isNotBlank();
    });
    test('username', 'Username is required', () => {
      enforce(data.username).isNotBlank();
    });
  },
);

validateVest(path, typedSuite, {
  only: (ctx) => ctx.value().lastTouched,
});
```

A typo such as `only: () => 'emial'` is then a compile error. Without it,
the run would test nothing and report the field as valid. A suite made with
plain `create(…)` accepts any string.

#### Focusing the currently active field

A suite for the whole model is bound to the form root, not to one field. To
run only the field the user works in, track that field yourself, for example
on `(focus)`, and return it from `only`:

```typescript
readonly #activeField = signal<string | undefined>(undefined);

readonly signupForm = form(this.#model, (path) => {
  validateVest(path, suite, {
    only: () => this.#activeField(),
  });
});
```

## Vest field-name resolution

The adapter reads each Vest field name (the first argument of `test()`) as a
path relative to the bound path. It then attaches the result to that field.
When a name does not match a field, two cases apply:

- **Form-level name.** The first segment matches no field, for example
  `test('passwordMatch', …)` on a model without `passwordMatch`. The result
  attaches to the bound field. Nothing is logged.
- **Invalid name.** The first segment matches but a later one does not, for
  example `test('address.cityy', …)` when the model has `address.city`. This
  is a typo or a mismatch between suite and model:
  - In development mode, the adapter throws, and the form fails to render.
  - In production, the adapter logs `console.error()` and attaches the result
    to the bound field.

```typescript
const suite = create((data: SignupModel) => {
  // Form-level: attaches to the bound field.
  test('passwordMatch', 'Passwords must match', () => {
    /* ... */
  });

  // Invalid if the model has address.city but not address.cityy.
  test('address.cityy', 'City is required', () => {
    /* ... */
  });
});
```

This rule is about where a result attaches. It does not change which tests
the `only` option runs.

<a id="using-angular-submit-with-warnings"></a>

## Using Angular `submit()` with warnings

Angular blocks submit on every validation error, and a Vest warning is a
validation error. To submit with warnings, set `ignoreValidators: 'all'` and
check `hasOnlyWarnings()` in the action, as the [quick start](#quick-start)
does. Or use `submitWithWarnings()` from the root entry point. See
[warning submission](/docs/WARNINGS_SUPPORT#form-submission-behavior).

## Related documentation

- [Validation choices](/docs/VALIDATION_STRATEGY): Angular validators, Standard Schema, or Vest
- [Warnings, timing, and messages](/docs/WARNINGS_SUPPORT)
- [Migrating from ngx-vest-forms](/docs/MIGRATING_FROM_NGX_VEST_FORMS)
- [Vest 6 upgrade guide](https://vestjs.dev/docs/upgrade_guide)
- Demos: [vest-validation](https://github.com/ngx-signal-forms/ngx-signal-forms/tree/77ce2f7de996cc397982199d1b3822dedb259b29/apps/demo/src/app/05-advanced/vest-validation), [zod-vest-validation](https://github.com/ngx-signal-forms/ngx-signal-forms/tree/77ce2f7de996cc397982199d1b3822dedb259b29/apps/demo/src/app/05-advanced/zod-vest-validation)

## For maintainers

- Suite input is the bound path: [ADR-0008](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/77ce2f7de996cc397982199d1b3822dedb259b29/docs/decisions/0008-vest-suite-input-is-the-bound-path.md).
  It also defines the field-name rules above.
- Run cache, queueing, and settlement live in `vest-run-coordinator.ts`:
  [ADR-0009](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/77ce2f7de996cc397982199d1b3822dedb259b29/docs/decisions/0009-vest-run-coordination-is-its-own-seam.md).
- The dropped-promise behavior behind `settled()` and the "`only` cannot run
  zero tests" rule were verified against `vest@6.3.2`.
- `packages/toolkit/scripts/packaging.spec.ts` checks that the `vest` peer
  range stays below 7. Keep the "requires Vest 6" wording in
  [Install](#install) in step with that range.
- The error `kind` format is `vest:<field>:<message>:<occurrence>`
  (`vest-result-mapper.ts`). Only the prefixes are public.
