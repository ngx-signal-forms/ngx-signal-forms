# @ngx-signal-forms/toolkit — Public API Reference

## Entry Point: `@ngx-signal-forms/toolkit` (Core)

### Bundle

```typescript
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';
// = [NgxSignalFormDirective, NgxSignalFormAutoAriaDirective]
```

### Directives

| Export                           | Selector                        | Description                                                 |
| -------------------------------- | ------------------------------- | ----------------------------------------------------------- |
| `NgxSignalFormDirective`         | `form[formRoot][ngxSignalForm]` | Form context, submitted status, error strategy              |
| `NgxSignalFormAutoAriaDirective` | auto                            | Applies `aria-invalid`, `aria-required`, `aria-describedby` |

**NgxSignalFormDirective inputs:**

| Input           | Type                   | Default      |
| --------------- | ---------------------- | ------------ |
| `formRoot`      | field tree             | required     |
| `errorStrategy` | `ErrorDisplayStrategy` | `'on-touch'` |

**NgxSignalFormDirective exposed signals:**

- `submittedStatus` — `Signal<'unsubmitted' | 'submitting' | 'submitted'>`

**NgxSignalFormAutoAriaDirective:**

- Applied automatically to `input[formField]` (except radio/checkbox), `textarea[formField]`, `select[formField]`, and custom `[formField]` hosts.
- Opt out per control with `ngxSignalFormAutoAriaDisabled` directive.

### Providers

```typescript
provideNgxSignalFormsConfig(config: NgxSignalFormsUserConfig): EnvironmentProviders
provideNgxSignalFormsConfigForComponent(config: NgxSignalFormsUserConfig): Provider[]
provideErrorMessages(messages: Record<string, string | ((params) => string)>): Provider
```

### Config Interface

```typescript
interface NgxSignalFormsUserConfig {
  autoAria?: boolean; // default: true
  defaultErrorStrategy?: 'immediate' | 'on-touch' | 'on-submit'; // default: 'on-touch'
  defaultFormFieldAppearance?: 'standard' | 'outline'; // default: 'standard'
  showRequiredMarker?: boolean;
  requiredMarker?: string; // default: '*'
}
```

### Types

```typescript
type ResolvedErrorDisplayStrategy = 'immediate' | 'on-touch' | 'on-submit';
type ErrorDisplayStrategy = ResolvedErrorDisplayStrategy | 'inherit';
type FormFieldAppearance = 'standard' | 'outline';
type FormFieldAppearanceInput = FormFieldAppearance | 'inherit';
type SubmittedStatus = 'unsubmitted' | 'submitting' | 'submitted';
```

### Utilities

```typescript
// Error visibility
showErrors(field, strategy, submittedStatus?): Signal<boolean>
combineShowErrors(...signals): Signal<boolean>
shouldShowErrors(field, strategy, submittedStatus?): boolean

// Submission helpers
focusFirstInvalid(form): void
createOnInvalidHandler(options?): (form) => void
createSubmittedStatusTracker(form): Signal<SubmittedStatus>
hasSubmitted(form): Signal<boolean>

// Warning helpers (also exported from assistive)
warningError(kind: string, message: string): ValidationError
isWarningError(error): boolean
isBlockingError(error): boolean
hasOnlyWarnings(errors): boolean
getBlockingErrors(errors): ValidationError[]
canSubmitWithWarnings(form): boolean
submitWithWarnings(form, callback): Promise<void>

// Form context injection
injectFormContext(): NgxSignalFormDirective | undefined

// Immutable array helpers
updateAt(array, index, updater): array
updateNested(array, index, nestedKey, nestedIndex, updater): array

// Other
unwrapValue(signalOrValue): value
```

---

## Entry Point: `@ngx-signal-forms/toolkit/assistive`

```typescript
import {
  NgxSignalFormErrorComponent, // <ngx-signal-form-error>
  NgxSignalFormErrorSummaryComponent, // <ngx-signal-form-error-summary>
  NgxFormFieldHintComponent, // <ngx-form-field-hint>
  NgxFormFieldCharacterCountComponent, // <ngx-form-field-character-count>
  NgxFormFieldAssistiveRowComponent, // <ngx-form-field-assistive-row>
  warningError,
  isWarningError,
  isBlockingError,
} from '@ngx-signal-forms/toolkit/assistive';
```

### NgxSignalFormErrorComponent inputs

