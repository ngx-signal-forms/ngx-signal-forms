# Migrating from `ngx-vest-forms` to `@ngx-signal-forms/toolkit/vest`

This guide covers the **common migration path** from `ngx-vest-forms` (typically paired with Vest 5.x) to Angular Signal Forms plus `@ngx-signal-forms/toolkit/vest`.

> **Required first step:** upgrade to **Vest 6.x before starting the form migration**.
> `@ngx-signal-forms/toolkit/vest` does **not** support Vest 5.x.

It is intentionally short and practical:

- what changes conceptually
- which APIs map cleanly
- which advanced patterns need extra review

## Start with the big change

This is **not** a drop-in rename.

`ngx-vest-forms` is a template-driven Angular integration with its own form directives, wrapper components, and revalidation concepts such as `validationConfig`, `validateRootForm`, and `triggerFormValidation()`.

`@ngx-signal-forms/toolkit/vest` sits on top of **Angular Signal Forms** instead:

- the source of truth is a `signal(...)` model
- fields bind with `[formField]`
- the form binds with `[formRoot]`
- Vest is used as a validator adapter, not as the form runtime itself

Treat migration as a **form-by-form refactor**, not a mechanical codemod.

## Version requirements

If you are coming from `ngx-vest-forms` with **Vest 5.x**, the first migration step is to upgrade Vest itself.

You cannot keep Vest 5.x and migrate directly to `@ngx-signal-forms/toolkit/vest`.

- `@ngx-signal-forms/toolkit` declares `vest` as an optional peer dependency at `^6.0.0`
- current toolkit docs and demos assume **Vest 6**
- `@ngx-signal-forms/toolkit/vest` will **not work on Vest 5.x**
- your existing suite logic will often still look familiar, but you should verify any usage of `only()`, `skip()`, `omitWhen()`, async warnings, and focused updates against Vest 6 docs

Official references:

- [Vest 6 upgrade guide](https://vestjs.dev/docs/upgrade_guide)
- [Vest skip/only guidance](https://vestjs.dev/docs/writing_your_suite/including_and_excluding/skip_and_only)

## Vest 5 → 6: the small but important changes

If your current `ngx-vest-forms` codebase was written around Vest 5 patterns, these are the main upgrades to expect before or during the form migration.

### 1. `create(...)` no longer returns a callable function

In Vest 6, `create(...)` returns a **Suite Object**.

- Vest 5 style: call the suite directly
- Vest 6 style: call `suite.run(data)`

```typescript
// Vest 5 style
const suite = create((data) => {
  // ...
});

const result = suite(data);

// Vest 6 style
const suite = create((data) => {
  // ...
});

const result = suite.run(data);
```

### 2. Async handling is simpler

In Vest 6, `suite.run()` returns a Promise-like result, so older async helpers are no longer needed.

Must-upgrade items:

- remove `promisify`
- change async calls to `await suite.run(data)`
- remove old result `.done()` callbacks

### 3. `staticSuite` is gone

Vest 6 removed `staticSuite`.

- replace `staticSuite(...)` with `create(...)`
- use `suite.runStatic(data)` when you need static/server-style execution behavior

### 4. Focused validation moved to the suite object API

Vest 5 commonly used a second suite parameter plus `only(field)` inside the suite body.

Vest 6 recommends moving that focus decision to the call site:

- `suite.only('email').run(data)`
- `suite.focus({ only: 'email' }).run(data)`

The older callback pattern can still work, but Vest 6 recommends the suite-object API because it separates validation logic from UI-driven field focus.

### 5. `test.memo(...)` changed

If your suites use memoized tests:

- old pattern: `test.memo(...)`
- new pattern: `memo(() => { test(...) }, deps)` from `vest/memo`

### 6. Vest 6 adds Standard Schema support

This is the key reason `@ngx-signal-forms/toolkit/vest` can exist as a clean Angular Signal Forms integration.

Vest 6 implements the Standard Schema contract; Vest 5 does not.

That is why upgrading to Vest 6 is not just a recommendation here — it is a hard prerequisite.

## Quick mapping

| `ngx-vest-forms`                            | `ngx-signal-forms` + toolkit                              | Notes                                                                 |
| ------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------- |
| `<form ngxVestForm ...>`                    | `<form [formRoot]="myForm" ngxSignalForm>`                | Angular Signal Forms owns the form lifecycle; toolkit adds DI context |
| `[ngModel]` + `name="email"`                | `[formField]="myForm.email"`                              | No `name`/`ngModel` wiring needed for normal fields                   |
| `(formValueChange)="formValue.set($event)"` | model `signal(...)` passed into `form(...)`               | The model signal is the source of truth                               |
| `NgxDeepPartial<T>` model building          | explicit Signal Forms model type                          | Prefer stable initial values over incremental partial objects         |
| `<ngx-control-wrapper>`                     | `<ngx-signal-form-field-wrapper>`                         | Wrapper now layers on top of Signal Forms field state                 |
| `errorsChange` or wrapper-export state      | `form.email().errors()` / toolkit wrappers                | Field state comes from Angular Signal Forms                           |
| `warn()` warnings in separate warning state | `warn()` + `validateVest(..., { includeWarnings: true })` | Toolkit maps warnings to `warn:*` validation errors                   |
| `validationConfig`                          | no direct equivalent in the current quick path            | Re-check complex cross-field timing per form                          |
| `validateRootForm`                          | no dedicated toolkit directive                            | Revisit form-level business rules explicitly during migration         |
| `triggerFormValidation()`                   | no direct equivalent in this guide                        | Dynamic structure changes need separate review                        |

## Minimal before/after

### Before: `ngx-vest-forms`

```typescript
import { Component, signal } from '@angular/core';
import { NgxVestForms } from 'ngx-vest-forms';
import { create, enforce, test, warn } from 'vest';

interface SignupModel {
  email: string;
}

const signupSuite = create((data: SignupModel, field?: string) => {
  test('email', 'Email is required', () => {
    enforce(data.email).isNotBlank();
  });

  test('email', 'Using a company email usually speeds up approval', () => {
    warn();
    enforce(!data.email.endsWith('@gmail.com')).isTruthy();
  });
});

@Component({
  imports: [NgxVestForms],
  template: `
    <form
      ngxVestForm
      [suite]="signupSuite"
      (formValueChange)="model.set($event)"
    >
      <ngx-control-wrapper>
        <label for="email">Email</label>
        <input id="email" name="email" [ngModel]="model().email" />
      </ngx-control-wrapper>
    </form>
  `,
})
export class LegacySignupComponent {
  protected readonly model = signal<SignupModel>({ email: '' });
  protected readonly signupSuite = signupSuite;
}
```

### After: Angular Signal Forms + toolkit Vest adapter

```typescript
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import {
  createOnInvalidHandler,
  hasOnlyWarnings,
  NgxSignalFormToolkit,
} from '@ngx-signal-forms/toolkit';
import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';
import { validateVest } from '@ngx-signal-forms/toolkit/vest';
import { create, enforce, test, warn } from 'vest';

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
  imports: [FormField, NgxSignalFormToolkit, NgxFormField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form [formRoot]="signupForm" ngxSignalForm>
      <ngx-signal-form-field-wrapper [formField]="signupForm.email">
        <label for="email">Email</label>
        <input id="email" [formField]="signupForm.email" />
      </ngx-signal-form-field-wrapper>

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

## What usually gets simpler

### Consider a split migration: Zod/OpenAPI first, Vest for complex rules

Yes — this is often one of the cleanest migration strategies.

Also remember that Angular Signal Forms validators still fit naturally in this stack.
You do not need to choose between Angular validators, Zod, and Vest — it is usually better to combine them deliberately.

If your app already has an OpenAPI contract, generated schemas, or a natural place to introduce Zod, you do **not** need to move every old Vest rule into the new Signal Forms layer all at once.

A pragmatic migration path is:

1. move structural and contract rules to **OpenAPI/Zod** first
2. register those rules through `validateStandardSchema(...)`
3. keep **Vest** for business-policy rules that are harder to express declaratively

That usually lets you reduce legacy `ngx-vest-forms` surface area faster while preserving the value of your existing Vest suites.

Recommended split:

- **Angular Signal Forms validators**
  - small UI-local rules
  - simple required / email / min / max / minLength / maxLength checks
  - form-state-driven rules such as disabled / readonly / hidden behavior
- **OpenAPI / Zod / Standard Schema**
  - required fields
  - email format
  - min/max length
  - number bounds
  - enums
  - backend contract shape
- **Vest**
  - cross-field business rules
  - conditional policy rules
  - async business validations
  - advisory `warn()` guidance

This is especially useful during migration because it gives you a stable rule boundary:

- Zod handles the **data contract**
- Vest handles the **business meaning**

In practice, that means you can often migrate like this:

- replace simple template-driven validation with Angular validators and/or generated or hand-written Zod schemas
- keep the existing Vest logic only for the rules that are still genuinely business-specific
- gradually shrink the old Vest surface instead of rewriting everything at once

Typical migration layering:

1. keep **small local field rules** in Angular validators
2. move **shared contract rules** to Zod / OpenAPI Standard Schema when available
3. keep **complex business policy** in Vest

See also:

- [`apps/demo/src/app/05-advanced/zod-vest-validation/README.md`](../apps/demo/src/app/05-advanced/zod-vest-validation/README.md)
- [`packages/toolkit/vest/README.md`](../packages/toolkit/vest/README.md#using-vest-together-with-zod-or-openapi-generated-schemas)

### Remove framework-specific `field` plumbing first

Many `ngx-vest-forms` suites carry a `field` parameter mainly to support focused field validation.

For the first migration pass, prefer simplifying suites to plain Vest `create((data) => { ... })` callbacks unless you have a proven need for manual focus modifiers.

That usually means deleting:

- the extra `field?: string` parameter
- `staticSuite(...)`-style integration scaffolding
- library-specific `validationConfig` wiring that existed to trigger dependent template-driven control revalidation

If your old suite still calls `suite(data)` directly, uses `promisify`, or relies on `staticSuite`, update those Vest 5 patterns first before evaluating the Angular migration itself.

Keep the business rules. Remove the adapter-era ceremony.

### Keep `warn()`, but update submit handling

Vest `warn()` still maps well to the toolkit.

The important difference is Angular Signal Forms currently treats all `ValidationError` objects as blocking during `submit()`, including toolkit-style warnings.

If warning-only forms should still submit:

1. use `<form [formRoot]="myForm">`
2. configure `submission: { ignoreValidators: 'all', action }`
3. gate the action with `hasOnlyWarnings(myForm().errorSummary())`

See also:

- [`packages/toolkit/vest/README.md`](../toolkit/vest/README.md)
- [`docs/WARNINGS_SUPPORT.md`](./WARNINGS_SUPPORT.md)

## Advanced features that need deliberate review

These `ngx-vest-forms` features do **not** currently have a one-line migration story in this repo's docs:

### `validationConfig`

If you relied on `validationConfig` for conditional field timing in template-driven forms, do not assume you can translate the object literally.

First migrate the suite and field bindings. Then test the specific dependency behavior you care about.

Typical candidates:

- password / confirm-password dependencies
- conditional required rules driven by another field
- `omitWhen(...)` branches that used to rely on targeted revalidation timing

### `validateRootForm`

If your old form used `ROOT_FORM` and a separate root-form directive, review those rules explicitly during migration.

Form-level business rules still make sense in Signal Forms, but this repo does not yet document a dedicated `ngx-vest-forms`-to-toolkit root-form migration recipe.

### `triggerFormValidation()`

If the legacy form depended on dynamic structure changes where controls were replaced with non-input content, treat that as a separate migration concern.

Do not assume the old manual trigger API has a direct equivalent in your new form architecture.

## Recommended migration order

1. **Upgrade to Vest 6 first** — do this before migrating any form code
2. **Move one form at a time** from `ngxVestForm` to Angular Signal Forms `form(...)`
3. **Replace `ngModel` + `name` bindings** with `[formField]`
4. **Move wrapper UI** from `ngx-control-wrapper` to toolkit wrappers or assistive components
5. **Keep the Vest business rules**, but simplify old integration-only scaffolding first
6. **Re-test warning-only submit behavior** using `hasOnlyWarnings(...)`
7. **Review advanced cases separately**: `validationConfig`, `validateRootForm`, dynamic structure changes, arrays

## Good candidates for migrating first

Start with forms that are mostly:

- field-level business rules
- conditional messages attached to specific fields
- advisory warnings via `warn()`
- wrapper-driven error display

These map cleanly to the current toolkit Vest examples:

- [`apps/demo/src/app/05-advanced/vest-validation/README.md`](../apps/demo/src/app/05-advanced/vest-validation/README.md)
- [`apps/demo/src/app/05-advanced/zod-vest-validation/README.md`](../apps/demo/src/app/05-advanced/zod-vest-validation/README.md)

If your current form mixes simple contract rules with a smaller number of complex policy checks, the **Zod + Vest** route is often the easiest migration path rather than trying to keep everything in Vest.

## Suggested follow-up docs

If migration demand grows, the next most valuable docs would be:

1. a focused `ROOT_FORM` / form-level migration example
2. a dynamic-structure migration example
3. a complex cross-field dependency example that compares old `validationConfig` patterns with Signal Forms behavior

Those three topics are where the remaining migration ambiguity lives.
