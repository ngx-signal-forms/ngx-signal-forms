---
description: '@ngx-signal-forms/toolkit - Enhancement library for Angular Signal Forms'
applyTo: '{apps}/**/*.{ts,html,scss,css}'
---

# @ngx-signal-forms/toolkit - Coding Instructions

## Overview

Enhancement toolkit for Angular 21+ Signal Forms providing automatic accessibility, error display strategies, and form field wrappers. **100% non-intrusive** - works alongside Signal Forms without modifying the core API.

## Technology Stack

- **Angular**: `>=21.1.0` (peer dependency) - requires `[formField]` directive, `focusBoundControl()`, `errorSummary()`
- **TypeScript**: `5.8+` with strict mode
- **Testing**: Vitest (unit), Playwright (E2E)
- **Architecture**: Standalone components, signal-based, OnPush change detection, zoneless-compatible

### Angular 21.1+ Requirements

The toolkit requires Angular 21.1+ for these features:

| Feature                 | Used By               | Description                            |
| ----------------------- | --------------------- | -------------------------------------- |
| `[formField]` directive | All components        | Renamed from `[field]` in 21.1         |
| `focusBoundControl()`   | `focusFirstInvalid()` | Focus UI control bound to a field      |
| `errorSummary()`        | `focusFirstInvalid()` | Get all errors including nested fields |
| `formFieldBindings`     | Auto ARIA directive   | Track bound FormField directives       |

## Project Structure

```
packages/toolkit/
├── core/                           # Secondary entry (re-exported by toolkit)
│   ├── components/                 # NgxSignalFormErrorComponent
│   ├── directives/                 # NgxSignalFormDirective, NgxSignalFormAutoAriaDirective
│   ├── providers/                  # provideNgxSignalFormsConfig, provideErrorMessages
│   ├── utilities/                  # Helper functions (submission-helpers, show-errors, etc.)
│   └── public_api.ts               # Public exports + NgxSignalFormToolkit bundle
└── form-field/                     # @ngx-signal-forms/toolkit/form-field
    ├── form-field.component.ts     # Main wrapper component
    ├── floating-label.directive.ts # Outlined Material Design layout
    ├── form-field-hint.component.ts
    ├── form-field-character-count.component.ts
    └── public_api.ts               # Public exports + NgxOutlinedFormField bundle
```

## Core Design Principles

1. **Non-Intrusive**: Never modify Angular Signal Forms API
2. **Accessibility-First**: WCAG 2.2 Level AA compliant by default
3. **Convention-Based**: Use `'warn:'` prefix for warnings
4. **Type-Safe**: Full TypeScript inference with generics
5. **Signal-First**: Signals over RxJS (except streams)
6. **OnPush Required**: All components use `ChangeDetectionStrategy.OnPush`
7. **ES Private Fields**: Use `#` prefix (not TypeScript `private`)

## Type System

### ReactiveOrStatic<T>

Accepts signals, functions, or static values:

```typescript
import type { ReactiveOrStatic } from '@ngx-signal-forms/toolkit';

const static: ReactiveOrStatic<ErrorDisplayStrategy> = 'on-touch';
const sig: ReactiveOrStatic<ErrorDisplayStrategy> = signal('on-touch');
const comp: ReactiveOrStatic<ErrorDisplayStrategy> = computed(() => 'on-touch');
```

### ErrorDisplayStrategy

```typescript
type ErrorDisplayStrategy =
  | 'immediate' // Real-time (as user types)
  | 'on-touch' // After blur or submit (WCAG recommended - DEFAULT)
  | 'on-submit' // Only after form submission
  | 'manual' // Programmatic control
  | 'inherit'; // Inherit from form provider (field-level only)
```

### Warning Convention

- **Errors** (blocking): `kind` does NOT start with `'warn:'`
- **Warnings** (non-blocking): `kind` starts with `'warn:'`

```typescript
import { warningError } from '@ngx-signal-forms/toolkit';

// Error (blocks submission)
customError({ kind: 'required', message: 'Email required' });

// Warning (does not block)
warningError('weak-password', 'Consider 12+ characters');
```

**ARIA Roles**:

- Errors: `role="alert"` + `aria-live="assertive"`
- Warnings: `role="status"` + `aria-live="polite"`

## Configuration

### Global Config (Optional)

