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
├── assistive/                      # Error, hint, character count components
├── core/                           # Secondary entry (re-exported by toolkit)
│   ├── directives/                 # NgxSignalFormDirective, NgxSignalFormAutoAriaDirective
│   ├── providers/                  # provideNgxSignalFormsConfig, provideErrorMessages
│   ├── utilities/                  # Helper functions (submission-helpers, show-errors, etc.)
│   └── public_api.ts               # Public exports + NgxSignalFormToolkit bundle
└── form-field/                     # @ngx-signal-forms/toolkit/form-field
    ├── form-field-wrapper.component.ts # Main wrapper component
    ├── floating-label.directive.ts # Outlined Material Design layout
    ├── form-field-hint.component.ts
    ├── form-field-character-count.component.ts
    └── public_api.ts               # Public exports + NgxFormField bundle
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

### ErrorDisplayStrategy

```typescript
type ErrorDisplayStrategy =
  | 'immediate' // Real-time (as user types)
  | 'on-touch' // After blur or submit (WCAG recommended - DEFAULT)
  | 'on-submit' // Only after form submission
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
      defaultFormFieldAppearance: 'outline', // Optional: 'standard' | 'outline'
    }),
  ],
};
```

## Public API

### Bundle Import (Recommended)

```typescript
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';
import { NgxSignalFormErrorComponent } from '@ngx-signal-forms/toolkit/assistive';

@Component({
  imports: [FormField, NgxSignalFormToolkit, NgxSignalFormErrorComponent],
  template: `
    <!-- [formRoot] handles novalidate, preventDefault, and submit() -->
    <form [formRoot]="userForm">
      <input [formField]="userForm.email" />
      <ngx-signal-form-error [formField]="userForm.email" fieldName="email" />
      <button type="submit">Submit</button>
    </form>
  `,
})
```

**Contains**: `NgxSignalFormDirective`, `NgxSignalFormAutoAriaDirective`

### Form Field Bundle Import

```typescript
import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';

@Component({
  imports: [FormField, NgxSignalFormToolkit, NgxFormField],
  template: `
    <ngx-signal-form-field-wrapper [formField]="form.email" appearance="outline">
      <label for="email">Email</label>
      <input id="email" [formField]="form.email" />
    </ngx-signal-form-field-wrapper>
  `,
})
```

**Contains**: `NgxFormField` (bundle), `NgxSignalFormFieldset`

### Individual Imports (Alternative)

```typescript
import {
  NgxSignalFormDirective,
  NgxSignalFormAutoAriaDirective,
} from '@ngx-signal-forms/toolkit';
import { NgxSignalFormErrorComponent } from '@ngx-signal-forms/toolkit/assistive';
```

### Debugger

```typescript
import { NgxSignalFormDebugger } from '@ngx-signal-forms/toolkit/debugger';

@Component({
  imports: [NgxSignalFormDebugger],
  template: `
    <ngx-signal-form-debugger [formTree]="userForm" />
  `,
})
```

