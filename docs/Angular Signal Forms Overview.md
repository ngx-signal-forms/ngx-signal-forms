# Angular Signal Forms Overview

> **Status**: Experimental (since Angular v21.0)
> **Package**: `@angular/forms/signals`
> **Last Updated**: October 2025
> **Based on**: Angular Team Reddit AMA + Official API Documentation
>
> **Additional Resources:**
>
> - [Mastering Angular 21 Signal Forms by Amos Isaila](https://www.codigotipado.com/p/mastering-angular-21-signal-forms) - Comprehensive deep dive with real-world examples

## Table of Contents

1. [Introduction](#introduction)
2. [Core Philosophy](#core-philosophy)
3. [Key APIs](#key-apis)
4. [Core Concepts](#core-concepts)
5. [Schema Creation & Validation](#schema-creation--validation)
6. [Standard Schema Integration (Zod, Valibot)](#standard-schema-integration)
7. [Advanced Patterns](#advanced-patterns)
8. [Reusable Components](#reusable-components)
9. [Best Practices](#best-practices)
10. [Comparison with Traditional Forms](#comparison-with-traditional-forms)
11. [Migration Considerations](#migration-considerations)

---

## Introduction

Angular Signal Forms is a new **experimental** reactive form system introduced in Angular 21 that leverages Angular's Signal reactivity system. It provides a declarative, type-safe, and less verbose alternative to traditional Reactive and Template-Driven Forms.

### Why Signal Forms?

**Traditional Forms Pain Points:**

- **Verbose boilerplate**: Manual creation of `FormControl`, `FormGroup`, and `FormArray`
- **Subscription management**: Complex RxJS subscription handling
- **Zone.js dependency**: Reliance on Zone.js for change detection
- **Cross-field validation complexity**: Challenging to implement conditional and cross-field validations
- **Type safety gaps**: Limited TypeScript type inference

**Signal Forms Benefits:**

- ✅ **70% less boilerplate** compared to Reactive Forms
- ✅ **Automatic reactivity** through Angular Signals
- ✅ **Zone-less compatible** - works without Zone.js
- ✅ **Type-safe** by design with full TypeScript support
- ✅ **Declarative validation** with composable schemas
- ✅ **Unified data flow** from loading → editing → saving

### ⚠️ Important Notes

- **Experimental API**: Subject to change in future releases
- **Not recommended for production** at this time
- **Limited ecosystem support**: Third-party libraries may not yet integrate
- Use for **experimentation and new projects** being built for the future

### 🚨 Critical: Error Display Logic Is Your Responsibility

> **Signal Forms provides the primitives but NO built-in error display strategies.**

**What Signal Forms PROVIDES:**

- ✅ `field.touched()` - Signal indicating if field has been touched
- ✅ `field.dirty()` - Signal indicating if field value has changed
- ✅ `field.invalid()` - Signal indicating if field has validation errors
- ✅ `field.errors()` - Signal returning array of validation errors
- ✅ `field.markAsTouched()` - Method to manually mark field as touched

**What Signal Forms DOES NOT PROVIDE:**

- ❌ **Automatic blur handlers** - You must add `(blur)="field().markAsTouched()"` manually
- ❌ **Error visibility logic** - You must write `@if (touched() && invalid())` conditions yourself
- ❌ **Submission state tracking** - You must track `hasSubmitted` in your component
- ❌ **Error display strategies** - No built-in support for "immediate", "on-touch", "on-submit" modes
- ❌ **Automatic ARIA attributes** - No automatic `aria-invalid` or `aria-describedby`

**Manual Implementation Required:**

```html
<!-- You must manually implement ALL of this: -->
<input
  id="email"
  [formField]="userForm.email"
  (blur)="userForm.email().markAsTouched()"
  [attr.aria-invalid]="userForm.email().invalid() ? 'true' : null"
  [attr.aria-describedby]="userForm.email().invalid() ? 'email-error' : null"
/>

@if (userForm.email().touched() && userForm.email().invalid()) {
<span id="email-error" role="alert">
  @for (error of userForm.email().errors(); track error.kind) {
  <p>{{ error.message }}</p>
  }
</span>
}
```

**For Automatic Error Display & Accessibility:**

See the [**Signal Forms Enhancement Library**](docs/SIGNAL_FORMS_ENHANCEMENT_LIBRARY.md) which provides:

- ✅ Automatic blur handlers via `autoTouch` directive
- ✅ Error display strategies (`immediate`, `on-touch`, `on-submit`, `manual`)
- ✅ Automatic ARIA attributes (`aria-invalid`, `aria-describedby`)
- ✅ Form field wrappers with built-in error display
- ✅ Submission state tracking via form provider
- ✅ WCAG 2.2 compliance by default

---

## Core Philosophy

> **The fundamental paradigm shift**: In Signal Forms, the form is not the state—it's a **reactive view** of the state.

### The Model as Single Source of Truth

Signal Forms represent a complete inversion of control compared to traditional Reactive Forms. Instead of the form managing a separate copy of your data, **the application's data model (held in a WritableSignal) is the absolute and single source of truth**.

#### Traditional Reactive Forms (Old Paradigm)

```typescript
// ❌ Form owns a COPY of the data
const form = new FormGroup({
  name: new FormControl(''),
  email: new FormControl(''),
});

// Application model is separate
const user = { name: '', email: '' };

// Developer must manually synchronize
form.patchValue(user); // Copy TO form
const updated = form.getRawValue(); // Copy FROM form
this.userService.save(updated);
```

**Problems:**

- Two sources of truth (form state + application model)
- Manual synchronization required
- Easy to get out of sync
- Complex state management with subscriptions

#### Signal Forms (New Paradigm)

```typescript
// ✅ Model IS the source of truth
const userModel = signal({ name: '', email: '' });

// Form is a REACTIVE VIEW of the model
const userForm = form(userModel, userSchema);

// Changes to form automatically update the model
// Changes to model automatically update the form
// NO synchronization needed!
```

**Benefits:**

- Single source of truth
- Automatic bidirectional sync
- No manual state management
- Predictable data flow

### State as Derivation, Not Storage

In Signal Forms, **all form state is derived** from the source model signal and user interactions. This includes:

- **Validation state** (`valid()`, `invalid()`, `errors()`)
- **Interaction state** (`touched()`, `dirty()`)
- **UI state** (`disabled()`, `hidden()`, `readonly()`)
- **Async state** (`pending()`)

```typescript
const userModel = signal({ email: '' });
const userForm = form(userModel, (path) => {
  required(path.email);
  email(path.email);
});

// All state is DERIVED, not stored
console.log(userForm.email().valid()); // Computed from validations
console.log(userForm.email().touched()); // Computed from user interaction
console.log(userForm.email().errors()); // Computed from validation results
```

### The Disabled Fields Philosophy

This philosophical shift is best illustrated by how Signal Forms handle disabled fields—a decision that represents a fundamental difference from Reactive Forms.

#### The Old Way (Reactive Forms)

```typescript
const form = new FormGroup({
  userId: new FormControl({ value: 123, disabled: true }),
  name: new FormControl('John'),
});

console.log(form.value); // { name: 'John' } ❌ Missing userId!
console.log(form.getRawValue()); // { userId: 123, name: 'John' } ✅
```

**Problem:** Disabled field values are excluded from `.value`, forcing developers to use `.getRawValue()`. This led to:

- Subtle bugs
- Developer confusion
- Inconsistent data handling

#### The New Way (Signal Forms)

```typescript
const userModel = signal({ userId: 123, name: 'John' });
const userForm = form(userModel, (path) => {
  disabled(path.userId); // UI state, not data modification
});

console.log(userForm().value()); // { userId: 123, name: 'John' } ✅ Always complete!
```

**Philosophy:** A field's disabled status is **UI state**, not a modification of the underlying data. The data exists in the model regardless of whether the user is permitted to edit it. Therefore, the form's value must always include it.

**Benefits:**

- **Cleaner separation** between form data and API payload
- **Developers explicitly shape** the final DTO sent to server
- **No more getRawValue() confusion**
- **Data integrity** is maintained

> **From the Angular Team AMA:** "This gives developers complete freedom to decide which values are sent to the backend and in what shape."

### Schemas: State Derivation, Not Just Validation

Another key distinction is that Signal Forms schemas define **state derivation**, not merely validation.

```typescript
// Schema defines MORE than just validation
const userSchema = schema<UserModel>((path) => {
  // Validation (derives error state)
  required(path.email);
  email(path.email);

  // UI Logic (derives UI state)
  disabled(path.userId);
  readonly(path.createdAt);
  hidden(path.internalNotes, {
    when: ({ valueOf }) => !valueOf(path.isAdmin),
  });

  // Business Logic (derives computed state)
  validate(path.discount, ({ valueOf }) => {
    return valueOf(path.isVip)
      ? []
      : [
          customError({
            kind: 'not-eligible',
            message: 'VIP only',
          }),
        ];
  });
});
```

**This is different from Zod/Valibot/etc**, which focus solely on validation. Signal Forms schemas are a **blueprint for reactive behavior**.

---

## Key APIs

### 1. Core Structure APIs

#### `form()`

Creates a form wrapped around a signal-based model.

```typescript
import { form } from '@angular/forms/signals';

const userModel = signal({ name: '', email: '' });
const userForm = form(userModel);

// With schema
const userForm = form(userModel, (path) => {
  required(path.name);
  email(path.email);
});

// With options
const userForm = form(userModel, schema, {
  injector: customInjector,
  name: 'userForm',
});
```

**Key Points:**

- Uses the model signal as **source of truth** (no internal copy)
- Updates to form automatically update the model
- Returns a `FieldTree<TValue>` structure
- Form structure matches the model shape exactly

**Form Options:**

- `injector?: Injector` - Custom dependency injection context
- `name?: string` - Form identifier for debugging
- `adapter?: FieldAdapter` - Advanced: customize field creation and management

#### Understanding the `adapter` Option (Advanced)

> **Note**: Most developers will never need to use custom adapters. This is an advanced, low-level API for specific use cases.

The `adapter` option allows you to customize how fields are created and managed internally by implementing the `FieldAdapter` interface.

**When to Use Custom Adapters:**

1. **Reactive Forms Migration** - Create a compatibility layer during migration

   ```typescript
   class ReactiveFormsAdapter implements FieldAdapter {
     createValidationState(
       node: FieldNode,
       options: FieldNodeOptions,
     ): ValidationState {
       // Return validation state that syncs with both systems
       return new HybridValidationState(node, this.reactiveFormControl);
     }

     // ... other methods
   }

   const hybridForm = form(signal(data), schema, {
     adapter: new ReactiveFormsAdapter(existingFormGroup),
   });
   ```

2. **Testing and Debugging** - Track field access and state changes

   ```typescript
   class DebugAdapter implements FieldAdapter {
     private fieldLog = new Map<string, any[]>();

     newRoot<TValue>(
       fieldManager: FormFieldManager,
       model: WritableSignal<TValue>,
       pathNode: FieldPathNode,
       adapter: FieldAdapter,
     ): FieldNode {
       const node = FieldNode.newRoot(fieldManager, model, pathNode, adapter);

       // Track all field accesses
       effect(() => {
         this.fieldLog.get('root')?.push({
           timestamp: Date.now(),
           value: model(),
         });
       });

       return node;
     }

     // ... other methods
   }

   const testForm = form(signal(data), schema, {
     adapter: new DebugAdapter(),
   });
   ```

3. **Custom Field Behavior** - Implement specialized field lifecycle management

**FieldAdapter Interface:**

```typescript
interface FieldAdapter {
  // How to create field structure (parent-child relationships)
  createStructure(
    node: FieldNode,
    options: FieldNodeOptions,
  ): FieldNodeStructure;

  // How to create validation state (errors, valid, pending, etc.)
  createValidationState(
    node: FieldNode,
    options: FieldNodeOptions,
  ): ValidationState;

  // How to create field state (touched, dirty, disabled, etc.)
  createNodeState(node: FieldNode, options: FieldNodeOptions): FieldNodeState;

  // How to create child field nodes
  newChild(options: ChildFieldNodeOptions): FieldNode;

  // How to create root field nodes
  newRoot<TValue>(
    fieldManager: FormFieldManager,
    model: WritableSignal<TValue>,
    pathNode: FieldPathNode,
    adapter: FieldAdapter,
  ): FieldNode;
}
```

**Important:** Custom adapters require deep understanding of Signal Forms internals. Use only when absolutely necessary.

#### `schema()`

Defines reusable validation and business logic.

```typescript
import { schema, required, minLength, email } from '@angular/forms/signals';

// Create reusable schema
const nameSchema = schema<string>((path) => {
  required(path, { message: 'Name is required' });
  minLength(path, 2, { message: 'At least 2 characters' });
});

// Use in form
const userForm = form(userModel, (path) => {
  apply(path.name, nameSchema);
  apply(path.email, emailSchema);
});
```

**Schema Functions:**

- `schema<T>(fn: SchemaFn<T>)`: Create a reusable schema
- `apply()`: Apply schema to a field
- `applyEach()`: Apply schema to each array element
- `applyWhen()`: Conditionally apply schema

#### Understanding the `path` Parameter and PathKind

> **Critical Concept**: The `path` parameter in schema functions is a **proxy object**, not actual data. It represents a location in your form's structure.

When you write a schema function, the `path` parameter mirrors your data model's structure but doesn't contain actual values. Think of it like a file system path - it points to a location, but isn't the file itself.

```typescript
// The path is a proxy that mirrors your data structure
const myForm = form(data, (path) => {
  // path.username is NOT the actual username value
  // It's a "marker" pointing to where username lives in the form tree
  required(path.username);
});

// To access actual data, you call the field as a function:
const actualValue = myForm.username().value(); // This is the real data
```

**PathKind Types:**

Signal Forms internally classifies paths into three categories:

1. **PathKind.Root** - The top-level entry point

   ```typescript
   const userForm = form(signal(data), (path) => {
     // ↑ 'path' here is PathKind.Root
     // This is the starting point of your form tree
     required(path.username);
   });
   ```

2. **PathKind.Child** - Nested properties accessed via dot notation

   ```typescript
   type User = {
     profile: {
       firstName: string;
       lastName: string;
     };
   };

   const userForm = form(signal<User>(...), (path) => {
     // path = Root
     // path.profile = Child (nested object)
     // path.profile.firstName = Child (nested property)
     // path.profile.lastName = Child (nested property)

     required(path.profile.firstName);
   });
   ```

3. **PathKind.Item** - Array elements (only via `applyEach`)

   ```typescript
   type TodoList = {
     todos: Array<{
       title: string;
       done: boolean;
     }>;
   };

   const todoForm = form(signal<TodoList>(...), (path) => {
     // path = Root
     // path.todos = Child (the array itself)

     applyEach(path.todos, (itemPath) => {
       // itemPath = Item (one element in the array)
       // itemPath.title = Child (property of the Item)
       // itemPath.done = Child (property of the Item)

       required(itemPath.title);
     });
   });
   ```

**Why This Matters:**

Understanding that `path` is a proxy helps you avoid common mistakes:

```typescript
// ❌ WRONG: Trying to read the value from path
const mySchema = schema<User>((path) => {
  const username = path.username; // This is NOT the value!
  if (username.length < 3) {
    // Error: path.username is not a string
    // ...
  }
});

// ✅ CORRECT: Use validators or custom logic with ctx.value()
const mySchema = schema<User>((path) => {
  validate(path.username, (ctx) => {
    const username = ctx.value(); // NOW you have the actual value
    if (username.length < 3) {
      return customError({ message: 'Too short' });
    }
    return null;
  });
});
```

### 2. Field State & Tree

#### `FieldState<TValue>`

Contains all reactive state for a field.

```typescript
interface FieldState<TValue> {
  // Value
  value: WritableSignal<TValue>;

  // Validation status
  valid: Signal<boolean>;
  invalid: Signal<boolean>;
  pending: Signal<boolean>;
  errors: Signal<ValidationError[]>;
  errorSummary: Signal<ValidationError[]>;

  // User interaction
  touched: Signal<boolean>;
  dirty: Signal<boolean>;

  // Field properties
  disabled: Signal<boolean>;
  readonly: Signal<boolean>;
  hidden: Signal<boolean>;
  required: Signal<boolean>;

  // Metadata
  name: Signal<string>;
  min: Signal<number | undefined>;
  max: Signal<number | undefined>;
  minLength: Signal<number | undefined>;
  maxLength: Signal<number | undefined>;
  pattern: Signal<readonly RegExp[]>;

  // Control binding
  controls: Signal<readonly Control<unknown>[]>;

  // Methods
  markAsTouched(): void;
  markAsDirty(): void;
  reset(): void;
  property<M>(prop: Property<M>): M | undefined;
}
```

#### `FieldTree<TValue>`

Type representing the navigable tree structure of form fields.

```typescript
interface UserModel {
  personalInfo: {
    firstName: string;
    lastName: string;
  };
  contacts: Contact[];
}

const userForm = form(signal<UserModel>(...));

// Navigate the field tree
const firstNameField = userForm.personalInfo.firstName;
const firstContact = userForm.contacts[0];
const firstContactEmail = userForm.contacts[0].email;

// Access field state
console.log(firstNameField().value());  // Get value
console.log(firstNameField().valid());  // Check validity
console.log(firstNameField().errors()); // Get errors
```

### 3. Validation APIs

#### Built-in Validators

```typescript
import {
  required,
  email,
  min,
  max,
  minLength,
  maxLength,
  pattern,
} from '@angular/forms/signals';

const formSchema = schema<UserModel>((path) => {
  // Required fields
  required(path.username, { message: 'Username is required' });

  // Email validation
  email(path.email, { message: 'Invalid email format' });

  // String length
  minLength(path.password, 8, { message: 'Min 8 characters' });
  maxLength(path.bio, 500, { message: 'Max 500 characters' });

  // Numeric range
  min(path.age, 18, { message: 'Must be 18+' });
  max(path.age, 120, { message: 'Invalid age' });

  // Pattern matching
  pattern(path.phone, /^\d{10}$/, { message: 'Invalid phone' });
});
```

#### Custom Validation: `validate()`

**Understanding Root-Level vs Field-Level Errors:**

Signal Forms supports two types of validation errors that serve different purposes:

| Error Type      | Validation Target       | Use Case                                                  | Example                        |
| --------------- | ----------------------- | --------------------------------------------------------- | ------------------------------ |
| **Field-Level** | `validate(path.field,`) | Single field validation                                   | Email format, required fields  |
| **Root-Level**  | `validate(path,`        | Cross-field validation affecting the entire form          | Password matching, date ranges |
| **Cross-Field** | `validate(path.field,`) | Field validation using other field values via `valueOf()` | Confirm password, conditional  |

**Visual Distinction:**

- The debugger component shows root-level errors with a **purple border** (🔗 icon)
- Field-level errors are shown with a **red border**

**When to Use Each:**

```typescript
import { validate, customError } from '@angular/forms/signals';

// 1. FIELD-LEVEL: Validation for a single field only
validate(path.username, ({ value }) => {
  const username = value();
  if (username.includes(' ')) {
    return [
      customError({
        kind: 'no-spaces',
        message: 'Username cannot contain spaces',
      }),
    ];
  }
  return []; // No errors
});

// 2. CROSS-FIELD (field-level with dependencies): Validate one field using another
validate(path.confirmPassword, ({ value, valueOf }) => {
  const password = valueOf(path.password);
  const confirmPassword = value();

  if (password !== confirmPassword) {
    return [
      customError({
        kind: 'password-mismatch',
        message: 'Passwords must match',
      }),
    ];
  }
  return [];
});

// 3. ROOT-LEVEL: Form-wide business rules spanning multiple fields
validate(path, ({ value }) => {
  const form = value();
  if (form.startDate > form.endDate) {
    return [
      customError({
        kind: 'date-range',
        message: 'End date must be after start date',
      }),
    ];
  }
  return [];
});
```

**Accessing Root-Level Errors:**

Root-level errors are stored directly on the form tree and can be accessed via `formTree().errors()`:

```typescript
// In your component
protected readonly userForm = form(userModel, schema);

// Get root-level errors only (cross-field validation)
protected readonly rootErrors = computed(() => this.userForm().errors());

// Get field-level errors (recursive traversal required)
protected readonly fieldErrors = computed(() => {
  const errors: ValidationError[] = [];

  // Recursive function to collect field errors
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

// Check if form has root-level errors
protected readonly hasRootErrors = computed(() => this.rootErrors().length > 0);

// Check if form has field-level errors
protected readonly hasFieldErrors = computed(() => this.fieldErrors().length > 0);
```

#### Async Validation: `validateAsync()` & `validateHttp()`

```typescript
import { validateAsync, validateHttp } from '@angular/forms/signals';

// Custom async validation
validateAsync(path.username, async ({ value }) => {
  const username = value();
  if (!username) return [];

  const exists = await checkUsernameExists(username);
  return exists
    ? [customError({ kind: 'taken', message: 'Username taken' })]
    : [];
});

// HTTP-based validation
validateHttp(path.email, {
  request: ({ value }) => {
    const email = value();
    return email ? { url: `/api/check-email?email=${email}` } : undefined;
  },
  errors: (response: { available: boolean }) => {
    return response.available
      ? []
      : [customError({ kind: 'taken', message: 'Email already in use' })];
  },
});
```

**Async Validation Features:**

- Built-in `pending()` signal during validation
- Automatic AbortController support
- Debouncing via `AsyncValidatorOptions`

#### Standard Schema Integration: `validateStandardSchema()`

```typescript
import { validateStandardSchema } from '@angular/forms/signals';
import { z } from 'zod';

// Zod schema
const UserSchema = z.object({
  name: z.string().min(1, 'Name required'),
  email: z.string().email('Invalid email'),
  age: z.number().min(18, 'Must be 18+'),
});

// Use with Signal Forms
const userForm = form(userModel, (path) => {
  validateStandardSchema(path, UserSchema);
});
```

### 4. Control Binding

#### `Control` Directive

Binds form fields to UI components.

```typescript
import { Control } from '@angular/forms/signals';

@Component({
  template: `
    <form (ngSubmit)="save()">
      <!-- Basic input -->
      <input [formField]="userForm.name" />

      <!-- With error display -->
      <input [formField]="userForm.email" />
      @if (userForm.email().invalid()) {
        <div class="error">
          @for (error of userForm.email().errors(); track error.kind) {
            <span>{{ error.message }}</span>
          }
        </div>
      }

      <!-- Checkbox -->
      <input type="checkbox" [formField]="userForm.newsletter" />

      <!-- Select -->
      <select [formField]="userForm.country">
        <option value="US">United States</option>
        <option value="UK">United Kingdom</option>
      </select>

      <!-- Custom component -->
      <ngx-date-picker [formField]="userForm.birthDate" />
    </form>
  `,
  imports: [Field]
})
```

#### `FormValueControl` Interface

Contract for components that integrate with `[formField]`.

```typescript
interface FormValueControl<TValue> {
  // Required
  readonly value: ModelSignal<TValue>;

  // Optional binding points
  readonly errors?: InputSignal<ValidationError[]>;
  readonly disabled?: InputSignal<boolean>;
  readonly readonly?: InputSignal<boolean>;
  readonly hidden?: InputSignal<boolean>;
  readonly invalid?: InputSignal<boolean>;
  readonly pending?: InputSignal<boolean>;
  readonly touched?: InputSignal<boolean | OutputRef<boolean>>;
  readonly dirty?: InputSignal<boolean>;
  readonly required?: InputSignal<boolean>;
  readonly min?: InputSignal<number | undefined>;
  readonly max?: InputSignal<number | undefined>;
  readonly minLength?: InputSignal<number | undefined>;
  readonly maxLength?: InputSignal<number | undefined>;
  readonly pattern?: InputSignal<readonly RegExp[]>;
}
```

### 5. Form Submission

#### `save()` Function

Handles form submission with built-in states.

```typescript
import { submit } from '@angular/forms/signals';

save() {
  submit(this.userForm, async (form) => {
    try {
      await this.userService.save(form().value());
      return null; // Success
    } catch (error) {
      return {
        kind: 'server_error',
        message: 'Failed to save user'
      };
    }
  });
}
```

**Submission States:**

- `submitting()`: Signal indicating submission in progress
- `submitError()`: Contains error if submission failed
- `submitSuccess()`: Indicates successful submission

### 6. Field Logic & Properties

#### `disabled()`, `readonly()`, `hidden()`

Declarative field state control.

```typescript
import { disabled, readonly, hidden } from '@angular/forms/signals';

const formSchema = schema<FormModel>((path) => {
  // Static disabled
  disabled(path.userId);

  // Conditional disabled
  disabled(path.shippingAddress, {
    when: ({ valueOf }) => !valueOf(path.useShippingAddress),
  });

  // Readonly field
  readonly(path.createdDate);

  // Conditionally hidden
  hidden(path.vipDiscount, {
    when: ({ valueOf }) => !valueOf(path.isVip),
  });
});
```

#### `property()` & Custom Properties

```typescript
import { property, Property, createProperty } from '@angular/forms/signals';

// Define custom property
const MY_CUSTOM_PROP = createProperty<string>('myCustomProp');

// Set property in schema
property(path.email, MY_CUSTOM_PROP, 'some-value');

// Read property from field state
const value = userForm.email().property(MY_CUSTOM_PROP);
```

---

## Standard Schema Integration

> **StandardSchemaV1** is a universal contract that allows Angular Signal Forms to integrate with popular validation libraries like **Zod**, **Valibot**, **ArkType**, and others.

### What is StandardSchema?

[StandardSchema](https://github.com/standard-schema/standard-schema) is a specification that defines a common interface for schema validation libraries. This allows Signal Forms to work with any library that implements this interface without custom adapters.

**Supported Libraries:**

- ✅ **Zod** (v3.23+)
- ✅ **Valibot** (v0.31+)
- ✅ **ArkType** (v2.0+)
- ✅ Any library implementing StandardSchemaV1

### When to Use Standard Schema vs Signal Forms Schema

Understanding the distinction helps you choose the right tool:

| Aspect             | Signal Forms Schema                                 | Standard Schema (Zod/Valibot)                     |
| ------------------ | --------------------------------------------------- | ------------------------------------------------- |
| **Purpose**        | State derivation (validation + UI logic + behavior) | Pure validation only                              |
| **Scope**          | Errors, warnings, disabled, hidden, readonly, etc.  | Errors only                                       |
| **Reactivity**     | Built-in signal-based reactivity                    | External validation, results converted to signals |
| **Reusability**    | Angular-specific                                    | Framework-agnostic, can be shared with backend    |
| **Learning Curve** | New API to learn                                    | May already know Zod/Valibot                      |
| **Type Safety**    | Good                                                | Excellent (especially Zod)                        |

**Recommendation:** Use both together!

- **Standard Schema** for data validation (shared with backend)
- **Signal Forms Schema** for UI logic and cross-field validation

### Using Zod with Signal Forms

#### Installation

```bash
npm install zod@latest
```

Ensure you have Zod v3.23+ which includes StandardSchemaV1 support.

#### Basic Integration with `validateStandardSchema()`

```typescript
import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { form, validateStandardSchema, Control } from '@angular/forms/signals';
import { z } from 'zod';

// 1. Define Zod schema
const UserSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be less than 20 characters'),
  email: z.string().email('Invalid email format'),
  age: z
    .number()
    .int('Age must be an integer')
    .min(18, 'Must be 18 or older')
    .max(120, 'Invalid age'),
  website: z.string().url('Invalid URL').optional(),
});

// 2. Infer TypeScript type from schema
type User = z.infer<typeof UserSchema>;

@Component({
  selector: 'ngx-user-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Field],
  template: `
    <form (ngSubmit)="save()">
      <div>
        <label>Username</label>
        <input [formField]="userForm.username" />
        @if (userForm.username().touched() && userForm.username().invalid()) {
          @for (error of userForm.username().errors(); track error.kind) {
            <span class="error">{{ error.message }}</span>
          }
        }
      </div>

      <div>
        <label>Email</label>
        <input type="email" [formField]="userForm.email" />
        @if (userForm.email().touched() && userForm.email().invalid()) {
          @for (error of userForm.email().errors(); track error.kind) {
            <span class="error">{{ error.message }}</span>
          }
        }
      </div>

      <div>
        <label>Age</label>
        <input type="number" [formField]="userForm.age" />
        @if (userForm.age().touched() && userForm.age().invalid()) {
          @for (error of userForm.age().errors(); track error.kind) {
            <span class="error">{{ error.message }}</span>
          }
        }
      </div>

      <button type="submit" [disabled]="userForm().invalid()">Save</button>
    </form>
  `,
})
export class UserFormComponent {
  // 3. Create model signal with initial values
  private readonly userModel = signal<User>({
    username: '',
    email: '',
    age: 18,
  });

  // 4. Create form with Zod schema validation
  protected readonly userForm = form(this.userModel, (path) => {
    validateStandardSchema(path, UserSchema);
  });

  save() {
    if (this.userForm().valid()) {
      console.log('Valid user:', this.userModel());
      // Save to API
    }
  }
}
```

#### Combining Zod with Signal Forms Schema

You can use Zod for data validation and Signal Forms schema for UI logic:

```typescript
import { Component, signal } from '@angular/core';
import {
  form,
  validateStandardSchema,
  disabled,
  hidden,
  validate,
  customError,
} from '@angular/forms/signals';
import { z } from 'zod';

// Zod schema for data validation
const ProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  price: z.number().min(0, 'Price must be positive'),
  salePrice: z.number().min(0).optional(),
  onSale: z.boolean(),
  category: z.enum(['electronics', 'clothing', 'food']),
  sku: z.string().min(1),
});

type Product = z.infer<typeof ProductSchema>;

@Component({
  selector: 'ngx-product-form',
  template: `
    <form>
      <!-- SKU is auto-generated, always disabled -->
      <input [formField]="productForm.sku" placeholder="SKU (auto)" />

      <input [formField]="productForm.name" placeholder="Product name" />
      <input type="number" [formField]="productForm.price" placeholder="Price" />

      <label>
        <input type="checkbox" [formField]="productForm.onSale" />
        On Sale
      </label>

      <!-- Sale price only shows when on sale -->
      @if (!productForm.salePrice().hidden()) {
        <input
          type="number"
          [formField]="productForm.salePrice"
          placeholder="Sale price"
        />
      }

      <select [formField]="productForm.category">
        <option value="electronics">Electronics</option>
        <option value="clothing">Clothing</option>
        <option value="food">Food</option>
      </select>
    </form>
  `,
})
export class ProductFormComponent {
  private readonly productModel = signal<Product>({
    name: '',
    price: 0,
    onSale: false,
    category: 'electronics',
    sku: this.generateSku(),
  });

  protected readonly productForm = form(this.productModel, (path) => {
    // 1. Apply Zod validation (data validation)
    validateStandardSchema(path, ProductSchema);

    // 2. Add UI logic (Signal Forms schema)
    disabled(path.sku); // SKU is read-only

    // Hide sale price when not on sale
    hidden(path.salePrice, {
      when: ({ valueOf }) => !valueOf(path.onSale),
    });

    // 3. Add cross-field validation (business logic)
    validate(path.salePrice, ({ value, valueOf }) => {
      const salePrice = value();
      const regularPrice = valueOf(path.price);
      const isOnSale = valueOf(path.onSale);

      if (!isOnSale || !salePrice) return [];

      if (salePrice >= regularPrice) {
        return [
          customError({
            kind: 'sale-price-invalid',
            message: 'Sale price must be less than regular price',
          }),
        ];
      }

      return [];
    });
  });

  private generateSku(): string {
    return `SKU-${Date.now()}`;
  }
}
```

#### Field-Level Zod Validation

You can also apply Zod schemas to individual fields:

```typescript
import { z } from 'zod';

// Define field-level schemas
const EmailSchema = z.string().email('Invalid email');
const PasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Must contain uppercase letter')
  .regex(/[a-z]/, 'Must contain lowercase letter')
  .regex(/[0-9]/, 'Must contain number');

const registrationForm = form(registrationModel, (path) => {
  // Apply to individual fields
  validateStandardSchema(path.email, EmailSchema);
  validateStandardSchema(path.password, PasswordSchema);
  validateStandardSchema(path.confirmPassword, PasswordSchema);

  // Add cross-field validation
  validate(path.confirmPassword, ({ value, valueOf }) => {
    return value() === valueOf(path.password)
      ? []
      : [customError({ kind: 'mismatch', message: 'Passwords must match' })];
  });
});
```

#### Hybrid Approach: Zod + Signal Forms + Async Validation

> **Real-World Pattern**: Combine Zod for data validation, Signal Forms for UI logic, and async validators for server checks.

This example from a weather application shows how to layer all three validation types:

```typescript
import { Component, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  form,
  validateStandardSchema,
  validateAsync,
  validateTree,
  customError,
  applyEach,
} from '@angular/forms/signals';
import { rxResource } from '@angular/core/rxjs-interop';
import { of, delay, switchMap } from 'rxjs';
import { z } from 'zod';

// 1. Zod for data structure validation
const WeatherLocationSchema = z.object({
  city: z
    .string()
    .min(2, 'City must be at least 2 characters')
    .max(50, 'City name is too long'),
  country: z
    .string()
    .min(2, 'Country must be at least 2 characters')
    .max(50, 'Country name is too long'),
});

const WeatherFormSchema = z.object({
  date: z
    .string()
    .min(1, 'Date is required')
    .refine(
      (date) => {
        const selectedDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return selectedDate >= today;
      },
      { message: 'Date cannot be in the past' },
    ),
  locations: z
    .array(WeatherLocationSchema)
    .min(1, 'At least one location required')
    .max(5, 'Maximum 5 locations'),
  temperatureUnit: z.enum(['celsius', 'fahrenheit']),
});

type WeatherFormData = z.infer<typeof WeatherFormSchema>;

@Component({
  selector: 'ngx-weather-form',
  template: `...`,
})
export class WeatherFormComponent {
  private readonly http = inject(HttpClient);
  private readonly cityValidationCache = new Map<string, any>();

  protected readonly weatherData = signal<WeatherFormData>({
    date: new Date().toISOString().split('T')[0],
    locations: [{ city: '', country: '' }],
    temperatureUnit: 'celsius',
  });

  protected readonly weatherForm = form(this.weatherData, (path) => {
    // Layer 1: Zod validation (data structure)
    validateStandardSchema(path, WeatherFormSchema);

    // Layer 2: Async validation (server checks)
    applyEach(path.locations, (location) => {
      validateAsync(location.city, {
        params: (ctx) => {
          const city = ctx.value();
          const country = ctx.fieldOf(location.country)().value();

          if (!city || city.length < 2 || !country || country.length < 2) {
            return undefined;
          }
          return { city, country };
        },

        factory: (params) => {
          return rxResource({
            params,
            stream: (p) => {
              if (!p.params) return of(null);

              const { city, country } = p.params;
              const cacheKey = `${city},${country}`;

              // Check cache first
              if (this.cityValidationCache.has(cacheKey)) {
                return of(this.cityValidationCache.get(cacheKey));
              }

              const url = `/api/weather/search?city=${city}&country=${country}`;

              return of(null).pipe(
                delay(1000), // Debounce
                switchMap(() => this.http.get(url)),
                tap((results) => {
                  this.cityValidationCache.set(cacheKey, results);
                }),
              );
            },
          });
        },

        errors: (results, ctx) => {
          if (!results || results.length === 0) {
            return customError({
              kind: 'city_not_found',
              message: `Could not find "${ctx.value()}" in weather database`,
            });
          }

          const exactMatch = results.some(
            (r: any) =>
              r.name.toLowerCase() === ctx.value().toLowerCase() &&
              r.country.toLowerCase() ===
                ctx.fieldOf(location.country)().value().toLowerCase(),
          );

          if (!exactMatch) {
            return customError({
              kind: 'city_country_mismatch',
              message: `"${ctx.value()}" does not exist in ${ctx.fieldOf(location.country)().value()}`,
            });
          }

          return null;
        },
      });
    });

    // Layer 3: Cross-field validation (business logic)
    validateTree(path, (ctx) => {
      const errors: any[] = [];
      const locations = ctx.value().locations;

      // Check for duplicate locations
      locations.forEach((location, index) => {
        const city = location.city.valueOf();
        const country = location.country.valueOf();

        if (!city || !country) return;

        locations.forEach((other, otherIndex) => {
          if (index !== otherIndex) {
            if (
              city === other.city.valueOf() &&
              country === other.country.valueOf()
            ) {
              errors.push({
                kind: 'duplicate_location',
                field: ctx.field.locations[index].city,
                message: `Duplicate location: ${city}, ${country}`,
              });
            }
          }
        });
      });

      return errors.length > 0 ? errors : null;
    });
  });
}
```

**Why This Pattern Works:**

1. **Zod** (Line 1) - Validates data structure, types, and basic constraints. Portable to backend.
2. **Async Validators** (Line 2) - Check server availability and data integrity with caching.
3. **validateTree** (Line 3) - Handle complex cross-field business logic with targeted error placement.

**Template Usage:**

```html
<!-- Shows all validation states -->
@for (location of weatherForm.locations; track $index) {
<div>
  <input [formField]="weatherForm.locations[$index].city" />

  <!-- Async validation state -->
  @if (weatherForm.locations[$index].city().pending()) {
  <span class="text-blue-500">Verifying city...</span>
  }

  <!-- Errors from all layers -->
  @if (weatherForm.locations[$index].city().errors().length > 0) { @for (error
  of weatherForm.locations[$index].city().errors(); track error.kind) {
  <p class="text-red-500">{{ error.message }}</p>
  } }
</div>
}
```

### Using Valibot with Signal Forms

[Valibot](https://valibot.dev/) is a lightweight alternative to Zod with a more functional API.

#### Installation (Valibot)

```bash
npm install valibot@latest
```

Ensure you have Valibot v0.31+ for StandardSchemaV1 support.

#### Basic Example

```typescript
import { Component, signal } from '@angular/core';
import { form, validateStandardSchema, Control } from '@angular/forms/signals';
import * as v from 'valibot';

// Define Valibot schema
const UserSchema = v.object({
  username: v.pipe(
    v.string(),
    v.minLength(3, 'Username must be at least 3 characters'),
    v.maxLength(20, 'Username must be less than 20 characters'),
  ),
  email: v.pipe(v.string(), v.email('Invalid email format')),
  age: v.pipe(
    v.number(),
    v.integer('Age must be an integer'),
    v.minValue(18, 'Must be 18 or older'),
    v.maxValue(120, 'Invalid age'),
  ),
});

type User = v.InferOutput<typeof UserSchema>;

@Component({
  selector: 'ngx-user-form',
  imports: [Field],
  template: `
    <form>
      <input [formField]="userForm.username" />
      <input [formField]="userForm.email" />
      <input type="number" [formField]="userForm.age" />
    </form>
  `,
})
export class UserFormComponent {
  private readonly userModel = signal<User>({
    username: '',
    email: '',
    age: 18,
  });

  protected readonly userForm = form(this.userModel, (path) => {
    validateStandardSchema(path, UserSchema);
  });
}
```

### Error Mapping from Standard Schema

Standard schema errors are automatically converted to Signal Forms `ValidationError` format:

```typescript
// Zod error
{
  code: 'too_small',
  minimum: 3,
  message: 'Username must be at least 3 characters'
}

// Converted to Signal Forms error
{
  kind: 'standard-schema',
  message: 'Username must be at least 3 characters',
  // Original Zod error available in details
}
```

Access them in templates:

```html
@for (error of userForm.username().errors(); track error.kind) { @if (error.kind
=== 'standard-schema') {
<span class="error">{{ error.message }}</span>
} }
```

### Best Practices for Standard Schema Integration

#### ✅ DO: Share Schemas Between Frontend and Backend

```typescript
// shared/schemas/user.schema.ts (shared package)
import { z } from 'zod';

export const UserSchema = z.object({
  username: z.string().min(3).max(20),
  email: z.string().email(),
  age: z.number().int().min(18).max(120),
});

export type User = z.infer<typeof UserSchema>;
```

```typescript
// Frontend (Angular)
import { UserSchema } from '@shared/schemas/user.schema';
import { form, validateStandardSchema } from '@angular/forms/signals';

const userForm = form(userModel, (path) => {
  validateStandardSchema(path, UserSchema);
});
```

```typescript
// Backend (Node.js/Express)
import { UserSchema } from '@shared/schemas/user.schema';

app.post('/api/users', (req, res) => {
  const result = UserSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ errors: result.error });
  }
  // Save user...
});
```

#### ✅ DO: Use Standard Schema for Data, Signal Forms for UI

```typescript
// Data validation with Zod
const dataValidation = ProductSchema;

// UI logic with Signal Forms
const uiLogic = schema<Product>((path) => {
  disabled(path.id);
  readonly(path.createdAt);
  hidden(path.internalNotes, {
    when: ({ valueOf }) => !valueOf(path.isAdmin),
  });
});

// Combine both
const productForm = form(productModel, (path) => {
  validateStandardSchema(path, dataValidation);
  apply(path, uiLogic);
});
```

#### ❌ DON'T: Duplicate Validation Logic

```typescript
// ❌ BAD: Duplicating validation
const ZodSchema = z.object({
  email: z.string().email(),
});

const form = form(model, (path) => {
  validateStandardSchema(path, ZodSchema);
  email(path.email); // ❌ Duplicate validation!
});
```

```typescript
// ✅ GOOD: Single source of truth
const form = form(model, (path) => {
  validateStandardSchema(path, ZodSchema); // Only here
});
```

---

## Advanced Patterns

### Schema Composition Patterns

> **Best Practice**: Build complex schemas from smaller, reusable pieces for better maintainability and testability.

#### Atomic Schemas - The Building Blocks

Start with small, focused schemas that validate a single concern:

```typescript
import { schema, required, minLength, maxLength } from '@angular/forms/signals';

// Atomic schema for city names
const cityNameSchema = schema<string>((path) => {
  required(path, { message: 'City is required' });
  minLength(path, 2, { message: 'City must be at least 2 characters' });
  maxLength(path, 50, { message: 'City name is too long' });
});

// Atomic schema for country names
const countryNameSchema = schema<string>((path) => {
  required(path, { message: 'Country is required' });
  minLength(path, 2, { message: 'Country must be at least 2 characters' });
  maxLength(path, 50, { message: 'Country name is too long' });
});
```

#### Composite Schemas - Combining Atomic Schemas

Build more complex schemas by composing atomic ones:

```typescript
type WeatherLocation = {
  city: string;
  country: string;
};

// Composite schema combines atomic schemas
const locationSchema = schema<WeatherLocation>((path) => {
  apply(path.city, cityNameSchema);
  apply(path.country, countryNameSchema);
});

// Use the composite schema
const myForm = form(signal<WeatherLocation>(...), (path) => {
  apply(path, locationSchema);
});
```

#### Array Schemas with Validation

Validate arrays and their elements:

```typescript
type LocationList = {
  locations: WeatherLocation[];
};

const locationsArraySchema = schema<WeatherLocation[]>((path) => {
  // Validate the array itself
  validate(path, (ctx) => {
    const length = ctx.value().length;
    if (length === 0) {
      return customError({
        kind: 'empty_array',
        message: 'At least one location is required',
      });
    }
    if (length > 5) {
      return customError({
        kind: 'too_many',
        message: 'Maximum 5 locations allowed',
      });
    }
    return null;
  });

  // Apply location schema to each item
  applyEach(path, locationSchema);
});
```

#### Parametric Schema Factories

Create schema factories that accept configuration:

```typescript
// Schema factory with parameters
function createLocationLimitSchema(min: number, max: number) {
  return schema<WeatherLocation[]>((path) => {
    validate(path, (ctx) => {
      const length = ctx.value().length;

      if (length < min) {
        return customError({
          kind: 'too_few',
          message: `At least ${min} location${min > 1 ? 's' : ''} required`,
        });
      }

      if (length > max) {
        return customError({
          kind: 'too_many',
          message: `Maximum ${max} locations allowed`,
        });
      }

      return null;
    });

    applyEach(path, locationSchema);
  });
}

// Use with different limits for different user types
const freeUserForm = form(data, (path) => {
  apply(path.locations, createLocationLimitSchema(1, 3));
});

const premiumUserForm = form(data, (path) => {
  apply(path.locations, createLocationLimitSchema(1, 10));
});
```

#### Conditional Schema Application

Apply different schemas based on runtime conditions:

```typescript
type WeatherQuery = {
  searchType: 'current' | 'forecast';
  date?: string;
  locations: WeatherLocation[];
};

// Schema for current weather (no date needed)
const currentWeatherSchema = schema<WeatherQuery>((path) => {
  apply(path.locations, locationsArraySchema);
  hidden(path.date); // Date should be hidden for current weather
});

// Schema for forecast (date required)
const forecastWeatherSchema = schema<WeatherQuery>((path) => {
  apply(path.locations, locationsArraySchema);
  required(path.date);

  validate(path.date, (ctx) => {
    const selectedDate = new Date(ctx.value());
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      return customError({
        kind: 'past_date',
        message: 'Date cannot be in the past',
      });
    }

    return null;
  });
});

// Apply conditionally based on searchType
const weatherForm = form(weatherData, (path) => {
  applyWhenValue(
    path,
    (value): value is Extract<WeatherQuery, { searchType: 'current' }> =>
      value.searchType === 'current',
    currentWeatherSchema,
  );

  applyWhenValue(
    path,
    (value): value is Extract<WeatherQuery, { searchType: 'forecast' }> =>
      value.searchType === 'forecast',
    forecastWeatherSchema,
  );
});
```

#### Schema Composition Best Practices

**✅ DO: Build from Small to Large**

```typescript
// Atomic → Composite → Array → Form
const fieldSchema = schema<string>(...);
const objectSchema = schema<Object>((path) => apply(path.field, fieldSchema));
const arraySchema = schema<Object[]>((path) => applyEach(path, objectSchema));
const formSchema = schema<Form>((path) => apply(path.items, arraySchema));
```

**✅ DO: Make Schemas Reusable**

```typescript
// Share schemas across forms
const emailSchema = schema<string>((path) => {
  required(path);
  email(path);
});

// Use in multiple forms
const registrationForm = form(regData, (path) =>
  apply(path.email, emailSchema),
);
const profileForm = form(profileData, (path) => apply(path.email, emailSchema));
```

**❌ DON'T: Inline Complex Validation**

```typescript
// ❌ Hard to test and reuse
const form1 = form(data, (path) => {
  required(path.city);
  minLength(path.city, 2);
  maxLength(path.city, 50);
  required(path.country);
  minLength(path.country, 2);
  maxLength(path.country, 50);
});

// ✅ Testable and reusable
const form2 = form(data, (path) => {
  apply(path, locationSchema); // Single line, tested separately
});
```

**When to Use Schemas vs Inline:**

- **Use Schemas** when:
  - Validation is shared across multiple forms
  - Testing validation logic independently
  - Complex nested structures
  - Team needs clear documentation

- **Use Inline** when:
  - Validation is unique to a single form
  - Quick prototyping
  - Simple, one-off forms

### Conditional Field Logic: hidden() vs Optional Fields

> **Critical Distinction:** The Angular team's AMA revealed two distinct patterns for conditional logic that developers often confuse.

#### Scenario 1: Conditionally Shown/Edited Fields (Use `hidden()`)

**When to use:** Field is always part of the data model but may not be visible or editable based on current form state.

**Example:** An "Additional Details" field that only appears when a checkbox is ticked.

```typescript
import { hidden } from '@angular/forms/signals';

interface OrderModel {
  productId: string;
  quantity: number;
  showAdditionalDetail: boolean; // ✅ Boolean to control visibility
  additionalDetail: string; // ✅ Always exists in model
}

const orderForm = form(orderModel, (path) => {
  required(path.productId);
  required(path.quantity);

  // Hide the field when checkbox is not checked
  hidden(path.additionalDetail, {
    when: ({ valueOf }) => !valueOf(path.showAdditionalDetail),
  });

  // Validation still applies when visible
  minLength(path.additionalDetail, 10, {
    message: 'Please provide at least 10 characters',
  });
});
```

**Template:**

```html
<label>
  <input type="checkbox" [formField]="orderForm.showAdditionalDetail" />
  Need additional details?
</label>

<!-- Shown/hidden based on checkbox -->
@if (!orderForm.additionalDetail().hidden()) {
<div>
  <label>Additional Details</label>
  <textarea [formField]="orderForm.additionalDetail"></textarea>
</div>
}
```

**Key Benefits:**

- ✅ **Preserves user input**: If user enters data then hides the field, their input is preserved
- ✅ **Better UX**: User can toggle visibility without losing work
- ✅ **Clear intent**: Field is always in the model, just not always visible

#### Scenario 2: Structurally Conditional Fields (Use Optional + `applyWhenValue`)

**When to use:** Field may not exist in the data model at all for certain objects.

**Example:** Some order types don't have the concept of "shipping address".

```typescript
import { applyWhenValue } from '@angular/forms/signals';

interface OrderModel {
  productId: string;
  quantity: number;
  shippingAddress?: Address; // ✅ Optional - may not exist
}

const addressSchema = schema<Address>((path) => {
  required(path.street);
  required(path.city);
  required(path.zipCode);
});

const orderForm = form(orderModel, (path) => {
  required(path.productId);
  required(path.quantity);

  // Only apply validation if the field exists
  applyWhenValue(
    path.shippingAddress,
    (value) => value !== undefined,
    addressSchema,
  );
});
```

**Template:**

```html
<!-- Conditionally render based on existence -->
@if (orderForm.shippingAddress) {
<div>
  <h3>Shipping Address</h3>
  <input [formField]="orderForm.shippingAddress.street" />
  <input [formField]="orderForm.shippingAddress.city" />
  <input [formField]="orderForm.shippingAddress.zipCode" />
</div>
}
```

**Key Differences:**

| Aspect                | `hidden()`                           | Optional Field + `applyWhenValue`    |
| --------------------- | ------------------------------------ | ------------------------------------ |
| **Model Type**        | Field always exists                  | Field is optional (`field?: Type`)   |
| **Use Case**          | UI state (shouldn't be shown/edited) | Data model structure (may not exist) |
| **Data Preservation** | Yes, value persists when hidden      | N/A, field doesn't exist when absent |
| **Template Check**    | `!field().hidden()`                  | `if (field)`                         |
| **Validation**        | Always defined, runs when visible    | Only exists when field exists        |

> **From Angular Team AMA:** "hidden() is for managing UI state ('these fields shouldn't be shown/edited for the current user input'), while the optional field with applyWhenValue is for managing data model structure ('these fields don't even make sense to have for this object')."

### Dynamic Forms from Runtime Metadata

A common enterprise requirement is generating forms from database-driven metadata. Signal Forms' functional API makes this significantly cleaner than Reactive Forms.

#### Step 1: Define Metadata Structure

```typescript
export interface FieldMetadata {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'number' | 'checkbox' | 'select';
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  options?: { value: string; label: string }[];
}

// Example: Flight booking form metadata
const flightFormMetadata: FieldMetadata[] = [
  {
    name: 'passengerName',
    label: 'Passenger Name',
    required: true,
    minLength: 2,
  },
  { name: 'email', label: 'Email', type: 'email', required: true },
  {
    name: 'seatNumber',
    label: 'Seat Number',
    type: 'number',
    min: 1,
    max: 200,
  },
  {
    name: 'mealPreference',
    label: 'Meal Preference',
    type: 'select',
    options: [
      { value: 'vegetarian', label: 'Vegetarian' },
      { value: 'vegan', label: 'Vegan' },
      { value: 'standard', label: 'Standard' },
    ],
  },
];
```

#### Step 2: Create Schema from Metadata

```typescript
import {
  schema,
  required,
  minLength,
  maxLength,
  min,
  max,
  email,
  Schema,
} from '@angular/forms/signals';

export function metadataToSchema(metadata: FieldMetadata[]): Schema<unknown> {
  return schema<unknown>((path) => {
    for (const field of metadata) {
      // Get the field path dynamically
      const fieldPath = (path as any)[field.name];
      if (!fieldPath) continue;

      // Apply validation based on metadata
      if (field.required) {
        required(fieldPath, { message: `${field.label} is required` });
      }

      if (field.type === 'email') {
        email(fieldPath, { message: 'Invalid email format' });
      }

      if (field.minLength !== undefined) {
        minLength(fieldPath, field.minLength, {
          message: `Minimum ${field.minLength} characters`,
        });
      }

      if (field.maxLength !== undefined) {
        maxLength(fieldPath, field.maxLength, {
          message: `Maximum ${field.maxLength} characters`,
        });
      }

      if (field.min !== undefined) {
        min(fieldPath, field.min, {
          message: `Minimum value is ${field.min}`,
        });
      }

      if (field.max !== undefined) {
        max(fieldPath, field.max, {
          message: `Maximum value is ${field.max}`,
        });
      }
    }
  });
}
```

#### Step 3: Dynamic Rendering Component

```typescript
import { Component, input } from '@angular/core';
import { FieldState, Control } from '@angular/forms/signals';

@Component({
  selector: 'ngx-dynamic-form',
  imports: [Field],
  template: `
    @for (field of metadata(); track field.name) {
      @let fieldState = getField(field.name);

      @if (fieldState) {
        <div class="form-field">
          <label [for]="field.name">{{ field.label }}</label>

          @switch (field.type) {
            @case ('checkbox') {
              <input type="checkbox" [id]="field.name" [formField]="fieldState" />
            }
            @case ('select') {
              <select [id]="field.name" [formField]="fieldState">
                @for (option of field.options ?? []; track option.value) {
                  <option [value]="option.value">{{ option.label }}</option>
                }
              </select>
            }
            @default {
              <input
                [type]="field.type ?? 'text'"
                [id]="field.name"
                [formField]="fieldState"
              />
            }
          }

          @if (fieldState().touched() && fieldState().invalid()) {
            <div class="errors">
              @for (error of fieldState().errors(); track error.kind) {
                <span class="error">{{ error.message }}</span>
              }
            </div>
          }
        </div>
      }
    }
  `,
  styles: [
    `
      .form-field {
        margin-bottom: 1rem;
      }
      .errors {
        color: red;
        font-size: 0.875rem;
        margin-top: 0.25rem;
      }
    `,
  ],
})
export class DynamicFormComponent {
  metadata = input.required<FieldMetadata[]>();
  dynamicForm = input.required<() => FieldState<unknown>>();

  protected getField(fieldName: string): (() => FieldState<unknown>) | null {
    const form = this.dynamicForm();
    const field = (form as any)[fieldName];
    return field || null;
  }
}
```

#### Step 4: Usage in Parent Component

```typescript
import { Component, signal } from '@angular/core';

@Component({
  selector: 'ngx-flight-booking',
  imports: [DynamicFormComponent],
  template: `
    <h2>Flight Booking</h2>

    <ngx-dynamic-form
      [metadata]="flightFormMetadata"
      [dynamicForm]="flightForm"
    />

    <button (click)="save()" [disabled]="flightForm().invalid()">
      Book Flight
    </button>
  `,
})
export class FlightBookingComponent {
  protected readonly flightFormMetadata = flightFormMetadata;

  private readonly flightModel = signal<Record<string, unknown>>({
    passengerName: '',
    email: '',
    seatNumber: 1,
    mealPreference: 'standard',
  });

  protected readonly flightForm = form(
    this.flightModel,
    metadataToSchema(flightFormMetadata),
  );

  save() {
    if (this.flightForm().valid()) {
      console.log('Booking:', this.flightModel());
      // Submit to API
    }
  }
}
```

### Tree Validators for Better Cross-Field UX

> **Critical Decision**: Use `validate()` for simple validation, but use `validateTree()` when you need to target errors to specific child fields.

#### When to Use `validate()` vs `validateTree()`

**Use `validate()`** when errors should appear on the field being validated:

```typescript
// Error appears on the 'username' field
validate(path.username, ({ value }) => {
  const username = value();
  if (username.includes(' ')) {
    return customError({
      kind: 'no-spaces',
      message: 'Username cannot contain spaces',
    });
  }
  return null;
});
```

**Use `validateTree()`** when validation involves multiple fields and you need to assign errors to specific locations:

```typescript
// Example: Duplicate detection in an array
validateTree(path, (ctx) => {
  const errors: ValidationError[] = [];
  const locations = ctx.value().locations;

  locations.forEach((location, index) => {
    const city = location.city.valueOf();
    const country = location.country.valueOf();

    if (!city || !country) return;

    // Check for duplicates
    locations.forEach((other, otherIndex) => {
      if (index !== otherIndex) {
        if (
          city === other.city.valueOf() &&
          country === other.country.valueOf()
        ) {
          errors.push({
            kind: 'duplicate_location',
            field: ctx.field.locations[index].city, // 🎯 Target specific field!
            message: `Duplicate location: ${city}, ${country}`,
          });
        }
      }
    });
  });

  return errors.length > 0 ? errors : null;
});
```

#### Password Matching Example

Tree validators allow multi-field validation errors to be assigned to specific child fields instead of just the parent group.

```typescript
import { validateTree } from '@angular/forms/signals';

interface PasswordForm {
  password: string;
  confirmPassword: string;
}

const passwordForm = form(passwordModel, (path) => {
  required(path.password);
  required(path.confirmPassword);

  // Tree validator - specifies which field gets the error
  validateTree(path, ({ value }) => {
    const form = value();

    if (form.password !== form.confirmPassword) {
      return {
        // Error goes to confirmPassword field, not the form root
        confirmPassword: [
          customError({
            kind: 'password-mismatch',
            message: 'Passwords must match',
          }),
        ],
      };
    }

    return {}; // No errors
  });
});
```

**Key Differences:**

| Aspect              | `validate()`                                   | `validateTree()`                                      |
| ------------------- | ---------------------------------------------- | ----------------------------------------------------- |
| **Error Target**    | Only the validated field                       | Any field in the tree                                 |
| **Use Case**        | Single-field logic                             | Cross-field validation                                |
| **Error Placement** | Automatic (current field)                      | Manual (specify target)                               |
| **Return Type**     | `ValidationError \| ValidationError[] \| null` | `{ [key]: ValidationError[] }` or `ValidationError[]` |
| **Complexity**      | Simple                                         | More flexible                                         |

**Benefits:**

- Error shows next to the relevant input field
- Better UX than form-level errors
- Clear indication of which field needs correction
- Fine-grained control over error placement

### Non-Blocking Form Submission

> **From Angular Team AMA:** Client-side async validation intentionally does not block form submission.

#### Why Async Validation Doesn't Block Submission

**Design Rationale:**

1. **Server Must Validate Anyway** - For security, the server is the ultimate source of truth. Client-side validation is a UX enhancement, not a security measure.

2. **Reduced Latency** - Users get faster response times. Waiting for async validators adds unnecessary delay when the server will validate anyway.

3. **No False Security** - Prevents developers from relying on client-side async validation as a security boundary.

**What This Means:**

```typescript
import { submit } from '@angular/forms/signals';

async function onsave() {
  // ✅ Submits immediately even if async validators are still pending
  submit(this.myForm, async (formState) => {
    if (!formState.valid()) {
      // Handle sync validation errors
      throw new Error('Form has validation errors');
    }

    try {
      // Server validates and may return additional errors
      const result = await this.api.save(formState.value());
      return result;
    } catch (serverError) {
      // Handle server validation errors
      // These are the errors that truly matter
      throw serverError;
    }
  });
}
```

**Best Practice - Handling Server Errors:**

```typescript
protected readonly submitHandler = submit(this.userForm, async (formState) => {
  try {
    await this.userService.save(formState.value());
    this.router.navigate(['/success']);
  } catch (error: any) {
    // Server validation errors override client-side
    if (error.status === 422) {
      // Map server errors to form fields
      const serverErrors = error.error.errors;

      return Object.keys(serverErrors).map(field => ({
        kind: 'server-validation',
        field: this.userForm[formField],
        message: serverErrors[formField]
      }));
    }
    throw error;
  }
});
```

**Key Takeaway:** Async validators improve UX by providing early feedback, but **always validate on the server** and handle server errors appropriately.

```typescript
import { submit } from '@angular/forms/signals';

async function onsave() {
  // Submits immediately even if async validators are still pending
  await submit(userForm, async (form) => {
    try {
      // Server will do final validation
      const response = await api.saveUser(form().value());
      return undefined; // Success
    } catch (error) {
      // Server rejected - return errors
      return {
        kind: 'server_error',
        message: error.message,
      };
    }
  });
}
```

**What this means:**

- ✅ Faster submission response for users
- ✅ Server is still the source of truth
- ✅ No false sense of security from client-side validation
- ⚠️ You may need to handle server-side validation errors

### Incremental Hydration with @defer

Because form state is tied to the model signal, form UI components can be lazy-loaded with `@defer` without complex state synchronization.

```typescript
@Component({
  template: `
    <form>
      <!-- Critical fields load immediately -->
      <input [formField]="userForm.email" />
      <input [formField]="userForm.password" />

      <!-- Advanced settings load on interaction -->
      @defer (on interaction) {
        <ngx-advanced-settings [form]="userForm.settings" />
      } @placeholder {
        <button>Show Advanced Settings</button>
      }
    </form>
  `,
})
export class UserFormComponent {
  protected readonly userForm = form(userModel, userSchema);
}

// Advanced settings component loads lazily
@Component({
  selector: 'ngx-advanced-settings',
  template: `
    <input [formField]="form().theme" />
    <input [formField]="form().timezone" />
    <!-- Complex UI that's not needed initially -->
  `,
})
export class AdvancedSettingsComponent {
  form = input.required<() => FieldState<Settings>>();
}
```

**Benefits:**

- Faster initial page load
- Components hydrate seamlessly when loaded
- No manual state synchronization needed
- Model signal is already available

---

## Reusable Components

### Form Field Wrapper Component

Create a reusable component that wraps labels, inputs, and error messages for consistent styling and behavior.

```typescript
import { Component, input, contentChild } from '@angular/core';
import { FieldState, Control } from '@angular/forms/signals';

@Component({
  selector: 'ngx-form-field',
  imports: [Field],
  template: `
    <div class="form-field" [class.has-error]="showError()">
      <!-- Label (projected) -->
      <ng-content select="label" />

      <!-- Input control (projected) -->
      <ng-content />

      <!-- Error messages -->
      @if (showError()) {
        <div class="error-messages">
          @for (error of field().errors(); track error.kind) {
            <span class="error-message">{{ error.message }}</span>
          }
        </div>
      }

      <!-- Optional hint text -->
      @if (hint()) {
        <div class="hint-text">{{ hint() }}</div>
      }
    </div>
  `,
  styles: [
    `
      .form-field {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin-bottom: 1rem;
      }

      .form-field label {
        font-weight: 500;
        font-size: 0.875rem;
        color: #374151;
      }

      .form-field.has-error label {
        color: #dc2626;
      }

      .form-field input,
      .form-field select,
      .form-field textarea {
        padding: 0.5rem;
        border: 1px solid #d1d5db;
        border-radius: 0.375rem;
        font-size: 1rem;
      }

      .form-field.has-error input,
      .form-field.has-error select,
      .form-field.has-error textarea {
        border-color: #dc2626;
      }

      .error-messages {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .error-message {
        color: #dc2626;
        font-size: 0.875rem;
      }

      .hint-text {
        color: #6b7280;
        font-size: 0.875rem;
      }
    `,
  ],
})
export class FormFieldComponent {
  // Required: The field state
  field = input.required<() => FieldState<any>>();

  // Optional: Hint text
  hint = input<string>();

  // Computed: Whether to show errors
  protected readonly showError = computed(() => {
    const fieldState = this.field()();
    return fieldState.touched() && fieldState.invalid();
  });
}
```

**Usage:**

```typescript
@Component({
  selector: 'ngx-user-form',
  imports: [FormFieldComponent, Control],
  template: `
    <form>
      <!-- Simple text input -->
      <ngx-form-field [formField]="userForm.name">
        <label for="name">Name</label>
        <input id="name" [formField]="userForm.name" />
      </ngx-form-field>

      <!-- Email with hint -->
      <ngx-form-field
        [formField]="userForm.email"
        hint="We'll never share your email"
      >
        <label for="email">Email</label>
        <input id="email" type="email" [formField]="userForm.email" />
      </ngx-form-field>

      <!-- Textarea -->
      <ngx-form-field [formField]="userForm.bio">
        <label for="bio">Bio</label>
        <textarea id="bio" [formField]="userForm.bio" rows="4"></textarea>
      </ngx-form-field>

      <!-- Select -->
      <ngx-form-field [formField]="userForm.country">
        <label for="country">Country</label>
        <select id="country" [formField]="userForm.country">
          <option value="US">United States</option>
          <option value="UK">United Kingdom</option>
          <option value="CA">Canada</option>
        </select>
      </ngx-form-field>

      <button type="submit">Save</button>
    </form>
  `,
})
export class UserFormComponent {
  protected readonly userForm = form(userModel, userSchema);
}
```

### Validation Error Display Component

A specialized component for rendering validation errors with custom formatting.

```typescript
import { Component, input, computed } from '@angular/core';
import { FieldState, ValidationError } from '@angular/forms/signals';

@Component({
  selector: 'ngx-validation-errors',
  template: `
    @if (shouldShow()) {
      <div class="validation-errors" role="alert">
        @for (error of errors(); track error.kind) {
          <div class="error-item">
            @switch (error.kind) {
              @case ('required') {
                <span class="error-icon">⚠️</span>
                <span>{{ error.message || 'This field is required' }}</span>
              }
              @case ('email') {
                <span class="error-icon">📧</span>
                <span>{{ error.message || 'Invalid email format' }}</span>
              }
              @case ('minLength') {
                <span class="error-icon">📏</span>
                <span>{{ error.message }}</span>
              }
              @default {
                <span class="error-icon">❌</span>
                <span>{{ error.message || 'Invalid input' }}</span>
              }
            }
          </div>
        }
      </div>
    }
  `,
  styles: [
    `
      .validation-errors {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin-top: 0.5rem;
      }

      .error-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem;
        background-color: #fef2f2;
        border-left: 3px solid #dc2626;
        border-radius: 0.25rem;
        font-size: 0.875rem;
        color: #991b1b;
      }

      .error-icon {
        flex-shrink: 0;
      }
    `,
  ],
})
export class ValidationErrorsComponent {
  field = input.required<() => FieldState<any>>();
  showWhen = input<'touched' | 'dirty' | 'always'>('touched');

  protected readonly errors = computed(() => this.field()().errors());

  protected readonly shouldShow = computed(() => {
    const fieldState = this.field()();
    const hasErrors = fieldState.invalid();

    if (!hasErrors) return false;

    switch (this.showWhen()) {
      case 'always':
        return true;
      case 'dirty':
        return fieldState.dirty();
      case 'touched':
      default:
        return fieldState.touched();
    }
  });
}
```

**Usage:**

```html
<input [formField]="userForm.email" />
<ngx-validation-errors [formField]="userForm.email" />

<!-- Or with custom display strategy -->
<input [formField]="userForm.password" />
<ngx-validation-errors [formField]="userForm.password" showWhen="dirty" />
```

### Form Submit Button Component

A smart submit button that handles all the submission states.

```typescript
import { Component, input, output } from '@angular/core';
import { FieldState } from '@angular/forms/signals';

@Component({
  selector: 'ngx-submit-button',
  template: `
    <button
      type="submit"
      [disabled]="isDisabled()"
      [class]="buttonClass()"
      (click)="handleClick($event)"
    >
      @if (form().submitting()) {
        <span class="spinner"></span>
        <span>{{ loadingText() }}</span>
      } @else {
        <span>{{ text() }}</span>
      }
    </button>
  `,
  styles: [
    `
      button {
        padding: 0.75rem 1.5rem;
        font-weight: 500;
        border-radius: 0.375rem;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      button:not(:disabled) {
        background-color: #3b82f6;
        color: white;
        border: none;
      }

      button:not(:disabled):hover {
        background-color: #2563eb;
      }

      button:disabled {
        background-color: #e5e7eb;
        color: #9ca3af;
        cursor: not-allowed;
      }

      .spinner {
        width: 1rem;
        height: 1rem;
        border: 2px solid currentColor;
        border-top-color: transparent;
        border-radius: 50%;
        animation: spin 0.6s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    `,
  ],
})
export class SubmitButtonComponent {
  form = input.required<() => FieldState<any>>();
  text = input<string>('Submit');
  loadingText = input<string>('Submitting...');
  disableWhenInvalid = input<boolean>(true);
  buttonClass = input<string>('');

  clicked = output<Event>();

  protected readonly isDisabled = computed(() => {
    const formState = this.form()();

    if (formState.submitting()) {
      return true;
    }

    if (this.disableWhenInvalid() && formState.invalid()) {
      return true;
    }

    return false;
  });

  protected handleClick(event: Event): void {
    this.clicked.emit(event);
  }
}
```

**Usage:**

```typescript
@Component({
  template: `
    <form (ngSubmit)="save()">
      <!-- form fields -->

      <ngx-submit-button
        [form]="userForm"
        text="Save User"
        loadingText="Saving..."
        (clicked)="save()"
      />
    </form>
  `,
})
export class UserFormComponent {
  protected readonly userForm = form(userModel, userSchema);

  async save() {
    await submit(this.userForm, async (form) => {
      await this.userService.save(form().value());
    });
  }
}
```

---

## Core Concepts

### 1. Unidirectional Data Flow

**Model as Single Source of Truth:**

```typescript
// ❌ WRONG: Traditional two-way binding
<input [(ngModel)]="user.name" />

// ✅ CORRECT: Unidirectional with signals
const userModel = signal<User>({ name: '', email: '' });
const userForm = form(userModel);

<input [formField]="userForm.name" />
```

**Flow:**

1. Model signal holds the data
2. Form wraps the model (no internal copy)
3. UI binds to form fields
4. Changes update model directly
5. Model changes propagate to form and UI automatically

### 2. Reactive Field State

All field properties are **signals** that update automatically:

```typescript
const nameField = userForm.name;

// All are signals
const value = nameField().value(); // Current value
const isValid = nameField().valid(); // Validation state
const isTouched = nameField().touched(); // User interaction
const errors = nameField().errors(); // Validation errors

// Use in computed
const displayError = computed(
  () => nameField().touched() && nameField().invalid(),
);

// Use in effects
effect(() => {
  if (nameField().dirty()) {
    console.log('Name changed:', nameField().value());
  }
});
```

### 3. Field Tree Navigation

Access nested fields using **dot notation**:

```typescript
interface FormModel {
  user: {
    profile: {
      name: string;
      addresses: Address[];
    }
  }
}

const form = form(signal<FormModel>(...));

// Navigate tree
const nameField = form.user.profile.name;
const firstAddress = form.user.profile.addresses[0];
const firstStreet = form.user.profile.addresses[0].street;

// All return FieldState
console.log(nameField().value());
console.log(firstAddress().valid());
```

### 4. Schema Composition

Build complex validation from smaller, reusable pieces:

```typescript
// Reusable schemas
const emailSchema = schema<string>((path) => {
  required(path);
  email(path);
});

const passwordSchema = schema<string>((path) => {
  required(path);
  minLength(path, 8);
  pattern(path, /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)/, {
    message: 'Must contain uppercase, lowercase, and number',
  });
});

const addressSchema = schema<Address>((path) => {
  required(path.street);
  required(path.city);
  required(path.zipCode);
  pattern(path.zipCode, /^\d{5}$/);
});

// Compose in main schema
const registrationSchema = schema<RegistrationModel>((path) => {
  apply(path.email, emailSchema);
  apply(path.password, passwordSchema);
  apply(path.confirmPassword, passwordSchema);
  apply(path.billingAddress, addressSchema);

  // Apply to array items
  applyEach(path.shippingAddresses, addressSchema);

  // Cross-field validation
  validate(path.confirmPassword, ({ value, valueOf }) => {
    return value() === valueOf(path.password)
      ? []
      : [customError({ kind: 'mismatch', message: 'Passwords must match' })];
  });
});
```

---

## Schema Creation & Validation

### Schema Function Pattern

```typescript
const schemaFn = (path: FieldPath<TValue>) => {
  // Add validation rules
  // Define field properties
  // Configure field logic
};
```

**Key Features:**

- **Non-reactive function** that sets up reactive rules
- Receives `FieldPath<TValue>` parameter
- Type-safe field navigation
- Declarative rule definition

### Schema Composition Strategies

#### 1. **Flat Schemas** (Simple Forms)

```typescript
const loginSchema = schema<LoginModel>((path) => {
  required(path.username);
  required(path.password);
  minLength(path.password, 8);
});
```

#### 2. **Nested Schemas** (Complex Forms)

```typescript
// Sub-schemas
const personalInfoSchema = schema<PersonalInfo>((path) => {
  required(path.firstName);
  required(path.lastName);
  email(path.email);
});

const preferencesSchema = schema<Preferences>((path) => {
  // ... preference validations
});

// Main schema
const userSchema = schema<UserModel>((path) => {
  apply(path.personalInfo, personalInfoSchema);
  apply(path.preferences, preferencesSchema);
});
```

#### 3. **Conditional Schemas**

```typescript
const orderSchema = schema<OrderModel>((path) => {
  required(path.productId);
  required(path.quantity);

  // Conditional validation
  applyWhen(
    path.shippingAddress,
    ({ valueOf }) => valueOf(path.shippingRequired),
    addressSchema,
  );

  // Or using when option
  required(path.shippingAddress, {
    when: ({ valueOf }) => valueOf(path.shippingRequired),
  });
});
```

#### 4. **Array Schemas**

```typescript
const taskListSchema = schema<TaskList>((path) => {
  required(path.listName);

  // Validate each task in array
  applyEach(path.tasks, (taskPath) => {
    required(taskPath.title);
    minLength(taskPath.title, 3);
  });

  // Or use a separate schema
  applyEach(path.tasks, taskSchema);
});
```

### Validation Best Practices

#### ✅ DO: Keep Schemas Pure and Reusable

```typescript
// Good: Reusable, composable
const emailSchema = schema<string>((path) => {
  required(path);
  email(path);
});

// Can be used anywhere
apply(path.email, emailSchema);
apply(path.contactEmail, emailSchema);
```

#### ✅ DO: Use Helper Context for Complex Validation

```typescript
validate(path.endDate, ({ value, valueOf, stateOf }) => {
  const startDate = valueOf(path.startDate);
  const endDate = value();
  const startDateValid = stateOf(path.startDate).valid();

  if (!startDateValid) return []; // Don't validate if start invalid

  return endDate > startDate
    ? []
    : [customError({ kind: 'range', message: 'End after start' })];
});
```

**Helper Functions:**

- `value()`: Signal with current field value
- `valueOf(path)`: Get value of any field
- `stateOf(path)`: Get FieldState of any field
- `fieldOf(path)`: Get FieldTree of any field

#### ✅ DO: Separate Concerns with Multiple Schemas

```typescript
// Validation
const userValidationSchema = schema<User>((path) => {
  required(path.email);
  email(path.email);
});

// Business logic
const userLogicSchema = schema<User>((path) => {
  disabled(path.userId);
  readonly(path.createdDate);
  hidden(path.internalNotes, {
    when: ({ valueOf }) => !valueOf(path.isAdmin),
  });
});

// Combine
const userForm = form(userModel, (path) => {
  apply(path, userValidationSchema);
  apply(path, userLogicSchema);
});
```

#### ❌ DON'T: Mix Validation Types Without Clear Structure

```typescript
// Bad: Hard to maintain
const messySchema = schema<FormModel>((path) => {
  required(path.field1);
  disabled(path.field2);
  validate(path.field3, ...);
  required(path.field4);
  hidden(path.field5);
  // ... mixed concerns
});
```

#### ❌ DON'T: Create Circular Dependencies

```typescript
// Bad: Circular validation
validate(path.field1, ({ valueOf }) => {
  return valueOf(path.field2) !== '' ? [] : [error];
});

validate(path.field2, ({ valueOf }) => {
  return valueOf(path.field1) !== '' ? [] : [error];
});
```

---

## Best Practices

### 1. Form Organization

#### Component Structure

```typescript
@Component({
  selector: 'ngx-user-form',
  template: '...',
  imports: [Field],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserFormComponent {
  // Model signal (source of truth)
  private userModel = signal<UserModel>(initialUser);

  // Form wrapping the model
  protected readonly userForm = form(this.userModel, userSchema);

  // Derived states for UI
  protected readonly canSubmit = computed(
    () => this.userForm().valid() && !this.userForm().submitting(),
  );

  protected readonly hasErrors = computed(
    () => this.userForm().invalid() && this.userForm().touched(),
  );

  // Methods
  save() {
    submit(this.userForm, async (form) => {
      // Save logic
    });
  }

  reset() {
    this.userForm().reset();
    this.userModel.set(initialUser);
  }
}
```

### 2. Schema Organization

#### File Structure

```plaintext
src/app/
├── forms/
│   ├── schemas/
│   │   ├── common/
│   │   │   ├── email.schema.ts
│   │   │   ├── password.schema.ts

│   │   │   └── address.schema.ts
│   │   ├── user/
│   │   │   ├── user-profile.schema.ts
│   │   │   └── user-settings.schema.ts
│   │   └── index.ts (barrel exports)
│   ├── models/
│   │   ├── user.model.ts
│   │   └── address.model.ts
│   └── validators/
│       └── custom-validators.ts
```

#### Schema Libraries

```typescript
// schemas/common/email.schema.ts
export const emailSchema = schema<string>((path) => {
  required(path, { message: 'Email required' });
  email(path, { message: 'Invalid email format' });
});

// schemas/common/password.schema.ts
export const passwordSchema = schema<string>((path) => {
  required(path);
  minLength(path, 8);
  pattern(path, /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)/);
});

// schemas/index.ts
export * from './common/email.schema';
export * from './common/password.schema';
export * from './user/user-profile.schema';
```

### 3. Type Safety

#### Leverage TypeScript

```typescript
// Define strict model types
interface UserProfile {
  readonly id: number;
  name: string;
  email: string;
  addresses: Address[];
}

// Use const for initial values
const INITIAL_USER: UserProfile = {
  id: 0,
  name: '',
  email: '',
  addresses: [],
} as const;

// Type-safe schema
const profileSchema = schema<UserProfile>((path) => {
  // TypeScript ensures path.name is valid
  required(path.name);

  // TypeScript error if path doesn't exist
  // required(path.invalidField); // ❌ Error
});
```

### 4. Performance Optimization

#### Debounce Async Validation

```typescript
import { validateAsync } from '@angular/forms/signals';

validateAsync(
  path.username,
  async ({ value }) => {
    // Check username availability
  },
  {
    debounce: 500, // Wait 500ms after last change
  },
);
```

#### Use Computed for Derived State

```typescript
// ✅ Good: Computed updates only when dependencies change
const isFormReady = computed(() =>
  this.userForm().valid() &&
  this.userForm().dirty() &&
  !this.userForm().submitting()
);

// ❌ Bad: Recreates every change detection
get isFormReady() {
  return this.userForm().valid() &&
         this.userForm().dirty() &&
         !this.userForm().submitting();
}
```

#### Optimize Array Operations

```typescript
@Component({
  template: `
    @for (item of userForm.items().controls; track item.id()) {
      <ngx-item-editor [formField]="item" />
    }
  `
})
```

### 5. Error Handling

#### Centralized Error Display Component

```typescript
@Component({
  selector: 'ngx-field-errors',
  template: `
    @if (field().invalid() && field().touched()) {
      <div class="error-container">
        @for (error of field().errors(); track error.kind) {
          <span class="error-message">{{ error.message }}</span>
        }
      </div>
    }
  `
})
export class FieldErrorsComponent {
  field = input.required<FieldState<any>>();
}

// Usage
<input [formField]="userForm.email" />
<ngx-field-errors [formField]="userForm.email()" />
```

#### Custom Error Messages

```typescript
const ERROR_MESSAGES: Record<string, (error: ValidationError) => string> = {
  required: () => 'This field is required',
  email: () => 'Please enter a valid email',
  minLength: (err) => `Minimum ${err.minLength} characters required`,
  custom: (err) => err.message,
};

@Component({
  template: `
    @for (error of field().errors(); track error.kind) {
      <span>{{ getErrorMessage(error) }}</span>
    }
  `,
})
export class FieldErrorsComponent {
  getErrorMessage(error: ValidationError): string {
    return ERROR_MESSAGES[error.kind]?.(error) ?? 'Invalid input';
  }
}
```

### 6. Testing

#### Component Testing

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';

describe('UserFormComponent', () => {
  let component: UserFormComponent;
  let fixture: ComponentFixture<UserFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UserFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should validate required fields', () => {
    // Arrange
    const nameField = component.userForm.name;

    // Act
    nameField().value.set('');
    nameField().markAsTouched();

    // Assert
    expect(nameField().valid()).toBe(false);
    expect(nameField().errors()).toContainEqual(
      jasmine.objectContaining({ kind: 'required' }),
    );
  });

  it('should validate email format', () => {
    const emailField = component.userForm.email;

    emailField().value.set('invalid');
    expect(emailField().valid()).toBe(false);

    emailField().value.set('valid@email.com');
    expect(emailField().valid()).toBe(true);
  });

  it('should handle form submission', async () => {
    spyOn(component['userService'], 'save').and.returnValue(Promise.resolve());

    component.userForm.name().value.set('John');
    component.userForm.email().value.set('john@example.com');

    await component.save();

    expect(component['userService'].save).toHaveBeenCalled();
    expect(component.userForm().submitting()).toBe(false);
  });
});
```

---

## Comparison with Traditional Forms

### Reactive Forms vs Signal Forms

| Aspect                     | Reactive Forms                         | Signal Forms                 |
| -------------------------- | -------------------------------------- | ---------------------------- |
| **Boilerplate**            | High (FormField, FormGroup, FormArray) | Low (automatic from model)   |
| **Type Safety**            | Limited                                | Full TypeScript support      |
| **Reactivity**             | RxJS Observables                       | Angular Signals              |
| **Change Detection**       | Zone.js dependent                      | Zone-less compatible         |
| **Validation**             | Imperative (validators array)          | Declarative (schema)         |
| **Cross-field Validation** | Complex with custom validators         | Built-in with schema context |
| **Async Validation**       | Observable-based                       | Signal/Promise-based         |
| **State Management**       | Manual subscription handling           | Automatic signal updates     |
| **Learning Curve**         | Moderate                               | Moderate (new paradigm)      |
| **Maturity**               | Stable, production-ready               | Experimental                 |

### Code Comparison

#### Reactive Forms

```typescript
// Model
interface User {
  name: string;
  email: string;
  age: number;
}

// Component
export class UserFormComponent implements OnInit {
  userForm!: FormGroup;

  ngOnInit() {
    this.userForm = new FormGroup({
      name: new FormControl('', [Validators.required, Validators.minLength(2)]),
      email: new FormControl('', [Validators.required, Validators.email]),
      age: new FormControl(0, [Validators.required, Validators.min(18)]),
    });

    // Subscribe to changes
    this.userForm.valueChanges.subscribe((value) => {
      // Handle changes
    });
  }

  save() {
    if (this.userForm.valid) {
      const user = this.userForm.value as User;
      // Save user
    }
  }

  ngOnDestroy() {
    // Clean up subscriptions
  }
}
```

#### Signal Forms

```typescript
// Model
interface User {
  name: string;
  email: string;
  age: number;
}

// Schema
const userSchema = schema<User>((path) => {
  required(path.name);
  minLength(path.name, 2);

  required(path.email);
  email(path.email);

  required(path.age);
  min(path.age, 18);
});

// Component
export class UserFormComponent {
  private userModel = signal<User>({
    name: '',
    email: '',
    age: 0,
  });

  protected readonly userForm = form(this.userModel, userSchema);

  // Reactive derived state (no subscription needed)
  protected readonly formValue = computed(() => this.userModel());

  save() {
    submit(this.userForm, async (form) => {
      const user = form().value();
      // Save user
    });
  }

  // No ngOnDestroy needed - signals clean themselves up
}
```

**Lines of Code:**

- Reactive Forms: ~40 lines
- Signal Forms: ~25 lines (37% reduction)

---

## Migration Considerations

> **Critical Insight from Angular Team AMA:** Migration from Reactive Forms to Signal Forms is not a mechanical code transformation—it's a **conceptual refactoring** that requires rethinking how forms work.

### The Migration Challenge

When asked about automatic migration scripts, the Angular team was candid:

> "This is probably more a task for AI... the two APIs are just too different."

**Why no automatic migration?**

The fundamental difference lies in the **imperative vs declarative** nature of the APIs:

| Reactive Forms (Imperative)            | Signal Forms (Declarative) |
| -------------------------------------- | -------------------------- |
| Scattered behavior across lifecycle    | Centralized in schema      |
| `addControl()`, `removeControl()`      | Structural model changes   |
| `setValidators()`, `clearValidators()` | Schema composition         |
| `patchValue()`, `setValue()`           | Signal updates             |
| `valueChanges` subscriptions           | Computed signals           |
| Manual state management                | Automatic derivation       |

### Migration is Conceptual Refactoring

A successful migration requires **rethinking the form's logic** through the lens of the new paradigm, not just changing syntax.

#### ❌ What NOT to Do

```typescript
// ❌ BAD: Trying to "translate" Reactive Forms to Signal Forms
const form = new FormGroup({
  name: new FormControl('', Validators.required),
});

// This mindset doesn't translate!
form.get('name')?.disable();
form.valueChanges.subscribe((value) => {
  // imperative logic
});
```

#### ✅ The Right Mindset

```typescript
// ✅ GOOD: Rethink as declarative state derivation
const model = signal({ name: '', isAdmin: false });

const userForm = form(model, (path) => {
  // All behavior declared in one place
  required(path.name);
  disabled(path.name, {
    when: ({ valueOf }) => !valueOf(path.isAdmin),
  });
});

// Derived state, not subscriptions
const nameDisabled = computed(() => userForm.name().disabled());
```

### Step-by-Step Refactoring Process

#### Step 1: Establish the Source of Truth

**Before (Reactive Forms):**

```typescript
export class UserFormComponent {
  userForm = new FormGroup({
    name: new FormControl(''),
    email: new FormControl(''),
  });

  // Separate model
  user: User | null = null;

  ngOnInit() {
    if (this.user) {
      this.userForm.patchValue(this.user); // Manual sync
    }
  }

  save() {
    this.user = this.userForm.value as User; // Manual sync
  }
}
```

**After (Signal Forms):**

```typescript
export class UserFormComponent {
  // Model IS the source of truth
  private readonly userModel = signal<User>({
    name: '',
    email: '',
  });

  // Form is a reactive view
  protected readonly userForm = form(this.userModel, userSchema);

  // No manual sync needed!
}
```

#### Step 2: Translate Logic to Schema

**Before (Reactive Forms):**

```typescript
export class UserFormComponent {
  userForm = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(3)]),
    email: new FormControl('', [Validators.required, Validators.email]),
    age: new FormControl(0, [Validators.required, Validators.min(18)]),
  });

  ngOnInit() {
    // Conditional validation added imperatively
    this.userForm.get('email')?.valueChanges.subscribe((email) => {
      if (email?.includes('company.com')) {
        this.userForm.get('department')?.setValidators([Validators.required]);
      } else {
        this.userForm.get('department')?.clearValidators();
      }
      this.userForm.get('department')?.updateValueAndValidity();
    });
  }
}
```

**After (Signal Forms):**

```typescript
export class UserFormComponent {
  protected readonly userForm = form(this.userModel, (path) => {
    // All validation declared in one place
    required(path.name);
    minLength(path.name, 3);

    required(path.email);
    email(path.email);

    required(path.age);
    min(path.age, 18);

    // Conditional validation is declarative
    required(path.department, {
      when: ({ valueOf }) => valueOf(path.email)?.includes('company.com'),
    });
  });
}
```

#### Step 3: Replace Subscriptions with Derivations

**Before (Reactive Forms):**

```typescript
export class UserFormComponent implements OnDestroy {
  userForm = new FormGroup({
    /* ... */
  });

  private subscriptions = new Subscription();

  ngOnInit() {
    // Subscription for derived value
    this.subscriptions.add(
      this.userForm.get('firstName')?.valueChanges.subscribe((firstName) => {
        this.displayName = `${firstName} ${this.userForm.get('lastName')?.value}`;
      }),
    );

    this.subscriptions.add(
      this.userForm.get('lastName')?.valueChanges.subscribe((lastName) => {
        this.displayName = `${this.userForm.get('firstName')?.value} ${lastName}`;
      }),
    );
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
```

**After (Signal Forms):**

```typescript
export class UserFormComponent {
  protected readonly userForm = form(this.userModel, userSchema);

  // Computed signal automatically updates
  protected readonly displayName = computed(() => {
    const model = this.userModel();
    return `${model.firstName} ${model.lastName}`;
  });

  // No ngOnDestroy needed!
}
```

#### Step 4: Convert Imperative State to Declarative Conditions

**Before (Reactive Forms):**

```typescript
export class OrderFormComponent {
  orderForm = new FormGroup({
    /* ... */
  });

  onShippingRequiredChange(required: boolean) {
    if (required) {
      this.orderForm.get('shippingAddress')?.enable();
    } else {
      this.orderForm.get('shippingAddress')?.disable();
    }
  }
}
```

**After (Signal Forms):**

```typescript
export class OrderFormComponent {
  protected readonly orderForm = form(this.orderModel, (path) => {
    // Declarative disabled state
    disabled(path.shippingAddress, {
      when: ({ valueOf }) => !valueOf(path.shippingRequired),
    });
  });
}
```

### When to Use Signal Forms

✅ **Good Candidates:**

- New projects targeting Angular 21+
- Experimental/learning projects
- Internal tools and prototypes
- Applications being built for future Angular versions
- Zone-less applications
- Forms with complex conditional logic
- Projects embracing signal-first architecture

❌ **Not Recommended For:**

- Production applications (currently experimental)
- Projects with tight deadlines
- Applications requiring third-party form libraries
- Teams unfamiliar with Signals
- Legacy applications (high migration cost without clear ROI)

### Practical Migration Strategy

#### Phase 1: Learn and Experiment (1-2 weeks)

1. Build new forms with Signal Forms
2. Team training on Signals and new paradigm
3. Create internal examples and best practices
4. Identify simple forms for pilot migration

#### Phase 2: Parallel Implementation (1-2 months)

```typescript
// Keep existing Reactive Forms
export class UserComponent {
  // Old forms continue to work
  userForm = new FormGroup({
    /* ... */
  });

  // New features use Signal Forms
  settingsModel = signal<Settings>({
    /* ... */
  });
  settingsForm = form(this.settingsModel, settingsSchema);
}
```

#### Phase 3: Gradual Migration (ongoing)

1. Migrate simple forms first
2. Refactor one form at a time
3. Comprehensive testing after each migration
4. Document patterns and gotchas
5. Build reusable components (field wrappers, error displays)

#### Phase 4: Full Adoption (6-12 months)

```typescript
// All forms use Signal Forms
export class UserComponent {
  userModel = signal<User>({
    /* ... */
  });
  userForm = form(this.userModel, userSchema);

  settingsModel = signal<Settings>({
    /* ... */
  });
  settingsForm = form(this.settingsModel, settingsSchema);
}
```

### Migration Checklist

When migrating a Reactive Form:

- [ ] Identify the source of truth (model data)
- [ ] Create a WritableSignal for the model
- [ ] Consolidate all validators into a schema
- [ ] Convert `valueChanges` subscriptions to `computed()`
- [ ] Replace `enable()`/`disable()` with `disabled()` schema logic
- [ ] Convert `addControl`/`removeControl` to optional fields
- [ ] Replace `patchValue`/`setValue` with signal updates
- [ ] Remove manual subscription cleanup (signals auto-cleanup)
- [ ] Update templates to use `[formField]` directive
- [ ] Test thoroughly (unit + E2E)
- [ ] Update documentation

### Common Migration Pitfalls

#### ❌ Pitfall 1: Forgetting Model is Mutable

```typescript
// ❌ WRONG: Treating model as immutable
const model = signal({ name: '' });
const form = form(model, schema);

// This mutates the signal's value!
form.name().value.set('John'); // ✅ This is correct

// This doesn't work
model.set({ name: 'John' }); // ❌ Breaks form connection
```

#### ❌ Pitfall 2: Using getRawValue() Mindset

```typescript
// ❌ WRONG: Old Reactive Forms habit
const formValue = form().value(); // Always includes all fields
const partialValue = excludeDisabled(formValue); // Manual filtering

// ✅ CORRECT: Shape data explicitly for API
const apiPayload = {
  name: form().value().name,
  email: form().value().email,
  // Explicitly choose what to send
};
```

#### ❌ Pitfall 3: Not Using Schemas for UI Logic

```typescript
// ❌ WRONG: Imperative UI logic
@Component({
  template: `
    @if (shouldShowField) {
      <input [formField]="form.field" />
    }
  `
})
class MyComponent {
  shouldShowField = computed(() => /* ... */);
}

// ✅ CORRECT: Declarative with hidden()
const myForm = form(model, (path) => {
  hidden(path.field, {
    when: ({ valueOf }) => !valueOf(path.showField),
  });
});
```

---

## Resources

### Official Documentation

- [Angular Signal Forms API](https://next.angular.dev/api/forms/signals)
- [Angular Signals Guide](https://angular.dev/guide/signals)
- [Angular Forms Guide](https://angular.dev/guide/forms)

### Articles & Tutorials

- [All About Angular's New Signal Forms](https://www.angulararchitects.io/en/blog/all-about-angulars-new-signal-forms/)
- [Full-Cycle Reactivity with Signal Forms](https://www.angulararchitects.io/en/blog/full-cycle-reativity-in-angular-signal-forms-signal-store-resources-mutation-api/)
- [Angular Signal Forms Deep Dive](https://medium.com/mustakbil/angular-signal-forms-deep-dive-build-smarter-forms-with-new-signal-forms-api-in-angular-21-1feb15a68403)
- [Signal Forms Introduction](https://dev.to/this-is-angular/signals-form-introduction-11d1)
- [Signal Forms Validation and Logic](https://dev.to/this-is-angular/angular-signals-form-validation-and-logic-2n07)

### Community

- [Angular Discord](https://discord.gg/angular)
- [Angular GitHub Discussions](https://github.com/angular/angular/discussions)
- [Angular Reddit AMA on Signal Forms](https://www.reddit.com/r/Angular2/)

### External Libraries

- [Zod](https://zod.dev/) - TypeScript-first schema validation
- [Valibot](https://valibot.dev/) - Lightweight validation library
- [StandardSchema](https://github.com/standard-schema/standard-schema) - Universal schema specification

---

## Summary

Angular Signal Forms represents a **fundamental shift** toward more declarative, reactive form handling in Angular:

### Key Takeaways

1. **Model as Source of Truth**: Forms are reactive views, not separate state containers
2. **Signal-Based Reactivity**: Built on Angular's Signals for automatic, fine-grained updates
3. **Schemas = State Derivation**: More than validation—they define all reactive behavior
4. **70% Less Boilerplate**: Dramatic reduction in code compared to Reactive Forms
5. **Type-Safe by Design**: Full TypeScript support with excellent inference
6. **Declarative Everything**: Validation, UI logic, and business rules in one place
7. **Zone-less Ready**: Works without Zone.js for better performance
8. **Disabled Fields Philosophy**: Values always included—UI state vs data
9. **Non-Blocking Submission**: Client validation doesn't block form submit
10. **Migration is Conceptual**: Not a code-mod, requires rethinking the approach

### The Philosophical Shift

| Old Paradigm (Reactive Forms) | New Paradigm (Signal Forms)  |
| ----------------------------- | ---------------------------- |
| Form owns a copy of data      | Model is the source of truth |
| Imperative state management   | Declarative state derivation |
| Manual synchronization        | Automatic reactivity         |
| Scattered logic               | Centralized in schema        |
| Subscription-based            | Signal-based                 |
| Zone.js dependent             | Zone-less compatible         |

### What Makes Signal Forms Different

1. **The form IS NOT the state** - it's a derived view of your model signal
2. **Disabled doesn't mean excluded** - disabled field values are always in `.value()`
3. **Schemas do more than validate** - they define all reactive behavior (errors, UI state, business logic)
4. **Submit doesn't wait** - async validation doesn't block submission (server validates anyway)
5. **Conditionals are declarative** - `hidden()` for UI state, optional fields for structure
6. **No subscriptions needed** - signals and computed handle all reactivity
7. **Incremental hydration built-in** - `@defer` works seamlessly with form state

### The Future

Signal Forms are part of Angular's broader evolution toward:

- **Signal-first reactivity** across the entire framework
- **Zone-less applications** for dramatic performance improvements
- **Simplified APIs** with less boilerplate and better DX
- **Better developer experience** with stronger typing and clearer patterns
- **Unified reactivity model** (no more mixing Observables and Signals)

### When Will It Be Ready?

**Current Status (v21):** Experimental

- ✅ Core APIs are stable enough for experimentation
- ✅ StandardSchema integration works well
- ⚠️ API may change before stabilization
- ❌ Not recommended for production yet

**Expected Timeline:**

- **v22-23**: API refinements, community feedback
- **v24+**: Potential stabilization (speculative)
- **Long-term**: Signal Forms become the recommended approach

### Getting Started Today

1. **Experiment in side projects** - Learn the new paradigm risk-free
2. **Build internal tools** - Use for non-critical applications
3. **Study the patterns** - Understand the philosophy, not just the syntax
4. **Follow the team** - Monitor Angular blog and GitHub for updates
5. **Share learnings** - Contribute to community knowledge

### Final Thoughts

Signal Forms aren't just a new API—they represent a **fundamental rethinking** of how forms should work in a modern, reactive framework. The shift from imperative to declarative, from form-centric to model-centric, and from manual to automatic is significant.

**The migration challenge is real**: You can't just translate Reactive Forms syntax to Signal Forms syntax. You must **rethink your approach**. But for teams willing to make that investment, Signal Forms offer a dramatically simpler, more powerful, and more maintainable way to build forms.

> **From the Angular Team:** "Signal Forms thinks of the form as a form model which defines a hierarchy of fields, plus form state derived on top of that model."

This is the future of Angular forms. The question isn't if you'll adopt it, but when—and whether you'll be ready to think differently when you do.

---

**Document Version**: 2.0.0
**Last Updated**: October 9, 2025
**Angular Version**: 21.0+ (experimental)
**Based on**: Angular Team Reddit AMA + Official API Documentation

**Contributors**: Angular Team, Community Feedback, Reddit AMA Participants

**Changelog**:

- v2.0.0: Major update with AMA insights, Standard Schema integration, reusable components, advanced patterns
- v1.0.0: Initial comprehensive overview

- **Signal-first reactivity** across the framework
- **Zone-less applications** for better performance
- **Simplified APIs** with less boilerplate
- **Better developer experience** with stronger typing

As the API stabilizes, Signal Forms will likely become the **recommended approach** for new Angular applications, replacing traditional Reactive Forms as the primary form solution.

**Stay Updated**: Monitor the [Angular Blog](https://blog.angular.dev/) and [Angular Roadmap](https://angular.dev/roadmap) for announcements on Signal Forms stability and production readiness.

---

**Document Version**: 1.0.0
**Last Updated**: October 9, 2025
**Angular Version**: 21.0+ (experimental)
