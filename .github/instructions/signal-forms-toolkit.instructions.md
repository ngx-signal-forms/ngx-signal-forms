---
description: '@ngx-signal-forms/toolkit - Enhancement library for Angular Signal Forms'
applyTo: 'packages/toolkit/**/*.{ts,html,scss,css}'
---

# @ngx-signal-forms/toolkit - Coding Instructions

## Overview

Enhancement toolkit for Angular 21+ Signal Forms providing automatic accessibility, error display strategies, and form field wrappers. **100% non-intrusive** - works alongside Signal Forms without modifying the core API.

## Technology Stack

- **Angular**: `>=21.0.0-next.0` (peer dependency)
- **TypeScript**: `5.8+` with strict mode
- **Testing**: Vitest (unit), Playwright (E2E)
- **Architecture**: Standalone components, signal-based, OnPush change detection, zoneless-compatible

## Project Structure

```
packages/toolkit/
├── core/                           # @ngx-signal-forms/toolkit/core
│   ├── components/                 # NgxSignalFormErrorComponent
│   ├── directives/                 # NgxSignalFormDirective, NgxSignalFormAutoAriaDirective
│   ├── providers/                  # provideNgxSignalFormsConfig
│   ├── utilities/                  # Helper functions
│   └── public_api.ts               # Public exports + NgxSignalFormToolkit bundle
└── form-field/                     # @ngx-signal-forms/toolkit/form-field
    ├── form-field.component.ts     # Main wrapper component
    ├── floating-label.directive.ts # Outlined Material Design layout
    ├── form-field-hint.component.ts
    └── form-field-character-count.component.ts
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
import type { ReactiveOrStatic } from '@ngx-signal-forms/toolkit/core';

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
  | 'manual'; // Programmatic control
```

### Warning Convention

- **Errors** (blocking): `kind` does NOT start with `'warn:'`
- **Warnings** (non-blocking): `kind` starts with `'warn:'`

```typescript
import { warningError } from '@ngx-signal-forms/toolkit/core';

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
import { provideNgxSignalFormsConfig } from '@ngx-signal-forms/toolkit/core';

export const appConfig: ApplicationConfig = {
  providers: [
    provideNgxSignalFormsConfig({
      autoAria: true, // Default
      defaultErrorStrategy: 'on-touch', // Default
      strictFieldResolution: false, // Default
      debug: false, // Default
    }),
  ],
};
```

## Public API

### Bundle Import (Recommended)

```typescript
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit/core';

@Component({
  imports: [Field, NgxSignalFormToolkit],
  template: `
    <form [ngxSignalForm]="userForm">
      <input [field]="userForm.email" />
      <ngx-signal-form-error [field]="userForm.email" fieldName="email" />
    </form>
  `,
})
```

**Contains**: `NgxSignalFormDirective`, `NgxSignalFormAutoAriaDirective`, `NgxSignalFormErrorComponent`

### Individual Imports (Alternative)

```typescript
import {
  NgxSignalFormDirective,
  NgxSignalFormAutoAriaDirective,
  NgxSignalFormErrorComponent,
} from '@ngx-signal-forms/toolkit/core';
```

## Core Directives

### NgxSignalFormDirective

**Selector**: `[ngxSignalForm]`

**Features**:

- Provides form context to child components via DI
- Derives `submittedStatus` from Angular's native `submitting()` and `touched()` signals
- Automatically adds `novalidate` attribute
- Manages error display strategy

```typescript
<form [ngxSignalForm]="userForm" [errorStrategy]="'on-touch'" (ngSubmit)="save()">
  <!-- submittedStatus derived from touched() - Child components auto-inject context -->
</form>
```

**Input Properties**:

- `ngxSignalForm` (required): The form instance (FieldTree)
- `errorStrategy` (optional): Error display strategy

### NgxSignalFormAutoAriaDirective

**Selector**: `input[field], textarea[field], select[field]` (auto-applied when imported)

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

```typescript
<ngx-signal-form-error
  [field]="form.email"
  fieldName="email"
  [strategy]="'on-touch'"
/>
```

**Required Inputs**:

- `field`: The field from your form (FieldTree)
- `fieldName`: Field name string (must match `id` for ARIA)

**Optional Inputs**:

- `strategy`: Error display strategy
- `submittedStatus`: Form submission state (auto-injected from directive)

### NgxSignalFormFieldComponent

**Selector**: `ngx-signal-form-field`

Reusable form field wrapper with automatic error display.

```typescript
<ngx-signal-form-field [field]="form.email" fieldName="email">
  <label for="email">Email</label>
  <input id="email" [field]="form.email" />
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

```typescript
import { showErrors } from '@ngx-signal-forms/toolkit/core';

protected readonly shouldShowErrors = showErrors(
  this.form.email,        // FieldTree
  'on-touch',             // ErrorDisplayStrategy
  this.submittedStatus,   // SubmittedStatus signal
);
```

**Returns**: `Signal<boolean>` - Whether to show errors

### warningError()

```typescript
import { warningError } from '@ngx-signal-forms/toolkit/core';

validate(path.password, (ctx) => {
  if (ctx.value().length < 12) {
    return warningError('short-password', 'Consider 12+ characters');
  }
  return null;
});
```

### combineShowErrors()

```typescript
import { combineShowErrors, showErrors } from '@ngx-signal-forms/toolkit/core';

protected readonly showAnyFormErrors = combineShowErrors([
  showErrors(this.userForm.email, 'on-touch', this.submittedStatus),
  showErrors(this.userForm.password, 'on-touch', this.submittedStatus),
]);
```

### isWarningError() / isBlockingError()

```typescript
import {
  isWarningError,
  isBlockingError,
} from '@ngx-signal-forms/toolkit/core';

const allErrors = form.email().errors();
const warnings = allErrors.filter(isWarningError);
const blockingErrors = allErrors.filter(isBlockingError);
```

## Form Field Components

### NgxFloatingLabelDirective

**Selector**: `ngx-signal-form-field[outline]`

Transforms form field into Material Design outlined layout.

```typescript
<ngx-signal-form-field [field]="form.email" outline>
  <label for="email">Email Address</label>
  <input id="email" type="email" [field]="form.email" required placeholder="you@example.com" />
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
<ngx-signal-form-field [field]="form.phone">
  <label for="phone">Phone Number</label>
  <input id="phone" [field]="form.phone" />
  <ngx-signal-form-field-hint>Format: 123-456-7890</ngx-signal-form-field-hint>
</ngx-signal-form-field>
```

### NgxSignalFormFieldCharacterCountComponent

**Selector**: `ngx-signal-form-field-character-count`

Displays character count with progressive color states.

```typescript
<ngx-signal-form-field [field]="form.bio">
  <label for="bio">Bio</label>
  <textarea id="bio" [field]="form.bio"></textarea>
  <ngx-signal-form-field-character-count [field]="form.bio" [maxLength]="500" />
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
- [Signal Forms Instructions](./signal-forms.instructions.md)
- [Angular Signal Forms API](https://angular.dev/api/forms/signals)
- [WCAG 2.2 Guidelines](https://www.w3.org/WAI/WCAG22/quickref/)
