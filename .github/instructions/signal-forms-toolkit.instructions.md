---
description: '@ngx-signal-forms/toolkit - Enhancement library for Angular Signal Forms'
applyTo: '**/*.ts, **/*.html'
---

# Angular Signal Forms Toolkit Instructions

## Purpose

These instructions guide you (the LLM) on how to use `@ngx-signal-forms/toolkit` when generating code for this project. The toolkit provides directives, components, and utilities that enhance Angular Signal Forms with automatic accessibility, error display strategies, and reduced boilerplate.

**Key Principle**: The toolkit is 100% non-intrusive. It works **alongside** Signal Forms without modifying the core API.

## When to Suggest the Toolkit

Suggest using toolkit features when:

- WCAG 2.2 accessibility compliance is required
- Multiple forms need consistent error display UX
- Automatic ARIA attributes are needed (`aria-invalid`, `aria-describedby`)
- Progressive error disclosure (show errors after blur/submit) is desired
- Warning messages (non-blocking validation) are required
- Reduced boilerplate for form field layouts is beneficial

Use bare Signal Forms when:

- User explicitly requests minimal dependencies
- User needs full manual control over every aspect
- Forms are extremely simple (1-2 fields with no validation)

## Core Concepts

### ReactiveOrStatic<T> Type

The toolkit accepts both reactive and static values for maximum flexibility. When generating code:

```typescript
import type { ReactiveOrStatic } from '@ngx-signal-forms/toolkit/core';

// All valid - toolkit accepts any of these:
const staticValue: ReactiveOrStatic<string> = 'on-touch';
const signalValue: ReactiveOrStatic<string> = signal('on-touch');
const computedValue: ReactiveOrStatic<string> = computed(() => 'on-touch');
const functionValue: ReactiveOrStatic<string> = () => 'on-touch';
```

**When generating code**: Prefer static values for simplicity unless the value needs to be reactive.

### Error Display Strategies

The toolkit provides four strategies for controlling when validation errors are shown:

```typescript
type ErrorDisplayStrategy =
  | 'immediate' // Show errors as user types (real-time feedback)
  | 'on-touch' // Show after blur or submit (WCAG recommended)
  | 'on-submit' // Show only after form submission
  | 'manual'; // Developer controls visibility programmatically
```

**When generating code**: Default to `'on-touch'` for best accessibility and UX. Use `'immediate'` only when explicitly requested or for critical fields.

### Warning Support (Non-Blocking Validation)

The toolkit distinguishes between blocking errors and non-blocking warnings using a convention-based approach:

**Convention:**

- Errors (blocking): `kind` property does NOT start with `'warn:'`
- Warnings (non-blocking): `kind` property starts with `'warn:'`

**ARIA Implementation:**

- Errors: `role="alert"` with `aria-live="assertive"` (immediate announcement)
- Warnings: `role="status"` with `aria-live="polite"` (non-intrusive announcement)

**When generating code**: Use `warningError()` utility to create warnings. Never manually create errors with `'warn:'` prefix.

## Configuration

### Global Configuration

When generating app configuration, include toolkit configuration if accessibility features are required:

```typescript
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideNgxSignalFormsConfig } from '@ngx-signal-forms/toolkit/core';

export const appConfig: ApplicationConfig = {
  providers: [
    provideNgxSignalFormsConfig({
      autoAria: true, // Enable automatic ARIA attributes
      defaultErrorStrategy: 'on-touch', // Default error display strategy
    }),
  ],
};
```

**When generating code**: Only include toolkit configuration if user needs accessibility features or has multiple forms.

## Public API - Bundle Constant

### NgxSignalFormToolkit

**Purpose**: Provides a convenient bundle import for all essential toolkit directives and components.

**When to use**: Recommended for all components using the toolkit. Reduces import boilerplate and improves developer experience.

**Import from**: `@ngx-signal-forms/toolkit/core`

**Example usage**:

```typescript
import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { form, submit, Field } from '@angular/forms/signals';
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Field, NgxSignalFormToolkit],
  template: `
    <!-- novalidate automatically added by directive -->
    <form [ngxSignalForm]="userForm" (ngSubmit)="handleSubmit()">
      <input id="email" [field]="userForm.email" />
      <ngx-signal-form-error [field]="userForm.email" fieldName="email" />
      <button type="submit">Submit</button>
    </form>
  `,
})
export class UserFormComponent {
  readonly #model = signal({ email: '' });
  protected readonly userForm = form(this.#model /* validators */);

  /**
   * Form submission using Angular Signal Forms submit() helper.
   *
   * Pattern B: Async method wrapper that calls submit() internally.
   * - submit() returns a callable function (not Promise directly)
   * - Template binding: (ngSubmit)="handleSubmit()" WITH parentheses
   * - Automatically marks all fields as touched
   * - Only executes callback when form is VALID
   *
   * Alternative Pattern A (official): Store submit() result
   * - readonly onSubmit = submit(this.userForm, async () => {...})
   * - Template: (ngSubmit)="onSubmit" WITHOUT parentheses
   */
  protected async handleSubmit(): Promise<void> {
    await submit(this.userForm, async () => {
      // Handle submission (e.g., API call)
      console.log('Submit:', this.#model());
      return null; // No server errors
    });
  }
}
```

**Note:** The `NgxSignalFormProviderDirective` automatically exposes Angular Signal Forms' built-in `submittedStatus` signal through dependency injection. The status is managed automatically by Angular when using the `submit()` helper function.

> **Important:** Angular Signal Forms' `submit()` returns a **callable function**. Two valid patterns:
>
> - **Pattern A (official)**: `readonly onSubmit = submit(...)` with template `(ngSubmit)="onSubmit"` (no parentheses)
> - **Pattern B (alternative)**: `async handleSubmit() { await submit(...) }` with template `(ngSubmit)="handleSubmit()"` (with parentheses)

**Alternative: Individual Imports**

When you only need specific directives or components:

```typescript
import {
  NgxSignalFormProviderDirective,
  NgxSignalFormErrorComponent
} from '@ngx-signal-forms/toolkit/core';

@Component({
  imports: [Field, NgxSignalFormProviderDirective, NgxSignalFormErrorComponent],
  // ...
})
```

**Key features**:

- Contains: `NgxSignalFormProviderDirective`, `NgxSignalFormAutoAriaDirective`, `NgxSignalFormErrorComponent`
- Type-safe readonly tuple (`as const`)
- Single import replaces three individual imports
- Cleaner component metadata

## Public API - Directives

### NgxSignalFormProviderDirective

**Purpose**: Provides form context to child components and tracks submission state.

**When to use**: Apply to `<form>` elements when you need automatic submission tracking or want to set a form-wide error display strategy.

**Import from**: `@ngx-signal-forms/toolkit/core` (or use `NgxSignalFormToolkit` bundle)

**Example usage**:

```typescript
import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { form, Field } from '@angular/forms/signals';
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Field, NgxSignalFormToolkit],
  template: `
    <form
      [ngxSignalFormProvider]="userForm"
      [errorStrategy]="'on-touch'"
      (ngSubmit)="save()"
      novalidate
    >
      <input id="email" [field]="userForm.email" />
      <button type="submit">Submit</button>
    </form>
  `,
})
export class UserFormComponent {
  readonly #model = signal({ email: '' });
  protected readonly userForm = form(this.#model /* validators */);

  protected save(): void {
    // Form submission logic
  }
}
```

**Key features**:

- Exposes Angular's built-in `submittedStatus` signal via dependency injection
- Provides error display strategy to child directives
- Provides form instance via dependency injection

**Input properties**:

- `ngxSignalFormProvider`: The form instance (required)
- `errorStrategy`: Error display strategy (optional, defaults to global config)

### NgxSignalFormAutoAriaDirective

**Purpose**: Automatically applies ARIA attributes to form controls for accessibility.

**When to use**: Automatically applied to all `input[field]`, `textarea[field]`, `select[field]` elements (except radio/checkbox). No explicit import needed unless you want to opt-out.

**Automatic behavior**:

