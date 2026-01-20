# @ngx-signal-forms/toolkit

> **Zero-intrusive toolkit for Angular Signal Forms**
>
> Directives, components, and utilities that add automatic accessibility, error display strategies, and form field wrappers to Angular's Signal Forms API — without changing the core API.

### Final Recommendation

**Primary Choice**: `@ngx-signal-forms/toolkit` with secondary entry points.

**Package Structure:**

- `@ngx-signal-forms/toolkit` - Providers and shared types
- `@ngx-signal-forms/toolkit/core` - Core directives, utilities, components
- `@ngx-signal-forms/toolkit/form-field` - Optional form-field wrapper

**Why This Structure:**

### Final Recommendation

**Primary Choice**: `@ngx-signal-forms/toolkit` with secondary entry points.

**Package Structure:**

- `@ngx-signal-forms/toolkit` - Providers and shared types
- `@ngx-signal-forms/toolkit/core` - Core directives, utilities, components
- `@ngx-signal-forms/toolkit/form-field` - Optional form-field wrapper

**Why This Structure:**

1. **Simplified DX**: Most users only install one package
2. **Tree-shakable**: Secondary entry points are only included when imported
3. **Easy Opt-out**: Don't want form-field wrapper? Don't import it

### Repository Structure (Current)

```text
ngx-signal-forms/                    # Repository root
├── apps/
│   └── demo/                        # Demo application
├── docs/                            # Markdown documentation
├── packages/
│   └── toolkit/                     # @ngx-signal-forms/toolkit
│       ├── core/                    # Core entry
│       ├── form-field/              # Optional form-field entry
│       ├── index.ts                 # Primary entry (providers/types)
│       └── README.md
├── pnpm-workspace.yaml
├── nx.json
├── package.json
└── tsconfig.base.json
```

| **Components** | `form-error`, `form-field` | Reusable UI for error display and layout |
| **Utilities** | `computeShowErrors()`, `fieldNameResolver()` | Pure functions that work with Signal Forms state |
| **Providers** | `provideNgxSignalFormsConfig()`, form context | DI-based configuration and context sharing |
| **Types** | `ErrorDisplayStrategy`, `NgxSignalFormsConfig` | TypeScript types for better DX |

### Dependency Graph

```text
@angular/core (peer)
@angular/forms/signals (peer) ← Signal Forms API (unchanged)
        ↓
@ngx-signal-forms/toolkit (main package)
├── /core (directives, utilities, components)
└── /form-field (secondary entry - optional)
```

**Shared Core Usage:**

If needed in the future, core utilities could be extracted to an internal shared package, but for v1.0, the toolkit includes all core functionality.

**Key Points:**

- ✅ No wrapper around Signal Forms API
- ✅ Directives attach to existing `[formField]` bindings
- ✅ Components work with Signal Forms field state
- ✅ Utilities are pure functions taking Signal Forms signals
- ✅ Providers use Angular DI, don't modify form creation
- ✅ Tree-shakable: use only what you need

---

## API Design

### 1. Core Directives

#### `ngxSignalFormAutoAria`

**Selector:**

```typescript
selector: `
  input[formField]:not([ngxSignalFormAutoAriaDisabled]):not([type="radio"]):not([type="checkbox"]),
  textarea[formField]:not([ngxSignalFormAutoAriaDisabled]),
  select[formField]:not([ngxSignalFormAutoAriaDisabled])
`;
```

**Host Bindings:**

```typescript
host: {
  '[attr.aria-invalid]': 'ariaInvalid()',
  '[attr.aria-describedby]': 'ariaDescribedBy()'
}
```

**Field Name Extraction (4-tier priority):**

1. `data-signal-field` attribute (explicit nested paths)
2. Custom resolver from config
3. `id` attribute (WCAG preferred)
4. `name` attribute (fallback)

**Examples:**

```html
<!-- Priority 1: Explicit -->
<input
  data-signal-field="personalInfo.firstName"
  [formField]="userForm.personalInfo.firstName"
/>

<!-- Priority 3: ID (most common) -->
<input id="email" [formField]="userForm.email" />

<!-- Priority 4: Name -->
<input name="phoneNumber" [formField]="userForm.phoneNumber" />

<!-- Opt-out -->
<input ngxSignalFormAutoAriaDisabled [formField]="userForm.someField" />
```

#### Touch Tracking (Signal Forms)

Signal Forms' `[formField]` directive automatically marks fields as touched on blur. The toolkit relies on this native behavior.

#### `ngxSignalForm`

**Purpose:** Provides form context to child directives via DI and derives submission state.

**Directive:**

```typescript
import { computed, Directive, input } from '@angular/core';
import type { FieldTree, SubmittedStatus } from '@angular/forms/signals';
import { NGX_SIGNAL_FORM_CONTEXT } from './tokens';

@Directive({
  selector: 'form[ngxSignalForm], form(submit)',
  exportAs: 'ngxSignalForm',
  providers: [
    {
      provide: NGX_SIGNAL_FORM_CONTEXT,
      useExisting: ngxSignalFormDirective,
    },
  ],
})
export class ngxSignalFormDirective {
  form = input<FieldTree<unknown> | undefined>(undefined, {
    alias: 'ngxSignalForm',
  });
  errorStrategy = input<ErrorDisplayStrategy | undefined>(undefined);

  // Derived submission status from submitting() transitions (uses effect internally)
  readonly submittedStatus = signal<SubmittedStatus>('unsubmitted');
}
```

**Usage:**

```html
<form
  [ngxSignalForm]="userForm"
  [errorStrategy]="errorMode()"
  (submit)="save($event)"
>
  <!-- Child directives automatically access form context via DI -->
  <input id="email" [formField]="userForm.email" />
  <ngx-signal-form-error [formField]="userForm.email" />
</form>
```

### 2. Error Display Component

#### `NgxSignalFormError`

**Component:**

