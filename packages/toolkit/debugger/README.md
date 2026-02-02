# @ngx-signal-forms/toolkit/debugger

Development debugging tools for Angular Signal Forms. Provides a visual debugger panel that displays form state, validation errors, and warnings in real-time.

## Installation

This is a secondary entry point of `@ngx-signal-forms/toolkit`. If you already have the toolkit installed, no additional installation is needed.

```bash
npm install @ngx-signal-forms/toolkit
```

## Usage

```typescript
import { SignalFormDebuggerComponent } from '@ngx-signal-forms/toolkit/debugger';
import { form, FormField, required } from '@angular/forms/signals';

@Component({
  imports: [FormField, SignalFormDebuggerComponent],
  template: `
    <form (submit)="save($event)">
      <input [formField]="userForm.email" />
      <button type="submit">Submit</button>
    </form>

    <!-- Debugger panel -->
    <ngx-signal-form-debugger [formTree]="userForm" />
  `,
})
export class UserFormComponent {
  readonly #data = signal({ email: '' });
  protected readonly userForm = form(this.#data, (path) => {
    required(path.email, { message: 'Email required' });
  });

  protected save(event: Event): void {
    event.preventDefault();
    // ...
  }
}
```

**Important:** Pass the FieldTree function (e.g. `userForm`), not the root state (`userForm()`).
The debugger can accept a `FieldState`, but it cannot traverse child fields, so visibility can
appear incorrect.

## Features

- **Form State Display**: Valid, Invalid, Dirty, Pending, Submitted status
- **Live Model Values**: JSON representation of form data
- **Validation Errors**: Separated into blocking errors and warnings
- **Error Visibility Strategy**: Shows which errors are hidden by current strategy
- **Root vs Field Errors**: Distinguishes cross-field validation from field-level
- **Dark Mode Support**: Automatic via `prefers-color-scheme`
- **Collapsible Sections**: Clean organization of information

## API

### Inputs

| Input           | Type                   | Default                        | Description                                                                                 |
| --------------- | ---------------------- | ------------------------------ | ------------------------------------------------------------------------------------------- |
| `formTree`      | `unknown` (required)   | -                              | The Signal Form to display. Prefer the FieldTree function for correct per-field visibility. |
| `errorStrategy` | `ErrorDisplayStrategy` | `'on-touch'`                   | Current error display strategy                                                              |
| `title`         | `string`               | `'Form State & Validation'`    | Header title                                                                                |
| `subtitle`      | `string`               | `'Live debugging information'` | Header subtitle                                                                             |

### Theming

Override CSS custom properties to customize appearance:

```css
ngx-signal-form-debugger {
  /* Base colors */
  --ngx-debugger-bg: #ffffff;
  --ngx-debugger-bg-secondary: #f9fafb;
  --ngx-debugger-border-color: #e5e7eb;
  --ngx-debugger-text-color: #111827;
  --ngx-debugger-text-secondary: #6b7280;

  /* Semantic colors */
  --ngx-debugger-color-success: #22c55e;
  --ngx-debugger-color-warning: #f59e0b;
  --ngx-debugger-color-danger: #ef4444;
  --ngx-debugger-color-info: #3b82f6;

  /* Typography */
  --ngx-debugger-font-family: system-ui, sans-serif;
  --ngx-debugger-font-size-base: 0.875rem;

  /* Spacing & Borders */
  --ngx-debugger-border-radius: 0.5rem;
  --ngx-debugger-spacing-lg: 1rem;
}
```

### Badge Theming

The internal badge component also uses CSS custom properties:

```css
ngx-signal-form-debugger {
  /* Badge colors by appearance */
  --ngx-debugger-badge-success-bg: #dcfce7;
  --ngx-debugger-badge-success-text: #166534;
  --ngx-debugger-badge-warning-bg: #fef3c7;
  --ngx-debugger-badge-warning-text: #92400e;
  --ngx-debugger-badge-danger-bg: #fee2e2;
  --ngx-debugger-badge-danger-text: #991b1b;
}
```

## With Form Context

For `'on-submit'` error strategy, wrap your form with `[ngxSignalForm]`:

```typescript
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';
import { SignalFormDebuggerComponent } from '@ngx-signal-forms/toolkit/debugger';

@Component({
  imports: [FormField, NgxSignalFormToolkit, SignalFormDebuggerComponent],
  template: `
    <form [ngxSignalForm]="userForm" [errorStrategy]="'on-submit'" (submit)="save($event)">
      <input [formField]="userForm.email" />
      <button type="submit">Submit</button>
    </form>

    <ngx-signal-form-debugger [formTree]="userForm" [errorStrategy]="'on-submit'" />
  `,
})
```

## Development Only

This component is intended for development and debugging purposes. Consider excluding it from production builds or conditionally rendering it:

```typescript
@Component({
  template: `
    @if (!isProduction) {
      <ngx-signal-form-debugger [formTree]="form" />
    }
  `,
})
export class MyFormComponent {
  protected readonly isProduction = environment.production;
}
```
