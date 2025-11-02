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

### ⚠️ Critical: The `novalidate` Attribute

Signal Forms do **NOT** automatically disable HTML5 form validation like Angular's Reactive Forms do. However, the `[ngxSignalForm]` directive automatically adds the `novalidate` attribute to prevent conflicts.

**What happens without `novalidate`:**

1. User types invalid input (e.g., bad email format)
2. Browser's HTML5 validation bubble appears
3. User blurs the field → toolkit's validation error also appears
4. User sees **BOTH** error messages (confusing!)
5. Your carefully designed error UX is undermined

**When is `novalidate` automatic?**

✅ **With the directive** (automatic):
```html
<form [ngxSignalForm]="userForm" (ngSubmit)="handleSubmit()">
  <!-- novalidate is automatically added -->
</form>
```

⚠️ **Without the directive** (you must add it manually):
```html
<form (ngSubmit)="handleSubmit()" novalidate>
  <!-- You must add novalidate manually -->
</form>
```

❌ **Missing `novalidate`** (browser validation conflicts):
```html
<form (ngSubmit)="handleSubmit()">
  <!-- Browser validation bubbles WILL appear alongside toolkit errors -->
</form>
```

**Best Practice:** Always use `[ngxSignalForm]` directive for automatic `novalidate` handling.

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

### Error Message Configuration

The toolkit provides a flexible error message registry for customizing validation error messages. **Zero-config by default** - Standard Schema libraries (Zod, Valibot, ArkType) already include excellent error messages in the `error.message` property.

#### Philosophy

```typescript
// ✅ RECOMMENDED: Zero-config approach
// Use Standard Schema libraries - they provide great error messages!
import { z } from 'zod';

const userSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

// The toolkit automatically uses error.message from Zod ✨
// No additional configuration needed!
```

#### When to Use Custom Error Messages

Only configure error messages when you need to:

- **Override default toolkit messages** for built-in Angular validators (required, email, minLength, etc.)
- **Centralize messages** across multiple forms for consistency (DRY principle)
- **Support internationalization (i18n)** with dynamic locale switching
- **Match specific design system** or brand voice requirements

**When NOT to use custom error messages:**

- ✅ **Using Zod, Valibot, or ArkType** - These libraries provide excellent error messages out of the box
- ✅ **Simple forms** - Toolkit's default messages are production-ready
- ✅ **Single-language apps** - Default messages are clear and professional

**Real-world use cases:**

1. **Multi-language application** - Use JSON files or ngx-translate for locale-specific messages
2. **Design system requirements** - Match brand voice (e.g., "Oops! Email required" vs. "This field is required")
3. **Centralized validation** - Reuse same messages across 50+ forms without repeating validator messages
4. **Custom validators** - Provide friendly messages for domain-specific validation (e.g., `username_taken`, `password_weak`)

#### 3-Tier Message Priority

The toolkit resolves error messages in this order:

1. **Validator message** (`error.message` property) - **Always checked first!**
2. **Registry override** (from `provideErrorMessages()`) - Fallback if no validator message
3. **Default toolkit message** - Final fallback for built-in Angular validators

#### Basic Usage (Centralized Overrides)

```typescript
import { provideErrorMessages } from '@ngx-signal-forms/toolkit';

export const appConfig: ApplicationConfig = {
  providers: [
    provideErrorMessages({
      // Override built-in Angular validators
      required: 'This field is required',
      email: 'Please enter a valid email address',

      // Factory functions for dynamic messages
      minLength: (params: Record<string, unknown>) =>
        `Minimum ${(params as { minLength: number }).minLength} characters required`,
      maxLength: (params: Record<string, unknown>) =>
        `Maximum ${(params as { maxLength: number }).maxLength} characters allowed`,

      // Custom validators
      phone_invalid: 'Please enter a valid phone number',
      password_weak: 'Password must contain uppercase, lowercase, and numbers',
    }),
  ],
};
```

#### i18n Integration Patterns

**Pattern 1: JSON Files with Locale Injection**

```typescript
// app.config.ts
import { LOCALE_ID } from '@angular/core';
import { provideErrorMessages } from '@ngx-signal-forms/toolkit';

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: LOCALE_ID, useValue: 'en-US' },
    provideErrorMessages(() => {
      const locale = inject(LOCALE_ID);
      // Dynamically import locale-specific messages
      const messages = {
        'en-US': {
          required: 'This field is required',
          email: 'Please enter a valid email',
        },
        'ja-JP': {
          required: 'このフィールドは必須です',
          email: '有効なメールアドレスを入力してください',
        },
      };
      return messages[locale as keyof typeof messages] || messages['en-US'];
    }),
  ],
};
```

