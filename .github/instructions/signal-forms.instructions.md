---
description: 'Angular 21+ Signal Forms coding standards and best practices'
applyTo: '**/*.ts, **/*.html'
---

# Angular Signal Forms Instructions

## Overview

Angular 21+ Signal Forms is an **experimental API** providing a reactive, signal-based approach to form handling. The data signal is the single source of truth—forms are a reactive view of that model.

**Key Principle**: Signal Forms treat your data model as the source of truth, with forms being a reactive view of that model.

## Technology Version Detection

**CRITICAL**: Always verify the exact Angular version before generating Signal Forms code.

- Signal Forms are **experimental** in Angular 21+
- Import from `@angular/forms/signals`
- Requires Angular 21.0.0 or higher
- Check `package.json` for exact version constraints

## Angular Forms Comparison Matrix

| Aspect               | **Signal Forms (✅ Recommended)** | Reactive Forms (Legacy)           | Template Driven Forms (Legacy) |
| -------------------- | --------------------------------- | --------------------------------- | ------------------------------ |
| **Status**           | ✅ Modern (Angular 21+)           | 🔶 Maintained                     | 🔶 Maintained                  |
| **State Management** | Data signal (source of truth)     | FormGroup/FormControl             | Component property + ngModel   |
| **Validation**       | Declarative functions in code     | Validator classes                 | Directives in template         |
| **Reactivity**       | Signals (zoneless compatible)     | RxJS Observables                  | Two-way binding + Zone.js      |
| **Type Safety**      | ✅ Full TypeScript inference      | Limited (improving)               | Minimal                        |
| **Change Detection** | Signal-based (optimal)            | Zone-based or manual              | Zone-based                     |
| **Boilerplate**      | ✅ Low (single `form()` call)     | High (FormBuilder required)       | Medium (FormsModule required)  |
| **Bundle Size**      | ✅ Smaller (no RxJS for forms)    | Larger                            | Medium (FormsModule)           |
| **Performance**      | ✅ Excellent (no Zone.js)         | Good                              | Good                           |
| **Testing**          | ✅ Direct signal manipulation     | TestBed + subscriptions           | TestBed + DOM                  |
| **Template Syntax**  | `[control]` directive             | `[formGroup]` + `formControlName` | `[(ngModel)]` + directives     |
| **Learning Curve**   | Medium (signals knowledge)        | Medium (RxJS knowledge)           | Low                            |
| **Use Case**         | ✅ All new Angular 21+ projects   | Legacy support                    | Simple forms only              |

## Quick Start

### Required Imports

```typescript
import {
  Component,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import {
  form,
  Control,
  required,
  minLength,
  email,
  validate,
  customError,
  schema,
  submit,
} from '@angular/forms/signals';
```

### Basic Form Example

```typescript
@Component({
  selector: 'ngx-user-form',
  imports: [Control],
  changeDetection: ChangeDetectionStrategy.OnPush, // Required
  template: `
    <form (ngSubmit)="save()">
      <input [control]="userForm.name" />
      @if (userForm.name().invalid() && userForm.name().touched()) {
        @for (error of userForm.name().errors(); track error.kind) {
          <div>{{ error.message }}</div>
        }
      }
      <button type="submit" [disabled]="userForm().invalid()">Submit</button>
    </form>
  `,
})
export class UserFormComponent {
  readonly #userData = signal({ name: '', email: '' });

  protected readonly userForm = form(this.#userData, (path) => {
    required(path.name, { message: 'Name is required' });
    minLength(path.name, 3, { message: 'Min 3 characters' });
    email(path.email, { message: 'Valid email required' });
  });

  protected save(): void {
    if (this.userForm().valid()) {
      console.log('Submit:', this.#userData());
      // Handle form submission (API call, navigation, etc.)
    }
  }
}
```

## Core Validators