| Input             | Type                    | Notes                                                |
| ----------------- | ----------------------- | ---------------------------------------------------- |
| `formField`       | field                   | Single-field usage                                   |
| `errors`          | ValidationError[]       | Pre-aggregated list (alternative to `formField`)     |
| `fieldName`       | string                  | Required standalone; inherited inside wrapper        |
| `strategy`        | ErrorDisplayStrategy    | Override                                             |
| `submittedStatus` | Signal<SubmittedStatus> | For `on-submit` without `[formRoot]`                 |
| `listStyle`       | `'plain' \| 'bullets'`  | `'plain'` default; `'bullets'` for grouped summaries |

### NgxSignalFormErrorSummaryComponent inputs

Selector: `ngx-signal-form-error-summary`

| Input             | Type                 | Default                              | Notes                                   |
| ----------------- | -------------------- | ------------------------------------ | --------------------------------------- |
| `formTree`        | `FieldTree<unknown>` | required                             | Root form tree to aggregate errors from |
| `summaryLabel`    | string               | `'Please fix the following errors:'` | Header text above the error list        |
| `strategy`        | ErrorDisplayStrategy | Inherited from form context          | Override error display strategy         |
| `submittedStatus` | SubmittedStatus      | Inherited from form context          | Manual submission status override       |

Renders a styled GOV.UK-pattern list of blocking errors only (no warnings). Each entry is a focusable button that calls `focusBoundControl()` on click. Inherits `errorStrategy` and `submittedStatus` from `ngxSignalForm` context automatically. Uses `role="alert"` + `aria-live="assertive"`. Deduplicated — same error shown once even if multiple fields produce it.

**CSS custom properties for theming:**

- `--ngx-error-summary-border-color` (default: `#dc2626`)
- `--ngx-error-summary-bg` (default: `#fef2f2`)
- `--ngx-error-summary-label-color` (default: `#991b1b`)
- `--ngx-error-summary-link-color` (default: `#dc2626`)
- `--ngx-error-summary-link-hover-color` (default: `#991b1b`)
- `--ngx-error-summary-focus-color` (default: `#2563eb`)

For full DOM control over the error summary (incl. warning entries), use `NgxHeadlessErrorSummaryDirective` from `@ngx-signal-forms/toolkit/headless`.

### NgxFormFieldCharacterCountComponent inputs

| Input             | Type                                  | Notes                                   |
| ----------------- | ------------------------------------- | --------------------------------------- |
| `formField`       | field                                 | Required                                |
| `maxLength`       | number                                | Auto-detected from validator if omitted |
| `showLimitColors` | boolean                               | Default: `true`                         |
| `colorThresholds` | `{ warning: number, danger: number }` | Default: `{ warning: 80, danger: 95 }`  |
| `liveAnnounce`    | boolean                               | SR live announcement                    |

---

## Entry Point: `@ngx-signal-forms/toolkit/form-field`

```typescript
import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';
// Bundle: [NgxSignalFormFieldWrapperComponent, NgxFloatingLabelDirective,
//          NgxFormFieldHintComponent, NgxFormFieldCharacterCountComponent,
//          NgxFormFieldAssistiveRowComponent, NgxSignalFormErrorComponent,
//          NgxSignalFormFieldset]
```

### NgxSignalFormFieldWrapperComponent inputs

| Input                | Type                                   | Default                         |
| -------------------- | -------------------------------------- | ------------------------------- |
| `formField`          | field                                  | Required                        |
| `fieldName`          | string                                 | Derived from bound control `id` |
| `strategy`           | ErrorDisplayStrategy                   | Inherited                       |
| `appearance`         | `'standard' \| 'outline' \| 'inherit'` | `'standard'`                    |
| `errorPlacement`     | `'top' \| 'bottom'`                    | `'bottom'`                      |
| `showRequiredMarker` | boolean                                | From config                     |
| `requiredMarker`     | string                                 | `'*'`                           |

### NgxSignalFormFieldset inputs

| Input                 | Type                 | Default                   |
| --------------------- | -------------------- | ------------------------- |
| `fieldsetField`       | field tree           | Required                  |
| `fields`              | field[]              | Auto-traversed if omitted |
| `fieldsetId`          | string               | Auto-generated            |
| `strategy`            | ErrorDisplayStrategy | Inherited                 |
| `showErrors`          | boolean              | `true`                    |
| `includeNestedErrors` | boolean              | `false`                   |
| `errorPlacement`      | `'top' \| 'bottom'`  | `'top'`                   |

---

## Entry Point: `@ngx-signal-forms/toolkit/headless`

```typescript
import { NgxHeadlessToolkit } from '@ngx-signal-forms/toolkit/headless';
// Bundle: [NgxHeadlessErrorStateDirective, NgxHeadlessErrorSummaryDirective,
//          NgxHeadlessFieldsetDirective, NgxHeadlessCharacterCountDirective,
//          NgxHeadlessFieldNameDirective]
```

### NgxHeadlessErrorStateDirective

