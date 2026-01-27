# CSS Framework Integration

> How to integrate `@ngx-signal-forms/toolkit` with Bootstrap, Tailwind CSS, and Angular Material

Angular Signal Forms use JavaScript-based validation, which means they **don't** set native HTML5 validation state (`:invalid` pseudo-class). CSS frameworks need explicit classes or attributes to style invalid fields.

The toolkit solves this with **status class synchronization** — aligning CSS classes with your error display strategy.

---

## The Problem

By default, Angular Signal Forms applies status classes (`ng-invalid`, `ng-valid`) **immediately** when validation fails:

```
❌ Default Behavior (Poor UX):
┌─────────────────────────────┐
│ Email [red border]          │  ← Field turns red immediately
└─────────────────────────────┘
                                 ← No error message yet (shows on blur)

User thinks: "Why is this red? What did I do wrong?"
```

The toolkit synchronizes CSS classes with error message display:

```
✅ With Toolkit (Good UX):
┌─────────────────────────────┐
│ Email [normal border]       │  ← No visual change while typing
└─────────────────────────────┘

[User blurs or submits]

┌─────────────────────────────┐
│ Email [red border]          │  ← Red border + error appear together
└─────────────────────────────┘
⚠️ Please enter a valid email   ← Error explains the issue
```

---

## Bootstrap 5.3

Bootstrap uses `.is-invalid` and `.is-valid` classes for form validation styling.

### Setup

```typescript
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideSignalFormsConfig } from '@angular/forms/signals';
import {
  ngxStatusClasses,
  provideNgxSignalFormsConfig,
} from '@ngx-signal-forms/toolkit';

export const appConfig: ApplicationConfig = {
  providers: [
    // Sync status classes with error display strategy
    provideSignalFormsConfig({
      classes: ngxStatusClasses({
        strategy: 'on-touch', // Match toolkit's default
        invalidClass: 'is-invalid',
        validClass: 'is-valid',
      }),
    }),

    // Optional: configure toolkit defaults
    provideNgxSignalFormsConfig({
      defaultErrorStrategy: 'on-touch',
    }),
  ],
};
```

### Template

```html
<form (submit)="save($event)">
  <div class="mb-3">
    <label for="email" class="form-label">Email</label>
    <input
      id="email"
      type="email"
      class="form-control"
      [formField]="userForm.email"
    />
    <!-- Bootstrap's invalid-feedback auto-shows when sibling has .is-invalid -->
    <div class="invalid-feedback">
      @for (error of userForm.email().errors() | keyvalue; track error.key) { {{
      error.value }} }
    </div>
  </div>

  <button type="submit" class="btn btn-primary">Submit</button>
</form>
```

### Using the Toolkit's Error Component

For better accessibility, use the toolkit's error component instead of Bootstrap's `.invalid-feedback`:

```html
<form (submit)="save($event)">
  <div class="mb-3">
    <label for="email" class="form-label">Email</label>
    <input
      id="email"
      type="email"
      class="form-control"
      [formField]="userForm.email"
    />
    <!-- Toolkit handles ARIA, visibility, and strategy -->
    <ngx-signal-form-error [formField]="userForm.email" fieldName="email" />
  </div>
</form>
```

Style the toolkit's error component to match Bootstrap:

```scss
ngx-signal-form-error {
  display: block;
  width: 100%;
  margin-top: 0.25rem;
  font-size: 0.875em;
  color: var(--bs-form-invalid-color, #dc3545);
}
```

### Floating Labels

Bootstrap's floating labels work with the toolkit:

```html
<div class="form-floating mb-3">
  <input
    id="email"
    type="email"
    class="form-control"
    placeholder="name@example.com"
    [formField]="userForm.email"
  />
  <label for="email">Email address</label>
  <ngx-signal-form-error [formField]="userForm.email" fieldName="email" />
</div>
```

---

## Tailwind CSS 4

Tailwind uses utility classes and supports the `invalid:` and `user-invalid:` variants.

### Option A: Native Tailwind Variants (No Config Needed)

Tailwind 4's `user-invalid:` variant matches the toolkit's `'on-touch'` strategy — it only applies after user interaction:

```html
<form (submit)="save($event)" class="space-y-4">
  <div>
    <label for="email" class="block text-sm font-medium text-gray-700">
      Email
    </label>
    <input
      id="email"
      type="email"
      class="mt-1 block w-full rounded-md border-gray-300 shadow-sm user-invalid:border-red-500 user-invalid:text-red-600 focus:border-indigo-500 focus:ring-indigo-500 user-invalid:focus:border-red-500 user-invalid:focus:ring-red-500"
      [formField]="userForm.email"
    />
    <ngx-signal-form-error
      [formField]="userForm.email"
      fieldName="email"
      class="mt-1 text-sm text-red-600"
    />
  </div>

  <button
    type="submit"
    class="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
  >
    Submit
  </button>
</form>
```

**Key variants:**

- `invalid:` — Styles when field is invalid (immediate)
- `user-invalid:` — Styles when invalid AND user has interacted (matches `'on-touch'`)
- `focus:invalid:` — Styles when focused and invalid

### Option B: Custom Status Classes

If you prefer explicit classes for more control:

```typescript
// app.config.ts
provideSignalFormsConfig({
  classes: ngxStatusClasses({
    strategy: 'on-touch',
    invalidClass: 'field-invalid',
    validClass: 'field-valid',
    touchedClass: 'field-touched',
    dirtyClass: 'field-dirty',
  }),
}),
```