- Adds `aria-invalid="true"` when field is invalid
- Adds `aria-describedby` linking to error message containers
- Uses `id` attribute for field name resolution (WCAG preferred)

**Field name resolution priority**:

1. `data-signal-field` attribute (explicit override for nested paths)
2. Custom resolver from global config
3. `id` attribute (WCAG recommended)
4. `name` attribute (fallback)

**Example - Basic usage** (automatic):

```html
<input id="email" [field]="form.email" />
<!-- Result: aria-invalid="true" aria-describedby="email-error" when invalid -->
```

**Example - Nested paths**:

```html
<input
  id="firstName"
  data-signal-field="personalInfo.firstName"
  [field]="form.personalInfo.firstName"
/>
```

**Example - Opt-out**:

```html
<input [field]="form.custom" ngxSignalFormAutoAriaDisabled />
```

**Note on touch behavior**: Angular Signal Forms' `[field]` directive automatically marks fields as touched on blur. The toolkit does not need a separate auto-touch directive.

## Public API - Components

### NgxSignalFormErrorComponent

**Purpose**: Displays validation errors and warnings with WCAG-compliant ARIA roles.

**When to use**: When you need standalone error display without using `NgxSignalFormFieldComponent`.

**Import from**: `@ngx-signal-forms/toolkit/core`

**Example usage**:

```typescript
import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { form, Field } from '@angular/forms/signals';
import { NgxSignalFormErrorComponent } from '@ngx-signal-forms/toolkit/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Field, NgxSignalFormErrorComponent],
  template: `
    <input id="email" [field]="emailForm.email" />
    <ngx-signal-form-error [field]="emailForm.email" fieldName="email" />
  `,
})
export class EmailFieldComponent {
  readonly #model = signal({ email: '' });
  protected readonly emailForm = form(this.#model /* validators */);
}
```

**Required input properties**:

- `field`: The field from your form (e.g., `form.email`)
- `fieldName`: The field name string (must match `id` attribute for ARIA)

**Optional input properties**:

- `strategy`: Error display strategy (defaults to `'on-touch'`)
- `submittedStatus`: Signal tracking form submission state (auto-injected from `NgxSignalFormDirective` if present)

**Note:** When used inside a form with `NgxSignalFormDirective`, the `submittedStatus` signal is automatically injected from Angular Signal Forms' built-in submission tracking and doesn't need to be passed manually.

**Key features**:

- Separates blocking errors from non-blocking warnings
- Errors use `role="alert"` with `aria-live="assertive"`
- Warnings use `role="status"` with `aria-live="polite"`
- Respects error display strategy automatically
- Fully styleable via CSS custom properties

**Handling Root-Level vs Field-Level Errors:**

The error component automatically handles both root-level (form-wide) and field-level errors:

```typescript
// Root-level errors: Pass the form tree itself
<ngx-signal-form-error [field]="myForm" fieldName="form-root" />

// Field-level errors: Pass a specific field
<ngx-signal-form-error [field]="myForm.email" fieldName="email" />
```

**When displaying errors programmatically:**

```typescript
// Get root-level errors (cross-field validation)
protected readonly rootErrors = computed(() => this.myForm().errors());

// Display only root-level errors in a banner
@if (rootErrors().length > 0) {
  <div class="form-banner" role="alert">
    @for (error of rootErrors(); track error.kind) {
      <p>{{ error.message }}</p>
    }
  </div>
}
```

### NgxSignalFormFieldComponent

**Purpose**: Reusable form field wrapper with automatic error display and consistent layout.

**When to use**: Preferred approach for production forms requiring consistent UX and reduced boilerplate.

**Import from**: `@ngx-signal-forms/toolkit/form-field`

**Example usage**:

```typescript
import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { form, schema, required, email, Field } from '@angular/forms/signals';
import { NgxSignalFormFieldComponent } from '@ngx-signal-forms/toolkit/form-field';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Field, NgxSignalFormFieldComponent],
  template: `
    <form (ngSubmit)="save()" novalidate>
      <ngx-signal-form-field [field]="contactForm.email" fieldName="email">
        <label for="email">Email</label>
        <input id="email" [field]="contactForm.email" />
      </ngx-signal-form-field>

      <button type="submit" [disabled]="contactForm().invalid()">Submit</button>
    </form>
  `,
})
export class ContactFormComponent {
  readonly #model = signal({ email: '' });
  protected readonly contactForm = form(
    this.#model,
    schema((path) => {
      required(path.email, { message: 'Email is required' });
      email(path.email, { message: 'Invalid email format' });
    }),
  );

  protected save(): void {
    if (this.contactForm().valid()) {
      console.log('Form data:', this.#model());
    }
  }
}
```

**Required input properties**:

- `field`: The field from your form
- `fieldName`: The field name string

**Optional input properties**:

- `strategy`: Error display strategy (inherits from form provider or global config)
- `showErrors`: Toggle automatic error display (default: `true`)

**Key features**:

- Content projection for labels and inputs
- Automatic error/warning display
- Inherits error strategy from `NgxSignalFormDirective`
- Type-safe with generics
- Consistent spacing via CSS custom properties

## Public API - Utilities

### showErrors()

**Purpose**: Determines when to show field errors based on error display strategy.

**When to use**: When you need manual control over error visibility in templates without using components.

**Import from**: `@ngx-signal-forms/toolkit/core`

**Example usage**:

```typescript
import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { form, Field } from '@angular/forms/signals';
import { showErrors } from '@ngx-signal-forms/toolkit/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Field],
  template: `
    <input id="email" [field]="emailForm.email" />

    @if (shouldShowErrors()) {
      <span id="email-error" role="alert">
        {{ emailForm.email().errors()[0].message }}
      </span>
    }
  `,
})
export class ManualErrorDisplayComponent {
  readonly #model = signal({ email: '' });
  protected readonly emailForm = form(this.#model /* validators */);
  protected readonly submittedStatus = signal<SubmittedStatus>('unsubmitted');

  protected readonly shouldShowErrors = showErrors(
    this.emailForm.email,
    'on-touch',
    this.submittedStatus,
  );
}
```

**Parameters**:

- `field`: `FieldTree<T>` - The form field
- `strategy`: `ReactiveOrStatic<ErrorDisplayStrategy>` - Display strategy
- `submittedStatus`: `ReactiveOrStatic<SubmittedStatus>` - Form submission state

**Returns**: `Signal<boolean>` - Whether to show errors

### computeShowErrors()

**Purpose**: Same as `showErrors()` but with more explicit naming.

**When to use**: Prefer `showErrors()` for brevity. Use this when you want to emphasize computation.

**Example usage**:

```typescript
import { computeShowErrors } from '@ngx-signal-forms/toolkit/core';

const shouldShow = computeShowErrors(
  form.password,
  'immediate',
  signal<SubmittedStatus>('unsubmitted'),
);
```

### combineShowErrors()

**Purpose**: Combines multiple error visibility signals using logical OR.

**When to use**: For form-level error indicators showing if ANY field has visible errors.

**Import from**: `@ngx-signal-forms/toolkit/core`

**Example usage**:

```typescript
import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { form, Field } from '@angular/forms/signals';
import { combineShowErrors, showErrors } from '@ngx-signal-forms/toolkit/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Field],
  template: `
    @if (showAnyFormErrors()) {
      <div class="form-error-banner" role="alert">
        Please fix the errors below before submitting
      </div>
    }

    <input id="email" [field]="userForm.email" />
    <input id="password" [field]="userForm.password" />
  `,
})
export class FormWithBannerComponent {
  readonly #model = signal({ email: '', password: '' });
  protected readonly userForm = form(this.#model /* validators */);
  protected readonly submittedStatus = signal<SubmittedStatus>('unsubmitted');

  protected readonly showAnyFormErrors = combineShowErrors([
    showErrors(this.userForm.email, 'on-touch', this.submittedStatus),
    showErrors(this.userForm.password, 'on-touch', this.submittedStatus),
  ]);
}
```

### warningError()

**Purpose**: Creates non-blocking validation warnings.

**When to use**: For guidance that shouldn't prevent form submission (e.g., password strength suggestions).