```typescript
form(signal(data), (path) => {
  // Required
  required(path.name, { message: 'Name is required' });

  // String/array length
  minLength(path.password, 8, { message: 'At least 8 characters' });
  maxLength(path.bio, 500, { message: 'Max 500 characters' });

  // Numeric range
  min(path.age, 18, { message: 'Must be 18 or older' });
  max(path.quantity, 100, { message: 'Max 100 items' });

  // Pattern & email
  pattern(path.phone, /^\d{3}-\d{3}-\d{4}$/, {
    message: 'Format: 123-456-7890',
  });
  email(path.email, { message: 'Invalid email' });

  // Conditional
  required(path.email, {
    when: ({ valueOf }) => valueOf(path.subscribe),
    message: 'Email required for subscription',
  });

  // Field state
  disabled(path.lastName, ({ valueOf }) => !valueOf(path.firstName));
  readonly(path.id);
  hidden(path.optional, ({ valueOf }) => !valueOf(path.showOptional));
});
```

## Custom Validation

### Understanding Validation Error Types

Signal Forms supports two types of validation errors:

| Error Type      | Validation Target       | Use Case                                                  | Example                        |
| --------------- | ----------------------- | --------------------------------------------------------- | ------------------------------ |
| **Field-Level** | `validate(path.field,`) | Single field validation                                   | Email format, required fields  |
| **Root-Level**  | `validate(path,`        | Cross-field validation affecting the entire form          | Password matching, date ranges |
| **Cross-Field** | `validate(path.field,`) | Field validation using other field values via `valueOf()` | Confirm password, conditional  |

**When to use each:**

- **Field-level**: Error belongs to a specific field (e.g., "Username cannot contain spaces")
- **Root-level**: Error affects the whole form, no single field is "wrong" (e.g., "Start date must be before end date")
- **Cross-field**: One field depends on another (e.g., "Confirm password must match password")

### Single Field (Field-Level)

```typescript
validate(path.username, (ctx) => {
  if (ctx.value().includes(' ')) {
    return customError({
      kind: 'no_spaces',
      message: 'Username cannot contain spaces',
    });
  }
  return null;
});
```

### Root-Level (Form-Wide Validation)

```typescript
// Example: Date range validation (neither field is individually "wrong")
validate(path, (ctx) => {
  const { startDate, endDate } = ctx.value();
  if (startDate && endDate && startDate > endDate) {
    return customError({
      kind: 'invalid_date_range',
      message: 'Start date must be before end date',
    });
  }
  return null;
});

// Example: Business rule spanning multiple fields
validate(path, (ctx) => {
  const form = ctx.value();
  const totalItems = form.items.reduce((sum, item) => sum + item.quantity, 0);

  if (totalItems > 100) {
    return customError({
      kind: 'cart_limit_exceeded',
      message: 'Maximum 100 items allowed in cart',
    });
  }
  return null;
});
```

### Cross-Field (Field-Level with Dependencies)

```typescript
// Error belongs to confirmPassword field, but depends on password field
validate(path.confirmPassword, (ctx) => {
  const password = ctx.valueOf(path.password);
  const confirmPassword = ctx.value();

  if (password !== confirmPassword) {
    return customError({
      kind: 'password_mismatch',
      message: 'Passwords must match',
    });
  }
  return null;
});

// Access other fields using ctx.fieldOf()
validate(path.improvementSuggestions, (ctx) => {
  const value = ctx.value();
  const rating = ctx.fieldOf(path.overallRating)().value();

  if (rating > 0 && rating <= 3 && value && value.length < 10) {
    return customError({
      kind: 'too_short',
      message: 'Please provide more details for low ratings',
    });
  }
  return null;
});
```

**Accessing Errors Programmatically:**

