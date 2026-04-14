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

### Which entry point do I pick?

- **Want ready-to-use styled fields?** → `form-field` (wrapper + fieldset, bundled via `NgxFormField`)
- **Want to render your own markup but reuse toolkit error/hint/count components?** → `assistive`
- **Want signals-only, fully custom markup?** → `headless` (directives + factory helpers)
- **Want richer validation suites with cross-field business rules?** → `vest` (optional adapter)
- **Need to inspect form state during development?** → `debugger` (dev-only)
- **Always** import the three core directives (`form[formRoot][ngxSignalForm]`, auto-ARIA, control semantics) from the root entry point via `NgxSignalFormToolkit`.

---

## Core (`@ngx-signal-forms/toolkit`)

### Imports

```typescript
// Bundle import (recommended)
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';

// Individual imports
import { FormField, FormRoot } from '@angular/forms/signals';
import {
  NgxSignalFormDirective,
  NgxSignalFormAutoAriaDirective,
  NgxSignalFormControlSemanticsDirective,
  provideNgxSignalFormsConfig,
  provideNgxSignalFormsConfigForComponent,
  provideNgxSignalFormControlPresets,
  provideNgxSignalFormControlPresetsForComponent,
  provideErrorMessages,
  combineShowErrors,
  showErrors,
  shouldShowErrors,
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

Bundle containing Angular `FormRoot`, `NgxSignalFormDirective`, `NgxSignalFormAutoAriaDirective`, and `NgxSignalFormControlSemanticsDirective`.

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

- **DI context** (`NGX_SIGNAL_FORM_CONTEXT`) so child components like `<ngx-form-field-error>` can access form-level state without prop drilling.
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

- covers native `<input>`, `<textarea>`, and `<select>` controls (internally mapped to the `input-like` and `standalone-field-like` families), plus custom `[formField]` hosts
- excludes `radio` and standard `checkbox` inputs unless they explicitly opt in with `ngxSignalFormControl`
- checkbox-based switches opt back in with `role="switch"`, or with explicit control semantics when the toolkit should treat them as a switch family
- can be disabled per control with `ngxSignalFormAutoAriaDisabled`
- leaves consumer-owned `aria-invalid`, `aria-required`, and `aria-describedby` alone when `ngxSignalFormControlAria="manual"` is present

Rule of thumb:

- use the default **auto** mode for standard native field hosts and simple custom hosts
- use **manual** mode when the control already owns its ARIA state and described-by chain
- use **disabled** only for bespoke hosts where the toolkit should not participate at all

Manual mode is about **ARIA ownership on the control host**, not about opting
out of the wrapper. Wrapper labels, hints, errors, and field context can still
be used when ARIA ownership is manual.

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

### When should I use manual ARIA ownership?

`ngxSignalFormControlAria="manual"` tells the toolkit to stop writing
`aria-invalid`, `aria-required`, and `aria-describedby` on the control host.
Use it when the control already owns its own ARIA state — typically:

- custom widgets that manage `aria-describedby` themselves (sliders, combobox
  patterns, composite pickers)
- third-party components whose hosts already wire validation attributes
- controls where you want to drive `aria-describedby` from hints, errors, and
  custom helper text in one chain

Reach for `buildAriaDescribedBy()` to reconstruct the `aria-describedby` chain
without duplicating the toolkit's ID-generation conventions. Manual mode only
turns off ARIA writes on the control host — wrapper labels, hints, errors,
and field context still render normally.

### NgxSignalFormControlSemanticsDirective

Use `NgxSignalFormControlSemanticsDirective` when a control should participate in
wrapper layout or auto-ARIA as a specific control family instead of relying on
DOM heuristics alone.

```html
<app-star-rating
  id="productRating"
  role="slider"
  ngxSignalFormControl="slider"
  ngxSignalFormControlAria="manual"
  [formField]="form.productRating"
/>
```

This is usually the more valuable example than `switch`: a native checkbox with
`role="switch"` already carries most of its semantics, while sliders and
third-party composite widgets benefit much more from an explicit toolkit
contract.

Key behavior:

- accepts simple kinds such as `slider`, `composite`, or `switch`, or object input such as `[ngxSignalFormControl]="{ kind: 'slider', layout: 'stacked' }"`
- supports one-off overrides with `ngxSignalFormControlLayout` and `ngxSignalFormControlAria`
- writes stable `data-ngx-signal-form-control-*` attributes for wrapper styling and projected control discovery
- does **not** replace the widget's underlying semantics; if a control is conceptually a slider, combobox, or switch, keep the correct native/library semantics on the actual interactive host

Use `switch` when you want a checkbox-based toggle to opt into the switch
family. Use `slider` or `composite` when documenting richer custom controls or
third-party widgets.

The important boundary is ownership, not control popularity: manual mode is not
the normal path for everyday inputs, but it is the correct path when a widget
already manages its own ARIA attributes.

### Control semantics presets

If you need global or feature-scoped defaults for
`ngxSignalFormControlAria` / `ngxSignalFormControlLayout`, use the dedicated
control preset providers rather than extending `NgxSignalFormsConfig`.

Why this is the better fit:

- the settings are specific to semantic control families, not the whole form system
- they need both global and subtree-scoped overrides
- explicit directive inputs should still override provider defaults cleanly

```typescript
export const appConfig = {
  providers: [
    provideNgxSignalFormControlPresets({
      slider: {
        layout: 'custom',
        ariaMode: 'manual',
      },
      composite: {
        layout: 'custom',
      },
    }),
  ],
};

