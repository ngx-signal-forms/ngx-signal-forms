---
name: angular-forms
description: Build signal-based forms in Angular v21+ using the new Signal Forms API. Use for form creation with automatic two-way binding, schema-based validation, field state management, and dynamic forms. Triggers on form implementation, adding validation, creating multi-step forms, or building forms with conditional fields. Signal Forms are experimental but recommended for new Angular projects.
---

# Angular Signal Forms

Build type-safe, reactive forms using Angular's Signal Forms API. Signal Forms provide automatic two-way binding, schema-based validation, and reactive field state.

**Note:** Signal Forms are experimental in Angular v21. For production apps requiring stability, see [references/form-patterns.md](references/form-patterns.md) for Reactive Forms patterns.

## Basic Setup

```typescript
import { Component, signal } from '@angular/core';
import { form, FormField, required, email } from '@angular/forms/signals';

interface LoginData {
  email: string;
  password: string;
}

@Component({
  selector: 'app-login',
  imports: [FormField],
  template: `
    <form (submit)="onSubmit($event)">
      <label>
        Email
        <input type="email" [formField]="loginForm.email" />
      </label>
      @if (loginForm.email().touched() && loginForm.email().invalid()) {
        <p class="error">{{ loginForm.email().errors()[0].message }}</p>
      }

      <label>
        Password
        <input type="password" [formField]="loginForm.password" />
      </label>
      @if (loginForm.password().touched() && loginForm.password().invalid()) {
        <p class="error">{{ loginForm.password().errors()[0].message }}</p>
      }

      <button type="submit" [disabled]="loginForm().invalid()">Login</button>
    </form>
  `,
})
export class Login {
  // Form model - a writable signal
  loginModel = signal<LoginData>({
    email: '',
    password: '',
  });

  // Create form with validation schema
  loginForm = form(this.loginModel, (schemaPath) => {
    required(schemaPath.email, { message: 'Email is required' });
    email(schemaPath.email, { message: 'Enter a valid email address' });
    required(schemaPath.password, { message: 'Password is required' });
  });

  onSubmit(event: Event) {
    event.preventDefault();
    if (this.loginForm().valid()) {
      const credentials = this.loginModel();
      console.log('Submitting:', credentials);
    }
  }
}
```

## Use @ngx-signal-forms/toolkit (recommended)

Prefer the toolkit when building Signal Forms in this repo. It provides automatic ARIA wiring, error strategies, and accessible form field wrappers.

### Core directive + auto-ARIA

Use `NgxSignalFormToolkit` with `ngxSignalForm` on `<form>` to enable automatic ARIA attributes and submission lifecycle tracking.

```typescript
import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import {
  form,
  FormField,
  required,
  email,
  submit,
} from '@angular/forms/signals';
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';

interface ContactData {
  email: string;
}

@Component({
  selector: 'app-contact',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, NgxSignalFormToolkit],
  template: `
    <form [ngxSignalForm]="contactForm" (submit)="onSubmit($event)">
      <label for="email">Email</label>
      <input id="email" type="email" [formField]="contactForm.email" />
      <button type="submit">Send</button>
    </form>
  `,
})
export class ContactComponent {
  readonly #model = signal<ContactData>({ email: '' });
  protected readonly contactForm = form(this.#model, (path) => {
    required(path.email, { message: 'Email is required' });
    email(path.email, { message: 'Enter a valid email' });
  });

  protected async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    await submit(this.contactForm, async () => {
      console.log(this.#model());
    });
  }
}
```

### Form-field wrapper (outline + hints + character count)

Use `NgxFormField` for consistent layout, errors, and assistive text. Prefer `appearance="outline"` and include `placeholder=" "` for floating labels.

```typescript
import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { form, FormField, required, maxLength } from '@angular/forms/signals';
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';
import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';

interface ProfileData {
  bio: string;
}

@Component({
  selector: 'app-profile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, NgxSignalFormToolkit, NgxFormField],
  template: `
    <form [ngxSignalForm]="profileForm" (submit)="onSubmit($event)">
      <ngx-signal-form-field-wrapper
        [formField]="profileForm.bio"
        appearance="outline"
      >
        <label for="bio">Bio</label>
        <textarea
          id="bio"
          [formField]="profileForm.bio"
          placeholder=" "
          rows="4"
        ></textarea>
        <ngx-signal-form-field-hint
          >Max 200 characters</ngx-signal-form-field-hint
        >
        <ngx-signal-form-field-character-count
          [formField]="profileForm.bio"
          [maxLength]="200"
        />
      </ngx-signal-form-field-wrapper>
      <button type="submit">Save</button>
    </form>
  `,
})
export class ProfileComponent {
  readonly #model = signal<ProfileData>({ bio: '' });
  protected readonly profileForm = form(this.#model, (path) => {
    required(path.bio, { message: 'Bio is required' });
    maxLength(path.bio, 200, { message: 'Max 200 characters' });
  });

  protected onSubmit(event: Event): void {
    event.preventDefault();
  }
}
```

