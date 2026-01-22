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

> **Note**: Angular Signal Forms' `[formField]` directive automatically marks fields as touched on blur. No additional directive needed for touch tracking.

## Quick Start

```typescript
// 1. Configure (optional)
import { provideNgxSignalFormsConfig } from '@ngx-signal-forms/toolkit';

export const appConfig: ApplicationConfig = {
  providers: [
    provideNgxSignalFormsConfig({
      defaultErrorStrategy: 'on-touch',
    }),
  ],
};
```

```typescript
// 2. Use in components (recommended: bundle import)
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';
import { NgxSignalFormFieldComponent } from '@ngx-signal-forms/toolkit/form-field';
import {
  form,
  schema,
  required,
  submit,
  FormField,
} from '@angular/forms/signals';

@Component({
  imports: [FormField, NgxSignalFormToolkit, NgxSignalFormFieldComponent],
  template: `
    <!-- ✅ NO [ngxSignalForm] needed for default 'on-touch' strategy! -->
    <form (submit)="handleSubmit($event)">
      <ngx-signal-form-field [formField]="contactForm.email" fieldName="email">
        <label for="email">Email</label>
        <input id="email" [formField]="contactForm.email" />
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
   * IMPORTANT: Signal Forms use native DOM submit event, NOT ngSubmit.
   * - Template binding: (submit)="handleSubmit($event)" with event parameter
   * - Must call event.preventDefault() to prevent page reload
   * - Automatically marks all fields as touched
   * - Only executes callback when form is VALID
   */
  protected async handleSubmit(event: Event): Promise<void> {
    event.preventDefault();
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

> **Important:** Angular Signal Forms use native DOM `submit` event, NOT `ngSubmit` (which is from Reactive/Template-driven forms).
>
> Always use `(submit)="handleSubmit($event)"` with `event.preventDefault()` in your handler to prevent page reload.

### ⚠️ Critical: The `novalidate` Attribute

Signal Forms do **NOT** automatically disable HTML5 form validation like Angular's Reactive Forms do. The toolkit handles this automatically when you import `NgxSignalFormToolkit`.

**What happens without `novalidate`:**

1. User types invalid input (e.g., bad email format)
2. Browser's HTML5 validation bubble appears
3. User blurs the field → toolkit's validation error also appears
4. User sees **BOTH** error messages (confusing!)
5. Your carefully designed error UX is undermined

**Automatic `novalidate` (when NgxSignalFormToolkit is imported):**

The directive has selector `form[ngxSignalForm], form(submit)` — meaning `novalidate` is **automatically added** to ANY form with a `(submit)` handler:

```html
<!-- ✅ novalidate auto-applied (has submit handler) -->
<form (submit)="handleSubmit($event)">
  <input [formField]="form.email" />
</form>

<!-- ✅ novalidate auto-applied + full form context -->
<form [ngxSignalForm]="userForm" (submit)="handleSubmit($event)">
  <ngx-signal-form-error [formField]="userForm.email" fieldName="email" />
</form>
```

**When do you need `[ngxSignalForm]` binding?**

The `[ngxSignalForm]` binding provides **form context** for child components via dependency injection. However, for the **default `'on-touch'` strategy**, error components work **without** `[ngxSignalForm]` because they only need `field.invalid() && field.touched()`.

#### Feature Comparison: With vs Without `[ngxSignalForm]`

| Feature                                    | Without `[ngxSignalForm]` | With `[ngxSignalForm]` |
| ------------------------------------------ | :-----------------------: | :--------------------: |
| Auto `novalidate` on form                  |            ✅             |           ✅           |
| Auto `aria-invalid` when touched + invalid |            ✅             |           ✅           |
| Auto `aria-describedby` linking            |            ✅             |           ✅           |
| `<ngx-signal-form-error>` (`'on-touch'`)   |         ✅ Works          |        ✅ Works        |
| `<ngx-signal-form-field>` (`'on-touch'`)   |      ✅ Auto errors       |     ✅ Auto errors     |
| `<ngx-signal-form-error>` (`'on-submit'`)  |       ❌ No context       |        ✅ Works        |
| Form-level `[errorStrategy]` override      |            ❌             |           ✅           |
| `submittedStatus` signal via DI            |            ❌             |           ✅           |

**Key insight:** The `'on-touch'` strategy only checks `field.invalid() && field.touched()`. Since Angular's `submit()` helper calls `markAllAsTouched()`, errors appear after both blur AND submit - without needing `submittedStatus`.

#### When to Use Each Approach

**Minimal Toolkit** (without `[ngxSignalForm]`) — Use when:

- You want automatic ARIA attributes and error display with `'on-touch'` strategy
- You're gradually migrating an existing form
- Your design system uses the default error display timing
- **Works for most use cases!**

**Full Toolkit** (with `[ngxSignalForm]`) — Use when:

- You need `'on-submit'` error strategy (requires `submittedStatus`)
- You need form-level `[errorStrategy]` override
- You need `submittedStatus` in custom components
- You're building complex multi-step forms

#### Example: Minimal Toolkit (Error Components Work!)

```typescript
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';
import { NgxSignalFormFieldComponent } from '@ngx-signal-forms/toolkit/form-field';

@Component({
  imports: [FormField, NgxSignalFormToolkit, NgxSignalFormFieldComponent],
  template: `
    <!-- ✅ Error components work WITHOUT [ngxSignalForm] for 'on-touch' strategy -->
    <form (submit)="handleSubmit($event)">
      <ngx-signal-form-field [formField]="form.email" fieldName="email">
        <label for="email">Email</label>
        <input id="email" [formField]="form.email" />
      </ngx-signal-form-field>
      <button type="submit">Submit</button>
    </form>
  `,
})
```

#### Example: Full Toolkit (For `'on-submit'` Strategy)

```html
<!-- Use [ngxSignalForm] when you need 'on-submit' strategy or submittedStatus -->
<form
  [ngxSignalForm]="userForm"
  [errorStrategy]="'on-submit'"
  (submit)="handleSubmit($event)"
>
  <ngx-signal-form-error [formField]="userForm.email" fieldName="email" />
</form>
```

### Alternative: Individual Imports

If you only need specific directives or components, you can import them individually:

```typescript
import {
  ngxSignalFormDirective,
  NgxSignalFormErrorComponent
} from '@ngx-signal-forms/toolkit';

@Component({
  imports: [FormField, ngxSignalFormDirective, NgxSignalFormErrorComponent],
  template: `
    <form [ngxSignalForm]="myForm" (submit)="handleSubmit($event)">
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
import type {
  NgxSignalFormsConfig,
  ErrorDisplayStrategy,
} from '@ngx-signal-forms/toolkit';

// Core - Bundle import (recommended)
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';

// Core - Individual imports (alternative)
import {
  ngxSignalFormDirective,
  NgxSignalFormErrorComponent,
  NgxSignalFormAutoAriaDirective,
  // Error display utilities
  showErrors,
  combineShowErrors,
  computeShowErrors,
  shouldShowErrors,
  // Context injection functions (CIFs)
  injectFormContext,
  injectFormConfig,
  // Reactive utilities
  unwrapValue,
} from '@ngx-signal-forms/toolkit';

// Form field wrapper with enhanced components
import {
  NgxSignalFormFieldComponent,
  NgxSignalFormFieldsetComponent,
  NgxFloatingLabelDirective,
  NgxSignalFormFieldHintComponent,
  NgxSignalFormFieldCharacterCountComponent,
} from '@ngx-signal-forms/toolkit/form-field';
```

### Bundle Constant

#### NgxSignalFormToolkit

The `NgxSignalFormToolkit` constant provides a convenient way to import all essential directives and components:

```typescript
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';

@Component({
  imports: [FormField, NgxSignalFormToolkit],
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
  defaultFormFieldAppearance?: 'default' | 'outline'; // Default: undefined
  fieldNameResolver?: (el: HTMLElement) => string | null;
  strictFieldResolution: boolean; // Default: false
  debug: boolean; // Default: false
}

type ErrorDisplayStrategy = 'immediate' | 'on-touch' | 'on-submit' | 'manual';
```

**`defaultFormFieldAppearance`** - Set global default appearance for all form fields:

```typescript
// Apply outlined style to all form fields by default
export const appConfig: ApplicationConfig = {
  providers: [
    provideNgxSignalFormsConfig({
      defaultFormFieldAppearance: 'outline',
    }),
  ],
};
```

When set, all `NgxSignalFormFieldComponent` instances will use this appearance unless explicitly overridden with the `outline` attribute. This is useful for maintaining consistent form styling across your application without manually adding `outline` to each field.

**Priority:** Explicit `outline` attribute > `defaultFormFieldAppearance` config > implicit default

### Automatic Status Classes

Angular 21.1+ introduces `provideSignalFormsConfig` for managing status classes. The toolkit provides helpers to align these CSS classes (like `ng-invalid` or `is-invalid`) with your error display strategy.

#### The Problem: CSS vs Error Message Mismatch

By default, Angular Signal Forms applies CSS status classes **immediately** when you type:

- Field becomes invalid → `ng-invalid` class applied → Red border appears
- But with toolkit's default `'on-touch'` strategy → Error message only shows after blur

**Result:** Users see a red border while typing, but no error message explaining what's wrong (poor UX).

**Visual example:**

```
❌ Default Behavior (Bad UX):
┌─────────────────────────────┐
│ Email [red border]          │  ← Red border from ng-invalid
└─────────────────────────────┘
                                 ← No error message yet!

User thinks: "Why is this red? What did I do wrong?"
```

```
✅ With Toolkit Alignment (Good UX):
┌─────────────────────────────┐
│ Email [normal border]       │  ← Normal border while typing
└─────────────────────────────┘

[User blurs field]

┌─────────────────────────────┐
│ Email [red border]          │  ← Red border + error appear together
└─────────────────────────────┘
⚠️ Please enter a valid email   ← Error message explains the issue
```

#### When You Need This

**You NEED this if:**

- ✅ You use CSS that targets `ng-invalid`, `ng-valid`, etc. classes
- ✅ You use a CSS framework that styles forms based on these classes (Bootstrap, Tailwind)
- ✅ Your form fields have visual states (red borders, colored text) based on validity

**You DON'T need this if:**

- ❌ You don't style forms based on `ng-*` classes
- ❌ You manually add `[class.invalid]` bindings in your templates
- ❌ All your validation feedback is text-only (no colored borders/backgrounds)

#### How to Use: Two Approaches

**Approach 1: Utility Function (Recommended - More Flexible)**

Use this when you need to configure other Signal Forms options or want full composability:

```typescript
import { provideSignalFormsConfig } from '@angular/forms/signals';
import { ngxStatusClasses } from '@ngx-signal-forms/toolkit';

export const appConfig: ApplicationConfig = {
  providers: [
    provideSignalFormsConfig({
      // Toolkit generates the classes config
      classes: ngxStatusClasses({
        strategy: 'on-touch', // Syncs with toolkit's error display (default)

        // Optional: Customize class names
        invalidClass: 'is-invalid', // Use 'is-invalid' instead of 'ng-invalid'
        validClass: 'is-valid',
        touchedClass: 'is-touched',
      }),

      // You can add other Angular Signal Forms config here
      // (future Angular features can be added without changing this)
    }),
  ],
};
```

**Approach 2: Convenience Provider (Simpler - Status Classes Only)**

Use this when you ONLY need status classes and nothing else:

```typescript
import { provideNgxStatusClasses } from '@ngx-signal-forms/toolkit';

export const appConfig: ApplicationConfig = {
  providers: [
    // Simpler: just provide status classes
    provideNgxStatusClasses({
      strategy: 'on-touch',
      invalidClass: 'is-invalid',
    }),
  ],
};
```

#### Configuration Options

```typescript
interface NgxStatusClassesOptions {
  /** When to apply status classes (default: 'on-touch') */
  strategy?: 'on-touch' | 'immediate';

  /** Class names (all optional, defaults shown) */
  validClass?: string; // Default: 'ng-valid'
  invalidClass?: string; // Default: 'ng-invalid'
  touchedClass?: string; // Default: 'ng-touched'
  untouchedClass?: string; // Default: 'ng-untouched'
  dirtyClass?: string; // Default: 'ng-dirty'
  pristineClass?: string; // Default: 'ng-pristine'
}
```

**Strategy behavior:**

- **`'on-touch'` (default):** Classes applied only after field is touched (blurred or form submitted)
  - Matches toolkit's default error display strategy
  - Best for progressive disclosure (show errors after user interaction)

- **`'immediate'`:** Classes applied as soon as field becomes invalid
  - Matches standard Angular behavior
  - Use when you want instant visual feedback

#### Common Use Cases

**Bootstrap/Tailwind Forms:**

```typescript
// Bootstrap uses 'is-invalid' and 'is-valid' classes
provideSignalFormsConfig({
  classes: ngxStatusClasses({
    strategy: 'on-touch',
    invalidClass: 'is-invalid',
    validClass: 'is-valid',
  }),
});
```

```css
/* Now your Bootstrap forms work correctly with on-touch strategy */
.form-control.is-invalid {
  border-color: #dc3545;
}
```

**Material Design Inspired:**

```typescript
provideNgxStatusClasses({
  strategy: 'on-touch',
  invalidClass: 'mdc-text-field--invalid',
  validClass: 'mdc-text-field--valid',
});
```

**Custom Design System:**

```typescript
provideSignalFormsConfig({
  classes: ngxStatusClasses({
    strategy: 'on-touch',
    invalidClass: 'field-error',
    validClass: 'field-success',
    touchedClass: 'field-interacted',
  }),
});
```

#### ⚠️ Important: Don't Mix Approaches

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
// If you only need classes:
providers: [provideNgxStatusClasses({ strategy: 'on-touch' })];

// If you need classes + other config:
providers: [
  provideSignalFormsConfig({
    classes: ngxStatusClasses({ strategy: 'on-touch' }),
    // other config here
  }),
];
```

#### Migration from Standard Angular

**Before (standard Angular 21.1+):**

```typescript
import {
  provideSignalFormsConfig,
  NG_STATUS_CLASSES,
} from '@angular/forms/signals';

providers: [
  provideSignalFormsConfig({
    classes: NG_STATUS_CLASSES, // Applies ng-invalid immediately
  }),
];
```

```
Result: Red border appears immediately, error shows on-touch (mismatch!)
```

**After (with toolkit alignment):**

```typescript
import { provideSignalFormsConfig } from '@angular/forms/signals';
import { ngxStatusClasses } from '@ngx-signal-forms/toolkit';

providers: [
  provideSignalFormsConfig({
    classes: ngxStatusClasses({ strategy: 'on-touch' }), // Synced!
  }),
];
```

```
Result: Red border AND error both appear on-touch (consistent UX!)
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
            minLength: (params as { minLength: number }).minLength,
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

| Validator   | Default Message                           |
| ----------- | ----------------------------------------- |
| `required`  | "This field is required"                  |
| `email`     | "Please enter a valid email address"      |
| `minLength` | "Minimum {minLength} characters required" |
| `maxLength` | "Maximum {maxLength} characters allowed"  |
| `min`       | "Minimum value is {min}"                  |
| `max`       | "Maximum value is {max}"                  |
| `pattern`   | "Invalid format"                          |

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
    <ngx-signal-form-error [formField]="form.email" fieldName="email" />
    <!-- Error messages come from Zod automatically! -->
  `,
})
export class MyComponent {
  protected readonly form = zodToSignal(
    signal({ email: '' }),
    z.object({
      email: z
        .string()
        .min(1, 'Email is required')
        .email('Invalid email format'),
    }),
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
    <ngx-signal-form-error [formField]="form.email" fieldName="email" />
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
  [errorKind: string]:
    | string
    | ((params: Record<string, unknown>) => string)
    | undefined;
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
  configOrFactory: ErrorMessageRegistry | (() => ErrorMessageRegistry),
): Provider;
```

---

## Form Field Components

The toolkit includes a complete form field component system for enhanced layouts and accessibility:

### Quick Overview

```typescript
import {
  NgxSignalFormFieldComponent,
  NgxSignalFormFieldsetComponent,
  NgxFloatingLabelDirective,
  NgxSignalFormFieldHintComponent,
  NgxSignalFormFieldCharacterCountComponent,
} from '@ngx-signal-forms/toolkit/form-field';
```

**Key Features:**

- **NgxSignalFormFieldComponent** - Reusable wrapper with automatic error display
- **NgxSignalFormFieldsetComponent** - Group related fields with aggregated error/warning display
- **NgxFloatingLabelDirective** (`outline` attribute) - Material Design outlined layout
- **NgxSignalFormFieldCharacterCountComponent** - Progressive color states (ok → warning → danger → exceeded)
- **NgxSignalFormFieldHintComponent** - Helper text display

### Example Usage

```html
<ngx-signal-form-field [formField]="form.bio" outline>
  <label for="bio">Bio</label>
  <textarea id="bio" [formField]="form.bio"></textarea>
  <ngx-signal-form-field-hint
    >Tell us about yourself</ngx-signal-form-field-hint
  >
  <ngx-signal-form-field-character-count
    [formField]="form.bio"
    [maxLength]="500"
  />
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
<ngx-signal-form-field [formField]="form.bio">
  <label for="bio">Bio</label>
  <textarea id="bio" [formField]="form.bio"></textarea>