```typescript
@Component({
  selector: 'ngx-signal-form-error',
  template: `
    @if (showErrors()) {
      @for (error of structuredErrors(); track error.kind) {
        <p class="ngx-signal-form-error" role="alert" [id]="errorId()">
          {{ error.message }}
        </p>
      }
    }
  `,
})
export class NgxSignalFormErrorComponent {
  field = input.required<FieldState<any>>();
  errorId = input<string>();

  protected readonly showErrors = computed(() => {
    const f = this.field();
    return f.invalid() && f.touched();
  });

  protected readonly structuredErrors = computed(() => {
    return this.field().errors() || [];
  });
}
```

**Usage:**

```html
<input id="email" [value]="emailField().value()" />
<ngx-signal-form-error [formField]="emailField()" />
```

### 3. Form Field Wrapper

#### `NgxSignalFormFieldComponent`

Reusable wrapper with automatic error display and consistent layout.

**Usage:**

```html
<ngx-signal-form-field [formField]="userForm.email" fieldName="email">
  <label for="email">Email</label>
  <input id="email" [formField]="userForm.email" />
</ngx-signal-form-field>
```

### 4. Error Display Strategies

#### Strategy Types

```typescript
export type ErrorDisplayStrategy =
  | 'immediate' // Show errors as they occur
  | 'on-touch' // Show after blur or submit (WCAG recommended)
  | 'on-submit' // Show only after submit
  | 'manual'; // Developer controls display
```

#### Implementation

```typescript
/**
 * Computes whether to show errors based on the error display strategy.
 *
 * Note: Signal Forms doesn't provide a submittedStatus signal. The toolkit derives
 * it from `submitting()` and `touched()` signals using effect()-based transition tracking
 * in `ngxSignalFormDirective`.
 */
export function computeShowErrors(
  field: Signal<FieldState<any>>,
  strategy: ErrorDisplayStrategy | Signal<ErrorDisplayStrategy>,
  submittedStatus: Signal<SubmittedStatus>,
): Signal<boolean> {
  return computed(() => {
    const f = field();
    const hasErrors = f.invalid();
    const touched = f.touched();
    const status = submittedStatus();
    const submitted = status === 'submitted' || status === 'submitting';

    const currentStrategy =
      typeof strategy === 'function' ? strategy() : strategy;

    switch (currentStrategy) {
      case 'immediate':
        return hasErrors;

      case 'on-touch':
        return (touched || submitted) && hasErrors;

      case 'on-submit':
        return submitted && hasErrors;

      case 'manual':
        return false;

      default:
        return (touched || submitted) && hasErrors;
    }
  });
}
```

### 5. Configuration

#### Global Config

```typescript
export interface NgxSignalFormsConfig {
  autoAria?: boolean; // Enable auto-ARIA (default: true)
  defaultErrorStrategy?: ErrorDisplayStrategy; // Default strategy
  fieldNameResolver?: (element: HTMLElement) => string | null;
  strictFieldResolution?: boolean; // Throw on unresolved fields
  debug?: boolean; // Enable debug logging
  defaultFormFieldAppearance?: 'default' | 'outline';
}

export function provideNgxSignalFormsConfig(config: NgxSignalFormsConfig) {
  return {
    provide: NGX_SIGNAL_FORMS_CONFIG,
    useValue: config,
  };
}
```

#### Usage

```typescript
// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideNgxSignalFormsConfig({
      autoAria: true,
      defaultErrorStrategy: 'on-touch',
      defaultFormFieldAppearance: 'outline',
      debug: !environment.production,
    }),
  ],
};
```

---

## Implementation Guide

### Phase 1: Core Directives (Week 1-2)

**Priority 1: Auto-ARIA Directive**

1. Create directive selector matching `[value]` bindings
2. Implement field name extraction (4-tier priority)
3. Inject Signal Forms field state via DI
4. Compute `aria-invalid` from `field.invalid()`
5. Compute `aria-describedby` with error ID appending
6. Add manual override detection via `HostAttributeToken`
7. Write component tests with Testing Library

**Priority 2: Form Provider Directive**

1. Create `[ngxSignalForm]` directive
2. Provide form instance via `NGX_SIGNAL_FORM` token
3. Implement `getForm()` method for lazy access
4. Test DI resolution in nested components

### Phase 2: Error Display (Week 3)

**Priority 1: Error Strategies**

1. Define `ErrorDisplayStrategy` type
2. Implement `computeShowErrors()` utility
3. Add strategy descriptions for documentation
4. Create custom strategy factory

**Priority 2: Error Component**

1. Create `NgxSignalFormErrorComponent`
2. Accept `field` input
3. Compute `showErrors` from strategy
4. Render structured errors with `@for`
5. Add role="alert" for accessibility
6. Style with CSS custom properties

### Phase 3: Form Field Wrapper (Week 4)

**Priority 1: Wrapper Component**

1. Create `NgxSignalFormFieldComponent`
2. Add content projection for label + input
3. Auto-render `NgxSignalFormErrorComponent`
4. Add CSS custom properties for theming
5. Test with various input types

### Phase 4: Testing & Documentation (Week 5)

**Priority 1: Test Coverage**

1. Component tests (Vitest + Testing Library)
2. E2E tests (Playwright)
3. Accessibility tests (axe-core)
4. Visual regression tests

**Priority 2: Documentation**

1. API documentation (TypeDoc)
2. Usage examples for each feature
3. Migration guide from ngx-vest-forms
4. Comparison with Signal Forms alone
5. Best practices guide

---

## Usage Examples

### Level 1: Basic Form (Signal Forms + Auto-ARIA)

