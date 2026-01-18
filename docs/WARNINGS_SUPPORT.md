# Warnings Support in @ngx-signal-forms/toolkit

## Overview

**Signal Forms Limitation**: Angular Signal Forms does NOT have native support for "warnings" (non-blocking validation messages). It only supports "errors" which block form submission.

**Toolkit Solution**: The `@ngx-signal-forms/toolkit` provides warnings support through a **convention-based approach** using the error `kind` field.

## Convention-Based Approach

### How It Works

The toolkit treats validation messages differently based on their `kind` field:

| Message Type        | Convention                           | Blocks Submission | ARIA Role | ARIA Live   |
| ------------------- | ------------------------------------ | ----------------- | --------- | ----------- |
| **Error** (default) | `kind` does NOT start with `'warn:'` | ✅ Yes            | `alert`   | `assertive` |
| **Warning**         | `kind` starts with `'warn:'`         | ❌ No             | `status`  | `polite`    |

### Benefits

- ✅ **No API changes** - Uses standard Signal Forms validation
- ✅ **WCAG 2.2 compliant** - Proper ARIA roles and live regions
- ✅ **Semantic separation** - Clear distinction between blocking/non-blocking
- ✅ **Screen reader friendly** - Assertive errors, polite warnings

## Usage Examples

### Basic Error (Blocks Submission)

```typescript
import { form, required, email } from '@angular/forms/signals';

const userForm = form(signal({ email: '' }), (path) => {
  // Standard validators create errors
  required(path.email, { message: 'Email is required' });
  email(path.email, { message: 'Please enter a valid email' });
});
```

**Result**:

- `kind: 'required'` and `kind: 'email'`
- Treated as **errors** (block submission)
- Displayed with `role="alert"` and `aria-live="assertive"`

### Warning (Does Not Block Submission)

#### Recommended: Using `warningError()` Helper

```typescript
import { form, required, minLength, validate } from '@angular/forms/signals';
import { warningError } from '@ngx-signal-forms/toolkit/core';

const passwordForm = form(signal({ password: '' }), (path) => {
  // Errors (block submission)
  required(path.password, { message: 'Password is required' });
  minLength(path.password, 8, { message: 'Minimum 8 characters required' });

  // Warning using helper (recommended)
  validate(path.password, (ctx) => {
    const value = ctx.value();
    if (value && value.length < 12) {
      return warningError(
        'short-password',
        'For better security, consider using 12+ characters',
      );
    }
    return null;
  });
});
```

#### Alternative: Using `customError()` Directly

```typescript
import {
  form,
  required,
  minLength,
  validate,
  customError,
} from '@angular/forms/signals';

const passwordForm = form(signal({ password: '' }), (path) => {
  // Errors (block submission)
  required(path.password, { message: 'Password is required' });
  minLength(path.password, 8, { message: 'Minimum 8 characters required' });

  // Warning using customError directly
  validate(path.password, (ctx) => {
    const value = ctx.value();
    if (value && value.length < 12) {
      return customError({
        kind: 'warn:short-password',
        message: 'For better security, consider using 12+ characters',
      });
    }
    return null;
  });
});
```

**Result** (both approaches):

- `kind: 'warn:short-password'` is treated as a **warning**
- Does NOT block form submission
- Displayed with `role="status"` and `aria-live="polite"`

### Complex Validation with Multiple Warnings

```typescript
import { form, required, email, validate } from '@angular/forms/signals';
import { warningError } from '@ngx-signal-forms/toolkit/core';

const registrationForm = form(
  signal({
    email: '',
    password: '',
    confirmPassword: '',
  }),
  (path) => {
    // Email validation
    required(path.email, { message: 'Email required' });
    email(path.email, { message: 'Invalid email format' });

    // Email domain warning
    validate(path.email, (ctx) => {
      const value = ctx.value();
      const disposableDomains = ['tempmail.com', '10minutemail.com'];
      const domain = value.split('@')[1];

      if (domain && disposableDomains.includes(domain)) {
        return warningError(
          'disposable-email',
          'Disposable email addresses may not receive important notifications',
        );
      }
      return null;
    });

    // Password validation
    required(path.password, { message: 'Password required' });
    minLength(path.password, 8, { message: 'Min 8 characters' });

    // Password strength warning
    validate(path.password, (ctx) => {
      const value = ctx.value();
      const hasNumber = /\d/.test(value);
      const hasSpecial = /[!@#$%^&*]/.test(value);

      if (value && (!hasNumber || !hasSpecial)) {
        return warningError(
          'weak-password',
          'For stronger security, include numbers and special characters',
        );
      }
      return null;
    });

    // Confirm password error
    validate(path.confirmPassword, (ctx) => {
      if (ctx.value() !== ctx.valueOf(path.password)) {
        return customError({
          kind: 'password-mismatch',
          message: 'Passwords must match',
        });
      }
      return null;
    });
  },
);
```