  <!-- User sees remaining count, preventing paste surprises -->
  <ngx-signal-form-field-character-count
    [formField]="form.bio"
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
      message: 'Maximum 500 characters allowed',
    });
  }
  return null;
});
```

```html
<!-- No maxlength attribute = no silent truncation -->
<textarea id="bio" [formField]="form.bio"></textarea>
```

**Benefits:**

- No silent truncation
- Clear error message when limit exceeded
- More control over validation logic

**Option 3: Skip Validator Entirely**

```html
<!-- No validation at all - user can enter any amount -->
<textarea id="bio" [formField]="form.bio"></textarea>
```

⚠️ **Not recommended** - Better to use Option 1 or 2

#### Other Validators with HTML Attributes

| Validator     | HTML Attribute    | Effect                        | Risk                          |
| ------------- | ----------------- | ----------------------------- | ----------------------------- |
| `maxLength()` | `maxlength="n"`   | Text truncates at n chars     | ⚠️ Silent truncation on paste |
| `min()`       | `min="n"`         | Number input won't accept < n | ✅ Clear validation           |
| `max()`       | `max="n"`         | Number input won't accept > n | ✅ Clear validation           |
| `pattern()`   | `pattern="regex"` | HTML5 validation only         | ✅ Clear validation           |

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
- Tracks submission lifecycle (`submittedStatus` signal) using reactive effects
- Provides form context to child directives/components
- Manages error display strategy

```html
<form
  [ngxSignalForm]="myForm"
  [errorStrategy]="'on-touch'"
  (submit)="handleSubmit($event)"