```typescript
import { Component, signal } from '@angular/core';
import { form, schema, required, email, Control } from '@angular/forms/signals';
import { NgxSignalFormAutoAriaDirective } from '@ngx-signal-forms/toolkit/core';

interface ContactModel {
  email: string;
  message: string;
}

const contactSchema = schema<ContactModel>((path) => {
  required(path.email, { message: 'Email is required' });
  email(path.email, { message: 'Invalid email format' });
  required(path.message, { message: 'Message is required' });
});

@Component({
  selector: 'ngx-contact',
  imports: [NgxSignalFormAutoAriaDirective, Control],
  template: `
    <form (submit)="save($event)" novalidate>
      <!-- Auto aria-invalid + aria-describedby -->
      <label for="email">Email</label>
      <input id="email" type="email" [formField]="contactForm.email" />
      <span id="email-error" role="alert">
        @if (contactForm.email().invalid()) {
          {{ contactForm.email().errors() | json }}
        }
      </span>

      <button type="submit">Submit</button>
    </form>
  `,
})
export class ContactFormComponent {
  protected readonly model = signal<ContactModel>({ email: '', message: '' });
  protected readonly contactForm = form(this.model, contactSchema);

  protected save(event: Event): void {
    event.preventDefault();
    if (this.contactForm().valid()) {
      console.log('Valid:', this.model());
    }
  }
}
```

### Level 2: Add Error Component

```typescript
import { Component, signal } from '@angular/core';
import { form, schema, required, email, Control } from '@angular/forms/signals';
import {
  NgxSignalFormAutoAriaDirective,
  NgxSignalFormErrorComponent,
} from '@ngx-signal-forms/toolkit/core';

@Component({
  selector: 'ngx-contact',
  imports: [
    NgxSignalFormAutoAriaDirective,
    NgxSignalFormErrorComponent,
    FormField,
  ],
  template: `
    <form (submit)="save($event)" novalidate>
      <label for="email">Email</label>
      <input id="email" type="email" [formField]="contactForm.email" />
      <ngx-signal-form-error
        [formField]="contactForm.email"
        fieldName="email"
      />

      <button type="submit">Submit</button>
    </form>
  `,
})
export class ContactFormComponent {
  protected readonly model = signal<ContactModel>({ email: '', message: '' });
  protected readonly contactForm = form(this.model, contactSchema);

  protected save(event: Event): void {
    event.preventDefault();
    if (this.contactForm().valid()) {
      console.log('Valid:', this.model());
    }
  }
}
```

### Level 3: Add Form Field Wrapper

```typescript
import { Component, signal } from '@angular/core';
import { form, schema, required, email, Control } from '@angular/forms/signals';
import { NgxSignalFormFieldComponent } from '@ngx-signal-forms/toolkit/form-field';
import { NgxSignalFormAutoAriaDirective } from '@ngx-signal-forms/toolkit/core';

@Component({
  selector: 'ngx-contact',
  imports: [
    NgxSignalFormFieldComponent,
    NgxSignalFormAutoAriaDirective,
    FormField,
  ],
  template: `
    <form (submit)="save($event)" novalidate>
      <ngx-signal-form-field [formField]="contactForm.email">
        <label for="email">Email</label>
        <input id="email" type="email" [formField]="contactForm.email" />
      </ngx-signal-form-field>

      <ngx-signal-form-field [formField]="contactForm.message">
        <label for="message">Message</label>
        <textarea id="message" [formField]="contactForm.message"></textarea>
      </ngx-signal-form-field>

      <button type="submit">Submit</button>
    </form>
  `,
})
export class ContactFormComponent {
  protected readonly model = signal<ContactModel>({ email: '', message: '' });
  protected readonly contactForm = form(this.model, contactSchema);

  protected save(event: Event): void {
    event.preventDefault();
    if (this.contactForm().valid()) {
      console.log('Valid:', this.model());
    }
  }
}
```

### Level 4: Full Stack (All Features)

```typescript
import { Component, signal } from '@angular/core';
import {
  form,
  schema,
  required,
  email,
  minLength,
  FormField,
  submit,
} from '@angular/forms/signals';
import { NgxSignalFormFieldComponent } from '@ngx-signal-forms/toolkit/form-field';
import {
  NgxSignalFormToolkit, // Bundle: all directives + components
  type ErrorDisplayStrategy,
} from '@ngx-signal-forms/toolkit/core';

interface ContactModel {
  email: string;
  message: string;
}

const contactSchema = schema<ContactModel>((path) => {
  required(path.email);
  email(path.email);
  required(path.message);
  minLength(path.message, 10);
});

@Component({
  selector: 'ngx-contact',
  imports: [NgxSignalFormToolkit, NgxSignalFormFieldComponent, Control],
  template: `
    <!-- Error Strategy Selector (for demo) -->
    <fieldset>
      <legend>Error Display Mode</legend>
      <label>
        <input
          type="radio"
          name="errorMode"
          value="immediate"
          [checked]="errorMode() === 'immediate'"
          (change)="errorMode.set('immediate')"
        />
        Immediate
      </label>
      <label>
        <input
          type="radio"
          name="errorMode"
          value="on-touch"
          [checked]="errorMode() === 'on-touch'"
          (change)="errorMode.set('on-touch')"
        />
        On Touch (Default)
      </label>
    </fieldset>

    <!-- Form with enhanced provider (tracks submission + manages error strategy) -->
    <form
      [ngxSignalForm]="contactForm"
      [errorStrategy]="errorMode()"
      (submit)="save($event)"
    >
      <ngx-signal-form-field [formField]="contactForm.email">
        <label for="email">Email *</label>
        <input id="email" type="email" [formField]="contactForm.email" />
      </ngx-signal-form-field>

      <ngx-signal-form-field [formField]="contactForm.message">
        <label for="message">Message *</label>
        <textarea
          id="message"
          rows="4"
          [formField]="contactForm.message"
        ></textarea>
      </ngx-signal-form-field>

      <!-- Submission feedback -->
      @if (contactForm().submitError()) {
        <div class="error" role="alert">
          Failed to submit: {{ contactForm().submitError()!.message }}
        </div>
      }
      @if (contactForm().submitSuccess()) {
        <div class="success" role="status">✅ Message sent successfully!</div>
      }

      <button type="submit" [disabled]="contactForm().submitting()">
        @if (contactForm().submitting()) {
          Sending...
        } @else {
          Submit
        }
      </button>
    </form>
  `,
})
export class ContactFormComponent {
  // Error display strategy (dynamic)
  protected readonly errorMode = signal<ErrorDisplayStrategy>('on-touch');

  // Form setup (errorStrategy managed via provider, not form() options)
  protected readonly model = signal<ContactModel>({ email: '', message: '' });
  protected readonly contactForm = form(this.model, contactSchema);

  protected save(): void {
    // Use Signal Forms' save() helper for automatic state management
    submit(this.contactForm, async (formState) => {
      if (!formState.valid()) {
        throw new Error('Form has validation errors');
      }

      // Simulate async submission
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Reset form on successful submission
      this.model.set({ email: '', message: '' });

      console.log('Message sent successfully!');
    });
  }
}
```

