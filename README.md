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

## Why This Library?

Angular Signal Forms (introduced in v21) provides an excellent foundation for reactive forms with built-in validation, type safety, automatic touch tracking via the `[field]` directive, and submission state management via `submittedStatus()`.

**@ngx-signal-forms/toolkit builds on this foundation by adding:**

- ✅ **Automatic ARIA attributes** for accessibility (`aria-invalid`, `aria-describedby`)
- ✅ **Flexible error display strategies** (immediate, on-touch, on-submit, manual)
- ✅ **Reusable form field components** with consistent layouts
- ✅ **Warning support** (non-blocking validation messages)
- ✅ **DI-based configuration** for centralized form behavior

All enhancements maintain 100% compatibility with Signal Forms' API—no breaking changes, just added capabilities you can opt into.

## What Makes It Different?

### Comparison Matrix

| Feature                    | Signal Forms Alone                                         | With @ngx-signal-forms/toolkit                                                 |
| -------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------ |
| **Form Creation**          | ✅ `form()`, `schema()`, validators                        | ✅ Same (no changes)                                                           |
| **Validation**             | ✅ Built-in and custom validators                          | ✅ Same + warning support (non-blocking)                                       |
| **Field State**            | ✅ `touched()`, `dirty()`, `invalid()`, `errors()`         | ✅ Same (no changes)                                                           |
| **Touch on Blur**          | ✅ Automatic via `[field]` directive                       | ✅ Enhanced with opt-out capability                                            |
| **Submission Tracking**    | ✅ Built-in `submittedStatus()` signal                     | ✅ Enhanced with DI-based context + helper utilities                           |
| **Submission Helpers**     | ❌ Manual `form().valid() && !form().submitting()`         | ✅ `canSubmit()`, `isSubmitting()`, `hasSubmitted()` computed signals          |
| **Focus Management**       | ❌ Manual field focus after failed submission              | ✅ `focusFirstInvalid()` utility for accessibility                             |
| **Character Count**        | ❌ Manual tracking or duplicate limit configuration        | ✅ Auto-detects from validation rules + progressive color states               |
| **ARIA Attributes**        | ❌ Manual `[attr.aria-invalid]`, `[attr.aria-describedby]` | ✅ Automatic via directive                                                     |
| **Error Display Logic**    | ❌ Manual `@if` conditions in every template               | ✅ Strategy-based (immediate/on-touch/on-submit/manual) + field-level override |
| **Error Components**       | ❌ Custom error rendering per component                    | ✅ Reusable `<ngx-signal-form-error>` component                                |
| **Form Wrapper**           | ❌ Manual form setup and context                           | ✅ DI-based context via `[ngxSignalForm]` directive                            |
| **HTML5 Validation**       | ❌ Manual `novalidate` on every form                       | ✅ Automatic `novalidate` via `[ngxSignalForm]`                                |
| **Form Field Wrapper**     | ❌ Custom layout per component                             | ✅ Consistent `<ngx-signal-form-field>` wrapper                                |
| **Material Design Layout** | ❌ Custom CSS for outlined inputs                          | ✅ Built-in `outline` directive with floating labels                           |
| **Form Busy State**        | ❌ Manual `aria-busy` management                           | ✅ Automatic during async validation/submission (coming soon)                  |
| **WCAG 2.2 Compliance**    | ❌ Requires manual implementation                          | ✅ Built-in with proper ARIA roles and live regions                            |
| **Code Reduction**         | —                                                          | **~50% less template code** for forms with validation                          |

### Code Comparison

**Without Toolkit (Manual ARIA and Error Logic):**

```html
<form (ngSubmit)="save()">
  <label for="email">Email</label>
  <input
    id="email"
    [field]="userForm.email"
    [attr.aria-invalid]="userForm.email().invalid() ? 'true' : null"
    [attr.aria-describedby]="userForm.email().invalid() && userForm.email().touched() ? 'email-error' : null"
  />
  @if (userForm.email().invalid() && (userForm.email().touched() ||
  userForm().submittedStatus() === 'submitted')) {
  <span id="email-error" role="alert">
    {{ userForm.email().errors()[0].message }}
  </span>
  }
  <button type="submit">Submit</button>
</form>
```

**With Toolkit (Automatic ARIA + Error Strategies):**

