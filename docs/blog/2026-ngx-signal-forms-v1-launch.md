---
title: '@ngx-signal-forms/toolkit v1.0.0: Accessible Angular Signal Forms without the boilerplate'
published: false
description: 'Angular Signal Forms handles state, validation, and submission. @ngx-signal-forms/toolkit v1.0.0 adds automatic ARIA wiring, error and warning timing, focus management, and customizable field UI.'
tags: 'angular, typescript, webdev, a11y'
cover_image: ''
canonical_url: ''
---

I maintain [`ngx-vest-forms`](https://www.npmjs.com/package/ngx-vest-forms), a template-driven Angular forms library that Brecht Billiet originally created around Vest. When Angular started moving toward Signal Forms, we needed a similar setup at work: low boilerplate, strong accessibility defaults, and full control over custom markup. I made the first commit to `@ngx-signal-forms/toolkit` on October 9, 2025, targeting Angular 21's early Signal Forms preview, and open sourced it from the start.

Signal Forms is now stable in Angular 22. Today `@ngx-signal-forms/toolkit` v1.0.0 is out.

## Why build a toolkit on top of Signal Forms?

Angular Signal Forms gives you a clean reactive form primitive. A `signal()` holds your model, `form()` manages field state and validation, and `[formRoot]` handles submission.

Angular does not render error messages or set ARIA attributes. It gives you `invalid()`, `touched()`, and `errors()`, and leaves the UI wiring to you. Without a toolkit, one accessible field looks like this:

```html
<label for="email">Email</label>
<input
  id="email"
  type="email"
  [formField]="contactForm.email"
  [attr.aria-invalid]="contactForm.email().touched() && contactForm.email().invalid()"
  [attr.aria-describedby]="
    contactForm.email().touched() && contactForm.email().invalid()
      ? 'email-error'
      : null
  "
/>
@if (contactForm.email().touched() && contactForm.email().invalid()) {
<div id="email-error" role="alert">
  @for (error of contactForm.email().errors(); track error.kind) {
  <p>{{ error.message }}</p>
  }
</div>
}
```

Repeating that markup across dozens of fields is tedious and easy to break during a refactor. With `@ngx-signal-forms/toolkit`, the same field is:

```html
<ngx-form-field-wrapper [formField]="contactForm.email">
  <label for="email">Email</label>
  <input id="email" type="email" [formField]="contactForm.email" />
</ngx-form-field-wrapper>
```

Angular still owns form state, validation, and submission. You keep using `form()`, `[formRoot]`, and `[formField]`. The toolkit adds the presentation and accessibility layer on top. See [Angular vs toolkit](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/docs/ANGULAR_VS_TOOLKIT.md) for the full split.

You do not need this toolkit for a single small form without accessibility requirements. Because it is additive, you can adopt it later without changing your `form()` code. When Angular Signal Forms adds a feature natively, the toolkit steps back in favor of Angular's API.

## Ready out of the box, without boilerplate

Install the package. The styled components ship their own CSS, so you do not import a separate stylesheet.

```bash
npm install @ngx-signal-forms/toolkit
```

Here is a complete contact form:

```typescript
import { Component, signal } from '@angular/core';
import {
  email,
  form,
  FormField,
  maxLength,
  required,
} from '@angular/forms/signals';
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
      <ngx-form-field-wrapper [formField]="contactForm.name">
        <label for="contact-name">Name</label>
        <input
          id="contact-name"
          autocomplete="name"
          [formField]="contactForm.name"
        />
      </ngx-form-field-wrapper>

      <ngx-form-field-wrapper [formField]="contactForm.email">
        <label for="contact-email">Email</label>
        <input
          id="contact-email"
          type="email"
          autocomplete="email"
          [formField]="contactForm.email"
        />
        <ngx-form-field-hint>We never share your email.</ngx-form-field-hint>
      </ngx-form-field-wrapper>

      <ngx-form-field-wrapper [formField]="contactForm.message">
        <label for="contact-message">Message</label>
        <textarea
          id="contact-message"
          rows="4"
          [formField]="contactForm.message"
        ></textarea>
        <ngx-form-field-character-count [formField]="contactForm.message" />
      </ngx-form-field-wrapper>

      <button type="submit" [disabled]="contactForm().submitting()">
        Send
      </button>
    </form>
  `,
})
export class ContactComponent {
  readonly model = signal({ name: '', email: '', message: '' });
  readonly contactForm = form(
    this.model,
    (path) => {
      required(path.name, { message: 'Name is required' });
      required(path.email, { message: 'Email is required' });
      email(path.email, { message: 'Enter a valid email address' });
      required(path.message, { message: 'Message is required' });
      maxLength(path.message, 500, { message: 'Use 500 characters or fewer' });
    },
    {
      submission: {
        action: async (tree) => {
          console.log('Saved:', tree().value());
        },
        onInvalid: createOnInvalidHandler(),
      },
    },
  );
}
```

Out of the box, that setup gives you:

- **Automatic ARIA wiring.** `aria-invalid`, `aria-required`, and `aria-describedby` stay in sync with visible errors, warnings, hints, and character counts. The character count reads its `500` limit from `maxLength()`.
- **Consistent message timing.** Pick `on-touch`, `on-submit`, or `immediate`. Under the default `on-touch`, a touched field hides its message while the user edits it and checks again on blur or submit. Screen readers hear an error once instead of on every keystroke. Add the `ngxSignalForm` directive only when you need `on-submit`, form-level timing, or an error summary.
- **Focus on invalid submit.** `createOnInvalidHandler()` moves focus to the first invalid interactive field when submission fails.
- **Grouped fields and summaries.** `ngx-form-fieldset` groups related fields with group-level feedback, and `ngx-form-field-error-summary` lists all form errors with links to each control.
- **Non-blocking warnings.** Return `warningError()` from a validator to show advice with `role="status"` instead of a blocking `role="alert"`. Warnings use their own `warningStrategy`, so you can hold errors until submit while showing warnings on blur.

Angular treats every validation error as blocking during `submit()`. To let warning-only forms submit, set `ignoreValidators: 'all'` and guard the action with `hasOnlyWarnings()`:

```typescript
import { Component, signal } from '@angular/core';
import { form, minLength, validate } from '@angular/forms/signals';
import {
  createOnInvalidHandler,
  hasOnlyWarnings,
  warningError,
} from '@ngx-signal-forms/toolkit';

