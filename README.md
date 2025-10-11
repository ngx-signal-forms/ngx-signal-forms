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

Angular Signal Forms (introduced in v21) provides an excellent foundation for reactive forms with built-in validation and type safety. However, it doesn't include:

- ❌ Automatic ARIA attributes for accessibility
- ❌ Touch state management (you must add blur handlers to every field)
- ❌ Flexible error display strategies (when to show errors)
- ❌ Reusable form field components
- ❌ Form submission state tracking

**This toolkit fills those gaps** while maintaining 100% compatibility with Signal Forms' API.

## What Makes It Different?

### Comparison Matrix

| Feature                 | Signal Forms Alone                                         | With @ngx-signal-forms/toolkit                                |
| ----------------------- | ---------------------------------------------------------- | ------------------------------------------------------------- |
| **Form Creation**       | ✅ `form()`, `schema()`, validators                        | ✅ Same (no changes)                                          |
| **Validation**          | ✅ Built-in and custom validators                          | ✅ Same (no changes)                                          |
| **Field State**         | ✅ `touched()`, `dirty()`, `invalid()`, `errors()`         | ✅ Same (no changes)                                          |
| **ARIA Attributes**     | ❌ Manual `[attr.aria-invalid]`, `[attr.aria-describedby]` | ✅ Automatic via directive                                    |
| **Touch on Blur**       | ❌ Manual `(blur)="field().markAsTouched()"`               | ✅ Automatic via directive                                    |
| **Error Display Logic** | ❌ Manual `@if` conditions in every template               | ✅ Strategy-based (immediate/on-touch/on-submit/manual)       |
| **Submission Tracking** | ❌ No built-in `hasSubmitted` state                        | ✅ Automatic via form provider                                |
| **Error Components**    | ❌ Custom error rendering per component                    | ✅ Reusable `<ngx-signal-form-error>` component               |
| **Form Field Wrapper**  | ❌ Custom layout per component                             | ✅ Consistent `<ngx-signal-form-field>` wrapper               |
| **Form Busy State**     | ❌ Manual `aria-busy` management                           | ✅ Automatic during async validation/submission (coming soon) |
| **WCAG 2.2 Compliance** | ❌ Requires manual implementation                          | ✅ Built-in with proper ARIA roles and live regions           |
| **Code Reduction**      | —                                                          | **~50% less template code** for forms with validation         |

### Code Comparison

**Without Toolkit (Manual Implementation):**

```html
<form (submit)="save($event)">
  <label for="email">Email</label>
  <input id="email" [control]="userForm.email" (blur)="userForm.email().markAsTouched()" [attr.aria-invalid]="userForm.email().invalid() ? 'true' : null" [attr.aria-describedby]="userForm.email().invalid() && userForm.email().touched() ? 'email-error' : null" />
  @if (userForm.email().invalid() && (userForm.email().touched() || hasSubmitted())) {
  <span id="email-error" role="alert"> {{ userForm.email().errors()[0].message }} </span>
  }
  <button type="submit">Submit</button>
</form>
```

**With Toolkit (Automatic):**

```html
<form [ngxSignalFormProvider]="userForm" (submit)="save($event)">
  <ngx-signal-form-field [field]="userForm.email" fieldName="email">
    <label for="email">Email</label>
    <input id="email" [control]="userForm.email" />
  </ngx-signal-form-field>
  <button type="submit">Submit</button>
</form>
```

**Result:** ~15 lines → ~7 lines (53% reduction), with better accessibility and maintainability.

## Quick Start

### Step 1: Configure (Optional)

Set up global defaults for your application:

```typescript
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideNgxSignalFormsConfig } from '@ngx-signal-forms/toolkit';

export const appConfig: ApplicationConfig = {
  providers: [
    provideNgxSignalFormsConfig({
      autoAria: true, // Automatic ARIA attributes
      autoTouch: true, // Auto-touch on blur
      defaultErrorStrategy: 'on-touch', // When to show errors
    }),
  ],
};
```

> **Note:** All features work with sensible defaults even without configuration.

### Step 2: Basic Usage

Create a simple login form with automatic accessibility:

```typescript
import { Component, signal } from '@angular/core';
import { form, schema, required, email, minLength, Control } from '@angular/forms/signals';

@Component({
  selector: 'app-login',
  imports: [Control],
  template: `
    <form (submit)="onSubmit($event)">
      <label for="email">Email</label>
      <input id="email" type="email" [control]="loginForm.email" />

      <label for="password">Password</label>
      <input id="password" type="password" [control]="loginForm.password" />

      <button type="submit">Sign In</button>
    </form>
  `,
})
export class LoginComponent {
  protected readonly model = signal({ email: '', password: '' });

  protected readonly loginForm = form(
    this.model,
    schema((path) => {
      required(path.email, { message: 'Email is required' });
      email(path.email, { message: 'Invalid email format' });

      required(path.password, { message: 'Password is required' });
      minLength(path.password, 8, { message: 'Password must be at least 8 characters' });
    }),
  );

  protected onSubmit(event: Event) {
    event.preventDefault();
    if (this.loginForm().valid()) {
      console.log('Login:', this.model());
    }
  }
}
```

✅ **Automatic features included:**

- `aria-invalid="true"` when field is invalid and touched
- `aria-describedby` linking to error messages
- Touch state on blur

### Step 3: Add Error Display

Show validation errors with the error component:

```typescript
import { Component, signal } from '@angular/core';
import { form, schema, required, email, Control } from '@angular/forms/signals';
import { NgxSignalFormErrorComponent, NgxSignalFormProviderDirective } from '@ngx-signal-forms/toolkit/core';

@Component({
  selector: 'app-contact',
  imports: [Control, NgxSignalFormProviderDirective, NgxSignalFormErrorComponent],
  template: `
    <form [ngxSignalFormProvider]="contactForm" (submit)="onSubmit($event)">
      <div>
        <label for="email">Email</label>
        <input id="email" [control]="contactForm.email" />
        <ngx-signal-form-error [field]="contactForm.email" fieldName="email" [hasSubmitted]="contactForm.hasSubmitted" />
      </div>

      <button type="submit">Send Message</button>
    </form>
  `,
})
export class ContactComponent {
  protected readonly model = signal({ email: '' });

  protected readonly contactForm = form(
    this.model,
    schema((path) => {
      required(path.email, { message: 'Email is required' });
      email(path.email, { message: 'Please enter a valid email address' });
    }),
  );

  protected onSubmit(event: Event) {
    event.preventDefault();
    if (this.contactForm().valid()) {
      console.log('Contact form:', this.model());
    }
  }
}
```

### Step 4: Use Form Field Wrapper (Recommended)

Simplify your templates with the field wrapper component:

```typescript
import { Component, signal } from '@angular/core';
import { form, schema, required, email, minLength, Control } from '@angular/forms/signals';
import { NgxSignalFormFieldComponent } from '@ngx-signal-forms/toolkit/form-field';
import { NgxSignalFormProviderDirective } from '@ngx-signal-forms/toolkit/core';

@Component({
  selector: 'app-signup',
  imports: [Control, NgxSignalFormProviderDirective, NgxSignalFormFieldComponent],
  template: `
    <form [ngxSignalFormProvider]="signupForm" (submit)="onSubmit($event)">
      <ngx-signal-form-field [field]="signupForm.email" fieldName="email">
        <label for="email">Email</label>
        <input id="email" type="email" [control]="signupForm.email" />
      </ngx-signal-form-field>

      <ngx-signal-form-field [field]="signupForm.password" fieldName="password">
        <label for="password">Password</label>
        <input id="password" type="password" [control]="signupForm.password" />
      </ngx-signal-form-field>

      <ngx-signal-form-field [field]="signupForm.confirmPassword" fieldName="confirmPassword">
        <label for="confirmPassword">Confirm Password</label>
        <input id="confirmPassword" type="password" [control]="signupForm.confirmPassword" />
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

      required(path.confirmPassword, { message: 'Please confirm your password' });
    }),
  );

  protected onSubmit(event: Event) {
    event.preventDefault();
    if (this.signupForm().valid()) {
      console.log('Signup:', this.model());
    }
  }
}
```

## Error Display Strategies

Control when validation errors are shown to users:

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
<form [ngxSignalFormProvider]="form" [errorStrategy]="'immediate'">
  <!-- All fields use 'immediate' strategy -->
</form>
```

**Override per field:**

```html
<ngx-signal-form-field [field]="form.password" fieldName="password" [strategy]="'immediate'">
  <!-- This field uses 'immediate', others use form/global default -->
</ngx-signal-form-field>
```

## Core Features

### Auto-ARIA Directive

Automatically manages accessibility attributes without any configuration:

```html
<!-- Input automatically gets: -->
<!-- aria-invalid="true" when invalid and touched -->
<!-- aria-describedby="email-error" when error is shown -->
<input id="email" [control]="form.email" />
```

**Opt-out if needed:**

```html
<input [control]="form.custom" ngxSignalFormAutoAriaDisabled />
```

### Auto-Touch Directive

Automatically marks fields as touched on blur:

```html
<!-- On blur, form.email().markAsTouched() is called automatically -->
<input [control]="form.email" />
```

**Opt-out if needed:**

```html
<input [control]="form.manual" ngxSignalFormAutoTouchDisabled />
```

### Form Error Component

Display validation errors with proper ARIA attributes:

```html
<ngx-signal-form-error [field]="form.email" fieldName="email" [strategy]="'on-touch'" [hasSubmitted]="hasSubmitted" />
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
  <input id="username" [control]="form.username" />
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

Track form submission state and provide context:

```typescript
@Component({
  template: `
    <form [ngxSignalFormProvider]="myForm" (submit)="onSubmit($event)">
      <!-- Child components can access form context -->
    </form>
  `,
})
export class MyFormComponent {
  protected readonly myForm = form(...);

  protected onSubmit(event: Event) {
    event.preventDefault();
    if (this.myForm().valid()) {
      // Handle submission
    }
  }
}
```

## Package Structure

### Primary Entry Point

```typescript
import { provideNgxSignalFormsConfig } from '@ngx-signal-forms/toolkit';
import type { NgxSignalFormsConfig, ErrorDisplayStrategy } from '@ngx-signal-forms/toolkit';
```

### Secondary Entry Points

```typescript
// Core directives, components, utilities
import { NgxSignalFormProviderDirective, NgxSignalFormErrorComponent, NgxSignalFormAutoAriaDirective, NgxSignalFormAutoTouchDirective } from '@ngx-signal-forms/toolkit/core';

// Form field wrapper (optional)
import { NgxSignalFormFieldComponent } from '@ngx-signal-forms/toolkit/form-field';

