# @ngx-signal-forms/toolkit — API Reference

> This is the detailed API reference. For overview, installation, and quick start, see the [main README](https://github.com/ngx-signal-forms/ngx-signal-forms#readme).

## Entry Points

| Entry Point                            | Purpose                                     |
| -------------------------------------- | ------------------------------------------- |
| `@ngx-signal-forms/toolkit`            | Core directives, providers, and utilities   |
| `@ngx-signal-forms/toolkit/assistive`  | Error, hint, and character count components |
| `@ngx-signal-forms/toolkit/form-field` | Form field wrapper and fieldset components  |
| `@ngx-signal-forms/toolkit/headless`   | Renderless primitives for custom UI         |
| `@ngx-signal-forms/toolkit/vest`       | Optional Vest convenience helpers           |
| `@ngx-signal-forms/toolkit/debugger`   | Development-time form inspection tools      |

---

## Core (`@ngx-signal-forms/toolkit`)

### Imports

```typescript
// Bundle import (recommended)
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';

// Individual imports
import { FormRoot } from '@angular/forms/signals';
import {
  NgxSignalFormDirective,
  NgxSignalFormAutoAriaDirective,
  provideNgxSignalFormsConfig,
  provideNgxSignalFormsConfigForComponent,
  provideErrorMessages,
  combineShowErrors,
  showErrors,
  focusFirstInvalid,
  createOnInvalidHandler,
  createSubmittedStatusTracker,
  hasSubmitted,
  hasOnlyWarnings,
  getBlockingErrors,
  canSubmitWithWarnings,
  submitWithWarnings,
  injectFormContext,
  provideFieldLabels,
  splitByKind,
  unwrapValue,
} from '@ngx-signal-forms/toolkit';
```

### NgxSignalFormToolkit

Bundle containing Angular `FormRoot`, `NgxSignalFormDirective`, and `NgxSignalFormAutoAriaDirective`.

```typescript
@Component({
  imports: [FormField, NgxSignalFormToolkit],
})
```

### NgxSignalFormDirective

Selector: `form[formRoot][ngxSignalForm]`

**Inputs:**

- `errorStrategy` — typically `'immediate' | 'on-touch' | 'on-submit'`

**Exposed signals:**

- `submittedStatus` — `Signal<'unsubmitted' | 'submitting' | 'submitted'>`

**How to import it individually:**

```typescript
import { FormRoot } from '@angular/forms/signals';
import { NgxSignalFormDirective } from '@ngx-signal-forms/toolkit';
```

**What it adds on top of Angular's `FormRoot`:**

Angular's native `FormRoot` remains the owner of `novalidate`, `event.preventDefault()`, and `submit()`. The toolkit enhancer adds:

- **DI context** (`NGX_SIGNAL_FORM_CONTEXT`) so child components like `<ngx-signal-form-error>` can access form-level state without prop drilling.
- **Submitted status tracking** (`submittedStatus`) to derive `'unsubmitted' → 'submitting' → 'submitted'`, which Angular does not expose directly.
- **Error display strategy** (`errorStrategy`) so validation feedback can appear on touch, on submit, or immediately.

**Submission patterns:**

```html
<!-- Angular owns [formRoot], toolkit opts in via ngxSignalForm -->
<form [formRoot]="myForm" ngxSignalForm errorStrategy="on-submit">
  <button type="submit">Submit</button>
</form>
```

### NgxSignalFormAutoAriaDirective

Automatically applies to supported `[formField]` controls, including custom controls that expose a bound host element.

Current behavior:

- covers text-like inputs, textareas, selects, and custom `[formField]` hosts
- excludes `radio` and standard `checkbox` inputs
- checkbox-based switches opt back in with `role="switch"`
- can be disabled per control with `ngxSignalFormAutoAriaDisabled`

**Standalone scope note:** Angular standalone imports are template-local. If a
custom control component renders the real `<input [formField]>`,
`<textarea [formField]>`, or other bound host inside its own template, import
`NgxSignalFormToolkit` or `NgxSignalFormAutoAriaDirective` in that custom
control component itself. Importing the toolkit only in a parent form component
does not make the directive available inside child component templates.

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
}
```

> For CSS status classes such as `ng-invalid` or `ng-touched`, use Angular’s native `provideSignalFormsConfig({ classes })`. The toolkit focuses on ARIA wiring and visibility strategy rather than class generation.

**Providers:**

```typescript
// App-level (in app.config.ts)
provideNgxSignalFormsConfig({ defaultErrorStrategy: 'on-submit' });
```

For one-off differences, prefer form-level or field-level inputs such as
`ngxSignalForm errorStrategy` or wrapper `appearance` instead of subtree-scoped config overrides.

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

- `focusFirstInvalid(form)` — Focus first invalid field via `errorSummary()`
- `createOnInvalidHandler(options?)` — Creates `onInvalid` handler for
  `FormSubmitOptions`
- `createSubmittedStatusTracker(form)` — Derives
  `unsubmitted/submitting/submitted` status
- `hasSubmitted(form)` — `Signal<boolean>` for whether at least one submission
  completed
- `hasOnlyWarnings(errors)` — Returns `true` when no blocking errors are
  present
- `getBlockingErrors(errors)` — Filters out warning-only validation messages
- `canSubmitWithWarnings(form)` — Allows submission when only warnings remain
- `submitWithWarnings(form, callback)` — Submit helper that blocks only on
  blocking errors
- `combineShowErrors(...signals)` — Combines multiple visibility signals
- `showErrors(field, strategy, status)` — `Signal<boolean>` for whether errors
  should be visible now
- `injectFormContext()` — Get `ngxSignalForm` context or `undefined`
- `splitByKind(errors)` — Partition validation messages into `blocking` and
  `warnings`
- `unwrapValue(signalOrValue)` — Extract value from `Signal` or static

`showErrors()` is the main public API for component and template work. `unwrapValue()` is mainly useful when building lower-level utilities.

### Field Label Customization

By default, error summaries humanize field paths (`address.postalCode` →
`Address / Postal code`). Override this for i18n or custom labels:

```typescript
import { provideFieldLabels } from '@ngx-signal-forms/toolkit';

