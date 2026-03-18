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
  shouldShowErrors,
  combineShowErrors,
  focusFirstInvalid,
  createOnInvalidHandler,
  hasSubmitted,
  injectFormContext,
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

Selector: `form[formRoot]`

**Inputs:**

- `formRoot` (required) — The form field tree
- `errorStrategy` — typically `'immediate' | 'on-touch' | 'on-submit'`

**Exposed signals:**

- `submittedStatus` — `Signal<'unsubmitted' | 'submitting' | 'submitted'>`

**What it adds beyond Angular's `FormRoot`:**

Angular's native `FormRoot` handles three things: `novalidate`, `event.preventDefault()`, and calling `submit()`. The toolkit directive replicates that baseline and adds:

- **DI context** (`NGX_SIGNAL_FORM_CONTEXT`) so child components like `<ngx-signal-form-error>` can access form-level state without prop drilling.
- **Submitted status tracking** (`submittedStatus`) to derive `'unsubmitted' → 'submitting' → 'submitted'`, which Angular does not expose directly.
- **Error display strategy** (`errorStrategy`) so validation feedback can appear on touch, on submit, or immediately.

**Submission patterns:**

```html
<!-- Declarative (recommended): configure submission in form(), no (submit) binding needed -->
<form [formRoot]="myForm" [errorStrategy]="'on-submit'">
  <button type="submit">Submit</button>
</form>

<!-- [formRoot] replicates FormRoot behavior, so provide submission.action in form() -->
```

### NgxSignalFormAutoAriaDirective

Automatically applies to supported `[formField]` controls, including custom controls that expose a bound host element.

Current behavior:

- covers text-like inputs, textareas, selects, and custom `[formField]` hosts
- excludes `radio` and `checkbox` inputs
- can be disabled per control with `ngxSignalFormAutoAriaDisabled`

Auto-applies:

- `aria-invalid` (respects error strategy)
- `aria-required`
- `aria-describedby` (links to error elements)

### Configuration

```typescript
// User config (all properties optional with defaults shown)
interface NgxSignalFormsUserConfig {
  autoAria?: boolean; // Default: true
  defaultErrorStrategy?: 'immediate' | 'on-touch' | 'on-submit'; // Default: 'on-touch'
  defaultFormFieldAppearance?: 'standard' | 'outline'; // Default: 'standard'
  showRequiredMarker?: boolean; // Default: true
  requiredMarker?: string; // Default: ' *'
}
```

> For CSS status classes such as `ng-invalid` or `ng-touched`, use Angular’s native `provideSignalFormsConfig({ classes })`. The toolkit focuses on ARIA wiring and visibility strategy rather than class generation.

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
| `createOnInvalidHandler(options?)`          | Creates `onInvalid` handler for `FormSubmitOptions`   |
| `hasSubmitted(form)`                        | `Signal<boolean>` — completed at least one submission |
| `showErrors(field, strategy, status)`       | `Signal<boolean>` — should show errors                |
| `shouldShowErrors(state, strategy, status)` | Non-reactive check                                    |
| `injectFormContext()`                       | Get `NgxSignalFormDirective` context or `undefined`   |
| `unwrapValue(signalOrValue)`                | Extract value from `Signal` or static                 |

`showErrors()` is the main API for component and template work. `shouldShowErrors()` and `unwrapValue()` are mainly useful when building lower-level utilities.

### Immutable Array Helpers

Utilities for immutable state updates, useful with NgRx Signal Store or any state management.

```typescript
import {
  updateAt,
  removeAt,
  insertAt,
  append,
  prepend,
  moveItem,
  updateNested,
} from '@ngx-signal-forms/toolkit';
```

| Function                                                 | Description                           |
| -------------------------------------------------------- | ------------------------------------- |
| `updateAt(array, index, updater)`                        | Update item at index immutably        |
| `removeAt(array, index)`                                 | Remove item at index immutably        |
| `insertAt(array, index, item)`                           | Insert item at index immutably        |
| `append(array, item)`                                    | Add item to end immutably             |
| `prepend(array, item)`                                   | Add item to start immutably           |
| `moveItem(array, fromIndex, toIndex)`                    | Move item between positions immutably |
| `updateNested(array, index, nestedKey, nestedIndex, fn)` | Update item in nested array immutably |