```typescript
import { provideNgxSignalFormsConfig } from '@ngx-signal-forms/toolkit';

export const appConfig: ApplicationConfig = {
  providers: [
    provideNgxSignalFormsConfig({
      autoAria: true, // Default
      defaultErrorStrategy: 'on-touch', // Default
      defaultFormFieldAppearance: 'outline', // Optional: 'default' | 'outline'
      strictFieldResolution: false, // Default
      debug: false, // Default
    }),
  ],
};
```

## Public API

### Bundle Import (Recommended)

```typescript
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';

@Component({
  imports: [FormField, NgxSignalFormToolkit],
  template: `
    <!-- ✅ Works WITHOUT [ngxSignalForm] for default 'on-touch' strategy -->
    <form (submit)="save($event)">
      <input [formField]="userForm.email" />
      <ngx-signal-form-error [formField]="userForm.email" fieldName="email" />
      <button type="submit">Submit</button>
    </form>
  `,
})
```

**Contains**: `NgxSignalFormDirective`, `NgxSignalFormAutoAriaDirective`, `NgxSignalFormErrorComponent`

### Form Field Bundle Import

```typescript
import { NgxOutlinedFormField } from '@ngx-signal-forms/toolkit/form-field';

@Component({
  imports: [FormField, NgxSignalFormToolkit, NgxOutlinedFormField],
  template: `
    <ngx-signal-form-field [formField]="form.email" outline>
      <label for="email">Email</label>
      <input id="email" [formField]="form.email" />
    </ngx-signal-form-field>
  `,
})
```

**Contains**: `NgxSignalFormFieldComponent`, `NgxFloatingLabelDirective`, `NgxSignalFormFieldHintComponent`, `NgxSignalFormFieldCharacterCountComponent`, `NgxSignalFormFieldsetComponent`

### Individual Imports (Alternative)

```typescript
import {
  /* Lines 167-169 omitted */
  NgxSignalFormErrorComponent,
} from '@ngx-signal-forms/toolkit';
```

## Theming & Styling

The toolkit uses a 4-layer CSS Custom Property architecture.

### Layer 1: Shared Feedback (Base)

Controls typography and spacing for all feedback elements (Error, Hint, Char Count).
**Use these for global consistency.**

- `--ngx-signal-form-feedback-font-size` (Default: `0.75rem`)
- `--ngx-signal-form-feedback-line-height` (Default: `1.25`)
- `--ngx-signal-form-feedback-margin-top` (Default: `0.25rem`)
- `--ngx-signal-form-feedback-padding-horizontal` (Default: `0`)

Shared feedback variables (full list): `font-size`, `line-height`, `margin-top`, `padding-horizontal`.

### Layer 2: Semantic Colors

Controls colors based on intent.

- `--ngx-form-field-color-primary`: Focus states
- `--ngx-form-field-color-error`: Invalid states
- `--ngx-form-field-color-warning`: Warning states
- `--ngx-form-field-color-text`: Input text

### Layer 3: Component Overrides

Specific overrides for individual components.

- `ngx-signal-form-error`: `--ngx-signal-form-error-color`
- `ngx-signal-form-fieldset`: `--ngx-signal-form-fieldset-gap`

See `packages/toolkit/form-field/THEMING.md` for the full API.

### Theming Do / Don’t

**Do** use CSS custom properties as the public API:

```css
ngx-signal-form-field {
  --ngx-form-field-color-primary: #3b82f6;
  --ngx-signal-form-feedback-font-size: 0.875rem;
}
```

**Don’t** use `::ng-deep` or override internal selectors.

## Architecture

### Key Insight: `[ngxSignalForm]` is Optional for Most Use Cases

The toolkit is designed so that **most forms work without `[ngxSignalForm]`**. The default `'on-touch'` strategy only checks `field.invalid() && field.touched()` - no form context needed.

**Why this works:** Angular's `submit()` helper calls `markAllAsTouched()` before your async handler, so `touched()` becomes true for all fields after both blur AND submit.

### Feature Comparison: With vs Without `[ngxSignalForm]`

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

### When to Use Each Approach

**Without `[ngxSignalForm]` (Recommended for most forms):**

- Using default `'on-touch'` error strategy
- Want automatic ARIA attributes and error display
- Simpler template with less boilerplate

**Avoid `[ngxSignalForm]` when you don’t need form-level strategy overrides** — it adds context you’re not using and increases boilerplate.

**With `[ngxSignalForm]` (Only when needed):**