>
  <!-- form fields -->
  <button type="submit">Submit</button>
</form>
```

**Template Reference:**

```html
<form [ngxSignalForm]="myForm" #formDir="ngxSignalForm">
  <!-- Access directive instance (SubmittedStatus derived from submitting() transitions) -->
  <div>Status: {{ formDir.submittedStatus() }}</div>
</form>
```

```typescript
/**
 * Form submission using native DOM submit event.
 * Signal Forms do NOT use ngSubmit - that's for Reactive/Template forms.
 */
protected async handleSubmit(event: Event): Promise<void> {
  event.preventDefault();
  await submit(this.myForm, async () => {
    // Handle submission
    console.log('Form data:', this.model());
    return null; // No server errors
  });
}
```

> **Note:** Angular Signal Forms use native DOM `submit` event. Always include `event.preventDefault()` to prevent page reload.

### Form Reset Behavior

**⚠️ Important:** Angular Signal Forms' `reset()` method resets **control states only**, not data values. This is a common source of confusion.

**What `reset()` actually does:**

- Sets `touched()` → `false`
- Sets `dirty()` → `false`
- Derived `submittedStatus` → `'unsubmitted'` (because touched/submitting become false)
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

Automatically applied to `input[formField]`, `textarea[formField]`, `select[formField]` elements.

**Key Features:**

- **Smart Validation State**: `aria-invalid` respects your `ErrorDisplayStrategy` (e.g., only shows invalid after touch if strategy is `'on-touch'`).
- **Additive Description**: Preserves any existing `aria-describedby` values (e.g. static help text) and appends error IDs when needed.
- **Reference Linking**: Links inputs to error messages via `aria-describedby` for screen readers.

> **Important:** This directive must be imported to activate. While it has an automatic selector, Angular standalone components require explicit imports. Use `NgxSignalFormToolkit` bundle or import `NgxSignalFormAutoAriaDirective` individually.

```typescript
// With bundle (recommended)
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';
@Component({ imports: [FormField, NgxSignalFormToolkit] })

