# @ngx-signal-forms/toolkit

> **Zero-intrusive toolkit for Angular Signal Forms**

Directives, components, and utilities that add automatic accessibility, error display strategies, and form field wrappers to Angular's Signal Forms API — without changing the core API.

## Features

- ✅ **Automatic ARIA attributes** - aria-invalid, aria-describedby
- ✅ **Auto-touch on blur** - Progressive error disclosure
- ✅ **Error display strategies** - immediate, on-touch, on-submit, manual
- ✅ **Form field wrapper** - Consistent layout with auto-error display
- ✅ **Form busy state** - Automatic aria-busy during async operations
- ✅ **WCAG 2.2 compliant** - Accessibility by default
- ✅ **Type-safe** - Full TypeScript inference from Signal Forms
- ✅ **Tree-shakable** - Use only what you need

## Installation

```bash
npm install @ngx-signal-forms/toolkit
```

## Quick Start

### 1. Provide Configuration (Optional)

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

### 2. Use in Components

```typescript
import { Component, signal } from '@angular/core';
import { form, schema, required, email, Control } from '@angular/forms/signals';
import { SftFormFieldComponent } from '@ngx-signal-forms/toolkit/form-field';

@Component({
  selector: 'app-contact',
  imports: [SftFormFieldComponent, Control],
  template: `
    <form (submit)="save($event)">
      <sft-form-field [field]="contactForm.email">
        <label for="email">Email</label>
        <input id="email" [control]="contactForm.email" />
      </sft-form-field>

      <button type="submit">Submit</button>
    </form>
  `,
})
export class ContactComponent {
  protected readonly model = signal({ email: '' });
  protected readonly contactForm = form(
    this.model,
    schema((path) => {
      required(path.email);
      email(path.email);
    })
  );

  protected save(event: Event) {
    event.preventDefault();
    if (this.contactForm().valid()) {
      console.log('Valid:', this.model());
    }
  }
}
```

## Package Structure

### Primary Entry Point

```typescript
import { provideNgxSignalFormsConfig, NgxSignalFormsConfig, ErrorDisplayStrategy } from '@ngx-signal-forms/toolkit';
```

Core directives, utilities, and configuration.

### Secondary Entry Points

#### Form Field (Optional)

```typescript
import { SftFormFieldComponent } from '@ngx-signal-forms/toolkit/form-field';
```

Form field wrapper component for consistent layout.

#### Testing (Optional)

```typescript
import { createPlaceholderTestHelper } from '@ngx-signal-forms/toolkit/testing';
```

Test utilities for easier testing with Signal Forms.

## Development

### Running unit tests

Run `nx test toolkit` to execute the unit tests with Vitest.

### Building

Run `nx build toolkit` to build the library.

## Documentation

For complete documentation, visit: [ngx-signal-forms documentation](https://github.com/ngx-signal-forms/ngx-signal-forms)

## License

MIT © [ngx-signal-forms](https://github.com/ngx-signal-forms)