**Important:** Pass the FieldTree function (e.g. `userForm`), not the root state (`userForm()`).
`FieldState` is supported as a fallback but cannot traverse child fields, which can make error
visibility look incorrect.

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
ngx-signal-form-field-wrapper {
  --ngx-form-field-color-primary: #3b82f6;
  --ngx-signal-form-feedback-font-size: 0.875rem;
}
```

**Don’t** use `::ng-deep` or override internal selectors.

## Architecture

### Key Insight: Prefer `[formRoot]` for Toolkit Forms

Use `<form [formRoot]="form">` as the default with toolkit components.

The directive replicates Angular's `FormRoot` baseline behavior (`novalidate`, `preventDefault()`, `submit()`) and adds three enhancements that Angular's `FormRoot` does not provide:

- **DI context** (`NGX_SIGNAL_FORM_CONTEXT`) — enables child components to access form-level state (submission status, error strategy) without prop drilling
- **Submitted status tracking** — derives `'unsubmitted' → 'submitting' → 'submitted'` lifecycle from Angular's `submitting()` signal, required for `'on-submit'` error strategy
- **Error display strategy** — configurable timing (`'on-touch'`, `'on-submit'`, `'immediate'`) so errors appear at the right moment per UX/WCAG best practices

### Feature Comparison: With vs Without `[formRoot]`

| Feature                                          | Without `[formRoot]` | With `[formRoot]` |
| ------------------------------------------------ | :------------------: | :---------------: |
| Auto `novalidate` on form                        |          ❌          |        ✅         |
| Auto `preventDefault()` on submit                |          ❌          |        ✅         |
| Declarative `submission` support                 |          ❌          |        ✅         |
| Auto `aria-invalid` when touched + invalid       |          ✅          |        ✅         |
| Auto `aria-describedby` linking                  |          ✅          |        ✅         |
| `<ngx-signal-form-error>` (`'on-touch'`)         |       ✅ Works       |     ✅ Works      |
| `<ngx-signal-form-field-wrapper>` (`'on-touch'`) |    ✅ Auto errors    |  ✅ Auto errors   |
| `<ngx-signal-form-error>` (`'on-submit'`)        |    ❌ No context     |     ✅ Works      |
| Form-level `[errorStrategy]` override            |          ❌          |        ✅         |
| `submittedStatus` signal via DI                  |          ❌          |        ✅         |

### When to Use Each Approach

**Without `[formRoot]` (advanced/manual setup):**

- You intentionally handle native submit yourself
- You explicitly set `novalidate`
- You do not need form-level context

**With `[formRoot]` (recommended):**

- Need `'on-submit'` error strategy (requires `submittedStatus`)
- Need form-level `[errorStrategy]` override
- Need `submittedStatus` in custom components
- Building complex multi-step forms

## Core Directives

### NgxSignalFormDirective

**Selector**: `form[formRoot]`

Replicates Angular's `FormRoot` baseline (`novalidate`, `preventDefault()`, `submit()`) and adds:

- **DI context** (`NGX_SIGNAL_FORM_CONTEXT`) — child components access form-level state without prop drilling
- **Submitted status** — derives `'unsubmitted' → 'submitting' → 'submitted'` (Angular only has `submitting()`)
- **Error display strategy** — configurable timing (`'on-touch'`, `'on-submit'`, `'immediate'`)

```typescript
// ✅ Recommended: Declarative submission with [formRoot]
<form [formRoot]="form">
  <ngx-signal-form-field-wrapper [formField]="form.email">
    <label for="email">Email</label>
    <input id="email" [formField]="form.email" />
  </ngx-signal-form-field-wrapper>
  <button type="submit">Submit</button>
</form>

// With on-submit strategy
<form [formRoot]="userForm" [errorStrategy]="'on-submit'">
  <ngx-signal-form-error [formField]="userForm.email" fieldName="email" />
</form>
```

**Input Properties**:

- `formRoot` (required): The form instance (FieldTree)
- `errorStrategy` (optional): Error display strategy override

### NgxSignalFormAutoAriaDirective

**Selector**: `input[formField], textarea[formField], select[formField]` (auto-applied when imported)

**Features**:

- Auto-adds `aria-invalid="true"` when field is invalid (respects error display strategy)
- Auto-adds `aria-required="true"` when field has `required()` validator
- Auto-adds `aria-describedby` linking to error/warning containers
- Uses `id` attribute for field name resolution (WCAG preferred)

**ARIA Attributes Handled by Toolkit** (do NOT add manually):

| Attribute          | When Applied                          | Source                       |
| ------------------ | ------------------------------------- | ---------------------------- |
| `aria-invalid`     | Field is invalid + errors should show | Error display strategy       |
| `aria-required`    | Field has `required()` validator      | FieldState `required` signal |
| `aria-describedby` | Field has errors/warnings visible     | Links to error/warning IDs   |

**Important**: When using `NgxSignalFormToolkit`, do NOT manually add `aria-required="true"`
or `aria-invalid` attributes. The toolkit handles these automatically based on form state.
Angular Signal Forms' `required()` validator exposes a `required` signal on FieldState,
which the toolkit reads to set `aria-required="true"` automatically.

**Field Name Resolution**:

- Toolkit field identity is deterministic and based on the bound control `id`
- For standalone/headless APIs, provide `fieldName` explicitly when there is no bound control `id`
- The toolkit does not silently invent field names for public APIs

**Opt-out**: Use `ngxSignalFormAutoAriaDisabled` attribute

## Core Components

### NgxSignalFormErrorComponent

**Selector**: `ngx-signal-form-error`

Displays validation errors and warnings with WCAG-compliant ARIA roles.

**Simplified Usage (Default `'on-touch'` Strategy):**

```typescript
<!-- ✅ Recommended: use [formRoot] for submit lifecycle + context -->
<form [formRoot]="form">
  <input id="email" [formField]="form.email" />
  <ngx-signal-form-error [formField]="form.email" fieldName="email" />