// Or individual import
import { NgxSignalFormAutoAriaDirective } from '@ngx-signal-forms/toolkit';
@Component({ imports: [FormField, NgxSignalFormAutoAriaDirective] })
```

### Components

#### NgxSignalFormErrorComponent

```html
<ngx-signal-form-error [formField]="form.email" fieldName="email" />
```

**Note:** When used inside a form with `ngxSignalFormDirective`, the `submittedStatus` signal is automatically injected. The toolkit derives this from Angular's native `submitting()` signal transitions.

#### NgxSignalFormFieldComponent

```html
<ngx-signal-form-field
  [formField]="form.email"
  fieldName="email"
  [strategy]="'on-touch'"
>
  <label>Email</label>
  <input [formField]="form.email" />
</ngx-signal-form-field>
```

#### NgxFloatingLabelDirective

Transforms the form field into an outlined layout where the label appears inside the input container, matching Material Design outlined input patterns.

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

**Inputs:**

- `showRequiredMarker` (boolean, default: `true`) - Show required field marker
- `requiredMarker` (string, default: `' *'`) - Custom marker character(s)

**Browser Support:** Chrome 105+, Firefox 121+, Safari 15.4+, Edge 105+ (95%+ coverage)

**For complete API, CSS custom properties, and examples, see [Form Field Documentation](./form-field/README.md#ngxfloatinglabeldirective)**

#### NgxSignalFormFieldHintComponent

Displays helper text for form fields.

```html
<ngx-signal-form-field [formField]="form.phone" outline>
  <label for="phone">Phone Number</label>
  <input id="phone" [formField]="form.phone" />
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
<ngx-signal-form-field [formField]="form.bio" outline>
  <label for="bio">Bio</label>
  <textarea id="bio" [formField]="form.bio"></textarea>
  <ngx-signal-form-field-character-count [formField]="form.bio" />
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
  [formField]="form.bio"
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

