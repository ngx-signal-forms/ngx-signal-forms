---
description: 'Angular 21.1+ Signal Forms API reference and best practices'
applyTo: '**/*.ts, **/*.html'
---

# Angular Signal Forms Instructions

## Overview

Angular 21.1+ Signal Forms is an **experimental API** providing a reactive, signal-based approach to form handling. The data signal is the single source of truth—forms are a reactive view of that model.

**Key Principle**: Your data signal IS the form model. Forms are just a reactive view.

## Angular 21.1 API Summary

| Feature            | API                   | Description                                   |
| ------------------ | --------------------- | --------------------------------------------- |
| **Directive**      | `[formField]`         | Bind field to input element                   |
| **Import**         | `FormField`           | Directive from `@angular/forms/signals`       |
| **Submit helper**  | `submit()`            | Auto-validates, marks touched, handles errors |
| **Focus API**      | `focusBoundControl()` | Programmatically focus UI control             |
| **Error summary**  | `errorSummary()`      | All errors including nested descendants       |
| **Field bindings** | `formFieldBindings`   | Signal tracking bound FormField directives    |

## Quick Start

```typescript
import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import {
  form,
  FormField,
  required,
  email,
  submit,
} from '@angular/forms/signals';

@Component({
  selector: 'app-user-form',
  imports: [FormField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form (submit)="save($event)" novalidate>
      <input [formField]="userForm.email" />
      @if (userForm.email().invalid() && userForm.email().touched()) {
        @for (error of userForm.email().errors(); track error.kind) {
          <div>{{ error.message }}</div>
        }
      }
      <button type="submit" [disabled]="userForm().invalid()">Submit</button>
    </form>
  `,
})
export class UserFormComponent {
  readonly #userData = signal({ email: '' });

  protected readonly userForm = form(this.#userData, (path) => {
    required(path.email, { message: 'Email required' });
    email(path.email, { message: 'Valid email required' });
  });

  protected async save(event: Event): Promise<void> {
    event.preventDefault();
    await submit(this.userForm, async () => {
      console.log('Submit:', this.#userData());
    });
  }
}
```

## Core Validators

| Validator                    | Description                      |
| ---------------------------- | -------------------------------- |
| `required(path, opts)`       | Field must have value            |
| `minLength(path, n, opts)`   | Minimum string/array length      |
| `maxLength(path, n, opts)`   | Maximum string/array length      |
| `min(path, n, opts)`         | Minimum numeric value            |
| `max(path, n, opts)`         | Maximum numeric value            |
| `email(path, opts)`          | Valid email format               |
| `pattern(path, regex, opts)` | Match regex pattern              |
| `disabled(path, condition)`  | Disable field conditionally      |
| `readonly(path, condition?)` | Make field readonly              |
| `hidden(path, condition)`    | Hide field (template must check) |

**Conditional validation:**

```typescript
required(path.email, {
  when: ({ valueOf }) => valueOf(path.subscribe),
  message: 'Email required for subscription',
});
```

## Custom Validation

### Field-Level

```typescript
validate(path.username, (ctx) => {
  if (ctx.value().includes(' ')) {
    return customError({ kind: 'no_spaces', message: 'No spaces allowed' });
  }
  return null;
});
```

### Cross-Field (using `valueOf`)

```typescript
validate(path.confirmPassword, (ctx) => {
  if (ctx.value() !== ctx.valueOf(path.password)) {
    return customError({ kind: 'mismatch', message: 'Passwords must match' });
  }
  return null;
});
```

### Root-Level (Form-Wide)

```typescript
validate(path, (ctx) => {
  const { startDate, endDate } = ctx.value();
  if (startDate && endDate && startDate > endDate) {
    return customError({
      kind: 'invalid_range',
      message: 'Start must be before end',
    });
  }
  return null;
});
```

### Async Validation

```typescript
validateHttp(path.username, {
  request: ({ value }) => (value() ? `/api/check/${value()}` : undefined),
  errors: (response, ctx) => {
    if (!response.available) {
      return customError({
        kind: 'taken',
        message: `"${ctx.value()}" is taken`,
      });
    }
    return null;
  },
});
```

## Field State Signals

```typescript
// User interaction (auto-managed)
field().touched(); // true after blur
field().dirty(); // true after value change

// Validation state
field().valid(); // all validators pass
field().invalid(); // any validator fails
field().pending(); // async validation running

// Errors
field().errors(); // errors on this field only
field().errorSummary(); // all errors including descendants

