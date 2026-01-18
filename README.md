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

Angular Signal Forms (introduced in v21) provides an excellent foundation for reactive forms with built-in validation, type safety, automatic touch tracking via the `[formField]` directive, and submission state management via `submittedStatus()`.

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
| **Touch on Blur**          | ✅ Automatic via `[formField]` directive                   | ✅ Enhanced with opt-out capability                                            |
| **Submission Tracking**    | ✅ Built-in `submittedStatus()` signal                     | ✅ Enhanced with DI-based context + helper utilities                           |
| **Submission Helpers**     | ❌ Manual `form().valid() && !form().submitting()`         | ✅ `canSubmit()`, `isSubmitting()`, `hasSubmitted()` computed signals          |
| **Focus Management**       | ❌ Manual field focus after failed submission              | ✅ `focusFirstInvalid()` utility for accessibility                             |
| **Character Count**        | ❌ Manual tracking or duplicate limit configuration        | ✅ Auto-detects from validation rules + progressive color states               |
| **ARIA Attributes**        | ❌ Manual `[attr.aria-invalid]`, `[attr.aria-describedby]` | ✅ Automatic via directive                                                     |
| **Error Display Logic**    | ❌ Manual `@if` conditions in every template               | ✅ Strategy-based (immediate/on-touch/on-submit/manual) + field-level override |
| **Error Components**       | ❌ Custom error rendering per component                    | ✅ Reusable `<ngx-signal-form-error>` component                                |
| **Form Wrapper**           | ❌ Manual form setup and context                           | ✅ DI-based context via `[ngxSignalForm]` directive                            |
| **HTML5 Validation**       | ❌ Manual `novalidate` on every form                       | ✅ Automatic `novalidate` via `[ngxSignalForm]`                                |
| **CSS Status Classes**     | ⚠️ Manual via `provideSignalFormsConfig` (21.1+)           | ✅ `ngxStatusClasses()` syncs with error display strategy                      |
| **Form Field Wrapper**     | ❌ Custom layout per component                             | ✅ Consistent `<ngx-signal-form-field>` wrapper                                |
| **Material Design Layout** | ❌ Custom CSS for outlined inputs                          | ✅ Built-in `outline` directive with floating labels                           |
| **Form Busy State**        | ❌ Manual `aria-busy` management                           | ✅ Automatic during async validation/submission (coming soon)                  |
| **WCAG 2.2 Compliance**    | ❌ Requires manual implementation                          | ✅ Built-in with proper ARIA roles and live regions                            |
| **Code Reduction**         | —                                                          | **~50% less template code** for forms with validation                          |

### Code Comparison

**Without Toolkit (Manual ARIA and Error Logic):**

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
<form [ngxSignalForm]="userForm" (submit)="save($event)">
  <ngx-signal-form-field [formField]="userForm.email" fieldName="email">
    <label for="email">Email</label>
    <input id="email" [formField]="userForm.email" />
    <!-- Automatic ARIA, touch handling, and error display with strategy -->
  </ngx-signal-form-field>
  <button type="submit">Submit</button>
</form>
```

**Result:** ~15 lines → ~7 lines (53% reduction), with ARIA compliance, error display strategies, and consistent UX.

## Quick Start

### The Simplest Example

Just install and start using—automatic ARIA attributes and form enhancements work out of the box on standard HTML inputs (no wrapper component required):

```typescript
import { Component, signal } from '@angular/core';
import { form, schema, required, email, Field } from '@angular/forms/signals';
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit/core';