Selector: `[ngxSignalFormHeadlessErrorState]` | Export: `#errorState="errorState"`

Inputs: `field` (required), `fieldName` (required), `strategy`

Signals:

- `showErrors()` — whether to display errors now
- `hasErrors()` / `hasWarnings()`
- `resolvedErrors()` / `resolvedWarnings()` — `ResolvedError[]` with `.message`, `.kind`
- `errorId` / `warningId` — stable IDs for `aria-describedby`

### NgxHeadlessErrorSummaryDirective

Selector: `[ngxSignalFormHeadlessErrorSummary]` | Export: `#summary="errorSummary"`

Inputs: `formTree` (required), `strategy`, `submittedStatus`

Signals/methods (implements `ErrorSummarySignals`):

- `entries()` — `ErrorSummaryEntry[]` — blocking errors ready for rendering
- `warningEntries()` — `ErrorSummaryEntry[]` — warning entries (not available in styled component)
- `hasErrors()` / `hasWarnings()`
- `shouldShow()` — computed from strategy + submittedStatus
- `focusFirst()` — focus the control for the first error entry

`ErrorSummaryEntry` interface:

```typescript
interface ErrorSummaryEntry {
  readonly kind: string;
  readonly message: string;
  readonly fieldName: string;
  readonly focus: () => void; // focuses the bound control
}
```

Use this directive instead of `NgxSignalFormErrorSummaryComponent` when you need full DOM control, want to include warnings, or need a custom design that doesn't match the default styled output.

### NgxHeadlessCharacterCountDirective

Selector: `[ngxSignalFormHeadlessCharacterCount]` | Export: `#charCount="charCount"`

Inputs: `field` (required), `maxLength`

Signals: `currentLength()`, `maxLength()`, `remaining()`, `percentage()`, `limitState()` (`'ok'|'warning'|'danger'|'exceeded'`)

### NgxHeadlessFieldsetDirective

Selector: `[ngxSignalFormHeadlessFieldset]` | Export: `#fieldset="fieldset"`

Inputs: `fieldsetField` (required), `fields`, `strategy`, `includeNestedErrors`

Signals: `isValid()`, `isInvalid()`, `isTouched()`, `isDirty()`, `aggregatedErrors()`, `aggregatedWarnings()`, `shouldShowErrors()`, `shouldShowWarnings()`

### NgxHeadlessFieldNameDirective

Selector: `[ngxSignalFormHeadlessFieldName]` | Export: `#fieldName="fieldName"`

Inputs: `field` (required), `fieldName`

Signals: `resolvedFieldName()`, `errorId`, `warningId`, `hintId`

### Utility Functions

```typescript
createErrorState(options: CreateErrorStateOptions): ErrorStateResult
createCharacterCount(options: CreateCharacterCountOptions): CharacterCountResult
readErrors(field): ValidationError[]
readDirectErrors(field): ValidationError[]
readFieldFlag(field, key: BooleanStateKey): boolean
dedupeValidationErrors(errors): ValidationError[]
createUniqueId(prefix: string): string
```

---

## Entry Point: `@ngx-signal-forms/toolkit/vest`

```typescript
import {
  validateVest,
  validateVestWarnings,
  type ValidateVestOptions,
} from '@ngx-signal-forms/toolkit/vest';

interface ValidateVestOptions {
  includeWarnings?: boolean; // default: false
}
```

---

## Entry Point: `@ngx-signal-forms/toolkit/debugger`

```typescript
import { NgxSignalFormDebugger } from '@ngx-signal-forms/toolkit/debugger';
// Bundle: [SignalFormDebuggerComponent, DebuggerBadgeComponent, DebuggerBadgeIconDirective]
```

### SignalFormDebuggerComponent inputs

| Input           | Type                 | Notes                                |
| --------------- | -------------------- | ------------------------------------ |
| `formTree`      | field tree           | Required — pass `form`, not `form()` |
| `errorStrategy` | ErrorDisplayStrategy | Highlight a specific strategy        |
| `title`         | string               | Panel title                          |
| `subtitle`      | string               | Panel subtitle                       |

---

## CSS Custom Properties (Theming)

Set on a container element or `:root`:

```css
/* Feedback typography */
--ngx-signal-form-feedback-font-size: 0.875rem;
--ngx-signal-form-feedback-line-height: 1.25;
--ngx-signal-form-feedback-margin-top: 0.5rem;

/* Semantic colors */
--ngx-signal-form-error-color: #dc2626;
--ngx-signal-form-warning-color: #f59e0b;

/* Form field */
--ngx-form-field-color-primary: #3b82f6;
```

See `packages/toolkit/form-field/THEMING.md` for the full property list (20+).
