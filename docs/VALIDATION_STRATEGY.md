---
title: 'Choosing a validation strategy'
sidebarTitle: 'Validation strategy'
---

The toolkit shows errors from any validator that Angular Signal Forms runs. So
the choice is which validation source to use:

- Angular Signal Forms validators,
- a Standard Schema library such as Zod, or a schema generated from OpenAPI,
- [Vest](https://vestjs.dev/) for business rules.

Start with Angular validators. Add a Standard Schema library when you share a
data contract. Add Vest when its rule model makes your business rules easier
to read. They can run together, but a form does not need all three.

## Decision table

| Option                              | Best for                                                     | Strengths                                                                                                                                                                                                                                                                         | Tradeoffs                                                                                      |
| ----------------------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **Angular validators**              | Field rules, conditional and cross-field rules, async checks | Built-in validators, `validate()`, `validateTree()`, `validateAsync()`, and `validateHttp()`. Reuse with `schema()` and `apply()`. Narrow by value with `applyWhenValue()`. The async validators' `debounce` option delays the check; the `debounce()` rule delays model updates. | A large set of policy rules can be hard to organize. That alone does not need another library. |
| **Zod / OpenAPI / Standard Schema** | A shared data contract                                       | Reuses schemas you already have or generate. Keeps backend and frontend contract rules in one place. Good for shape, enums, bounds, and formats. Runs through `validateStandardSchema()`.                                                                                         | Not the best place for complex business rules. Easy to put rules there that belong in the app. |
| **Vest**                            | Existing suites, or business rules that read better as tests | Reuses rules outside Angular. Groups related rules. Its `warn()` results become toolkit warnings.                                                                                                                                                                                 | Adds a dependency and a suite lifecycle. Async or cross-field rules alone do not justify it.   |

## Quick rule of thumb

- **Angular validators** for field rules, custom checks, and async checks.
- **Zod / OpenAPI Standard Schema** for a shared contract.
- **Vest** for existing suites, or when it makes business rules easier to
  reuse or read.

You can register Angular validators, Standard Schema validation, and Vest rules
side by side in the same schema function.

## Give each rule one home

When a form uses more than one source, write each rule in one place only:

1. **Angular validators** for small local rules.
2. **Zod / OpenAPI Standard Schema** for contract rules.
3. **Vest** for business rules and `warn()` advice. See
   [warnings](./WARNINGS_SUPPORT.md).

Examples:

- `email is required`: Angular validator.
- `country must be one of the API enum values`: Zod or OpenAPI Standard Schema.
- `VAT number is required only for business accounts in DE, NL, or BE`:
  Angular `required(path.vatNumber, { when })`, or an existing Vest suite.
- `username is unique unless the account is in migration mode`: Angular
  `validateHttp()` or `validateAsync()` with `when`, or an existing Vest suite.

## Combining Angular validators, Zod, and Vest

This excerpt shows all three together. Supply `SignupSchema` and
`signupBusinessSuite` from your application. Add these dependencies only when
the form needs a shared contract or business rules.

```typescript
import { signal } from '@angular/core';
import {
  email,
  form,
  minLength,
  required,
  validateStandardSchema,
} from '@angular/forms/signals';
import { requiredFromStandardSchema } from '@ngx-signal-forms/toolkit';
import { validateVest } from '@ngx-signal-forms/toolkit/vest';

const model = signal({
  email: '',
  password: '',
  accountType: 'personal' as 'personal' | 'business',
  vatNumber: '',
});

const signupForm = form(model, (path) => {
  // Small local rules
  required(path.email, { message: 'Email is required' });
  email(path.email, { message: 'Enter a valid email address' });
  minLength(path.password, 12, { message: 'Use at least 12 characters' });

  // Shared contract rules from Zod / OpenAPI / Standard Schema
  validateStandardSchema(path, SignupSchema);
  requiredFromStandardSchema(path.accountType, SignupSchema);

  // Business rules and warnings
  validateVest(path, signupBusinessSuite, { includeWarnings: true });
});
```

## Required fields with Standard Schema

`validateStandardSchema()` reports errors, but it does not tell Angular which
fields are required. Standard Schema has no way to ask that. Without it,
`required()` on the field state stays `false`, so the control gets no
`aria-required` and the wrapper shows no required marker.

Call `requiredFromStandardSchema(path.field, schema)` from
`@ngx-signal-forms/toolkit` once for each required field. Pass the schema that
validates the object that holds the field. You do not need it for a field that
also has Angular's `required()`.

## Related

- [`/vest` reference](../packages/toolkit/vest/README.md): when to use Vest,
  and the adapter options
- [Warnings](./WARNINGS_SUPPORT.md): how Vest `warn()` results show and submit
- [zod-validation demo](../apps/demo/src/app/05-advanced/zod-validation/README.md)
