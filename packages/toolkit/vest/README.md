# @ngx-signal-forms/toolkit/vest

> Optional convenience helpers for using [Vest](https://vestjs.dev/) with Angular Signal Forms and `@ngx-signal-forms/toolkit`.

## Why this entry point exists

Angular Signal Forms already supports Standard Schema validators through `validateStandardSchema(...)`.
Vest 6 implements the Standard Schema interface, so it already works with Angular Signal Forms.

This entry point adds a discoverable, toolkit-branded adapter for Vest users without adding runtime coupling to the main toolkit entry point.

It is designed to be used **together with** Angular Signal Forms validators and Standard Schema tools such as Zod or OpenAPI-generated schemas — not instead of them.

## Installation

> **Vest v6+ required** — Standard Schema support was introduced in Vest 6.
> Earlier versions do not expose the Standard Schema interface and will not work.
> `vest@6.3.0` is currently excluded because of an upstream packaging issue in the published build.

If you are migrating from `ngx-vest-forms`, upgrade to **Vest 6.x first**.
This entry point does **not** support Vest 5.x.

```bash
pnpm add @ngx-signal-forms/toolkit vest@6.2.7
```

`vest` is an optional peer dependency (`>=6.0.0 <6.3.0 || >=6.3.1`) of `@ngx-signal-forms/toolkit`. You only need it when importing this entry point.

If you are migrating from `ngx-vest-forms`, start with the short overview in
[`docs/MIGRATING_FROM_NGX_VEST_FORMS.md`](../../docs/MIGRATING_FROM_NGX_VEST_FORMS.md).

For Vest-specific API changes, also see the official
[Vest 6 upgrade guide](https://vestjs.dev/docs/upgrade_guide).

## Usage

```typescript
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import { create, enforce, test, warn } from 'vest';
import {
  createOnInvalidHandler,
  hasOnlyWarnings,
  NgxSignalFormToolkit,
} from '@ngx-signal-forms/toolkit';
import { NgxFormFieldErrorComponent } from '@ngx-signal-forms/toolkit/assistive';
import { validateVest } from '@ngx-signal-forms/toolkit/vest';

interface SignupModel {
  email: string;
}

const signupSuite = create((data: SignupModel) => {
  test('email', 'Email is required', () => {
    enforce(data.email).isNotBlank();
  });

  test('email', 'Using a company email usually speeds up approval', () => {
    warn();
    enforce(!data.email.endsWith('@gmail.com')).isTruthy();
  });
});

@Component({
  selector: 'ngx-signup-form',
  imports: [FormField, NgxSignalFormToolkit, NgxFormFieldErrorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
        action: async () => {
          if (!hasOnlyWarnings(this.signupForm().errorSummary())) {
            this.#onInvalid(this.signupForm);
            return;
          }

          console.log('Create account', this.#model());
        },
      },
    },
  );
}
```

Use `NgxFormFieldErrorComponent` directly when you want custom markup. When you use
`ngx-signal-form-field-wrapper`, it renders the same assistive component for you and
will show blocking errors as alerts plus warnings as polite status messages.

## Scope

`validateVest(...)` is a first-class Angular Signal Forms adapter for Vest.

- Default behavior: blocking Vest tests are mapped directly from `suite.run(...)` into Signal Forms validation errors.
- Opt-in warning behavior: pass `{ includeWarnings: true }` to translate Vest `warn()` results into toolkit-native `warn:*` messages.
- Shared execution: blocking errors and warnings are read from the same Vest run, so enabling warnings does not require a second suite pass.

That makes `ngx-form-field-error`, `ngx-signal-form-field-wrapper`, and related toolkit components render Vest warnings as polite, non-blocking guidance.

```typescript
validateVest(path, signupSuite, { includeWarnings: true });
```

If you need only the warning bridge, the entry point also exports `validateVestWarnings(...)`.

### validateVestWarnings()

Use `validateVestWarnings()` when blocking validation already comes from
Angular validators, Zod / Standard Schema, or another source, but you still
want Vest `warn()` messages to appear as toolkit warnings.

```typescript
import { email, form, required } from '@angular/forms/signals';
import { validateVestWarnings } from '@ngx-signal-forms/toolkit/vest';

const checkoutForm = form(checkoutModel, (path) => {
  required(path.email, { message: 'Email is required' });
  email(path.email, { message: 'Enter a valid email address' });

  validateVestWarnings(path, checkoutAdvisorySuite);
});
```

Prefer `validateVest(path, suite, { includeWarnings: true })` when the same
Vest suite should provide both blocking errors and warnings. Prefer
`validateVestWarnings()` when Vest is advisory-only.

## When to use Vest warnings

Use Vest `warn()` when the message is advisory guidance and the user should still be
allowed to finish the form.

Good warning examples:

- recommending a company email instead of a personal address
- suggesting stronger password composition
- nudging users toward a preferred VAT format
- flagging that a large order may need manual review

Do **not** use warnings for requirements that must stop submission. Keep those as
regular blocking Vest tests.

## How warnings should be displayed

- Use `ngx-signal-form-field-wrapper` in normal toolkit forms. It already renders
  `ngx-form-field-error` underneath the control.
- Use `NgxFormFieldErrorComponent` directly when you build a custom field layout.
- Warnings become visible through `validateVest(..., { includeWarnings: true })`.
- Warnings render as `role="status"` and blocking errors render as `role="alert"`.

## Using Angular 21.2 `submit()` with warnings

Angular Signal Forms `submission` / `submit()` currently treats every
`ValidationError` as blocking, including toolkit-style `warn:*` messages.

For forms that should allow warnings, use the native Angular helper like this:

1. use `<form [formRoot]="myForm">` and configure `submission` in `form(...)`
2. set `ignoreValidators: 'all'`
3. inside `action`, check `hasOnlyWarnings(form().errorSummary())`
4. return early and focus the first invalid field when blocking errors remain

That keeps the examples aligned with Angular 21.2 while preserving non-blocking
warning UX.

## When to use Vest vs Angular Signal Forms validators

Angular Signal Forms already has an excellent built-in schema API.
Use the default Angular validators first when the rule is simple, local to the field, and tightly coupled to UI behavior.

If you are deciding whether this entry point is worth adding to your form, the short answer is:

- start with **Angular Signal Forms validators** for straightforward field and UI-state rules
- add **Vest** when validation starts reading more like business policy than field metadata
- combine **Zod / OpenAPI Standard Schema + Vest** when you want generated contract rules plus richer policy rules

### Prefer Angular Signal Forms validators when

- the rule is simple and declarative
- you only need built-ins like `required`, `email`, `minLength`, `maxLength`, `min`, `max`
- the rule is mostly UI-local and belongs next to the form field
- you need Signal Forms features such as `disabled`, `hidden`, or `readonly`
- you want the smallest possible dependency surface

Typical examples:

- required text fields
- email format
- numeric ranges
- minimum or maximum length
- simple cross-field checks with `validate(...)`

### Prefer Vest when

- validation reads more like business policy than field metadata
- one field needs multiple named rules with separate messages
- rules are highly conditional and branch on several values
- you want async business checks such as uniqueness or server-backed lookups
- the same business validation logic may be reused outside the Angular schema callback

Typical examples:

- eligibility rules that depend on multiple fields
- pricing, discount, shipping, or compliance logic
- onboarding flows with step-specific business constraints
- async checks like “username already taken” or “email already registered”

### Pros and cons at a glance

| Approach                            | Pros                                                                                                                                                                                                                              | Cons                                                                                                                                                                                               |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Angular Signal Forms validators** | built into Angular; smallest dependency surface; simple declarative rules; good fit for field-local validation; Angular can expose constraint metadata such as required/min/max to controls                                       | can become repetitive for larger business-policy suites; less natural when many named rules target the same field; policy logic can end up scattered across the form schema                        |
| **Vest**                            | validation reads like a business rule suite; multiple named rules per field stay organized; strong fit for conditional and cross-field policy; async business checks are natural; reusable outside a single Angular form callback | adds another validation abstraction and dependency; simple required/email/min rules can feel heavier than Angular built-ins; Angular-specific constraint metadata is not the reason to choose Vest |

### A practical way to choose

Ask this question:

> Does this rule mostly describe **UI/field constraints**, or does it describe **business policy**?

- If it is mostly a field or control constraint, prefer Angular's built-in validators.
- If it reads like a business rule, workflow rule, eligibility rule, or policy decision, Vest is usually the better fit.

Examples:

- `email is required` → Angular validator
- `password must be at least 12 characters` → Angular validator
- `VAT number is required only for business accounts in certain countries` → Vest
- `username is unique unless the account is in migration mode` → Vest
- `the selected shipping method is not allowed for hazardous items` → Vest

### Practical recommendation

Use:

- **Angular Signal Forms validators** for simple field and UI-state rules
- **Vest** for richer business validation logic

Prefer not to force one tool to do everything.

For many real forms, the cleanest layering is:

1. **Angular Signal Forms validators** for simple local rules
2. **Zod / OpenAPI Standard Schema** for reusable contract validation
3. **Vest** for business-policy rules and `warn()` guidance

That usually gives the cleanest result and avoids turning every required field into a mini rules engine.

These layers are easy to combine in one Signal Forms schema callback.
You can keep tiny UI-local rules in Angular, reuse generated contract rules through `validateStandardSchema(...)`, and add only the business-specific rules through `validateVest(...)`.

## Using Vest together with Zod or OpenAPI-generated schemas

Yes — this is a strong use case.

### Recommended split of responsibilities

If you already generate Zod schemas from an OpenAPI document using tools such as Orval or `openapi-zod-client`, a good split is:

- **OpenAPI / Zod**: contract validation, structural validation, and generated defaults
  - required fields
  - email format
  - string length
  - number bounds
  - enum values
- **Vest**: business rules that are difficult or awkward to express in generated schemas
  - cross-field decisions
  - multi-step flow rules
  - conditional rules driven by business state
  - async checks against backend systems

This keeps generated API schemas useful without forcing every business rule into the OpenAPI contract.

### Good example use case

An OpenAPI schema can define:

- `email` is required
- `email` must be a valid email
- `password` has minimum length 12
- `country` must be one of the allowed enum values

Vest can then add business rules such as:

- password must not include the user's first or last name
- VAT number is required only for business accounts in specific countries
- shipping method `express` is not allowed for hazardous materials
- the chosen username must be unique

That is usually where Vest earns its keep.

## Combining Angular validators, Zod, and Vest in Angular Signal Forms

You can combine all three by registering them in the same Signal Forms schema callback.

```typescript
import { signal } from '@angular/core';
import {
  email,
  form,
  minLength,
  required,
  validateStandardSchema,
} from '@angular/forms/signals';
import { create, enforce, test, warn } from 'vest';
import { validateVest } from '@ngx-signal-forms/toolkit/vest';
import { CreateAccountBodySchema } from './generated/openapi.zod';

interface CreateAccountModel {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  accountType: 'personal' | 'business';
  vatNumber?: string;
}

const accountBusinessSuite = create((data: CreateAccountModel) => {
  test('password', 'Password must not contain your name', () => {
    const normalizedPassword = data.password.toLowerCase();
    enforce(
      normalizedPassword.includes(data.firstName.toLowerCase()) ||
        normalizedPassword.includes(data.lastName.toLowerCase()),
    ).isFalsy();
  });

  test('vatNumber', 'VAT number is required for business accounts', () => {
    if (data.accountType === 'business') {
      enforce(data.vatNumber).isNotBlank();
    }
  });
});

const model = signal<CreateAccountModel>({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  accountType: 'personal',
  vatNumber: '',
});

const accountForm = form(model, (path) => {
  // Small UI-local rules
  required(path.email, { message: 'Email is required' });
  email(path.email, { message: 'Enter a valid email address' });
  minLength(path.password, 12, { message: 'Use at least 12 characters' });

  // Contract and generated rules from OpenAPI / Zod
  validateStandardSchema(path, CreateAccountBodySchema);

  // Rich business rules and warn()-only guidance
  validateVest(path, accountBusinessSuite, { includeWarnings: true });
});
```

This is usually the sweet spot:

- Angular handles small control-level rules cleanly
- Zod / OpenAPI covers shared contract rules
- Vest keeps higher-order policy rules readable

### Suggested rule layering

For most projects, this split works well:

1. **OpenAPI → Zod** for backend contract rules
2. **Angular Signal Forms validators** for small UI-local rules and availability state
3. **Vest** for higher-level business validation

### Avoid this anti-pattern

Do not duplicate the same rule in all three places.

For example, if `email` format already comes from OpenAPI → Zod, do not also add the same `email` rule in Vest unless you need a genuinely different business rule or message.

### When this combo is especially useful

This approach is especially useful when:

- your API contract is generated from OpenAPI
- you already use Zod for request/response validation
- your frontend still needs richer business validation than the API contract can express cleanly

In that setup, Zod covers the **shape of valid data**, while Vest covers the **business meaning of valid input**.
Angular validators then cover the **small local UX constraints** that are easiest to keep next to the form field.