**Import from**: `@ngx-signal-forms/toolkit/core`

**Example usage**:

```typescript
import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import {
  form,
  schema,
  required,
  minLength,
  validate,
} from '@angular/forms/signals';
import { warningError } from '@ngx-signal-forms/toolkit/core';
import { NgxSignalFormFieldComponent } from '@ngx-signal-forms/toolkit/form-field';

const passwordSchema = schema<{ password: string }>((path) => {
  // Blocking errors
  required(path.password, { message: 'Password is required' });
  minLength(path.password, 8, { message: 'Minimum 8 characters' });

  // Non-blocking warning
  validate(path.password, (ctx) => {
    const value = ctx.value();
    if (value && value.length < 12) {
      return warningError(
        'short-password',
        'Consider using 12+ characters for better security',
      );
    }
    return null;
  });
});

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgxSignalFormFieldComponent],
  template: `
    <ngx-signal-form-field [field]="passwordForm.password" fieldName="password">
      <label for="password">Password</label>
      <input id="password" type="password" [field]="passwordForm.password" />
      <!-- Component automatically separates errors and warnings -->
    </ngx-signal-form-field>
  `,
})
export class PasswordFormComponent {
  readonly #model = signal({ password: '' });
  protected readonly passwordForm = form(this.#model, passwordSchema);
}
```

**Parameters**:

- `kind`: `string` - Error kind identifier (will be prefixed with `'warn:'`)
- `message`: `string` - User-friendly warning message

**Returns**: Validation error object with `kind` starting with `'warn:'`

### isWarningError() / isBlockingError()

**Purpose**: Type guards to distinguish warnings from blocking errors.

**When to use**: When manually processing errors array and need to separate warnings from errors.

**Import from**: `@ngx-signal-forms/toolkit/core`

**Example usage**:

```typescript
import {
  isWarningError,
  isBlockingError,
} from '@ngx-signal-forms/toolkit/core';

const allErrors = form.email().errors();
const warnings = allErrors.filter(isWarningError);
const blockingErrors = allErrors.filter(isBlockingError);

console.log(`Blocking: ${blockingErrors.length}, Warnings: ${warnings.length}`);
```

### Field Resolution Utilities

**Purpose**: Low-level utilities for field name resolution and ID generation.

**When to use**: Advanced cases where you're building custom directives or components.

**Import from**: `@ngx-signal-forms/toolkit/core`

**Example usage**:

```typescript
import {
  resolveFieldName,
  generateErrorId,
  generateWarningId,
} from '@ngx-signal-forms/toolkit/core';

// Resolve field name from element
const fieldName = resolveFieldName(element, injector);

// Generate IDs for aria-describedby
const errorId = generateErrorId('email'); // 'email-error'
const warningId = generateWarningId('email'); // 'email-warning'
```

## Code Examples

### Basic Form with Toolkit

When generating forms, use this pattern for consistent UX and automatic accessibility:

```typescript
import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { form, schema, required, email, Field } from '@angular/forms/signals';
import { NgxSignalFormFieldComponent } from '@ngx-signal-forms/toolkit/form-field';

interface ContactModel {
  email: string;
  message: string;
}

const contactSchema = schema<ContactModel>((path) => {
  required(path.email, { message: 'Email is required' });
  email(path.email, { message: 'Invalid email format' });
  required(path.message, { message: 'Message is required' });
});

@Component({
  selector: 'ngx-contact-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Field, NgxSignalFormFieldComponent],
  template: `
    <form (ngSubmit)="save()" novalidate>
      <ngx-signal-form-field [field]="contactForm.email" fieldName="email">
        <label for="email">Email</label>
        <input id="email" [field]="contactForm.email" />
      </ngx-signal-form-field>

      <ngx-signal-form-field [field]="contactForm.message" fieldName="message">
        <label for="message">Message</label>
        <textarea id="message" [field]="contactForm.message"></textarea>
      </ngx-signal-form-field>

      <button type="submit" [disabled]="contactForm().invalid()">Submit</button>
    </form>
  `,
})
export class ContactFormComponent {
  readonly #model = signal<ContactModel>({ email: '', message: '' });
  protected readonly contactForm = form(this.#model, contactSchema);

  protected save(): void {
    if (this.contactForm().valid()) {
      console.log('Form data:', this.#model());
    }
  }
}
```