**Pattern 2: ngx-translate Integration**

```typescript
import { TranslateService } from '@ngx-translate/core';
import { provideErrorMessages } from '@ngx-signal-forms/toolkit';

export const appConfig: ApplicationConfig = {
  providers: [
    provideErrorMessages(() => {
      const translate = inject(TranslateService);
      return {
        required: translate.instant('ERRORS.REQUIRED'),
        email: translate.instant('ERRORS.EMAIL'),
        minLength: (params: Record<string, unknown>) =>
          translate.instant('ERRORS.MIN_LENGTH', {
            minLength: (params as { minLength: number }).minLength
          }),
      };
    }),
  ],
};
```

**Pattern 3: @angular/localize**

```typescript
import { provideErrorMessages } from '@ngx-signal-forms/toolkit';

export const appConfig: ApplicationConfig = {
  providers: [
    provideErrorMessages({
      required: $localize`:@@error.required:This field is required`,
      email: $localize`:@@error.email:Please enter a valid email`,
      minLength: (params: Record<string, unknown>) => {
        const min = (params as { minLength: number }).minLength;
        return $localize`:@@error.minLength:Minimum ${min} characters required`;
      },
    }),
  ],
};
```

**Pattern 4: TypeScript Message Files**

```typescript
// src/app/i18n/error-messages.ts
import type { ErrorMessageRegistry } from '@ngx-signal-forms/toolkit';

export const errorMessagesEn: ErrorMessageRegistry = {
  required: 'This field is required',
  email: 'Please enter a valid email',
  minLength: (params: Record<string, unknown>) =>
    `Minimum ${(params as { minLength: number }).minLength} characters`,
};

export const errorMessagesJa: ErrorMessageRegistry = {
  required: 'このフィールドは必須です',
  email: '有効なメールアドレスを入力してください',
  minLength: (params: Record<string, unknown>) =>
    `最小${(params as { minLength: number }).minLength}文字`,
};

// app.config.ts
import { LOCALE_ID } from '@angular/core';
import { provideErrorMessages } from '@ngx-signal-forms/toolkit';
import { errorMessagesEn, errorMessagesJa } from './i18n/error-messages';

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: LOCALE_ID, useValue: 'en-US' },
    provideErrorMessages(() => {
      const locale = inject(LOCALE_ID);
      const messages = { 'en-US': errorMessagesEn, 'ja-JP': errorMessagesJa };
      return messages[locale as keyof typeof messages] || errorMessagesEn;
    }),
  ],
};
```

#### Built-in Validator Fallbacks

The toolkit provides default fallback messages for Angular Signal Forms built-in validators:

| Validator | Default Message |
|-----------|----------------|
| `required` | "This field is required" |
| `email` | "Please enter a valid email address" |
| `minLength` | "Minimum {minLength} characters required" |
| `maxLength` | "Maximum {maxLength} characters allowed" |
| `min` | "Minimum value is {min}" |
| `max` | "Maximum value is {max}" |
| `pattern` | "Invalid format" |

**Custom validators** fall back to error kind with underscores replaced by spaces (e.g., `phone_invalid` → "Phone invalid").

#### Migration from Manual Error Mapping

**Before (Manual mapping in template):**

```typescript
@Component({
  template: `
    @if (form.email().invalid() && form.email().touched()) {
      @for (error of form.email().errors(); track error.kind) {
        <div class="error">
          @switch (error.kind) {
            @case ('required') { Email is required }
            @case ('email') { Invalid email format }
            @case ('minLength') { Min {{ error.minLength }} characters }
          }
        </div>
      }
    }
  `
})
```

**After (Zero-config with Zod):**

```typescript
import { z } from 'zod';
import { zodToSignal } from '@ngx-signal-forms/zod';

@Component({
  template: `
    <ngx-signal-form-error [field]="form.email" fieldName="email" />
    <!-- Error messages come from Zod automatically! -->
  `
})
export class MyComponent {
  protected readonly form = zodToSignal(
    signal({ email: '' }),
    z.object({
      email: z.string()
        .min(1, 'Email is required')
        .email('Invalid email format'),
    })
  );
}
```

**After (Centralized registry):**