---

## Advanced Validation Patterns

### Using validateTree() for Targeted Error Placement

> **Key Insight**: Use `validateTree()` when you need to assign validation errors to specific fields in complex scenarios like duplicate detection.

#### Duplicate Detection in Arrays

```typescript
import { validateTree, customError } from '@angular/forms/signals';

type Location = {
  city: string;
  country: string;
};

type LocationList = {
  locations: Location[];
};

const locationForm = form(signal<LocationList>(...), (path) => {
  // Basic field validation
  applyEach(path.locations, (location) => {
    required(location.city);
    required(location.country);
  });

  // Duplicate detection with targeted errors
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
          if (city === other.city.valueOf() &&
              country === other.country.valueOf()) {
            errors.push({
              kind: 'duplicate_location',
              field: ctx.field.locations[index].city, // 🎯 Target specific field!
              message: `Duplicate location: ${city}, ${country}`
            });
          }
        }
      });
    });

    return errors.length > 0 ? errors : null;
  });
});
```

**Template:**

```html
@for (location of locationForm.locations; track $index) {
<div>
  <input [formField]="locationForm.locations[$index].city" />

  <!-- Error appears on the specific duplicate field -->
  @if (locationForm.locations[$index].city().errors().length > 0) { @for (error
  of locationForm.locations[$index].city().errors(); track error.kind) {
  <p class="text-red-500">{{ error.message }}</p>
  } }
</div>
}
```

### Cross-Field Validation Strategies

> **Important Distinction**: Signal Forms supports both **root-level** errors (form-wide) and **field-level** errors (specific fields). Understanding when to use each improves error messaging and UX.

| Error Type      | Validation Target       | Error Location                | Use Case                   |
| --------------- | ----------------------- | ----------------------------- | -------------------------- |
| **Field-Level** | `validate(path.field,`) | Stored on the field itself    | Single field validation    |
| **Root-Level**  | `validate(path,`        | Stored on the form tree root  | Cross-field business rules |
| **Cross-Field** | `validate(path.field,`) | Field error using `valueOf()` | Dependent field validation |

**When to Use Root-Level Errors:**

- Form-wide business rules that don't belong to a single field
- Multi-field relationships (e.g., "start date must be before end date")
- Complex validations where no single field is "wrong"

**When to Use Field-Level (Cross-Field) Errors:**

- One field depends on another (e.g., "confirm password must match password")
- The error clearly belongs to one specific field
- You want the error to appear next to a specific input

#### Strategy 1: Dependent Field Validation (Field-Level)

```typescript
// Password confirmation
validateTree(path, (ctx) => {
  const password = ctx.value().password;
  const confirm = ctx.value().confirmPassword;

  if (password && confirm && password !== confirm) {
    return {
      confirmPassword: [
        customError({
          kind: 'password_mismatch',
          message: 'Passwords must match',
        }),
      ],
    };
  }

  return {};
});
```

#### Strategy 2: Date Range Validation

```typescript
// Start date must be before end date
validate(path.endDate, ({ value, valueOf }) => {
  const startDate = valueOf(path.startDate);
  const endDate = value();

  if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
    return customError({
      kind: 'invalid_range',
      message: 'End date must be after start date',
    });
  }

  return null;
});
```

#### Strategy 3: Conditional Required Fields

```typescript
// Sale price required when on sale
validate(path.salePrice, ({ value, valueOf }) => {
  const isOnSale = valueOf(path.onSale);
  const salePrice = value();

  if (isOnSale && !salePrice) {
    return customError({
      kind: 'sale_price_required',
      message: 'Sale price is required when item is on sale',
    });
  }

  return null;
});
```

#### Strategy 4: Root-Level Validation (Form-Wide Business Rules)

Use root-level validation when the error doesn't belong to a specific field:

```typescript
// Example: Total items in cart validation
validate(path, ({ value }) => {
  const form = value();
  const totalItems = form.items.reduce((sum, item) => sum + item.quantity, 0);

  if (totalItems > 100) {
    return customError({
      kind: 'cart_limit_exceeded',
      message: 'Maximum 100 items allowed in cart. Please reduce quantities.',
    });
  }

  return null;
});

// Example: Date range validation (no single field is wrong)
validate(path, ({ value }) => {
  const form = value();

  if (form.startDate && form.endDate && form.startDate > form.endDate) {
    return customError({
      kind: 'invalid_date_range',
      message: 'Start date must be before end date',
    });
  }

  return null;
});
```

**Accessing Root-Level Errors:**

Root-level errors are stored on the form tree itself:

```typescript
// Get root-level errors
const rootErrors = computed(() => myForm().errors());

// Get all field-level errors (requires recursive collection)
const fieldErrors = computed(() => {
  const errors: ValidationError[] = [];
  // ... recursive collection logic
  return errors;
});
```

### Hybrid Validation: Zod + Signal Forms + Async

> **Real-World Pattern**: Layer different validation types for comprehensive coverage.