## Template Integration

### Using NgxSignalFormErrorComponent

The component automatically separates errors and warnings:

```html
<form (submit)="save($event)" novalidate>
  <label for="email">Email *</label>
  <input
    id="email"
    [formField]="form.email"
    [attr.aria-invalid]="form.email().invalid()"
    [attr.aria-describedby]="
      form.email().invalid()
        ? 'email-error email-warning'
        : null
    "
  />

  <!-- Displays both errors and warnings -->
  <ngx-signal-form-error
    [formField]="form.email"
    fieldName="email"
    [hasSubmitted]="hasSubmitted"
  />
</form>
```

**Rendered Output** (with warning):

```html
<!-- Error container (if errors exist) -->
<div
  id="email-error"
  class="ngx-signal-form-error ngx-signal-form-error--error"
  role="alert"
  aria-live="assertive"
  aria-atomic="true"
>
  <p
    class="ngx-signal-form-error__message ngx-signal-form-error__message--error"
  >
    Invalid email format
  </p>
</div>

<!-- Warning container (if warnings exist) -->
<div
  id="email-warning"
  class="ngx-signal-form-error ngx-signal-form-error--warning"
  role="status"
  aria-live="polite"
  aria-atomic="true"
>
  <p
    class="ngx-signal-form-error__message ngx-signal-form-error__message--warning"
  >
    Disposable email addresses may not receive important notifications
  </p>
</div>
```

### Using SftFormFieldComponent

The form field wrapper automatically handles both:

```html
<sft-form-field [formField]="form.password" fieldName="password">
  <label for="password">Password *</label>
  <input id="password" type="password" [formField]="form.password" />
  <!-- Errors and warnings displayed automatically -->
</sft-form-field>
```

## Styling

### CSS Custom Properties

```css
:root {
  /* Error styles (red) */
  --ngx-signal-form-error-color: #dc2626;
  --ngx-signal-form-error-bg: transparent;
  --ngx-signal-form-error-border: transparent;

  /* Warning styles (amber) */
  --ngx-signal-form-warning-color: #f59e0b;
  --ngx-signal-form-warning-bg: transparent;
  --ngx-signal-form-warning-border: transparent;

  /* Spacing */
  --ngx-signal-form-error-margin-top: 0.375rem;
  --ngx-signal-form-error-message-spacing: 0.25rem;

  /* Typography */
  --ngx-signal-form-error-font-size: 0.875rem;
  --ngx-signal-form-error-line-height: 1.25;

  /* Border & padding (optional) */
  --ngx-signal-form-error-border-width: 0px;
  --ngx-signal-form-error-border-radius: 0px;
  --ngx-signal-form-error-padding: 0px;
}
```

### Dark Mode Support

```css
@media (prefers-color-scheme: dark) {
  :root {
    --ngx-signal-form-error-color: #fca5a5;
    --ngx-signal-form-warning-color: #fcd34d;
  }
}
```

### Custom Styling Example

```css
/* Add backgrounds and borders */
:root {
  --ngx-signal-form-error-bg: #fef2f2;
  --ngx-signal-form-error-border: #fca5a5;
  --ngx-signal-form-warning-bg: #fffbeb;
  --ngx-signal-form-warning-border: #fcd34d;
  --ngx-signal-form-error-border-width: 1px;
  --ngx-signal-form-error-border-radius: 0.375rem;
  --ngx-signal-form-error-padding: 0.5rem;
}

/* Dark mode with backgrounds */
@media (prefers-color-scheme: dark) {
  :root {
    --ngx-signal-form-error-color: #fca5a5;
    --ngx-signal-form-error-bg: #7f1d1d;
    --ngx-signal-form-error-border: #991b1b;
    --ngx-signal-form-warning-color: #fcd34d;
    --ngx-signal-form-warning-bg: #78350f;
    --ngx-signal-form-warning-border: #92400e;
  }
}
```

## Accessibility Details

### WCAG 2.2 Compliance