```typescript
// Get root-level errors (cross-field validation on form itself)
protected readonly rootErrors = computed(() => this.userForm().errors());

// Get field-level errors (requires recursive collection)
protected readonly fieldErrors = computed(() => {
  const errors: ValidationError[] = [];
  // Recursive traversal of form tree to collect all field errors
  const collectFieldErrors = (fieldState: FieldState<unknown>) => {
    const value = fieldState.value();
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.keys(value).forEach((key) => {
        const childField = (fieldState as any)[key]();
        errors.push(...childField.errors());
        collectFieldErrors(childField);
      });
    }
  };
  collectFieldErrors(this.userForm);
  return errors;
});
```

### Async Validation

```typescript
validateHttp(path.username, {
  request: ({ value }) =>
    value() ? `/api/check-username/${value()}` : undefined,
  errors: (response: any, ctx) => {
    if (!response.available) {
      return customError({
        kind: 'username_taken',
        message: `"${ctx.value()}" is already taken`,
      });
    }
    return null;
  },
});
```

## Schema Composition

```typescript
// Define reusable schemas
const citySchema = schema<string>((path) => {
  required(path, { message: 'City is required' });
  minLength(path, 2);
});

const locationSchema = schema<Location>((path) => {
  apply(path.city, citySchema);
  apply(path.country, countrySchema);
});

// Apply to form
form(signal(data), (path) => {
  apply(path.location, locationSchema);

  // Array schemas
  applyEach(path.items, itemSchema);

  // Conditional schemas
  applyWhenValue(
    path.payment,
    (p): p is CardPayment => p.type === 'card',
    cardSchema,
  );
});
```

## Form Validation & Native HTML5 Validation

**CRITICAL:** Always include `novalidate` on `<form>` elements when using Signal Forms to prevent browser native validation UI from interfering with Angular's validation display.

### Why `novalidate` is Required

Angular Signal Forms (unlike Reactive/Template-driven forms) does **not** automatically disable native HTML5 form validation. Without `novalidate`:

- **Conflicting UX**: Browser validation bubbles appear alongside your Angular error messages
- **Poor User Experience**: Users see duplicate error feedback
- **Inconsistent Styling**: Browser's default styles override your custom error styling
- **Accessibility Issues**: Screen readers may announce duplicate errors

### Correct Pattern

```html
<!-- ✅ ALWAYS include novalidate -->
<form [ngxSignalFormProvider]="userForm" (ngSubmit)="save()" novalidate>
  <input [control]="userForm.email" />
  <button type="submit">Submit</button>
</form>

<!-- ❌ WRONG - Missing novalidate causes conflicting validation UX -->
<form [ngxSignalFormProvider]="userForm" (ngSubmit)="save()">
  <!-- Browser validation bubbles conflict with toolkit error display -->
</form>
```

### Additional Best Practices

Never rely on HTML5 validation attributes alone—always add Angular validators:

```html
<!-- ❌ WRONG - Relying only on HTML5 validation (won't work properly) -->
<input [control]="userForm.email" type="email" required />

<!-- ✅ CORRECT - Combine HTML5 attributes with Angular validators -->
<input
  id="email"
  [control]="userForm.email"
  type="email"
  aria-required="true"
/>

<!-- ✅ Angular validator in component -->
<!-- (path) => {
  required(path.email, { message: 'Email is required' });
  email(path.email, { message: 'Valid email format required' });
} -->
```

**Why both?**

- **HTML5 attributes** (`type="email"`, `required`, `min`, `max`): For native browser support and accessibility (labels, ARIA)
- **Angular validators** (`required()`, `email()`, `minLength()`): For consistent validation UX and error messages
- **`novalidate` attribute**: To prevent browser validation UI from interfering

## Template Patterns

```typescript
// Form with novalidate (required)
<form [ngxSignalFormProvider]="userForm" (ngSubmit)="save()" novalidate>
  <!-- Control binding -->
  <input [control]="userForm.name" />
  <textarea [control]="userForm.bio" />
  <select [control]="userForm.category" />

  <!-- Error display -->
  @if (form.email().invalid() && form.email().touched()) {
    @for (error of form.email().errors(); track error.kind) {
      <p>{{ error.message }}</p>
    }
  }

  <!-- Form state -->
  <button [disabled]="form().invalid() || form().pending()">Submit</button>

  <!-- Pending state -->
  @if (form.email().pending()) {
    <span>Checking...</span>
  }
</form>
```