</form>
```

**With Form Context (For `'on-submit'` Strategy):**

```typescript
<!-- Requires [formRoot] for submittedStatus signal -->
<form [formRoot]="form" [errorStrategy]="'on-submit'">
  <ngx-signal-form-error [formField]="form.email" fieldName="email" />
</form>
```

**Required Inputs**:

- `field`: The field from your form (FieldTree)
- `fieldName`: Field name string (must match `id` for ARIA)

**Optional Inputs**:

- `strategy`: Error display strategy (default: `'on-touch'`)
- `submittedStatus`: Form submission state (auto-injected when inside `[formRoot]}`, optional for `'on-touch'`. If provided manually, must be a `Signal<SubmittedStatus>`)

### NgxFormField

**Selector**: `ngx-signal-form-field-wrapper`

Reusable form field wrapper with automatic error display.

```typescript
<ngx-signal-form-field-wrapper [formField]="form.email" fieldName="email">
  <label for="email">Email</label>
  <input id="email" [formField]="form.email" />
</ngx-signal-form-field-wrapper>
```

**Required Inputs**:

- `field`: The field from your form
- `fieldName`: Field name string (optional when the bound control has an `id`)

**Optional Inputs**:

- `strategy`: Error display strategy

**Features**:

- Content projection for labels/inputs
- Automatic error/warning display
- Inherits error strategy from form directive
- Type-safe with generics
- Supports `appearance` input for Material Design layout (`'standard' | 'outline' | 'inherit'`)

### NgxSignalFormFieldset

**Selector**: `ngx-signal-form-fieldset, [ngxSignalFormFieldset]`

Groups related form fields with aggregated error/warning display.

```html
<!-- Group-Only Mode (default) - when nested fields show their own errors -->
<ngx-signal-form-fieldset [fieldsetField]="form.passwords">
  <ngx-signal-form-field-wrapper
    [formField]="form.passwords.password"
    appearance="outline"
    >...</ngx-signal-form-field-wrapper
  >
  <ngx-signal-form-field-wrapper
    [formField]="form.passwords.confirm"
    appearance="outline"
    >...</ngx-signal-form-field-wrapper
  >
  <!-- Fieldset shows ONLY cross-field error: "Passwords must match" -->
</ngx-signal-form-fieldset>

<!-- Aggregated Mode - fieldset shows all errors for plain inputs -->
<fieldset
  ngxSignalFormFieldset
  [fieldsetField]="form.address"
  includeNestedErrors
>
  <input [formField]="form.address.street" />
  <input [formField]="form.address.city" />
  <!-- Fieldset shows ALL errors: "Street required", "City required" -->
</fieldset>
```

**Required Inputs**:

- `fieldsetField`: The Signal Forms field tree to aggregate from

**Optional Inputs**:

- `fieldsetId`: Unique identifier for generating error/warning IDs
- `fields`: Explicit list of fields for custom groupings
- `strategy`: Error display strategy (inherits from form context)
- `showErrors`: Toggle automatic error display (default: `true`)
- `includeNestedErrors`: Error aggregation mode (default: `false`)

**Error Display Modes** (`includeNestedErrors`):

- `false` (default): Shows ONLY group-level errors via `errors()`. Use when nested fields display their own errors via `NgxSignalFormField` (avoids duplication).
- `true`: Shows ALL errors via `errorSummary()`. Use when nested fields do NOT display their own errors (e.g., plain inputs).

**Host CSS Classes**:

- `.ngx-signal-form-fieldset` - Always applied
- `.ngx-signal-form-fieldset--invalid` - Applied when showing errors
- `.ngx-signal-form-fieldset--warning` - Applied when showing warnings (no errors)

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

### CSS Status Classes (Angular's Native API)

The toolkit uses ARIA attributes (`aria-invalid`, `aria-describedby`) for accessibility and styling. If you need CSS validation classes for framework integration (Bootstrap, etc.), use Angular's native `provideSignalFormsConfig`:

```typescript
import {
  provideSignalFormsConfig,
  NG_STATUS_CLASSES,
} from '@angular/forms/signals';