```typescript
import { z } from 'zod';
import {
  form,
  validateStandardSchema,
  validateAsync,
  validateTree,
} from '@angular/forms/signals';

// Layer 1: Zod for data structure
const ProductSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(2),
  price: z.number().min(0),
});

// Layer 2: Create form with all validation layers
const productForm = form(productModel, (path) => {
  // Data structure validation
  validateStandardSchema(path, ProductSchema);

  // Async server validation
  validateAsync(path.sku, {
    params: (ctx) => ({ sku: ctx.value() }),
    factory: (params) =>
      rxResource({
        params,
        stream: (p) => this.http.get(`/api/products/check-sku/${p.params.sku}`),
      }),
    errors: (result) => {
      return result.exists
        ? customError({ kind: 'sku_taken', message: 'SKU already exists' })
        : null;
    },
  });

  // Business logic validation
  validate(path.price, ({ value, valueOf }) => {
    const price = value();
    const cost = valueOf(path.cost);

    if (cost && price < cost) {
      return customError({
        kind: 'price_below_cost',
        message: 'Price cannot be below cost',
      });
    }

    return null;
  });
});
```

### Form Submission: Two Approaches

#### Approach 1: Manual Validation (More Control)

```typescript
protected save(): void {
  // Manual validation check
  if (!this.contactForm().valid()) {
    this.markAllAsTouched();
    return;
  }

  // Handle submission
  this.isSubmitting.set(true);

  try {
    await this.api.save(this.model());
    this.router.navigate(['/success']);
  } catch (error) {
    this.handleServerError(error);
  } finally {
    this.isSubmitting.set(false);
  }
}

private markAllAsTouched() {
  this.contactForm.email().markAsTouched();
  this.contactForm.message().markAsTouched();
}
```

#### Approach 2: save() Helper (Cleaner)

```typescript
import { submit } from '@angular/forms/signals';

protected readonly saveHandler = submit(this.contactForm, async (formState) => {
  // Validation happens automatically
  if (!formState.valid()) {
    throw new Error('Form has validation errors');
  }

  // submitting() signal is automatically true
  await this.api.save(formState.value());

  // Reset on success
  this.model.set({ email: '', message: '' });
  this.router.navigate(['/success']);
});

// In template
<form (submit)="save($event)" novalidate>
  <!-- fields -->

  <!-- Built-in submission state -->
  @if (contactForm().submitting()) {
    <span>Saving...</span>
  }

  @if (contactForm().submitError()) {
    <span>Error: {{ contactForm().submitError().message }}</span>
  }

  @if (contactForm().submitSuccess()) {
    <span>Saved successfully!</span>
  }
</form>
```

**When to Use Each:**

| Approach   | Use When                                       |
| ---------- | ---------------------------------------------- |
| **Manual** | Need fine-grained control over submission flow |
| **Manual** | Custom loading states or error handling        |
| **Manual** | Multi-step submission process                  |
| **save()** | Standard form submission                       |
| **save()** | Want built-in submission signals               |
| **save()** | Cleaner, less boilerplate                      |

---

## Migration from ngx-vest-forms

### Key Differences

| Aspect                | ngx-vest-forms           | Signal Forms Enhancement        |
| --------------------- | ------------------------ | ------------------------------- |
| **Validation Engine** | Vest.js (portable)       | Signal Forms (Angular-specific) |
| **Form Creation**     | `createVestForm()`       | `form()` from Signal Forms      |
| **Schema Definition** | `staticSafeSuite()`      | `schema()` from Signal Forms    |
| **Field Access**      | `form.email()`           | `contactForm.email()`           |
| **Validation State**  | `form.emailValidation()` | `emailField().errors()`         |
| **Touch State**       | `form.emailTouched()`    | `emailField().touched()`        |
| **Submit**            | `await form.save()`      | Check `contactForm().valid()`   |

### Migration Steps

#### Step 1: Replace Validation Suite

**Before (ngx-vest-forms):**

```typescript
import { staticSafeSuite } from 'ngx-vest-forms/core';
import { test, enforce } from 'vest';

const contactSuite = staticSafeSuite<ContactModel>((data) => {
  test('email', 'Email is required', () => {
    enforce(data.email).isNotEmpty();
  });
  test('email', 'Invalid email format', () => {
    enforce(data.email).isEmail();
  });
});
```

**After (Signal Forms):**

```typescript
import { schema, required, email } from '@angular/forms/signals';

const contactSchema = schema<ContactModel>((path) => {
  required(path.email, { message: 'Email is required' });
  email(path.email, { message: 'Invalid email format' });
});
```

#### Step 2: Replace Form Creation

**Before:**

```typescript
import { createVestForm } from 'ngx-vest-forms/core';

protected readonly form = createVestForm(
  signal({ email: '', message: '' }),
  contactSuite
);
```

**After:**

```typescript
import { form } from '@angular/forms/signals';

protected readonly model = signal({ email: '', message: '' });
protected readonly contactForm = form(this.model, contactSchema);
```

#### Step 3: Update Template Bindings

**Before:**

```html
<input id="email" [value]="form.email()" (input)="form.setEmail($event)" />
<ngx-form-error [formField]="form.emailField()" />
```

**After:**

```html
<input id="email" [formField]="contactForm.email" />
<ngx-signal-form-error [formField]="contactForm.email" />
```

#### Step 4: Update Submit Logic

**Before:**

```typescript
protected async save() {
  const result = await this.form.save();
  if (result.valid) {
    await this.api.save(result.data);
  }
}
```

**After:**

```typescript
protected async save(): void {
  if (this.contactForm().valid()) {
    await this.api.save(this.model());
  }
}
```

### Side-by-Side Comparison