- Need `'on-submit'` error strategy (requires `submittedStatus`)
- Need form-level `[errorStrategy]` override
- Need `submittedStatus` in custom components
- Building complex multi-step forms

## Core Directives

### NgxSignalFormDirective

**Selector**: `form[ngxSignalForm], form(submit)` (auto-applied to forms with submit handler)

**Automatic Features (both selectors)**:

- Adds `novalidate` attribute to prevent HTML5 validation conflicts

**Context Features (requires `[ngxSignalForm]` binding)**:

- Provides form context to child components via DI
- Derives `submittedStatus` from Angular's native `submitting()` transitions via `effect()`
- Manages error display strategy

```typescript
// ✅ Recommended: Works for most forms (no [ngxSignalForm] needed)
<form (submit)="save($event)">
  <ngx-signal-form-field [formField]="form.email">
    <label for="email">Email</label>
    <input id="email" [formField]="form.email" />
  </ngx-signal-form-field>
  <button type="submit">Submit</button>
</form>

// Only needed for 'on-submit' strategy or form-level overrides
<form [ngxSignalForm]="userForm" [errorStrategy]="'on-submit'" (submit)="save($event)">
  <ngx-signal-form-error [formField]="userForm.email" fieldName="email" />
</form>
```

**Input Properties**:

- `ngxSignalForm` (optional): The form instance (FieldTree) - only needed for `'on-submit'` strategy
- `errorStrategy` (optional): Error display strategy override

### NgxSignalFormAutoAriaDirective

**Selector**: `input[formField], textarea[formField], select[formField]` (auto-applied when imported)

**Features**:

- Auto-adds `aria-invalid="true"` when field is invalid
- Auto-adds `aria-describedby` linking to error containers
- Uses `id` attribute for field name resolution (WCAG preferred)

**Field Name Resolution Priority**:

1. `data-signal-field` attribute (explicit override)
2. Custom resolver from global config
3. `id` attribute (recommended)
4. `name` attribute (fallback)

**Opt-out**: Use `ngxSignalFormAutoAriaDisabled` attribute

## Core Components

### NgxSignalFormErrorComponent

**Selector**: `ngx-signal-form-error`

Displays validation errors and warnings with WCAG-compliant ARIA roles.

**Simplified Usage (Default `'on-touch'` Strategy):**

```typescript
<!-- ✅ Works WITHOUT [ngxSignalForm] - errors show after blur OR submit -->
<form (submit)="save($event)">
  <input id="email" [formField]="form.email" />
  <ngx-signal-form-error [formField]="form.email" fieldName="email" />
</form>
```

**With Form Context (For `'on-submit'` Strategy):**

```typescript
<!-- Requires [ngxSignalForm] for submittedStatus signal -->
<form [ngxSignalForm]="form" [errorStrategy]="'on-submit'" (submit)="save($event)">
  <ngx-signal-form-error [formField]="form.email" fieldName="email" />
</form>
```

**Required Inputs**:

- `field`: The field from your form (FieldTree)
- `fieldName`: Field name string (must match `id` for ARIA)

**Optional Inputs**:

- `strategy`: Error display strategy (default: `'on-touch'`)
- `submittedStatus`: Form submission state (auto-injected when inside `[ngxSignalForm]}`, optional for `'on-touch'`. If provided manually, must be a `Signal<SubmittedStatus>`)

### NgxSignalFormFieldComponent

**Selector**: `ngx-signal-form-field`

Reusable form field wrapper with automatic error display.

```typescript
<ngx-signal-form-field [formField]="form.email" fieldName="email">
  <label for="email">Email</label>
  <input id="email" [formField]="form.email" />
</ngx-signal-form-field>
```

**Required Inputs**:

- `field`: The field from your form
- `fieldName`: Field name string (auto-derived from `id` if omitted)

**Optional Inputs**:

- `strategy`: Error display strategy
- `showErrors`: Toggle automatic error display (default: `true`)

**Features**:

- Content projection for labels/inputs
- Automatic error/warning display
- Inherits error strategy from form directive
- Type-safe with generics
- Supports `outline` attribute for Material Design layout

## Utilities

### showErrors()

Convenience wrapper for computing error visibility. The `submittedStatus` parameter is **optional** for `'on-touch'` strategy.