#### NgxSignalFormFieldsetComponent

Groups related form fields with **aggregated error/warning display**. Similar to HTML `<fieldset>`, but with validation message aggregation and deduplication.

**Basic Usage - Group with Aggregated Errors:**

```html
<ngx-signal-form-fieldset [fieldsetField]="form.address" fieldsetId="address">
  <legend class="fieldset-legend">Shipping Address</legend>

  <ngx-signal-form-field [formField]="form.address.street" outline>
    <label for="street">Street</label>
    <input id="street" [formField]="form.address.street" />
  </ngx-signal-form-field>

  <ngx-signal-form-field [formField]="form.address.city" outline>
    <label for="city">City</label>
    <input id="city" [formField]="form.address.city" />
  </ngx-signal-form-field>

  <!-- Aggregated errors appear at bottom of fieldset -->
</ngx-signal-form-fieldset>
```

**Attribute Selector Usage (recommended for semantic fieldsets):**

```html
<fieldset
  ngxSignalFormFieldset
  [fieldsetField]="form.address"
  fieldsetId="address"
>
  <legend class="fieldset-legend">Shipping Address</legend>
  <!-- Fields content -->
</fieldset>
```

**Non-fieldset Wrapper Usage (when fieldset semantics do not apply):**

```html
<div ngxSignalFormFieldset [fieldsetField]="form.address" fieldsetId="address">
  <!-- Fields content -->
</div>
```