@Component({
  providers: [
    ...provideNgxSignalFormControlPresetsForComponent({
      composite: {
        ariaMode: 'manual',
      },
    }),
  ],
})
export class SearchFeatureComponent {}
```

Use the directive inputs for one-off control overrides:

- `ngxSignalFormControl`
- `ngxSignalFormControlLayout`
- `ngxSignalFormControlAria`

**Preset families** (`kind` values):

| Kind                    | Default layout   | Default ARIA mode | Typical hosts                                           |
| ----------------------- | ---------------- | ----------------- | ------------------------------------------------------- |
| `input-like`            | `stacked`        | `auto`            | `<input>` (text, email, number, password, date)         |
| `standalone-field-like` | `stacked`        | `auto`            | `<textarea>`, `<select>`                                |
| `switch`                | `inline-control` | `auto`            | `input[type="checkbox"][role="switch"]`, custom toggles |
| `checkbox`              | `group`          | `auto`            | Standalone `<input type="checkbox">`                    |
| `radio-group`           | `group`          | `auto`            | Radio clusters                                          |
| `slider`                | `stacked`        | `auto`            | Range inputs, rating widgets, custom sliders            |
| `composite`             | `custom`         | `auto`            | Date pickers, comboboxes, multi-part widgets            |

**Override hierarchy** (highest precedence first):

1. **Directive inputs** on the control host
   (`[ngxSignalFormControl]`, `ngxSignalFormControlLayout`, `ngxSignalFormControlAria`)
2. **Component-scoped presets** via `provideNgxSignalFormControlPresetsForComponent()`
3. **App-level presets** via `provideNgxSignalFormControlPresets()`
4. **Toolkit defaults** (`DEFAULT_NGX_SIGNAL_FORM_CONTROL_PRESETS`)

For a practical walk-through of plugging in sliders, date pickers, switches,
and third-party composite widgets, see
[`docs/CUSTOM_CONTROLS.md`](../../docs/CUSTOM_CONTROLS.md).

### `buildAriaDescribedBy`

When a control opts into `ngxSignalFormControlAria="manual"`, the consumer
owns its `aria-describedby` chain. Use `buildAriaDescribedBy` to assemble the
chain without duplicating the toolkit's ID-generation conventions:

```typescript
import { computed } from '@angular/core';
import { buildAriaDescribedBy, shouldShowErrors } from '@ngx-signal-forms/toolkit';