### Configuration + error strategies

Set defaults once and override per component when needed.

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideNgxSignalFormsConfig } from '@ngx-signal-forms/toolkit';

export const appConfig: ApplicationConfig = {
  providers: [
    provideNgxSignalFormsConfig({
      defaultErrorStrategy: 'on-submit',
      defaultFormFieldAppearance: 'outline',
      showRequiredMarker: true,
      requiredMarker: ' *',
    }),
  ],
};
```

Use `provideNgxSignalFormsConfigForComponent(...)` for per-component overrides.

### Assistive error display (optional)

When not using the wrapper, render errors with assistive components and rely on toolkit ARIA wiring.

```html
<input id="email" [formField]="form.email" />
<ngx-signal-form-error [formField]="form.email" fieldName="email" />
```

**Important:** Do not add `aria-invalid`, `aria-required`, or `aria-describedby` manually when using the toolkit; it manages them based on field state and error strategy.

## Form Models

Form models are writable signals that serve as the single source of truth:

```typescript
// Define interface for type safety
interface UserProfile {
  name: string;
  email: string;
  age: number | null;
  preferences: {
    newsletter: boolean;
    theme: 'light' | 'dark';
  };
}

// Create model signal with initial values
const userModel = signal<UserProfile>({
  name: '',
  email: '',
  age: null,
  preferences: {
    newsletter: false,
    theme: 'light',
  },
});

// Create form from model
const userForm = form(userModel);

// Access nested fields via dot notation
userForm.name; // FieldTree<string>
userForm.preferences.theme; // FieldTree<'light' | 'dark'>
```

### Reading Values

```typescript
// Read entire model
const data = this.userModel();

// Read field value via field state
const name = this.userForm.name().value();
const theme = this.userForm.preferences.theme().value();
```

### Updating Values

```typescript
// Replace entire model
this.userModel.set({
  name: 'Alice',
  email: 'alice@example.com',
  age: 30,
  preferences: { newsletter: true, theme: 'dark' },
});

// Update single field
this.userForm.name().value.set('Bob');
this.userForm.age().value.update((age) => (age ?? 0) + 1);
```

## Field State

Each field provides reactive signals for validation, interaction, and availability:

```typescript
const emailField = this.form.email();

// Validation state
emailField.valid(); // true if passes all validation
emailField.invalid(); // true if has validation errors
emailField.errors(); // array of error objects
emailField.pending(); // true if async validation in progress

// Interaction state
emailField.touched(); // true after focus + blur
emailField.dirty(); // true after user modification

// Availability state
emailField.disabled(); // true if field is disabled
emailField.hidden(); // true if field should be hidden
emailField.readonly(); // true if field is readonly

// Value
emailField.value(); // current field value (signal)
```

### Form-Level State

The form itself is also a field with aggregated state:

```typescript
// Form is valid when all interactive fields are valid
this.form().valid();

// Form is touched when any field is touched
this.form().touched();

// Form is dirty when any field is modified
this.form().dirty();
```

## Validation

### Built-in Validators

```typescript
import {
  form,
  required,
  email,
  min,
  max,
  minLength,
  maxLength,
  pattern,
} from '@angular/forms/signals';

const userForm = form(this.userModel, (schemaPath) => {
  // Required field
  required(schemaPath.name, { message: 'Name is required' });

  // Email format
  email(schemaPath.email, { message: 'Invalid email' });

  // Numeric range
  min(schemaPath.age, 18, { message: 'Must be 18+' });
  max(schemaPath.age, 120, { message: 'Invalid age' });

  // String/array length
  minLength(schemaPath.password, 8, { message: 'Min 8 characters' });
  maxLength(schemaPath.bio, 500, { message: 'Max 500 characters' });

  // Regex pattern
  pattern(schemaPath.phone, /^\d{3}-\d{3}-\d{4}$/, {
    message: 'Format: 555-123-4567',
  });
});
```

### Conditional Validation

```typescript
const orderForm = form(this.orderModel, (schemaPath) => {
  required(schemaPath.promoCode, {
    message: 'Promo code required for discounts',
    when: ({ valueOf }) => valueOf(schemaPath.applyDiscount),
  });
});
```

### Custom Validators

```typescript
import { validate } from '@angular/forms/signals';

