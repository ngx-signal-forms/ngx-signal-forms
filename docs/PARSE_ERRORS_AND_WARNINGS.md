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

```text
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

## Toolkit Message Resolution

The toolkit resolves error messages through a 3-tier priority system:

```text
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

## Field Label Resolution

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

For dynamic i18n or a full custom resolver, pass a factory:

```typescript
provideFieldLabels(() => {
  const translate = inject(TranslateService);
  return (path) =>
    translate.instant(`fields.${path}`) || humanizeFieldPath(path);
});
```

Import `humanizeFieldPath` from `@ngx-signal-forms/toolkit/headless` to compose
it as a fallback inside custom resolvers.

## Warnings Convention

Angular Signal Forms has no native warning concept. The toolkit uses a convention based on the error `kind` prefix:

| Kind Prefix | Type    | Blocks Submission                                                                                     | ARIA            |
| ----------- | ------- | ----------------------------------------------------------------------------------------------------- | --------------- |
| (no prefix) | Error   | Yes                                                                                                   | `role="alert"`  |
| `warn:`     | Warning | Toolkit policy: No. Angular `submit()` still treats all `ValidationError`s as blocking unless handled | `role="status"` |

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
  splitByKind,
  isBlockingError,
  isWarningError,
} from '@ngx-signal-forms/toolkit';

const allErrors = form.email().errors();
const { blocking, warnings } = splitByKind(allErrors);

// Keep the item-level guards for single error checks
const firstIsBlocking = allErrors[0] ? isBlockingError(allErrors[0]) : false;
const firstIsWarning = allErrors[0] ? isWarningError(allErrors[0]) : false;
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
    <form [formRoot]="regForm" ngxSignalForm errorStrategy="on-touch">
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
- No uppercase → warning, shown as polite status; use warning-aware submit flow to allow submission

## Related

- [Warnings Support](./WARNINGS_SUPPORT.md) — Full warnings convention documentation
- [Custom Controls](./CUSTOM_CONTROLS.md) — Custom control integration
- [Angular Signal Forms API](https://angular.dev/api/forms/signals) — Core API reference