```typescript
// app.config.ts
provideErrorMessages({
  required: 'Email is required',
  email: 'Invalid email format',
  minLength: (params) => `Min ${(params as any).minLength} characters`,
});

// component.ts
@Component({
  template: `
    <ngx-signal-form-error [field]="form.email" fieldName="email" />
    <!-- Uses centralized messages -->
  `
})
```

#### API Reference

```typescript
/**
 * Error message registry interface.
 * Supports string literals and factory functions.
 */
interface ErrorMessageRegistry {
  [errorKind: string]: string | ((params: Record<string, unknown>) => string) | undefined;
}

/**
 * Injection token for error message registry.
 * Default: Empty object (zero-config)
 */
const NGX_ERROR_MESSAGES: InjectionToken<ErrorMessageRegistry>;

/**
 * Provide custom error messages.
 *
 * @param configOrFactory - Static config object or factory function
 * @returns Provider for error message registry
 */
function provideErrorMessages(
  configOrFactory: ErrorMessageRegistry | (() => ErrorMessageRegistry)
): Provider;
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

### Validator Attributes & HTML5 Truncation

⚠️ **Important:** Some Signal Forms validators add HTML attributes that can affect input behavior, particularly with text truncation.

#### The Silent Truncation Issue with `maxLength()`

When you use `maxLength()` validator, it adds an HTML `maxlength` attribute:

```typescript
maxLength(path.bio, 500);
// Generates: <textarea maxlength="500"></textarea>
```

**Problem:** HTML5 truncates input silently when users paste:

1. User tries to paste 1000 character text
2. Browser silently truncates at 500 chars
3. **No error message shown** (form is valid!)
4. User thinks their full text was accepted
5. Surprise: Their data is incomplete!

#### Solutions

**Option 1: Use Character Count Component (Recommended)** ✅

```typescript
// Keep the validator for validation logic
maxLength(path.bio, 500);
```

```html
<!-- Add character count to show user the limit -->
<ngx-signal-form-field [field]="form.bio">
  <label for="bio">Bio</label>
  <textarea id="bio" [field]="form.bio"></textarea>

  <!-- User sees remaining count, preventing paste surprises -->
  <ngx-signal-form-field-character-count
    [field]="form.bio"
    [maxLength]="500"
  />
</ngx-signal-form-field>
```

**Benefits:**
- User sees remaining character count
- Progressive color change (ok → warning → danger)
- Paste behavior is visible and expected
- Accessible with ARIA attributes

**Option 2: Skip `maxLength()`, Validate in Code Only**

```typescript
// Don't use maxLength validator - no HTML attribute
validate(path.bio, (ctx) => {
  if (ctx.value() && ctx.value().length > 500) {
    return customError({
      kind: 'too_long',
      message: 'Maximum 500 characters allowed'
    });
  }
  return null;
});
```

```html
<!-- No maxlength attribute = no silent truncation -->
<textarea id="bio" [field]="form.bio"></textarea>
```

**Benefits:**
- No silent truncation
- Clear error message when limit exceeded
- More control over validation logic

**Option 3: Skip Validator Entirely**

```html
<!-- No validation at all - user can enter any amount -->
<textarea id="bio" [field]="form.bio"></textarea>
```

⚠️ **Not recommended** - Better to use Option 1 or 2

#### Other Validators with HTML Attributes

| Validator | HTML Attribute | Effect | Risk |
|-----------|---|---|---|
| `maxLength()` | `maxlength="n"` | Text truncates at n chars | ⚠️ Silent truncation on paste |
| `min()` | `min="n"` | Number input won't accept < n | ✅ Clear validation |
| `max()` | `max="n"` | Number input won't accept > n | ✅ Clear validation |
| `pattern()` | `pattern="regex"` | HTML5 validation only | ✅ Clear validation |

**Recommendation:** Use the character count component with `maxLength()` for the best UX.

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

### Form Reset Behavior

**⚠️ Important:** Angular Signal Forms' `reset()` method resets **control states only**, not data values. This is a common source of confusion.

**What `reset()` actually does:**
- Sets `touched()` → `false`
- Sets `dirty()` → `false`
- Sets `submittedStatus()` → `'unsubmitted'`
- **Does NOT change data values** ❌

**To fully reset a form, you must reset BOTH:**

```typescript
// ❌ Incomplete - Only resets form states
this.userForm().reset();
// Form says it's "clean" but still shows old data!