### Form with Dynamic Error Strategy

When user needs to toggle error display mode (e.g., for demos or complex UX):

```typescript
import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { form, schema, required, email, Field } from '@angular/forms/signals';
import {
  NgxSignalFormProviderDirective,
  NgxSignalFormFieldComponent,
  type ErrorDisplayStrategy,
} from '@ngx-signal-forms/toolkit/core';

const userSchema = schema<{ email: string }>((path) => {
  required(path.email, { message: 'Email is required' });
  email(path.email, { message: 'Valid email required' });
});

@Component({
  selector: 'ngx-user-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Field, NgxSignalFormProviderDirective, NgxSignalFormFieldComponent],
  template: `
    <!-- Strategy selector -->
    <fieldset>
      <legend>Error Display Mode</legend>
      <label>
        <input
          type="radio"
          name="errorMode"
          value="immediate"
          [checked]="errorStrategy() === 'immediate'"
          (change)="errorStrategy.set('immediate')"
        />
        Immediate
      </label>
      <label>
        <input
          type="radio"
          name="errorMode"
          value="on-touch"
          [checked]="errorStrategy() === 'on-touch'"
          (change)="errorStrategy.set('on-touch')"
        />
        On Touch (Default)
      </label>
      <label>
        <input
          type="radio"
          name="errorMode"
          value="on-submit"
          [checked]="errorStrategy() === 'on-submit'"
          (change)="errorStrategy.set('on-submit')"
        />
        On Submit
      </label>
    </fieldset>

    <!-- Form with provider (tracks submission + manages strategy) -->
    <!-- novalidate automatically added -->
    <form
      [ngxSignalForm]="userForm"
      [errorStrategy]="errorStrategy()"
      (ngSubmit)="save()"
    >
      <ngx-signal-form-field [field]="userForm.email" fieldName="email">
        <label for="email">Email</label>
        <input id="email" [field]="userForm.email" />
      </ngx-signal-form-field>

      <button type="submit">Submit</button>
    </form>
  `,
})
export class UserFormComponent {
  protected readonly errorStrategy = signal<ErrorDisplayStrategy>('on-touch');
  readonly #model = signal({ email: '' });
  protected readonly userForm = form(this.#model, userSchema);

  protected save(): void {
    // Form provider tracks submission automatically
  }
}
```

### Form with Non-Blocking Warnings

When validation should guide users without blocking submission:

```typescript
import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import {
  form,
  schema,
  required,
  minLength,
  validate,
  Field,
} from '@angular/forms/signals';
import { warningError } from '@ngx-signal-forms/toolkit/core';
import { NgxSignalFormFieldComponent } from '@ngx-signal-forms/toolkit/form-field';

const passwordSchema = schema<{ password: string }>((path) => {
  // Blocking errors
  required(path.password, { message: 'Password is required' });
  minLength(path.password, 8, { message: 'Minimum 8 characters' });

  // Non-blocking warning
  validate(path.password, (ctx) => {
    const value = ctx.value();
    if (value && value.length < 12) {
      return warningError(
        'short-password',
        'Consider using 12+ characters for better security',
      );
    }
    return null;
  });
});

@Component({
  selector: 'ngx-password-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Field, NgxSignalFormFieldComponent],
  template: `
    <ngx-signal-form-field [field]="passwordForm.password" fieldName="password">
      <label for="password">Password</label>
      <input id="password" type="password" [field]="passwordForm.password" />
      <!-- Component automatically separates errors and warnings -->
    </ngx-signal-form-field>
  `,
})
export class PasswordFormComponent {
  readonly #model = signal({ password: '' });
  protected readonly passwordForm = form(this.#model, passwordSchema);
}
```

### Manual Error Display (Without Components)

When you need full control over error display markup:

```typescript
import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { form, schema, required, email, Field } from '@angular/forms/signals';
import { showErrors } from '@ngx-signal-forms/toolkit/core';

const emailSchema = schema<{ email: string }>((path) => {
  required(path.email, { message: 'Email is required' });
  email(path.email, { message: 'Valid email format required' });
});

@Component({
  selector: 'ngx-manual-error-display',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Field],
  template: `
    <input id="email" [field]="emailForm.email" />

    @if (shouldShowErrors()) {
      <div id="email-error" role="alert">
        @for (error of emailForm.email().errors(); track error.kind) {
          <p class="error-message">{{ error.message }}</p>
        }
      </div>
    }

    <button (click)="save()">Submit</button>
  `,
})
export class ManualErrorComponent {
  readonly #model = signal({ email: '' });
  protected readonly emailForm = form(this.#model, emailSchema);
  protected readonly formSubmitted = signal(false);

  // Compute when to show errors
  protected readonly shouldShowErrors = showErrors(
    this.emailForm.email,
    'on-touch',
    this.formSubmitted,
  );

  protected save(): void {
    this.formSubmitted.set(true);
    if (this.emailForm().valid()) {
      console.log('Submit:', this.#model());
    }
  }
}
```

## Best Practices

### 1. Always Use OnPush Change Detection

```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush, // Required
})
```

### 2. Use Form Provider for Submission Tracking

```typescript
// ✅ Good - Automatic submission tracking
<form [ngxSignalForm]="form" (ngSubmit)="save()">

// ❌ Bad - Manual tracking required
<form (ngSubmit)="save()">
```

### 3. Prefer Field Name from ID Attribute

```typescript
// ✅ Good - Uses id (WCAG preferred)
<input id="email" [field]="form.email" />

// ⚠️ Okay - Uses name as fallback
<input name="email" [field]="form.email" />

// ✅ Best - Explicit for nested paths
<input
  id="firstName"
  data-signal-field="personalInfo.firstName"
  [field]="form.personalInfo.firstName"
/>
```

### 4. Use Warnings for Non-Blocking Guidance

```typescript
// ✅ Good - Error blocks submission
required(path.email, { message: 'Email is required' });

// ✅ Good - Warning guides user
validate(path.email, (ctx) => {
  if (ctx.value()?.includes('@tempmail.com')) {
    return warningError(
      'disposable-email',
      'Disposable emails may not receive important updates',
    );
  }
  return null;
});
```

### 5. Leverage ReactiveOrStatic for Flexibility

```typescript
// ✅ Good - Static for simple cases
const strategy: ReactiveOrStatic<ErrorDisplayStrategy> = 'on-touch';

// ✅ Good - Reactive for dynamic behavior
const strategy = computed(() => (isLoginForm() ? 'immediate' : 'on-touch'));
```

### 6. Use CSS Custom Properties for Theming

```css
/* Global theme */
:root {
  --ngx-signal-form-error-color: #dc2626;
  --ngx-signal-form-warning-color: #f59e0b;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  :root {
    --ngx-signal-form-error-color: #fca5a5;
    --ngx-signal-form-warning-color: #fcd34d;
  }
}
```

## WCAG 2.2 Compliance Checklist

- [ ] Use `'on-touch'` error strategy (recommended)
- [ ] All inputs have associated labels
- [ ] Error messages linked via `aria-describedby`
- [ ] Errors use `role="alert"` with `aria-live="assertive"`
- [ ] Warnings use `role="status"` with `aria-live="polite"`
- [ ] Field names resolved from `id` attribute
- [ ] Color contrast ≥ 4.5:1 for error/warning text
- [ ] Focus indicators visible
- [ ] Forms keyboard navigable

## Testing

### Unit Tests

```typescript
import { render, screen } from '@testing-library/angular';
import { inputBinding } from '@angular/core';
import { signal } from '@angular/core';
import { userEvent } from '@vitest/browser/context';

it('should show errors based on strategy', async () => {
  const model = signal({ email: '' });
  const submittedStatus = signal<SubmittedStatus>('unsubmitted');

  await render(MyFormComponent, {
    bindings: [
      inputBinding('model', model),
      inputBinding('submittedStatus', submittedStatus),
    ],
  });

  const emailInput = screen.getByLabelText(/email/i);

  // Trigger validation
  await userEvent.click(emailInput);
  await userEvent.tab();

  // Verify error appears (on-touch strategy)
  expect(screen.getByRole('alert')).toBeInTheDocument();
});
```

