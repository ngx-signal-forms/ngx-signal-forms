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
> `vest@6.3.0` is excluded because that release ships a broken `package.json`
> `exports` map that prevents Angular's build tooling from resolving the
> library. Use any `6.2.x` release or upgrade to `>=6.3.1`, where the
> regression was fixed.

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
import { NgxFormFieldError } from '@ngx-signal-forms/toolkit/assistive';
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
  imports: [FormField, NgxSignalFormToolkit, NgxFormFieldError],
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
validateVest(path, suite, { resetOnDestroy: true }); // clear suite state on teardown
validateVest(path, suite, { only: (ctx) => ctx.value().focusedField });
```

Blocking errors and warnings are read from the same Vest run — enabling warnings does not require a second suite pass.

#### Options

| Option            | Default | Description                                                                                                                                                                                    |
| ----------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `includeWarnings` | `false` | Surface `warn()` results as toolkit warnings (`kind` prefixed with `warn:vest:`).                                                                                                              |
| `resetOnDestroy`  | `false` | Call `suite.reset()` via `DestroyRef.onDestroy()` when the hosting injection context tears down. Strongly recommended for module-scope suites (see [Suite lifecycle](#suite-lifecycle) below). |
| `only`            | _none_  | Selector `(ctx) => string \| string[] \| undefined` that threads a field name into `suite.run(value, fieldName)` (or `suite.only(field).run(value)` where the suite exposes that shorthand).   |

### Exported constants

The `kind` values the adapter generates are stable. Use the exported prefixes
when building custom error strategies, debugger filters, or tests:

```typescript
import {
  VEST_ERROR_KIND_PREFIX, // 'vest:'
  VEST_WARNING_KIND_PREFIX, // 'warn:vest:'
} from '@ngx-signal-forms/toolkit/vest';

const isVestWarning = (kind: string) =>
  kind.startsWith(VEST_WARNING_KIND_PREFIX);
```

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

## Suite lifecycle

Vest suites created with `create()` retain state across runs: the last result,
any pending async tests, and per-test memoization. The recommended Vest
pattern is to declare suites at **module scope** so they can be imported from
anywhere:

```typescript
// signup.suite.ts — module scope, reused by every form mount
export const signupSuite = create((data: SignupModel) => {
  /* ... */
});
```

That's a great choice for performance but it means that without a teardown
hook, suite state bleeds across component mounts. A second mount can see
stale errors from a previous session, or async tests from an unmounted form
can continue resolving and leak errors into the new one.

Enable `resetOnDestroy: true` to wire `suite.reset()` into `DestroyRef`:

```typescript
validateVest(path, signupSuite, { resetOnDestroy: true });
```

The adapter calls `suite.reset()` (and drops its internal run cache) when the
injection context that registered the validator is destroyed.

### Async caveats

- `suite.run(data)` returns a synchronous `SuiteResult` that is _also_ a
  thenable. The adapter surfaces sync errors immediately, then awaits the
  thenable when `result.isPending()` is `true`.
- If a consumer-wrapped suite returns a `Promise<SuiteResult>` directly from
  `run()` (no sync result), the adapter drives validation straight from the
  promise. This keeps bridge suites that wrap a remote policy check working
  end-to-end.
- Only the **latest** run's result surfaces to Signal Forms. Rapid value
  changes cancel pending work via Angular's async validator contract; stale
  results never reach the field's `errors()` signal.

### Focused `only()` runs

When a suite callback uses `only(fieldName)` (or `suite.only(field).run(...)`),
pass an `only` selector so the adapter threads the changed field through:

```typescript
import { create, enforce, only, test } from 'vest';

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
  only: (ctx) => ctx.value().lastTouched, // or any state-driven field name
});
```

The default behavior (no `only` option) runs the whole suite on every change,
which stays correct but re-executes every test body. Use `only` for large
suites where per-field isolation matters.

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