// Static map — unmapped paths fall back to humanizeFieldPath
provideFieldLabels({
  contactEmail: 'E-mailadres',
  'address.postalCode': 'Postcode',
  'address.street': 'Straat',
});

// Dynamic resolver (ngx-translate, $localize, etc.)
provideFieldLabels(() => {
  const translate = inject(TranslateService);
  return (fieldPath) =>
    translate.instant(`fields.${fieldPath}`) || humanizeFieldPath(fieldPath);
});
```

Import `humanizeFieldPath` from `@ngx-signal-forms/toolkit/headless` to use
it as a fallback inside custom resolvers.

### Immutable Array Helpers

Utilities for immutable state updates, useful with NgRx Signal Store or any state management.

```typescript
import { updateAt, updateNested } from '@ngx-signal-forms/toolkit';
```

| Function                                                 | Description                           |
| -------------------------------------------------------- | ------------------------------------- |
| `updateAt(array, index, updater)`                        | Update item at index immutably        |
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
  NgxSignalFormErrorSummaryComponent,
  NgxFormFieldHintComponent,
  NgxFormFieldCharacterCountComponent,
  NgxFormFieldAssistiveRowComponent,
  warningError,
  isWarningError,
  isBlockingError,
} from '@ngx-signal-forms/toolkit/assistive';
```

---

## Vest (`@ngx-signal-forms/toolkit/vest`)

