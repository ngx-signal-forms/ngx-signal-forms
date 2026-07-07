---
description: Sub-skill of ngx-signal-forms for the @ngx-signal-forms/toolkit/vest entry point — Vest v6+ suite integration for business-logic validation, cross-field rules, conditional checks, async server-backed validation, suite lifecycle management (resetOnDestroy), and focused `only()` runs. Not independently invocable; the hub SKILL.md routes here.
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
  validateVest,
  validateVestWarnings,
  type ValidateVestOptions,
  type VestOnlyFieldSelector,
} from '@ngx-signal-forms/toolkit/vest';
```

Use the exported kind prefixes when you need to detect Vest-origin errors in
custom strategies, debugger filters, or tests — don't re-derive the string
literals.

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

| Option              | Default | Purpose                                                                                                                                                                                                                                               |
| ------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `includeWarnings`   | `false` | Surface `warn()` results as toolkit warnings (`kind` prefixed with `warn:vest:`).                                                                                                                                                                     |
| `resetOnDestroy`    | `true`  | Call `suite.reset()` via `DestroyRef.onDestroy()` when the hosting injection context tears down. **Enabled by default** for module-scope suites — pass `{ resetOnDestroy: false }` to persist suite state across mounts. See _Suite lifecycle_ below. |
| `only`              | _none_  | `VestOnlyFieldSelector` — `(ctx) => string \| readonly string[] \| undefined`. Threads a field name into `suite.run(value, fieldName)` for per-field focused runs; default runs the whole suite.                                                      |
| `focusCurrentField` | `false` | Derive the focused Vest field name from the bound field's `ctx.pathKeys()` (dotted, e.g. `items.0.sku`). Ignored when `only` is set; falls back to a whole-suite run when bound to the form root.                                                     |

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

### Focused runs with `only`

When the suite callback uses `only(fieldName)` (or `suite.only(field).run(...)`),
pass a selector so the adapter threads the changed field through:

```typescript
import { create, enforce, only, test } from 'vest';

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

When you bind `validateVest` to a specific field path, pass
`{ focusCurrentField: true }` to derive the focused field name automatically
from `ctx.pathKeys()` — no `only` selector needed:

```typescript
validateVest(path.email, suite, { focusCurrentField: true });
```

The derived name is the dotted path (e.g. `items.0.sku` for nested/array
fields). Bound to the form root, the path is empty and the adapter falls back
to a whole-suite run. An explicit `only` selector always overrides
`focusCurrentField`.

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

For Angular 21.2 `submit()` with Vest warnings, pass `{ ignoreValidators: 'all' }` and gate with `hasOnlyWarnings(form().errorSummary())`.

## Error Handling

- If Vest warnings appear as blocking errors: ensure `{ includeWarnings: true }` is passed to `validateVest()` and that the suite uses `warn()` before `enforce()`.
- If Vest results don't update reactively: confirm the suite receives the reactive signal value — pass `signalModel()` not `signalModel`.
- If Vest v5 is installed: upgrade to `vest@^6.0.0` — v6+ implements the Standard Schema interface required by this adapter.
- If stale errors appear on a second mount of a form using a module-scope suite: the adapter clears suite state on teardown by default — confirm `resetOnDestroy` has not been set to `false`. (Conversely, if you _want_ suite state to persist across mounts, pass `{ resetOnDestroy: false }`.)
- If detecting Vest-origin errors in a custom strategy or test: import `VEST_ERROR_KIND_PREFIX` / `VEST_WARNING_KIND_PREFIX` and match against `error.kind` instead of hard-coding the string.