### E2E Tests

```typescript
import { test, expect } from '@playwright/test';

test('should validate accessibility tree', async ({ page }) => {
  await page.goto('/contact');

  const emailInput = page.getByLabel(/email/i);
  await emailInput.click();
  await emailInput.press('Tab');

  await expect(page.getByRole('form')).toMatchAriaSnapshot(`
    - form:
      - textbox "Email" [invalid]:
        - aria-describedby: email-error
      - alert: "Email is required"
  `);
});
```

## Migration from Bare Signal Forms

### Before (Manual Implementation)

```typescript
@Component({
  template: `
    <input
      id="email"
      [field]="form.email"
      (blur)="form.email().markAsTouched()"
      [attr.aria-invalid]="form.email().invalid() ? 'true' : null"
      [attr.aria-describedby]="form.email().invalid() ? 'email-error' : null"
    />

    @if (form.email().touched() && form.email().invalid()) {
      <span id="email-error" role="alert">
        @for (error of form.email().errors(); track error.kind) {
          <p>{{ error.message }}</p>
        }
      </span>
    }
  `,
})
```

### After (With Toolkit)

```typescript
@Component({
  imports: [Field, NgxSignalFormFieldComponent],
  template: `
    <ngx-signal-form-field [field]="form.email" fieldName="email">
      <label for="email">Email</label>
      <input id="email" [field]="form.email" />
    </ngx-signal-form-field>
  `,
})
```

**Lines of Code**: ~15 lines → ~5 lines (67% reduction)

## Entry Points

### Primary Entry (Core)

```typescript
import {
  provideNgxSignalFormsConfig,
  NgxSignalFormDirective,
  NgxSignalFormAutoAriaDirective,
  NgxSignalFormErrorComponent,
  showErrors,
  computeShowErrors,
  combineShowErrors,
  warningError,
  isWarningError,
  isBlockingError,
  type ErrorDisplayStrategy,
  type ReactiveOrStatic,
  type NgxSignalFormsConfig,
} from '@ngx-signal-forms/toolkit/core';
```

**Recommended: Bundle Import**

```typescript
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit/core';
```

**Alternative: Individual Imports**

```typescript
import {
  provideNgxSignalFormsConfig,
  NgxSignalFormDirective,
  NgxSignalFormErrorComponent,
  NgxSignalFormAutoAriaDirective,
  showErrors,
  computeShowErrors,
  combineShowErrors,
  warningError,
  isWarningError,
  isBlockingError,
  type ErrorDisplayStrategy,
  type ReactiveOrStatic,
  type NgxSignalFormsConfig,
} from '@ngx-signal-forms/toolkit/core';
```

### Secondary Entry (Form Field)

```typescript
import { NgxSignalFormFieldComponent } from '@ngx-signal-forms/toolkit/form-field';
```

### Secondary Entry (Testing)

```typescript
import { createPlaceholderTestHelper } from '@ngx-signal-forms/toolkit/testing';
```

## Resources

- [Toolkit README](../../packages/toolkit/README.md)
- [Angular Signal Forms API](https://angular.dev/api/forms/signals)
- [WCAG 2.2 Guidelines](https://www.w3.org/WAI/WCAG22/quickref/)
- [Signal Forms Instructions](./signal-forms.instructions.md)

## Summary

The toolkit provides:

- ✅ Automatic ARIA attributes for accessibility
- ✅ Error display strategies (immediate, on-touch, on-submit, manual)
- ✅ Warning support (non-blocking validation messages)
- ✅ Reusable form field wrapper
- ✅ WCAG 2.2 Level AA compliance by default
- ✅ 67% reduction in boilerplate code
- ✅ Type-safe with full TypeScript inference
- ✅ Tree-shakable secondary entry points

Use the toolkit for production applications where accessibility, consistent UX, and reduced boilerplate are priorities.