```typescript
// ===== ngx-vest-forms =====
import { Component, signal } from '@angular/core';
import { createVestForm, staticSafeSuite } from 'ngx-vest-forms/core';
import { NgxVestFormField } from 'ngx-vest-forms/form-field';
import { test, enforce } from 'vest';

const contactSuite = staticSafeSuite<ContactModel>((data) => {
  test('email', 'Required', () => enforce(data.email).isNotEmpty());
  test('email', 'Invalid', () => enforce(data.email).isEmail());
});

@Component({
  selector: 'ngx-contact',
  imports: [NgxVestFormField],
  template: `
    <form (submit)="save($event)" novalidate>
      <ngx-vest-form-field [formField]="form.emailField()">
        <label for="email">Email</label>
        <input
          id="email"
          [value]="form.email()"
          (input)="form.setEmail($event)"
        />
      </ngx-vest-form-field>
      <button type="submit">Submit</button>
    </form>
  `,
})
export class ContactComponent {
  form = createVestForm(signal({ email: '' }), contactSuite);

  async save(event: Event): Promise<void> {
    event.preventDefault();
    const result = await this.form.save();
    if (result.valid) console.log(result.data);
  }
}

// ===== Signal Forms + Enhancement Library =====
import { Component, signal } from '@angular/core';
import { form, schema, required, email, Control } from '@angular/forms/signals';
import { NgxSignalFormFieldComponent } from '@ngx-signal-forms/toolkit/form-field';

const contactSchema = schema<ContactModel>((path) => {
  required(path.email);
  email(path.email);
});

@Component({
  selector: 'ngx-contact',
  imports: [NgxSignalFormFieldComponent, Control],
  template: `
    <form (submit)="save($event)" novalidate>
      <ngx-signal-form-field [formField]="contactForm.email">
        <label for="email">Email</label>
        <input id="email" [formField]="contactForm.email" />
      </ngx-signal-form-field>
      <button type="submit">Submit</button>
    </form>
  `,
})
export class ContactComponent {
  model = signal({ email: '' });
  contactForm = form(this.model, contactSchema);

  save(event: Event): void {
    event.preventDefault();
    if (this.contactForm().valid()) console.log(this.model());
  }
}
```

---

## Testing Strategy

### Component Tests (Vitest + Testing Library)

```typescript
import { render, screen } from '@testing-library/angular';
import { userEvent } from 'vitest/browser';
import { describe, it, expect } from 'vitest';
import { ContactFormComponent } from './contact-form.component';

describe('ContactFormComponent', () => {
  it('should show errors on blur (on-touch strategy)', async () => {
    await render(ContactFormComponent);

    const emailInput = screen.getByLabelText(/email/i);

    // Focus and blur without entering value
    await userEvent.click(emailInput);
    await userEvent.tab();

    // Error should appear after blur
    expect(screen.getByRole('alert')).toHaveTextContent('Email is required');
  });

  it('should apply aria-invalid when field has errors', async () => {
    await render(ContactFormComponent);

    const emailInput = screen.getByLabelText(/email/i);

    await userEvent.click(emailInput);
    await userEvent.tab();

    expect(emailInput).toHaveAttribute('aria-invalid', 'true');
  });

  it('should link errors via aria-describedby', async () => {
    await render(ContactFormComponent);

    const emailInput = screen.getByLabelText(/email/i);

    await userEvent.click(emailInput);
    await userEvent.tab();

    const errorId = emailInput.getAttribute('aria-describedby');
    expect(errorId).toBeTruthy();

    const errorElement = document.getElementById(errorId!);
    expect(errorElement).toHaveTextContent('Email is required');
  });
});
```

### E2E Tests (Playwright)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Contact Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contact');
  });

  test('should validate email on blur', async ({ page }) => {
    await test.step('Focus and blur email input', async () => {
      const emailInput = page.getByLabel(/email/i);
      await emailInput.click();
      await emailInput.press('Tab');
    });

    await test.step('Verify error appears', async () => {
      await expect(page.getByRole('alert')).toContainText('Email is required');
    });
  });

  test('should validate accessibility tree', async ({ page }) => {
    await test.step('Trigger validation', async () => {
      const emailInput = page.getByLabel(/email/i);
      await emailInput.click();
      await emailInput.press('Tab');
    });

    await test.step('Verify ARIA structure', async () => {
      await expect(page.getByRole('form')).toMatchAriaSnapshot(`
        - form:
          - group:
            - textbox "Email" [invalid]:
              - aria-describedby: email-error
            - alert: "Email is required"
      `);
    });
  });
});
```

### Accessibility Tests (axe-core)

```typescript
import { render } from '@testing-library/angular';
import { injectAxe, checkA11y } from 'axe-playwright';
import { test } from '@playwright/test';
import { ContactFormComponent } from './contact-form.component';

