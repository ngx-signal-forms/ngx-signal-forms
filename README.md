# @ngx-signal-forms/toolkit

[![GitHub Stars](https://badgen.net/github/stars/ngx-signal-forms/ngx-signal-forms?color=yellow&label=GitHub%20%E2%AD%90)](https://github.com/ngx-signal-forms/ngx-signal-forms)
[![CI Status](https://img.shields.io/github/actions/workflow/status/ngx-signal-forms/ngx-signal-forms/ci.yml?branch=main&label=CI)](https://github.com/ngx-signal-forms/ngx-signal-forms/actions/workflows/ci.yml)
[![Coverage](https://img.shields.io/codecov/c/github/ngx-signal-forms/ngx-signal-forms?branch=main&label=coverage)](https://codecov.io/gh/ngx-signal-forms/ngx-signal-forms)
[![Release Tag](https://img.shields.io/github/v/release/ngx-signal-forms/ngx-signal-forms?display_name=tag)](https://github.com/ngx-signal-forms/ngx-signal-forms/releases)
[![Version](https://badgen.net/npm/v/%40ngx-signal-forms%2Ftoolkit?icon=npm)](https://www.npmjs.com/package/@ngx-signal-forms/toolkit)
[![Downloads](https://badgen.net/npm/dt/%40ngx-signal-forms%2Ftoolkit?label=Downloads)](https://www.npmjs.com/package/@ngx-signal-forms/toolkit)
[![License](https://badgen.net/npm/license/%40ngx-signal-forms%2Ftoolkit)](https://opensource.org/licenses/MIT)

> **Ship accessible, themed Angular Signal Forms without writing ARIA or error-display code.**

Angular Signal Forms gives you the form model, validation, and submission lifecycle.
`@ngx-signal-forms/toolkit` adds everything Angular intentionally leaves to you:
automatic ARIA wiring, strategy-based error timing, non-blocking warnings, and a
themable field wrapper. It is an **enhancement**, not a replacement — your `form()`,
`[formRoot]`, and `[formField]` code stays exactly the same.

**[🚀 Live demo](https://ngx-signal-forms.github.io/ngx-signal-forms/)** · **[📦 npm](https://www.npmjs.com/package/@ngx-signal-forms/toolkit)** · **[📖 Package docs](./packages/toolkit/README.md)**

---

## See the difference

<table border="1" frame="void" rules="cols" cellspacing="0" cellpadding="0">
<tr>
  <th align="left">With the toolkit</th>
  <th align="left">Plain Angular Signal Forms</th>
</tr>
<tr>

<td valign="top">

```html
<form [formRoot]="userForm">
  <ngx-signal-form-field-wrapper [formField]="userForm.email">
    <label for="email">Email</label>
    <input id="email" type="email" [formField]="userForm.email" />
  </ngx-signal-form-field-wrapper>
</form>
```

The wrapper handles ARIA, error timing, `role="alert"` vs `role="status"`, hint projection, and character counts automatically.

</td>
<td valign="top">

```html
<form [formRoot]="userForm">
  <label for="email">Email</label>
  <input
    id="email"
    [formField]="userForm.email"
    [attr.aria-invalid]="
      userForm.email().invalid() ? 'true' : null
    "
    [attr.aria-describedby]="
      userForm.email().invalid() &&
      (userForm.email().touched() ||
        userForm().touched())
        ? 'email-error'
        : null
    "
  />
  @if ( userForm.email().invalid() && (userForm.email().touched() ||
  userForm().touched()) ) {
  <span id="email-error" role="alert">
    {{ userForm.email().errors()[0].message }}
  </span>
  }
</form>
```

</td>
</tr>
</table>

---

## Install

```bash
npm install @ngx-signal-forms/toolkit
```

Requirements: Angular `>=21.2.0 <22.0.0` (Signal Forms API), TypeScript 5.9+, modern browsers. Angular 22 support ships in a future toolkit line — see [`COMPATIBILITY.md`](./COMPATIBILITY.md).

> Angular Signal Forms is still marked **experimental** upstream. The toolkit's own public API aims to stay stable — see [`COMPATIBILITY.md`](./COMPATIBILITY.md) before adopting a stable major in production.

---

## 30-second quick start

```typescript
import { Component, signal } from '@angular/core';
import {
  form,
  schema,
  required,
  email,
  FormField,
} from '@angular/forms/signals';
import {
  NgxSignalFormToolkit,
  createOnInvalidHandler,
} from '@ngx-signal-forms/toolkit';
import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';

@Component({
  selector: 'app-contact',
  imports: [FormField, NgxSignalFormToolkit, NgxFormField],
  template: `
    <form [formRoot]="contactForm">
      <ngx-signal-form-field-wrapper [formField]="contactForm.email">
        <label for="email">Email</label>
        <input id="email" type="email" [formField]="contactForm.email" />
      </ngx-signal-form-field-wrapper>
      <button type="submit">Send</button>
    </form>
  `,
})
export class ContactComponent {
  protected readonly model = signal({ email: '' });

  protected readonly contactForm = form(
    this.model,
    schema((path) => {
      required(path.email, { message: 'Email is required' });
      email(path.email, { message: 'Invalid email format' });
    }),
    {
      submission: {
        action: async () => console.log('Submit:', this.model()),
        onInvalid: createOnInvalidHandler(),
      },
    },
  );
}
```

**What you get for free:**

- ✅ `aria-invalid`, `aria-required`, `aria-describedby` wired automatically
- ✅ Errors appear after blur or submit (default `on-touch` strategy), with `role="alert"`
- ✅ Warnings render as `role="status"` when present
- ✅ Hints and character counts project below the input with proper ARIA association
- ✅ First invalid field focused on failed submit (`createOnInvalidHandler()`)

> Angular still owns `form()`, validation, `submit()`, and field state.
> The toolkit only layers accessibility, error timing, and display on top.
> No `ngxSignalForm` directive needed — the default `'on-touch'` strategy works out of the box.
> See [Adding `ngxSignalForm`](#adding-form-level-context-with-ngxsignalform) for when you need more.

---

## Which part of the toolkit do I need?

Most projects only need the **form-field wrapper**. The other entry points exist for
advanced and specialized cases — pull them in when you hit that specific need.

| I want to…                          | Use                                                              | Demo                                                                                                                                                       |
| ----------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Add accessible, themed fields fast  | [`/form-field`](./packages/toolkit/form-field/README.md) wrapper | [`your-first-form`](./apps/demo/src/app/01-getting-started/your-first-form)                                                                                |
| Control when errors appear          | Core + `errorStrategy`                                           | [`error-display-modes`](./apps/demo/src/app/02-toolkit-core/error-display-modes)                                                                           |
| Show non-blocking warnings          | `warningError()` + wrapper                                       | [`warning-support`](./apps/demo/src/app/02-toolkit-core/warning-support)                                                                                   |
| Build complex multi-section forms   | `/form-field` + `<ngx-signal-form-fieldset>`                     | [`complex-forms`](./apps/demo/src/app/04-form-field-wrapper/complex-forms)                                                                                 |
| Wrap custom / third-party controls  | `/form-field` + `ngxSignalFormControl`                           | [`custom-controls`](./apps/demo/src/app/04-form-field-wrapper/custom-controls)                                                                             |
| Bring my own markup / design system | [`/headless`](./packages/toolkit/headless/README.md) primitives  | [`fieldset-utilities`](./apps/demo/src/app/03-headless/fieldset-utilities)                                                                                 |
| Validate with Vest business rules   | [`/vest`](./packages/toolkit/vest/README.md) entry point         | [`vest-validation`](./apps/demo/src/app/05-advanced/vest-validation)                                                                                       |
| Combine Zod + Vest                  | `/vest` + `validateStandardSchema`                               | [`zod-vest-validation`](./apps/demo/src/app/05-advanced/zod-vest-validation)                                                                               |
| Async / cross-field validation      | Angular validators + core helpers                                | [`async-validation`](./apps/demo/src/app/05-advanced/async-validation), [`cross-field-validation`](./apps/demo/src/app/05-advanced/cross-field-validation) |
| Multi-step / wizard forms           | Core + `NgxSignalFormFieldset`                                   | [`advanced-wizard`](./apps/demo/src/app/05-advanced/advanced-wizard)                                                                                       |
| Customize submission handling       | `createOnInvalidHandler`, `focusFirstInvalid`                    | [`submission-patterns`](./apps/demo/src/app/05-advanced/submission-patterns)                                                                               |
| Set app-wide defaults               | `provideNgxSignalFormsConfig`                                    | [`global-configuration`](./apps/demo/src/app/05-advanced/global-configuration)                                                                             |
| Debug form state during development | [`/debugger`](./packages/toolkit/debugger/README.md)             | —                                                                                                                                                          |

---

## The main path: the form-field wrapper

The wrapper is the biggest single win — one component gives you layout, labels, hints,
errors, warnings, character counts, outlined appearance, and full ARIA. Most apps can stop reading here.

```html
<form [formRoot]="userForm">
  <ngx-signal-form-field-wrapper
    [formField]="userForm.bio"
    appearance="outline"
  >
    <label for="bio">Bio</label>
    <textarea id="bio" [formField]="userForm.bio"></textarea>
    <ngx-signal-form-field-hint>
      Tell us about yourself
    </ngx-signal-form-field-hint>
    <ngx-signal-form-field-character-count [formField]="userForm.bio" />
  </ngx-signal-form-field-wrapper>
</form>
```

- `appearance` supports `"stacked"`, `"outline"`, and `"plain"` out of the box
- theming hooks via CSS custom properties cover everything from tokens to dark mode.
- When you omit `fieldName`, the wrapper derives field identity from the projected control's `id`.

**Read more:** [form-field docs](./packages/toolkit/form-field/README.md) · [theming guide](./packages/toolkit/form-field/THEMING.md)

---

## Adding form-level context with `ngxSignalForm`

The examples above use the default `'on-touch'` strategy: errors appear after the
user blurs a field or submits the form. This works because Angular's `submit()` calls
`markAllAsTouched()` internally, so `touched()` becomes true for all fields.

When you need more control, add `ngxSignalForm` alongside `[formRoot]`:

```html
<form [formRoot]="userForm" ngxSignalForm errorStrategy="on-submit">
  <ngx-signal-form-field-wrapper [formField]="userForm.email">
    <label for="email">Email</label>
    <input id="email" type="email" [formField]="userForm.email" />
  </ngx-signal-form-field-wrapper>
  <button type="submit">Send</button>
</form>
```

**What `ngxSignalForm` adds on top of Angular's `[formRoot]`:**

| Feature            | Without             | With `ngxSignalForm`                                                                                             |
| ------------------ | ------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Error strategy     | Always `'on-touch'` | Configurable via `errorStrategy` input (`'on-touch'`, `'on-submit'`, `'immediate'`)                              |
| Submitted status   | Not tracked         | `submittedStatus` signal (`'unsubmitted' → 'submitting' → 'submitted'`)                                          |
| Form-level context | None                | Shared strategy + status propagated via DI so wrappers, auto-ARIA, assistive, and headless features stay in sync |

**Reach for `ngxSignalForm` when:**

- You want errors to stay hidden until the first submit attempt (`'on-submit'` strategy)
- You need submit-lifecycle UI (`unsubmitted/submitting/submitted`), e.g. post-submit banners or submit-state messaging
- You want one form-level strategy + status propagated to wrappers/assistive/headless/auto-ARIA without passing inputs around

Without it, every toolkit component falls back to `'on-touch'` and treats the form as
unsubmitted — which is the right default for most forms.

Auto-ARIA works **with or without** `ngxSignalForm`. Without `ngxSignalForm`, it still manages `aria-invalid`, `aria-required`, and `aria-describedby` on supported controls using fallback timing (`'on-touch'`, `'unsubmitted'`).
With `ngxSignalForm`, auto-ARIA inherits the same form-level `errorStrategy` and `submittedStatus` as the wrapper.

---

## Going further

Pull in these entry points only when you need what they add.

### `@ngx-signal-forms/toolkit` — core helpers

Form-level context, strategy-aware error visibility, submission helpers, and warning
utilities. Always imported; all other entry points sit on top of it.

Key exports: `NgxSignalFormToolkit`, `showErrors()`, `combineShowErrors()`, `focusFirstInvalid()`,
`createOnInvalidHandler()`, `hasSubmitted()`, `warningError()`, `splitByKind()`,
`provideFieldLabels()`, `provideErrorMessages()`, `provideNgxSignalFormsConfig()`,
`provideNgxSignalFormsConfigForComponent()`, `provideNgxSignalFormControlPresets()`,
`provideNgxSignalFormControlPresetsForComponent()`, `buildAriaDescribedBy()`.

**[→ Core docs](./packages/toolkit/README.md)** ·
**Demos:**
[`error-display-modes` (code)](./apps/demo/src/app/02-toolkit-core/error-display-modes) · [live](https://ngx-signal-forms.github.io/ngx-signal-forms/toolkit-core/error-display-modes/),
[`warning-support` (code)](./apps/demo/src/app/02-toolkit-core/warning-support) · [live](https://ngx-signal-forms.github.io/ngx-signal-forms/toolkit-core/warning-support/),
[`submission-patterns` (code)](./apps/demo/src/app/05-advanced/submission-patterns) · [live](https://ngx-signal-forms.github.io/ngx-signal-forms/advanced-scenarios/submission-patterns/),
[`global-configuration` (code)](./apps/demo/src/app/05-advanced/global-configuration) · [live](https://ngx-signal-forms.github.io/ngx-signal-forms/advanced-scenarios/global-configuration/)

### `@ngx-signal-forms/toolkit/assistive` — standalone feedback

Use this when you want error, hint, and counter components _without_ adopting the full
field wrapper — e.g. you already have a layout system but want the toolkit's error
timing and ARIA.

Key exports: `NgxFormFieldErrorComponent`, `NgxFormFieldErrorSummaryComponent`,
`NgxFormFieldHintComponent`, `NgxFormFieldCharacterCountComponent`,
`NgxFormFieldAssistiveRowComponent`.

**[→ Assistive docs](./packages/toolkit/assistive/README.md)** ·
**Demo:** [`your-first-form` (code)](./apps/demo/src/app/01-getting-started/your-first-form) · [live](https://ngx-signal-forms.github.io/ngx-signal-forms/getting-started/your-first-form/)

### `@ngx-signal-forms/toolkit/headless` — bring your own markup

Renderless directives and utility functions that give you toolkit-managed state —
error visibility, aggregation, focus behavior, character counts — while you control
every bit of markup and styling.

Key exports: `NgxHeadlessToolkit`, `NgxHeadlessErrorStateDirective`, `NgxHeadlessErrorSummaryDirective`,
`NgxHeadlessCharacterCountDirective`, `NgxHeadlessFieldsetDirective`, `NgxHeadlessFieldNameDirective`,
`createErrorState()`, `createCharacterCount()`, `createFieldStateFlags()`,
`readErrors()`, `dedupeValidationErrors()`.

**[→ Headless docs](./packages/toolkit/headless/README.md)** ·
**Demo:** [`fieldset-utilities` (code)](./apps/demo/src/app/03-headless/fieldset-utilities) · [live](https://ngx-signal-forms.github.io/ngx-signal-forms/headless/fieldset-utilities/)

### `@ngx-signal-forms/toolkit/vest` — business-policy validation

Optional [Vestjs](https://vestjs.dev) adapter for higher-order business rules and advisory `warn()` guidance.
Peer-dependent on Vest 6+; only loaded when you import this entry point.

Key exports: `validateVest()`, `validateVestWarnings()`.

```bash
npm install @ngx-signal-forms/toolkit vest@6.2.7
```

**[→ Vest docs](./packages/toolkit/vest/README.md)** · **Demos:**
[`vest-validation` (code)](./apps/demo/src/app/05-advanced/vest-validation) · [live](https://ngx-signal-forms.github.io/ngx-signal-forms/advanced-scenarios/vest-validation/),
[`zod-vest-validation` (code)](./apps/demo/src/app/05-advanced/zod-vest-validation) · [live](https://ngx-signal-forms.github.io/ngx-signal-forms/advanced-scenarios/zod-vest-validation/) ·
**[Migrating from `ngx-vest-forms`](./docs/MIGRATING_FROM_NGX_VEST_FORMS.md)**

### `@ngx-signal-forms/toolkit/debugger` — dev-only inspector

Pass the form tree to inspect field state, visibility rules, and resolved errors
during development.

Key exports: `NgxSignalFormDebugger` (bundle), `SignalFormDebuggerComponent`.

```html
<ngx-signal-form-debugger [formTree]="form" />
```

**[→ Debugger docs](./packages/toolkit/debugger/README.md)** ·
**Demos:** [`your-first-form` (code)](./apps/demo/src/app/01-getting-started/your-first-form) · [live](https://ngx-signal-forms.github.io/ngx-signal-forms/getting-started/your-first-form/),
[`complex-forms` (code)](./apps/demo/src/app/04-form-field-wrapper/complex-forms) · [live](https://ngx-signal-forms.github.io/ngx-signal-forms/form-field-wrapper/complex-forms/)

---

## Validation strategies

Angular validators, Zod/OpenAPI Standard Schema, and Vest are **complementary, not
mutually exclusive**. For most real-world forms the cleanest stack layers all three:

- **Angular validators** for small local rules (`required`, `email`, `minLength`)
- **Zod / OpenAPI Standard Schema** for shared contract and shape rules
- **Vest** for conditional business policy and `warn()` guidance

```typescript
form(model, (path) => {
  required(path.email); // Angular
  validateStandardSchema(path, SignupSchema); // Zod / OpenAPI
  validateVest(path, businessSuite, { includeWarnings: true }); // Vest
});
```

**[→ Full validation strategy guide](./docs/VALIDATION_STRATEGY.md)**

---

## Configuration

```typescript
import { provideSignalFormsConfig } from '@angular/forms/signals';
import { NG_STATUS_CLASSES } from '@angular/forms/signals/compat';
import { provideNgxSignalFormsConfig } from '@ngx-signal-forms/toolkit';

export const appConfig: ApplicationConfig = {
  providers: [
    provideNgxSignalFormsConfig({
      defaultErrorStrategy: 'on-touch',
      defaultFormFieldAppearance: 'outline',
    }),
    provideSignalFormsConfig({
      classes: NG_STATUS_CLASSES, // ng-valid, ng-invalid, ng-touched, …
    }),
  ],
};
```

**[→ Configuration reference](./packages/toolkit/README.md#configuration)** · **[→ CSS framework integration](./docs/CSS_FRAMEWORK_INTEGRATION.md)**

---

## FAQ

<details>
<summary><strong>Does this replace Angular Signal Forms?</strong></summary>

No. The toolkit is additive. Angular still owns `form()`, validation, `submit()`,
field state, and `[formField]`. The toolkit only adds DI context, ARIA wiring, error
timing, warnings, and field UI. See [Angular vs toolkit](./docs/ANGULAR_VS_TOOLKIT.md).

</details>

<details>
<summary><strong>Is Signal Forms experimental — is the toolkit safe to use?</strong></summary>

Angular Signal Forms is still marked experimental upstream, so the API may shift. The
toolkit's own public API aims to stay stable across minor versions. If you're adopting
in production, read [`COMPATIBILITY.md`](./COMPATIBILITY.md) first.

</details>

<details>
<summary><strong>Do I need the toolkit for simple forms?</strong></summary>

You don't _need_ it — plain Signal Forms works. You'll want it the moment you write
the same ARIA + error-timing boilerplate twice, or need warnings, or want consistent
field layout and theming across an app.

</details>

<details>
<summary><strong>Does the wrapper work with my native checkbox styled as a switch?</strong></summary>

Yes, automatically. A native `input[type="checkbox"][role="switch"]` with `[formField]`
is recognized as a switch — the wrapper and auto-ARIA handle it without any extra
directives.

```html
<input type="checkbox" role="switch" [formField]="form.enabled" />
```

</details>

<details>
<summary><strong>When do I need <code>ngxSignalForm</code>?</strong></summary>

Not always — and the examples on this page don't use it. Every toolkit component
injects `NGX_SIGNAL_FORM_CONTEXT` as **optional** and falls back to `'on-touch'`:

| Scenario                                                  | `ngxSignalForm` needed?                        |
| --------------------------------------------------------- | ---------------------------------------------- |
| Default `'on-touch'` error timing                         | No — that's the fallback                       |
| `'on-submit'` error strategy                              | **Yes** — the directive tracks submit attempts |
| Submitted status tracking (`submittedStatus`)             | **Yes** — provided by the directive            |
| Using `createOnInvalidHandler()` / `focusFirstInvalid()`  | No — these are pure utilities                  |
| Wrapper, auto-ARIA, assistive, headless with `'on-touch'` | No — all fall back to defaults                 |
| Form-level strategy shared to all children                | **Yes** — propagated via DI context            |

See [Adding `ngxSignalForm`](#adding-form-level-context-with-ngxsignalform) for the
full explanation and example.

</details>

<details>
<summary><strong>When do I need <code>ngxSignalFormControl</code>?</strong></summary>

Only for advanced cases: custom components, third-party widgets, manual ARIA
ownership (`ngxSignalFormControlAria="manual"`), or preset-driven defaults for control
families (sliders, composites). Native `<input>`, `<textarea>`, and `<select>` do not
need it. See [`docs/CUSTOM_CONTROLS.md`](./docs/CUSTOM_CONTROLS.md) and
[ADR-0001](./docs/decisions/0001-control-semantics-architecture.md).

</details>

<details>
<summary><strong>Does the wrapper work with Tailwind / Bootstrap / Material?</strong></summary>

Yes — the wrapper is unopinionated about CSS. See
[`docs/CSS_FRAMEWORK_INTEGRATION.md`](./docs/CSS_FRAMEWORK_INTEGRATION.md) and the
[theming guide](./packages/toolkit/form-field/THEMING.md) for framework-specific
patterns.

</details>

<details>
<summary><strong>Can I fully customize the look and feel to match my design system?</strong></summary>

Yes. You can start with the wrapper and tailor it to your UI using:

- `appearance="stacked" | "outline" | "plain"`
- CSS custom properties (tokens, spacing, borders, colors, dark mode)
- Your own utility/framework classes (Tailwind, Bootstrap, Material, etc.)

If you want total markup and styling control, use the
[`/headless`](./packages/toolkit/headless/README.md) entry point and keep only
the toolkit's state/behavior primitives.

See [form-field theming](./packages/toolkit/form-field/THEMING.md) and
[`docs/CSS_FRAMEWORK_INTEGRATION.md`](./docs/CSS_FRAMEWORK_INTEGRATION.md).

</details>

<details>
<summary><strong>How do I combine this with Vest or Zod?</strong></summary>

Layer them — Angular validators for local rules, Standard Schema for contracts, Vest
for business policy. See [`docs/VALIDATION_STRATEGY.md`](./docs/VALIDATION_STRATEGY.md)
for the full guide and a worked example.

</details>

<details>
<summary><strong>Where do I find a demo for X?</strong></summary>

Every row in the "[Which part do I need?](#which-part-of-the-toolkit-do-i-need)" table
links to a runnable demo. Browse them all at
[ngx-signal-forms.github.io/ngx-signal-forms](https://ngx-signal-forms.github.io/ngx-signal-forms/).

</details>

---

## Accessibility

The toolkit is designed around the WCAG 2.2 AA form patterns it can automate:

- automatic `aria-invalid`, `aria-required`, and `aria-describedby` on supported controls
- `role="alert"` for blocking errors and `role="status"` for warnings, relying on the roles' implicit live-region semantics (no redundant `aria-live`/`aria-atomic` that some AT + browser combinations double-announce)
- `on-touch` error timing by default to avoid premature noise; warnings default to `'immediate'` and can be tuned independently via `warningStrategy` — see [warnings support](./docs/WARNINGS_SUPPORT.md)
- focus helpers (`focusFirstInvalid`, `createOnInvalidHandler`) for invalid submissions

These cover the mechanics, not the content. WCAG conformance is a property of
your finished page — the toolkit cannot guarantee accessible labels, color
contrast, copy, keyboard order, or context that lives outside the form. Treat
the automation as a head start, then run an end-to-end audit on the deployed
form (axe, Lighthouse, screen-reader testing) before claiming conformance.

---

## Resources

**Getting started**

- [Live demo](https://ngx-signal-forms.github.io/ngx-signal-forms/)
- [Compatibility matrix](./COMPATIBILITY.md)
- [Package architecture](./docs/PACKAGE_ARCHITECTURE.md)

**Package docs**

- [Core toolkit](./packages/toolkit/README.md)
- [Form field wrapper](./packages/toolkit/form-field/README.md) · [theming](./packages/toolkit/form-field/THEMING.md)
- [Assistive components](./packages/toolkit/assistive/README.md)
- [Headless primitives](./packages/toolkit/headless/README.md)
- [Vest integration](./packages/toolkit/vest/README.md)
- [Debugger](./packages/toolkit/debugger/README.md)

**Guides**

- [Angular vs toolkit](./docs/ANGULAR_VS_TOOLKIT.md) — what the toolkit adds, with a before/after example
- [Validation strategies](./docs/VALIDATION_STRATEGY.md) — when to use Angular validators, Zod, or Vest
- [Custom controls](./docs/CUSTOM_CONTROLS.md) — wrapping custom and third-party widgets
- [Complex and nested forms](./docs/COMPLEX_NESTED_FORMS.md) — fieldset aggregation, error summary, strategy inheritance
- [Warnings support](./docs/WARNINGS_SUPPORT.md) — warning convention, error flow, message resolution
- [CSS framework integration](./docs/CSS_FRAMEWORK_INTEGRATION.md) — Tailwind, Bootstrap, Material
- [Migrating from `ngx-vest-forms`](./docs/MIGRATING_FROM_NGX_VEST_FORMS.md)
- [Migrating beta → v1](./docs/MIGRATING_BETA_TO_V1.md)

**Reference**

- [Angular public API policy](./docs/ANGULAR_PUBLIC_API_POLICY.md) — ownership boundary between Angular and the toolkit (contributor/auditor level)

**AI skill**

```bash
npx skills add https://github.com/ngx-signal-forms/ngx-signal-forms --skill ngx-signal-forms
```

Covers the full toolkit — entry points, patterns, ARIA automation, and demo references.

---

## License

MIT © [ngx-signal-forms](https://github.com/ngx-signal-forms/ngx-signal-forms)
