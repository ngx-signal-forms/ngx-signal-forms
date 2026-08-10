---
description: Vest toolkit surface. Use when integrating Vest suites, warning validation, focused runs, or custom Vest adapter flows.
---

# Toolkit Vest

Implements the `@ngx-signal-forms/toolkit/vest` entry point.

Requires `vest@>=6.0.0`. Vest 5 and earlier are not supported.

## When to Use Vest vs Angular Validators

| Use Angular validators (`required`, `email`, `minLength`, etc.) | Use Vest                                      |
| --------------------------------------------------------------- | --------------------------------------------- |
| Simple field rules from a schema or form spec                   | Complex business logic with conditional rules |
| Structural/contract validation (Zod schema)                     | Cross-field policy checks                     |
| Standard format checks                                          | Async server-backed validation                |
| Most cases in small-to-medium forms                             | Enterprise forms with branching rules         |

> Prefer Angular Signal Forms validators for straightforward constraints. Reach for Vest when validation logic reads more like business policies than field rules.

## API

```typescript
import {
  VEST_ERROR_KIND_PREFIX, // 'vest:'
  VEST_WARNING_KIND_PREFIX, // 'warn:vest:'
  createVestAdapter,
  sharedVestAdapter,
  validateVest,
  validateVestWarnings,
  type ValidateVestOptions,
  type VestSuiteAdapter,
  type VestOnlyFieldSelector,
} from '@ngx-signal-forms/toolkit/vest';
```

Use the exported kind prefixes when you need to detect Vest-origin errors in
custom strategies, debugger filters, or tests — don't re-derive the string
literals.

Use `validateVest()` for ordinary blocking validation and
`validateVestWarnings()` for advisory-only suites. Reach for
`createVestAdapter()` only when a custom integration needs an isolated shared
run cache or its own `register()` behavior. Use `sharedVestAdapter.runVestSuite()`
inside a hand-rolled validator only when it must share the exact execution with
`validateVest()`; pair an async-only custom flow with `validateVest()` or your
own `validateAsync` phase. Read `../references/api.md` for the adapter's
options and result contracts.

### `validateVest(path, suite, options?)`

First-class adapter for Vest suites. Maps blocking Vest failures to Angular `ValidationError`s and optionally maps Vest `warn()` messages to toolkit warning errors.

```typescript
import { signal } from '@angular/core';
import { form } from '@angular/forms/signals';
import { create, enforce, test, warn } from 'vest';
import { validateVest } from '@ngx-signal-forms/toolkit/vest';

interface SignupModel {
  email: string;
  password: string;
}

const signupSuite = create((data: SignupModel) => {
  test('email', 'Email is required', () => {
    enforce(data.email).isNotBlank();
  });
  test('email', 'Invalid email format', () => {
    enforce(data.email).matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  });
  test('password', 'Password too short', () => {
    enforce(data.password).longerThanOrEquals(8);
  });
  test(
    'password',
    'Consider using 12+ characters for stronger security',
    () => {
      warn();
      enforce(data.password).longerThanOrEquals(12);
    },
  );
});

const signupModel = signal<SignupModel>({ email: '', password: '' });
const signupForm = form(signupModel, (path) => {
  validateVest(path, signupSuite, { includeWarnings: true });
});
```

#### Options

| Option            | Default | Purpose                                                                                                                                                                                                                                                                                                                                                                                         |
| ----------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `includeWarnings` | `false` | Surface `warn()` results as toolkit warnings (`kind` prefixed with `warn:vest:`).                                                                                                                                                                                                                                                                                                               |
| `resetOnDestroy`  | `true`  | Call `suite.reset()` via `DestroyRef.onDestroy()` when the hosting injection context tears down. **Enabled by default** for module-scope suites — pass `{ resetOnDestroy: false }` to persist suite state across mounts. See _Suite lifecycle_ below.                                                                                                                                           |
| `only`            | _none_  | `VestOnlyFieldSelector` — `(ctx) => VestFieldExclusion`: a field name, a list of field names, `undefined` for a whole-suite run, or `false` to focus nothing. Prefers `suite.only(field).run(value)`, falling back to `suite.run(value, fieldName)` (single field name only) when the suite exposes no `only`. `false` throws — Vest has no way to express "focus nothing" through either form. |

