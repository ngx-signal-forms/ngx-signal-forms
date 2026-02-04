# @ngx-signal-forms/toolkit — API Reference

> This is the detailed API reference. For overview, installation, and quick start, see the [main README](https://github.com/ngx-signal-forms/ngx-signal-forms#readme).

## Entry Points

| Entry Point                            | Purpose                                     |
| -------------------------------------- | ------------------------------------------- |
| `@ngx-signal-forms/toolkit`            | Core directives, providers, and utilities   |
| `@ngx-signal-forms/toolkit/assistive`  | Error, hint, and character count components |
| `@ngx-signal-forms/toolkit/form-field` | Form field wrapper and fieldset components  |
| `@ngx-signal-forms/toolkit/headless`   | Renderless primitives for custom UI         |

---

## Core (`@ngx-signal-forms/toolkit`)

### Imports

```typescript
// Bundle import (recommended)
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';

// Individual imports
import {
  NgxSignalFormDirective,
  NgxSignalFormAutoAriaDirective,
  provideNgxSignalFormsConfig,
  provideNgxSignalFormsConfigForComponent,
  provideErrorMessages,
  showErrors,
  computeShowErrors,
  shouldShowErrors,
  combineShowErrors,
  focusFirstInvalid,
  canSubmit,
  isSubmitting,
  hasSubmitted,
  injectFormContext,
  injectFormConfig,
  unwrapValue,
} from '@ngx-signal-forms/toolkit';
```

### NgxSignalFormToolkit

Bundle containing `NgxSignalFormDirective` and `NgxSignalFormAutoAriaDirective`.

```typescript
@Component({
  imports: [FormField, NgxSignalFormToolkit],
})
```

### NgxSignalFormDirective

Selector: `form[ngxSignalForm], form(submit)`

**Inputs:**

- `ngxSignalForm` — The form field tree
- `errorStrategy` — `'immediate' | 'on-touch' | 'on-submit' | 'manual'`

**Outputs:**

- `submittedStatus` — `Signal<'unsubmitted' | 'submitting' | 'submitted'>`

**Features:**

- Auto-adds `novalidate` attribute
- Provides form context to child components
- Tracks submission lifecycle

```html
<form
  [ngxSignalForm]="form"
  [errorStrategy]="'on-submit'"
  (submit)="save($event)"
>
  <!-- children can inject form context -->
</form>
```

### NgxSignalFormAutoAriaDirective

Selector: `input[formField], textarea[formField], select[formField]`

Auto-applies:

- `aria-invalid` (respects error strategy)
- `aria-describedby` (links to error elements)

### Configuration

```typescript
interface NgxSignalFormsConfig {
  autoAria: boolean; // Default: true
  defaultErrorStrategy: ErrorDisplayStrategy; // Default: 'on-touch'
  defaultFormFieldAppearance: 'standard' | 'outline'; // Default: 'standard'
  showRequiredMarker: boolean; // Default: true
  requiredMarker: string; // Default: ' *'
  fieldNameResolver?: (el: HTMLElement) => string | null;
  strictFieldResolution: boolean; // Default: false
  debug: boolean; // Default: false
}

type ErrorDisplayStrategy = 'immediate' | 'on-touch' | 'on-submit' | 'manual';
```

**Providers:**

```typescript
// App-level (in app.config.ts)
provideNgxSignalFormsConfig({ defaultErrorStrategy: 'on-submit' });

// Component-level (in @Component.providers)
provideNgxSignalFormsConfigForComponent({
  defaultFormFieldAppearance: 'outline',
});
```

### Error Messages

```typescript
provideErrorMessages({
  required: 'This field is required',
  email: 'Invalid email format',
  minLength: (params) => `Minimum ${params.minLength} characters`,
});
```

**Priority:** Validator `error.message` → Registry → Default toolkit message

### Utilities

| Function                                    | Description                                           |
| ------------------------------------------- | ----------------------------------------------------- |
| `focusFirstInvalid(form)`                   | Focus first invalid field via `errorSummary()`        |
| `canSubmit(form)`                           | `Signal<boolean>` — valid and not submitting          |
| `isSubmitting(form)`                        | `Signal<boolean>` — currently submitting              |
| `hasSubmitted(form)`                        | `Signal<boolean>` — completed at least one submission |
| `showErrors(field, strategy, status)`       | `Signal<boolean>` — should show errors                |
| `shouldShowErrors(state, strategy, status)` | Non-reactive check                                    |
| `injectFormContext()`                       | Get `NgxSignalFormDirective` context or `undefined`   |
| `injectFormConfig()`                        | Get normalized config with defaults                   |
| `unwrapValue(signalOrValue)`                | Extract value from `Signal` or static                 |

---

## Assistive (`@ngx-signal-forms/toolkit/assistive`)

### Imports

```typescript
import {
  NgxSignalFormErrorComponent,
  NgxFormFieldHintComponent,
  NgxFormFieldCharacterCountComponent,
  NgxFormFieldAssistiveRowComponent,
  warningError,
  isWarningError,
  isBlockingError,
} from '@ngx-signal-forms/toolkit/assistive';
```

### NgxSignalFormErrorComponent

Displays validation errors with ARIA roles.

**Inputs:**

- `formField` (required) — The field tree
- `fieldName` (required) — Unique identifier for ARIA linking
- `strategy` — Override error display strategy

```html
<ngx-signal-form-error [formField]="form.email" fieldName="email" />
```

- Errors: `role="alert"` (assertive)
- Warnings: `role="status"` (polite)

### NgxFormFieldHintComponent

Helper text below inputs.

```html
<ngx-signal-form-field-hint>Format: 123-456-7890</ngx-signal-form-field-hint>
```

### NgxFormFieldCharacterCountComponent

Character counter with progressive color states.

**Inputs:**

- `formField` (required)
- `maxLength` — Auto-detected from validators if omitted
- `showLimitColors` — Enable color progression (default: `true`)
- `colorThresholds` — `{ warning: 80, danger: 95 }`

```html
<ngx-signal-form-field-character-count [formField]="form.bio" />
```

### Warning Utilities

```typescript
// Create a non-blocking warning
warningError({
  kind: 'weak_password',
  message: 'Consider a stronger password',
});

// Check error type
isWarningError(error); // true if kind starts with 'warn:'
isBlockingError(error); // true if not a warning
```

### Theming

```css
:root {
  --ngx-signal-form-feedback-font-size: 0.875rem;
  --ngx-signal-form-feedback-line-height: 1.25;
  --ngx-signal-form-feedback-margin-top: 0.5rem;
  --ngx-signal-form-error-color: #dc2626;
  --ngx-signal-form-warning-color: #f59e0b;
}
```

---

## Form Field (`@ngx-signal-forms/toolkit/form-field`)

### Imports

```typescript
// Bundle import (recommended)
import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';

// Individual imports
import {
  NgxSignalFormFieldWrapperComponent,
  NgxSignalFormFieldset,
  NgxFloatingLabelDirective,
  NgxFormFieldHintComponent,
  NgxFormFieldCharacterCountComponent,
} from '@ngx-signal-forms/toolkit/form-field';
```

### NgxSignalFormFieldWrapperComponent

Unified wrapper with automatic error/warning/hint display.

**Inputs:**

- `formField` (required)
- `fieldName` — Auto-derived from child input `id` if omitted
- `strategy` — Override error strategy
- `showRequiredMarker` / `requiredMarker` — Required field indicator

```html
<ngx-signal-form-field-wrapper [formField]="form.email">
  <label for="email">Email</label>
  <input id="email" [formField]="form.email" />
</ngx-signal-form-field-wrapper>
```

### NgxFloatingLabelDirective (`outline`)

Attribute directive for Material-like outlined inputs.

```html
<ngx-signal-form-field-wrapper [formField]="form.email" outline>
  <label for="email">Email</label>
  <input id="email" [formField]="form.email" placeholder=" " />
</ngx-signal-form-field-wrapper>
```

**Note:** Add `placeholder=" "` for floating label animation.

### NgxSignalFormFieldset

Groups related fields with aggregated validation.

**Inputs:**

- `fieldsetField` (required) — Field tree to aggregate
- `fields` — Explicit field list (overrides tree traversal)
- `fieldsetId` — For ARIA linking
- `strategy` — Error display strategy
- `showErrors` — Enable error display (default: `true`)
- `includeNestedErrors` — Include child field errors (default: `false`)

```html
<!-- Group-only errors (default) -->
<ngx-signal-form-fieldset [fieldsetField]="form.address" fieldsetId="address">
  <legend>Address</legend>
  <ngx-signal-form-field-wrapper [formField]="form.address.street" outline>
    ...
  </ngx-signal-form-field-wrapper>
</ngx-signal-form-fieldset>

<!-- Include all nested errors -->
<fieldset
  ngxSignalFormFieldset
  [fieldsetField]="form.address"
  includeNestedErrors
>
  ...
</fieldset>
```

### Theming

See [Form Field Theming Guide](./form-field/THEMING.md) for 20+ CSS custom properties.

---

## Headless (`@ngx-signal-forms/toolkit/headless`)

Renderless primitives for custom UI. All expose signals without markup.

### Imports

```typescript
// Bundle import
import { NgxHeadlessToolkit } from '@ngx-signal-forms/toolkit/headless';

// Individual imports
import {
  NgxHeadlessErrorStateDirective,
  NgxHeadlessCharacterCountDirective,
  NgxHeadlessFieldsetDirective,
  NgxHeadlessFieldNameDirective,
  createErrorState,
  createCharacterCount,
  readFieldFlag,
  readErrors,
  dedupeValidationErrors,
  createUniqueId,
} from '@ngx-signal-forms/toolkit/headless';
```

### NgxHeadlessErrorStateDirective

Selector: `[ngxSignalFormHeadlessErrorState]`
Export: `#errorState="errorState"`

**Inputs:**

- `field` (required)
- `fieldName` (required)
- `strategy`

**Signals:**

- `showErrors()` — Should display errors now
- `hasErrors()` — Has validation errors
- `hasWarnings()` — Has warnings (no blocking errors)
- `resolvedErrors()` — Errors with messages resolved
- `resolvedWarnings()` — Warnings with messages resolved
- `errorId` / `warningId` — Generated IDs for ARIA

```html
<div
  ngxSignalFormHeadlessErrorState
  #errorState="errorState"
  [field]="form.email"
  fieldName="email"
>
  <input [formField]="form.email" />
  @if (errorState.showErrors() && errorState.hasErrors()) {
  <div class="my-error">{{ errorState.resolvedErrors()[0].message }}</div>
  }
</div>
```

### NgxHeadlessCharacterCountDirective

Selector: `[ngxSignalFormHeadlessCharacterCount]`
Export: `#charCount="charCount"`

**Inputs:**

- `field` (required)
- `maxLength` — Auto-detected if omitted

**Signals:**

- `currentLength()` — Current character count
- `maxLength()` — Limit (from validator or input)
- `remaining()` — Characters left
- `percentage()` — Usage percentage (0-100+)
- `limitState()` — `'ok' | 'warning' | 'danger' | 'exceeded'`

### NgxHeadlessFieldsetDirective

Selector: `[ngxSignalFormHeadlessFieldset]`
Export: `#fieldset="fieldset"`

**Inputs:**

- `fieldsetField` (required)
- `fields` — Explicit field list
- `strategy`
- `includeNestedErrors`

**Signals:**

- `isValid()` / `isInvalid()`
- `isTouched()` / `isDirty()`
- `aggregatedErrors()` / `aggregatedWarnings()`
- `showErrors()`

### Host Directive Pattern

```typescript
@Component({
  selector: 'my-form-field',
  hostDirectives: [
    {
      directive: NgxHeadlessErrorStateDirective,
      inputs: ['field', 'fieldName', 'strategy'],
    },
  ],
})
export class MyFormFieldComponent {
  protected readonly errorState = inject(NgxHeadlessErrorStateDirective);
}
```

### Utility Functions

```typescript
// Programmatic error state
const state = createErrorState({ field: form.email, fieldName: 'email' });

// Programmatic character count
const count = createCharacterCount({ field: form.bio, maxLength: 500 });

// Safe field state reading
readFieldFlag(field(), 'invalid'); // boolean
readErrors(field()); // uses errorSummary() or errors()
dedupeValidationErrors(errors); // remove duplicates by message
createUniqueId('field'); // 'field-1', 'field-2', ...
```

---

## Related Documentation

- [Main README](https://github.com/ngx-signal-forms/ngx-signal-forms#readme) — Overview, installation, quick start
- [Form Field Theming](./form-field/THEMING.md) — CSS custom properties guide
- [CSS Framework Integration](../../docs/CSS_FRAMEWORK_INTEGRATION.md) — Bootstrap, Tailwind, Material setup
- [Warnings Support](../../docs/WARNINGS_SUPPORT.md) — Non-blocking validation
- [Assistive Components](./assistive/README.md) — Detailed assistive docs
- [Headless Primitives](./headless/README.md) — Detailed headless docs
- [Form Field Components](./form-field/README.md) — Detailed form field docs

---

## License

MIT © [ngx-signal-forms](https://github.com/ngx-signal-forms/ngx-signal-forms)