const signupForm = form(this.signupModel, (schemaPath) => {
  // Custom validation logic
  validate(schemaPath.username, ({ value }) => {
    if (value().includes(' ')) {
      return { kind: 'noSpaces', message: 'Username cannot contain spaces' };
    }
    return null;
  });
});
```

### Cross-Field Validation

```typescript
const passwordForm = form(this.passwordModel, (schemaPath) => {
  required(schemaPath.password);
  required(schemaPath.confirmPassword);

  // Compare fields
  validate(schemaPath.confirmPassword, ({ value, valueOf }) => {
    if (value() !== valueOf(schemaPath.password)) {
      return { kind: 'mismatch', message: 'Passwords do not match' };
    }
    return null;
  });
});
```

### Async Validation

```typescript
import { validateHttp } from '@angular/forms/signals';

const signupForm = form(this.signupModel, (schemaPath) => {
  validateHttp(schemaPath.username, {
    request: ({ value }) => `/api/check-username?u=${value()}`,
    onSuccess: (response: { taken: boolean }) => {
      if (response.taken) {
        return { kind: 'taken', message: 'Username already taken' };
      }
      return null;
    },
    onError: () => ({
      kind: 'networkError',
      message: 'Could not verify username',
    }),
  });
});
```

## Conditional Fields

### Hidden Fields

```typescript
import { hidden } from '@angular/forms/signals';

const profileForm = form(this.profileModel, (schemaPath) => {
  hidden(schemaPath.publicUrl, ({ valueOf }) => !valueOf(schemaPath.isPublic));
});
```

```html
@if (!profileForm.publicUrl().hidden()) {
<input [formField]="profileForm.publicUrl" />
}
```

### Disabled Fields

```typescript
import { disabled } from '@angular/forms/signals';

const orderForm = form(this.orderModel, (schemaPath) => {
  disabled(
    schemaPath.couponCode,
    ({ valueOf }) => valueOf(schemaPath.total) < 50,
  );
});
```

### Readonly Fields

```typescript
import { readonly } from '@angular/forms/signals';

const accountForm = form(this.accountModel, (schemaPath) => {
  readonly(schemaPath.username); // Always readonly
});
```

## Form Submission

```typescript
import { submit } from '@angular/forms/signals';

@Component({
  template: `
    <form (submit)="onSubmit($event)">
      <input [formField]="form.email" />
      <input [formField]="form.password" />
      <button type="submit" [disabled]="form().invalid()">Submit</button>
    </form>
  `,
})
export class Login {
  model = signal({ email: '', password: '' });
  form = form(this.model, (schemaPath) => {
    required(schemaPath.email);
    required(schemaPath.password);
  });

  onSubmit(event: Event) {
    event.preventDefault();

    // submit() marks all fields touched and runs callback if valid
    submit(this.form, async () => {
      await this.authService.login(this.model());
    });
  }
}
```

## Arrays and Dynamic Fields

```typescript
interface Order {
  items: Array<{ product: string; quantity: number }>;
}

@Component({
  template: `
    @for (item of orderForm.items; track $index; let i = $index) {
      <div>
        <input [formField]="item.product" placeholder="Product" />
        <input [formField]="item.quantity" type="number" />
        <button type="button" (click)="removeItem(i)">Remove</button>
      </div>
    }
    <button type="button" (click)="addItem()">Add Item</button>
  `,
})
export class Order {
  orderModel = signal<Order>({
    items: [{ product: '', quantity: 1 }],
  });

  orderForm = form(this.orderModel, (schemaPath) => {
    applyEach(schemaPath.items, (item) => {
      required(item.product, { message: 'Product required' });
      min(item.quantity, 1, { message: 'Min quantity is 1' });
    });
  });

  addItem() {
    this.orderModel.update((m) => ({
      ...m,
      items: [...m.items, { product: '', quantity: 1 }],
    }));
  }

  removeItem(index: number) {
    this.orderModel.update((m) => ({
      ...m,
      items: m.items.filter((_, i) => i !== index),
    }));
  }
}
```

## Displaying Errors

```html
<input [formField]="form.email" />

@if (form.email().touched() && form.email().invalid()) {
<ul class="errors">
  @for (error of form.email().errors(); track error) {
  <li>{{ error.message }}</li>
  }
</ul>
} @if (form.email().pending()) {
<span>Validating...</span>
}
```

## Styling Based on State

```html
<input
  [formField]="form.email"
  [class.is-invalid]="form.email().touched() && form.email().invalid()"
  [class.is-valid]="form.email().touched() && form.email().valid()"
/>
```

## Reset Form

```typescript
async onSubmit() {
  if (!this.form().valid()) return;

  await this.api.submit(this.model());

  // Clear interaction state
  this.form().reset();

  // Clear values
  this.model.set({ email: '', password: '' });
}
```

For Reactive Forms patterns (production-stable), see [references/form-patterns.md](references/form-patterns.md).