test('should have no accessibility violations', async ({ page }) => {
  await page.goto('/contact');
  await injectAxe(page);

  // Check initial state
  await checkA11y(page);

  // Trigger validation
  const emailInput = page.getByLabel(/email/i);
  await emailInput.click();
  await emailInput.press('Tab');

  // Check error state
  await checkA11y(page);
});
```

---

## Roadmap

> **All features are non-intrusive utilities, directives, components, or providers that enhance Signal Forms without modifying its core API.**

### v1.0.0 (MVP - Q2 2025)

**Core Directives & Components:**

- ✅ Auto-ARIA directive (`[formField]` selector with host bindings)
- ✅ Touch tracking via Signal Forms `[formField]` (native)
- ✅ Form provider directive (DI context + derived submission status)
- ✅ Error display component (reusable error renderer)
- ✅ Form field wrapper component (layout + auto-error display)

**Utilities & Configuration:**

- ✅ Error display strategies (utility functions)
- ✅ `computeShowErrors()` utility function
- ✅ Global configuration provider
- ✅ Documentation (API docs + usage examples)

### v1.1.0 (Enhanced UX - Q3 2025)

**Components & Pipes:**

- 🎯 **Structured error transformer pipe** - Transform error objects for i18n compatibility
- 🎯 **Error animation directive** - Automatic enter/leave animations for error messages
- 🎯 **Custom error template component** - Configurable error rendering with slots
- 🎯 **Warning message component** - Non-blocking validation feedback (separate from errors)

**Utilities:**

- 🎯 **Debounced error display utility** - Show errors after N milliseconds of inactivity
- 🎯 **Error message registry service** - Centralized error message management for i18n

### v1.2.0 (Developer Tools - Q4 2025)

**Dev-Mode Components:**

- 🎯 **DevTools panel component** - Visual debugging panel (dev-mode only)
- 🎯 **Debug overlay directive** - Show field state on hover (dev-mode only)
- 🎯 **Validation visualizer component** - Real-time validation flow diagram
- 🎯 **Performance monitor service** - Track validation timing and re-renders

**Utilities:**

- 🎯 **Validation logger utility** - Detailed console logging for debugging
- 🎯 **Form state snapshot utility** - Capture/restore form state for testing

### v2.0.0 (Advanced Features - 2026)

**Advanced Directives & Components:**

- 🎯 **Form array helper directive** - Simplified form array manipulation (add/remove/reorder)
- 🎯 **Dynamic field component** - Render fields from configuration objects
- 🎯 **Field dependency directive** - Automatic field enable/disable based on conditions

**Advanced Utilities:**

- 🎯 **Schema composition helpers** - Utility functions for schema merging and reuse
- 🎯 **Cross-field validation helper** - Simplified dependent field validation
- 🎯 **Async validation queue service** - Smart debouncing and cancellation for async validators
- 🎯 **Form serialization utility** - Convert form state to/from various formats (JSON, FormData, etc.)

**Type Utilities:**

- 🎯 **Type helpers** - Advanced TypeScript utilities for schema inference
- 🎯 **Validator factories** - Reusable validator creator functions

---

## Library Naming Analysis

### Recommended Package Name: `ngx-signal-forms-toolkit`

**Rationale:**

1. **Clear Purpose**: "toolkit" implies a collection of utilities that work with Signal Forms
2. **Non-Intrusive**: Suggests enhancement rather than replacement
3. **Comprehensive**: Covers all aspects (accessibility, UX, DX, testing)
4. **Searchable**: Easy to find and understand the relationship to Signal Forms
5. **Consistent**: Follows Angular community conventions (`ngx-` prefix)

### Alternative Options

| Package Name                   | Pros                                      | Cons                                              |
| ------------------------------ | ----------------------------------------- | ------------------------------------------------- |
| `ngx-signal-forms-toolkit` ⭐  | Comprehensive, clear, searchable          | Slightly generic                                  |
| `ngx-signal-forms-ux`          | Clear UX focus, concise                   | Doesn't capture accessibility/testing aspects     |
| `ngx-signal-forms-a11y`        | Strong accessibility focus, unique        | Too narrow, doesn't convey DX utilities           |
| `ngx-signal-forms-plus`        | Simple, suggests enhancement              | Too generic, lacks clarity on what's "plus"       |
| `ngx-signal-forms-enhanced`    | Clear enhancement message                 | Grammatically awkward                             |
| `ngx-signal-forms-extras`      | Clear that it's additional features       | Suggests less important/optional                  |
| `ngx-signal-forms-boost`       | Dynamic, suggests improvement             | Unclear what's being boosted                      |
| `@ngx-signal-forms/toolkit`    | Scoped package, suggests official support | Requires namespace ownership                      |
| `@ngx-signal-forms/ux`         | Scoped + UX focus                         | Requires namespace, narrow focus                  |
| `ngx-sf-toolkit`               | Concise abbreviation                      | Less discoverable, unclear abbreviation           |
| `ngx-signal-forms-dx`          | Developer Experience focus                | Doesn't convey user-facing (a11y) improvements    |
| `ngx-signal-forms-helpers`     | Clear helper utilities                    | Suggests small utilities, not comprehensive       |
| `ngx-signal-forms-companion`   | Suggests it works alongside Signal Forms  | Less searchable, unusual naming pattern           |
| `ngx-signal-forms-kit`         | Short, clear                              | Very similar to "toolkit" but less descriptive    |
| `ngx-signal-forms-ally`        | Clever a11y wordplay                      | Too cute, unclear for non-native English speakers |
| `ngx-signal-forms-utils`       | Standard utility naming                   | Too generic, suggests simple helpers only         |
| `ngx-signal-forms-suite`       | Comprehensive collection                  | Conflicts with "test suite" terminology           |
| `ngx-signal-forms-pro`         | Professional/advanced features            | Suggests paid version                             |
| `ngx-signal-forms-complete`    | Conveys completeness                      | Too absolute, suggests Signal Forms is incomplete |
| `ngx-signal-forms-accessible`  | Clear accessibility focus                 | Too long, narrow focus                            |
| `ngx-signal-forms-wcag`        | Technical accuracy for accessibility      | Too technical, excludes UX/DX features            |
| `ngx-signal-forms-addons`      | Clear additional features                 | British vs American spelling confusion            |
| `ngx-signal-forms-essentials`  | Suggests necessary features               | Implies Signal Forms is incomplete without it     |
| `ngx-signal-forms-full`        | Complete solution                         | Misleading, Signal Forms is already "full"        |
| `ngx-signal-forms-dx-a11y`     | Covers DX and accessibility               | Too technical, hyphenated acronyms                |
| `ngx-signal-forms-ready`       | Production-ready enhancements             | Unclear what "ready" means                        |
| `ngx-signal-forms-power`       | Power user features                       | Vague, doesn't convey specific value              |
| `ngx-signal-forms-studio`      | Professional tooling                      | Suggests IDE/editor integration                   |
| `ngx-signal-forms-lab`         | Experimental features                     | Suggests instability                              |
| `angular-signal-forms-toolkit` | Official Angular naming                   | Longer, not following ngx- community convention   |

### Final Recommendation

**Primary Choice**: `@ngx-signal-forms/toolkit` with secondary entry points.

**Package Structure:**

- `@ngx-signal-forms/toolkit` - Providers and shared types
- `@ngx-signal-forms/toolkit/core` - Core directives, utilities, components
- `@ngx-signal-forms/toolkit/form-field` - Optional form-field wrapper

**Why This Structure:**

1. **Simplified DX**: Most users only install one package
2. **Tree-shakable**: Secondary entry points are only included when imported
3. **Easy Opt-out**: Don't want form-field wrapper? Don't import it

### Repository Structure (Current)

```text
ngx-signal-forms/                    # Repository root
├── apps/
│   └── demo/                        # Demo application
├── docs/                            # Markdown documentation
├── packages/
│   └── toolkit/                     # @ngx-signal-forms/toolkit
│       ├── core/                    # Core entry
│       ├── form-field/              # Optional form-field entry
│       ├── index.ts                 # Primary entry (providers/types)
│       └── README.md
├── pnpm-workspace.yaml
├── nx.json
├── package.json
└── tsconfig.base.json
```

#### Alternative: Single Package (Not Recommended)

```text
ngx-signal-forms-toolkit/
  ├── core/            # Core directives + utilities
  ├── form-field/      # Optional form field wrapper
  └── index.ts         # Barrel exports