**Custom Field Collection:**

```html
<!-- Override which fields to aggregate errors from -->
<ngx-signal-form-fieldset
  [fieldsetField]="form"
  [fields]="[form.password, form.confirmPassword]"
  fieldsetId="passwords"
>
  <!-- Fields content -->
</ngx-signal-form-fieldset>
```

**Features:**

- ✅ **Aggregated Errors**: Collects errors from all nested fields via `errorSummary()`
- ✅ **Deduplication**: Same error message shown only once even if multiple fields have it
- ✅ **Warning Support**: Non-blocking warnings (with `warn:` prefix) shown when no errors exist
- ✅ **WCAG 2.2 Compliant**: Errors use `role="alert"`, warnings use `role="status"`
- ✅ **Strategy Aware**: Respects `ErrorDisplayStrategy` from form context or input

**Inputs:**

- `fieldsetField` (required) - The Signal Forms field tree to aggregate errors from
- `fields` (optional) - Explicit list of fields for custom groupings
- `fieldsetId` (optional) - Unique identifier for generating error/warning IDs
- `strategy` (optional) - Error display strategy (`'immediate'` | `'on-touch'` | `'on-submit'` | `'inherit'`)
- `showErrors` (boolean, default: `true`) - Whether to display aggregated error messages

**Host CSS Classes:**