protected readonly describedBy = computed(() =>
  buildAriaDescribedBy('accessibilityAudit', {
    baseIds: ['accessibilityAudit-hint'],
    showErrors: shouldShowErrors(
      fieldState.invalid(), fieldState.touched(), strategy, submittedStatus,
    ),
  }),
);
```

This is commonly paired with `appearance="plain"` on the wrapper for sliders,
ratings, and composite widgets: the wrapper still contributes labels and
feedback, while the control keeps ownership of both its visual UI and its
ARIA chain.

### Configuration

```typescript
// User config (all properties optional with defaults shown)
interface NgxSignalFormsUserConfig {
  autoAria?: boolean; // Default: true
  defaultErrorStrategy?: 'immediate' | 'on-touch' | 'on-submit'; // Default: 'on-touch'
  defaultFormFieldAppearance?: 'stacked' | 'outline' | 'plain'; // Default: 'stacked'
  showRequiredMarker?: boolean; // Default: false
  requiredMarker?: string; // Default: '*'
}
```

`NgxSignalFormsUserConfig` is intentionally for form-system-wide behavior.
Control-family semantics such as default ARIA mode or wrapper layout live in
the dedicated control preset providers above.

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
- `showErrors(field, strategy, status?)` — `Signal<boolean>` for whether errors
  should be visible now. `status` is optional for `'immediate'` and
  `'on-touch'`; **required** for `'on-submit'` — without it the helper stays
  at `'unsubmitted'` and errors never surface (dev mode logs a one-shot
  `console.warn`). Inside a `[formRoot][ngxSignalForm]` form the wrapper,
  auto-ARIA, and headless directives inherit the status from
  `NgxSignalFormDirective` automatically; standalone `showErrors()` callers
  must pass it through.
- `createShowErrorsComputed(field, strategy, status?)` — Lower-level
  extraction used internally by `showErrors()`, `NgxHeadlessErrorStateDirective`,
  `NgxFormFieldErrorComponent`, and the wrapper. Reach for it when you already
  own a `FieldState` signal and want the same visibility-timing rules without
  routing through `showErrors()`'s wider `ErrorVisibilityState` parameter.
- `injectFormContext()` — Get `ngxSignalForm` context or `undefined`
- `splitByKind(errors)` — Partition validation messages into `blocking` and
  `warnings`
- `unwrapValue(signalOrValue)` — Extract value from `Signal` or static

`shouldShowErrors()` is the pure boolean strategy helper.
`showErrors()` is the reactive helper that returns `Signal<boolean>` from a `FieldTree`.
`unwrapValue()` is mainly useful when building lower-level utilities.

### Field Interactivity Predicates

Two small helpers drive consistent behavior across focus management, wrapper
rendering, and error surfacing so every layer asks the same "can the user
interact with this field?" question:

- `isFieldStateInteractive(fieldState)` — `false` when the field is
  `hidden()` or `disabled()`, `true` otherwise. `readonly()` counts as
  interactive: the control is still visible and focusable, and the error
  remains meaningful.
- `isFieldStateHidden(fieldState)` — narrow check that only reads `hidden()`.
  The wrapper uses this to reflect `[attr.hidden]` without also marking
  disabled-but-visible fields as hidden.

**Where the toolkit uses them:**

- `focusFirstInvalid()` skips errors whose bound field is non-interactive —
  focusing a hidden or disabled control would either throw or strand focus on
  something the user cannot operate.
- `NgxSignalFormFieldWrapperComponent` mirrors `hidden()` onto the host via
  `[attr.hidden]` so screen readers skip the wrapper entirely.
- Headless aggregation (`NgxHeadlessErrorSummaryDirective`,
  `NgxHeadlessFieldsetDirective`) filters `errorSummary()` through
  `isErrorOnInteractiveField()`, which routes through the same predicate.

**Focus vs. summary asymmetry — deliberate.** `focusFirstInvalid()` and
`isErrorOnInteractiveField()` take **opposite defaults** when an error has no
`fieldTree` or the tree is malformed:

- `focusFirstInvalid()` **skips** orphan errors — there is nothing to focus,
  and stealing focus to an unrelated control would be worse than skipping.
- `isErrorOnInteractiveField()` **keeps** orphan errors visible — silently
  hiding a validation message from the user is the worst outcome.

Both policies are documented in-place next to the code; the asymmetry is
intentional and should not be "normalized".

### Warning Visibility

Warnings share the **same visibility-timing rules** as errors. The wrapper and
`NgxFormFieldErrorComponent` route through `createShowErrorsComputed()` for
both, and the headless `shouldShowWarnings()` signal reuses the same strategy
gating. There is no separate `showWarnings()` helper — if you need a reactive
"should I render warnings now?" signal, use `hasWarnings()` from the field
state flags combined with `shouldShowErrors()`.

Visual priority inside the wrapper is: **blocking errors** → **warnings** →
**hints**. When a field has blocking errors, warnings are suppressed (errors
take the red border); when a field has only warnings, the wrapper renders
the amber warning state.

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
  NgxFormFieldErrorComponent,
  NgxFormFieldErrorSummaryComponent,
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
`ngx-signal-form-field-wrapper` or `NgxFormFieldErrorComponent` as polite status
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

### NgxFormFieldErrorComponent

Displays validation errors with ARIA roles.

**Inputs:**

- `formField` (required) — The field tree
- `fieldName` — Required when used standalone; inherited automatically inside `ngx-signal-form-field-wrapper`
- `strategy` — Override error display strategy

```html
<ngx-form-field-error [formField]="form.email" fieldName="email" />
```

- Errors: `role="alert"` (assertive)
- Warnings: `role="status"` (polite)

### NgxFormFieldErrorSummaryComponent

Form-level error summary that renders blocking validation errors as a clickable
list and focuses the related control when an entry is activated.

**Inputs:**

- `formTree` (required) — Root form tree to aggregate
- `summaryLabel` — Optional heading text above the list
- `strategy` — Override visibility strategy
- `submittedStatus` — Optional submission-state override for `'on-submit'`

```html
<ngx-form-field-error-summary
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
- `appearance` — `'stacked' | 'outline' | 'plain' | 'inherit'`
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
- [Form Field Theming](./form-field/THEMING.md) — CSS custom properties guide
- [CSS Framework Integration](../../docs/CSS_FRAMEWORK_INTEGRATION.md) — Bootstrap, Tailwind, Material setup
- [Custom Controls](../../docs/CUSTOM_CONTROLS.md) — Custom and third-party widget integration
- [Warnings Support](../../docs/WARNINGS_SUPPORT.md) — Non-blocking validation
- [Control Semantics Architecture](../../docs/decisions/0001-control-semantics-architecture.md) — Why the control-semantics contract is split across directive, providers, presets, and DI tokens
- [Assistive Components](./assistive/README.md) — Detailed assistive docs
- [Headless Primitives](./headless/README.md) — Detailed headless docs
- [Debugger](./debugger/README.md) — Development-only form inspection tools
- [Form Field Components](./form-field/README.md) — Detailed form field docs

---

## License

MIT © [ngx-signal-forms](https://github.com/ngx-signal-forms/ngx-signal-forms)
