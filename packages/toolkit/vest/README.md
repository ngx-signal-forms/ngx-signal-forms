# @ngx-signal-forms/toolkit/vest

> Optional adapter for using [Vest](https://vestjs.dev/) business-rule validation with Angular Signal Forms and the toolkit's warning support.

## Why this entry point exists

Angular Signal Forms already supports Standard Schema validators through `validateStandardSchema()`, and Vest 6 implements Standard Schema. This entry point adds a toolkit-branded adapter that maps Vest's richer suite results — including `warn()` guidance — into toolkit-native warning messages.

Use it **together with** Angular validators and Standard Schema tools like Zod, not instead of them.

## Installation

Vest is an optional peer dependency (`>=6.0.0 <6.3.0 || >=6.3.1`). Install it only when using this entry point.

```bash
pnpm add @ngx-signal-forms/toolkit vest@6.2.7
```

> **Vest v6+ required.** Standard Schema support was introduced in Vest 6.
> `vest@6.3.0` is excluded because of an upstream packaging issue — use `6.2.x` or `>=6.3.1`.

If you are migrating from `ngx-vest-forms`, see [`docs/MIGRATING_FROM_NGX_VEST_FORMS.md`](../../docs/MIGRATING_FROM_NGX_VEST_FORMS.md) and the official [Vest 6 upgrade guide](https://vestjs.dev/docs/upgrade_guide).

## Import

```typescript
import {
  validateVest,
  validateVestWarnings,
} from '@ngx-signal-forms/toolkit/vest';
```

## Quick start

```typescript
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
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

Blocking Vest errors render as `role="alert"`. Vest `warn()` results render as `role="status"` through the toolkit's wrapper and assistive components.

## API

### validateVest()

First-class adapter for Vest suites. Reads `suite.run()` results and maps blocking errors directly into Signal Forms validation errors.

```typescript
validateVest(path, suite); // blocking errors only
validateVest(path, suite, { includeWarnings: true }); // + warn() as toolkit warnings
```

Blocking errors and warnings are read from the same Vest run — enabling warnings does not require a second suite pass.

### validateVestWarnings()

Registers only the warning bridge. Use when blocking validation comes from another source (Angular validators, Zod) but you still want Vest `warn()` output in toolkit components.

```typescript
import { email, form, required } from '@angular/forms/signals';
import { validateVestWarnings } from '@ngx-signal-forms/toolkit/vest';

const checkoutForm = form(checkoutModel, (path) => {
  required(path.email, { message: 'Email is required' });
  email(path.email, { message: 'Enter a valid email address' });
  validateVestWarnings(path, checkoutAdvisorySuite);
});
```

Prefer `validateVest(path, suite, { includeWarnings: true })` when the same Vest suite provides both blocking errors and warnings. Prefer `validateVestWarnings()` when Vest is advisory-only.

## When to use Vest

Use Angular Signal Forms validators for simple, field-local rules (`required`, `email`, `minLength`). Use Vest when validation reads more like business policy:

- Eligibility rules that depend on multiple fields
- Conditional rules driven by business state
- Async checks like "username already taken"
- Rules you want to reuse outside an Angular form

For most projects, the cleanest layering is:

1. **Angular validators** for simple local rules
2. **Zod / OpenAPI Standard Schema** for shared contract validation
3. **Vest** for business-policy rules and `warn()` guidance

### Combining with Zod / Standard Schema

```typescript
const checkoutForm = form(model, (path) => {
  // Angular validators — small UI-local rules
  required(path.email, { message: 'Email is required' });

  // Zod / OpenAPI — contract and structural validation
  validateStandardSchema(path, CheckoutSchema);

  // Vest — business rules and warn() guidance
  validateVest(path, checkoutBusinessSuite, { includeWarnings: true });
});
```

Keep each layer focused. Don't duplicate the same rule in multiple layers.

## Using Angular `submit()` with warnings

Angular treats every `ValidationError` as blocking. For forms that should allow warnings:

1. Set `ignoreValidators: 'all'` in the `submission` config
2. Inside `action`, check `hasOnlyWarnings(form().errorSummary())`
3. Return early and focus the first invalid field when blocking errors remain

## Related documentation

- [Toolkit core](../README.md) — error strategies, warning utilities
- [Validation strategies](../../docs/VALIDATION_STRATEGY.md) — when to use Angular, Zod, or Vest
- [Migrating from ngx-vest-forms](../../docs/MIGRATING_FROM_NGX_VEST_FORMS.md)
- [Vest 5.x → 6.x upgrade guide](https://vestjs.dev/docs/upgrade_guide) — official Vest migration docs
- Demos: [vest-validation](../../apps/demo/src/app/05-advanced/vest-validation), [zod-vest-validation](../../apps/demo/src/app/05-advanced/zod-vest-validation)

## License

MIT © [ngx-signal-forms](https://github.com/ngx-signal-forms/ngx-signal-forms)
