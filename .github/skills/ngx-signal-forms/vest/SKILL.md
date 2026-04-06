---
name: ngx-signal-forms-vest
description: Implements @ngx-signal-forms/toolkit/vest Vest validation integration for Angular Signal Forms. Use when adding Vest v6+ suites for business-logic validation, cross-field rules, conditional checks, or async server-backed validation alongside Angular Signal Forms validators. Part of the ngx-signal-forms skill suite.
---

# Toolkit Vest

Implements the `@ngx-signal-forms/toolkit/vest` entry point.

Requires `vest@^6.0.0`. Vest 5 and earlier are not supported. Prefer `vest@6.2.7` or `>=6.3.1`; `6.3.0` is excluded because of an upstream packaging/runtime break.

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
  validateVest,
  validateVestWarnings,
  type ValidateVestOptions,
} from '@ngx-signal-forms/toolkit/vest';
```

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