- `.ngx-signal-form-fieldset` - Always applied
- `.ngx-signal-form-fieldset--invalid` - Applied when showing errors
- `.ngx-signal-form-fieldset--warning` - Applied when showing warnings (no errors)

**CSS Custom Properties:**

```css
ngx-signal-form-fieldset {
  /* Layout */
  --ngx-signal-form-fieldset-gap: 1rem; /* Gap between fields */
  --ngx-signal-form-fieldset-padding: 1rem; /* Content padding */

  /* Border styling for invalid state */
  --ngx-signal-form-fieldset-invalid-border: 2px solid #dc2626;
  --ngx-signal-form-fieldset-warning-border: 2px solid #f59e0b;

  /* Background */
  --ngx-signal-form-fieldset-bg: transparent;
  --ngx-signal-form-fieldset-invalid-bg: rgba(220, 38, 38, 0.05);
  --ngx-signal-form-fieldset-warning-bg: rgba(245, 158, 11, 0.05);
}
```

**Why use fieldsets over individual field errors?**

- Group validation (e.g., "password must match confirm password") applies to multiple fields
- Reduces visual noise when many fields have the same validation rule
- Better UX for complex forms with related field groups (addresses, passwords, etc.)

**For complete API, CSS custom properties, and examples, see [Form Field Documentation](./form-field/README.md#ngxsignalformfieldsetcomponent)**

### Utilities

#### Focus Management

```typescript
// Focus first invalid field after failed submission
import { focusFirstInvalid } from '@ngx-signal-forms/toolkit';

protected save(): void {
  if (this.userForm().invalid()) {
    focusFirstInvalid(this.userForm);
  }
}
```

**How it works (Angular 21.1+):**

- Uses `errorSummary()` to get all validation errors (including nested fields)
- Calls native `focusBoundControl()` on the first error's `fieldTree`
- Custom controls must implement a `focus()` method for this to work

**Why use this over direct `focusBoundControl()`:**

- ✅ Single function call handles error lookup + focus
- ✅ Returns `boolean` to indicate success/failure
- ✅ Graceful handling when `focusBoundControl()` is unavailable

#### Submission State Helpers

```typescript
// Convenience computed signals for common submission states
import {
  canSubmit,
  isSubmitting,
  hasSubmitted,
} from '@ngx-signal-forms/toolkit';

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
  `,
})
export class MyFormComponent {
  protected readonly canSubmit = canSubmit(this.userForm);
  protected readonly isSubmitting = isSubmitting(this.userForm);
  protected readonly hasSubmitted = hasSubmitted(this.userForm);
}
```

**Enhancement over Angular Signal Forms:**

- ✅ Angular Signal Forms: Provides `valid()`, `submitting()`, `touched()` signals
- ✅ Toolkit: Derives `submittedStatus` from native `submitting()` signal transitions
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
// NOTE: Requires injection context (uses effect() internally)
hasSubmitted(formTree: FieldTree<unknown>): Signal<boolean>
```

> **Note:** `hasSubmitted()` uses `effect()` internally to track state transitions. It must be called within an **injection context** (property initializer or constructor).

#### Error Display Utilities

