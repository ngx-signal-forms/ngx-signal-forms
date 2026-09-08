# Choosing a validation strategy

For most projects, the real choice is not just **Angular vs toolkit** — it is also:

- when to use Angular Signal Forms validators directly
- when to reuse a Standard Schema validator such as Zod or generated OpenAPI schemas
- when to use [Vest](https://vestjs.dev/) for higher-order business rules

Start with Angular validators. Add a Standard Schema library when you need a
shared contract, or Vest when its rule model helps express your business policy.
They can coexist, but a form does not need all three by default.

## Decision table

| Option                                     | Best for                                                                   | Strengths                                                                                                                                                                                                                                                              | Tradeoffs                                                                                                             |
| ------------------------------------------ | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **Angular Signal Forms schema validation** | field constraints, conditional/cross-field rules, and async checks         | Built-in validators, `validate()`, `validateTree()`, `validateAsync()`, and `validateHttp()`; reusable `schema()`/`apply()`; `applyWhenValue()` for value narrowing. Async validator `debounce` delays checks, while the `debounce()` rule delays UI-to-model updates. | Large policy sets can benefit from a different organization; this does not require another library.                   |
| **Zod / OpenAPI / Standard Schema**        | reusable contract and structural validation                                | ideal when schemas already exist or are generated; keeps backend/frontend contract rules in one place; strong for shape, enums, bounds, and format rules; works through `validateStandardSchema(...)`                                                                  | not the best place for complex business policy; easy to over-centralize rules that really belong in application logic |
| **Vest**                                   | Existing suites or business-policy rules that read better as grouped tests | Reuses policy outside Angular; groups related rules; supports advisory `warn()` guidance through the toolkit adapter.                                                                                                                                                  | Adds a dependency and suite lifecycle. Async work or cross-field dependencies alone do not justify it.                |

## Quick rule of thumb

- **Angular validators** for field constraints, custom checks, and async validation
- **Zod / OpenAPI Standard Schema** for reusable contract validation
- **Vest** for existing suites or a concrete readability/reuse benefit in business policy

You do **not** need to pick only one. Angular Signal Forms lets you register small local
validators, Standard Schema validation, and Vest rules side by side in the same schema
callback.

## Optional layering

When a form needs these separate responsibilities, assign each rule once:

1. **Angular Signal Forms validators** for small local rules
2. **Zod / OpenAPI Standard Schema** for contract-level validation
3. **Vest** for higher-order business rules and `warn()` guidance — Vest's
   `warn()` flows into the toolkit's non-blocking warning rendering; see
   [`WARNINGS_SUPPORT.md`](./WARNINGS_SUPPORT.md)

Examples:

- `email is required` → Angular validator
- `country must be one of the API enum values` → Zod / OpenAPI Standard Schema
- `VAT number is required only for business accounts in DE, NL, or BE` → Angular `required({ when })`, or an existing Vest policy suite
- `username is unique unless the account is in migration mode` → Angular `validateHttp`/`validateAsync` with `when`, or reuse the policy's existing suite

## Combining Angular validators, Zod, and Vest

This partial schema excerpt shows an optional combination. Supply `SignupSchema`
and `signupBusinessSuite` from your application. Do not add these dependencies
unless the shared contract and policy rules need them.

```typescript
import { signal } from '@angular/core';
import {
  email,
  form,
  minLength,
  required,
  validateStandardSchema,
} from '@angular/forms/signals';
import { validateVest } from '@ngx-signal-forms/toolkit/vest';

const model = signal({
  email: '',
  password: '',
  accountType: 'personal' as 'personal' | 'business',
  vatNumber: '',
});

const signupForm = form(model, (path) => {
  // Small field-local UI rules
  required(path.email, { message: 'Email is required' });
  email(path.email, { message: 'Enter a valid email address' });
  minLength(path.password, 12, { message: 'Use at least 12 characters' });

  // Shared contract rules from Zod / OpenAPI / Standard Schema
  validateStandardSchema(path, SignupSchema);

  // Rich business rules and advisory warnings
  validateVest(path, signupBusinessSuite, { includeWarnings: true });
});
```

The practical split is:

- keep **small local rules** in Angular validators
- keep **shared shape and contract rules** in Zod / OpenAPI Standard Schema
- keep **policy rules** in Vest when the suite improves reuse or readability

For the deeper Vest decision guide, see
[`packages/toolkit/vest/README.md`](../packages/toolkit/vest/README.md).
