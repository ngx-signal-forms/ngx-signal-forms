---
description: '@ngx-signal-forms/toolkit - current public API and usage rules'
applyTo: '{apps}/**/*.{ts,html,scss,css}'
---

# @ngx-signal-forms/toolkit - Coding Instructions

## Overview

`@ngx-signal-forms/toolkit` is a zero-intrusive enhancement layer for Angular Signal Forms.
It adds automatic ARIA wiring, configurable validation visibility, assistive UI components,
field wrappers, grouped fieldsets, headless primitives, and a debugger without changing the
Angular Signal Forms API.

Use the toolkit as a consumer of its **public API only**. Do not rely on internal helpers,
internal tokens, or removed beta APIs.

## Current Baseline

- **Angular peer dependency:** `@angular/core` and `@angular/forms` `>=21.2.0`
- **TypeScript:** `5.8+`
- **Architecture:** standalone components, signals, `OnPush`, zoneless-compatible
- **Forms API:** Angular Signal Forms with `[formField]`, plus the optional `ngxSignalForm` enhancer on `form[formRoot]` when form-level context is needed

## Current Public Entry Points

Use the correct entry point for the thing you need.

| Entry point                            | Public purpose                               |
| -------------------------------------- | -------------------------------------------- |
| `@ngx-signal-forms/toolkit`            | Core directives, providers, and utilities    |
| `@ngx-signal-forms/toolkit/assistive`  | Error, error summary, hint, character-count  |
| `@ngx-signal-forms/toolkit/form-field` | Wrapper, floating label, grouped fieldset    |
| `@ngx-signal-forms/toolkit/headless`   | Renderless directives and utility primitives |
| `@ngx-signal-forms/toolkit/vest`       | Vest v6+ and Standard Schema helpers         |
| `@ngx-signal-forms/toolkit/debugger`   | Visual debugging tools for development       |

### Import rules

- Prefer the bundle imports when they fit:
  - `NgxSignalFormToolkit`
  - `NgxFormField`
  - `NgxHeadlessToolkit`
  - `NgxSignalFormDebugger`
- Import assistive, form-field, headless, and debugger APIs from their own secondary entry points.
- Do **not** pretend the root entry point exports everything.

```typescript
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';
import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';
import { NgxFormFieldError } from '@ngx-signal-forms/toolkit/assistive';
```

## Stable Public Types

### ErrorDisplayStrategy

```typescript
type ResolvedErrorDisplayStrategy = 'immediate' | 'on-touch' | 'on-submit';

type ErrorDisplayStrategy = ResolvedErrorDisplayStrategy | 'inherit';
```

- Use `'inherit'` only for field-level/component-level inputs.
- Global config defaults must use only resolved strategies.
- Do **not** reference the removed `manual` strategy.

### Form field appearance

```typescript
type FormFieldAppearance = 'stacked' | 'outline' | 'plain';
type FormFieldAppearanceInput = FormFieldAppearance | 'inherit';
```

- Global config supports only `'stacked' | 'outline' | 'plain'`.
- Component inputs may also use `'inherit'`.

### Current public config surface

```typescript
interface NgxSignalFormsConfig {
  autoAria: boolean;
  defaultErrorStrategy: 'immediate' | 'on-touch' | 'on-submit';
  defaultFormFieldAppearance: 'stacked' | 'outline' | 'plain';
  showRequiredMarker: boolean;
  requiredMarker: string;
}
```

Only document and use this stable public config surface.
Do **not** mention removed/internal config fields such as:

- `fieldNameResolver`
- `strictFieldResolution`
- `debug`

## Recommended Form Patterns

For the smallest public path, use Angular `form[formRoot]` with toolkit wrappers, assistive components, or auto-ARIA. Those surfaces fall back to the default `'on-touch'` / `'unsubmitted'` behavior when `ngxSignalForm` is not present.

