# Choosing a validation strategy

For most projects, the real choice is not just **Angular vs toolkit** — it is also:

- when to use Angular Signal Forms validators directly
- when to reuse a Standard Schema validator such as Zod or generated OpenAPI schemas
- when to use [Vest](https://vestjs.dev/) for higher-order business rules

These options are **complementary, not mutually exclusive**. In practice, it is often
easiest to combine all three in the same form and let each layer handle the rules it
expresses best.

## Decision table

| Option                                     | Best for                                                 | Strengths                                                                                                                                                                                                                                                                         | Tradeoffs                                                                                                             |
| ------------------------------------------ | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **Angular Signal Forms schema validation** | field-local validation, async checks, and UI constraints | built into Angular; smallest dependency surface; covers `required`, `email`, `min`, `max`, `minLength`, `maxLength`, `pattern`; custom rules via `validate()` / `validateAsync()` / `validateHttp()`; conditional logic via `applyWhenValue()`; `debounce()` for expensive checks | can get verbose when many business-policy rules accumulate; less ergonomic for large grouped rule sets                |
| **Zod / OpenAPI / Standard Schema**        | reusable contract and structural validation              | ideal when schemas already exist or are generated; keeps backend/frontend contract rules in one place; strong for shape, enums, bounds, and format rules; works through `validateStandardSchema(...)`                                                                             | not the best place for complex business policy; easy to over-centralize rules that really belong in application logic |
| **Vest**                                   | business-policy validation                               | expressive for conditional, cross-field, and multi-rule logic; good fit for async business checks and advisory `warn()` guidance; keeps policy rules readable and grouped                                                                                                         | adds an extra validation abstraction; heavier than Angular built-ins for very simple rules                            |

## Quick rule of thumb

- **Angular validators** for field constraints, custom checks, and async validation
- **Zod / OpenAPI Standard Schema** for reusable contract validation
- **Vest** for business-policy rules and non-trivial conditional logic

You do **not** need to pick only one. Angular Signal Forms lets you register small local
validators, Standard Schema validation, and Vest rules side by side in the same schema
callback.

## Recommended layering

For many real-world forms, the cleanest stack is:

1. **Angular Signal Forms validators** for small local rules
2. **Zod / OpenAPI Standard Schema** for contract-level validation
3. **Vest** for higher-order business rules and `warn()` guidance

Examples:

- `email is required` → Angular validator
- `country must be one of the API enum values` → Zod / OpenAPI Standard Schema
- `VAT number is required only for business accounts in DE, NL, or BE` → Vest
- `username is unique unless the account is in migration mode` → Vest

## Combining Angular validators, Zod, and Vest

This is a normal and recommended setup when a form has a mix of local UI rules, shared
contract rules, and business policy.

```typescript
import { signal } from '@angular/core';
import {
  debounce,
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
  debounce(path.email, 300);
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
- keep **conditional business policy** in Vest

For the deeper Vest decision guide, see
[`packages/toolkit/vest/README.md`](../packages/toolkit/vest/README.md).
