---
title: '@ngx-signal-forms/toolkit v1.0.0: Accessible Angular Signal Forms without the boilerplate'
published: false
description: 'Angular Signal Forms handles state, validation, and submission. @ngx-signal-forms/toolkit v1.0.0 adds automatic ARIA wiring, error and warning timing, focus management, and customizable field UI.'
tags: 'angular, typescript, webdev, a11y'
cover_image: ''
canonical_url: ''
---

I maintain [`ngx-vest-forms`](https://www.npmjs.com/package/ngx-vest-forms), which Brecht Billiet originally created for Angular template-driven forms. When Angular started moving toward Signal Forms, we needed a similar developer experience at work: low boilerplate, strong accessibility defaults, and full control when a design system needs custom markup. I started building `@ngx-signal-forms/toolkit` on October 9, 2025, against Angular 21's early Signal Forms preview, and open sourced it from day one.

Signal Forms is now stable in Angular 22, and today **`@ngx-signal-forms/toolkit` v1.0.0** is out.

## Why build a toolkit on top of Signal Forms?

Angular Signal Forms gives you a clean reactive primitive. A `signal()` holds your model, `form()` manages field state and validation, and `[formRoot]` handles submission.

Angular intentionally stops before the UI layer. It gives you `invalid()`, `touched()`, and `errors()`, and leaves the rest to you. Without a toolkit, one accessible field looks like this:

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

Repeating that across dozens of fields is tedious and easy to break during a refactor. With `@ngx-signal-forms/toolkit`, the same field is:

```html
<ngx-form-field-wrapper [formField]="contactForm.email">
  <label for="email">Email</label>
  <input id="email" type="email" [formField]="contactForm.email" />
</ngx-form-field-wrapper>
```

Angular still owns the model, validation, field state, and submission. You keep using `form()`, `[formRoot]`, and `[formField]`. The toolkit adds the presentation and accessibility layer around them.

You do not need this toolkit for a single small form without accessibility requirements. Because it is additive, you can adopt it later without rewriting your `form()` code. And as Angular Signal Forms adds features natively over time, the toolkit will deprecate overlapping helpers and provide migrations.

## Ready out of the box, without boilerplate

Install the package (no extra stylesheet import is needed):

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

- **Automatic ARIA wiring.** `aria-invalid`, `aria-required`, and `aria-describedby` stay in sync with visible errors, warnings, hints, and character counts. The character count reads its `500` limit straight from the `maxLength()` rule.
- **Consistent message timing.** Pick `on-touch` (default), `on-submit`, or `immediate`. Under `on-touch`, a touched field hides its message while the user edits it and checks again on blur or submit, so screen readers announce errors once instead of on every keystroke. You only add the `ngxSignalForm` directive when you need `on-submit`, form-level timing, or an error summary.
- **Focus on invalid submit.** `createOnInvalidHandler()` moves focus to the first invalid interactive field when submission fails.
- **Non-blocking warnings.** Return `warningError()` from any validator to show advice with `role="status"` instead of a blocking `role="alert"`. Warnings have their own `warningStrategy`, so you can hold errors until submit while still showing warnings on blur.

Because Angular treats every validation error as blocking during `submit()`, you let warning-only forms submit by setting `ignoreValidators: 'all'` and guarding the action with `hasOnlyWarnings()`:

```typescript
import { form, minLength, validate } from '@angular/forms/signals';
import {
  createOnInvalidHandler,
  hasOnlyWarnings,
  warningError,
} from '@ngx-signal-forms/toolkit';

readonly #onInvalid = createOnInvalidHandler();

readonly signupForm = form(
  this.model,
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
        await this.api.save(tree().value());
      },
    },
  },
);
```

Always keep that `hasOnlyWarnings()` guard when using `ignoreValidators: 'all'`, and validate on the server too (pending async validators do not block this path).

On accessibility: the toolkit automates the ARIA and live-region mechanics targeted at WCAG 2.2 AA and tests them with axe-core in Chromium browser specs on every change. Full WCAG conformance still belongs to your finished app: your labels, color contrast, copy, and keyboard order remain yours to test.

## Customize as far as you need

Zero-boilerplate defaults only stay useful if you can adapt them when your app outgrows them. Customization works in layers.

### 1. Theme with CSS custom properties and `light-dark()`

`ngx-form-field-wrapper` ships three appearances (`standard`, `outline`, and `plain`) plus vertical and horizontal layouts. Visual tokens are standard CSS custom properties, so no `::ng-deep` is needed. Every default color uses CSS `light-dark()`, which means one `color-scheme` declaration switches the entire toolkit between light and dark mode:

```css
:root {
  color-scheme: light dark;
  --ngx-form-field-color-primary: #2563eb;
  --ngx-form-field-color-error: #dc2626;
  --ngx-form-field-color-warning: #b45309;
}
```

The wrapper also exposes `data-*` host attributes for control kind, layout, orientation, and ARIA mode when you want to target specific control types in CSS.

### 2. Configure once at the right scope

Every presentation setting (error and warning timing, appearance, orientation, required/optional markers, error messages, field labels, control presets, and custom renderers) follows one cascade where the most specific level wins:

```text
field input
  -> form directive (ngxSignalForm)
  -> component provider (provideNgxSignalFormsConfigForComponent)
  -> app provider (provideNgxSignalFormsConfig)
  -> built-in default
```

Overrides merge per key, so you configure defaults once in `app.config.ts` and only override the single key that differs in a feature or field.

### 3. Pick your UI level or wrap your own design system

The package splits into six entry points so you only pull in what you use:

| Entry point                            | What it gives you                                                                                    |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `@ngx-signal-forms/toolkit`            | Config, timing, auto-ARIA, focus, and warning helpers                                                |
| `@ngx-signal-forms/toolkit/form-field` | Ready-made field wrapper and fieldset                                                                |
| `@ngx-signal-forms/toolkit/assistive`  | Standalone error, hint, counter, legend, and summary components                                      |
| `@ngx-signal-forms/toolkit/headless`   | Renderless state directives when you own all markup and CSS                                          |
| `@ngx-signal-forms/toolkit/vest`       | Optional Vest 6 validator adapter                                                                    |
| `@ngx-signal-forms/toolkit/testing`    | Optional WCAG 2.2 AA axe-core test helpers (`expectNoA11yViolations`, `expectVisibleFocusIndicator`) |

If you already use a component library or an internal design system, you can build a thin wrapper on top of `createFieldPresentation()`, `/assistive`, or `/headless`. When a widget manages its own ARIA, set `ngxSignalFormControlAria="manual"` so only one party writes `aria-*` attributes.

The repository includes three runnable reference wrappers with their own demo apps and Playwright test suites: **Angular Material**, **Spartan**, and **PrimeNG**.

### 4. Layer any validator you like

You are not locked into one validation library. Combine Angular validators, Standard Schema (such as Zod), and Vest 6 in the same form:

```typescript
form(model, (path) => {
  required(path.email, { message: 'Email is required' });
  validateStandardSchema(path, SignupSchema);
  validateVest(path, businessSuite, { includeWarnings: true });
});
```

If you are coming from [`ngx-vest-forms`](https://www.npmjs.com/package/ngx-vest-forms), the `/vest` entry point maps your Vest 6 errors and `warn()` calls straight into Signal Forms and toolkit warnings. There is a step-by-step [migration guide from `ngx-vest-forms`](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/docs/MIGRATING_FROM_NGX_VEST_FORMS.md) in the repo.

## Official AI agent skill

If you build with an AI coding agent (Claude Code, Codex, GitHub Copilot, Gemini CLI, or others), the repository ships an official `ngx-signal-forms` skill you can install into your project:

```bash
# skills.sh
npx skills add ngx-signal-forms/ngx-signal-forms --skill ngx-signal-forms

# Context7 (installs into .agents/skills/)
npx ctx7 skills install /ngx-signal-forms/ngx-signal-forms ngx-signal-forms --universal
```

The skill is self-contained: it bundles focused guides for every entry point (`/form-field`, `/assistive`, `/headless`, `/vest`, and `/testing`), Angular Signal Forms essentials, validation choices, custom controls, theming, accessibility checks, and common pitfalls. Your agent does not need Nx, Context7, or a checkout of this repo to use it.

In practice, it keeps your agent from guessing or hallucinating old patterns. It routes the agent to the right secondary entry point, enforces one ARIA owner per attribute, wires warning-aware submission and `on-touch` timing properly, and links straight to matching demo examples.

## Examples, tests, and links

The repository ships **27 runnable Angular 22 demo examples** (from your first form through wizards, routed steps, autosave, NgRx SignalStore binding, i18n, custom controls, and Zod + Vest validation) backed by **49 Playwright e2e spec files** across the four demo apps and Vitest browser accessibility tests.

Requirements: Angular `22.x`, TypeScript 6+, and modern evergreen browsers. `vest` and `axe-core` are optional peer dependencies.

- [Documentation](https://ngx-signal-forms-ngx-signal-forms.docs7.io/)
- [Live demo](https://ngx-signal-forms.github.io/ngx-signal-forms/)
- [npm (`@ngx-signal-forms/toolkit`)](https://www.npmjs.com/package/@ngx-signal-forms/toolkit)
- [GitHub repository](https://github.com/ngx-signal-forms/ngx-signal-forms)
- [`ngx-vest-forms` on npm](https://www.npmjs.com/package/ngx-vest-forms)

Give v1.0.0 a try, explore the demo, and open an issue if something feels off or gets in your way.