## Dynamic Arrays

```typescript
@Component({
  template: `
    @for (skill of skillsForm.skills; track $index; let i = $index) {
      <input [control]="skillsForm.skills[i].name" />
      <button (click)="removeSkill(i)">Remove</button>
    }
    <button (click)="addSkill()">Add</button>
  `,
})
export class SkillsComponent {
  readonly #skillsData = signal({ skills: [{ name: '' }] });

  protected readonly skillsForm = form(this.#skillsData, (path) => {
    applyEach(path.skills, (skill) => {
      required(skill.name, { message: 'Skill required' });
    });
  });

  protected addSkill(): void {
    this.#skillsData.update((data) => ({
      skills: [...data.skills, { name: '' }],
    }));
  }

  protected removeSkill(index: number): void {
    this.#skillsData.update((data) => ({
      skills: data.skills.filter((_, i) => i !== index),
    }));
  }
}
```

## Form Submission

### Built-in Submission State Tracking

**Angular Signal Forms includes built-in submission state tracking** via the `submittedStatus()` signal on all `FieldState` objects:

```typescript
// All FieldState objects have submittedStatus signal
this.userForm().submittedStatus(); // 'unsubmitted' | 'submitting' | 'submitted'

// Built-in reset method
this.userForm().resetSubmittedStatus();

// Automatic state propagation to all descendants
submit(this.userForm, async (field) => {
  // submittedStatus automatically becomes 'submitting'
  await apiCall();
  // submittedStatus automatically becomes 'submitted'
});
```

**Key features:**

- State values: `'unsubmitted'` | `'submitting'` | `'submitted'`
- Automatically propagates to all field descendants
- Reset with `resetSubmittedStatus()` method
- No manual tracking needed when using `submit()` helper

### Option 1: submit() Helper (Recommended)

The `submit()` helper is the **preferred pattern** for most forms. It provides:

- Automatic `markAllAsTouched()` internally (shows all errors on submit)
- Automatic `submittedStatus` state management
- Async operation handling with pending state management
- Server error integration
- Type-safe form data access

```typescript
import { submit } from '@angular/forms/signals';

@Component({
  template: `<form (ngSubmit)="handleSubmit()">...</form>`,
})
export class UserFormComponent {
  readonly #userData = signal({ email: '' });
  protected readonly userForm = form(this.#userData /* validators */);

  /// submit() helper automatically marks all fields as touched
  readonly #submitHandler = submit(this.userForm, async (formData) => {
    try {
      await this.apiService.save(formData().value());
      return null; // Success - no errors
    } catch (error) {
      // Return server errors to display on form
      return [
        {
          kind: 'save_error',
          message: 'Failed to save. Please try again.',
          field: formData,
        },
      ];
    }
  });

  protected handleSubmit(): void {
    void this.#submitHandler();
  }
}
```

### Option 2: Direct Method (Manual Approach)

For simple cases where you don't need async submission or server error handling:

```typescript
@Component({
  template: `<form (ngSubmit)="save()">...</form>`,
})
export class SimpleFormComponent {
  readonly #userData = signal({ email: '' });
  protected readonly userForm = form(this.#userData /* validators */);

  protected save(): void {
    if (this.userForm().valid()) {
      console.log('Submit:', this.#userData());
      // Handle submission (e.g., call a service, navigate)
    }
    // Note: You'll need to manually mark fields as touched if desired
  }
}
```

**When to use each approach:**

| Pattern               | Use Case                                  | Auto Touch | Async Support | Server Errors |
| --------------------- | ----------------------------------------- | ---------- | ------------- | ------------- |
| **`submit()` helper** | Most forms with validation & API calls    | ✅ Yes     | ✅ Yes        | ✅ Yes        |
| **Direct `save()`**   | Minimal forms without async/server errors | ❌ Manual  | ⚠️ Manual     | ❌ No         |

