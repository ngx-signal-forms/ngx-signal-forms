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

| Aspect               | **Signal Forms (✅ Recommended)** | Reactive Forms (Legacy)           | Template Driven Forms (Legacy)    |
| -------------------- | --------------------------------- | --------------------------------- | --------------------------------- |
| **Status**           | ✅ Modern (Angular 21+)           | 🔶 Maintained                     | 🔶 Maintained                     |
| **State Management** | Data signal (source of truth)     | FormGroup/FormControl             | Component property + ngModel      |
| **Validation**       | Declarative functions in code     | Validator classes                 | Directives in template            |
| **Reactivity**       | Signals (zoneless compatible)     | RxJS Observables                  | Two-way binding + Zone.js         |
| **Type Safety**      | ✅ Full TypeScript inference      | Limited (improving)               | Minimal                           |
| **Change Detection** | Signal-based (optimal)            | Zone-based or manual              | Zone-based                        |
| **Boilerplate**      | ✅ Low (single `form()` call)     | High (FormBuilder required)       | Medium (FormsModule required)     |
| **Bundle Size**      | ✅ Smaller (no RxJS for forms)    | Larger                            | Medium (FormsModule)              |
| **Performance**      | ✅ Excellent (no Zone.js)         | Good                              | Good                              |
| **Testing**          | ✅ Direct signal manipulation     | TestBed + subscriptions           | TestBed + DOM                     |
| **Template Syntax**  | `[control]` directive             | `[formGroup]` + `formControlName` | `[(ngModel)]` + directives        |
| **CSS Classes**      | ❌ No `ng-*` classes added        | ✅ `ng-valid`, `ng-invalid`, etc. | ✅ `ng-valid`, `ng-invalid`, etc. |
| **Name Attribute**   | ✅ Auto-generated from path       | ⚠️ Manual via `formControlName`   | ⚠️ Manual required                |
| **State Signals**    | `touched()`, `dirty()` only       | `untouched`, `pristine`, etc.     | `untouched`, `pristine`, etc.     |
| **Learning Curve**   | Medium (signals knowledge)        | Medium (RxJS knowledge)           | Low                               |
| **Use Case**         | ✅ All new Angular 21+ projects   | Legacy support                    | Simple forms only                 |

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

  // Field state management
  disabled(path.lastName, ({ valueOf }) => !valueOf(path.firstName));
  readonly(path.id);
  hidden(path.optional, ({ valueOf }) => !valueOf(path.showOptional));
});
```

### Field State Management

Signal Forms provide three state management functions for controlling field behavior:

**`disabled(path, condition)`**

- Sets the `disabled()` signal on the field
- Automatically adds `disabled` HTML attribute to the input element
- When applied to a parent group, disables all child controls
- Disabled fields are excluded from form value

**`readonly(path, condition?)`**

- Sets the `readonly()` signal on the field
- Automatically adds `readonly` HTML attribute to the input element
- Readonly fields are included in form value but cannot be edited

**`hidden(path, condition)`**

- Sets the `hidden()` signal on the field
- Does NOT affect the HTML element automatically
- You must handle visibility in your template (e.g., `@if (!form.field().hidden())`)
- Useful for conditional field visibility based on form state

**Example - Conditional visibility:**

```typescript
form(signal(data), (path) => {
  // Hide shipping address when "same as billing" is checked
  hidden(path.shippingAddress, ({ valueOf }) => valueOf(path.sameAsBilling));
});
```

```html
<!-- In template: conditionally render based on hidden state -->
@if (!form.shippingAddress().hidden()) {
<div>
  <input [control]="form.shippingAddress.street" />
  <input [control]="form.shippingAddress.city" />
</div>
}
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

// Get ALL errors including child controls using errorSummary
protected readonly allErrors = computed(() => this.userForm().errorSummary());

// errorSummary() is available on each control and group
protected readonly emailErrors = computed(() => this.userForm.email().errorSummary());
```

**Understanding `errors()` vs `errorSummary()`:**

| Signal           | Scope                                          | Use Case                            |
| ---------------- | ---------------------------------------------- | ----------------------------------- |
| `errors()`       | Errors directly on this field/group            | Display errors for a specific field |
| `errorSummary()` | All errors including descendant child controls | Form-level error summary/banner     |

**Example - Form error banner:**

```typescript
@Component({
  template: `
    <!-- Display all form errors in a banner -->
    @if (allErrors().length > 0) {
      <div class="error-banner" role="alert">
        <h3>Please fix the following errors:</h3>
        <ul>
          @for (error of allErrors(); track error.kind) {
            <li>{{ error.message }}</li>
          }
        </ul>
      </div>
    }
  `,
})
export class FormComponent {
  protected readonly allErrors = computed(() => this.userForm().errorSummary());
}
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

### Inline Custom Validation with `error()`

For simple, non-reusable custom validation, use the `error()` function inline:

```typescript
import { error } from '@angular/forms/signals';

form(signal(data), (path) => {
  // Inline custom validation without creating a separate validator
  error(path.username, (ctx) => {
    if (ctx.value().includes(' ')) {
      return {
        kind: 'no_spaces',
        message: 'Username cannot contain spaces',
      };
    }
    return null;
  });

  // For reusable validation, use validate() instead
  validate(path.email, emailDomainValidator);
});
```

**When to use `error()` vs `validate()`:**

| Function     | Use Case                                      | Example                          |
| ------------ | --------------------------------------------- | -------------------------------- |
| `error()`    | Simple, inline, non-reusable validation logic | Field-specific business rules    |
| `validate()` | Reusable validators across multiple forms     | Email domain checks, API lookups |

## Control State Signals

Each form control exposes state signals to track user interaction and control states:

**State Signals:**

```typescript
// User interaction states (automatically managed)
form.email().touched(); // true after blur (no untouched() signal)
form.email().dirty(); // true after value change (no pristine() signal)

// Programmatic state management
form.email().markAsTouched();
form.email().markAsDirty();

// Validation states
form.email().valid(); // true if all validators pass
form.email().invalid(); // true if any validator fails
form.email().pending(); // true during async validation

// Control states (managed via validators)
form.email().disabled(); // true if disabled() validator applied
form.email().readonly(); // true if readonly() validator applied
form.email().hidden(); // true if hidden() validator applied
```

**Important Differences from Reactive/Template Forms:**

| Feature                  | Signal Forms                   | Reactive/Template Forms         |
| ------------------------ | ------------------------------ | ------------------------------- |
| **State Signals**        | `touched()`, `dirty()`         | Both positive/negative signals  |
| **No Counterparts**      | No `untouched()`, `pristine()` | `untouched`, `pristine` exist   |
| **CSS Classes**          | ❌ None added automatically    | `ng-valid`, `ng-invalid`, etc.  |
| **Name Attribute**       | ✅ Auto-generated from path    | Manual or via `formControlName` |
| **Validator Attributes** | ✅ Added to input element      | ❌ Not added                    |

**CSS Class Migration:**

Signal Forms do **not** add CSS classes like `ng-valid`, `ng-invalid`, `ng-touched`, `ng-dirty`, `ng-pristine`, or `ng-untouched` to form elements. If you rely on these for styling, you must:

1. Use attribute selectors based on validator attributes:

   ```css
   /* Instead of .ng-invalid */
   input[aria-invalid='true'] {
     border-color: red;
   }
   ```

2. Add classes manually based on signals:
   ```html
   <input
     [control]="form.email"
     [class.invalid]="form.email().invalid()"
     [class.touched]="form.email().touched()"
   />
   ```

**Name Attribute Auto-Generation:**

Signal Forms automatically generate a unique `name` attribute for each control based on its path in the form model:

```typescript
form(signal({ user: { email: '' } }), (path) => {
  required(path.user.email);
});
```

```html
<!-- Resulting HTML will have: name="user.email" -->
<input [control]="form.user.email" />
```

This improves accessibility by ensuring unique names for form controls without manual configuration.

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

4. **Expecting CSS classes like `ng-invalid`**

   ```typescript
   // ❌ Wrong - Signal Forms don't add these classes
   .ng-invalid { border-color: red; }

   // ✅ Correct - Use attribute selectors or manual classes
   input[aria-invalid="true"] { border-color: red; }

   // Or add classes manually
   <input
     [control]="form.email"
     [class.invalid]="form.email().invalid()"
   />
   ```

5. **Misunderstanding `reset()` behavior**

   ```typescript
   // ⚠️ IMPORTANT: reset() resets control states but NOT values
   form.reset(); // Resets touched, dirty, validation states

   // To reset both states AND values:
   form.reset();
   model.set(createInitialModel()); // Manually reset the data signal

   // Example with submit()
   readonly #submitHandler = submit(this.form, async (formData) => {
     await this.apiService.save(formData().value());

     // Reset both form state and model value
     formData.reset();
     this.#userData.set({ email: '', name: '' });

     return null;
   });
   ```

6. **Relying on `untouched()` or `pristine()` signals**

   ```typescript
   // ❌ Wrong - These don't exist in Signal Forms
   if (form.email().untouched()) {
   }
   if (form.email().pristine()) {
   }

   // ✅ Correct - Use logical negation
   if (!form.email().touched()) {
   }
   if (!form.email().dirty()) {
   }
   ```

7. **Validator attributes affecting input behavior**

   ```typescript
   // ⚠️ WARNING: Some validators add HTML attributes that affect behavior
   maxLength(path.message, 500);
   // Adds maxlength="500" attribute which TRUNCATES input at 500 chars

   // This can be frustrating when users paste long text - it gets silently cut off
   // Consider UX implications and provide clear feedback
   ```

8. **Forgetting `novalidate` on forms**

   ```html
   <!-- ❌ Wrong - Browser validation conflicts with Angular validation -->
   <form (ngSubmit)="save()">
     <!-- ✅ Correct - Always add novalidate -->
     <form (ngSubmit)="save()" novalidate></form>
   </form>
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
