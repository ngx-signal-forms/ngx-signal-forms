# @ngx-signal-forms/toolkit

> Enhancement toolkit for Angular Signal Forms with automatic accessibility and progressive error disclosure

[![npm version](https://img.shields.io/npm/v/@ngx-signal-forms/toolkit.svg)](https://www.npmjs.com/package/@ngx-signal-forms/toolkit)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](../../LICENSE)

Zero-intrusive directives, components, and utilities for Angular Signal Forms.

## Features

- ✅ Automatic ARIA attributes (`aria-invalid`, `aria-describedby`)
- ✅ Error display strategies (immediate, on-touch, on-submit, manual)
- ✅ Warning support (non-blocking validation messages)
- ✅ Reusable form field wrapper with automatic error display
- ✅ WCAG 2.2 Level AA compliant
- ✅ Type-safe with full TypeScript inference
- ✅ Tree-shakable with secondary entry points

> **Note**: Angular Signal Forms' `[field]` directive automatically marks fields as touched on blur. No additional directive needed for touch tracking.

## Quick Start

````typescript
// 1. Configure (optional)
import { provideNgxSignalFormsConfig } from '@ngx-signal-forms/toolkit';

export const appConfig: ApplicationConfig = {
  providers: [
    provideNgxSignalFormsConfig({
      defaultErrorStrategy: 'on-touch',
    }),
  ],
};

```typescript
// 2. Use in components (recommended: bundle import)
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit/core';
import { NgxSignalFormFieldComponent } from '@ngx-signal-forms/toolkit/form-field';
import { form, schema, required, submit, Field } from '@angular/forms/signals';

@Component({
  imports: [Field, NgxSignalFormToolkit, NgxSignalFormFieldComponent],
  template: `
    <form [ngxSignalForm]="contactForm" (ngSubmit)="handleSubmit()">
      <ngx-signal-form-field [field]="contactForm.email" fieldName="email">
        <label for="email">Email</label>
        <input id="email" [field]="contactForm.email" />
      </ngx-signal-form-field>
      <button type="submit">Submit</button>
    </form>
  `,
})
export class MyComponent {
  protected readonly model = signal({ email: '' });
  protected readonly contactForm = form(
    this.model,
    schema((path) => {
      required(path.email, { message: 'Email is required' });
    }),
  );

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
   * - readonly onSubmit = submit(this.contactForm, async () => {...})
   * - Template: (ngSubmit)="onSubmit" WITHOUT parentheses
   */
  protected async handleSubmit(): Promise<void> {
    await submit(this.contactForm, async () => {
      // Handle submission (e.g., API call)
      console.log('Form data:', this.model());
      // Reset after success
      this.model.set({ email: '' });
      this.contactForm().reset();
      return null; // No server errors
    });
  }
}
```

> **Important:** Angular Signal Forms' `submit()` returns a **callable function**. Two valid patterns:
> - **Pattern A (official)**: `readonly onSubmit = submit(...)` with template `(ngSubmit)="onSubmit"` (no parentheses)
> - **Pattern B (alternative)**: `async handleSubmit() { await submit(...) }` with template `(ngSubmit)="handleSubmit()"` (with parentheses)
>
> Pattern B shown above is convenient when you need additional logic around submission. Use Pattern A for simpler cases.

> **Note:** The `[ngxSignalForm]` directive automatically adds `novalidate` attribute to prevent browser validation UI from conflicting with Angular validation display.

### Alternative: Individual Imports

If you only need specific directives or components, you can import them individually:

```typescript
import {
  ngxSignalFormDirective,
  NgxSignalFormErrorComponent
} from '@ngx-signal-forms/toolkit/core';

@Component({
  imports: [Field, ngxSignalFormDirective, NgxSignalFormErrorComponent],
  template: `
    <form [ngxSignalForm]="myForm" (ngSubmit)="handleSubmit()">
      <!-- fields -->
    </form>
  `,
})
```

## API

### Entry Points

```typescript
// Primary entry point - Configuration
import { provideNgxSignalFormsConfig } from '@ngx-signal-forms/toolkit';
import type { NgxSignalFormsConfig, ErrorDisplayStrategy } from '@ngx-signal-forms/toolkit';

// Core - Bundle import (recommended)
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit/core';

// Core - Individual imports (alternative)
import { ngxSignalFormDirective, NgxSignalFormErrorComponent, NgxSignalFormAutoAriaDirective, computeShowErrors, showErrors } from '@ngx-signal-forms/toolkit/core';

// Form field wrapper with enhanced components
import {
  NgxSignalFormFieldComponent,
  NgxFloatingLabelDirective,
  NgxSignalFormFieldHintComponent,
  NgxSignalFormFieldCharacterCountComponent
} from '@ngx-signal-forms/toolkit/form-field';

```

### Bundle Constant

#### NgxSignalFormToolkit

The `NgxSignalFormToolkit` constant provides a convenient way to import all essential directives and components:

```typescript
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit/core';

@Component({
  imports: [Field, NgxSignalFormToolkit],
  // ...
})
```

**Contents:**

- `ngxSignalFormDirective` - Provides form context to child components
- `NgxSignalFormAutoAriaDirective` - Automatically applies ARIA attributes
- `NgxSignalFormErrorComponent` - Displays validation errors and warnings

**Benefits:**

- Single import instead of three individual imports
- Type-safe readonly tuple
- Cleaner component metadata
- Better developer experience

### Configuration

```typescript
interface NgxSignalFormsConfig {
  autoAria: boolean; // Default: true
  defaultErrorStrategy: ErrorDisplayStrategy; // Default: 'on-touch'
  fieldNameResolver?: (el: HTMLElement) => string | null;
  strictFieldResolution: boolean; // Default: false
  debug: boolean; // Default: false
}

type ErrorDisplayStrategy = 'immediate' | 'on-touch' | 'on-submit' | 'manual';
```

---

## Form Field Components

The toolkit includes a complete form field component system for enhanced layouts and accessibility:

### Quick Overview

```typescript
import {
  NgxSignalFormFieldComponent,
  NgxFloatingLabelDirective,
  NgxSignalFormFieldHintComponent,
  NgxSignalFormFieldCharacterCountComponent
} from '@ngx-signal-forms/toolkit/form-field';
```

**Key Features:**

- **NgxSignalFormFieldComponent** - Reusable wrapper with automatic error display
- **NgxFloatingLabelDirective** (`outline` attribute) - Material Design outlined layout
- **NgxSignalFormFieldCharacterCountComponent** - Progressive color states (ok → warning → danger → exceeded)
- **NgxSignalFormFieldHintComponent** - Helper text display

### Example Usage

```html
<ngx-signal-form-field [field]="form.bio" outline>
  <label for="bio">Bio</label>
  <textarea id="bio" [field]="form.bio"></textarea>
  <ngx-signal-form-field-hint>Tell us about yourself</ngx-signal-form-field-hint>
  <ngx-signal-form-field-character-count [field]="form.bio" [maxLength]="500" />
</ngx-signal-form-field>
```

### Complete Documentation

For detailed API reference, CSS custom properties, browser support, migration guides, and complete examples:

**[📖 Form Field Components Documentation](./form-field/README.md)**

---

### Directives

#### ngxSignalFormDirective

Provides form context to child components via dependency injection.

**Automatic Features:**
- Adds `novalidate` attribute to prevent browser validation UI
- Tracks submission lifecycle (`submittedStatus` signal)
- Provides form context to child directives/components
- Manages error display strategy

```html
<form [ngxSignalForm]="myForm" [errorStrategy]="'on-touch'" (ngSubmit)="handleSubmit()">
  <!-- form fields -->
  <button type="submit">Submit</button>
</form>
```

**Template Reference:**
```html
<form [ngxSignalForm]="myForm" #formDir="ngxSignalForm">
  <!-- Access directive instance -->
  <div>Status: {{ formDir.submittedStatus() }}</div>
</form>
```

```typescript
/**
 * Correct submit() usage: async method that calls submit() helper
 */
protected async handleSubmit(): Promise<void> {
  await submit(this.myForm, async () => {
    // Handle submission
    console.log('Form data:', this.model());
    return null; // No server errors
  });
}
```

> **Note:** Angular Signal Forms' `submit()` is an async function. Always use `(ngSubmit)="handleSubmit()"` WITH parentheses.

#### NgxSignalFormAutoAriaDirective

Automatically applied to `input[field]`, `textarea[field]`, `select[field]` elements.

Adds `aria-invalid` and `aria-describedby` attributes based on field validation state.

> **Important:** This directive must be imported to activate. While it has an automatic selector, Angular standalone components require explicit imports. Use `NgxSignalFormToolkit` bundle or import `NgxSignalFormAutoAriaDirective` individually.

```typescript
// With bundle (recommended)
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit/core';
@Component({ imports: [Field, NgxSignalFormToolkit] })

// Or individual import
import { NgxSignalFormAutoAriaDirective } from '@ngx-signal-forms/toolkit/core';
@Component({ imports: [Field, NgxSignalFormAutoAriaDirective] })
```

### Components

#### NgxSignalFormErrorComponent

```html
<ngx-signal-form-error [field]="form.email" fieldName="email" />
```

**Note:** When used inside a form with `ngxSignalFormDirective`, the `submittedStatus` signal is automatically injected from Angular Signal Forms' built-in submission tracking.

#### NgxSignalFormFieldComponent

```html
<ngx-signal-form-field [field]="form.email" fieldName="email" [strategy]="'on-touch'">
  <label>Email</label>
  <input [field]="form.email" />
</ngx-signal-form-field>
```

#### NgxFloatingLabelDirective

Transforms the form field into an outlined layout where the label appears inside the input container, matching Material Design outlined input patterns.

```html
<ngx-signal-form-field [field]="form.email" outline>
  <label for="email">Email Address</label>
  <input id="email" type="email" [field]="form.email" required placeholder="you@example.com" />
</ngx-signal-form-field>
```

**Inputs:**
- `showRequiredMarker` (boolean, default: `true`) - Show required field marker
- `requiredMarker` (string, default: `' *'`) - Custom marker character(s)

**Browser Support:** Chrome 105+, Firefox 121+, Safari 15.4+, Edge 105+ (95%+ coverage)

**For complete API, CSS custom properties, and examples, see [Form Field Documentation](./form-field/README.md#ngxfloatinglabeldirective)**

#### NgxSignalFormFieldHintComponent

Displays helper text for form fields.

```html
<ngx-signal-form-field [field]="form.phone" outline>
  <label for="phone">Phone Number</label>
  <input id="phone" [field]="form.phone" />
  <ngx-signal-form-field-hint>Format: 123-456-7890</ngx-signal-form-field-hint>
</ngx-signal-form-field>
```

**For complete API and positioning options, see [Form Field Documentation](./form-field/README.md#ngxsignalformfieldhintcomponent)**

#### NgxSignalFormFieldCharacterCountComponent

Displays character count with progressive color states.

```html
<ngx-signal-form-field [field]="form.bio" outline>
  <label for="bio">Bio</label>
  <textarea id="bio" [field]="form.bio"></textarea>
  <ngx-signal-form-field-character-count
    [field]="form.bio"
    [maxLength]="500"
  />
</ngx-signal-form-field>
```

**Color States:**
- **ok** (0-80%): Gray
- **warning** (80-95%): Amber
- **danger** (95-100%): Red
- **exceeded** (>100%): Dark red, bold

**Inputs:**
- `field` (required) - The Signal Forms field
- `maxLength` (required) - Maximum character limit
- `showLimitColors` (boolean, default: `true`) - Enable color progression
- `colorThresholds` (object, default: `{ warning: 80, danger: 95 }`) - Custom thresholds

**For complete API, CSS custom properties, and examples, see [Form Field Documentation](./form-field/README.md#ngxsignalformfieldcharactercountcomponent)**

### Utilities

```typescript
// Compute error visibility
computeShowErrors<T>(
  field: ReactiveOrStatic<FieldState<T>>,
  strategy: ReactiveOrStatic<ErrorDisplayStrategy>,
  submittedStatus: ReactiveOrStatic<SubmittedStatus>
): Signal<boolean>

// SubmittedStatus type from Angular Signal Forms
type SubmittedStatus = 'unsubmitted' | 'submitting' | 'submitted';

// Convenience wrapper
showErrors<T>(...): Signal<boolean>

// Field name resolution
resolveFieldName(element: HTMLElement, injector: Injector): string | null
generateErrorId(fieldName: string): string
generateWarningId(fieldName: string): string
```

## Development

```bash
# Run tests
pnpm nx test toolkit

# Build library
pnpm nx build toolkit

# Run tests with coverage
pnpm nx test toolkit --coverage
```

## Documentation

For complete documentation and examples, see the [main repository README](../../README.md).

## License

MIT © [ngx-signal-forms](https://github.com/ngx-signal-forms/ngx-signal-forms)
````
