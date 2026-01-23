# @ngx-signal-forms/toolkit

> **Enhancement toolkit for Angular Signal Forms with automatic accessibility and progressive error disclosure**

[![Github Stars](https://badgen.net/github/stars/nngx-signal-forms/nngx-signal-forms?color=yellow&label=Github%20🌟)](https://github.com/nngx-signal-forms/nngx-signal-forms)
[![Next Release](https://badgen.net/npm/v/nngx-signal-forms/beta?label=Next&color=orange)](https://www.npmjs.com/package/nngx-signal-forms?activeTab=versions)
[![Version](https://badgen.net/npm/v/nngx-signal-forms?&icon=npm)](https://www.npmjs.com/package/nngx-signal-forms)
[![Downloads](https://badgen.net/npm/dt/nngx-signal-forms?label=Downloads)](https://www.npmjs.com/package/nngx-signal-forms)
[![Bundle Size](https://badgen.net/bundlephobia/minzip/nngx-signal-forms)](https://bundlephobia.com/package/nngx-signal-forms)
[![License](https://badgen.net/npm/license/nngx-signal-forms)](https://opensource.org/licenses/MIT)
[![Build Status](https://badgen.net/github/checks/nngx-signal-forms/nngx-signal-forms)](https://github.com/nngx-signal-forms/nngx-signal-forms/actions)

Directives, components, and utilities that enhance Angular's Signal Forms with automatic accessibility features, flexible error display strategies, and reusable form field wrappers—all without modifying the core Signal Forms API.

## Installation

```bash
npm install @ngx-signal-forms/toolkit
```

---

## Why This Library?

Angular Signal Forms (introduced in v21) provides an excellent foundation for reactive forms. **@ngx-signal-forms/toolkit** builds on this foundation by adding accessibility, UX patterns, and developer conveniences that would otherwise require significant boilerplate.

## What's Included?

### 🛠️ Core Toolkit Features

Every installation includes these essentials to streamline your forms logic:

- **Auto-ARIA Automation**: Automatically manages `aria-invalid` and `aria-describedby` for WCAG compliance.
- **Smart Error Strategies**: Control when errors appear (`'on-touch'`, `'on-submit'`, `'immediate'`) without complex template logic.
- **Submission Utilities**: Helpers like `focusFirstInvalid()`, `canSubmit()`, and `isSubmitting()` signals.
- **Status Classes**: Sync CSS validation classes (like `.is-invalid`) with your error strategy so users don't see red fields while typing.
- **Warning Logic**: Support for non-blocking validation messages ("warnings") alongside standard errors.

### 📦 Form Field & Wrapper

A set of cohesive UI components to build consistent, accessible form layouts:

- **Unified Wrapper**: `<ngx-signal-form-field>` encapsulates label, input, errors, warnings and hints in a semantic structure.
- **Floating Labels**: Built-in `outline` style support for Material-like floating labels.
- **Character Count**: Auto-detects `maxLength` validators and displays a progressive character counter.
- **Accessibility Components**: Special `<ngx-signal-form-error>` and hints with correct ARIA roles.

### Comparison Matrix

| Feature                    | Signal Forms Alone                                         | With @ngx-signal-forms/toolkit                                                 |
| -------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------ |
| **Form Creation**          | ✅ `form()`, `schema()`, validators                        | ✅ Same (no changes)                                                           |
| **Validation**             | ✅ Built-in and custom validators                          | ✅ Same + warning support (non-blocking)                                       |
| **Field State**            | ✅ `touched()`, `dirty()`, `invalid()`, `errors()`         | ✅ Same (no changes)                                                           |
| **Touch on Blur**          | ✅ Automatic via `[formField]` directive                   | ✅ Enhanced with opt-out capability                                            |
| **Submission Tracking**    | ✅ `submitting()` + `touched()` signals                    | ✅ Derived `submittedStatus` via DI context + helper utilities                 |
| **Submission Helpers**     | ❌ Manual `form().valid() && !form().submitting()`         | ✅ `canSubmit()`, `isSubmitting()`, `hasSubmitted()` computed signals          |
| **Focus Management**       | ❌ Manual field focus after failed submission              | ✅ `focusFirstInvalid()` utility for accessibility                             |
| **Character Count**        | ❌ Manual tracking or duplicate limit configuration        | ✅ Auto-detects from validation rules + progressive color states               |
| **ARIA Attributes**        | ❌ Manual `[attr.aria-invalid]`, `[attr.aria-describedby]` | ✅ Automatic via directive                                                     |
| **Error Display Logic**    | ❌ Manual `@if` conditions in every template               | ✅ Strategy-based (immediate/on-touch/on-submit/manual) + field-level override |
| **Error Components**       | ❌ Custom error rendering per component                    | ✅ Reusable `<ngx-signal-form-error>` component                                |
| **Form Wrapper**           | ❌ Manual form setup and context                           | ✅ Optional `[ngxSignalForm]` for `'on-submit'` strategy                       |
| **HTML5 Validation**       | ❌ Manual `novalidate` on every form                       | ✅ Automatic `novalidate` on any form with `(submit)`                          |
| **CSS Status Classes**     | ⚠️ Manual via `provideSignalFormsConfig` (21.1+)           | ✅ `ngxStatusClasses()` syncs with error display strategy                      |
| **Form Field Wrapper**     | ❌ Custom layout per component                             | ✅ Consistent `<ngx-signal-form-field>` wrapper                                |
| **Material Design Layout** | ❌ Custom CSS for outlined inputs                          | ✅ Built-in `outline` directive with floating labels                           |
| **WCAG 2.2 Compliance**    | ❌ Requires manual implementation                          | ✅ Built-in with proper ARIA roles and live regions                            |
| **Code Reduction**         | —                                                          | **~50% less template code** for forms with validation                          |

---

## Code Comparison

### Without Toolkit (Manual ARIA and Error Logic)

```html
<form (submit)="save($event)" novalidate>
  <label for="email">Email</label>
  <input
    id="email"
    [formField]="userForm.email"
    [attr.aria-invalid]="userForm.email().invalid() ? 'true' : null"
    [attr.aria-describedby]="userForm.email().invalid() && userForm.email().touched() ? 'email-error' : null"
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

### With Toolkit (Automatic ARIA + Error Display)

```html
<!-- No [ngxSignalForm] needed for default 'on-touch' strategy! -->
<form (submit)="save($event)">
  <ngx-signal-form-field [formField]="userForm.email" fieldName="email">
    <label for="email">Email</label>
    <input id="email" [formField]="userForm.email" />
  </ngx-signal-form-field>
  <button type="submit">Submit</button>
</form>
```

**Result:** ~15 lines → ~6 lines (60% reduction), with ARIA compliance, automatic error display, and consistent UX.

---

## Quick Start

### 1. Basic Form with Auto Error Display

The toolkit works out of the box—no special form wrapper needed:

```typescript
import { Component, signal } from '@angular/core';
import {
  form,
  schema,
  required,
  email,
  FormField,
  submit,
} from '@angular/forms/signals';
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';
import { NgxSignalFormFieldComponent } from '@ngx-signal-forms/toolkit/form-field';

@Component({
  selector: 'app-contact',
  imports: [FormField, NgxSignalFormToolkit, NgxSignalFormFieldComponent],
  template: `
    <form (submit)="save($event)">
      <ngx-signal-form-field [formField]="contactForm.email" fieldName="email">
        <label for="email">Email</label>
        <input id="email" [formField]="contactForm.email" type="email" />
      </ngx-signal-form-field>
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
  );

  protected save(event: Event): void {
    event.preventDefault();
    submit(this.contactForm, async () => {
      console.log('Submit:', this.model());
    });
  }
}
```

**What you get automatically:**

- ✅ `novalidate` attribute (prevents browser validation bubbles)
- ✅ `aria-invalid` and `aria-describedby` for accessibility
- ✅ Error display after blur OR submit (default `'on-touch'` strategy)
- ✅ Proper `role="alert"` for screen readers

> **How it works:** Angular's `submit()` calls `markAllAsTouched()`, so errors appear after both blur AND submit—without any form wrapper!

### 2. Advanced: Show Errors Only After Submit

If you need errors to appear **only** after form submission (not on blur), add `[ngxSignalForm]`:

```typescript
@Component({
  template: `
    <!-- [ngxSignalForm] provides submission context for 'on-submit' strategy -->
    <form [ngxSignalForm]="contactForm" [errorStrategy]="'on-submit'" (submit)="save($event)">
      <ngx-signal-form-field [formField]="contactForm.email" fieldName="email">
        <label for="email">Email</label>
        <input id="email" [formField]="contactForm.email" />
      </ngx-signal-form-field>
      <button type="submit">Send</button>
    </form>
  `,
})
```

**When to use `[ngxSignalForm]`:**

| Use Case                                 | Default Form | With `[ngxSignalForm]` |
| ---------------------------------------- | :----------: | :--------------------: |
| Errors on blur + submit (`'on-touch'`)   |      ✅      |           ✅           |
| Errors only after submit (`'on-submit'`) |      ❌      |           ✅           |
| Form-level `[errorStrategy]` override    |      ❌      |           ✅           |

**Most forms don't need `[ngxSignalForm]`**—the default `'on-touch'` strategy covers both blur and submit.

### 3. Outlined Layout (Material Design-ish)

Add the `outline` attribute for floating labels:

```html
<ngx-signal-form-field [formField]="form.email" outline>
  <label for="email">Email Address</label>
  <input
    id="email"
    type="email"
    [formField]="form.email"
    required
    placeholder="you@example.com"
  />
</ngx-signal-form-field>
```

**Set as default for all form fields:**

```typescript
provideNgxSignalFormsConfig({
  defaultFormFieldAppearance: 'outline',
});
```

**→ [Form field theming guide](./packages/toolkit/form-field/THEMING.md)**

---

## Use Cases

### Accessibility (ARIA)

Automatic `aria-invalid` and `aria-describedby` attributes on all form controls. Screen reader-friendly error announcements with proper live regions.

**→ [Auto-ARIA directive details](./packages/toolkit/README.md#ngxsignalformautoardirective)**

### Error Display Strategies

Control when validation errors appear:

| Strategy               | Shows Errors         | Requires `[ngxSignalForm]` |
| ---------------------- | -------------------- | :------------------------: |
| `'on-touch'` (default) | After blur or submit |           ❌ No            |
| `'immediate'`          | As user types        |           ❌ No            |
| `'on-submit'`          | Only after submit    |           ✅ Yes           |
| `'manual'`             | Programmatic control |           ❌ No            |

```typescript
// Per-field override (no form wrapper needed)
<ngx-signal-form-field [formField]="form.email" [strategy]="'immediate'">

// Per-form override (requires [ngxSignalForm] for 'on-submit' only)
<form [ngxSignalForm]="form" [errorStrategy]="'on-submit'">
```

**→ [Strategy configuration](./packages/toolkit/README.md#configuration)**

### CSS Status Classes

Sync CSS classes (`ng-invalid`, `is-invalid`, etc.) with your error display strategy—no more red borders while typing.

```typescript
import { ngxStatusClasses } from '@ngx-signal-forms/toolkit';

provideSignalFormsConfig({
  classes: ngxStatusClasses({
    strategy: 'on-touch',
    invalidClass: 'is-invalid',
  }),
});
```

**→ [Status classes guide](./packages/toolkit/README.md#automatic-status-classes)**

### Focus Management

Automatically focus the first invalid field after failed submission:

```typescript
import { focusFirstInvalid } from '@ngx-signal-forms/toolkit';

protected save(): void {
  if (this.userForm().invalid()) {
    focusFirstInvalid(this.userForm);
  }
}
```

**→ [Focus utilities](./packages/toolkit/README.md#focus-management)**

### Submission State Helpers

Pre-computed signals for common submission states:

```typescript
import { canSubmit, isSubmitting, hasSubmitted } from '@ngx-signal-forms/toolkit';

protected readonly canSubmit = canSubmit(this.userForm);
protected readonly isSubmitting = isSubmitting(this.userForm);
```

**→ [Submission helpers](./packages/toolkit/README.md#submission-state-helpers)**

### Character Count with Auto-Detection

Progressive color states with automatic limit detection from validators:

```html
<ngx-signal-form-field [formField]="form.bio" outline>
  <label for="bio">Bio</label>
  <textarea id="bio" [formField]="form.bio"></textarea>
  <ngx-signal-form-field-character-count [formField]="form.bio" />
</ngx-signal-form-field>
```

**→ [Character count component](./packages/toolkit/form-field/README.md#ngxsignalformfieldcharactercountcomponent)**

### Custom Error Messages & i18n

Centralized error message registry with i18n support:

```typescript
provideErrorMessages({
  required: 'This field is required',
  email: 'Please enter a valid email',
  minLength: (params) => `Minimum ${params.minLength} characters`,
});
```

**→ [Error message configuration](./packages/toolkit/README.md#error-message-configuration)**

### Warnings (Non-Blocking Validation)

Show warnings that don't prevent form submission:

```typescript
import { warningError } from '@ngx-signal-forms/toolkit';

validate(path.password, (ctx) => {
  if (ctx.value().length < 12) {
    return warningError('short-password', 'Consider 12+ characters');
  }
  return null;
});
```

**→ [Warnings documentation](./docs/WARNINGS_SUPPORT.md)**

---

## Package Structure

```typescript
// Primary entry point - Configuration
import { provideNgxSignalFormsConfig } from '@ngx-signal-forms/toolkit';

// Core directives, components, utilities
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';

// Form field wrapper components
import { NgxSignalFormFieldComponent } from '@ngx-signal-forms/toolkit/form-field';
```

**→ [Complete API reference](./packages/toolkit/README.md#api)**

---

## Documentation

| Document                                                             | Description                                                 |
| -------------------------------------------------------------------- | ----------------------------------------------------------- |
| **[Toolkit API Reference](./packages/toolkit/README.md)**            | Complete API documentation with all options and examples    |
| **[Form Field Components](./packages/toolkit/form-field/README.md)** | Form field wrapper, outlined layout, hints, character count |
| **[Theming Guide](./packages/toolkit/form-field/THEMING.md)**        | CSS custom properties, dark mode, brand customization       |
| **[Warnings Support](./docs/WARNINGS_SUPPORT.md)**                   | Non-blocking validation messages                            |
| **[Package Architecture](./docs/PACKAGE_ARCHITECTURE.md)**           | Library structure and design decisions                      |

---

## Browser Support

- Angular 21+ (Signal Forms API)
- All modern browsers with ES2022+ support
- TypeScript 5.8+

## Accessibility

This toolkit follows **WCAG 2.2 Level AA** guidelines:

- ✅ Automatic `aria-invalid` and `aria-describedby` attributes
- ✅ Proper `role="alert"` for errors (assertive live region)
- ✅ Proper `role="status"` for warnings (polite live region)
- ✅ Progressive error disclosure (on-touch strategy)
- ✅ Keyboard accessible
- ✅ Screen reader tested

---

## Acknowledgments

This library was inspired by excellent work from the Angular community:

- **[Angular Team](https://angular.dev)** - For the amazing Signal Forms API
- **[ngxtension](https://ngxtension.netlify.app/)** - For signal-based architecture patterns
- **[NgRx Toolkit](https://ngrx-toolkit.angulararchitects.io/)** - For reactive state management inspiration

## License

MIT © [ngx-signal-forms](https://github.com/ngx-signal-forms/ngx-signal-forms)