```html
<form [ngxSignalForm]="userForm" (ngSubmit)="save()">
  <ngx-signal-form-field [field]="userForm.email" fieldName="email">
    <label for="email">Email</label>
    <input id="email" [field]="userForm.email" />
    <!-- Automatic ARIA, touch handling, and error display with strategy -->
  </ngx-signal-form-field>
  <button type="submit">Submit</button>
</form>
```

**Result:** ~15 lines → ~7 lines (53% reduction), with ARIA compliance, error display strategies, and consistent UX.

## Quick Start

### The Simplest Example

Just install and start using—automatic ARIA attributes and form enhancements work out of the box:

```typescript
import { Component, signal } from '@angular/core';
import { form, schema, required, email, Field } from '@angular/forms/signals';
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit/core';

@Component({
  selector: 'ngx-contact',
  imports: [Field, NgxSignalFormToolkit],
  template: `
    <form [ngxSignalForm]="contactForm" (ngSubmit)="save()">
      <label for="email">Email</label>
      <input id="email" [field]="contactForm.email" type="email" />
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

  protected save(): void {
    if (this.contactForm().valid()) {
      console.log('Submit:', this.model());
    }
  }
}
```

✅ **What you get automatically (no configuration needed):**

- `aria-invalid="true"` when field is invalid and touched
- `aria-describedby` linking to error messages
- Touch state management on blur
- `novalidate` attribute automatically added to prevent browser validation UI conflicts
- Submission state tracking via DI context

### Form Validation: The `novalidate` Attribute

**With the toolkit's `[ngxSignalForm]` directive:** The `novalidate` attribute is **automatically added** for you—no manual attribute needed!

```html
<!-- ✅ CORRECT - novalidate is automatically added by the directive -->
<form [ngxSignalForm]="myForm" (ngSubmit)="save()">
  <input [field]="myForm.email" type="email" />
  <button type="submit">Submit</button>
</form>
```

**Without the toolkit (bare Signal Forms):** You must manually add `novalidate` to prevent browser validation conflicts:

```html
<!-- ✅ CORRECT for bare Signal Forms - Manual novalidate required -->
<form (ngSubmit)="save()" novalidate>
  <input [field]="myForm.email" type="email" />
  <button type="submit">Submit</button>
</form>

<!-- ❌ WRONG - Browser validation conflicts with Angular validation display -->
<form (ngSubmit)="save()">
  <input [field]="myForm.email" type="email" />
  <button type="submit">Submit</button>
</form>
```

**Why is `novalidate` important?**

Unlike Angular's Reactive Forms and Template-driven Forms (which auto-add `novalidate`), bare Signal Forms doesn't automatically disable native HTML5 form validation. Without it:

1. **Conflicting UX**: Browser validation bubbles appear alongside Angular error messages
2. **Duplicate Errors**: Users see double error feedback for the same field
3. **Styling Conflicts**: Browser's default error styling overrides your custom styles
4. **Accessibility**: Screen readers may announce duplicate error messages

**The toolkit solves this:** The `[ngxSignalForm]` directive automatically applies `novalidate`, so you don't have to remember!

### Add Error Display (Optional)

Want to show validation errors to users? Add the error component:

```typescript
import { Component, signal } from '@angular/core';
import { form, schema, required, email, Field } from '@angular/forms/signals';
import { NgxSignalFormErrorComponent } from '@ngx-signal-forms/toolkit/core';

@Component({
  selector: 'ngx-contact',
  imports: [Field, NgxSignalFormErrorComponent],
  template: `
    <form (ngSubmit)="save()" novalidate>
      <label for="email">Email</label>
      <input id="email" [field]="contactForm.email" />
      <ngx-signal-form-error
        [field]="contactForm.email"
        fieldName="email"
        [submittedStatus]="submittedStatus"
      />

      <button type="submit">Send</button>
    </form>
  `,
})
export class ContactComponent {
  protected readonly model = signal({ email: '' });
  protected readonly submittedStatus = signal<SubmittedStatus>('unsubmitted');

  protected readonly contactForm = form(
    this.model,
    schema((path) => {
      required(path.email, { message: 'Email is required' });
      email(path.email, { message: 'Invalid email format' });
    }),
  );

  protected save(): void {
    this.submittedStatus.set('submitted');

    if (this.contactForm().valid()) {
      console.log('Valid!', this.model());
    }
  }
}
```

> **Note:** This example shows using toolkit components without the `[ngxSignalForm]` directive, so you must manually add `novalidate` to the form element.

### Track Submission State Automatically (Optional)

Don't want to manage `submittedStatus` manually? Use the form provider:

```typescript
import { Component, signal } from '@angular/core';
import { form, schema, required, email, Field } from '@angular/forms/signals';
import {
  NgxSignalFormErrorComponent,
  ngxSignalFormDirective,
} from '@ngx-signal-forms/toolkit/core';