// ✅ Complete - Reset states AND data
this.userForm().reset();
this.#model.set({ email: '', password: '' });
// Now form is truly reset
```

**Example with submission:**

```typescript
protected async handleSubmit(): Promise<void> {
  await submit(this.userForm, async (formData) => {
    try {
      await this.apiService.saveUser(formData().value());

      // ✅ Reset BOTH form states and data after successful submission
      formData().reset();
      this.#model.set(this.createInitialModel());

      return null; // Success
    } catch (error) {
      return [{ kind: 'save_error', message: 'Failed to save' }];
    }
  });
}
```

**Why Signal Forms work this way:**

Signal Forms separate data (your signal) from form state (control states). This design:
- ✅ Gives you control over when data changes
- ✅ Prevents accidental data loss
- ✅ Allows keeping data while resetting form state if needed
- ⚠️ Requires explicit data reset after form reset

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

Displays character count with progressive color states and **automatic limit detection**.

**Auto-Detection (Recommended):**

```typescript
// In form schema - define validation rule
maxLength(path.bio, 500);
```

```html
<!-- Character count automatically detects limit from validation -->
<ngx-signal-form-field [field]="form.bio" outline>
  <label for="bio">Bio</label>
  <textarea id="bio" [field]="form.bio"></textarea>
  <ngx-signal-form-field-character-count [field]="form.bio" />
</ngx-signal-form-field>
```

**Enhancement over Angular Signal Forms:**
- ✅ Angular Signal Forms: Validators add `maxlength` HTML attribute that silently truncates text on paste
- ✅ Toolkit: Auto-detects limit from validation rules (DRY principle)
- ✅ Visual feedback prevents paste truncation surprises
- ✅ Progressive color states guide users (ok → warning → danger)
- ✅ Manual override available when display limit differs from validation

**Manual Override:**

```html
<!-- Display limit is 300, even if validation allows 500 -->
<ngx-signal-form-field-character-count
  [field]="form.bio"
  [maxLength]="300"
/>
```

**Color States:**
- **ok** (0-80%): Gray
- **warning** (80-95%): Amber
- **danger** (95-100%): Red
- **exceeded** (>100%): Dark red, bold

**Inputs:**
- `field` (required) - The Signal Forms field
- `maxLength` (optional) - Maximum character limit (auto-detected if not provided)
- `showLimitColors` (boolean, default: `true`) - Enable color progression
- `colorThresholds` (object, default: `{ warning: 80, danger: 95 }`) - Custom thresholds

**For complete API, CSS custom properties, and examples, see [Form Field Documentation](./form-field/README.md#ngxsignalformfieldcharactercountcomponent)**

### Utilities

#### Focus Management

```typescript
// Focus first invalid field after failed submission
import { focusFirstInvalid } from '@ngx-signal-forms/toolkit/core';

protected save(): void {
  if (this.userForm().invalid()) {
    focusFirstInvalid(this.userForm);
  }
}
```

**Enhancement over Angular Signal Forms:**
- ✅ Angular Signal Forms: Provides field state signals but no focus utilities
- ✅ Toolkit: Automatic focus on first invalid field for better UX and accessibility

#### Submission State Helpers

```typescript
// Convenience computed signals for common submission states
import { canSubmit, isSubmitting, hasSubmitted } from '@ngx-signal-forms/toolkit/core';

@Component({
  template: `
    <button type="submit" [disabled]="!canSubmit()">
      @if (isSubmitting()) {
        <span>Saving...</span>
      } @else {
        <span>Submit</span>
      }
    </button>
    @if (hasSubmitted() && userForm().valid()) {
      <div class="success">Form saved!</div>
    }
  `
})
export class MyFormComponent {
  protected readonly canSubmit = canSubmit(this.userForm);
  protected readonly isSubmitting = isSubmitting(this.userForm);
  protected readonly hasSubmitted = hasSubmitted(this.userForm);
}
```

**Enhancement over Angular Signal Forms:**
- ✅ Angular Signal Forms: Provides `valid()`, `submitting()`, `submittedStatus()` signals
- ✅ Toolkit: Pre-computed helper signals reduce template boilerplate by ~50%
- ✅ Consistent naming convention across applications
- ✅ Type-safe with automatic inference

**API Reference:**

```typescript
// Check if form is valid and not submitting
canSubmit(formTree: FieldTree<unknown>): Signal<boolean>

// Check if form is currently submitting
isSubmitting(formTree: FieldTree<unknown>): Signal<boolean>

// Check if form has completed at least one submission
hasSubmitted(formTree: FieldTree<unknown>): Signal<boolean>
```

#### Error Display Utilities

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