// Testing utilities (optional)
import { createPlaceholderTestHelper } from '@ngx-signal-forms/toolkit/testing';
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
- **[NGxtension](https://ngxtension.netlify.app/)** - For demonstrating how to build high-quality Angular utilities and the signal-based architecture patterns
- **[Laurens Westenberg](https://github.com/laurenswesterberg)** - For the original inspiration and ideas around form field wrappers and error display patterns

## License

MIT © [ngx-signal-forms](https://github.com/ngx-signal-forms/ngx-signal-forms)

# @ngx-signal-forms/toolkit

> **Enhancement toolkit for Angular Signal Forms with automatic accessibility and progressive error disclosure**

[![npm version](https://img.shields.io/npm/v/@ngx-signal-forms/toolkit.svg)](https://www.npmjs.com/package/@ngx-signal-forms/toolkit)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Directives, components, and utilities that enhance Angular's Signal Forms with automatic accessibility features, flexible error display strategies, and reusable form field wrappers—all without modifying the core Signal Forms API.

## Why This Library?

Angular Signal Forms (introduced in v21) provides an excellent foundation for reactive forms with built-in validation and type safety. However, it doesn't include:

- ❌ Automatic ARIA attributes for accessibility
- ❌ Touch state management (you must add blur handlers to every field)
- ❌ Flexible error display strategies (when to show errors)
- ❌ Reusable form field components
- ❌ Form submission state tracking

**This toolkit fills those gaps** while maintaining 100% compatibility with Signal Forms' API.

## What Makes It Different?

### Comparison Matrix

| Feature                 | Signal Forms Alone                                         | With @ngx-signal-forms/toolkit                                |
| ----------------------- | ---------------------------------------------------------- | ------------------------------------------------------------- |
| **Form Creation**       | ✅ `form()`, `schema()`, validators                        | ✅ Same (no changes)                                          |
| **Validation**          | ✅ Built-in and custom validators                          | ✅ Same (no changes)                                          |
| **Field State**         | ✅ `touched()`, `dirty()`, `invalid()`, `errors()`         | ✅ Same (no changes)                                          |
| **ARIA Attributes**     | ❌ Manual `[attr.aria-invalid]`, `[attr.aria-describedby]` | ✅ Automatic via directive                                    |
| **Touch on Blur**       | ❌ Manual `(blur)="field().markAsTouched()"`               | ✅ Automatic via directive                                    |
| **Error Display Logic** | ❌ Manual `@if` conditions in every template               | ✅ Strategy-based (immediate/on-touch/on-submit/manual)       |
| **Submission Tracking** | ❌ No built-in `hasSubmitted` state                        | ✅ Automatic via form provider                                |
| **Error Components**    | ❌ Custom error rendering per component                    | ✅ Reusable `<ngx-signal-form-error>` component               |
| **Form Field Wrapper**  | ❌ Custom layout per component                             | ✅ Consistent `<ngx-signal-form-field>` wrapper               |
| **Form Busy State**     | ❌ Manual `aria-busy` management                           | ✅ Automatic during async validation/submission (coming soon) |
| **WCAG 2.2 Compliance** | ❌ Requires manual implementation                          | ✅ Built-in with proper ARIA roles and live regions           |
| **Code Reduction**      | —                                                          | **~50% less template code** for forms with validation         |

### Code Comparison

**Without Toolkit (Manual Implementation):**

```html
<form (submit)="save($event)">
  <label for="email">Email</label>
  <input id="email" [control]="userForm.email" (blur)="userForm.email().markAsTouched()" [attr.aria-invalid]="userForm.email().invalid() ? 'true' : null" [attr.aria-describedby]="userForm.email().invalid() && userForm.email().touched() ? 'email-error' : null" />
  @if (userForm.email().invalid() && (userForm.email().touched() || hasSubmitted())) {
  <span id="email-error" role="alert"> {{ userForm.email().errors()[0].message }} </span>
  }
  <button type="submit">Submit</button>
</form>
```

**With Toolkit (Automatic):**

```html
<form [ngxSignalFormProvider]="userForm" (submit)="save($event)">
  <ngx-signal-form-field [field]="userForm.email" fieldName="email">
    <label for="email">Email</label>
    <input id="email" [control]="userForm.email" />
  </ngx-signal-form-field>
  <button type="submit">Submit</button>
</form>
```

**Result:** ~15 lines → ~7 lines (53% reduction), with better accessibility and maintainability.

## Installation

```bash
npm install @ngx-signal-forms/toolkit
```

```bash
yarn add @ngx-signal-forms/toolkit
```

```bash
pnpm add @ngx-signal-forms/toolkit
```

## Quick Start

### Step 1: Configure (Optional)

Set up global defaults for your application:

```typescript
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideNgxSignalFormsConfig } from '@ngx-signal-forms/toolkit';

export const appConfig: ApplicationConfig = {
  providers: [
    provideNgxSignalFormsConfig({
      autoAria: true, // Automatic ARIA attributes
      autoTouch: true, // Auto-touch on blur
      defaultErrorStrategy: 'on-touch', // When to show errors
    }),
  ],
};
```

> **Note:** All features work with sensible defaults even without configuration.

### Step 2: Basic Usage

Create a simple login form with automatic accessibility:

```typescript
import { Component, signal } from '@angular/core';
import { form, schema, required, email, minLength, Control } from '@angular/forms/signals';

@Component({
  selector: 'app-login',
  imports: [Control],
  template: `
    <form (submit)="onSubmit($event)">
      <label for="email">Email</label>
      <input id="email" type="email" [control]="loginForm.email" />

      <label for="password">Password</label>
      <input id="password" type="password" [control]="loginForm.password" />

      <button type="submit">Sign In</button>
    </form>
  `,
})
export class LoginComponent {
  protected readonly model = signal({ email: '', password: '' });

  protected readonly loginForm = form(
    this.model,
    schema((path) => {
      required(path.email, { message: 'Email is required' });
      email(path.email, { message: 'Invalid email format' });

      required(path.password, { message: 'Password is required' });
      minLength(path.password, 8, { message: 'Password must be at least 8 characters' });
    }),
  );

  protected onSubmit(event: Event) {
    event.preventDefault();
    if (this.loginForm().valid()) {
      console.log('Login:', this.model());
    }
  }
}
```

✅ **Automatic features included:**

- `aria-invalid="true"` when field is invalid and touched
- `aria-describedby` linking to error messages
- Touch state on blur

### Step 3: Add Error Display

Show validation errors with the error component:

```typescript
import { Component, signal } from '@angular/core';
import { form, schema, required, email, Control } from '@angular/forms/signals';
import { NgxSignalFormErrorComponent, NgxSignalFormProviderDirective } from '@ngx-signal-forms/toolkit/core';

@Component({
  selector: 'app-contact',
  imports: [Control, NgxSignalFormProviderDirective, NgxSignalFormErrorComponent],
  template: `
    <form [ngxSignalFormProvider]="contactForm" (submit)="onSubmit($event)">
      <div>
        <label for="email">Email</label>
        <input id="email" [control]="contactForm.email" />
        <ngx-signal-form-error [field]="contactForm.email" fieldName="email" [hasSubmitted]="contactForm.hasSubmitted" />
      </div>

      <button type="submit">Send Message</button>
    </form>
  `,
})
export class ContactComponent {
  protected readonly model = signal({ email: '' });

  protected readonly contactForm = form(
    this.model,
    schema((path) => {
      required(path.email, { message: 'Email is required' });
      email(path.email, { message: 'Please enter a valid email address' });
    }),
  );

  protected onSubmit(event: Event) {
    event.preventDefault();
    if (this.contactForm().valid()) {
      console.log('Contact form:', this.model());
    }
  }
}
```

### Step 4: Use Form Field Wrapper (Recommended)

Simplify your templates with the field wrapper component:

```typescript
import { Component, signal } from '@angular/core';
import { form, schema, required, email, minLength, Control } from '@angular/forms/signals';
import { NgxSignalFormFieldComponent } from '@ngx-signal-forms/toolkit/form-field';
import { NgxSignalFormProviderDirective } from '@ngx-signal-forms/toolkit/core';

@Component({
  selector: 'app-signup',
  imports: [Control, NgxSignalFormProviderDirective, NgxSignalFormFieldComponent],
  template: `
    <form [ngxSignalFormProvider]="signupForm" (submit)="onSubmit($event)">
      <ngx-signal-form-field [field]="signupForm.email" fieldName="email">
        <label for="email">Email</label>
        <input id="email" type="email" [control]="signupForm.email" />
      </ngx-signal-form-field>

      <ngx-signal-form-field [field]="signupForm.password" fieldName="password">
        <label for="password">Password</label>
        <input id="password" type="password" [control]="signupForm.password" />
      </ngx-signal-form-field>

      <ngx-signal-form-field [field]="signupForm.confirmPassword" fieldName="confirmPassword">
        <label for="confirmPassword">Confirm Password</label>
        <input id="confirmPassword" type="password" [control]="signupForm.confirmPassword" />
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

      required(path.confirmPassword, { message: 'Please confirm your password' });
    }),
  );

  protected onSubmit(event: Event) {
    event.preventDefault();
    if (this.signupForm().valid()) {
      console.log('Signup:', this.model());
    }
  }
}
```

## Error Display Strategies

Control when validation errors are shown to users:

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
<form [ngxSignalFormProvider]="form" [errorStrategy]="'immediate'">
  <!-- All fields use 'immediate' strategy -->
</form>
```

**Override per field:**

```html
<ngx-signal-form-field [field]="form.password" fieldName="password" [strategy]="'immediate'">
  <!-- This field uses 'immediate', others use form/global default -->
</ngx-signal-form-field>
```

## Core Features

### Auto-ARIA Directive

Automatically manages accessibility attributes without any configuration:

```html
<!-- Input automatically gets: -->
<!-- aria-invalid="true" when invalid and touched -->
<!-- aria-describedby="email-error" when error is shown -->
<input id="email" [control]="form.email" />
```

**Opt-out if needed:**

```html
<input [control]="form.custom" ngxSignalFormAutoAriaDisabled />
```

### Auto-Touch Directive

Automatically marks fields as touched on blur:

```html
<!-- On blur, form.email().markAsTouched() is called automatically -->
<input [control]="form.email" />
```

**Opt-out if needed:**

```html
<input [control]="form.manual" ngxSignalFormAutoTouchDisabled />
```

### Form Error Component

Display validation errors with proper ARIA attributes:

```html
<ngx-signal-form-error [field]="form.email" fieldName="email" [strategy]="'on-touch'" [hasSubmitted]="hasSubmitted" />
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
  <input id="username" [control]="form.username" />
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

Track form submission state and provide context:

```typescript
@Component({
  template: `
    <form [ngxSignalFormProvider]="myForm" (submit)="onSubmit($event)">
      <!-- Child components can access form context -->
    </form>
  `,
})
export class MyFormComponent {
  protected readonly myForm = form(...);

  protected onSubmit(event: Event) {
    event.preventDefault();
    if (this.myForm().valid()) {
      // Handle submission
    }
  }
}
```

## Package Structure

### Primary Entry Point

```typescript
import { provideNgxSignalFormsConfig } from '@ngx-signal-forms/toolkit';
import type { NgxSignalFormsConfig, ErrorDisplayStrategy } from '@ngx-signal-forms/toolkit';
```

### Secondary Entry Points

```typescript
// Core directives, components, utilities
import { NgxSignalFormProviderDirective, NgxSignalFormErrorComponent, NgxSignalFormAutoAriaDirective, NgxSignalFormAutoTouchDirective } from '@ngx-signal-forms/toolkit/core';

// Form field wrapper (optional)
import { NgxSignalFormFieldComponent } from '@ngx-signal-forms/toolkit/form-field';

// Testing utilities (optional)
import { createPlaceholderTestHelper } from '@ngx-signal-forms/toolkit/testing';
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