@Component({
  selector: 'ngx-contact',
  imports: [FormField, NgxSignalFormToolkit],
  template: `
    <form [ngxSignalForm]="contactForm" (submit)="save($event)">
      <label for="email">Email</label>
      <input id="email" [formField]="contactForm.email" type="email" />
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
<form [ngxSignalForm]="myForm" (submit)="save($event)">
  <input [formField]="myForm.email" type="email" />
  <button type="submit">Submit</button>
</form>
```

**Without the toolkit (bare Signal Forms):** You must manually add `novalidate` to prevent browser validation conflicts:

```html
<!-- ✅ CORRECT for bare Signal Forms - Manual novalidate required -->
<form (submit)="save($event)" novalidate>
  <input [formField]="myForm.email" type="email" />
  <button type="submit">Submit</button>
</form>

<!-- ❌ WRONG - Missing novalidate AND preventDefault -->
<form (submit)="save()">
  <input [formField]="myForm.email" type="email" />
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
  imports: [FormField, NgxSignalFormErrorComponent],
  template: `
    <form (submit)="save($event)" novalidate>
      <label for="email">Email</label>
      <input id="email" [formField]="contactForm.email" />
      <ngx-signal-form-error
        [formField]="contactForm.email"
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

  protected save(event: Event): void {
    event.preventDefault();
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
  imports: [FormField, ngxSignalFormDirective, NgxSignalFormErrorComponent],
  template: `
    <form [ngxSignalForm]="contactForm" (submit)="save($event)">
      <label for="email">Email</label>
      <input id="email" [formField]="contactForm.email" />
      <ngx-signal-form-error
        [formField]="contactForm.email"
        fieldName="email"
      />

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
  FormField,
} from '@angular/forms/signals';
import { NgxSignalFormFieldComponent } from '@ngx-signal-forms/toolkit/form-field';
import { ngxSignalFormDirective } from '@ngx-signal-forms/toolkit/core';

@Component({
  selector: 'ngx-signup',
  imports: [FormField, ngxSignalFormDirective, NgxSignalFormFieldComponent],
  template: `
    <form [ngxSignalForm]="signupForm" (submit)="save($event)">
      <ngx-signal-form-field [formField]="signupForm.email" fieldName="email">
        <label for="email">Email</label>
        <input id="email" type="email" [formField]="signupForm.email" />
      </ngx-signal-form-field>

      <ngx-signal-form-field
        [formField]="signupForm.password"
        fieldName="password"
      >
        <label for="password">Password</label>
        <input
          id="password"
          type="password"
          [formField]="signupForm.password"
        />
      </ngx-signal-form-field>

      <ngx-signal-form-field
        [formField]="signupForm.confirmPassword"
        fieldName="confirmPassword"
      >
        <label for="confirmPassword">Confirm Password</label>
        <input
          id="confirmPassword"
          type="password"
          [formField]="signupForm.confirmPassword"
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

  protected save(event: Event): void {
    event.preventDefault();
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
<ngx-signal-form-field [formField]="form.email" fieldName="email">
  <label for="email">Email</label>
  <input id="email" [formField]="form.email" />
</ngx-signal-form-field>
```

### Outlined Layout (Material Design)

Add the `outline` directive for Material Design outlined inputs with floating labels:

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
<ngx-signal-form-field [formField]="form.bio" outline>
  <label for="bio">Bio</label>
  <textarea id="bio" [formField]="form.bio"></textarea>
  <ngx-signal-form-field-character-count [formField]="form.bio" />
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
<ngx-signal-form-field [formField]="form.phone" outline>
  <label for="phone">Phone Number</label>
  <input id="phone" [formField]="form.phone" />
  <ngx-signal-form-field-hint>Format: 123-456-7890</ngx-signal-form-field-hint>
</ngx-signal-form-field>
```

### Complete Documentation

For detailed API reference, CSS custom properties, migration guides, and complete examples, see:

**[📖 Form Field Components Documentation](./packages/toolkit/form-field/README.md)**

---

## CSS Status Classes (Angular 21.1+)

### The Problem: Mismatched Visual Feedback

Angular Signal Forms (21.0) introduced a modern form system, but initially lacked CSS status classes like `ng-invalid`, `ng-touched` that developers relied on for styling. This created a gap for teams migrating from Reactive/Template-driven forms.

**Angular 21.1+ solution:** The `provideSignalFormsConfig({ classes: {...} })` API enables CSS class injection. However, there's a **timing mismatch** with the toolkit's error display strategies:

```
❌ Default Angular Behavior (Immediate CSS Classes):
┌─────────────────────────────┐
│ Email [RED BORDER]          │  ← ng-invalid class applied immediately
└─────────────────────────────┘
                                 ← No error message yet (on-touch strategy)

User thinks: "Why is this red? What did I do wrong?"
```

```
✅ With Toolkit Alignment (Synced Feedback):
┌─────────────────────────────┐
│ Email [normal border]       │  ← Normal border while typing
└─────────────────────────────┘

[User blurs field]

┌─────────────────────────────┐
│ Email [RED BORDER]          │  ← Red border + error appear together
└─────────────────────────────┘
⚠️ Please enter a valid email   ← Error message explains the issue
```

### Status Classes vs. CSS Custom Properties

The toolkit provides **two complementary styling systems** that work together:

| Feature                  | **Status Classes** (CSS Class Injection)               | **CSS Custom Properties** (Theming)                                  |
| ------------------------ | ------------------------------------------------------ | -------------------------------------------------------------------- |
| **Purpose**              | State-based styling (valid/invalid, touched/untouched) | Theme customization (colors, spacing, typography)                    |
| **Technology**           | Angular 21.1+ `provideSignalFormsConfig({ classes })`  | CSS variables (`--ngx-form-field-*`)                                 |
| **Applied To**           | Form control elements (`<input>`, `<textarea>`, etc.)  | Component containers and internal elements                           |
| **Sync Strategy**        | Aligns with toolkit error display strategy             | Independent (always available)                                       |
| **Example Classes**      | `ng-invalid`, `ng-touched`, `ng-dirty`, `ng-pristine`  | N/A (variables, not classes)                                         |
| **Example Properties**   | N/A (classes, not properties)                          | `--ngx-form-field-focus-border-color`, `--ngx-form-field-bg`         |
| **When Applied**         | Based on form state + strategy                         | Always (customizable via CSS)                                        |
| **Browser Requirement**  | Angular 21.1+                                          | CSS Custom Properties (all modern browsers)                          |
| **Documentation**        | This section                                           | [Form Field Theming Guide](./packages/toolkit/form-field/THEMING.md) |
| **Use Together Example** | `.ng-invalid { border-color: var(--error-color); }`    | Define theme colors, use status classes for state-based rules        |

**How they complement each other:**

```css
/* CSS Custom Properties define your theme */
:root {
  --error-color: #dc2626;
  --focus-color: #3b82f6;
  --border-color: #d1d5db;
}

/* Status Classes apply theme colors based on form state */
input.ng-invalid.ng-touched {
  border-color: var(--error-color); /* Theme color applied conditionally */
}

input:focus {
  border-color: var(--focus-color); /* Theme color for focus state */
}

input.ng-valid {
  border-color: var(--border-color); /* Theme color for valid state */
}
```

**When to use each:**

- **Status Classes**: You use CSS frameworks (Bootstrap, Tailwind) OR have existing `.ng-*` styles you want to preserve
- **CSS Custom Properties**: You want to customize colors, spacing, typography across all form components
- **Both Together**: Most production apps benefit from combining theme customization (custom properties) with state-based styling (status classes)

### Two Approaches: Utility vs Provider

The toolkit offers flexibility based on your configuration needs:

**Approach 1: Utility Function (Recommended - Most Flexible)**

Use when you need to configure other Signal Forms options:

```typescript
import { provideSignalFormsConfig } from '@angular/forms/signals';
import { ngxStatusClasses } from '@ngx-signal-forms/toolkit';

export const appConfig: ApplicationConfig = {
  providers: [
    provideSignalFormsConfig({
      // Toolkit utility generates the classes config
      classes: ngxStatusClasses({
        strategy: 'on-touch', // Syncs with toolkit error display

        // Optional: Customize class names for your CSS framework
        invalidClass: 'is-invalid', // Bootstrap convention
        validClass: 'is-valid',
      }),

      // Add other Angular Signal Forms config here
      // (future features can be added without changing this)
    }),
  ],
};
```

**Approach 2: Convenience Provider (Simpler - Status Classes Only)**

Use when you ONLY need status classes:

```typescript
import { provideNgxStatusClasses } from '@ngx-signal-forms/toolkit';

export const appConfig: ApplicationConfig = {
  providers: [
    provideNgxStatusClasses({
      strategy: 'on-touch',
      invalidClass: 'is-invalid',
    }),
  ],
};
```

### Strategy Options

| Strategy      | CSS Classes Applied When               | Best For                                |
| ------------- | -------------------------------------- | --------------------------------------- |
| `'on-touch'`  | After field blur or form submission    | Matches toolkit error display (default) |
| `'immediate'` | As soon as field becomes invalid/valid | Standard Angular behavior               |

**Decision guide:**

- ✅ **`'on-touch'` (default)**: Consistent UX where red borders and error messages appear together
- ⚠️ **`'immediate'`**: Use when you want instant visual feedback (e.g., password strength indicators)

### Available Class Customizations

Default class names follow Angular conventions (`ng-*`). Override for CSS frameworks:

```typescript
interface NgxStatusClassesOptions {
  strategy?: 'on-touch' | 'immediate'; // Default: 'on-touch'

  // Class name overrides (all optional)
  validClass?: string; // Default: 'ng-valid'
  invalidClass?: string; // Default: 'ng-invalid'
  touchedClass?: string; // Default: 'ng-touched'
  untouchedClass?: string; // Default: 'ng-untouched'
  dirtyClass?: string; // Default: 'ng-dirty'
  pristineClass?: string; // Default: 'ng-pristine'
}
```

**Common framework mappings:**

```typescript
// Bootstrap
provideNgxStatusClasses({
  invalidClass: 'is-invalid',
  validClass: 'is-valid',
});

// Tailwind (custom utility classes)
provideNgxStatusClasses({
  invalidClass: 'border-red-500',
  validClass: 'border-green-500',
  touchedClass: 'ring-2',
});
```

### Complete Example: Status Classes + Custom Properties

Combining both systems for maximum styling flexibility. We use Angular's native `provideSignalFormsConfig` to apply the class configuration generated by the toolkit's `ngxStatusClasses` utility:

```typescript
// app.config.ts
import { provideSignalFormsConfig } from '@angular/forms/signals';
import { ngxStatusClasses } from '@ngx-signal-forms/toolkit';

export const appConfig: ApplicationConfig = {
  providers: [
    provideSignalFormsConfig({
      classes: ngxStatusClasses({ strategy: 'on-touch' }),
    }),
  ],
};
```

```css
/* styles.css - Theme with custom properties */
:root {
  --error-color: #dc2626;
  --success-color: #10b981;
  --focus-color: #3b82f6;
}

/* Use status classes with theme colors */
input.ng-invalid.ng-touched {
  border-color: var(--error-color);
  background-color: color-mix(in srgb, var(--error-color) 5%, white);
}

input.ng-valid.ng-touched {
  border-color: var(--success-color);
}

input:focus {
  border-color: var(--focus-color);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--focus-color) 20%, transparent);
}

/* Dark mode theme adjustment */
@media (prefers-color-scheme: dark) {
  :root {
    --error-color: #fca5a5;
    --success-color: #6ee7b7;
    --focus-color: #60a5fa;
  }
}
```

### Anti-Pattern: Don't Mix Both Approaches

**❌ WRONG - Using both approaches causes conflicts:**

```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    // First approach
    provideNgxStatusClasses({ strategy: 'on-touch' }),

    // Second approach - WILL OVERRIDE THE FIRST!
    provideSignalFormsConfig({
      classes: ngxStatusClasses({ strategy: 'immediate' }),
    }),
  ],
};
```

**✅ CORRECT - Choose one approach:**

```typescript
// Option 1: Only need classes
providers: [provideNgxStatusClasses({ strategy: 'on-touch' })];

// Option 2: Need classes + other config
providers: [
  provideSignalFormsConfig({
    classes: ngxStatusClasses({ strategy: 'on-touch' }),
    // other config here
  }),
];
```

### More Information

For complete theming documentation including CSS custom properties, dark mode, size scaling, and WCAG compliance:

- **[Form Field Theming Guide](./packages/toolkit/form-field/THEMING.md)** - Comprehensive CSS custom properties reference
- **[Toolkit README](./packages/toolkit/README.md#automatic-status-classes)** - Detailed status classes API

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
  [formField]="form.password"
  fieldName="password"
  [strategy]="'immediate'"
>
  <!-- This field uses 'immediate', others use form/global default -->
</ngx-signal-form-field>
```

## Core Features

### Auto-ARIA Directive

Automatically manages accessibility attributes for all `[formField]` elements:

```html
<!-- Input automatically gets: -->
<!-- aria-invalid="true" when invalid and touched -->
<!-- aria-describedby="email-error" when error is shown -->
<input id="email" [formField]="form.email" />
```

> **Important:** The directive must be imported to activate (via `NgxSignalFormToolkit` bundle or individual import). It has an automatic selector (`input[formField]`, `textarea[formField]`, `select[formField]`) but still requires being in your component's `imports` array.

```typescript
// Option 1: Bundle import (recommended)
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit/core';
@Component({
  imports: [FormField, NgxSignalFormToolkit], // ✅ Auto-ARIA activated!
})

// Option 2: Individual import
import { NgxSignalFormAutoAriaDirective } from '@ngx-signal-forms/toolkit/core';
@Component({
  imports: [FormField, NgxSignalFormAutoAriaDirective], // ✅ Auto-ARIA activated!
})
```

**Opt-out if needed:**

```html
<input [formField]="form.custom" ngxSignalFormAutoAriaDisabled />
```

### Auto-Touch Directive

Automatically marks fields as touched on blur:

```html
<!-- On blur, form.email().markAsTouched() is called automatically -->
<input [formField]="form.email" />
```

**Opt-out if needed:**

```html
<input [formField]="form.manual" ngxSignalFormAutoTouchDisabled />
```

### Form Error Component

Display validation errors with proper ARIA attributes:

```html
<ngx-signal-form-error
  [formField]="form.email"
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
<ngx-signal-form-field [formField]="form.username" fieldName="username">
  <label for="username">Username</label>
  <input id="username" [formField]="form.username" />
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
    <form [ngxSignalForm]="myForm" [errorStrategy]="'on-touch'" (submit)="save($event)">
      <!-- Child components automatically inherit error strategy -->
      <!-- Toolkit integrates with Angular's built-in submittedStatus -->
    </form>
  `,
})
export class MyFormComponent {
  protected readonly myForm = form(...);

  protected save(event: Event): void {
    event.preventDefault();
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
