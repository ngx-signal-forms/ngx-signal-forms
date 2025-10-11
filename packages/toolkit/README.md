# @ngx-signal-forms/toolkit

> Enhancement toolkit for Angular Signal Forms with automatic accessibility and progressive error disclosure

[![npm version](https://img.shields.io/npm/v/@ngx-signal-forms/toolkit.svg)](https://www.npmjs.com/package/@ngx-signal-forms/toolkit)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](../../LICENSE)

Zero-intrusive directives, components, and utilities for Angular Signal Forms.

## Features

- ✅ Automatic ARIA attributes (`aria-invalid`, `aria-describedby`)
- ✅ Auto-touch on blur for progressive error disclosure
- ✅ Error display strategies (immediate, on-touch, on-submit, manual)
- ✅ Reusable form field wrapper with automatic error display
- ✅ WCAG 2.2 Level AA compliant
- ✅ Type-safe with full TypeScript inference
- ✅ Tree-shakable with secondary entry points

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

// 2. Use in components
import { NgxSignalFormFieldComponent } from '@ngx-signal-forms/toolkit/form-field';

@Component({
  imports: [Control, NgxSignalFormFieldComponent],
  template: `
    <form (submit)="onSubmit($event)">
      <ngx-signal-form-field [field]="form.email" fieldName="email">
        <label for="email">Email</label>
        <input id="email" [control]="form.email" />
      </ngx-signal-form-field>
    </form>
  `,
})
export class MyComponent {
  protected readonly model = signal({ email: '' });
  protected readonly form = form(
    this.model,
    schema((path) => {
      required(path.email, { message: 'Email is required' });
    }),
  );
}
```

## API

### Entry Points

```typescript
// Primary entry point - Configuration
import { provideNgxSignalFormsConfig } from '@ngx-signal-forms/toolkit';
import type { NgxSignalFormsConfig, ErrorDisplayStrategy } from '@ngx-signal-forms/toolkit';

// Core - Directives, components, utilities
import { NgxSignalFormProviderDirective, NgxSignalFormErrorComponent, NgxSignalFormAutoAriaDirective, NgxSignalFormAutoTouchDirective, computeShowErrors, showErrors } from '@ngx-signal-forms/toolkit/core';

// Form field wrapper (optional)
import { NgxSignalFormFieldComponent } from '@ngx-signal-forms/toolkit/form-field';

// Testing utilities (optional)
import { createPlaceholderTestHelper } from '@ngx-signal-forms/toolkit/testing';
```

### Configuration

```typescript
interface NgxSignalFormsConfig {
  autoAria: boolean; // Default: true
  autoTouch: boolean; // Default: true
  defaultErrorStrategy: ErrorDisplayStrategy; // Default: 'on-touch'
  fieldNameResolver?: (el: HTMLElement) => string | null;
  strictFieldResolution: boolean; // Default: false
  debug: boolean; // Default: false
}

type ErrorDisplayStrategy = 'immediate' | 'on-touch' | 'on-submit' | 'manual';
```

### Directives

#### NgxSignalFormProviderDirective

Provides form context to child components.

```html
<form [ngxSignalFormProvider]="myForm" [errorStrategy]="'on-touch'"></form>
```

#### NgxSignalFormAutoAriaDirective

Automatically applied to `input[control]`, `textarea[control]`, `select[control]`.

#### NgxSignalFormAutoTouchDirective

Automatically applied to form controls. Opt-out with `ngxSignalFormAutoTouchDisabled`.

### Components

#### NgxSignalFormErrorComponent

```html
<ngx-signal-form-error [field]="form.email" fieldName="email" [strategy]="'on-touch'" [hasSubmitted]="hasSubmitted" />
```

#### NgxSignalFormFieldComponent

```html
<ngx-signal-form-field [field]="form.email" fieldName="email" [strategy]="'on-touch'">
  <label>Email</label>
  <input [control]="form.email" />
</ngx-signal-form-field>
```

### Utilities

```typescript
// Compute error visibility
computeShowErrors<T>(
  field: ReactiveOrStatic<FieldState<T>>,
  strategy: ReactiveOrStatic<ErrorDisplayStrategy>,
  hasSubmitted: ReactiveOrStatic<boolean>
): Signal<boolean>

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