```typescript
import { showErrors } from '@ngx-signal-forms/toolkit';

// ✅ Simplified: Works without submittedStatus for 'on-touch'
protected readonly shouldShowErrors = showErrors(
  this.form.email,        // FieldTree
  'on-touch',             // ErrorDisplayStrategy
);

// With submittedStatus (for 'on-submit' strategy)
protected readonly shouldShowErrors = showErrors(
  this.form.email,
  'on-submit',
  this.submittedStatus,   // Required for 'on-submit'
);
```

**Returns**: `Signal<boolean>` - Whether to show errors

### warningError()

```typescript
import { warningError } from '@ngx-signal-forms/toolkit';

validate(path.password, (ctx) => {
  if (ctx.value().length < 12) {
    return warningError('short-password', 'Consider 12+ characters');
  }
  return null;
});
```

### combineShowErrors()

```typescript
import { combineShowErrors, showErrors } from '@ngx-signal-forms/toolkit';

// ✅ Simplified: No submittedStatus needed for 'on-touch'
protected readonly showAnyFormErrors = combineShowErrors([
  showErrors(this.userForm.email, 'on-touch'),
  showErrors(this.userForm.password, 'on-touch'),
]);
```

### isWarningError() / isBlockingError()

```typescript
import { isWarningError, isBlockingError } from '@ngx-signal-forms/toolkit';

const allErrors = form.email().errors();
const warnings = allErrors.filter(isWarningError);
const blockingErrors = allErrors.filter(isBlockingError);
```

### focusFirstInvalid()

Focus the first invalid field after form submission for better UX and accessibility.

```typescript
import { focusFirstInvalid } from '@ngx-signal-forms/toolkit';

protected save(): void {
  if (this.userForm().invalid()) {
    focusFirstInvalid(this.userForm);
  }
}
```

**How it works (Angular 21.1+):**

1. Uses `errorSummary()` to get all validation errors (including nested fields)
2. Takes the first error's `fieldTree` property
3. Calls native `focusBoundControl()` on that field's state

**Returns**: `boolean` - `true` if an invalid field was found and focused

**Note**: Custom control directives must implement a `focus()` method for `focusBoundControl()` to work.

### ngxStatusClasses()

Generates CSS class configuration that syncs with your error display strategy. Angular 21.1+'s `provideSignalFormsConfig` applies classes immediately by default, but toolkit's error messages use `'on-touch'` strategy. This utility aligns both.

**Use case:** Prevent red borders appearing immediately while error messages wait until field is touched.

```typescript
import { provideSignalFormsConfig } from '@angular/forms/signals';
import { ngxStatusClasses } from '@ngx-signal-forms/toolkit';

export const appConfig: ApplicationConfig = {
  providers: [
    provideSignalFormsConfig({
      classes: ngxStatusClasses({
        strategy: 'on-touch', // Sync with toolkit's error display
        invalidClass: 'is-invalid', // Optional: custom class names
      }),
    }),
  ],
};
```

**Alternative convenience provider:**

```typescript
import { provideNgxStatusClasses } from '@ngx-signal-forms/toolkit';

providers: [provideNgxStatusClasses({ strategy: 'on-touch' })];
```

**Options:**

- `strategy`: `'on-touch'` (default) | `'immediate'`
- `validClass`, `invalidClass`, `touchedClass`, `untouchedClass`, `dirtyClass`, `pristineClass`: Custom class names

### Submission Helpers

Convenience computed signals for common submission states:

```typescript
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

| Helper           | Returns `true` when                        |
| ---------------- | ------------------------------------------ |
| `canSubmit()`    | Form is valid AND not currently submitting |
| `isSubmitting()` | Form submission is in progress             |
| `hasSubmitted()` | Form has completed at least one submission |

> **Note:** `hasSubmitted()` uses `effect()` internally. It **MUST** be called within an **injection context** (property initializer or constructor).

**Note**: Angular Signal Forms does NOT expose a `submittedStatus()` signal. The toolkit derives the status from native `submitting()` transitions.

### provideErrorMessages()

Optional error message registry for customizing validation error display.

**Philosophy**: Zero-config by default. Standard Schema libraries (Zod, Valibot, ArkType) include error messages. This provider is only needed for:

- Centralized message management (DRY principle)
- Internationalization (i18n)
- Customizing built-in Angular Signal Forms validators

**Message Priority (3-tier system)**:

1. **Validator message** - From Zod/Valibot schema (used first!)
2. **Registry override** - From this provider (optional)
3. **Default fallback** - Toolkit's built-in messages

```typescript
import { provideErrorMessages } from '@ngx-signal-forms/toolkit';

