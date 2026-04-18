# Warnings Support in @ngx-signal-forms/toolkit

## Overview

**Signal Forms Limitation**: Angular Signal Forms does NOT have native support for "warnings" (non-blocking validation messages). It only supports "errors" which block form submission.

**Toolkit Solution**: The `@ngx-signal-forms/toolkit` provides warnings support through a **convention-based approach** using the error `kind` field.

## Convention-Based Approach

### How It Works

The toolkit treats validation messages differently based on their `kind` field:

| Message Type        | Convention                           | Blocks Submission | ARIA Role | Implicit ARIA live mode |
| ------------------- | ------------------------------------ | ----------------- | --------- | ----------------------- |
| **Error** (default) | `kind` does NOT start with `'warn:'` | ✅ Yes            | `alert`   | assertive               |
| **Warning**         | `kind` starts with `'warn:'`         | ❌ No             | `status`  | polite                  |

> The toolkit relies on the **implicit live-region semantics** of `role="alert"`
> and `role="status"`. It does **not** add explicit `aria-live` / `aria-atomic`
> attributes — some AT + browser combinations (notably NVDA + Firefox) duplicate
> announcements when both the role and the explicit attribute are present.

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
- Rendered with `role="alert"` (implicit assertive live region)

### Warning (Does Not Block Submission)

#### Recommended: Using `warningError()` Helper

```typescript
import { form, required, minLength, validate } from '@angular/forms/signals';
import { warningError } from '@ngx-signal-forms/toolkit/assistive';

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

#### Alternative: returning a plain validation error literal

`warningError()` is the recommended helper, but it's just a thin wrapper around
the `ValidationError` shape. You can return the literal yourself when you want
to keep all validators in one import block:

```typescript
import { form, required, minLength, validate } from '@angular/forms/signals';