Optional helper APIs for consumers who use [Vest](https://vestjs.dev/) with Angular Signal Forms.

Angular Signal Forms already supports Standard Schema validators natively.
Vest 6+ suites implement that interface, and this entry point adds a first-class Angular adapter for Vest's richer suite results.

> **Vest v6 required** — Standard Schema support was introduced in Vest 6. Earlier versions will not work.
> `vest@6.3.0` is currently excluded because of an upstream packaging issue in the published build.

```typescript
import {
  validateVest,
  validateVestWarnings,
} from '@ngx-signal-forms/toolkit/vest';
```

### validateVest

First-class Angular Signal Forms adapter for Vest suites.
It reads Vest's `run()` result directly so blocking errors and optional `warn()` guidance can be mapped from the same suite execution.
Pass `{ includeWarnings: true }` when you want Vest `warn()` results translated into toolkit warning messages.

```typescript
import { signal } from '@angular/core';
import { form } from '@angular/forms/signals';
import { create, enforce, test } from 'vest';
import { validateVest } from '@ngx-signal-forms/toolkit/vest';

interface SignupModel {
  email: string;
}

const signupSuite = create((data: SignupModel) => {
  test('email', 'Email is required', () => {
    enforce(data.email).isNotBlank();
  });
});

const signupModel = signal<SignupModel>({ email: '' });
const signupForm = form(signupModel, (path) => {
  validateVest(path, signupSuite, { includeWarnings: true });
});
```

Use Vest `warn()` for advisory guidance only. Those messages render through
`ngx-signal-form-field-wrapper` or `NgxSignalFormErrorComponent` as polite status
updates, while blocking Vest failures keep rendering as alerts.

### validateVestWarnings

Registers only the warning bridge for a Vest suite. This is useful when blocking validation already comes from another source but you still want Vest `warn()` output to appear in toolkit form-field components.

```typescript
validateVestWarnings(path, signupSuite);
```

Install `vest@6.2.7` only when using this entry point, or move to a newer fixed `6.3.x` release once available.

**When to use it:**

- Prefer Angular Signal Forms validators for simple field rules like `required`, `email`, length, and range checks.
- Prefer Vest when validation is mostly business logic: conditional rules, cross-field policy checks, or async server-backed validation.
- Combining generated Zod/OpenAPI schemas with Vest is a strong pattern: use Zod for API-contract and structural validation, then layer Vest on top for richer business rules.
- When using Angular 21.2 `submit()` with `warn:*` messages, call `submit(..., { ignoreValidators: 'all' })` and gate the action with `hasOnlyWarnings(form().errorSummary())` if warnings should remain non-blocking.

```typescript
import { form, validateStandardSchema } from '@angular/forms/signals';
import { validateVest } from '@ngx-signal-forms/toolkit/vest';
import { GeneratedOpenApiSchema } from './generated/openapi.zod';
import { checkoutBusinessSuite } from './checkout.vest';

const checkoutForm = form(checkoutModel, (path) => {
  validateStandardSchema(path, GeneratedOpenApiSchema);
  validateVest(path, checkoutBusinessSuite);
});
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

### NgxSignalFormErrorSummaryComponent

Form-level error summary that renders blocking validation errors as a clickable
list and focuses the related control when an entry is activated.

**Inputs:**

- `formTree` (required) — Root form tree to aggregate
- `summaryLabel` — Optional heading text above the list
- `strategy` — Override visibility strategy
- `submittedStatus` — Optional submission-state override for `'on-submit'`

```html
<ngx-signal-form-error-summary
  [formTree]="form"
  strategy="on-submit"
  [submittedStatus]="submittedStatus()"
/>
```

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
warningError('weak-password', 'Consider a stronger password');

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
  NgxFormFieldHintComponent,
  NgxFormFieldCharacterCountComponent,
} from '@ngx-signal-forms/toolkit/form-field';
```

### NgxSignalFormFieldWrapperComponent

Unified wrapper with automatic error/warning/hint display.

Use wrapper `errorPlacement` as a local field-level override. For grouped
validation summaries and design-library style error positioning, prefer
`NgxSignalFormFieldset#errorPlacement`.

**Inputs:**

- `formField` (required)
- `fieldName` — Optional explicit override; otherwise derived from the bound control `id`
- `strategy` — Override error strategy
- `appearance` — `'standard' | 'outline' | 'inherit'`
- `errorPlacement` — Optional per-field override for automatic messages at the `top` or `bottom` (default: `bottom`)
- `showRequiredMarker` / `requiredMarker` — Required field indicator for outlined fields

```html
<ngx-signal-form-field-wrapper [formField]="form.email">
  <label for="email">Email</label>
  <input id="email" [formField]="form.email" />
</ngx-signal-form-field-wrapper>

<ngx-signal-form-field-wrapper [formField]="form.email" errorPlacement="top">
  <label for="email-top">Email</label>
  <input id="email-top" [formField]="form.email" />
</ngx-signal-form-field-wrapper>
```

The wrapper uses a strict identity model: if you do not pass `fieldName`, the projected bound control must have an `id`.

### NgxSignalFormFieldset

Groups related fields with aggregated validation.

This is the primary `errorPlacement` surface for the toolkit. Use it when a
single validation summary belongs to a field group, radio group, or compound
control cluster.

**Inputs:**

- `fieldsetField` (required) — Field tree to aggregate
- `fields` — Explicit field list (overrides tree traversal)
- `fieldsetId` — For ARIA linking
- `strategy` — Error display strategy
- `showErrors` — Enable error display (default: `true`)
- `includeNestedErrors` — Include child field errors (default: `false`)
- `errorPlacement` — Primary grouped-summary placement control at the `top` or `bottom` (default: `top`)

```html
<!-- Group-only errors with top summary placement (default) -->
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

<!-- Move grouped messages below the controls -->
<ngx-signal-form-fieldset
  [fieldsetField]="form.delivery"
  errorPlacement="bottom"
>
  <legend>Delivery method</legend>
  ...
</ngx-signal-form-fieldset>
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
  NgxHeadlessErrorSummaryDirective,
  NgxHeadlessCharacterCountDirective,
  NgxHeadlessFieldsetDirective,
  NgxHeadlessFieldNameDirective,
  createErrorState,
  createCharacterCount,
  createFieldStateFlags,
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

// Reusable field-state flags
const flags = createFieldStateFlags(() => form.email());

// Safe field state reading
readFieldFlag(field(), 'invalid'); // boolean
readErrors(field()); // uses errorSummary() or errors()
dedupeValidationErrors(errors); // remove duplicates by message
createUniqueId('field'); // 'field-1', 'field-2', ...
```

`createFieldStateFlags()` is the companion utility for custom UIs that need the
common state signals in one place:

```typescript
const flags = createFieldStateFlags(() => form.email());

flags.isTouched();
flags.isDirty();
flags.isValid();
flags.isInvalid();
flags.isPending();
```

Use the headless entry point when you want toolkit state logic but fully custom markup. Use the `assistive` or `form-field` entry points when you want ready-to-render UI.

Use `createFieldStateFlags()` when you need the common `isInvalid()`,
`isValid()`, `isTouched()`, `isDirty()`, and `isPending()` signals without
repeating five separate `readFieldFlag(...)` computeds.

---

## Related Documentation

- [Main README](https://github.com/ngx-signal-forms/ngx-signal-forms#readme) — Overview, installation, quick start
- [GitHub Releases](https://github.com/ngx-signal-forms/ngx-signal-forms/releases) — Published release notes
- [Beta release notes archive](../../docs/archive/) — Historical beta changelogs and migration guides
- [Form Field Theming](./form-field/THEMING.md) — CSS custom properties guide
- [CSS Framework Integration](../../docs/CSS_FRAMEWORK_INTEGRATION.md) — Bootstrap, Tailwind, Material setup
- [Warnings Support](../../docs/WARNINGS_SUPPORT.md) — Non-blocking validation
- [Assistive Components](./assistive/README.md) — Detailed assistive docs
- [Headless Primitives](./headless/README.md) — Detailed headless docs
- [Debugger](./debugger/README.md) — Development-only form inspection tools
- [Form Field Components](./form-field/README.md) — Detailed form field docs

---

## License

MIT © [ngx-signal-forms](https://github.com/ngx-signal-forms/ngx-signal-forms)