@Component({
  selector: 'ngx-contact',
  imports: [Field, ngxSignalFormDirective, NgxSignalFormErrorComponent],
  template: `
    <form [ngxSignalForm]="contactForm" (ngSubmit)="save()">
      <label for="email">Email</label>
      <input id="email" [field]="contactForm.email" />
      <ngx-signal-form-error [field]="contactForm.email" fieldName="email" />

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

  protected save(): void {
    if (this.contactForm().valid()) {
      console.log('Valid!', this.model());
    }
  }
}
```

> **Note:** The form provider automatically exposes Angular Signal Forms' built-in `submittedStatus` signal, so you don't need to manually track submission state anymore.

### Use Form Field Wrapper (Recommended for Production)

Simplify your templates with the field wrapper component:

```typescript
import { Component, signal } from '@angular/core';
import {
  form,
  schema,
  required,
  email,
  minLength,
  Field,
} from '@angular/forms/signals';
import { NgxSignalFormFieldComponent } from '@ngx-signal-forms/toolkit/form-field';
import { ngxSignalFormDirective } from '@ngx-signal-forms/toolkit/core';

@Component({
  selector: 'ngx-signup',
  imports: [Field, ngxSignalFormDirective, NgxSignalFormFieldComponent],
  template: `
    <form [ngxSignalForm]="signupForm" (ngSubmit)="save()">
      <ngx-signal-form-field [field]="signupForm.email" fieldName="email">
        <label for="email">Email</label>
        <input id="email" type="email" [field]="signupForm.email" />
      </ngx-signal-form-field>

      <ngx-signal-form-field [field]="signupForm.password" fieldName="password">
        <label for="password">Password</label>
        <input id="password" type="password" [field]="signupForm.password" />
      </ngx-signal-form-field>

      <ngx-signal-form-field
        [field]="signupForm.confirmPassword"
        fieldName="confirmPassword"
      >
        <label for="confirmPassword">Confirm Password</label>
        <input
          id="confirmPassword"
          type="password"
          [field]="signupForm.confirmPassword"
        />
      </ngx-signal-form-field>

      <button type="submit">Create Account</button>
    </form>
  `,
})
export class SignupComponent {
  protected readonly model = signal({
    email: '',
    password: '',
    confirmPassword: '',
  });

  protected readonly signupForm = form(
    this.model,
    schema((path) => {
      required(path.email, { message: 'Email is required' });
      email(path.email, { message: 'Invalid email format' });

      required(path.password, { message: 'Password is required' });
      minLength(path.password, 8, { message: 'Minimum 8 characters required' });

      required(path.confirmPassword, {
        message: 'Please confirm your password',
      });
    }),
  );

  protected save(): void {
    if (this.signupForm().valid()) {
      console.log('Signup:', this.model());
    }
  }
}
```

## High-Value Utilities

The toolkit provides convenience utilities that enhance Angular Signal Forms' default functionality:

### Focus Management

Automatically focus the first invalid field after failed submission:

```typescript
import { focusFirstInvalid } from '@ngx-signal-forms/toolkit/core';

protected save(): void {
  if (this.userForm().invalid()) {
    focusFirstInvalid(this.userForm);
  }
}
```

**Enhancement:**

- ✅ Angular Signal Forms: Provides field state signals but no focus utilities
- ✅ Toolkit: Automatic focus improves UX and meets WCAG 2.2 accessibility guidelines

### Submission State Helpers

Pre-computed signals for common submission states:

```typescript
import {
  canSubmit,
  isSubmitting,
  hasSubmitted,
} from '@ngx-signal-forms/toolkit/core';

@Component({
  template: `
    <button type="submit" [disabled]="!canSubmit()">
      @if (isSubmitting()) {
        <span>Saving...</span>
      } @else {
        <span>Submit</span>
      }
    </button>
  `,
})
export class MyFormComponent {
  protected readonly canSubmit = canSubmit(this.userForm);
  protected readonly isSubmitting = isSubmitting(this.userForm);
}
```

**Enhancement:**

- ✅ Angular Signal Forms: Provides `valid()`, `submitting()`, `submittedStatus()` signals
- ✅ Toolkit: Reduces template boilerplate with pre-computed helper signals
- ✅ Consistent naming convention
- ✅ Type-safe with automatic inference

**Available Helpers:**

```typescript
// Combines valid() && !submitting()
canSubmit(formTree: FieldTree<unknown>): Signal<boolean>

// Checks if form is currently submitting
isSubmitting(formTree: FieldTree<unknown>): Signal<boolean>

// Checks if form has completed at least one submission
hasSubmitted(formTree: FieldTree<unknown>): Signal<boolean>
```

---

## Form Field Components

The toolkit includes a complete form field component system with Material Design outlined layout, **automatic character count detection**, and helper text.

### NgxSignalFormFieldComponent

Reusable form field wrapper with automatic error display:

```html
<ngx-signal-form-field [field]="form.email" fieldName="email">
  <label for="email">Email</label>
  <input id="email" [field]="form.email" />
</ngx-signal-form-field>
```

### Outlined Layout (Material Design)

Add the `outline` directive for Material Design outlined inputs with floating labels:

```html
<ngx-signal-form-field [field]="form.email" outline>
  <label for="email">Email Address</label>
  <input
    id="email"
    type="email"
    [field]="form.email"
    required
    placeholder="you@example.com"
  />
</ngx-signal-form-field>
```

**Features:**

- CSS `:has()` selector-based state detection (focus, required, disabled)
- Customizable required marker (default: `' *'`)
- 60+ CSS custom properties for theming
- 95%+ browser support (Chrome 105+, Firefox 121+, Safari 15.4+, Edge 105+)

### Character Count Component

Display character count with **automatic limit detection** and progressive color states:

**Auto-Detection (Recommended - DRY Principle):**

```typescript
// In form schema - define validation rule once
maxLength(path.bio, 500);
```

```html
<!-- Character count automatically detects limit -->
<ngx-signal-form-field [field]="form.bio" outline>
  <label for="bio">Bio</label>
  <textarea id="bio" [field]="form.bio"></textarea>
  <ngx-signal-form-field-character-count [field]="form.bio" />
</ngx-signal-form-field>
```

**Enhancement over Angular Signal Forms:**

- ✅ Angular Signal Forms: `maxLength()` validator adds HTML `maxlength` attribute that silently truncates text on paste
- ✅ Toolkit: Auto-detects limit from validation rules (single source of truth)
- ✅ Visual feedback prevents paste truncation surprises
- ✅ Progressive color guidance (ok → warning → danger)
- ✅ Manual override available when needed

**Color states:**

- **ok** (0-80%): Gray
- **warning** (80-95%): Amber
- **danger** (95-100%): Red
- **exceeded** (>100%): Dark red, bold

### Hint Component

Display helper text for form fields:

```html
<ngx-signal-form-field [field]="form.phone" outline>
  <label for="phone">Phone Number</label>
  <input id="phone" [field]="form.phone" />
  <ngx-signal-form-field-hint>Format: 123-456-7890</ngx-signal-form-field-hint>
</ngx-signal-form-field>
```

### Complete Documentation

For detailed API reference, CSS custom properties, migration guides, and complete examples, see:

**[📖 Form Field Components Documentation](./packages/toolkit/form-field/README.md)**

---

## Error Display Strategies

Field when validation errors are shown to users:

| Strategy    | When Errors Are Shown                            | Best For                         |
| ----------- | ------------------------------------------------ | -------------------------------- |
| `immediate` | As soon as the field becomes invalid             | Real-time validation (passwords) |
| `on-touch`  | After blur or form submission (WCAG recommended) | Most forms (default)             |
| `on-submit` | Only after the user tries to submit              | Multi-step forms                 |
| `manual`    | Never automatically (developer-controlled)       | Custom workflows                 |

**Set strategy globally:**

```typescript
provideNgxSignalFormsConfig({
  defaultErrorStrategy: 'on-touch',
});
```

**Override per form:**

```html
<form [ngxSignalForm]="form" [errorStrategy]="'immediate'">
  <!-- All fields use 'immediate' strategy -->
</form>
```

**Override per field:**

```html
<ngx-signal-form-field
  [field]="form.password"
  fieldName="password"
  [strategy]="'immediate'"
>
  <!-- This field uses 'immediate', others use form/global default -->
</ngx-signal-form-field>
```

## Core Features

### Auto-ARIA Directive

Automatically manages accessibility attributes for all `[field]` elements:

```html
<!-- Input automatically gets: -->
<!-- aria-invalid="true" when invalid and touched -->
<!-- aria-describedby="email-error" when error is shown -->
<input id="email" [field]="form.email" />
```

> **Important:** The directive must be imported to activate (via `NgxSignalFormToolkit` bundle or individual import). It has an automatic selector (`input[field]`, `textarea[field]`, `select[field]`) but still requires being in your component's `imports` array.

```typescript
// Option 1: Bundle import (recommended)
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit/core';
@Component({
  imports: [Field, NgxSignalFormToolkit], // ✅ Auto-ARIA activated!
})

// Option 2: Individual import
import { NgxSignalFormAutoAriaDirective } from '@ngx-signal-forms/toolkit/core';
@Component({
  imports: [Field, NgxSignalFormAutoAriaDirective], // ✅ Auto-ARIA activated!
})
```

**Opt-out if needed:**

```html
<input [field]="form.custom" ngxSignalFormAutoAriaDisabled />
```

### Auto-Touch Directive

Automatically marks fields as touched on blur:

```html
<!-- On blur, form.email().markAsTouched() is called automatically -->
<input [field]="form.email" />
```

**Opt-out if needed:**

```html
<input [field]="form.manual" ngxSignalFormAutoTouchDisabled />
```

### Form Error Component

Display validation errors with proper ARIA attributes:

```html
<ngx-signal-form-error
  [field]="form.email"
  fieldName="email"
  [strategy]="'on-touch'"
  [submittedStatus]="submittedStatus"
/>
```

**Features:**

- Automatic `role="alert"` for errors (assertive announcement)
- Automatic `role="status"` for warnings (polite announcement)
- Auto-generated IDs for `aria-describedby` linking
- Support for multiple error messages

### Form Field Component

Consistent layout with automatic error display:

```html
<ngx-signal-form-field [field]="form.username" fieldName="username">
  <label for="username">Username</label>
  <input id="username" [field]="form.username" />
</ngx-signal-form-field>
```

**Customize with CSS variables:**

```css
:root {
  --ngx-signal-form-field-gap: 0.5rem;
  --ngx-signal-form-field-margin: 1rem;
  --ngx-signal-form-error-color: #dc2626;
  --ngx-signal-form-error-font-size: 0.875rem;
}
```

### Form Provider Directive

Provides form context for error display strategies and integrates with Angular's built-in submission tracking:

```typescript
@Component({
  template: `
    <form [ngxSignalForm]="myForm" [errorStrategy]="'on-touch'" (ngSubmit)="save()">
      <!-- Child components automatically inherit error strategy -->
      <!-- Toolkit integrates with Angular's built-in submittedStatus -->
    </form>
  `,
})
export class MyFormComponent {
  protected readonly myForm = form(...);

  protected save(): void {
    if (this.myForm().valid()) {
      // Handle submission
      // Access Angular's built-in submission state:
      // this.myForm().submittedStatus() → 'submitted'
    }
  }
}
```

**Note:** The directive provides DI-based context for error display strategies and integrates with Angular Signal Forms' built-in `submittedStatus()` signal.

## Package Structure

### Primary Entry Point

```typescript
import { provideNgxSignalFormsConfig } from '@ngx-signal-forms/toolkit';
import type {
  NgxSignalFormsConfig,
  ErrorDisplayStrategy,
} from '@ngx-signal-forms/toolkit';
```

### Secondary Entry Points

```typescript
// Core directives, components, utilities
import {
  ngxSignalFormDirective,
  NgxSignalFormErrorComponent,
  NgxSignalFormAutoAriaDirective,
  NgxSignalFormAutoTouchDirective,
} from '@ngx-signal-forms/toolkit/core';

// Form field wrapper (optional)
import { NgxSignalFormFieldComponent } from '@ngx-signal-forms/toolkit/form-field';
```

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
- ✅ Keyboard accessible (no custom focus management needed)
- ✅ Screen reader tested

## Acknowledgments

This library was inspired by excellent work from the Angular community:

- **[Angular Team](https://angular.dev)** - For the amazing Signal Forms API and continued innovation in the Angular ecosystem
- **[ngxtension](https://ngxtension.netlify.app/)** - For demonstrating how to build high-quality Angular utilities and the signal-based architecture patterns
- **[Laurens Westenberg](https://github.com/laurenswesterberg)** - For the original inspiration and ideas around form field wrappers and error display patterns

## License

MIT © [ngx-signal-forms](https://github.com/ngx-signal-forms/ngx-signal-forms)