export const appConfig: ApplicationConfig = {
  providers: [
    provideErrorMessages({
      required: 'This field is required',
      email: 'Please enter a valid email address',
      minLength: (params) =>
        `At least ${(params as { minLength: number }).minLength} characters`,
    }),
  ],
};
```

**i18n Example:**

```typescript
import { LOCALE_ID } from '@angular/core';
import { provideErrorMessages } from '@ngx-signal-forms/toolkit';

provideErrorMessages(() => {
  const locale = inject(LOCALE_ID);
  const messages = locale === 'ja' ? jaMessages : enMessages;
  return {
    required: messages.required,
    email: messages.email,
  };
});
```

### computeShowErrors() / shouldShowErrors()

Lower-level utilities for computing error visibility. Most users should use `showErrors()` instead.

```typescript
import { computeShowErrors, shouldShowErrors } from '@ngx-signal-forms/toolkit';

// Reactive version - returns Signal<boolean>
// Accepts ReactiveOrStatic<T> for all parameters (signals, functions, or static values)
protected readonly showEmailErrors = computeShowErrors(
  this.form.email,      // ReactiveOrStatic<FieldState<T>>
  'on-touch',           // ReactiveOrStatic<ErrorDisplayStrategy>
  this.submittedStatus, // ReactiveOrStatic<SubmittedStatus> - OPTIONAL for 'on-touch'
);

// Non-reactive version - returns boolean
// Use for imperative code (e.g., in event handlers)
if (shouldShowErrors(this.form.email(), 'on-touch', 'submitted')) {
  // Field should display errors
}
```

### Context Injection Functions (CIFs)

CIFs provide access to toolkit context in custom directives and components.

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

### unwrapValue()

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

## Form Field Components

### NgxFloatingLabelDirective

**Selector**: `ngx-signal-form-field[outline]`

Transforms form field into Material Design outlined layout.

```typescript
<ngx-signal-form-field [formField]="form.email" outline>
  <label for="email">Email Address</label>
  <input id="email" type="email" [formField]="form.email" required placeholder="you@example.com" />
</ngx-signal-form-field>
```

**Inputs**:

- `showRequiredMarker` (boolean, default: `true`)
- `requiredMarker` (string, default: `' *'`)

**Browser Support**: Chrome 105+, Firefox 121+, Safari 15.4+, Edge 105+ (95%+ coverage)

### NgxSignalFormFieldHintComponent

**Selector**: `ngx-signal-form-field-hint`

Displays helper text for form fields.

```typescript
<ngx-signal-form-field [formField]="form.phone">
  <label for="phone">Phone Number</label>
  <input id="phone" [formField]="form.phone" />
  <ngx-signal-form-field-hint>Format: 123-456-7890</ngx-signal-form-field-hint>
</ngx-signal-form-field>
```

### NgxSignalFormFieldCharacterCountComponent

**Selector**: `ngx-signal-form-field-character-count`

Displays character count with progressive color states.

```typescript
<ngx-signal-form-field [formField]="form.bio">
  <label for="bio">Bio</label>
  <textarea id="bio" [formField]="form.bio"></textarea>
  <ngx-signal-form-field-character-count [formField]="form.bio" [maxLength]="500" />
</ngx-signal-form-field>
```

**Required Inputs**:

- `field`: The Signal Forms field
- `maxLength`: Maximum character limit

**Optional Inputs**:

- `showLimitColors` (boolean, default: `true`)
- `colorThresholds` (object, default: `{ warning: 80, danger: 95 }`)

**Color States**:

- **ok** (0-80%): Gray
- **warning** (80-95%): Amber
- **danger** (95-100%): Red
- **exceeded** (>100%): Dark red, bold

## CSS Custom Properties

All components support CSS custom properties for theming. Prefix: `--ngx-signal-form-*`

### Error Component

```css
:root {
  --ngx-signal-form-error-color: #dc2626;
  --ngx-signal-form-error-bg: transparent;
  --ngx-signal-form-warning-color: #f59e0b;
  --ngx-signal-form-warning-bg: transparent;
  --ngx-signal-form-error-margin-top: 0.375rem;
  --ngx-signal-form-error-font-size: 0.875rem;
}

