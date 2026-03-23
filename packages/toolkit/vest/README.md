# @ngx-signal-forms/toolkit/vest

> Optional convenience helpers for using [Vest](https://vestjs.dev/) with Angular Signal Forms and `@ngx-signal-forms/toolkit`.

## Why this entry point exists

Angular Signal Forms already supports Standard Schema validators through `validateStandardSchema(...)`.
Vest 6 implements the Standard Schema interface, so it already works with Angular Signal Forms.

This entry point adds a discoverable, toolkit-branded adapter for Vest users without adding runtime coupling to the main toolkit entry point.

## Installation

> **Vest v6+ required** — Standard Schema support was introduced in Vest 6.
> Earlier versions do not expose the Standard Schema interface and will not work.

```bash
pnpm add @ngx-signal-forms/toolkit vest@^6.0.0
```

`vest` is an optional peer dependency (`^6.0.0`) of `@ngx-signal-forms/toolkit`. You only need it when importing this entry point.

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
import { NgxSignalFormErrorComponent } from '@ngx-signal-forms/toolkit/assistive';
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
  imports: [FormField, NgxSignalFormToolkit, NgxSignalFormErrorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form [formRoot]="signupForm">
      <label for="email">Email</label>
      <input id="email" [formField]="signupForm.email" />
      <ngx-signal-form-error [formField]="signupForm.email" fieldName="email" />
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

Use `NgxSignalFormErrorComponent` directly when you want custom markup. When you use
`ngx-signal-form-field-wrapper`, it renders the same assistive component for you and
will show blocking errors as alerts plus warnings as polite status messages.

## Scope

`validateVest(...)` is a first-class Angular Signal Forms adapter for Vest.

- Default behavior: blocking Vest tests are mapped directly from `suite.run(...)` into Signal Forms validation errors.
- Opt-in warning behavior: pass `{ includeWarnings: true }` to translate Vest `warn()` results into toolkit-native `warn:*` messages.
- Shared execution: blocking errors and warnings are read from the same Vest run, so enabling warnings does not require a second suite pass.

That makes `ngx-signal-form-error`, `ngx-signal-form-field-wrapper`, and related toolkit components render Vest warnings as polite, non-blocking guidance.

```typescript
validateVest(path, signupSuite, { includeWarnings: true });
```

If you need only the warning bridge, the entry point also exports `validateVestWarnings(...)`.

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
  `ngx-signal-form-error` underneath the control.
- Use `NgxSignalFormErrorComponent` directly when you build a custom field layout.
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

### Practical recommendation

Use:

- **Angular Signal Forms validators** for simple field and UI-state rules
- **Vest** for richer business validation logic

That usually gives the cleanest result and avoids turning every required field into a mini rules engine.

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

## Combining Zod and Vest in Angular Signal Forms

You can combine them by registering both validators in the same Signal Forms schema callback.

```typescript
import { signal } from '@angular/core';
import { form, validateStandardSchema } from '@angular/forms/signals';
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
  // Contract and generated rules from OpenAPI / Zod
  validateStandardSchema(path, CreateAccountBodySchema);

  // Rich business rules and warn()-only guidance
  validateVest(path, accountBusinessSuite, { includeWarnings: true });
});
```

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