### Example: Deeply Nested State Updates

```typescript
// Without helpers (verbose)
patchState(store, (s) => ({
  destinations: s.destinations.map((d, i) =>
    i === destIdx
      ? {
          ...d,
          activities: d.activities.map((a, j) =>
            j === actIdx ? { ...a, name: 'Updated' } : a,
          ),
        }
      : d,
  ),
}));

// With helpers (concise)
patchState(store, (s) => ({
  destinations: updateNested(
    s.destinations,
    destIdx,
    'activities',
    actIdx,
    (activity) => ({ ...activity, name: 'Updated' }),
  ),
}));
```

---

## Assistive (`@ngx-signal-forms/toolkit/assistive`)

### Assistive imports

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
- `fieldName` — Required when used standalone; inherited automatically inside `ngx-signal-form-field-wrapper`
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

### Assistive theming

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

### Form field imports

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
- `fieldName` — Optional explicit override; otherwise derived from the bound control `id`
- `strategy` — Override error strategy
- `appearance` — `'standard' | 'outline' | 'inherit'`
- `showRequiredMarker` / `requiredMarker` — Required field indicator for outlined fields

```html
<ngx-signal-form-field-wrapper [formField]="form.email">
  <label for="email">Email</label>
  <input id="email" [formField]="form.email" />
</ngx-signal-form-field-wrapper>
```

The wrapper uses a strict identity model: if you do not pass `fieldName`, the projected bound control must have an `id`.

### NgxFloatingLabelDirective (`appearance="outline"`)

Attribute directive for Material-like outlined inputs.

```html
<ngx-signal-form-field-wrapper [formField]="form.email" appearance="outline">
  <label for="email">Email</label>
  <input id="email" [formField]="form.email" placeholder=" " />
</ngx-signal-form-field-wrapper>
```

**Note:** Add `placeholder=" "` for floating label animation. Prefer `appearance="outline"` in new examples.

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
  <ngx-signal-form-field-wrapper
    [formField]="form.address.street"
    appearance="outline"
  >
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

### Form field theming

See [Form Field Theming Guide](./form-field/THEMING.md) for 20+ CSS custom properties.

---

## Headless (`@ngx-signal-forms/toolkit/headless`)

Renderless primitives for custom UI. All expose signals without markup.

### Headless imports

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
- `shouldShowErrors()` / `shouldShowWarnings()`

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

Use the headless entry point when you want toolkit state logic but fully custom markup. Use the `assistive` or `form-field` entry points when you want ready-to-render UI.

---

## Related Documentation

- [Main README](https://github.com/ngx-signal-forms/ngx-signal-forms#readme) — Overview, installation, quick start
- [Current main changelog](../../docs/CHANGELOG_CURRENT.md) — Unreleased changes since `v1.0.0-beta.6`
- [Migration guide: beta.6 → current main](../../docs/MIGRATION_CURRENT.md) — Upgrade notes for the current unreleased branch
- [Changelog (beta.6)](../../docs/archive/CHANGELOG_BETA6.md) — Released changes in `v1.0.0-beta.6`
- [Migration Guide (beta.5)](../../docs/archive/MIGRATION_BETA5.md) — Upgrade steps from earlier beta releases
- [Form Field Theming](./form-field/THEMING.md) — CSS custom properties guide
- [CSS Framework Integration](../../docs/CSS_FRAMEWORK_INTEGRATION.md) — Bootstrap, Tailwind, Material setup
- [Warnings Support](../../docs/WARNINGS_SUPPORT.md) — Non-blocking validation
- [Assistive Components](./assistive/README.md) — Detailed assistive docs
- [Headless Primitives](./headless/README.md) — Detailed headless docs
- [Form Field Components](./form-field/README.md) — Detailed form field docs

---

## License

MIT © [ngx-signal-forms](https://github.com/ngx-signal-forms/ngx-signal-forms)