```

This approach is simpler but limits future growth and secondary entry points.

---

## Conclusion

**@ngx-signal-forms/toolkit** brings production-ready features to Angular Signal Forms through non-intrusive directives, components, and utilities:

- ✅ **Zero API changes** - Pure enhancement via directives and providers
- ✅ **80% less boilerplate** - Automatic ARIA + strategy-based error display
- ✅ **WCAG 2.2 compliant** - Accessibility by default
- ✅ **Progressive enhancement** - Start simple, add features as needed
- ✅ **Type-safe** - Full TypeScript inference from Signal Forms
- ✅ **Non-intrusive** - Enhances Signal Forms, doesn't replace it

### Architecture Philosophy

| Aspect                | Approach                                                  |
| --------------------- | --------------------------------------------------------- |
| **Form API**          | Uses Signal Forms API unchanged                           |
| **Validation**        | Uses Signal Forms validators                              |
| **Enhancements**      | Directives (auto-ARIA, provider)                          |
| **Utilities**         | Pure functions (computeShowErrors, error strategies)      |
| **State Management**  | Providers (form context, submission tracking)             |
| **Components**        | Optional (error display, form field wrapper)              |
| **Configuration**     | Global provider (opt-in customization)                    |
| **Testing**           | Use standard Angular/Vitest/Playwright tooling            |
| **Type Safety**       | Full inference from Signal Forms schemas                  |
| **Bundle Size**       | Tree-shakable (use only what you need)                    |
| **Dependencies**      | `@angular/forms/signals` only (peer dependency)           |
| **Framework Version** | Angular 21+ (matches Signal Forms availability)           |
| **Production Ready**  | When Signal Forms becomes stable (currently experimental) |

### Comparison with Related Libraries

| Library                       | Focus                      | Validation Engine            | Enhancement Approach    |
| ----------------------------- | -------------------------- | ---------------------------- | ----------------------- |
| **@ngx-signal-forms/toolkit** | UX + Accessibility + DX    | Signal Forms (Angular API)   | Non-intrusive utilities |
| **ngx-vest-forms**            | Portable validation        | Vest.js (framework-agnostic) | Custom form abstraction |
| **Angular Forms (Reactive)**  | Traditional reactive forms | Built-in validators          | Core Angular API        |
| **Angular Forms (Template)**  | Template-driven forms      | Built-in validators          | Core Angular API        |

### When to Use Each

| Library/Approach           | Use When                                        |
| -------------------------- | ----------------------------------------------- |
| **Signal Forms alone**     | Learning Signal Forms API, minimal requirements |
| **Signal Forms + toolkit** | Production apps needing WCAG compliance + DX    |
| **ngx-vest-forms**         | Need portable validation across frameworks      |
| **Reactive Forms**         | Existing apps, stable API requirement           |
| **Template-driven Forms**  | Simple forms, rapid prototyping                 |

### Key Difference from ngx-vest-forms

- **ngx-vest-forms** = Validation-first library with custom form abstraction (Vest.js portable validation)
- **ngx-signal-forms-toolkit** = Enhancement-first library for Angular's native Signal Forms API

Both approaches are valid - choose based on your needs:

- Need portable validation across React/Vue/Angular? → **ngx-vest-forms**
- Want Angular-native forms with automatic accessibility? → **Signal Forms + toolkit**
- Need both? You can potentially combine them (validate with Vest, enhance with toolkit)

### Getting Started

```bash
# Install Signal Forms (Angular 21+)
npm install @angular/forms

# Install the toolkit (main package - includes core directives and utilities)
npm install @ngx-signal-forms/toolkit
```

**Import Examples:**

```typescript
// Providers and shared types (primary entry)
import { provideNgxSignalFormsConfig } from '@ngx-signal-forms/toolkit';

// Core directives/components (secondary entry)
import {
  NgxSignalFormAutoAriaDirective,
  NgxSignalFormDirective,
  NgxSignalFormErrorComponent,
} from '@ngx-signal-forms/toolkit/core';

// Form field wrapper (optional)
import { NgxSignalFormFieldComponent } from '@ngx-signal-forms/toolkit/form-field';
```

### Minimal Setup

```typescript
// app.config.ts
import { provideNgxSignalFormsConfig } from '@ngx-signal-forms/toolkit';

export const appConfig: ApplicationConfig = {
  providers: [
    provideNgxSignalFormsConfig({
      autoAria: true,
      defaultErrorStrategy: 'on-touch',
    }),
  ],
};
```

### Progressive Adoption Path

1. **Level 0**: Use Signal Forms alone (learn the API)
2. **Level 1**: Add auto-ARIA directive (automatic accessibility)
3. **Level 2**: Add error component (reusable error display)
4. **Level 3**: Add form field wrapper (consistent layout)
5. **Level 4**: Add form provider (error strategies + derived submission status)

Each level is optional and can be adopted independently based on your needs!