## Best Practices

### Data Model Design

````typescript
### Data Model Design
```typescript
// Define clear, typed interfaces
interface UserFormData {
  profile: { firstName: string; lastName: string };
  contacts: Array<{ type: 'email' | 'phone'; value: string }>;
}

readonly #userData = signal<UserFormData>({
  profile: { firstName: '', lastName: '' },
  contacts: []
});
````

````

### Performance

```typescript
// Always use OnPush
@Component({ changeDetection: ChangeDetectionStrategy.OnPush })

// Use computed for derived state
protected readonly formState = computed(() => ({
  valid: this.myForm().valid(),
  pending: this.myForm().pending(),
  dirty: this.myForm().dirty()
}));
````

### Error Messages

```typescript
// Provide clear, actionable messages
required(path.email, { message: 'Email address is required' });
minLength(path.password, 8, {
  message: 'Password must be at least 8 characters',
});
customError({
  kind: 'username_taken',
  message: 'This username is already taken. Please try another.',
});
```

## Migration from Reactive Forms

### Quick Reference

| Reactive Forms                  | Signal Forms                                             |
| ------------------------------- | -------------------------------------------------------- |
| `FormBuilder` + `fb.group({})`  | `signal({})` + `form(signal, validators)`                |
| `[formGroup]="form"`            | N/A (no form directive needed)                           |
| `formControlName="field"`       | `[control]="form.field"`                                 |
| `form.get('field')`             | `form.field()`                                           |
| `Validators.required`           | `required(path.field, { message: '...' })`               |
| `Validators.minLength(3)`       | `minLength(path.field, 3, { message: '...' })`           |
| `form.value`                    | `form().value()`                                         |
| `form.valueChanges.subscribe()` | `effect(() => { const val = form().value(); })`          |
| `form.markAllAsTouched()`       | Use `submit()` helper (auto) or manually mark each field |

### Migration Example

```typescript
// Reactive Forms (Old Approach)
export class UserFormComponent {
  private readonly fb = inject(FormBuilder);
  protected readonly userForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
  });
}
```

```typescript
// Signal Forms
export class UserFormComponent {
  readonly #userData = signal({ name: '', email: '' });
  protected readonly userForm = form(this.#userData, (path) => {
    required(path.name, { message: 'Name is required' });
    minLength(path.name, 3, { message: 'Min 3 characters' });
    required(path.email, { message: 'Email required' });
    email(path.email, { message: 'Valid email required' });
  });
}
```

## Migration from Template Driven Forms

### Quick Reference

| Template Driven Forms            | Signal Forms                                   |
| -------------------------------- | ---------------------------------------------- |
| `FormsModule`                    | `Control` directive                            |
| `[(ngModel)]="model.field"`      | `[control]="form.field"`                       |
| `#fieldRef="ngModel"`            | Direct access: `form.field()`                  |
| `<input required minlength="3">` | Code-based: `required(path.field, {...})`      |
| `fieldRef.errors?.['required']`  | `form.field().errors()[0].kind === 'required'` |
| `fieldRef.touched`               | `form.field().touched()`                       |
| `userForm.invalid`               | `form().invalid()`                             |
| `(ngSubmit)="save()"`            | `(ngSubmit)="save()"` (same)                   |

### Migration Example

```typescript
// Template Driven Forms
@Component({
  imports: [FormsModule],
  template: `
    <form #userForm="ngForm">
      <input
        name="name"
        [(ngModel)]="user.name"
        #nameField="ngModel"
        required
        minlength="3"
      />
      @if (nameField.errors?.['required']) {
        Name required
      }
    </form>
  `,
})
export class UserFormComponent {
  protected user = { name: '', email: '' };
}
```