```css
/* styles.css - Add Tailwind @apply or use in component */
.field-invalid {
  @apply border-red-500 text-red-600 focus:border-red-500 focus:ring-red-500;
}

.field-valid {
  @apply border-green-500 focus:border-green-500 focus:ring-green-500;
}
```

### Peer-Based Error Messages

Use Tailwind's `peer` utilities for conditional error visibility:

```html
<div class="relative">
  <input
    id="email"
    type="email"
    class="peer w-full rounded-md border-gray-300 ..."
    [formField]="userForm.email"
  />
  <p class="invisible mt-1 text-sm text-red-600 peer-[.field-invalid]:visible">
    Please enter a valid email address.
  </p>
</div>
```

---

## Angular Material

Angular Material uses `mat-form-field` with its own error handling via `ErrorStateMatcher`.

### Important: Don't Mix Systems

Angular Material has its own form infrastructure. When using `mat-form-field`:

1. **Use Angular Material's error handling** — Don't add toolkit's ARIA or error components
2. **Use toolkit's status classes** — For consistent timing with non-Material fields

### Setup

```typescript
// app.config.ts
import { provideSignalFormsConfig } from '@angular/forms/signals';
import { ngxStatusClasses } from '@ngx-signal-forms/toolkit';

export const appConfig: ApplicationConfig = {
  providers: [
    provideSignalFormsConfig({
      classes: ngxStatusClasses({
        strategy: 'on-touch',
        // Material uses these internally
        invalidClass: 'ng-invalid',
        validClass: 'ng-valid',
        touchedClass: 'ng-touched',
        dirtyClass: 'ng-dirty',
      }),
    }),
  ],
};
```

### Custom ErrorStateMatcher

To align Material's error display with the toolkit's strategy:

```typescript
// shared/error-state-matcher.ts
import { Injectable } from '@angular/core';
import { ErrorStateMatcher } from '@angular/material/core';
import { FormControl, FormGroupDirective, NgForm } from '@angular/forms';

/**
 * ErrorStateMatcher that aligns with toolkit's 'on-touch' strategy.
 * Shows errors when field is invalid AND (touched OR form submitted).
 */
@Injectable()
export class OnTouchErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(
    control: FormControl | null,
    form: FormGroupDirective | NgForm | null,
  ): boolean {
    const isSubmitted = form?.submitted ?? false;
    const isTouched = control?.touched ?? false;
    const isInvalid = control?.invalid ?? false;

    return isInvalid && (isTouched || isSubmitted);
  }
}
```

Provide globally:

```typescript
// app.config.ts
import { ErrorStateMatcher } from '@angular/material/core';
import { OnTouchErrorStateMatcher } from './shared/error-state-matcher';

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: ErrorStateMatcher, useClass: OnTouchErrorStateMatcher },
    // ... other providers
  ],
};
```

### Template

```html
<form (submit)="save($event)">
  <mat-form-field appearance="outline">
    <mat-label>Email</mat-label>
    <input matInput type="email" [formField]="userForm.email" />
    <mat-error>
      @if (userForm.email().errors()?.['required']) { Email is required } @else
      if (userForm.email().errors()?.['email']) { Please enter a valid email }
    </mat-error>
  </mat-form-field>

  <button mat-raised-button color="primary" type="submit">Submit</button>
</form>
```

### Signal Forms + Material (Hybrid Approach)

For fields outside `mat-form-field`, use the toolkit normally:

```html
<!-- Material field - use mat-error -->
<mat-form-field>
  <mat-label>Email</mat-label>
  <input matInput [formField]="userForm.email" />
  <mat-error>Invalid email</mat-error>
</mat-form-field>

<!-- Non-Material field - use toolkit -->
<div>
  <label for="notes">Notes</label>
  <textarea id="notes" [formField]="userForm.notes"></textarea>
  <ngx-signal-form-error [formField]="userForm.notes" fieldName="notes" />
</div>
```

---

## ARIA Accessibility

The toolkit automatically manages ARIA attributes regardless of CSS framework:

| Attribute          | Behavior                                                        |
| ------------------ | --------------------------------------------------------------- |
| `aria-invalid`     | Set to `"true"` when field is invalid AND errors should display |
| `aria-describedby` | Links to error message element IDs                              |

This ensures screen readers announce errors at the appropriate time.

### Disabling Auto-ARIA

For Angular Material (which handles its own ARIA):

```html
<input matInput [formField]="userForm.email" ngxSignalFormAutoAriaDisabled />
```

Or globally:

```typescript
provideNgxSignalFormsConfig({
  autoAria: false, // Disable for all fields
}),
```

---

## Quick Reference

| Framework        | Invalid Class            | Valid Class       | Notes                              |
| ---------------- | ------------------------ | ----------------- | ---------------------------------- |
| Bootstrap 5.3    | `is-invalid`             | `is-valid`        | Use with `.form-control`           |
| Tailwind CSS 4   | `user-invalid:*` variant | `valid:*` variant | Built-in, no config needed         |
| Angular Material | `ng-invalid`             | `ng-valid`        | Use `ErrorStateMatcher` for timing |
| Default Angular  | `ng-invalid`             | `ng-valid`        | Works out of the box               |

---

## Related Documentation

- [Toolkit README → Status Classes](../packages/toolkit/README.md#automatic-status-classes)
- [Form Field Theming](../packages/toolkit/form-field/THEMING.md)
- [ARIA Integration](./ANGULAR_ARIA_INTEGRATION.md)
