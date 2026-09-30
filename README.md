# @ngx-signal-forms/toolkit

[![npm](https://img.shields.io/npm/v/@ngx-signal-forms/toolkit)](https://www.npmjs.com/package/@ngx-signal-forms/toolkit)
[![CI](https://img.shields.io/github/actions/workflow/status/ngx-signal-forms/ngx-signal-forms/ci.yml?branch=main&label=CI)](https://github.com/ngx-signal-forms/ngx-signal-forms/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/npm/l/@ngx-signal-forms/toolkit)](./LICENSE)
[![Context7](https://img.shields.io/badge/Context7-docs-blue)](https://context7.com/ngx-signal-forms/ngx-signal-forms)

Accessible field feedback for Angular Signal Forms. The toolkit shows errors
and warnings at the right moment, wires ARIA for you, moves focus to the first
invalid field, and gives you a themed field wrapper.

Angular still owns the model, validation, field state, and submission. You keep
using `form()`, `[formRoot]`, and `[formField]`. The toolkit adds the UI layer
around them.

[Docs](https://ngx-signal-forms-ngx-signal-forms.docs7.io/) ·
[Live demo](https://ngx-signal-forms.github.io/ngx-signal-forms/) ·
[npm](https://www.npmjs.com/package/@ngx-signal-forms/toolkit) ·
[API reference](./packages/toolkit/README.md)

## Why use it

Angular Signal Forms gives you field state. It does not decide when to show an
error, and it does not connect the error to the input. Without the toolkit, you
write this for every field:

```html
<label for="email">Email</label>
<input
  id="email"
  [formField]="form.email"
  [attr.aria-invalid]="form.email().touched() && form.email().invalid()"
  [attr.aria-describedby]="
    form.email().touched() && form.email().invalid() ? 'email-error' : null
  "
/>
@if (form.email().touched() && form.email().invalid()) {
<div id="email-error" role="alert">
  @for (error of form.email().errors(); track error.kind) {
  <p>{{ error.message }}</p>
  }
</div>
}
```

With the toolkit, you write this:

```html
<ngx-form-field-wrapper [formField]="form.email">
  <label for="email">Email</label>
  <input id="email" [formField]="form.email" />
</ngx-form-field-wrapper>
```

The wrapper adds:

- **Error timing.** Errors show after the user leaves a field, after submit, or
  at once. You pick one rule per app, form, or field.
- **ARIA wiring.** `aria-invalid`, `aria-required`, and `aria-describedby`
  follow the same timing as the visible message.
- **Warnings.** Non-blocking advice, such as "weak password", in its own
  polite live region.
- **Focus.** On an invalid submit, `createOnInvalidHandler()` moves focus to
  the first invalid field.
- **Hints, character counts, and required markers**, linked to the control.
- **Theming** through CSS custom properties, with light and dark mode.

You do not need the toolkit for one small form without accessibility
requirements. You can add it later without changing your `form()` code.
See [Angular and toolkit ownership](./docs/ANGULAR_VS_TOOLKIT.md) for the
full split.

## Install

```bash
npm install @ngx-signal-forms/toolkit
```

Use Angular 22. See [compatibility](./docs/COMPATIBILITY.md) for supported Angular,
TypeScript, Node, and browser versions. `vest` and `axe-core` are optional peer
dependencies. Install them only if you use `/vest` or `/testing`.

The styled components include their own CSS. You do not import a stylesheet.

## Quick start

Copy this component into an Angular application and render `<app-contact />`.
It stores the submitted email locally. Replace the action with your API call.

<!-- documentation-starter:start -->

```typescript
import { Component, signal } from '@angular/core';
import { email, form, FormField, required } from '@angular/forms/signals';
import {
  createOnInvalidHandler,
  NgxSignalFormToolkit,
} from '@ngx-signal-forms/toolkit';
import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';

@Component({
  selector: 'app-contact',
  imports: [FormField, NgxSignalFormToolkit, NgxFormField],
  template: `
    <form [formRoot]="contactForm">
      <ngx-form-field-wrapper [formField]="contactForm.email">
        <label for="contact-email">Email</label>
        <input
          id="contact-email"
          type="email"
          autocomplete="email"
          [formField]="contactForm.email"
        />
      </ngx-form-field-wrapper>
      <button type="submit" [disabled]="contactForm().submitting()">
        Send
      </button>
    </form>
    <p role="status">{{ savedEmail() ? 'Saved: ' + savedEmail() : '' }}</p>
  `,
})
export class ContactComponent {
  readonly model = signal({ email: '' });
  readonly savedEmail = signal('');
  readonly contactForm = form(
    this.model,
    (path) => {
      required(path.email, { message: 'Email is required' });
      email(path.email, { message: 'Enter a valid email address' });
    },
    {
      submission: {
        action: async (tree) => {
          this.savedEmail.set(tree().value().email);
        },
        onInvalid: createOnInvalidHandler(),
      },
    },
  );
}
```

<!-- documentation-starter:end -->

What each import does:

| Import                 | From                                   | Gives you                                                          |
| ---------------------- | -------------------------------------- | ------------------------------------------------------------------ |
| `FormField`            | `@angular/forms/signals`               | Angular's `[formField]` binding on the control                     |
| `NgxSignalFormToolkit` | `@ngx-signal-forms/toolkit`            | Angular's `FormRoot`, the `ngxSignalForm` directive, and auto-ARIA |
| `NgxFormField`         | `@ngx-signal-forms/toolkit/form-field` | The wrapper, fieldset, error, hint, and character count            |

`[formField]` appears twice. On the `<input>`, it is Angular's binding. On the
wrapper, it tells the wrapper which field's state to show.

Each control needs a `<label for>` and a matching `id`. The wrapper uses the
`id` to build the ARIA links.

Try it:

1. Select **Send** with an empty field. The error shows and focus moves to the
   input.
2. Type an invalid email and leave the field. The error updates.
3. Type `reader@example.com` and select **Send**. The saved value shows below
   the form.

## Choose your level

The toolkit has three UI levels. Start at the top. Go down a level only when
the level above does not fit your markup.

| Level             | Import from                                              | Use it when                                                                               | You write              |
| ----------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ---------------------- |
| 1. Styled wrapper | [`/form-field`](./packages/toolkit/form-field/README.md) | You accept the toolkit's field layout and theme it with CSS variables.                    | Label and control      |
| 2. Feedback parts | [`/assistive`](./packages/toolkit/assistive/README.md)   | You keep your own field layout but want ready-made error, summary, and legend components. | Layout, label, control |
| 3. State only     | [`/headless`](./packages/toolkit/headless/README.md)     | You render every element yourself and need only the signals.                              | All markup and styles  |

The root entry point, `@ngx-signal-forms/toolkit`, sits under all three levels.
It holds configuration, error timing, auto-ARIA, submission helpers, and
warnings. You always import it.

Other cases:

| You want to…                                                                         | Use                                                                                                                                                                                                                                                           |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Wrap Angular Material, PrimeNG, Spartan, or your own design system once and reuse it | A [custom wrapper](./docs/CUSTOM_WRAPPERS.md). See the reference wrappers for [Material](./apps/demo-material/README.md), [PrimeNG](./apps/demo-primeng/README.md), and [Spartan](./apps/demo-spartan/README.md). These are examples, not published packages. |
| Put a custom input or widget inside the wrapper                                      | [Custom controls](./docs/CUSTOM_CONTROLS.md)                                                                                                                                                                                                                  |
| Validate with Vest business rules                                                    | [`/vest`](./packages/toolkit/vest/README.md)                                                                                                                                                                                                                  |
| Assert WCAG 2.2 AA rules in component tests                                          | [`/testing`](./packages/toolkit/testing/README.md)                                                                                                                                                                                                            |

Start with Angular validators. Add a Standard Schema library, such as Zod, when
you share a data contract. Add Vest when you need its business-rule model. You
do not need all three. See [validation choices](./docs/VALIDATION_STRATEGY.md).

## When errors show

Pick one of three strategies:

| Strategy    | Errors show                                                |
| ----------- | ---------------------------------------------------------- |
| `on-touch`  | After the user leaves the field, or after submit. Default. |
| `on-submit` | Only after the first submit.                               |
| `immediate` | As soon as validation reports them.                        |

Set it at the level you need. The most specific setting wins:

```typescript
// App-wide, in app.config.ts providers
provideNgxSignalFormsConfig({ defaultErrorStrategy: 'on-submit' });
```

```html
<!-- One form: add ngxSignalForm next to [formRoot] -->
<form [formRoot]="form" ngxSignalForm errorStrategy="on-submit">
  <!-- One field -->
  <ngx-form-field-wrapper
    [formField]="form.email"
    strategy="immediate"
  ></ngx-form-field-wrapper>
</form>
```

The quick start works without `ngxSignalForm`. The app-wide setting times the
visible message and `aria-invalid` together, and Angular marks every
interactive field touched on submit. Add `ngxSignalForm` to the form when you
use `on-submit`, set the timing for one form, or show an error summary.
`on-submit` needs the directive because the directive tracks the submit. The
directive is already in `NgxSignalFormToolkit`, so you only add the attribute.

Warnings have their own `warningStrategy` with the same three values. The
default is `on-touch`, so a form can hold errors until submit and still show
warnings early. See [timing and messages](./docs/WARNINGS_SUPPORT.md#timing-and-configuration)
for the full precedence rules.

## Warnings that do not block submit

Return `warningError()` from a validator. The toolkit shows it as advice, in
amber, with `role="status"`:

```typescript
import { validate } from '@angular/forms/signals';
import {
  createOnInvalidHandler,
  hasOnlyWarnings,
  warningError,
} from '@ngx-signal-forms/toolkit';

// In the schema function
validate(path.password, ({ value }) =>
  value().length < 12
    ? warningError('short-password', 'Use 12 or more characters')
    : null,
);
```

A warning is still an Angular validation error. Angular's `submit()` blocks
it by default. To let warnings through, ignore validators in the submission
options and check for blocking errors yourself:

```typescript
readonly #onInvalid = createOnInvalidHandler();

readonly signupForm = form(this.model, signupSchema, {
  submission: {
    ignoreValidators: 'all',
    action: async (tree) => {
      if (!hasOnlyWarnings(tree().errorSummary())) {
        this.#onInvalid(tree);
        return;
      }
      await this.api.save(tree().value());
    },
  },
});
```

Never use `ignoreValidators: 'all'` without that check. It would also skip
real errors. Pending async validators do not block this path, so validate the
data on the server too. See [warnings](./docs/WARNINGS_SUPPORT.md) for
`submitWithWarnings()`, the imperative alternative.

## Accessibility

The toolkit wires ARIA. You still own some parts:

- Give each control a visible label and a stable `id`.
- Let one party write ARIA on a control. If a custom control or library sets
  its own `aria-invalid` or `aria-describedby`, add
  `ngxSignalFormControlAria="manual"` to it. See
  [custom controls](./docs/CUSTOM_CONTROLS.md).
- Keep native semantics such as `type`, `autocomplete`, and `inputmode`.
- Test contrast, keyboard use, and screen readers in your finished app.
  Automated checks cover markup and ARIA rules, not full WCAG conformance.

Native `:invalid` and `:user-invalid` styles do not follow toolkit timing, and
they do not see schema errors, server errors, or warnings. To style invalid
fields, use the toolkit's `aria-invalid`. See
[CSS integration](./docs/CSS_FRAMEWORK_INTEGRATION.md).

## Guides

Build forms:

- [Theming](./packages/toolkit/form-field/THEMING.md): style the wrapper,
  messages, hints, and error summary with CSS custom properties.
- [Grouped fields, arrays, and error summaries](./docs/COMPLEX_NESTED_FORMS.md):
  fieldsets, nested arrays, wizards, and a summary that links to each field.
- [Warnings, timing, and messages](./docs/WARNINGS_SUPPORT.md): add
  non-blocking rules, set when feedback shows, and translate messages.
- [Validation choices](./docs/VALIDATION_STRATEGY.md): pick Angular
  validators, a Standard Schema library such as Zod, or Vest.
- [CSS framework integration](./docs/CSS_FRAMEWORK_INTEGRATION.md): style
  invalid fields in Bootstrap, Tailwind CSS, and Angular Material.
- [Testing form components](./docs/TESTING.md): check error text and ARIA
  in Vitest with Testing Library.
- [Best practices](./docs/BEST_PRACTICES.md): what to do, what to avoid,
  and why.
- [FAQ](./docs/FAQ.md): short answers to "how do I…" questions, with links
  to demos.

Extend the toolkit:

- [Custom controls](./docs/CUSTOM_CONTROLS.md): bind a combobox, switch,
  datepicker, or third-party widget, and keep its ARIA correct.
- [Custom wrappers](./docs/CUSTOM_WRAPPERS.md): wrap Material, PrimeNG,
  Spartan, or your design system once and reuse it in every form.

Migrate:

- [Versioned migration notes](./docs/migrations/README.md): upgrade steps
  for each release. Check these against your installed version before you
  use a new feature.
- [From Reactive Forms](./docs/MIGRATING_FROM_REACTIVE_FORMS.md): the
  toolkit parts of a move off `ReactiveFormsModule`. Angular's own guide
  covers the rest.
- [From ngx-vest-forms](./docs/MIGRATING_FROM_NGX_VEST_FORMS.md): move to
  `/vest`. Upgrade to Vest 6 first.

## AI agent skill

The `ngx-signal-forms` skill teaches coding agents to use the toolkit. Install
it with one of these CLIs:

- **skills.sh:** `npx skills add ngx-signal-forms/ngx-signal-forms --skill ngx-signal-forms`
- **Context7:** `npx ctx7 skills install /ngx-signal-forms/ngx-signal-forms ngx-signal-forms --universal`

The Context7 command installs to `.agents/skills/`, which GitHub Copilot, Codex,
and other agents read. See the [skills.sh CLI](https://skills.sh/docs/cli) and
[Context7 skill commands](https://github.com/upstash/context7/blob/master/skills/context7-cli/references/skills.md)
for other agents and global installs.

The [skill](./.agents/skills/ngx-signal-forms/SKILL.md) covers forms,
warnings, custom controls, wrappers, accessibility checks, and migrations. It
does not need this repository or Nx. Keep its supporting files together. Ask
your agent, for example: "Use ngx-signal-forms to add a profile form with
validation feedback."

## For maintainers and contributors

- [Contributing](./docs/CONTRIBUTING.md): setup, commands, and release flow
- [Package architecture](./docs/PACKAGE_ARCHITECTURE.md): repository layout,
  build, and publishing
- [Angular public API policy](./docs/ANGULAR_PUBLIC_API_POLICY.md): which
  Angular APIs the toolkit may use
- [Architecture decisions](./docs/decisions/)
- [Test coverage](./docs/COVERAGE.md)

The quick start above is a tested contract. The
[starter check](./tools/scripts/check-documentation-starter.mjs) compiles the
marked block and runs its submission action. Run it with
`pnpm nx run toolkit:check-documentation-starter`.
