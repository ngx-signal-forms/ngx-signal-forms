# Parse Errors and Warnings in Angular Signal Forms

This document explains how Angular Signal Forms parse errors and the toolkit's warning convention interact in real forms.

## Parse Errors

Angular Signal Forms validators produce `ValidationError` objects. Each error has:

| Property  | Type                | Description                                |
| --------- | ------------------- | ------------------------------------------ |
| `kind`    | `string`            | Error type identifier (e.g., `'required'`) |
| `message` | `string` (optional) | Human-readable message                     |

When using `errorSummary()`, errors are enriched with field tree references:

| Property    | Type                            | Description                       |
| ----------- | ------------------------------- | --------------------------------- |
| `fieldTree` | `FieldTree<unknown>`            | The field that produced the error |
| `formField` | `FormField<unknown>` (optional) | The bound FormField directive     |

## How Errors Flow

```
signal({ email: '', name: '' })
  │
  ▼
form(signal, schema)
  │
  ├─ email ──► errors(): ValidationError[]        (direct errors only)
  │            errorSummary(): WithFieldTree[]     (includes nested)
  │
  └─ name ──► errors(): ValidationError[]
               errorSummary(): WithFieldTree[]
  │
  ▼
form tree root
  └─► errorSummary(): WithFieldTree[]              (ALL errors, all fields)
```

### errors() vs errorSummary()

| Method           | Scope                            | Includes Nested | Used By                 |
| ---------------- | -------------------------------- | --------------- | ----------------------- |
| `errors()`       | Direct field errors only         | No              | Headless error-state    |
| `errorSummary()` | All errors including descendants | Yes             | Fieldset, error-summary |

The toolkit's `readErrors()` utility prefers `errorSummary()` when available, falling back to `errors()`:

```typescript
// packages/toolkit/headless/src/lib/utilities.ts
export function readErrors(fieldState: FieldStateLike): ValidationError[] {
  if (fieldState?.errorSummary) return fieldState.errorSummary();
  if (fieldState?.errors) return fieldState.errors();
  return [];
}
```

## Toolkit Message Resolution

The toolkit resolves error messages through a 3-tier priority system:

```
1. Validator message    → error.message (set in schema definition)
2. Registry message     → NGX_ERROR_MESSAGES provider (app-wide defaults)
3. Fallback             → "Invalid" (last resort)
```

### Example: Validator-Level Messages

```typescript
const myForm = form(signal({ email: '' }), (path) => {
  required(path.email, { message: 'Email is required' });
  email(path.email, { message: 'Must be a valid email address' });
});
```

### Example: Registry-Level Messages

```typescript
// In providers
provideNgxSignalFormErrorMessages({
  required: 'This field is required',
  email: 'Please enter a valid email',
  minlength: ({ requiredLength }) =>
    `Minimum ${requiredLength} characters needed`,
});
```

## Warnings Convention

Angular Signal Forms has no native warning concept. The toolkit uses a convention based on the error `kind` prefix:

| Kind Prefix | Type    | Blocks Submission | ARIA            |
| ----------- | ------- | ----------------- | --------------- |
| (no prefix) | Error   | Yes               | `role="alert"`  |
| `warn:`     | Warning | No                | `role="status"` |

### Creating Warnings

```typescript
import { warningError } from '@ngx-signal-forms/toolkit/assistive';

const myForm = form(signal({ password: '' }), (path) => {
  required(path.password, { message: 'Password is required' });

  // Warning — does not block submission
  validate(path.password, (ctx) => {
    const value = ctx.value();
    if (value && value.length < 12) {
      return warningError('short-password', 'Consider using 12+ characters');
    }
    return undefined;
  });
});
```

### Filtering Errors vs Warnings

```typescript
import {
  isBlockingError,
  isWarningError,
} from '@ngx-signal-forms/toolkit/assistive';

const allErrors = form.email().errors();
const blocking = allErrors.filter(isBlockingError); // Real errors
const warnings = allErrors.filter(isWarningError); // Non-blocking warnings
```

### Toolkit Components Handle This Automatically

The `NgxSignalFormErrorComponent` renders errors and warnings separately:

```html
<!-- Errors: role="alert", aria-live="assertive" -->
<!-- Warnings: role="status", aria-live="polite" -->
<ngx-signal-form-error [formField]="form.password" fieldName="password" />
```

The headless `NgxHeadlessErrorStateDirective` exposes separate signals:

```html
<div
  ngxSignalFormHeadlessErrorState
  #es="errorState"
  [field]="form.password"
  fieldName="password"
>
  @if (es.showErrors() && es.hasErrors()) {
  <!-- blocking errors -->
  } @if (es.showWarnings() && es.hasWarnings()) {
  <!-- non-blocking warnings -->
  }
</div>
```

## Parse Errors in Practice

### Complete Example

```typescript
@Component({
  selector: 'app-registration',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, NgxSignalFormToolkit],
  template: `
    <form [formRoot]="regForm" ngxSignalForm [errorStrategy]="'on-touch'">
      <label for="password">Password</label>
      <input id="password" type="password" [formField]="regForm.password" />
      <ngx-signal-form-error
        [formField]="regForm.password"
        fieldName="password"
      />

      <button type="submit" [disabled]="regForm().invalid()">Register</button>
    </form>
  `,
})
export class RegistrationComponent {
  readonly #model = signal({ password: '' });

  protected readonly regForm = form(this.#model, (path) => {
    // Blocking error
    required(path.password, { message: 'Password is required' });
    minLength(path.password, 8, { message: 'At least 8 characters' });

    // Non-blocking warning
    validate(path.password, (ctx) => {
      const v = ctx.value();
      if (v && !/[A-Z]/.test(v)) {
        return warningError(
          'no-uppercase',
          'Adding uppercase letters improves security',
        );
      }
      return undefined;
    });
  });
}
```

In this example:

- Missing password → blocking error, prevents submission
- Short password → blocking error, prevents submission
- No uppercase → warning, shown as polite status, submission still allowed

## Related

- [Warnings Support](./WARNINGS_SUPPORT.md) — Full warnings convention documentation
- [Custom Controls](./CUSTOM_CONTROLS.md) — Custom control integration
- [Angular Signal Forms Overview](./Angular%20Signal%20Forms%20Overview.md) — Core API reference