A Vest registration's bound path value **is** the suite input (ADR-0008): `path` and `suite` must agree on shape. Bind the form root to a model-scoped suite (the common case), or bind a subtree to a suite authored for that subtree's value. Binding a suite to a path of a mismatched shape is a compile error.

### Suite lifecycle

Vest suites created with `create()` retain state across runs (last result,
pending async tests, test memoization). The recommended Vest pattern is to
declare suites at **module scope**:

```typescript
// signup.suite.ts — reused by every mount
export const signupSuite = create((data: SignupModel) => {
  /* ... */
});
```

Without a teardown hook, state bleeds across component mounts — a second mount
can see stale errors from a previous session, or async tests from an unmounted
form can resolve into the new one. The adapter wires `suite.reset()` into
`DestroyRef` **by default** (`resetOnDestroy: true`), so this is handled for you:

```typescript
validateVest(path, signupSuite); // resets suite state on teardown automatically
```

Pass `{ resetOnDestroy: false }` only when you deliberately want suite state to
persist across mounts:

```typescript
validateVest(path, signupSuite, { resetOnDestroy: false });
```

**Concurrent mounts are safe.** Registrations against the same suite are
reference-counted, so mounting a module-scope suite in two forms at once (a
list/detail view, a wizard step beside a summary, two open tabs) does not reset
one mount out from under the other — the suite only resets when the **last**
surviving registration tears down. Concurrently-pending field trees that share
one suite are isolated per run **for unfocused (whole-suite) runs only** — the
coordinator detects two different field trees with an overlapping pending run
against the same suite and defers the later one until the suite is idle. A
**focused** (`only`) registration is never deferred: several `only`-focused
registrations for different fields of the SAME form are the documented,
intentional shared-suite pattern, but a focused registration racing an
UNRELATED form's concurrently-mounted registration on the SAME suite is
**unsupported** — give each independently-mounted form its own suite instance
in that case.

**SSR: do not share a suite (or `sharedVestAdapter`) across requests.** A
Node SSR process serves several concurrent requests from ONE process, so a
module-scope suite and the module-scope `sharedVestAdapter` singleton become
one suite instance / one run cache shared across those requests — a
per-request `resetOnDestroy` teardown then resets a suite another request is
still mid-render on. Under SSR, create the suite (and, for isolation, an
adapter via `createVestAdapter()`) per request instead, e.g. from a
request-scoped provider.

### Focused runs with `only`

When the suite callback uses `only(fieldName)` (or `suite.only(field).run(...)`),
pass a selector so the adapter threads the changed field through:

```typescript
import { create, enforce, only, test } from 'vest';

interface Model {
  email: string;
  username: string;
  // Declared as the exact field-name union so `ctx.value().lastTouched`
  // below already returns `'email' | 'username' | undefined` — proving the
  // `only` selector's narrowing, not just its shape.
  lastTouched?: 'email' | 'username';
}

const suite = create((data: Model, field?: string) => {
  only(field);
  test('email', 'Email is required', () => enforce(data.email).isNotBlank());
  test('username', 'Username is required', () =>
    enforce(data.username).isNotBlank(),
  );
});

validateVest(path, suite, {
  only: (ctx) => ctx.value().lastTouched,
});
```

Default behavior (no `only` option) re-runs every test body on each change —
correct but wasteful for large suites.

Declare the suite with `create<{ fields: 'email' | 'username' }>(…)` (Vest
≥6.3.2, or a schema-typed suite) to get a field-name union instead of a bare
`string`:

```typescript
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
  // Return type narrows to `VestFieldExclusion<'email' | 'username'>`.
  only: (ctx) => ctx.value().lastTouched,
});
```

`validateVest` infers that union from `suite` — no type argument to write —
and narrows the `only` selector's accepted return value to it, so
`only: () => 'emial'` (a typo) is a compile error instead of a focused run
that silently executes zero tests and reports the field valid. A suite
declared with plain `create(…)` (no `fields`, no schema) is unaffected and
keeps accepting any `string`.

There is no automatic "focus the field this validator is bound to" option:
`validateVest` binds to the root for a model-scoped suite (ADR-0008), so
track which field is active yourself (`(focus)`/`(blur)`, or a signal your
bindings already update) and read it from `only`, as in the example above.

### `validateVestWarnings(path, suite)`

Registers only Vest `warn()` guidance — useful when blocking validation already comes from Angular validators or Zod rather than the same Vest suite.

```typescript
form(model, (path) => {
  required(path.password);
  minLength(path.password, 8);
  validateVestWarnings(path, passwordStrengthSuite); // warn() messages only
});
```

## Vest + Zod Combination

A strong pattern: use Zod for structural/API-contract validation, then layer Vest for business rules:

```typescript
import { validateStandardSchema } from '@angular/forms/signals';
import { validateVest } from '@ngx-signal-forms/toolkit/vest';
import { UserSchema } from './user.schema'; // Zod schema
import { userBusinessSuite } from './user.vest'; // Vest suite

const userForm = form(userModel, (path) => {
  validateStandardSchema(path, UserSchema); // structural rules
  validateVest(path, userBusinessSuite, { includeWarnings: true }); // business rules
});
```

## Warnings and Submission

Vest `warn()` results map to toolkit warning errors (polite `role="status"` rendering). They don't block submission unless you treat them as blockers.

When only warnings remain and the user should still be able to submit:

```typescript
import {
  canSubmitWithWarnings,
  submitWithWarnings,
} from '@ngx-signal-forms/toolkit';

// Gate a button
[disabled] = '!canSubmitWithWarnings(signupForm)';

// Or in a submit handler
await submitWithWarnings(signupForm, async () => {
  await api.createUser(signupModel());
});
```

For Angular's `submit()` with Vest warnings, pass `{ ignoreValidators: 'all' }` and gate with `hasOnlyWarnings(form().errorSummary())`.

## Error Handling

- If Vest warnings appear as blocking errors: ensure `{ includeWarnings: true }` is passed to `validateVest()` and that the suite uses `warn()` before `enforce()`.
- If Vest results don't update reactively: confirm the suite receives the reactive signal value — pass `signalModel()` not `signalModel`.
- If Vest v5 is installed: upgrade to `vest@^6.0.0` — v6+ implements the Standard Schema interface required by this adapter.
- If stale errors appear on a second mount of a form using a module-scope suite: the adapter clears suite state on teardown by default — confirm `resetOnDestroy` has not been set to `false`. (Conversely, if you _want_ suite state to persist across mounts, pass `{ resetOnDestroy: false }`.)
- If detecting Vest-origin errors in a custom strategy or test: import `VEST_ERROR_KIND_PREFIX` / `VEST_WARNING_KIND_PREFIX` and match against `error.kind` instead of hard-coding the string.
- If a form throws in dev mode ("Vest field name ... does not resolve"): a Vest `test`/`warn` field name has a valid prefix but an invalid tail (e.g. `test('address.cityy', …)` when the bound path only has `address.city`) — fix the field name so it names a real child of the bound path. A field name whose FIRST segment doesn't resolve (e.g. `test('passwordMatch', …)`) is a legitimate **virtual** Vest field name and does not throw. See [Vest field-name resolution](../../../../packages/toolkit/vest/README.md#vest-field-name-resolution) and [`references/pitfalls.md`](../references/pitfalls.md).