```typescript
// Signal Forms
@Component({
  imports: [Control],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form (ngSubmit)="save()">
      <input [control]="userForm.name" />
      @if (userForm.name().invalid()) {
        @for (error of userForm.name().errors(); track error.kind) {
          <div>{{ error.message }}</div>
        }
      }
    </form>
  `,
})
export class UserFormComponent {
  readonly #userData = signal({ name: '', email: '' });
  protected readonly userForm = form(this.#userData, (path) => {
    required(path.name, { message: 'Name required' });
    minLength(path.name, 3, { message: 'Min 3 chars' });
  });

  protected save(): void {
    if (this.userForm().valid()) {
      console.log('Submit:', this.#userData());
    }
  }
}
```

## Common Migration Pitfalls

1. **Forgetting signal function calls**

   ```typescript
   // ❌ Wrong
   if (form.name.invalid()) {
   }

   // ✅ Correct
   if (form.name().invalid()) {
   }
   ```

2. **Not using OnPush change detection**

   ```typescript
   // ✅ Always add
   @Component({ changeDetection: ChangeDetectionStrategy.OnPush })
   ```

3. **Direct mutation instead of signal updates**

   ```typescript
   // ❌ Wrong
   this.#userData.skills.push({ name: '' });

   // ✅ Correct
   this.#userData.update((data) => ({
     ...data,
     skills: [...data.skills, { name: '' }],
   }));
   ```

## Enhancement Toolkit

For production applications requiring automatic accessibility, error display strategies, and reduced boilerplate, consider using **`@ngx-signal-forms/toolkit`**.

### Why Use the Toolkit?

The toolkit enhances Signal Forms with:

- ✅ **Automatic ARIA attributes** (`aria-invalid`, `aria-describedby`)
- ✅ **Error display strategies** (immediate, on-touch, on-submit, manual)
- ✅ **Warning support** (non-blocking validation messages)
- ✅ **Form field wrappers** (consistent layout + auto-error display)
- ✅ **WCAG 2.2 compliance** by default
- ✅ **67% less boilerplate** code

_Note: Angular Signal Forms' `[control]` directive automatically handles marking fields as touched on blur._

### Quick Install

```bash
npm install @ngx-signal-forms/toolkit
```

### Basic Example

```typescript
import { NgxSignalFormFieldComponent } from '@ngx-signal-forms/toolkit/form-field';

@Component({
  imports: [Control, NgxSignalFormFieldComponent],
  template: `
    <ngx-signal-form-field [field]="form.email" fieldName="email">
      <label for="email">Email</label>
      <input id="email" [control]="form.email" />
      <!-- Automatic ARIA, touch handling, and error display -->
    </ngx-signal-form-field>
  `,
})
```

### When to Use Toolkit vs Bare Signal Forms

| Use Case             | Bare Signal Forms        | With Toolkit           |
| -------------------- | ------------------------ | ---------------------- |
| Learning/prototyping | ✅ Recommended           | ❌ Wait until familiar |
| Production apps      | ⚠️ Manual ARIA required  | ✅ Recommended         |
| WCAG compliance      | ❌ Manual implementation | ✅ Automatic           |
| Complex error logic  | ❌ Manual conditions     | ✅ Strategies built-in |

### Complete Documentation

See [signal-forms-toolkit.instructions.md](./signal-forms-toolkit.instructions.md) for complete documentation on the enhancement library.

---

## Resources

- [Angular Signal Forms Guide](https://www.codigotipado.com/p/mastering-angular-21-signal-forms)
- [Angular.dev Docs](https://angular.dev)
- [Signal Forms API](https://angular.dev/api/forms/signals)
- [Angular Signals Guide](https://angular.dev/guide/signals)
- [Toolkit Instructions](./signal-forms-toolkit.instructions.md) ← **Enhancement library**

## Version Notes

- **Angular 21.0.0+**: Signal Forms experimental API
- **Breaking Changes**: API may change before stable release