```typescript
import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';
import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';

@Component({
  selector: 'app-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, NgxSignalFormToolkit, NgxFormField],
  template: `
    <form [formRoot]="userForm">
      <ngx-form-field-wrapper [formField]="userForm.email" appearance="outline">
        <label for="email">Email</label>
        <input id="email" type="email" [formField]="userForm.email" />
      </ngx-form-field-wrapper>

      <button type="submit">Submit</button>
    </form>
  `,
})
export class ExampleComponent {
  readonly #model = signal({ email: '' });
  protected readonly userForm = form(this.#model, (path) => {
    required(path.email, { message: 'Email is required' });
  });
}
```

Add `ngxSignalForm` to the same `<form>` when the form needs shared toolkit context, a form-level strategy override, or `submittedStatus` for `'on-submit'` flows.

### When to add `[formRoot]` + `ngxSignalForm`

Without `ngxSignalForm`, toolkit surfaces fall back to default `'on-touch'` timing and treat the form as `'unsubmitted'`, which is correct for many basic forms.

`NgxSignalForm` on `form[formRoot][ngxSignalForm]` enhances Angular's `FormRoot` and adds:

- form context for child toolkit components
- derived `submittedStatus`
- form-level `errorStrategy`

Use `[formRoot]` + `ngxSignalForm` whenever you need:

- `'on-submit'` error timing
- form-level strategy overrides
- injected form context in custom components/directives
- consistent toolkit behavior across wrappers and standalone errors

## Current Core Public API

### Root entry point: `@ngx-signal-forms/toolkit`

Current public exports, grouped by category:

**Directives & bundles:**

- `NgxSignalForm` — form enhancer on `form[formRoot][ngxSignalForm]`
- `NgxSignalFormAutoAria` — automatic ARIA wiring
- `NgxSignalFormControlSemantics` — declares control kind/layout/aria for wrapper and auto-ARIA
- `NgxSignalFormToolkit` — bundle of all above

**Providers:**

- `provideNgxSignalFormsConfig()` / `provideNgxSignalFormsConfigForComponent()`
- `provideNgxSignalFormControlPresets()` / `provideNgxSignalFormControlPresetsForComponent()`
- `provideErrorMessages()`
- `provideFieldLabels()`

**Error visibility:**

- `showErrors()` / `createShowErrorsComputed()` / `combineShowErrors()`
- `shouldShowErrors()`
- `resolveErrorDisplayStrategy()` / `resolveStrategyFromContext()` / `resolveSubmittedStatusFromContext()`

**Submission helpers:**

- `focusFirstInvalid()` / `createOnInvalidHandler()`
- `createSubmittedStatusTracker()` / `hasSubmitted()`

**Warning helpers:**

- `warningError()` / `isWarningError()` / `isBlockingError()`
- `hasOnlyWarnings()` / `getBlockingErrors()` / `splitByKind()`
- `canSubmitWithWarnings()` / `submitWithWarnings()`

**Field & control resolution:**

- `injectFieldControl()` / `injectFormContext()`
- `resolveFieldName()` / `resolveNgxSignalFormControlSemantics()` / `readNgxSignalFormControlSemantics()`
- `inferNgxSignalFormControlKind()`
- `isFieldStateInteractive()` / `isFieldStateHidden()`
- `isNgxSignalFormControlKind()` / `isNgxSignalFormControlAriaMode()` / `isNgxSignalFormControlLayout()`

**ARIA & ID generation:**

- `buildAriaDescribedBy()`
- `generateErrorId()` / `generateWarningId()` / `createUniqueId()`

**Message resolution:**

- `resolveValidationErrorMessage()` / `getDefaultValidationMessage()`

**Utilities:**

- `readDirectErrors()` / `unwrapValue()`
- `updateAt()` / `updateNested()`

**Tokens (advanced):**

- `NGX_SIGNAL_FORMS_CONFIG` / `NGX_SIGNAL_FORM_CONTEXT` / `NGX_SIGNAL_FORM_FIELD_CONTEXT`
- `NGX_SIGNAL_FORM_CONTROL_PRESETS` / `DEFAULT_NGX_SIGNAL_FORM_CONTROL_PRESETS`

Do **not** document or recommend removed/non-public APIs such as:

- `computeShowErrors()` / `createShowErrorsSignal()`
- `injectFormConfig()` from the root public API
- `canSubmit()` / `isSubmitting()`

## Deterministic Field Identity

Field identity is now strict and deterministic.

### Rule

Toolkit UI that needs ARIA linkage must have either:

- an explicit `fieldName`, or
- a stable `id` on the bound control host

### Guidance

- For `ngx-form-field-wrapper`, prefer giving the bound control an `id`.
- For standalone `ngx-form-field-error`, pass `fieldName` unless wrapper context provides it.
- For grouped fieldsets, use `fieldsetId` when you need deterministic test or ARIA references.
- Do **not** invent fake field names in examples.

```html
<ngx-form-field-wrapper [formField]="form.email">
  <label for="email">Email</label>
  <input id="email" [formField]="form.email" />
</ngx-form-field-wrapper>

<ngx-form-field-error [formField]="form.email" fieldName="email" />
```

## Control Semantics

`NgxSignalFormControlSemantics` (part of `NgxSignalFormToolkit`) declares stable control behavior for the wrapper and auto-ARIA layers.

Use it for controls outside the default native field families:

```html
<!-- String shorthand -->
<input
  type="checkbox"
  role="switch"
  [formField]="form.active"
  ngxSignalFormControl="switch"
/>

<!-- Object form -->
<app-star-rating
  [formField]="form.rating"
  [ngxSignalFormControl]="{ kind: 'composite', layout: 'custom' }"
  ngxSignalFormControlAria="manual"
/>
```

Control kinds: `'input-like'` | `'standalone-field-like'` | `'switch'` | `'checkbox'` | `'radio-group'` | `'slider'` | `'composite'`

Override defaults globally with `provideNgxSignalFormControlPresets()` or per-component with `provideNgxSignalFormControlPresetsForComponent()`.

## Automatic ARIA

`NgxSignalFormAutoAria` is part of `NgxSignalFormToolkit`.

It currently auto-applies to:

- `input[formField]` (except standard `radio` and `checkbox`)
- `input[type="checkbox"][role="switch"][formField]` (switch controls)
- `textarea[formField]`
- `select[formField]`
- custom hosts with `[formField]`

It manages:

- `aria-invalid`
- `aria-required`
- `aria-describedby`

### Rules

- Do **not** manually add `aria-invalid` or `aria-required` for toolkit-managed controls.
- Use `ngxSignalFormAutoAriaDisabled` to opt out per control.
- Use `ngxSignalFormControlAria="manual"` when the control owns its own ARIA contract.
- Prefer real `id` attributes on bound controls so ARIA linkage stays deterministic.
- In standalone Angular, import the toolkit bundle in the component whose template renders the actual `[formField]` element — parent imports don't flow into child templates.

## Errors and Warnings

Warnings are convention-based.

- Blocking errors: `kind` does **not** start with `'warn:'`
- Non-blocking warnings: `kind` starts with `'warn:'`

Use the helper:

```typescript
import { warningError } from '@ngx-signal-forms/toolkit';

return warningError('weak-password', 'Consider using 12+ characters');
```

### ARIA behavior

- Errors use `role="alert"` and assertive live regions.
- Warnings use `role="status"` and polite live regions.

### Submission guidance

- Angular Signal Forms treats all `ValidationError`s as blockers.
- When warnings should not block submission, use toolkit helpers like `canSubmitWithWarnings()` and `submitWithWarnings()`.

## Error Visibility Utilities

Prefer `showErrors()` for reactive visibility logic.

```typescript
import { showErrors } from '@ngx-signal-forms/toolkit';

protected readonly showEmailErrors = showErrors(this.form.email, 'on-touch');
```

- `submittedStatus` is optional for `'on-touch'`.
- `'on-submit'` needs real submission state, usually provided by `ngxSignalForm` alongside `[formRoot]` or by an explicit `submittedStatus` signal you pass yourself.
- Use `combineShowErrors()` when aggregating multiple field visibility signals.
- Use `shouldShowErrors()` only for lower-level imperative logic.

## Error Message Registry

`provideErrorMessages()` is optional.

Message priority is:

1. validator-provided `error.message`
2. registry override
3. toolkit fallback

This is especially useful for:

- centralized built-in validator messages
- i18n
- shared custom-validator wording

```typescript
import { provideErrorMessages } from '@ngx-signal-forms/toolkit';

provideErrorMessages({
  required: 'This field is required',
  email: 'Please enter a valid email address',
  minLength: ({ minLength }) => `At least ${minLength} characters`,
});
```

## Form Field Entry Point

### Use `@ngx-signal-forms/toolkit/form-field` for:

- `NgxFormField`
- `NgxFormFieldWrapper`
- `NgxFormFieldset`

### Wrapper component

`ngx-form-field-wrapper` is the standard styled field wrapper.

Important inputs:

- `formField` — required
- `fieldName` — optional explicit override, otherwise derived from bound control `id`
- `strategy`
- `appearance` — `'stacked' | 'outline' | 'plain' | 'inherit'`
- `errorPlacement` — `'top' | 'bottom'` (default: `'bottom'`)
- `showRequiredMarker`
- `requiredMarker`

Use `appearance="outline"` in new examples. Prefer that over legacy `outline` patterns.

```html
<ngx-form-field-wrapper
  [formField]="form.email"
  appearance="outline"
  errorPlacement="top"
>
  <label for="email">Email</label>
  <input id="email" [formField]="form.email" placeholder=" " />
</ngx-form-field-wrapper>
```

### Grouped fieldsets

`NgxFormFieldset` is the primary grouped-summary API.

Important inputs:

- `fieldsetField` — required
- `fields`
- `fieldsetId`
- `strategy`
- `showErrors`
- `includeNestedErrors`
- `errorPlacement` — `'top' | 'bottom'` (default: `'top'`)

Current grouped summary behavior:

- grouped summaries support explicit top/bottom placement
- grouped summaries render as **bullet lists**

Use `includeNestedErrors="false"` by default when nested wrapped fields show their own errors.
Use `includeNestedErrors` only when the group itself must surface all nested errors.

```html
<ngx-form-fieldset
  [fieldsetField]="form.passwords"
  fieldsetId="passwords"
  errorPlacement="top"
>
  <legend>Passwords</legend>

  <ngx-form-field-wrapper
    [formField]="form.passwords.password"
    appearance="outline"
  >
    <label for="password">Password</label>
    <input
      id="password"
      type="password"
      [formField]="form.passwords.password"
    />
  </ngx-form-field-wrapper>

  <ngx-form-field-wrapper
    [formField]="form.passwords.confirm"
    appearance="outline"
  >
    <label for="confirm-password">Confirm password</label>
    <input
      id="confirm-password"
      type="password"
      [formField]="form.passwords.confirm"
    />
  </ngx-form-field-wrapper>
</ngx-form-fieldset>
```

## Assistive Entry Point

### Use `@ngx-signal-forms/toolkit/assistive` for:

- `NgxFormFieldError`
- `NgxFormFieldErrorSummary`
- `NgxFormFieldHint`
- `NgxFormFieldCharacterCount`
- `NgxFormFieldAssistiveRow`

### `NgxFormFieldError`

Important inputs:

- `formField` — for single-field usage
- `errors` — for pre-aggregated/custom error lists
- `fieldName` — required when standalone unless wrapper context resolves it
- `strategy`
- `submittedStatus`
- `listStyle` — `'plain' | 'bullets'`

Use `listStyle="bullets"` for grouped summaries, not for normal inline single-field feedback.

### `NgxFormFieldErrorSummary`

Form-level error summary (GOV.UK pattern). Aggregates all blocking errors into a focusable list.

Important inputs:

- `formTree` — required (pass the `form`, not `form()`)
- `summaryLabel` — header text (default: `'Please fix the following errors:'`)
- `strategy`
- `submittedStatus`

Uses `role="alert"` + `aria-live="assertive"`. Inherits strategy and submitted status from `ngxSignalForm` context automatically. For full DOM control or warning entries, use `NgxHeadlessErrorSummary` instead.

### `NgxFormFieldHint`