const passwordForm = form(signal({ password: '' }), (path) => {
  // Errors (block submission)
  required(path.password, { message: 'Password is required' });
  minLength(path.password, 8, { message: 'Minimum 8 characters required' });

  // Warning using a plain ValidationError literal
  validate(path.password, (ctx) => {
    const value = ctx.value();
    if (value && value.length < 12) {
      return {
        kind: 'warn:short-password',
        message: 'For better security, consider using 12+ characters',
      };
    }
    return null;
  });
});
```

> `@angular/forms/signals` does **not** export a `customError()` factory —
> validators return plain object literals matching the `ValidationError` shape,
> or typed helpers like `requiredError()`, `emailError()`, etc. The toolkit's
> `warningError()` is just `{ kind: \`warn:${kind}\`, message }`.

**Result** (both approaches):

- `kind: 'warn:short-password'` is treated as a **warning**
- Does NOT block form submission
- Rendered with `role="status"` (implicit polite live region)

### Complex Validation with Multiple Warnings

```typescript
import { form, required, email, validate } from '@angular/forms/signals';
import { warningError } from '@ngx-signal-forms/toolkit/assistive';

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

    // Confirm password error (cross-field: read sibling via ctx.valueOf)
    validate(path.confirmPassword, (ctx) => {
      if (ctx.value() !== ctx.valueOf(path.password)) {
        return {
          kind: 'password-mismatch',
          message: 'Passwords must match',
        };
      }
      return null;
    });
  },
);
```

## Template Integration

### Using NgxFormFieldError

The component automatically separates errors and warnings:

```html
<form [formRoot]="form">
  <label for="email">Email *</label>
  <input id="email" [formField]="form.email" />

  <!-- Displays both errors and warnings -->
  <ngx-form-field-error [formField]="form.email" fieldName="email" />
</form>
```

**Rendered Output** (with warning):

```html
<!-- Error container (if errors exist) -->
<div
  id="email-error"
  class="ngx-form-field-error ngx-form-field-error--error"
  role="alert"
>
  <p class="ngx-form-field-error__message ngx-form-field-error__message--error">
    Invalid email format
  </p>
</div>

<!-- Warning container (if warnings exist) -->
<div
  id="email-warning"
  class="ngx-form-field-error ngx-form-field-error--warning"
  role="status"
>
  <p
    class="ngx-form-field-error__message ngx-form-field-error__message--warning"
  >
    Disposable email addresses may not receive important notifications
  </p>
</div>
```

### Using NgxFormField

The form field wrapper automatically handles both:

```html
<ngx-form-field-wrapper [formField]="form.password">
  <label for="password">Password *</label>
  <input id="password" type="password" [formField]="form.password" />
  <!-- Errors and warnings displayed automatically -->
</ngx-form-field-wrapper>
```

## When warnings appear — `warningStrategy`

Warnings are advisory, not blocking. Hiding them behind the same gate as errors
(`'on-touch'` or `'on-submit'`) defeats their purpose: a user only benefits from
guidance like _"consider 12+ characters"_ or _"disposable email may not receive
notifications"_ **while** they are typing, not after they've already moved past
the field.

To reflect that, `NgxFormFieldError` (and the wrapper / assistive bundle
that projects it) exposes a dedicated `warningStrategy` input. It decouples
warning visibility from error visibility while keeping both rendered by the same
component.

### Input reference

| Input             | Type                   | Default       | Purpose                                                      |
| ----------------- | ---------------------- | ------------- | ------------------------------------------------------------ |
| `strategy`        | `ErrorDisplayStrategy` | _(inherited)_ | When **errors** may become visible                           |
| `warningStrategy` | `ErrorDisplayStrategy` | `'immediate'` | When **warnings** may become visible (independent of errors) |

Accepted values for `ErrorDisplayStrategy` (both inputs):

| Value         | Semantics                                                                                                      |
| ------------- | -------------------------------------------------------------------------------------------------------------- |
| `'immediate'` | Show as soon as the validator reports them, regardless of touched / submitted state                            |
| `'on-touch'`  | Show only after the field (or form) is touched                                                                 |
| `'on-submit'` | Show only after a submit has been attempted (requires `ngxSignalForm` so `submittedStatus` is tracked)         |
| `'inherit'`   | Defer to the form-level strategy resolved from `NGX_SIGNAL_FORM_CONTEXT`; falls back to `'on-touch'` otherwise |

### Why the default is `'immediate'`

Defaulting `warningStrategy` to `'immediate'` keeps advisory messaging visible
from the first keystroke. The alternative — inheriting the error strategy —
would effectively suppress warnings on forms configured with `'on-touch'` or
`'on-submit'` error timing, which is the majority of real-world forms. Users
would only see guidance after they have already committed a password or picked
a disposable email provider.

If you explicitly want warnings gated with errors (e.g. to keep the field UI
quiet until first submit), set `warningStrategy="inherit"` or match the error
strategy explicitly.

### Example: errors on submit, warnings immediately

```html
<form [formRoot]="passwordForm" ngxSignalForm errorStrategy="on-submit">
  <ngx-form-field-wrapper [formField]="passwordForm.password">
    <label for="password">Password</label>
    <input id="password" type="password" [formField]="passwordForm.password" />
    <!--
      The projected <ngx-form-field-error> inherits errorStrategy='on-submit'
      from the form, but warnings stay on the default 'immediate' timing, so
      "Consider 12+ characters" shows while the user is still typing.
    -->
  </ngx-form-field-wrapper>
</form>
```

### Example: override when standalone

When projecting `NgxFormFieldError` directly (without the wrapper),
pass the inputs explicitly:

```html
<ngx-form-field-error
  [formField]="passwordForm.password"
  fieldName="password"
  strategy="on-submit"
  warningStrategy="immediate"
/>
```

`'immediate'` is already the default, so you only need to spell it out when you
want to **override** an inherited form-level strategy that would otherwise
apply. To gate warnings alongside errors, use `warningStrategy="inherit"` (or
match `strategy` explicitly).

## Styling

### CSS Custom Properties

```css
:root {
  /* Error styles (red) */
  --ngx-signal-form-error-color: #dc2626;
  --ngx-signal-form-error-bg: transparent;
  --ngx-signal-form-error-border: transparent;

  /* Warning styles (amber) */
  --ngx-signal-form-warning-color: #a16207;
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

| Aspect               | Errors                               | Warnings                          |
| -------------------- | ------------------------------------ | --------------------------------- |
| **ARIA Role**        | `role="alert"`                       | `role="status"`                   |
| **Live-region mode** | Implicit assertive (from role)       | Implicit polite (from role)       |
| **Announcement**     | Immediate (interrupts screen reader) | Polite (waits for pause)          |
| **Visual Severity**  | High (red color, required action)    | Medium (amber color, advisory)    |
| **Form Submission**  | Blocks submission                    | Does NOT block submission         |
| **Default timing**   | `errorStrategy` (`'on-touch'`)       | `warningStrategy` (`'immediate'`) |

> The toolkit intentionally does not stamp `aria-live`/`aria-atomic` on error
> or warning containers. The ARIA 1.2 specification defines these as implicit
> on `role="alert"` and `role="status"`, and stamping them explicitly causes
> double-announcements on NVDA + Firefox.

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

Since warnings are technically "errors" in Signal Forms, use `splitByKind()`
when you need both groups, and keep `isWarningError()` / `isBlockingError()`
for single-item checks:

```typescript
import {
  splitByKind,
  isBlockingError,
  isWarningError,
} from '@ngx-signal-forms/toolkit';

const partitioned = computed(() => splitByKind(form.email().errors()));

const hasWarnings = computed(() => partitioned().warnings.length > 0);

const hasBlockingErrors = computed(() => partitioned().blocking.length > 0);

// Still useful for checking a single ValidationError item
const firstErrorIsWarning = computed(() => {
  const first = form.email().errors()[0];
  return first ? isWarningError(first) : false;
});
```

`splitByKind()` is exported from `@ngx-signal-forms/toolkit` so component,
headless, and custom submit flows can all share the same partitioning logic.

## Historical Comparison (Vest-based libraries)

> This section is migration context only. `@ngx-signal-forms/toolkit` does not depend on `ngx-vest-forms` at runtime.

| Feature             | Vest.js (ngx-vest-forms)       | Signal Forms Toolkit                     |
| ------------------- | ------------------------------ | ---------------------------------------- |
| **Native Warnings** | ✅ Yes                         | ❌ No (convention-based)                 |
| **API**             | `warn()` function              | `warningError()` helper or plain literal |
| **Separate Arrays** | ✅ `errors[]` and `warnings[]` | ❌ Single `errors[]` array               |
| **Type Safety**     | ✅ TypeScript discriminated    | ⚠️ Convention-based filtering            |
| **Form Validity**   | Warnings don't affect validity | Warnings are filtered out                |
| **WCAG Compliance** | ✅ Same approach               | ✅ Same approach                         |
| **Developer UX**    | Built-in `warn()` function     | `warningError()` helper function         |

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

---

## Advanced: error flow and message resolution

Read this section when you need to understand _how_ errors and warnings flow
through the toolkit — e.g. when writing custom headless consumers, custom
submit flows, or when errors don't appear where you expect.

### How errors flow

```text
signal({ email: '', name: '' })
  │
  ▼
form(signal, schema)
  │
  ├─ email ──► errors(): ValidationError[]        (direct errors only)
  │            errorSummary(): WithFieldTree[]     (includes nested)
  │
  └─ name  ──► errors(): ValidationError[]
               errorSummary(): WithFieldTree[]
  │
  ▼
form tree root
  └─► errorSummary(): WithFieldTree[]              (ALL errors, all fields)
```

Angular Signal Forms validators produce `ValidationError` objects with a `kind`
and optional `message`. When using `errorSummary()`, errors are enriched with a
`fieldTree` reference and an optional `formField` directive pointer for focus
handling.

### `errors()` vs `errorSummary()`

| Method           | Scope                            | Includes nested | Used by                 |
| ---------------- | -------------------------------- | --------------- | ----------------------- |
| `errors()`       | Direct field errors only         | No              | Headless error-state    |
| `errorSummary()` | All errors including descendants | Yes             | Fieldset, error summary |

The toolkit's `readErrors()` utility prefers `errorSummary()` when available and
falls back to `errors()`, so headless consumers can point at either a
`FieldTree` or a `FieldState`:

```typescript
// packages/toolkit/headless/src/lib/utilities.ts
export function readErrors(state: unknown): ValidationError[] {
  if (typeof state !== 'object' || state === null) return [];

  const candidate = state as {
    errorSummary?: () => ValidationError[];
    errors?: () => ValidationError[];
  };

  if (typeof candidate.errorSummary === 'function') {
    return candidate.errorSummary();
  }

  if (typeof candidate.errors === 'function') {
    return candidate.errors();
  }

  return [];
}
```

### Message resolution — 3-tier priority

The toolkit resolves the visible error message through a 3-tier priority system:

```text
1. Validator message    → error.message (set in schema definition)
2. Registry message     → NGX_ERROR_MESSAGES provider (app-wide defaults)
3. Fallback             → "Invalid" (last resort)
```

**Validator-level messages** live next to the validation rule:

```typescript
const myForm = form(signal({ email: '' }), (path) => {
  required(path.email, { message: 'Email is required' });
  email(path.email, { message: 'Must be a valid email address' });
});
```

**Registry-level messages** provide app-wide defaults so you don't repeat yourself.
Keys are camelCase error kinds; the payload for parameterized kinds destructures
the validator's own fields:

```typescript
import { provideErrorMessages } from '@ngx-signal-forms/toolkit';

provideErrorMessages({
  required: 'This field is required',
  email: 'Please enter a valid email',
  minLength: ({ minLength }) => `At least ${minLength} characters required`,
  maxLength: ({ maxLength }) => `At most ${maxLength} characters allowed`,
});
```

### Field label resolution

Error summaries display a human-readable label next to each message. By default,
`humanizeFieldPath` strips the Angular prefix, splits camelCase, and joins
segments with `/`:

```text
ng.form0.address.postalCode → Address / Postal code
contactEmail                → Contact email
```

Override globally via `provideFieldLabels()`:

```typescript
import { provideFieldLabels } from '@ngx-signal-forms/toolkit';

provideFieldLabels({
  contactEmail: 'E-mailadres',
  'address.postalCode': 'Postcode',
});
```

For dynamic i18n or a fully custom resolver, pass a factory:

```typescript
provideFieldLabels(() => {
  const translate = inject(TranslateService);
  return (path) =>
    translate.instant(`fields.${path}`) || humanizeFieldPath(path);
});
```

Import `humanizeFieldPath` from `@ngx-signal-forms/toolkit/headless` to compose
it as a fallback inside custom resolvers.

---

## References

- [WCAG 2.2 ARIA19 Technique](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA19) - Using `role=alert`
- [WCAG 2.2 ARIA22 Technique](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA22) - Using `role=status`
- [Angular Signal Forms Docs](https://angular.dev/api/forms/signals)
- [Angular ARIA UI Patterns](https://angular.dev/api/aria/ui-patterns)