@Component({
  selector: 'app-signup',
  template: `...`,
})
export class SignupComponent {
  readonly #model = signal({ password: '' });
  readonly #onInvalid = createOnInvalidHandler();

  readonly signupForm = form(
    this.#model,
    (path) => {
      minLength(path.password, 8, { message: 'Use at least 8 characters' });
      validate(path.password, ({ value }) =>
        value().length < 12
          ? warningError('short-password', 'Use 12 or more characters')
          : null,
      );
    },
    {
      submission: {
        ignoreValidators: 'all',
        action: async (tree) => {
          if (!hasOnlyWarnings(tree().errorSummary())) {
            this.#onInvalid(tree);
            return;
          }
          // Save tree().value() here.
        },
      },
    },
  );
}
```

Always keep the `hasOnlyWarnings()` guard when you use `ignoreValidators: 'all'`. Pending async validators do not block this path, so validate on the server too.

The toolkit targets WCAG 2.2 AA for the ARIA and live-region rules it automates, and verifies them with axe-core in Chromium browser tests on every change. Full WCAG conformance still belongs to your finished app. You still own labels, color contrast, copy, and keyboard order.

## Customize as far as you need

Zero-boilerplate defaults only stay useful when you can adapt them to your own design system. Customization works in four layers.

### 1. Theme with CSS custom properties and `light-dark()`

`ngx-form-field-wrapper` includes three appearances: `standard`, `outline`, and `plain`. It supports vertical and horizontal layouts. Visual tokens are standard CSS custom properties, so no `::ng-deep` is needed. Every default color uses CSS `light-dark()`. One `color-scheme` declaration switches the whole toolkit between light and dark mode:

```css
:root {
  color-scheme: light dark;
  --ngx-form-field-color-primary: #2563eb;
  --ngx-form-field-color-error: #dc2626;
  --ngx-form-field-color-warning: #b45309;
}
```

The wrapper also sets `data-*` host attributes for control kind, layout, orientation, and ARIA mode. Use them to style specific control types without coupling to internal markup.

### 2. Configure once at the right scope

Presentation settings resolve through one cascade where the most specific level wins. That covers error and warning timing, appearance, orientation, required or optional markers, error messages, field labels, control presets, and custom renderers:

```text
field input
  -> form directive (ngxSignalForm)
  -> component provider (provideNgxSignalFormsConfigForComponent)
  -> app provider (provideNgxSignalFormsConfig)
  -> built-in default
