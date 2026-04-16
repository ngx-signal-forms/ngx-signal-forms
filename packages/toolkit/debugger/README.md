# @ngx-signal-forms/toolkit/debugger

> Development-time visual inspector for Angular Signal Forms state and validation.

## Why this entry point exists

When building forms, you need to see field state, validation errors, and submission status in real-time. The debugger panel shows all of this without sprinkling `console.log` calls or manually reading signals.

It is a development-only tool — gate it behind `isDevMode()` so production builds skip it entirely.

## Import

```typescript
// Bundle import (recommended)
import { NgxSignalFormDebugger } from '@ngx-signal-forms/toolkit/debugger';

// Individual import
import { SignalFormDebuggerComponent } from '@ngx-signal-forms/toolkit/debugger';
```

## Quick start

```typescript
import { Component, isDevMode, signal } from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';
import { NgxSignalFormDebugger } from '@ngx-signal-forms/toolkit/debugger';

@Component({
  imports: [FormField, NgxSignalFormToolkit, NgxSignalFormDebugger],
  template: `
    <form [formRoot]="userForm" ngxSignalForm>
      <input [formField]="userForm.email" />
      <button type="submit">Submit</button>
    </form>

    @if (isDevMode) {
      <ngx-signal-form-debugger [formTree]="userForm" />
    }
  `,
})
export class UserFormComponent {
  protected readonly isDevMode = isDevMode();
  readonly #data = signal({ email: '' });
  protected readonly userForm = form(this.#data, (path) => {
    required(path.email, { message: 'Email required' });
  });
}
```

Pass the `FieldTree` function (e.g. `userForm`), not the called state (`userForm()`). The debugger needs the function to traverse child fields.

## API

### SignalFormDebuggerComponent

Selector: `ngx-signal-form-debugger`

| Input           | Type                                | Default                        | Description                                                                                                   |
| --------------- | ----------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `formTree`      | `unknown` (required)                | —                              | The form tree to inspect                                                                                      |
| `errorStrategy` | `ErrorDisplayStrategy \| undefined` | `undefined`                    | Optional override. When omitted, the debugger inherits the strategy from the ambient `ngxSignalForm` context. |
| `title`         | `string`                            | `'Form State & Validation'`    | Panel header title                                                                                            |
| `subtitle`      | `string`                            | `'Live debugging information'` | Panel header subtitle                                                                                         |

### NgxSignalFormDebugger

Bundle containing `SignalFormDebuggerComponent` and internal badge components.

### What it shows

- Field state: valid, invalid, dirty, touched, pending, submitted
- Live model values as JSON
- Validation errors separated into blocking errors and warnings
- Error visibility based on the current strategy
- Root-level vs field-level error distinction
- Dark mode support via `.dark` class context
- Collapsible sections

### Theming

Theming hooks use the shorter `--ngx-debugger-*` prefix. (The selector prefix
`ngx-signal-form-debugger-*` is reserved for element and directive names and is
not used for CSS custom properties or class hooks.)

```css
ngx-signal-form-debugger {
  --ngx-debugger-bg: #ffffff;
  --ngx-debugger-border-color: #e5e7eb;
  --ngx-debugger-text-color: #111827;
  --ngx-debugger-color-success: #22c55e;
  --ngx-debugger-color-warning: #f59e0b;
  --ngx-debugger-color-danger: #ef4444;
  --ngx-debugger-font-size-base: 0.875rem;
  --ngx-debugger-border-radius: 0.5rem;
}
```

## Related documentation

- [Toolkit core](../README.md) — error strategies, ARIA, submission helpers

## License

MIT © [ngx-signal-forms](https://github.com/ngx-signal-forms/ngx-signal-forms)