@media (prefers-color-scheme: dark) {
  :root {
    --ngx-signal-form-error-color: #fca5a5;
    --ngx-signal-form-warning-color: #fcd34d;
  }
}
```

### Form Field Component

```css
:root {
  --ngx-signal-form-field-gap: 0.375rem;
  --ngx-signal-form-field-label-color: #374151;
  --ngx-signal-form-field-border-color: #d1d5db;
  --ngx-signal-form-field-border-radius: 0.375rem;
}
```

## Coding Patterns

### Component Structure

```typescript
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
} from '@angular/core';
import type { FieldTree } from '@angular/forms/signals';

@Component({
  selector: 'ngx-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    /* standalone imports */
  ],
  template: `<!-- template -->`,
  styles: `
    /* styles */
  `,
})
export class ExampleComponent {
  // Use ES # private fields (not TypeScript private)
  readonly #privateState = signal({});

  // Public/protected signals for template binding
  protected readonly publicState = computed(() => this.#privateState());

  // Input properties
  readonly field = input.required<FieldTree<string>>();
}
```

### Directive Structure

```typescript
import { Directive, inject, input } from '@angular/core';

@Directive({
  selector: '[ngxExample]',
  exportAs: 'ngxExample',
  host: {
    // Prefer host over @HostListener/@HostBinding
    '(event)': 'handler()',
    '[attr.aria-*]': 'ariaValue()',
  },
})
export class ExampleDirective {
  readonly #config = inject(CONFIG_TOKEN);
  readonly value = input.required<string>();

  protected handler(): void {
    // Implementation
  }
}
```

### Utility Functions

```typescript
import { computed, type Signal } from '@angular/core';
import type { ReactiveOrStatic } from '../types';

export function utilityFunction<T>(value: ReactiveOrStatic<T>): Signal<T> {
  return computed(() => {
    return typeof value === 'function' ? value() : value;
  });
}
```

## Testing

### Unit Tests (Vitest)

```typescript
import { render, screen } from '@testing-library/angular';
import { signal } from '@angular/core';
import { describe, it, expect } from 'vitest';

describe('ExampleComponent', () => {
  it('should render', async () => {
    const model = signal({ email: '' });

    await render(ExampleComponent, {
      componentProperties: { model },
    });

    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });
});
```

### E2E Tests (Playwright)

```typescript
import { test, expect } from '@playwright/test';

test('should validate accessibility tree', async ({ page }) => {
  await page.goto('/form');

  await expect(page.getByRole('form')).toMatchAriaSnapshot(`
    - form:
      - textbox "Email" [invalid]:
        - aria-describedby: email-error
      - alert: "Email is required"
  `);
});
```

## Best Practices

1. **OnPush Required**: All components must use `ChangeDetectionStrategy.OnPush`
2. **ES Private Fields**: Use `#` prefix (not TypeScript `private`)
3. **Signal-First**: Prefer signals over RxJS for state
4. **Type Safety**: Use generics for FieldTree types
5. **WCAG Compliance**: Follow WCAG 2.2 Level AA
6. **CSS Custom Properties**: All theming via CSS custom properties
7. **Tree-Shakable**: Use secondary entry points (`core`, `form-field`)
8. **Non-Intrusive**: Never modify Angular Signal Forms API
9. **Convention-Based**: Use `'warn:'` prefix for warnings
10. **Default Strategy**: Always use `'on-touch'` unless specified

## WCAG 2.2 Compliance Checklist

- [ ] All inputs have associated labels
- [ ] Error messages linked via `aria-describedby`
- [ ] Errors use `role="alert"` with `aria-live="assertive"`
- [ ] Warnings use `role="status"` with `aria-live="polite"`
- [ ] Field names resolved from `id` attribute
- [ ] Color contrast ≥ 4.5:1
- [ ] Focus indicators visible
- [ ] Keyboard navigable
- [ ] Form has `novalidate` attribute

## Resources

- [Toolkit README](../../packages/toolkit/README.md)
- [Form Field Documentation](../../packages/toolkit/form-field/README.md)
- [CSS Framework Integration](../../docs/CSS_FRAMEWORK_INTEGRATION.md)
- [Signal Forms Instructions](./angular-signal-forms.instructions.md)
- [Angular Signal Forms API](https://angular.dev/api/forms/signals)
- [WCAG 2.2 Guidelines](https://www.w3.org/WAI/WCAG22/quickref/)