// Programmatic
field().markAsTouched();
field().markAsDirty();
field().focusBoundControl(); // focus the bound input
```

**Note:** Signal Forms have NO `untouched()` or `pristine()` signals. Use `!touched()` and `!dirty()`.

## Form Submission

### Using `submit()` Helper (Recommended)

```typescript
import { submit } from '@angular/forms/signals';

protected async handleSubmit(event: Event): Promise<void> {
  event.preventDefault();
  await submit(this.userForm, async (formData) => {
    try {
      await this.api.save(formData().value());
      return null; // Success
    } catch {
      return [{ kind: 'save_error', message: 'Failed to save' }];
    }
  });
}
```

**`submit()` automatically:**

- Calls `markAllAsTouched()` to show all errors
- Manages `submitting()` signal state
- Handles server error integration

**Critical:** Always use `(submit)="handler($event)"` with `event.preventDefault()`. Signal Forms use native DOM events, NOT `ngSubmit`.

## Form Reset

**Important:** `reset()` only resets control states (touched, dirty), NOT values.

```typescript
// Reset states only
this.userForm().reset();

// Reset both states AND values
this.userForm().reset();
this.#model.set({ email: '' });
```

## Schema Composition

```typescript
const addressSchema = schema<Address>((path) => {
  required(path.street);
  required(path.city);
});

form(signal(data), (path) => {
  apply(path.address, addressSchema);
  applyEach(path.items, itemSchema);
  applyWhenValue(path.payment, (p): p is Card => p.type === 'card', cardSchema);
});
```

## Dynamic Arrays

```typescript
readonly #data = signal({ items: [{ name: '' }] });

protected readonly itemsForm = form(this.#data, (path) => {
  applyEach(path.items, (item) => required(item.name));
});

protected add(): void {
  this.#data.update(d => ({ items: [...d.items, { name: '' }] }));
}

protected remove(i: number): void {
  this.#data.update(d => ({ items: d.items.filter((_, idx) => idx !== i) }));
}
```

## CSS Classes

Signal Forms do NOT add `ng-valid`, `ng-invalid`, etc. classes automatically.

**Option 1: Built-in preset**

```typescript
import {
  provideSignalFormsConfig,
  NG_STATUS_CLASSES,
} from '@angular/forms/signals';

providers: [provideSignalFormsConfig({ classes: NG_STATUS_CLASSES })];
```

**Option 2: Custom classes**

```typescript
provideSignalFormsConfig({
  classes: {
    'is-invalid': (state) => state.invalid() && state.touched(),
    'is-valid': (state) => state.valid() && state.touched(),
  },
});
```

**Option 3: Manual in template**

```html
<input [formField]="form.email" [class.invalid]="form.email().invalid()" />
```

## Custom Controls

Implement `FormValueControl<T>` for text-like inputs:

```typescript
@Directive({
  selector: '[appInput]',
  host: { '(input)': 'onChange($event.target.value)', '(blur)': 'onTouched()' },
})
export class InputDirective implements FormValueControl<string> {
  readonly #el = inject(ElementRef<HTMLInputElement>);

  onChange: (v: string) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(v: string): void {
    this.#el.nativeElement.value = v ?? '';
  }
  focus(): void {
    this.#el.nativeElement.focus();
  }

  // Optional signal inputs for reactive state
  readonly disabled = input<boolean>(false);
  readonly invalid = input<boolean>(false);
}
```

## Template Pattern

```html
<form (submit)="save($event)" novalidate>
  <input [formField]="form.name" />
  <textarea [formField]="form.bio" />
  <select [formField]="form.category" />

  @if (form.email().invalid() && form.email().touched()) { @for (error of
  form.email().errors(); track error.kind) {
  <p>{{ error.message }}</p>
  } } @if (form.email().pending()) { <span>Checking...</span> }

  <button [disabled]="form().invalid() || form().pending()">Submit</button>
</form>
```

## Critical Requirements

| Requirement               | Details                                                 |
| ------------------------- | ------------------------------------------------------- |
| `novalidate` on forms     | Prevents browser validation UI conflicts                |
| `OnPush` change detection | Required for all Signal Forms components                |
| `event.preventDefault()`  | Required in submit handlers (native DOM event)          |
| Signal function calls     | Use `form.field().invalid()` NOT `form.field.invalid()` |
| Immutable updates         | Use `signal.update()` NOT direct mutation               |

## Resources

- [Signal Forms Guide](https://angular.love/signal-forms-in-angular-21-complete-guide)
- [Angular 21.1 Features](https://angular.love/angular-21-1-key-features-and-improvements)
- [Angular Signal Forms API](https://angular.dev/api/forms/signals)
- [Toolkit Instructions](./ngx-signal-forms-toolkit.instructions.md)
