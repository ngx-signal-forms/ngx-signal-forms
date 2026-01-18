# @ngx-signal-forms/toolkit

> **Zero-intrusive toolkit for Angular Signal Forms**
>
> Directives, components, and utilities that add automatic accessibility, error display strategies, and form field wrappers to Angular's Signal Forms API — without changing the core API.
>
> **Package Structure:**
>
> - `@ngx-signal-forms/toolkit` - **Main package** with core directives, utilities, and form-field wrapper
>   - Primary entry: `@ngx-signal-forms/toolkit` (core directives + utilities)
>   - Secondary entry: `@ngx-signal-forms/toolkit/form-field` (form field wrapper - optional)
>   - Secondary entry: `@ngx-signal-forms/toolkit/testing` (test utilities - optional)
> - `@ngx-signal-forms/vestjs` - **Separate optional library** for Vest.js validation integration
>
> **Additional Resources:**
>
> - [Mastering Angular 21 Signal Forms by Amos Isaila](https://www.codigotipado.com/p/mastering-angular-21-signal-forms) - Comprehensive deep dive with real-world patterns

## Table of Contents

1. [Vision & Philosophy](#vision--philosophy)
2. [Core Features](#core-features)
3. [Architecture Overview](#architecture-overview)
4. [API Design](#api-design)
5. [Implementation Guide](#implementation-guide)
6. [Usage Examples](#usage-examples)
7. [Testing Strategy](#testing-strategy)
8. [Roadmap](#roadmap)

---

## Vision & Philosophy

### What Signal Forms Provides vs What This Library Adds

> **Key Principle**: This library is 100% non-intrusive. It provides directives, components, and utilities that work **alongside** Signal Forms without modifying its core API.

#### Complete Feature Comparison Matrix

| Feature Category           | Signal Forms (Out-of-the-box)                                 | This Library Adds                                                 | Implementation Type         |
| -------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------- | --------------------------- |
| **Form Creation**          | ✅ `form()` function                                          | —                                                                 | —                           |
| **Schema Definition**      | ✅ `schema()` function                                        | —                                                                 | —                           |
| **Validation Rules**       | ✅ Built-in validators (required, email, minLength, etc.)     | —                                                                 | —                           |
| **Standard Schema**        | ✅ Zod/Valibot integration                                    | —                                                                 | —                           |
| **Field State Primitives** | ✅ `touched()`, `dirty()`, `invalid()`, `errors()`, `value()` | —                                                                 | —                           |
| **Manual Touch**           | ✅ `markAsTouched()` method                                   | —                                                                 | —                           |
| **Async Validation**       | ✅ `validateAsync()` with resources                           | —                                                                 | —                           |
| **Control Directive**      | ✅ `[formField]` for two-way binding                          | —                                                                 | —                           |
|                            |                                                               |                                                                   |                             |
| **Auto-Touch on Blur**     | ❌ Manual `(blur)` handlers required                          | ✅ Automatic via directive                                        | Directive (host listener)   |
| **ARIA Attributes**        | ❌ Manual `[attr.aria-invalid]` required                      | ✅ Automatic `aria-invalid` and `aria-describedby`                | Directive (host bindings)   |
| **Error Display Logic**    | ❌ Manual `@if` conditions required                           | ✅ Error display strategies (immediate/on-touch/on-submit/manual) | Utility function + provider |
| **Submission Tracking**    | ❌ No `hasSubmitted` signal                                   | ✅ Automatic submission state tracking                            | Directive (form provider)   |
| **Form Busy State**        | ❌ Manual `aria-busy` required                                | ✅ Automatic `aria-busy` during validation/submission             | Directive (host binding)    |
| **Error Component**        | ❌ Manual error rendering required                            | ✅ Reusable error display component                               | Component                   |
| **Form Field Wrapper**     | ❌ Manual layout per component                                | ✅ Consistent field wrapper with auto-error display               | Component                   |
| **Field Name Resolution**  | ❌ No automatic field identification                          | ✅ 4-tier priority resolution (data-attr/custom/id/name)          | Utility function            |
| **Global Configuration**   | ❌ No configuration system                                    | ✅ Global config for strategies and behavior                      | Provider                    |
| **Testing Utilities**      | ❌ No testing helpers                                         | ✅ Test helpers for common scenarios                              | Utility functions           |

#### Code Comparison: Manual vs With Toolkit

**Signal Forms Alone (Manual Implementation):**

```html
<form (submit)="save($event)" novalidate>
  <label for="email">Email</label>
  <input
    id="email"
    [formField]="userForm.email"
    (blur)="userForm.email().markAsTouched()"
    [attr.aria-invalid]="userForm.email().invalid() ? 'true' : null"
    [attr.aria-describedby]="userForm.email().invalid() ? 'email-error' : null"
  />

  @if (userForm.email().touched() && userForm.email().invalid()) {
  <span id="email-error" role="alert">
    @for (error of userForm.email().errors(); track error.kind) {
    <p>{{ error.message }}</p>
    }
  </span>
  }

  <button type="submit" [attr.aria-busy]="isSubmitting() ? 'true' : null">
    Submit
  </button>
</form>
```

**Signal Forms + This Toolkit (Automatic):**

```html
<form [ngxSignalForm]="userForm" (submit)="save($event)">
  <ngx-signal-form-field [formField]="userForm.email">
    <label for="email">Email</label>
    <input id="email" [formField]="userForm.email" />
    <!-- Auto-touch, auto-ARIA, auto-error display -->
  </ngx-signal-form-field>

  <button type="submit">Submit</button>
  <!-- Auto aria-busy -->
</form>
```

**Lines of Code Reduction**: ~15 lines → ~7 lines (53% reduction)

### Why This Library?

Angular Signal Forms provides excellent validation and reactivity but lacks:

- ❌ **Automatic ARIA attributes** (aria-invalid, aria-describedby)
- ❌ **Touch state management** (blur handlers on every field)
- ❌ **Error display strategies** (when to show errors)
- ❌ **Form field wrappers** (consistent layout + error display)
- ❌ **Form busy state** (aria-busy during async operations)
- ❌ **Accessibility best practices** out-of-the-box

This library fills those gaps while preserving Signal Forms' core philosophy.

### Design Principles

1. **Non-Intrusive**: Enhance, don't replace Signal Forms API
2. **WCAG 2.2 First**: Accessibility by default, not as an afterthought
3. **Progressive Enhancement**: Start simple, add features as needed
4. **Zero Angular Forms**: No dependency on `@angular/forms` (Reactive/Template-driven)
5. **Type-Safe**: Full TypeScript inference from Signal Forms schemas

### Alignment with Signal Forms Philosophy

| Principle             | Signal Forms             | This Library                               |
| --------------------- | ------------------------ | ------------------------------------------ |
| **Source of Truth**   | Model signal             | ✅ Same - no data duplication              |
| **Reactivity**        | Computed signals         | ✅ Same - derived from Signal Forms state  |
| **Validation**        | Schema-based             | ✅ Same - uses Signal Forms validators     |
| **Touch Detection**   | Automatic on blur        | ✅ Same - relies on native behavior        |
| **ARIA Attributes**   | Manual implementation    | ✅ **Enhanced** - automatic via directives |
| **Error Display**     | Manual `@if` blocks      | ✅ **Enhanced** - strategies + components  |
| **Form Field Layout** | Custom CSS per component | ✅ **Enhanced** - reusable wrapper         |

---

## Core Features

### 1. Auto-ARIA Directive

Automatically manages ARIA accessibility attributes based on field state and error display strategy.

**Features:**

- **Smart Validation State**: `aria-invalid` respects your `ErrorDisplayStrategy` (e.g., only shows invalid after touch if strategy is 'on-touch').
- **Additive Description**: Preserves existing `aria-describedby` values and appends error IDs.
- **Reference Linking**: Links inputs to error messages via `aria-describedby` for screen readers.

**Before (Manual):**

```html
<input
  id="email"
  [formField]="userForm.email"
  [attr.aria-invalid]="(userForm.email().touched() && userForm.email().invalid()) ? 'true' : null"
  [attr.aria-describedby]="(userForm.email().touched() && userForm.email().invalid()) ? 'email-error' : null"
/>
<span id="email-error" role="alert">
  {{ userForm.email().errors() | json }}
</span>
```

**After (Automatic):**

```html
<input id="email" [formField]="userForm.email" />
<ngx-signal-form-error [formField]="userForm.email" />
```

### 2. Auto-Touch Handling

**Note:** Angular Signal Forms' `[formField]` directive automatically marks fields as touched on blur. The toolkit relies on this native behavior and does not need a separate directive for touch tracking.

### 3. Error Display Strategies

Control when errors are shown (immediate, on-touch, on-submit, manual).

```typescript
// Error strategy managed via form provider, NOT form() options
// (Signal Forms' form() doesn't accept errorStrategy parameter)

@Component({
  template: `
    <form
      [ngxSignalForm]="userForm"
      [errorStrategy]="errorMode()"
      (submit)="save($event)"
    >
      <!-- form fields -->
    </form>
  `,
})
export class MyComponent {
  protected readonly errorMode = signal<ErrorDisplayStrategy>('on-touch');
  protected readonly model = signal({ email: '', message: '' });
  protected readonly userForm = form(this.model, userSchema);

  protected save(event: Event): void {
    event.preventDefault();
    if (this.userForm().valid()) {
      console.log('Saved:', this.model());
    }
  }
}
```

### 4. Form Field Wrapper

Consistent layout + automatic error display.

```html
<ngx-signal-form-field [formField]="userForm.email">
  <label for="email">Email</label>
  <input id="email" [formField]="userForm.email" />
</ngx-signal-form-field>
```

### 5. Form Busy Directive

Automatic `aria-busy` during async validation/submission.

```html
<form [ngxSignalForm]="userForm" (submit)="save($event)">
  <!-- aria-busy="true" automatically during async -->
  <input [formField]="userForm.email" />
  <button type="submit">Submit</button>
</form>
```

---

## Architecture Overview

> **Core Principle**: 100% non-intrusive enhancement through directives, components, utilities, and providers. Zero modifications to Signal Forms API.

### Package Structure

**Main Package: `@ngx-signal-forms/toolkit`**

```text
@ngx-signal-forms/toolkit/
├── src/
│   ├── core/                         # Core implementation (internal)
│   │   ├── directives/
│   │   │   ├── auto-aria.directive.ts
│   │   │   ├── auto-touch.directive.ts
│   │   │   ├── form-busy.directive.ts
│   │   │   └── form-provider.directive.ts
│   │   ├── components/
│   │   │   └── form-error.component.ts
│   │   ├── utilities/
│   │   │   ├── error-strategies.ts
│   │   │   ├── field-resolution.ts
│   │   │   └── show-errors.ts
│   │   ├── providers/
│   │   │   └── config.provider.ts
│   │   ├── tokens.ts
│   │   └── types.ts
│   ├── form-field/                   # Secondary entry point
│   │   ├── form-field.component.ts
│   │   └── index.ts
│   ├── testing/                      # Secondary entry point
│   │   ├── test-helpers.ts
│   │   └── index.ts
│   └── index.ts                      # Primary entry (core exports)
├── form-field/
│   └── index.ts                      # Secondary entry point re-export
├── testing/
│   └── index.ts                      # Secondary entry point re-export
├── package.json
├── project.json
└── README.md
```

**Separate Package: `@ngx-signal-forms/vestjs`**

```text
@ngx-signal-forms/vestjs/
├── src/
│   ├── validators/                   # Vest.js validators for Signal Forms
│   ├── adapters/                     # Vest.js to Signal Forms adapters
│   └── index.ts
├── package.json
├── project.json
└── README.md
```

**Entry Points:**

- `@ngx-signal-forms/toolkit` - Core directives, utilities, error component (main entry)
- `@ngx-signal-forms/toolkit/form-field` - Form field wrapper component (optional)
- `@ngx-signal-forms/toolkit/testing` - Test utilities (optional, dev dependency)
- `@ngx-signal-forms/vestjs` - Vest.js integration (separate package, can be used alongside toolkit)

### Enhancement Types

| Type           | Examples                                           | How It Enhances Signal Forms                     |
| -------------- | -------------------------------------------------- | ------------------------------------------------ |
| **Directives** | `auto-aria`, `auto-touch`, `form-busy`, `provider` | Host bindings/listeners on Signal Forms controls |
| **Components** | `form-error`, `form-field`                         | Reusable UI for error display and layout         |
| **Utilities**  | `computeShowErrors()`, `fieldNameResolver()`       | Pure functions that work with Signal Forms state |
| **Providers**  | `provideNgxSignalFormsConfig()`, form context      | DI-based configuration and context sharing       |
| **Types**      | `ErrorDisplayStrategy`, `NgxSignalFormsConfig`     | TypeScript types for better DX                   |

### Dependency Graph

```text
@angular/core (peer)
@angular/forms/signals (peer) ← Signal Forms API (unchanged)
        ↓
@ngx-signal-forms/toolkit (main package)
├── Core directives + utilities (primary entry)
├── /form-field (secondary entry - optional)
└── /testing (secondary entry - optional)

@ngx-signal-forms/vestjs (separate package - optional)
├── Depends on: @angular/forms/signals
└── Can be used alongside @ngx-signal-forms/toolkit
```

**Shared Core Usage:**

If needed in the future, core utilities could be extracted to an internal shared package that both `toolkit` and `vestjs` depend on, but for v1.0, the toolkit includes all core functionality.

**Key Points:**

- ✅ No wrapper around Signal Forms API
- ✅ Directives attach to existing `[formField]` bindings
- ✅ Components work with Signal Forms field state
- ✅ Utilities are pure functions taking Signal Forms signals
- ✅ Providers use Angular DI, don't modify form creation
- ✅ Tree-shakable: use only what you need

---

## API Design

### 1. Core Directives

#### `ngxSignalFormAutoAria`

**Selector:**

```typescript
selector: `
  input[formField]:not([ngxSignalFormAutoAriaDisabled]):not([type="radio"]):not([type="checkbox"]),
  textarea[formField]:not([ngxSignalFormAutoAriaDisabled]),
  select[formField]:not([ngxSignalFormAutoAriaDisabled])
`;
```

**Host Bindings:**

```typescript
host: {
  '[attr.aria-invalid]': 'ariaInvalid()',
  '[attr.aria-describedby]': 'ariaDescribedBy()'
}
```

**Field Name Extraction (4-tier priority):**

1. `data-signal-field` attribute (explicit nested paths)
2. Custom resolver from config
3. `id` attribute (WCAG preferred)
4. `name` attribute (fallback)

**Examples:**

```html
<!-- Priority 1: Explicit -->
<input
  data-signal-field="personalInfo.firstName"
  [formField]="userForm.personalInfo.firstName"
/>

<!-- Priority 3: ID (most common) -->
<input id="email" [formField]="userForm.email" />

<!-- Priority 4: Name -->
<input name="phoneNumber" [formField]="userForm.phoneNumber" />

<!-- Opt-out -->
<input ngxSignalFormAutoAriaDisabled [formField]="userForm.someField" />
```

#### `ngxSignalFormAutoTouch`

**Selector:**

```typescript
selector: `
  input[formField]:not([type="checkbox"]):not([type="radio"]):not([ngxSignalFormAutoTouchDisabled]),
  textarea[formField]:not([ngxSignalFormAutoTouchDisabled]),
  select[formField]:not([ngxSignalFormAutoTouchDisabled])
`;
```

**Host Bindings:**

```typescript
host: {
  '(blur)': 'onBlur()'
}
```

**Strategy-Aware:**

- Only active when error strategy requires touch detection
- Respects global configuration
- Opt-out via `ngxSignalFormAutoTouchDisabled` attribute

#### `ngxSignalFormBusy`

**Selector:**

```typescript
selector: 'form:not([ngxSignalFormBusyDisabled])';
```

**Host Bindings:**

```typescript
host: {
  '[attr.aria-busy]': 'ariaBusy()'
}
```

**Reactive State:**

```typescript
protected readonly ariaBusy = computed(() => {
  const form = this.form();
  return form.pending() || form.submitting() ? 'true' : null;
});
```

#### `ngxSignalForm`

**Purpose:** Provides form context to child directives via DI and tracks submission state.

**Directive:**

```typescript
import {
  Directive,
  input,
  signal,
  computed,
  HostListener,
} from '@angular/core';
import { NGX_SIGNAL_FORM_CONTEXT } from './tokens';

@Directive({
  selector: '[ngxSignalForm]',
  exportAs: 'ngxSignalForm',
  providers: [
    {
      provide: NGX_SIGNAL_FORM_CONTEXT,
      useExisting: ngxSignalFormDirective,
    },
  ],
})
export class ngxSignalFormDirective {
  // Inputs
  form = input.required<any>();
  errorStrategy = input<ErrorDisplayStrategy>('on-touch');

  // Submission state tracking (Signal Forms doesn't provide this)
  readonly hasSubmitted = signal(false);

  // Derived state
  readonly isSubmitting = computed(() => this.form().submitting());
  readonly errorStrategySignal = computed(() => this.errorStrategy());

  // Track submission on form submit
  @HostListener('submit')
  save() {
    this.hasSubmitted.set(true);
  }

  // Reset submission state on form reset
  @HostListener('reset')
  onReset() {
    this.hasSubmitted.set(false);
  }

  getForm() {
    return this.form();
  }
}
```

**Usage:**

```html
<form
  [ngxSignalForm]="userForm"
  [errorStrategy]="errorMode()"
  (submit)="save($event)"
>
  <!-- Child directives automatically access form context via DI -->
  <input id="email" [formField]="userForm.email" />
  <ngx-signal-form-error [formField]="userForm.email" />
</form>
```

### 2. Error Display Component

#### `NgxSignalFormError`

**Component:**

```typescript
@Component({
  selector: 'ngx-signal-form-error',
  template: `
    @if (showErrors()) {
      @for (error of structuredErrors(); track error.kind) {
        <p class="ngx-signal-form-error" role="alert" [id]="errorId()">
          {{ error.message }}
        </p>
      }
    }
  `,
})
export class NgxSignalFormErrorComponent {
  field = input.required<FieldState<any>>();
  errorId = input<string>();

  protected readonly showErrors = computed(() => {
    const f = this.field();
    return f.invalid() && f.touched();
  });

  protected readonly structuredErrors = computed(() => {
    return this.field().errors() || [];
  });
}
```

**Usage:**

```html
<input id="email" [value]="emailField().value()" />
<ngx-signal-form-error [formField]="emailField()" />
```

### 3. Form Field Wrapper

#### `NgxSignalFormField`

**Component:**

```typescript
@Component({
  selector: 'ngx-signal-form-field',
  template: `
    <div class="ngx-signal-form-field">
      <div class="ngx-signal-form-field__content">
        <ng-content />
      </div>
      @if (field()) {
        <ngx-signal-form-error [formField]="field()!" />
      }
    </div>
  `,
  styles: `
    .ngx-signal-form-field {
      display: flex;
      flex-direction: column;
      gap: var(--ngx-signal-form-field-gap, 0.5rem);
      margin-bottom: var(--ngx-signal-form-field-margin, 1rem);
    }
  `,
})
export class NgxSignalFormField {
  field = input<FieldState<any>>();
}
```

**Usage:**

````html
#### `NgxSignalFormField` **Component:** ```typescript @Component({ selector: 'ngx-signal-form-field', template: `
<div class="ngx-signal-form-field">
  <div class="ngx-signal-form-field__content">
    <ng-content />
  </div>
  @if (field()) {
  <ngx-signal-form-error [formField]="field()!" />
  }
</div>
`, styles: ` .ngx-signal-form-field { display: flex; flex-direction: column; gap: var(--ngx-signal-form-field-gap, 0.5rem); margin-bottom: var(--ngx-signal-form-field-margin, 1rem); } ` }) export class NgxSignalFormField { // Accept the field signal field = input<Signal<FieldState<any>>>(); }</Signal<FieldState<any>
````

**Usage:**

```html
<ngx-signal-form-field [formField]="userForm.email">
  <label for="email">Email</label>
  <input id="email" [formField]="userForm.email" />
</ngx-signal-form-field>
```

````

### 4. Error Display Strategies

#### Strategy Types

```typescript
export type ErrorDisplayStrategy =
  | 'immediate'    // Show errors as they occur
  | 'on-touch'     // Show after blur or submit (WCAG recommended)
  | 'on-submit'    // Show only after submit
  | 'manual';      // Developer controls display
````

#### Implementation

```typescript
/**
 * Computes whether to show errors based on the error display strategy.
 *
 * Note: Signal Forms doesn't provide a hasSubmitted signal - you must track it yourself
 * via form provider or component state (see examples below).
 */
export function computeShowErrors(
  field: Signal<FieldState<any>>,
  strategy: ErrorDisplayStrategy | Signal<ErrorDisplayStrategy>,
  hasSubmitted: Signal<boolean>, // Must be provided by form provider or component
): Signal<boolean> {
  return computed(() => {
    const f = field();
    const hasErrors = f.invalid();
    const touched = f.touched();
    const submitted = hasSubmitted();

    const currentStrategy =
      typeof strategy === 'function' ? strategy() : strategy;

    switch (currentStrategy) {
      case 'immediate':
        return hasErrors;

      case 'on-touch':
        return (touched || submitted) && hasErrors;

      case 'on-submit':
        return submitted && hasErrors;

      case 'manual':
        return false;

      default:
        return (touched || submitted) && hasErrors;
    }
  });
}

// Example: Track hasSubmitted in form provider
@Directive({
  selector: '[ngxSignalForm]',
})
export class ngxSignalFormDirective {
  form = input.required<any>();
  errorStrategy = input<ErrorDisplayStrategy>('on-touch');

  // Track submission state
  readonly hasSubmitted = signal(false);

  @HostListener('submit')
  save() {
    this.hasSubmitted.set(true);
  }
}
```

### 5. Configuration

#### Global Config

```typescript
export interface NgxSignalFormsConfig {
  autoAria?: boolean; // Enable auto-ARIA (default: true)
  autoTouch?: boolean; // Enable auto-touch (default: true)
  autoFormBusy?: boolean; // Enable auto aria-busy (default: true)
  defaultErrorStrategy?: ErrorDisplayStrategy; // Default strategy
  fieldNameResolver?: (element: HTMLElement) => string | null;
  strictFieldResolution?: boolean; // Throw on unresolved fields
  debug?: boolean; // Enable debug logging
}

export function provideNgxSignalFormsConfig(config: NgxSignalFormsConfig) {
  return {
    provide: NGX_SIGNAL_FORMS_CONFIG,
    useValue: config,
  };
}
```

#### Usage

```typescript
// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideNgxSignalFormsConfig({
      autoAria: true,
      autoTouch: true,
      autoFormBusy: true,
      defaultErrorStrategy: 'on-touch',
      debug: !environment.production,
    }),
  ],
};
```

---

## Implementation Guide

### Phase 1: Core Directives (Week 1-2)

**Priority 1: Auto-ARIA Directive**

1. Create directive selector matching `[value]` bindings
2. Implement field name extraction (4-tier priority)
3. Inject Signal Forms field state via DI
4. Compute `aria-invalid` from `field.invalid()`
5. Compute `aria-describedby` with error ID appending
6. Add manual override detection via `HostAttributeToken`
7. Write component tests with Testing Library

**Priority 2: Form Provider Directive**

1. Create `[ngxSignalForm]` directive
2. Provide form instance via `NGX_SIGNAL_FORM` token
3. Implement `getForm()` method for lazy access
4. Test DI resolution in nested components

**Priority 3: Auto-Touch Directive**

1. Create directive with blur handler
2. Extract field name (same logic as auto-ARIA)
3. Call `field().markAsTouched()` on blur
4. Add strategy awareness (only active when needed)
5. Implement opt-out mechanism

### Phase 2: Error Display (Week 3)

**Priority 1: Error Strategies**

1. Define `ErrorDisplayStrategy` type
2. Implement `computeShowErrors()` utility
3. Add strategy descriptions for documentation
4. Create custom strategy factory

**Priority 2: Error Component**

1. Create `NgxSignalFormErrorComponent`
2. Accept `field` input
3. Compute `showErrors` from strategy
4. Render structured errors with `@for`
5. Add role="alert" for accessibility
6. Style with CSS custom properties

### Phase 3: Form Field Wrapper (Week 4)

**Priority 1: Wrapper Component**

1. Create `NgxSignalFormField` component
2. Add content projection for label + input
3. Auto-render `NgxSignalFormErrorComponent`
4. Add CSS custom properties for theming
5. Test with various input types

### Phase 4: Form Busy (Week 5)

**Priority 1: Busy Directive**

1. Create form-level directive
2. Inject form provider
3. Compute `aria-busy` from `pending()` + `submitting()`
4. Add opt-out mechanism
5. Test with async validation

### Phase 5: Testing & Documentation (Week 6)

**Priority 1: Test Coverage**

1. Component tests (Vitest + Testing Library)
2. E2E tests (Playwright)
3. Accessibility tests (axe-core)
4. Visual regression tests

**Priority 2: Documentation**

1. API documentation (TypeDoc)
2. Usage examples for each feature
3. Migration guide from ngx-vest-forms
4. Comparison with Signal Forms alone
5. Best practices guide

---

## Usage Examples

### Level 1: Basic Form (Signal Forms + Auto-ARIA)

```typescript
import { Component, signal } from '@angular/core';
import { form, schema, required, email, Control } from '@angular/forms/signals';
import { NgxSignalFormAutoAria } from '@ngx-signal-forms/core';

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
  selector: 'ngx-contact',
  imports: [NgxSignalFormAutoAria, Control],
  template: `
    <form (submit)="save($event)" novalidate>
      <!-- Auto aria-invalid + aria-describedby -->
      <label for="email">Email</label>
      <input id="email" type="email" [formField]="contactForm.email" />
      <span id="email-error" role="alert">
        @if (contactForm.email().invalid()) {
          {{ contactForm.email().errors() | json }}
        }
      </span>

      <button type="submit">Submit</button>
    </form>
  `,
})
export class ContactFormComponent {
  protected readonly model = signal<ContactModel>({ email: '', message: '' });
  protected readonly contactForm = form(this.model, contactSchema);

  protected save(event: Event): void {
    event.preventDefault();
    if (this.contactForm().valid()) {
      console.log('Valid:', this.model());
    }
  }
}
```

### Level 2: Add Error Component + Auto-Touch

```typescript
import { Component, signal } from '@angular/core';
import { form, schema, required, email, Control } from '@angular/forms/signals';
import {
  NgxSignalFormAutoAria,
  NgxSignalFormAutoTouch,
  NgxSignalFormErrorComponent,
} from '@ngx-signal-forms/core';

@Component({
  selector: 'ngx-contact',
  imports: [
    NgxSignalFormAutoAria,
    NgxSignalFormAutoTouch,
    NgxSignalFormErrorComponent,
    FormField,
  ],
  template: `
    <form (submit)="save($event)" novalidate>
      <label for="email">Email</label>
      <input id="email" type="email" [formField]="contactForm.email" <!-- blur handler automatic -- />
      />
      <ngx-signal-form-error [formField]="contactForm.email" />

      <button type="submit">Submit</button>
    </form>
  `,
})
export class ContactFormComponent {
  protected readonly model = signal<ContactModel>({ email: '', message: '' });
  protected readonly contactForm = form(this.model, contactSchema);

  protected save(event: Event): void {
    event.preventDefault();
    if (this.contactForm().valid()) {
      console.log('Valid:', this.model());
    }
  }
}
```

### Level 3: Add Form Field Wrapper

```typescript
import { Component, signal } from '@angular/core';
import { form, schema, required, email, Control } from '@angular/forms/signals';
import { NgxSignalFormField } from '@ngx-signal-forms/form-field';
import {
  NgxSignalFormAutoAria,
  NgxSignalFormAutoTouch,
} from '@ngx-signal-forms/core';

@Component({
  selector: 'ngx-contact',
  imports: [
    NgxSignalFormField,
    NgxSignalFormAutoAria,
    NgxSignalFormAutoTouch,
    FormField,
  ],
  template: `
    <form (submit)="save($event)" novalidate>
      <ngx-signal-form-field [formField]="contactForm.email">
        <label for="email">Email</label>
        <input id="email" type="email" [formField]="contactForm.email" />
      </ngx-signal-form-field>

      <ngx-signal-form-field [formField]="contactForm.message">
        <label for="message">Message</label>
        <textarea id="message" [formField]="contactForm.message"></textarea>
      </ngx-signal-form-field>

      <button type="submit">Submit</button>
    </form>
  `,
})
export class ContactFormComponent {
  protected readonly model = signal<ContactModel>({ email: '', message: '' });
  protected readonly contactForm = form(this.model, contactSchema);

  protected save(event: Event): void {
    event.preventDefault();
    if (this.contactForm().valid()) {
      console.log('Valid:', this.model());
    }
  }
}
```

### Level 4: Full Stack (All Features)

```typescript
import { Component, signal } from '@angular/core';
import {
  form,
  schema,
  required,
  email,
  minLength,
  FormField,
  submit,
} from '@angular/forms/signals';
import { NgxSignalFormField } from '@ngx-signal-forms/form-field';
import {
  NgxSignalForms, // Bundle: all directives + components
  type ErrorDisplayStrategy,
} from '@ngx-signal-forms/core';

interface ContactModel {
  email: string;
  message: string;
}

const contactSchema = schema<ContactModel>((path) => {
  required(path.email);
  email(path.email);
  required(path.message);
  minLength(path.message, 10);
});

@Component({
  selector: 'ngx-contact',
  imports: [NgxSignalForms, NgxSignalFormField, Control],
  template: `
    <!-- Error Strategy Selector (for demo) -->
    <fieldset>
      <legend>Error Display Mode</legend>
      <label>
        <input
          type="radio"
          name="errorMode"
          value="immediate"
          [checked]="errorMode() === 'immediate'"
          (change)="errorMode.set('immediate')"
        />
        Immediate
      </label>
      <label>
        <input
          type="radio"
          name="errorMode"
          value="on-touch"
          [checked]="errorMode() === 'on-touch'"
          (change)="errorMode.set('on-touch')"
        />
        On Touch (Default)
      </label>
    </fieldset>

    <!-- Form with enhanced provider (tracks submission + manages error strategy) -->
    <form
      [ngxSignalForm]="contactForm"
      [errorStrategy]="errorMode()"
      (submit)="save($event)"
    >
      <ngx-signal-form-field [formField]="contactForm.email">
        <label for="email">Email *</label>
        <input id="email" type="email" [formField]="contactForm.email" />
      </ngx-signal-form-field>

      <ngx-signal-form-field [formField]="contactForm.message">
        <label for="message">Message *</label>
        <textarea
          id="message"
          rows="4"
          [formField]="contactForm.message"
        ></textarea>
      </ngx-signal-form-field>

      <!-- Submission feedback -->
      @if (contactForm().submitError()) {
        <div class="error" role="alert">
          Failed to submit: {{ contactForm().submitError()!.message }}
        </div>
      }
      @if (contactForm().submitSuccess()) {
        <div class="success" role="status">✅ Message sent successfully!</div>
      }

      <button type="submit" [disabled]="contactForm().submitting()">
        @if (contactForm().submitting()) {
          Sending...
        } @else {
          Submit
        }
      </button>
    </form>
  `,
})
export class ContactFormComponent {
  // Error display strategy (dynamic)
  protected readonly errorMode = signal<ErrorDisplayStrategy>('on-touch');

  // Form setup (errorStrategy managed via provider, not form() options)
  protected readonly model = signal<ContactModel>({ email: '', message: '' });
  protected readonly contactForm = form(this.model, contactSchema);

  protected save(): void {
    // Use Signal Forms' save() helper for automatic state management
    submit(this.contactForm, async (formState) => {
      if (!formState.valid()) {
        throw new Error('Form has validation errors');
      }

      // Simulate async submission
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Reset form on successful submission
      this.model.set({ email: '', message: '' });

      console.log('Message sent successfully!');
    });
  }
}
```

---

## Advanced Validation Patterns

### Using validateTree() for Targeted Error Placement

> **Key Insight**: Use `validateTree()` when you need to assign validation errors to specific fields in complex scenarios like duplicate detection.

#### Duplicate Detection in Arrays

```typescript
import { validateTree, customError } from '@angular/forms/signals';

type Location = {
  city: string;
  country: string;
};

type LocationList = {
  locations: Location[];
};

const locationForm = form(signal<LocationList>(...), (path) => {
  // Basic field validation
  applyEach(path.locations, (location) => {
    required(location.city);
    required(location.country);
  });

  // Duplicate detection with targeted errors
  validateTree(path, (ctx) => {
    const errors: ValidationError[] = [];
    const locations = ctx.value().locations;

    locations.forEach((location, index) => {
      const city = location.city.valueOf();
      const country = location.country.valueOf();

      if (!city || !country) return;

      // Check for duplicates
      locations.forEach((other, otherIndex) => {
        if (index !== otherIndex) {
          if (city === other.city.valueOf() &&
              country === other.country.valueOf()) {
            errors.push({
              kind: 'duplicate_location',
              field: ctx.field.locations[index].city, // 🎯 Target specific field!
              message: `Duplicate location: ${city}, ${country}`
            });
          }
        }
      });
    });

    return errors.length > 0 ? errors : null;
  });
});
```

**Template:**

```html
@for (location of locationForm.locations; track $index) {
<div>
  <input [formField]="locationForm.locations[$index].city" />

  <!-- Error appears on the specific duplicate field -->
  @if (locationForm.locations[$index].city().errors().length > 0) { @for (error
  of locationForm.locations[$index].city().errors(); track error.kind) {
  <p class="text-red-500">{{ error.message }}</p>
  } }
</div>
}
```

### Cross-Field Validation Strategies

> **Important Distinction**: Signal Forms supports both **root-level** errors (form-wide) and **field-level** errors (specific fields). Understanding when to use each improves error messaging and UX.

| Error Type      | Validation Target       | Error Location                | Use Case                   |
| --------------- | ----------------------- | ----------------------------- | -------------------------- |
| **Field-Level** | `validate(path.field,`) | Stored on the field itself    | Single field validation    |
| **Root-Level**  | `validate(path,`        | Stored on the form tree root  | Cross-field business rules |
| **Cross-Field** | `validate(path.field,`) | Field error using `valueOf()` | Dependent field validation |

**When to Use Root-Level Errors:**

- Form-wide business rules that don't belong to a single field
- Multi-field relationships (e.g., "start date must be before end date")
- Complex validations where no single field is "wrong"

**When to Use Field-Level (Cross-Field) Errors:**

- One field depends on another (e.g., "confirm password must match password")
- The error clearly belongs to one specific field
- You want the error to appear next to a specific input

#### Strategy 1: Dependent Field Validation (Field-Level)

```typescript
// Password confirmation
validateTree(path, (ctx) => {
  const password = ctx.value().password;
  const confirm = ctx.value().confirmPassword;

  if (password && confirm && password !== confirm) {
    return {
      confirmPassword: [
        customError({
          kind: 'password_mismatch',
          message: 'Passwords must match',
        }),
      ],
    };
  }

  return {};
});
```

#### Strategy 2: Date Range Validation

```typescript
// Start date must be before end date
validate(path.endDate, ({ value, valueOf }) => {
  const startDate = valueOf(path.startDate);
  const endDate = value();

  if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
    return customError({
      kind: 'invalid_range',
      message: 'End date must be after start date',
    });
  }

  return null;
});
```

#### Strategy 3: Conditional Required Fields

```typescript
// Sale price required when on sale
validate(path.salePrice, ({ value, valueOf }) => {
  const isOnSale = valueOf(path.onSale);
  const salePrice = value();

  if (isOnSale && !salePrice) {
    return customError({
      kind: 'sale_price_required',
      message: 'Sale price is required when item is on sale',
    });
  }

  return null;
});
```

#### Strategy 4: Root-Level Validation (Form-Wide Business Rules)

Use root-level validation when the error doesn't belong to a specific field:

```typescript
// Example: Total items in cart validation
validate(path, ({ value }) => {
  const form = value();
  const totalItems = form.items.reduce((sum, item) => sum + item.quantity, 0);

  if (totalItems > 100) {
    return customError({
      kind: 'cart_limit_exceeded',
      message: 'Maximum 100 items allowed in cart. Please reduce quantities.',
    });
  }

  return null;
});

// Example: Date range validation (no single field is wrong)
validate(path, ({ value }) => {
  const form = value();

  if (form.startDate && form.endDate && form.startDate > form.endDate) {
    return customError({
      kind: 'invalid_date_range',
      message: 'Start date must be before end date',
    });
  }

  return null;
});
```

**Accessing Root-Level Errors:**

Root-level errors are stored on the form tree itself:

```typescript
// Get root-level errors
const rootErrors = computed(() => myForm().errors());

// Get all field-level errors (requires recursive collection)
const fieldErrors = computed(() => {
  const errors: ValidationError[] = [];
  // ... recursive collection logic
  return errors;
});
```

### Hybrid Validation: Zod + Signal Forms + Async

> **Real-World Pattern**: Layer different validation types for comprehensive coverage.

```typescript
import { z } from 'zod';
import {
  form,
  validateStandardSchema,
  validateAsync,
  validateTree,
} from '@angular/forms/signals';

// Layer 1: Zod for data structure
const ProductSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(2),
  price: z.number().min(0),
});

// Layer 2: Create form with all validation layers
const productForm = form(productModel, (path) => {
  // Data structure validation
  validateStandardSchema(path, ProductSchema);

  // Async server validation
  validateAsync(path.sku, {
    params: (ctx) => ({ sku: ctx.value() }),
    factory: (params) =>
      rxResource({
        params,
        stream: (p) => this.http.get(`/api/products/check-sku/${p.params.sku}`),
      }),
    errors: (result) => {
      return result.exists
        ? customError({ kind: 'sku_taken', message: 'SKU already exists' })
        : null;
    },
  });

  // Business logic validation
  validate(path.price, ({ value, valueOf }) => {
    const price = value();
    const cost = valueOf(path.cost);

    if (cost && price < cost) {
      return customError({
        kind: 'price_below_cost',
        message: 'Price cannot be below cost',
      });
    }

    return null;
  });
});
```

### Form Submission: Two Approaches

#### Approach 1: Manual Validation (More Control)

```typescript
protected save(): void {
  // Manual validation check
  if (!this.contactForm().valid()) {
    this.markAllAsTouched();
    return;
  }

  // Handle submission
  this.isSubmitting.set(true);

  try {
    await this.api.save(this.model());
    this.router.navigate(['/success']);
  } catch (error) {
    this.handleServerError(error);
  } finally {
    this.isSubmitting.set(false);
  }
}

private markAllAsTouched() {
  this.contactForm.email().markAsTouched();
  this.contactForm.message().markAsTouched();
}
```

#### Approach 2: save() Helper (Cleaner)

```typescript
import { submit } from '@angular/forms/signals';

protected readonly saveHandler = submit(this.contactForm, async (formState) => {
  // Validation happens automatically
  if (!formState.valid()) {
    throw new Error('Form has validation errors');
  }

  // submitting() signal is automatically true
  await this.api.save(formState.value());

  // Reset on success
  this.model.set({ email: '', message: '' });
  this.router.navigate(['/success']);
});

// In template
<form (submit)="save($event)" novalidate>
  <!-- fields -->

  <!-- Built-in submission state -->
  @if (contactForm().submitting()) {
    <span>Saving...</span>
  }

  @if (contactForm().submitError()) {
    <span>Error: {{ contactForm().submitError().message }}</span>
  }

  @if (contactForm().submitSuccess()) {
    <span>Saved successfully!</span>
  }
</form>
```

**When to Use Each:**

| Approach   | Use When                                       |
| ---------- | ---------------------------------------------- |
| **Manual** | Need fine-grained control over submission flow |
| **Manual** | Custom loading states or error handling        |
| **Manual** | Multi-step submission process                  |
| **save()** | Standard form submission                       |
| **save()** | Want built-in submission signals               |
| **save()** | Cleaner, less boilerplate                      |

---

## Migration from ngx-vest-forms

### Key Differences

| Aspect                | ngx-vest-forms           | Signal Forms Enhancement        |
| --------------------- | ------------------------ | ------------------------------- |
| **Validation Engine** | Vest.js (portable)       | Signal Forms (Angular-specific) |
| **Form Creation**     | `createVestForm()`       | `form()` from Signal Forms      |
| **Schema Definition** | `staticSafeSuite()`      | `schema()` from Signal Forms    |
| **Field Access**      | `form.email()`           | `contactForm.email()`           |
| **Validation State**  | `form.emailValidation()` | `emailField().errors()`         |
| **Touch State**       | `form.emailTouched()`    | `emailField().touched()`        |
| **Submit**            | `await form.save()`      | Check `contactForm().valid()`   |

### Migration Steps

#### Step 1: Replace Validation Suite

**Before (ngx-vest-forms):**

```typescript
import { staticSafeSuite } from 'ngx-vest-forms/core';
import { test, enforce } from 'vest';

const contactSuite = staticSafeSuite<ContactModel>((data) => {
  test('email', 'Email is required', () => {
    enforce(data.email).isNotEmpty();
  });
  test('email', 'Invalid email format', () => {
    enforce(data.email).isEmail();
  });
});
```

**After (Signal Forms):**

```typescript
import { schema, required, email } from '@angular/forms/signals';

const contactSchema = schema<ContactModel>((path) => {
  required(path.email, { message: 'Email is required' });
  email(path.email, { message: 'Invalid email format' });
});
```

#### Step 2: Replace Form Creation

**Before:**

```typescript
import { createVestForm } from 'ngx-vest-forms/core';

protected readonly form = createVestForm(
  signal({ email: '', message: '' }),
  contactSuite
);
```

**After:**

```typescript
import { form } from '@angular/forms/signals';

protected readonly model = signal({ email: '', message: '' });
protected readonly contactForm = form(this.model, contactSchema);
```

#### Step 3: Update Template Bindings

**Before:**

```html
<input id="email" [value]="form.email()" (input)="form.setEmail($event)" />
<ngx-form-error [formField]="form.emailField()" />
```

**After:**

```html
<input id="email" [formField]="contactForm.email" />
<ngx-signal-form-error [formField]="contactForm.email" />
```

#### Step 4: Update Submit Logic

**Before:**

```typescript
protected async save() {
  const result = await this.form.save();
  if (result.valid) {
    await this.api.save(result.data);
  }
}
```

**After:**

```typescript
protected async save(): void {
  if (this.contactForm().valid()) {
    await this.api.save(this.model());
  }
}
```

### Side-by-Side Comparison

```typescript
// ===== ngx-vest-forms =====
import { Component, signal } from '@angular/core';
import { createVestForm, staticSafeSuite } from 'ngx-vest-forms/core';
import { NgxVestFormField } from 'ngx-vest-forms/form-field';
import { test, enforce } from 'vest';

const contactSuite = staticSafeSuite<ContactModel>((data) => {
  test('email', 'Required', () => enforce(data.email).isNotEmpty());
  test('email', 'Invalid', () => enforce(data.email).isEmail());
});

@Component({
  selector: 'ngx-contact',
  imports: [NgxVestFormField],
  template: `
    <form (submit)="save($event)" novalidate>
      <ngx-vest-form-field [formField]="form.emailField()">
        <label for="email">Email</label>
        <input
          id="email"
          [value]="form.email()"
          (input)="form.setEmail($event)"
        />
      </ngx-vest-form-field>
      <button type="submit">Submit</button>
    </form>
  `,
})
export class ContactComponent {
  form = createVestForm(signal({ email: '' }), contactSuite);

  async save(event: Event): Promise<void> {
    event.preventDefault();
    const result = await this.form.save();
    if (result.valid) console.log(result.data);
  }
}

// ===== Signal Forms + Enhancement Library =====
import { Component, signal } from '@angular/core';
import { form, schema, required, email, Control } from '@angular/forms/signals';
import { NgxSignalFormField } from '@ngx-signal-forms/form-field';

const contactSchema = schema<ContactModel>((path) => {
  required(path.email);
  email(path.email);
});

@Component({
  selector: 'ngx-contact',
  imports: [NgxSignalFormField, Control],
  template: `
    <form (submit)="save($event)" novalidate>
      <ngx-signal-form-field [formField]="contactForm.email">
        <label for="email">Email</label>
        <input id="email" [formField]="contactForm.email" />
      </ngx-signal-form-field>
      <button type="submit">Submit</button>
    </form>
  `,
})
export class ContactComponent {
  model = signal({ email: '' });
  contactForm = form(this.model, contactSchema);

  save(event: Event): void {
    event.preventDefault();
    if (this.contactForm().valid()) console.log(this.model());
  }
}
```

---

## Testing Strategy

### Component Tests (Vitest + Testing Library)

```typescript
import { render, screen } from '@testing-library/angular';
import { userEvent } from 'vitest/browser';
import { describe, it, expect } from 'vitest';
import { ContactFormComponent } from './contact-form.component';

describe('ContactFormComponent', () => {
  it('should show errors on blur (on-touch strategy)', async () => {
    await render(ContactFormComponent);

    const emailInput = screen.getByLabelText(/email/i);

    // Focus and blur without entering value
    await userEvent.click(emailInput);
    await userEvent.tab();

    // Error should appear after blur
    expect(screen.getByRole('alert')).toHaveTextContent('Email is required');
  });

  it('should apply aria-invalid when field has errors', async () => {
    await render(ContactFormComponent);

    const emailInput = screen.getByLabelText(/email/i);

    await userEvent.click(emailInput);
    await userEvent.tab();

    expect(emailInput).toHaveAttribute('aria-invalid', 'true');
  });

  it('should link errors via aria-describedby', async () => {
    await render(ContactFormComponent);

    const emailInput = screen.getByLabelText(/email/i);

    await userEvent.click(emailInput);
    await userEvent.tab();

    const errorId = emailInput.getAttribute('aria-describedby');
    expect(errorId).toBeTruthy();

    const errorElement = document.getElementById(errorId!);
    expect(errorElement).toHaveTextContent('Email is required');
  });
});
```

### E2E Tests (Playwright)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Contact Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contact');
  });

  test('should validate email on blur', async ({ page }) => {
    await test.step('Focus and blur email input', async () => {
      const emailInput = page.getByLabel(/email/i);
      await emailInput.click();
      await emailInput.press('Tab');
    });

    await test.step('Verify error appears', async () => {
      await expect(page.getByRole('alert')).toContainText('Email is required');
    });
  });

  test('should validate accessibility tree', async ({ page }) => {
    await test.step('Trigger validation', async () => {
      const emailInput = page.getByLabel(/email/i);
      await emailInput.click();
      await emailInput.press('Tab');
    });

    await test.step('Verify ARIA structure', async () => {
      await expect(page.getByRole('form')).toMatchAriaSnapshot(`
        - form:
          - group:
            - textbox "Email" [invalid]:
              - aria-describedby: email-error
            - alert: "Email is required"
      `);
    });
  });
});
```

### Accessibility Tests (axe-core)

```typescript
import { render } from '@testing-library/angular';
import { injectAxe, checkA11y } from 'axe-playwright';
import { test } from '@playwright/test';
import { ContactFormComponent } from './contact-form.component';

test('should have no accessibility violations', async ({ page }) => {
  await page.goto('/contact');
  await injectAxe(page);

  // Check initial state
  await checkA11y(page);

  // Trigger validation
  const emailInput = page.getByLabel(/email/i);
  await emailInput.click();
  await emailInput.press('Tab');

  // Check error state
  await checkA11y(page);
});
```

---

## Roadmap

> **All features are non-intrusive utilities, directives, components, or providers that enhance Signal Forms without modifying its core API.**

### v1.0.0 (MVP - Q2 2025)

**Core Directives & Components:**

- ✅ Auto-ARIA directive (`[formField]` selector with host bindings)
- ✅ Auto-touch directive (`[formField]` selector with blur listener)
- ✅ Form busy directive (form-level `aria-busy` host binding)
- ✅ Form provider directive (DI context + submission tracking)
- ✅ Error display component (reusable error renderer)
- ✅ Form field wrapper component (layout + auto-error display)

**Utilities & Configuration:**

- ✅ Error display strategies (utility functions)
- ✅ `computeShowErrors()` utility function
- ✅ Global configuration provider
- ✅ Testing utilities (test helpers for common scenarios)
- ✅ Documentation (API docs + usage examples)

### v1.1.0 (Enhanced UX - Q3 2025)

**Components & Pipes:**

- 🎯 **Structured error transformer pipe** - Transform error objects for i18n compatibility
- 🎯 **Error animation directive** - Automatic enter/leave animations for error messages
- 🎯 **Custom error template component** - Configurable error rendering with slots
- 🎯 **Warning message component** - Non-blocking validation feedback (separate from errors)

**Utilities:**

- 🎯 **Debounced error display utility** - Show errors after N milliseconds of inactivity
- 🎯 **Error message registry service** - Centralized error message management for i18n

### v1.2.0 (Developer Tools - Q4 2025)

**Dev-Mode Components:**

- 🎯 **DevTools panel component** - Visual debugging panel (dev-mode only)
- 🎯 **Debug overlay directive** - Show field state on hover (dev-mode only)
- 🎯 **Validation visualizer component** - Real-time validation flow diagram
- 🎯 **Performance monitor service** - Track validation timing and re-renders

**Utilities:**

- 🎯 **Validation logger utility** - Detailed console logging for debugging
- 🎯 **Form state snapshot utility** - Capture/restore form state for testing

### v2.0.0 (Advanced Features - 2026)

**Advanced Directives & Components:**

- 🎯 **Form array helper directive** - Simplified form array manipulation (add/remove/reorder)
- 🎯 **Dynamic field component** - Render fields from configuration objects
- 🎯 **Field dependency directive** - Automatic field enable/disable based on conditions

**Advanced Utilities:**

- 🎯 **Schema composition helpers** - Utility functions for schema merging and reuse
- 🎯 **Cross-field validation helper** - Simplified dependent field validation
- 🎯 **Async validation queue service** - Smart debouncing and cancellation for async validators
- 🎯 **Form serialization utility** - Convert form state to/from various formats (JSON, FormData, etc.)

**Type Utilities:**

- 🎯 **Type helpers** - Advanced TypeScript utilities for schema inference
- 🎯 **Validator factories** - Reusable validator creator functions

---

## Library Naming Analysis

### Recommended Package Name: `ngx-signal-forms-toolkit`

**Rationale:**

1. **Clear Purpose**: "toolkit" implies a collection of utilities that work with Signal Forms
2. **Non-Intrusive**: Suggests enhancement rather than replacement
3. **Comprehensive**: Covers all aspects (accessibility, UX, DX, testing)
4. **Searchable**: Easy to find and understand the relationship to Signal Forms
5. **Consistent**: Follows Angular community conventions (`ngx-` prefix)

### Alternative Options

| Package Name                   | Pros                                      | Cons                                              |
| ------------------------------ | ----------------------------------------- | ------------------------------------------------- |
| `ngx-signal-forms-toolkit` ⭐  | Comprehensive, clear, searchable          | Slightly generic                                  |
| `ngx-signal-forms-ux`          | Clear UX focus, concise                   | Doesn't capture accessibility/testing aspects     |
| `ngx-signal-forms-a11y`        | Strong accessibility focus, unique        | Too narrow, doesn't convey DX utilities           |
| `ngx-signal-forms-plus`        | Simple, suggests enhancement              | Too generic, lacks clarity on what's "plus"       |
| `ngx-signal-forms-enhanced`    | Clear enhancement message                 | Grammatically awkward                             |
| `ngx-signal-forms-extras`      | Clear that it's additional features       | Suggests less important/optional                  |
| `ngx-signal-forms-boost`       | Dynamic, suggests improvement             | Unclear what's being boosted                      |
| `@ngx-signal-forms/toolkit`    | Scoped package, suggests official support | Requires namespace ownership                      |
| `@ngx-signal-forms/ux`         | Scoped + UX focus                         | Requires namespace, narrow focus                  |
| `ngx-sf-toolkit`               | Concise abbreviation                      | Less discoverable, unclear abbreviation           |
| `ngx-signal-forms-dx`          | Developer Experience focus                | Doesn't convey user-facing (a11y) improvements    |
| `ngx-signal-forms-helpers`     | Clear helper utilities                    | Suggests small utilities, not comprehensive       |
| `ngx-signal-forms-companion`   | Suggests it works alongside Signal Forms  | Less searchable, unusual naming pattern           |
| `ngx-signal-forms-kit`         | Short, clear                              | Very similar to "toolkit" but less descriptive    |
| `ngx-signal-forms-ally`        | Clever a11y wordplay                      | Too cute, unclear for non-native English speakers |
| `ngx-signal-forms-utils`       | Standard utility naming                   | Too generic, suggests simple helpers only         |
| `ngx-signal-forms-suite`       | Comprehensive collection                  | Conflicts with "test suite" terminology           |
| `ngx-signal-forms-pro`         | Professional/advanced features            | Suggests paid version                             |
| `ngx-signal-forms-complete`    | Conveys completeness                      | Too absolute, suggests Signal Forms is incomplete |
| `ngx-signal-forms-accessible`  | Clear accessibility focus                 | Too long, narrow focus                            |
| `ngx-signal-forms-wcag`        | Technical accuracy for accessibility      | Too technical, excludes UX/DX features            |
| `ngx-signal-forms-addons`      | Clear additional features                 | British vs American spelling confusion            |
| `ngx-signal-forms-essentials`  | Suggests necessary features               | Implies Signal Forms is incomplete without it     |
| `ngx-signal-forms-full`        | Complete solution                         | Misleading, Signal Forms is already "full"        |
| `ngx-signal-forms-dx-a11y`     | Covers DX and accessibility               | Too technical, hyphenated acronyms                |
| `ngx-signal-forms-ready`       | Production-ready enhancements             | Unclear what "ready" means                        |
| `ngx-signal-forms-power`       | Power user features                       | Vague, doesn't convey specific value              |
| `ngx-signal-forms-studio`      | Professional tooling                      | Suggests IDE/editor integration                   |
| `ngx-signal-forms-lab`         | Experimental features                     | Suggests instability                              |
| `angular-signal-forms-toolkit` | Official Angular naming                   | Longer, not following ngx- community convention   |

### Final Recommendation

**Primary Choice**: `@ngx-signal-forms/toolkit` (main package with secondary entry points)

**Package Structure:**

1. **`@ngx-signal-forms/toolkit`** - Main package (required)
   - Primary entry: Core directives, utilities, and components
   - Secondary entry: `/form-field` - Form field wrapper (optional)
   - Secondary entry: `/testing` - Test utilities (optional, dev dependency)

2. **`@ngx-signal-forms/vestjs`** - Separate optional package
   - Vest.js validation integration
   - Can be used alongside the toolkit
   - Independent versioning and releases

**Why This Structure:**

1. **Simplified DX**: Most users only install one package (`@ngx-signal-forms/toolkit`)
2. **Tree-shakable**: Secondary entry points are only included when imported
3. **Clear Separation**: Vest.js is a distinct integration, not core functionality
4. **Easy Opt-out**: Don't want form-field wrapper? Don't import it!
5. **Professional**: Clean, focused packages with clear purposes
6. **Future-proof**: Can extract shared utilities later if needed by both packages

**Alternative Considered** (if toolkit becomes too large):

Extract core utilities to a shared internal package:

- `@ngx-signal-forms/toolkit` (depends on shared core)
- `@ngx-signal-forms/vestjs` (depends on shared core)
- `@ngx-signal-forms/core` (internal, shared by both)

But for v1.0, the monolithic toolkit approach is simpler and sufficient.

### Package Structure Options

#### Recommended: Monorepo with Toolkit as Main Package

Using `@ngx-signal-forms/toolkit` as the main package with secondary entry points provides the best developer experience while maintaining flexibility.

**Repository Structure:**

```text
ngx-signal-forms/                    # Repository root
├── apps/
│   ├── demo/                        # Demo application
│   └── docs/                        # Documentation site (optional)
├── packages/
│   ├── toolkit/                     # @ngx-signal-forms/toolkit (MAIN PACKAGE)
│   │   ├── src/
│   │   │   ├── core/               # Internal core (directives, utilities, components)
│   │   │   ├── form-field/         # Secondary entry point source
│   │   │   ├── testing/            # Secondary entry point source
│   │   │   └── index.ts            # Primary entry (exports core)
│   │   ├── form-field/
│   │   │   └── index.ts            # Secondary entry point
│   │   ├── testing/
│   │   │   └── index.ts            # Secondary entry point
│   │   ├── package.json            # name: "@ngx-signal-forms/toolkit"
│   │   ├── project.json            # Nx config (publishable)
│   │   └── README.md
│   └── vestjs/                      # @ngx-signal-forms/vestjs (SEPARATE OPTIONAL)
│       ├── src/
│       │   ├── validators/
│       │   ├── adapters/
│       │   └── index.ts
│       ├── package.json            # name: "@ngx-signal-forms/vestjs"
│       ├── project.json            # Nx config (publishable)
│       └── README.md
├── docs/                            # Markdown documentation
├── tools/                           # Custom build tools (optional)
├── pnpm-workspace.yaml             # pnpm workspace config
├── nx.json                          # Nx workspace config
├── package.json                     # Root package.json
└── tsconfig.base.json              # Shared TypeScript config
```

**pnpm-workspace.yaml:**

```yaml
packages:
  - 'apps/*'
  - 'packages/*'

autoInstallPeers: true
strictPeerDependencies: false
```

**Package Exports Configuration (`@ngx-signal-forms/toolkit/package.json`):**

```json
{
  "name": "@ngx-signal-forms/toolkit",
  "version": "1.0.0",
  "exports": {
    ".": {
      "types": "./index.d.ts",
      "esm2022": "./esm2022/index.mjs",
      "esm": "./esm/index.mjs",
      "default": "./fesm2022/index.mjs"
    },
    "./form-field": {
      "types": "./form-field/index.d.ts",
      "esm2022": "./esm2022/form-field/index.mjs",
      "esm": "./esm/form-field/index.mjs",
      "default": "./fesm2022/form-field/index.mjs"
    },
    "./testing": {
      "types": "./testing/index.d.ts",
      "esm2022": "./esm2022/testing/index.mjs",
      "esm": "./esm/testing/index.mjs",
      "default": "./fesm2022/testing/index.mjs"
    }
  }
}
```

**Publishing Configuration:**

- `@ngx-signal-forms/toolkit` - **Main package** (core + optional secondary entries)
- `@ngx-signal-forms/vestjs` - **Separate optional package** (Vest.js integration)

**Benefits of This Approach:**

1. **Simplified Installation**: Most users only need `npm install @ngx-signal-forms/toolkit`
2. **Optional Features**: Use `@ngx-signal-forms/toolkit/form-field` only when needed
3. **Clear Separation**: Vest.js integration is a completely separate package
4. **Tree-shakable**: Unused secondary entry points are automatically excluded
5. **Professional**: Single main package with optional additions
6. **Future-proof**: Can extract shared core later if needed by both toolkit and vestjs

**Usage Examples:**

```typescript
// Primary entry - core directives and utilities
import {
  NgxSignalFormAutoAria,
  NgxSignalFormAutoTouch,
  NgxSignalFormErrorComponent,
  provideNgxSignalFormsConfig,
} from '@ngx-signal-forms/toolkit';

// Secondary entry - form field wrapper (optional)
import { NgxSignalFormField } from '@ngx-signal-forms/toolkit/form-field';

// Secondary entry - testing utilities (optional)
import { createTestForm } from '@ngx-signal-forms/toolkit/testing';

// Separate package - Vest.js integration (optional)
import { vestValidator } from '@ngx-signal-forms/vestjs';
```

#### Alternative: Single Package (Not Recommended)

```text
ngx-signal-forms-toolkit/
  ├── core/            # Core directives + utilities
  ├── form-field/      # Optional form field wrapper
  ├── testing/         # Test utilities
  └── index.ts         # Barrel exports
```

This approach is simpler but limits future growth and doesn't support the planned `vestjs` extension as cleanly.

---

## Conclusion

**@ngx-signal-forms/toolkit** brings production-ready features to Angular Signal Forms through non-intrusive directives, components, and utilities:

- ✅ **Zero API changes** - Pure enhancement via directives and providers
- ✅ **80% less boilerplate** - Automatic ARIA, touch, and error display
- ✅ **WCAG 2.2 compliant** - Accessibility by default
- ✅ **Progressive enhancement** - Start simple, add features as needed
- ✅ **Type-safe** - Full TypeScript inference from Signal Forms
- ✅ **Non-intrusive** - Enhances Signal Forms, doesn't replace it

### Architecture Philosophy

| Aspect                | Approach                                                  |
| --------------------- | --------------------------------------------------------- |
| **Form API**          | Uses Signal Forms API unchanged                           |
| **Validation**        | Uses Signal Forms validators                              |
| **Enhancements**      | Directives (auto-ARIA, auto-touch, form-busy)             |
| **Utilities**         | Pure functions (computeShowErrors, error strategies)      |
| **State Management**  | Providers (form context, submission tracking)             |
| **Components**        | Optional (error display, form field wrapper)              |
| **Configuration**     | Global provider (opt-in customization)                    |
| **Testing**           | Helper utilities (no framework lock-in)                   |
| **Type Safety**       | Full inference from Signal Forms schemas                  |
| **Bundle Size**       | Tree-shakable (use only what you need)                    |
| **Dependencies**      | `@angular/forms/signals` only (peer dependency)           |
| **Framework Version** | Angular 21+ (matches Signal Forms availability)           |
| **Production Ready**  | When Signal Forms becomes stable (currently experimental) |

### Comparison with Related Libraries

| Library                       | Focus                      | Validation Engine            | Enhancement Approach    |
| ----------------------------- | -------------------------- | ---------------------------- | ----------------------- |
| **@ngx-signal-forms/toolkit** | UX + Accessibility + DX    | Signal Forms (Angular API)   | Non-intrusive utilities |
| **ngx-vest-forms**            | Portable validation        | Vest.js (framework-agnostic) | Custom form abstraction |
| **Angular Forms (Reactive)**  | Traditional reactive forms | Built-in validators          | Core Angular API        |
| **Angular Forms (Template)**  | Template-driven forms      | Built-in validators          | Core Angular API        |

### When to Use Each

| Library/Approach           | Use When                                        |
| -------------------------- | ----------------------------------------------- |
| **Signal Forms alone**     | Learning Signal Forms API, minimal requirements |
| **Signal Forms + toolkit** | Production apps needing WCAG compliance + DX    |
| **ngx-vest-forms**         | Need portable validation across frameworks      |
| **Reactive Forms**         | Existing apps, stable API requirement           |
| **Template-driven Forms**  | Simple forms, rapid prototyping                 |

### Key Difference from ngx-vest-forms

- **ngx-vest-forms** = Validation-first library with custom form abstraction (Vest.js portable validation)
- **ngx-signal-forms-toolkit** = Enhancement-first library for Angular's native Signal Forms API

Both approaches are valid - choose based on your needs:

- Need portable validation across React/Vue/Angular? → **ngx-vest-forms**
- Want Angular-native forms with automatic accessibility? → **Signal Forms + toolkit**
- Need both? You can potentially combine them (validate with Vest, enhance with toolkit)

### Getting Started

```bash
# Install Signal Forms (Angular 21+)
npm install @angular/forms

# Install the toolkit (main package - includes core directives and utilities)
npm install @ngx-signal-forms/toolkit

# Optional: Install Vest.js integration (separate package)
npm install @ngx-signal-forms/vestjs
```

**Import Examples:**

```typescript
// Core features (always available from main package)
import {
  NgxSignalFormAutoAria,
  NgxSignalFormAutoTouch,
  provideNgxSignalFormsConfig,
} from '@ngx-signal-forms/toolkit';

// Form field wrapper (secondary entry point - optional)
import { NgxSignalFormField } from '@ngx-signal-forms/toolkit/form-field';

// Testing utilities (secondary entry point - optional, dev dependency)
import { createTestForm } from '@ngx-signal-forms/toolkit/testing';

// Vest.js validators (separate package - optional)
import { vestValidator } from '@ngx-signal-forms/vestjs';
```

### Minimal Setup

```typescript
// app.config.ts
import { provideNgxSignalFormsConfig } from '@ngx-signal-forms/toolkit';

export const appConfig: ApplicationConfig = {
  providers: [
    provideNgxSignalFormsConfig({
      autoAria: true,
      autoTouch: true,
      defaultErrorStrategy: 'on-touch',
    }),
  ],
};
```

### Progressive Adoption Path

1. **Level 0**: Use Signal Forms alone (learn the API)
2. **Level 1**: Add auto-ARIA directive (automatic accessibility)
3. **Level 2**: Add auto-touch directive (automatic blur handling)
4. **Level 3**: Add error component (reusable error display)
5. **Level 4**: Add form field wrapper (consistent layout)
6. **Level 5**: Add form provider (error strategies + submission tracking)

Each level is optional and can be adopted independently based on your needs!