```

Overrides merge per key. Set defaults once in `app.config.ts`, then override only the key that differs in a feature or field.

### 3. Pick your UI level or wrap your own design system

The package splits into six entry points so you import only what you use:

| Entry point                            | What it gives you                                                                                    |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `@ngx-signal-forms/toolkit`            | Config, timing, auto-ARIA, focus, and warning helpers                                                |
| `@ngx-signal-forms/toolkit/form-field` | Ready-made field wrapper and fieldset                                                                |
| `@ngx-signal-forms/toolkit/assistive`  | Standalone error, hint, counter, legend, and summary components                                      |
| `@ngx-signal-forms/toolkit/headless`   | Renderless state directives when you own all markup and CSS                                          |
| `@ngx-signal-forms/toolkit/vest`       | Optional Vest 6 validator adapter                                                                    |
| `@ngx-signal-forms/toolkit/testing`    | Optional WCAG 2.2 AA axe-core test helpers (`expectNoA11yViolations`, `expectVisibleFocusIndicator`) |

If you already use a component library or an internal design system, build a thin wrapper on top of `createFieldPresentation()`, `/assistive`, or `/headless`. When a widget writes its own ARIA, set `ngxSignalFormControlAria="manual"` so only one owner writes each `aria-*` attribute.

The repository includes three runnable reference wrappers with their own demo apps and Playwright suites for Angular Material, Spartan, and PrimeNG. These are reference examples you can copy and adapt, not published packages.

### 4. Layer any validator you like

You are not locked into one validation library. Combine Angular validators, Angular's built-in `validateStandardSchema()` for Zod or other Standard Schema libraries, and Vest 6 in the same form:

```typescript
import { form, required, validateStandardSchema } from '@angular/forms/signals';
import { validateVest } from '@ngx-signal-forms/toolkit/vest';

form(model, (path) => {
  required(path.email, { message: 'Email is required' });
  validateStandardSchema(path, SignupSchema);
  validateVest(path, businessSuite, { includeWarnings: true });
});
```

If your app runs on [`ngx-vest-forms`](https://www.npmjs.com/package/ngx-vest-forms) with template-driven forms and works well today, there is no rush to rewrite it. When you move forms to Signal Forms, `@ngx-signal-forms/toolkit/vest` maps your Vest 6 errors and `warn()` tests directly into Signal Forms and toolkit warnings. See the migration guides for [`ngx-vest-forms`](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/docs/MIGRATING_FROM_NGX_VEST_FORMS.md) and [Reactive Forms](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/docs/MIGRATING_FROM_REACTIVE_FORMS.md).

## Official AI agent skill

If you use a coding agent such as Claude Code, Codex, GitHub Copilot, or Gemini CLI, you can install the official `ngx-signal-forms` skill into your project:

```bash
# skills.sh
npx skills add ngx-signal-forms/ngx-signal-forms --skill ngx-signal-forms

# Context7 (installs into .agents/skills/)
npx ctx7 skills install /ngx-signal-forms/ngx-signal-forms ngx-signal-forms --universal
```

The skill is self-contained. It bundles guides for every entry point (`/form-field`, `/assistive`, `/headless`, `/vest`, and `/testing`) along with Angular Signal Forms essentials, validation choices, custom controls, theming, accessibility checks, and common pitfalls. Your agent does not need Nx, Context7, or a checkout of this repository.

When you ask your agent to build or update a form, the skill routes it to the right entry point, enforces one ARIA owner per attribute, wires warning-aware submission and `on-touch` timing accurately, and points to matching demo examples.

## Examples, tests, and links

The repository includes 27 runnable Angular 22 demo examples covering basic forms, wizards, routed steps, autosave, NgRx SignalStore binding, i18n, custom controls, and Zod + Vest validation. They are backed by 49 Playwright e2e spec files across the four demo apps and Vitest browser accessibility tests.

Requirements: Angular 22 and modern evergreen browsers. `vest` and `axe-core` are optional peer dependencies. See [compatibility](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/docs/COMPATIBILITY.md) for exact version ranges.

- [Documentation](https://ngx-signal-forms-ngx-signal-forms.docs7.io/)
- [Live demo](https://ngx-signal-forms.github.io/ngx-signal-forms/)
- [npm (`@ngx-signal-forms/toolkit`)](https://www.npmjs.com/package/@ngx-signal-forms/toolkit)
- [GitHub repository](https://github.com/ngx-signal-forms/ngx-signal-forms)
- [FAQ](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/docs/FAQ.md)
- [`ngx-vest-forms` on npm](https://www.npmjs.com/package/ngx-vest-forms)

Source code, demos, and the issue tracker are on [GitHub](https://github.com/ngx-signal-forms/ngx-signal-forms).