export const appConfig: ApplicationConfig = {
  providers: [
    provideSignalFormsConfig({
      classes: NG_STATUS_CLASSES, // Adds ng-valid, ng-invalid, ng-touched, etc.
    }),
  ],
};
```

See Angular's [Custom Form Status Classes](https://netbasal.medium.com/custom-form-status-classes-in-angular-signal-forms-388553becd68) guide for customization options.

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
// Accepts signals/functions/static values for utility parameters
protected readonly showEmailErrors = computeShowErrors(
  this.form.email,
  'on-touch',
  this.submittedStatus,
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

**Optional injector parameter:**

`injectFormContext()` accepts an optional `Injector` parameter for use outside injection context:

```typescript
// Inside injection context (normal usage)
const context = injectFormContext();

// Outside injection context (e.g., in a callback)
const context = injectFormContext(this.injector);
```

### unwrapValue()

Extracts the current value from a utility input that may be a signal, function, or static value.

```typescript
import { unwrapValue } from '@ngx-signal-forms/toolkit';

function processStrategy(
  strategy:
    | ErrorDisplayStrategy
    | Signal<ErrorDisplayStrategy>
    | (() => ErrorDisplayStrategy),
) {
  // Works with signal, function, or static value
  const currentStrategy = unwrapValue(strategy);
  // currentStrategy is now ErrorDisplayStrategy
}

// Example usage
const staticStrategy = 'on-touch' as const;
const signalStrategy = signal<ErrorDisplayStrategy>('on-touch');
const computedStrategy = computed<ErrorDisplayStrategy>(() => 'on-touch');

unwrapValue(staticStrategy); // 'on-touch'
unwrapValue(signalStrategy); // 'on-touch'
unwrapValue(computedStrategy); // 'on-touch'
```

## Form Field Components

### NgxFloatingLabelDirective

Use `appearance="outline"` to enable floating-label styling.

Transforms form field into Material Design outlined layout.

**Recommended:**

```typescript
<ngx-signal-form-field-wrapper [formField]="form.email" appearance="outline">
  <label for="email">Email Address</label>
  <input id="email" type="email" [formField]="form.email" required placeholder="you@example.com" />
</ngx-signal-form-field-wrapper>
```

**Inputs**:

- `showRequiredMarker` (boolean, default: `true`)
- `requiredMarker` (string, default: `' *'`)

**Browser Support**: Chrome 105+, Firefox 121+, Safari 15.4+, Edge 105+ (95%+ coverage)

### NgxFormFieldHintComponent

**Selector**: `ngx-signal-form-field-hint`

Displays helper text for form fields with smart positioning.

**Behavior**:

- Defaults to **right** alignment
- Automatically flips to **left** if a character count is present
- Supports manual override via `position` input (`'left' | 'right'`)

```typescript
<ngx-signal-form-field-wrapper [formField]="form.phone">
  <label for="phone">Phone Number</label>
  <input id="phone" [formField]="form.phone" />
  <!-- Will align right by default -->
  <ngx-signal-form-field-hint>Format: 123-456-7890</ngx-signal-form-field-hint>
</ngx-signal-form-field-wrapper>
```

### NgxFormFieldCharacterCountComponent

**Selector**: `ngx-signal-form-field-character-count`

Displays character count with progressive color states.

```typescript
<ngx-signal-form-field-wrapper [formField]="form.bio">
  <label for="bio">Bio</label>
  <textarea id="bio" [formField]="form.bio"></textarea>
  <ngx-signal-form-field-character-count [formField]="form.bio" [maxLength]="500" />
</ngx-signal-form-field-wrapper>
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
  --ngx-signal-form-field-wrapper-gap: 0.375rem;
  --ngx-signal-form-field-wrapper-label-color: #374151;
  --ngx-signal-form-field-wrapper-border-color: #d1d5db;
  --ngx-signal-form-field-wrapper-border-radius: 0.375rem;
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
import type { SignalLike } from '../types';