```typescript
// Compute error visibility (reactive - returns Signal<boolean>)
computeShowErrors<T>(
  field: ReactiveOrStatic<FieldState<T>>,
  strategy: ReactiveOrStatic<ErrorDisplayStrategy>,
  submittedStatus: ReactiveOrStatic<SubmittedStatus>
): Signal<boolean>

// SubmittedStatus type from Angular Signal Forms
type SubmittedStatus = 'unsubmitted' | 'submitting' | 'submitted';

// Convenience wrapper (most common usage)
showErrors<T>(
  field: FieldTree<T>,
  strategy: ErrorDisplayStrategy,
  submittedStatus: Signal<SubmittedStatus>
): Signal<boolean>

// Combine multiple error visibility signals (OR logic)
combineShowErrors(signals: Signal<boolean>[]): Signal<boolean>

// Non-reactive check (for imperative code)
shouldShowErrors(
  fieldState: FieldState<unknown>,
  strategy: ErrorDisplayStrategy,
  submittedStatus: SubmittedStatus
): boolean

// Field name resolution
resolveFieldName(element: HTMLElement, injector: Injector): string | null
generateErrorId(fieldName: string): string
generateWarningId(fieldName: string): string
```

**Usage Examples:**

```typescript
import {
  showErrors,
  combineShowErrors,
  computeShowErrors,
  shouldShowErrors,
} from '@ngx-signal-forms/toolkit';

// Simple usage - most common
protected readonly emailShowErrors = showErrors(
  this.userForm.email,
  'on-touch',
  this.submittedStatus,
);

// Check if ANY field should show errors
protected readonly showAnyErrors = combineShowErrors([
  showErrors(this.userForm.email, 'on-touch', this.submittedStatus),
  showErrors(this.userForm.password, 'on-touch', this.submittedStatus),
]);

// Imperative check (non-reactive)
if (shouldShowErrors(this.userForm.email(), 'on-touch', 'submitted')) {
  // Field should display errors
}
```

#### Context Injection Functions (CIFs)

CIFs provide access to toolkit context in custom directives and components.

```typescript
import { injectFormContext, injectFormConfig } from '@ngx-signal-forms/toolkit';
```

**injectFormContext()**

Injects the form context provided by `NgxSignalFormDirective`. Returns `undefined` if not inside a form with the directive.

```typescript
import { injectFormContext } from '@ngx-signal-forms/toolkit';

@Directive({ selector: '[myCustomDirective]' })
export class MyCustomDirective {
  readonly #formContext = injectFormContext();

  constructor() {
    if (this.#formContext) {
      // Access form context
      console.log('Form:', this.#formContext.form);
      console.log('Strategy:', this.#formContext.errorStrategy());
      console.log('Status:', this.#formContext.submittedStatus());
    }
  }
}
```

**injectFormConfig()**

Injects the global toolkit configuration. Returns normalized config with defaults applied.

```typescript
import { injectFormConfig } from '@ngx-signal-forms/toolkit';

@Component({
  /* ... */
})
export class MyComponent {
  readonly #config = injectFormConfig();

  constructor() {
    console.log('Auto ARIA:', this.#config.autoAria);
    console.log('Default strategy:', this.#config.defaultErrorStrategy);
    console.log('Debug mode:', this.#config.debug);
  }
}
```

**Optional injector parameter:**

Both CIFs accept an optional `Injector` parameter for use outside injection context:

```typescript
// Inside injection context (normal usage)
const context = injectFormContext();

// Outside injection context (e.g., in a callback)
const context = injectFormContext(this.injector);
```

#### Reactive Utilities

**unwrapValue()**

Extracts the current value from a `ReactiveOrStatic<T>` type. Useful for normalizing values that may be signals, functions, or static values.

```typescript
import { unwrapValue } from '@ngx-signal-forms/toolkit';
import type { ReactiveOrStatic } from '@ngx-signal-forms/toolkit';

function processStrategy(strategy: ReactiveOrStatic<ErrorDisplayStrategy>) {
  // Works with signal, function, or static value
  const currentStrategy = unwrapValue(strategy);
  // currentStrategy is now ErrorDisplayStrategy (not Signal or function)
}

// Example usage
const staticStrategy: ReactiveOrStatic<ErrorDisplayStrategy> = 'on-touch';
const signalStrategy: ReactiveOrStatic<ErrorDisplayStrategy> =
  signal('on-touch');
const computedStrategy: ReactiveOrStatic<ErrorDisplayStrategy> = computed(
  () => 'on-touch',
);

unwrapValue(staticStrategy); // 'on-touch'
unwrapValue(signalStrategy); // 'on-touch'
unwrapValue(computedStrategy); // 'on-touch'
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