- helper text component
- automatically participates in wrapper assistive layout and described-by linkage

### `NgxFormFieldCharacterCount`

Use current public inputs:

- `formField`
- `maxLength` — may be omitted when auto-detected from validators
- `showLimitColors`
- `colorThresholds`
- `liveAnnounce`

Do not assume `maxLength` is always mandatory in examples.

## Headless Entry Point

Headless primitives are public now. They are **not** “coming soon”.

Use `@ngx-signal-forms/toolkit/headless` when you want toolkit state logic with fully custom markup.

Public directives and helpers include:

**Directives:**

- `NgxHeadlessToolkit` — bundle of all headless directives
- `NgxHeadlessErrorState`
- `NgxHeadlessErrorSummary` — renderless form-level error summary (supports warnings)
- `NgxHeadlessFieldset`
- `NgxHeadlessCharacterCount`
- `NgxHeadlessFieldName`

**Factory functions:**

- `createErrorState()` / `createCharacterCount()` / `createFieldStateFlags()`
- `createUniqueId()`

**Reading utilities:**

- `readErrors()` / `readDirectErrors()` / `readFieldFlag()`
- `dedupeValidationErrors()`
- `humanizeFieldPath()` / `resolveFieldNameFromError()`
- `focusBoundControlFromError()` / `toErrorSummaryEntry()`

## Debugger Entry Point

Use `@ngx-signal-forms/toolkit/debugger` for development-only debugging.

Current public debugger exports include:

- `NgxSignalFormDebugger` — bundle of all debugger components
- `NgxSignalFormDebugger`
- `NgxSignalFormDebuggerBadge` / `NgxSignalFormDebuggerBadgeIcon`
- Types: `NgxSignalFormDebuggerBadgeAppearance`, `NgxSignalFormDebuggerBadgeVariant`

Pass the **field tree** (for example `userForm`), not the root field state (`userForm()`).

## Theming and Styling

The public styling API is CSS custom properties.

Key current themes/features to reflect in examples:

- shared feedback typography variables
- semantic field colors
- wrapper appearance variables
- grouped fieldset variables
- assistive message layout

Do:

```css
ngx-form-field-wrapper {
  --ngx-form-field-color-primary: #3b82f6;
  --ngx-signal-form-feedback-font-size: 0.875rem;
}
```

Avoid:

- `::ng-deep` (or any other shadow-piercing escape hatch)
- targeting internal selectors as if they were public API
- hard-coding private structure assumptions in examples

## Current Do / Don’t

### Do

- use bundle imports when appropriate
- use `form[formRoot]` for basic toolkit forms and add `ngxSignalForm` when you need `'on-submit'`, `submittedStatus`, or shared form context
- use `appearance="outline"`, `appearance="stacked"`, or `appearance="plain"`
- provide real bound-control `id`s
- use explicit `fieldName` when wrapper context or `id` is unavailable
- use `warningError()` for non-blocking guidance
- use `showErrors()` for reactive visibility logic
- use grouped fieldsets for grouped validation summaries
- declare `ngxSignalFormControl` on non-native controls (switches, sliders, composites)
- treat `headless` and `debugger` as real public entry points

### Don’t

- document removed APIs (`computeShowErrors`, `createShowErrorsSignal`, `canSubmit`, `isSubmitting`, `fieldNameResolver`, `strictFieldResolution`, `manual` strategy)
- manually add `aria-invalid`/`aria-required`/`aria-describedby` to toolkit-managed controls
- rely on implicit field-name generation without `id` or `fieldName`
- import assistive or form-field APIs from the root package when they belong to secondary entry points
- skip declaring `ngxSignalFormControl` on non-native controls (switches, sliders, composites) — wrapper and auto-ARIA need it

## Resources

- `packages/toolkit/README.md`
- `packages/toolkit/form-field/README.md`
- `packages/toolkit/form-field/THEMING.md`
- `docs/CSS_FRAMEWORK_INTEGRATION.md`
- `docs/WARNINGS_SUPPORT.md`
- `.github/instructions/angular-signal-forms.instructions.md`