export function utilityFunction<T>(value: SignalLike<T> | T): Signal<T> {
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

## Multi-Page / Wizard Forms

Reference: [WAI Forms Tutorial: Multi-page Forms](https://www.w3.org/WAI/tutorials/forms/multi-page/)

### Navigation Behavior

#### Next Button: DO NOT Disable

**Critical**: Never disable the Next button when the current step is invalid.

| Approach                           | WCAG Impact                                       |
| ---------------------------------- | ------------------------------------------------- |
| Disabled Next when invalid         | Users cannot discover which fields need attention |
| Enabled Next + validation on click | Users receive actionable error feedback           |

```typescript
// ✅ Correct: Always allow Next, validate on click
protected nextStep(): void {
  // Trigger validation on all fields
  this.stepForm.markAllAsTouched();

  if (this.stepForm().invalid()) {
    // Focus first invalid field for immediate correction
    focusFirstInvalid(this.stepForm);
    return;
  }

  this.saveAndProceed();
}

// ❌ Wrong: Disabling button blocks error discovery
<button [disabled]="stepForm().invalid()">Next</button>
```

#### Previous Button: Always Allow

Users MUST be able to navigate backward to review/edit completed steps:

- Save current step data (even if incomplete) before navigating
- Restore data when returning to a step
- Never block backward navigation due to validation

```typescript
protected previousStep(): void {
  // Always save before leaving, even if invalid
  this.saveCurrentStep();
  this.goToPreviousStep();
  this.focusStepContent();
}
```

### Progress Indication

Show progress in multiple ways for different users:

```typescript
// 1. Page title (screen readers announce first)
<title>Step 2 of 4: Trip Details – Booking Wizard – Travel App</title>

// 2. Heading (visual users, screen readers)
<h1>Trip Details (Step 2 of 4)</h1>

// 3. Step indicators with proper semantics
<nav aria-label="Booking progress">
  <ol class="wizard-steps">
    @for (step of steps; track step.id) {
      <li [class.completed]="isCompleted(step.id)"
          [class.current]="isCurrent(step.id)">
        @if (isCompleted(step.id)) {
          <span class="sr-only">Completed: </span>
          <a [routerLink]="step.route">{{ step.number }}. {{ step.label }}</a>
        } @else if (isCurrent(step.id)) {
          <span class="sr-only">Current: </span>
          <span aria-current="step">{{ step.number }}. {{ step.label }}</span>
        } @else {
          <span>{{ step.number }}. {{ step.label }}</span>
        }
      </li>
    }
  </ol>
</nav>

// 4. Progress bar
<div role="progressbar"
     [attr.aria-valuenow]="progressPercent()"
     aria-valuemin="0"
     aria-valuemax="100"
     aria-label="Booking progress">
  <div class="fill" [style.width.%]="progressPercent()"></div>
</div>
```

### Focus Management

On step change, move focus to help users orient:

```typescript
protected goToStep(stepId: string): void {
  this.currentStep.set(stepId);

  // Option 1: Focus step heading (needs tabindex="-1")
  this.stepHeading().nativeElement.focus();

  // Option 2: Focus first form field
  // Good for short forms, avoids extra tab stop
}
```

### Error Strategy for Wizards

**Recommended**: Use `'on-touch'` (default) for wizard steps.

- Errors show immediately after blur (user left field)
- Errors show for all fields after clicking Next (markAllAsTouched)
- No additional `submittedStatus` tracking needed

```typescript
// ✅ Works well for wizard steps
<form (submit)="nextStep()">
  <ngx-signal-form-field-wrapper [formField]="stepForm.email">
    <label for="email">Email</label>
    <input id="email" [formField]="stepForm.email" />
  </ngx-signal-form-field-wrapper>
  <button type="submit">Next</button>
</form>
```

### Review Step Pattern

Provide a review step before final submission:

```typescript
// Review step template
<section aria-labelledby="review-heading">
  <h1 id="review-heading">Review Your Booking (Step 3 of 3)</h1>

  @for (step of completedSteps; track step.id) {
    <div class="review-section">
      <h2>{{ step.label }}</h2>
      <dl>
        @for (field of step.fields; track field.key) {
          <dt>{{ field.label }}</dt>
          <dd>{{ field.value }}</dd>
        }
      </dl>
      <a [routerLink]="step.route">Edit {{ step.label }}</a>
    </div>
  }

  <button type="button" (click)="submitBooking()">
    Confirm Booking
  </button>
</section>
```

### Wizard Accessibility Checklist

- [ ] Next button NOT disabled when step is invalid
- [ ] Users can navigate backward to any completed step
- [ ] Progress shown in page title and heading
- [ ] Step indicators use `aria-current="step"`
- [ ] Progress bar uses `role="progressbar"` with aria attributes
- [ ] Focus moves to step heading or first field on navigation
- [ ] Review step allows editing before final submission
- [ ] No time limits (or extendable if required)
- [ ] Data saved when navigating between steps

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