| Aspect              | Errors                               | Warnings                       |
| ------------------- | ------------------------------------ | ------------------------------ |
| **ARIA Role**       | `role="alert"`                       | `role="status"`                |
| **ARIA Live**       | `aria-live="assertive"`              | `aria-live="polite"`           |
| **ARIA Atomic**     | `aria-atomic="true"`                 | `aria-atomic="true"`           |
| **Announcement**    | Immediate (interrupts screen reader) | Polite (waits for pause)       |
| **Visual Severity** | High (red color, required action)    | Medium (amber color, advisory) |
| **Form Submission** | Blocks submission                    | Does NOT block submission      |

### ARIA Techniques

- ✅ **[ARIA19](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA19)**: Using ARIA `role=alert` for errors
- ✅ **[ARIA22](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA22)**: Using `role=status` for warnings
- ✅ **ARIA `aria-describedby`**: Linking inputs to error/warning containers
- ✅ **ARIA `aria-invalid`**: Marking invalid fields (only for errors, not warnings)

## Warning Naming Conventions

### Recommended Patterns

```typescript
// Password strength
'warn:weak-password';
'warn:common-password';
'warn:short-password';

// Email issues
'warn:disposable-email';
'warn:typo-detected';
'warn:common-provider';

// Security
'warn:password-reuse';
'warn:insecure-connection';

// Data quality
'warn:incomplete-profile';
'warn:old-data';
'warn:suspicious-pattern';
```

### Best Practices

1. **Always use `'warn:'` prefix** for non-blocking messages
2. **Use kebab-case** for warning kinds (e.g., `'warn:weak-password'`)
3. **Be descriptive** - warning kind should indicate the issue
4. **Provide actionable messages** - tell users what to do

## Form Submission Behavior

### Errors (Blocking)

```typescript
const onSubmit = async () => {
  if (form().invalid()) {
    // Errors present - cannot submit
    console.log('Fix errors before submitting');
    return;
  }

  // No errors - submit
  await api.save(form().value());
};
```

### Warnings (Non-Blocking)

```typescript
const onSubmit = async () => {
  if (form().invalid()) {
    // Only check for actual errors, NOT warnings
    console.log('Fix errors before submitting');
    return;
  }

  // Warnings present but form is still valid
  // User can submit with warnings
  await api.save(form().value());
};
```

### Checking for Warnings

Since warnings are technically "errors" in Signal Forms, you need to check the `kind` field:

```typescript
const hasWarnings = computed(() => {
  return form
    .email()
    .errors()
    .some((err) => err.kind.startsWith('warn:'));
});

const hasBlockingErrors = computed(() => {
  return form
    .email()
    .errors()
    .some((err) => !err.kind.startsWith('warn:'));
});
```

## Comparison with Vest.js

| Feature             | Vest.js (ngx-vest-forms)       | Signal Forms Toolkit                       |
| ------------------- | ------------------------------ | ------------------------------------------ |
| **Native Warnings** | ✅ Yes                         | ❌ No (convention-based)                   |
| **API**             | `warn()` function              | `warningError()` helper or `customError()` |
| **Separate Arrays** | ✅ `errors[]` and `warnings[]` | ❌ Single `errors[]` array                 |
| **Type Safety**     | ✅ TypeScript discriminated    | ⚠️ Convention-based filtering              |
| **Form Validity**   | Warnings don't affect validity | Warnings are filtered out                  |
| **WCAG Compliance** | ✅ Same approach               | ✅ Same approach                           |
| **Developer UX**    | Built-in `warn()` function     | `warningError()` helper function           |

## Limitations

1. **Not Type-Safe**: TypeScript cannot enforce the `'warn:'` prefix convention
2. **Manual Filtering**: You must filter warnings from errors yourself
3. **Form Validity**: Signal Forms treats warnings as errors for `invalid()` state
4. **Custom Logic Required**: Need to manually check for non-warning errors before submission

## Future Considerations

If Signal Forms adds native warning support in the future, the toolkit will:

1. Maintain backward compatibility with the `'warn:'` convention
2. Add support for native warning APIs
3. Provide migration utilities to convert convention-based warnings to native warnings

## References

- [WCAG 2.2 ARIA19 Technique](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA19) - Using `role=alert`
- [WCAG 2.2 ARIA22 Technique](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA22) - Using `role=status`
- [Angular Signal Forms Docs](https://angular.dev/api/forms/signals)
- [Angular ARIA UI Patterns](https://angular.dev/api/aria/ui-patterns)
