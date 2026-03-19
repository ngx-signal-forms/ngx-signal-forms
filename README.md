# @ngx-signal-forms/toolkit

[![GitHub Stars](https://badgen.net/github/stars/ngx-signal-forms/ngx-signal-forms?color=yellow&label=GitHub%20%E2%AD%90)](https://github.com/ngx-signal-forms/ngx-signal-forms)
[![CI Status](https://img.shields.io/github/actions/workflow/status/ngx-signal-forms/ngx-signal-forms/ci.yml?branch=main&label=CI)](https://github.com/ngx-signal-forms/ngx-signal-forms/actions/workflows/ci.yml)
[![Coverage](https://img.shields.io/codecov/c/github/ngx-signal-forms/ngx-signal-forms?branch=main&label=coverage)](https://codecov.io/gh/ngx-signal-forms/ngx-signal-forms)
[![Release Tag](https://img.shields.io/github/v/release/ngx-signal-forms/ngx-signal-forms?display_name=tag)](https://github.com/ngx-signal-forms/ngx-signal-forms/releases)
[![Version](https://badgen.net/npm/v/%40ngx-signal-forms%2Ftoolkit?icon=npm)](https://www.npmjs.com/package/@ngx-signal-forms/toolkit)
[![Downloads](https://badgen.net/npm/dt/%40ngx-signal-forms%2Ftoolkit?label=Downloads)](https://www.npmjs.com/package/@ngx-signal-forms/toolkit)
[![License](https://badgen.net/npm/license/%40ngx-signal-forms%2Ftoolkit)](https://opensource.org/licenses/MIT)

> **Accessibility-first UX primitives for Angular Signal Forms**

`@ngx-signal-forms/toolkit` builds on Angular Signal Forms without changing the underlying API. Angular still owns form creation, validation, and submission; the toolkit adds the missing UX layer: automatic ARIA wiring, strategy-based error display, warnings, and reusable field primitives.

## Installation

```bash
npm install @ngx-signal-forms/toolkit
```

---

## Why use it?

Angular Signal Forms already gives you:

- `form()` and validation schemas
- `[formField]` bindings
- `submit()` and `submitting()`
- field state such as `touched()`, `dirty()`, `invalid()`, and `errorSummary()`

The toolkit adds the pieces Angular intentionally leaves to app and library authors:

- **Progressive error display** via `immediate`, `on-touch`, and `on-submit`
- **Automatic ARIA wiring** for invalid/required/described-by states
- **Warnings** as non-blocking validation feedback
- **Reusable field UI** for common layouts
- **Headless primitives** when you want custom markup without rewriting state logic

---

## What you get

### Core: `@ngx-signal-forms/toolkit`

- form-level context via `[formRoot]`
- automatic ARIA attributes for supported controls
- strategy-aware error visibility helpers
- submission helpers such as `focusFirstInvalid()` and `createOnInvalidHandler()`
- warning utilities

### Assistive: `@ngx-signal-forms/toolkit/assistive`

- `<ngx-signal-form-error>` for accessible error and warning output
- `<ngx-signal-form-field-hint>`
- `<ngx-signal-form-field-character-count>`

### Form field: `@ngx-signal-forms/toolkit/form-field`

- `<ngx-signal-form-field-wrapper>`
- `<ngx-signal-form-fieldset>`
- floating-label support for `appearance="outline"`

### Headless: `@ngx-signal-forms/toolkit/headless`

- renderless directives for custom design systems
- utility functions such as `createErrorState()`, `createCharacterCount()`, and `readErrors()`

### Debugger: `@ngx-signal-forms/toolkit/debugger`

- a development-only form state inspector

---

## Angular vs toolkit

| Concern                                  | Angular Signal Forms                              | Toolkit                                       |
| ---------------------------------------- | ------------------------------------------------- | --------------------------------------------- |
| Form model, validation, submit lifecycle | ✅ Native                                         | ➖ Builds on top                              |
| Progressive error timing                 | ❌ Manual                                         | ✅ Built in                                   |
| Warning semantics                        | ❌ Manual convention needed                       | ✅ Built in via `warningError()`              |
| Automatic ARIA linking                   | ❌ Manual                                         | ✅ Built in                                   |
| Reusable field UI                        | ❌ App-specific                                   | ✅ Assistive + form-field entry points        |
| CSS status classes                       | ✅ Native `provideSignalFormsConfig({ classes })` | ➖ Use Angular’s native API alongside toolkit |

---

## Code Comparison

### Without toolkit

```html
<form [formRoot]="userForm">
  <label for="email">Email</label>
  <input
    id="email"
    [formField]="userForm.email"
    [attr.aria-invalid]="userForm.email().invalid() ? 'true' : null"
    [attr.aria-describedby]="userForm.email().invalid() && (userForm.email().touched() || userForm().touched()) ? 'email-error' : null"
  />
  @if (userForm.email().invalid() && (userForm.email().touched() ||
  userForm().touched())) {
  <span id="email-error" role="alert">
    {{ userForm.email().errors()[0].message }}
  </span>
  }
  <button type="submit">Submit</button>
</form>
```

### With toolkit

```html
<form [formRoot]="userForm">
  <ngx-signal-form-field-wrapper [formField]="userForm.email">
    <label for="email">Email</label>
    <input id="email" [formField]="userForm.email" />
  </ngx-signal-form-field-wrapper>
  <button type="submit">Submit</button>
</form>
```

**Result:** less repeated ARIA and visibility logic, with Angular still handling the underlying form state.

---

## Quick Start

The toolkit works with Angular Signal Forms as-is. Most projects only need the toolkit imports and, optionally, a global default strategy.

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
        <input id="email" [formField]="contactForm.email" type="email" />
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
        action: async () => {
          console.log('Submit:', this.model());
        },
        onInvalid: createOnInvalidHandler(),
      },
    },
  );
}
```

### What you get automatically

- ✅ Form-level context for toolkit components inside `[formRoot]`
- ✅ Declarative submission via `form()` options — no manual `submit()` calls needed
- ✅ `aria-invalid` and `aria-describedby` for accessibility
- ✅ **Errors** display after blur OR submit (default `'on-touch'` strategy) with `role="alert"`
- ✅ **Warnings** (non-blocking) display with `role="status"` when no errors present
- ✅ **Hints** render below the input with proper ARIA association
- ✅ Consistent layout with label, input, feedback messages in semantic structure

> **Note:** Angular still owns `submit()`, `submitting()`, field state, and validation. The toolkit layers accessibility and display behavior on top.

---

## Choose an entry point

### @ngx-signal-forms/toolkit (Core)

**Use this first** for form-level context, ARIA wiring, error strategies, and shared helpers.

**Key exports**:

- `NgxSignalFormToolkit` — Bundle import for all core directives
- `showErrors()` — Reactive helper for strategy-aware error visibility
- `focusFirstInvalid()` — Convenience wrapper for Angular's `focusBoundControl()` via `errorSummary()`
- `createOnInvalidHandler()` — Factory for `onInvalid` callbacks (auto-focuses first invalid control)
- `hasSubmitted()` — Convenience signal for completed submissions
- `warningError()` — Create non-blocking validation messages

```typescript
import {
  NgxSignalFormToolkit,
  focusFirstInvalid,
  createOnInvalidHandler,
  hasSubmitted,
} from '@ngx-signal-forms/toolkit';
```

**[📖 Full Documentation →](./packages/toolkit/README.md)**

---

### `@ngx-signal-forms/toolkit/assistive`

Use this when you want feedback components without adopting the full field wrapper.

**Key exports**:

- `NgxSignalFormErrorComponent` — Error/warning display with ARIA roles
- `NgxFormFieldHintComponent` — Helper text below inputs
- `NgxFormFieldCharacterCountComponent` — Character counter with maxLength detection
- `NgxFormFieldAssistiveRowComponent` — Layout row for hints and counters
- `warningError()`, `isWarningError()`, `isBlockingError()` — Warning utilities

```typescript
import {
  NgxSignalFormErrorComponent,
  NgxFormFieldHintComponent,
  warningError,
} from '@ngx-signal-forms/toolkit/assistive';
```

```html
<label for="email">Email</label>
<input id="email" [formField]="form.email" />
<ngx-signal-form-error [formField]="form.email" fieldName="email" />
<ngx-signal-form-field-hint
  >We'll never share your email</ngx-signal-form-field-hint
>
```

**[📖 Full Documentation →](./packages/toolkit/assistive/README.md)**

---

### `@ngx-signal-forms/toolkit/form-field`

Use this when you want a batteries-included field wrapper and consistent layout primitives.

**Key exports**:

- `NgxFormField` — Bundle import for form field wrapper, outlined layout, hints, and character count
- `NgxSignalFormFieldset` — Group related fields with aggregated errors (use `includeNestedErrors` to control aggregation)

```html
<ngx-signal-form-field-wrapper [formField]="form.bio" appearance="outline">
  <label for="bio">Bio</label>
  <textarea id="bio" [formField]="form.bio"></textarea>
  <ngx-signal-form-field-hint
    >Tell us about yourself</ngx-signal-form-field-hint
  >
  <ngx-signal-form-field-character-count [formField]="form.bio" />
</ngx-signal-form-field-wrapper>
```

When you omit `fieldName`, the wrapper derives field identity from the projected
control's `id`. Standalone assistive or headless APIs still use explicit
`fieldName` inputs.

**[📖 Full Documentation →](./packages/toolkit/form-field/README.md)** | **[🎨 Theming Guide →](./packages/toolkit/form-field/THEMING.md)**

---

### `@ngx-signal-forms/toolkit/headless`

Use this when you need full control over markup and styling but do not want to rewrite error and character-count state logic.

**Key exports**:

- `NgxHeadlessErrorStateDirective` — Error/warning state as signals
- `NgxHeadlessCharacterCountDirective` — Character count and limit states
- `NgxHeadlessFieldsetDirective` — Aggregated validation for field groups
- `createErrorState()`, `createCharacterCount()` — Programmatic utilities

Headless APIs keep `fieldName` explicit because they do not own the rendered
input structure for you.

```html
<div
  ngxSignalFormHeadlessErrorState
  #errorState="errorState"
  [field]="form.email"
  fieldName="email"
>
  <input [formField]="form.email" />
  @if (errorState.showErrors() && errorState.hasErrors()) {
  <div class="my-custom-error">
    @for (error of errorState.resolvedErrors(); track error.kind) {
    <span>{{ error.message }}</span>
    }
  </div>
  }
</div>
```

**[📖 Full Documentation →](./packages/toolkit/headless/README.md)**

---

### `@ngx-signal-forms/toolkit/debugger`

Use this during development to inspect field state, visibility rules, and resolved errors.

**Key exports**:

- `NgxSignalFormDebugger` — Bundle import
- `SignalFormDebuggerComponent` — Standalone component

```html
<form [formRoot]="form">
  <!-- ... fields ... -->
  <ngx-signal-form-debugger [formTree]="form" />
</form>
```

**Note:** Pass the FieldTree function (e.g. `form`), not the root state (`form()`).
The debugger supports `FieldState`, but it cannot traverse child fields, so visibility may look wrong.

**[📖 Full Documentation →](./packages/toolkit/debugger/README.md)**

---

## Configuration

For global defaults, add providers to `app.config.ts`:

```typescript
import {
  provideSignalFormsConfig,
  NG_STATUS_CLASSES,
} from '@angular/forms/signals';
import { provideNgxSignalFormsConfig } from '@ngx-signal-forms/toolkit';

export const appConfig: ApplicationConfig = {
  providers: [
    provideNgxSignalFormsConfig({
      defaultErrorStrategy: 'on-touch',
      defaultFormFieldAppearance: 'outline',
    }),
    // CSS status classes come from Angular, not the toolkit.
    provideSignalFormsConfig({
      classes: NG_STATUS_CLASSES, // Adds ng-valid, ng-invalid, ng-touched, etc.
    }),
  ],
};
```

**[📖 Configuration Reference →](./packages/toolkit/README.md#configuration)** | **[🎨 CSS Frameworks →](./docs/CSS_FRAMEWORK_INTEGRATION.md)**

---

## Demo and docs

Live demo: [https://ngx-signal-forms.github.io/ngx-signal-forms/](https://ngx-signal-forms.github.io/ngx-signal-forms/)

Start here:

- [Toolkit API reference](./packages/toolkit/README.md)
- [Current main changelog](./docs/CHANGELOG_CURRENT.md)
- [Changelog for beta.7](./docs/archive/CHANGELOG_BETA7.md)
- [Migration from beta.6 to beta.7](./docs/archive/MIGRATION_BETA7.md)
- [Assistive components](./packages/toolkit/assistive/README.md)
- [Form field components](./packages/toolkit/form-field/README.md)
- [Headless primitives](./packages/toolkit/headless/README.md)
- [Debugger](./packages/toolkit/debugger/README.md)
- [CSS framework integration](./docs/CSS_FRAMEWORK_INTEGRATION.md)
- [Warnings support](./docs/WARNINGS_SUPPORT.md)
- [Package architecture](./docs/PACKAGE_ARCHITECTURE.md)

## Browser Support

- Angular 21+ (Signal Forms API)
- All modern browsers with ES2022+ support
- TypeScript 5.8+

## Accessibility

The toolkit is designed with WCAG 2.2 AA form patterns in mind:

- automatic `aria-invalid`, `aria-required`, and `aria-describedby` wiring for supported controls
- `role="alert"` for blocking errors and `role="status"` for warnings
- default `on-touch` error timing to avoid premature error noise
- focus helpers for invalid submissions

As always, review and test your final forms in context.

---

## License

MIT © [ngx-signal-forms](https://github.com/ngx-signal-forms/ngx-signal-forms)
