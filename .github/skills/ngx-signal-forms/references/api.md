# @ngx-signal-forms/toolkit — Public API Reference

## Entry Point: `@ngx-signal-forms/toolkit` (Core)

### Bundle

```typescript
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';
// = [FormRoot, NgxSignalFormDirective, NgxSignalFormAutoAriaDirective]
```

`NgxSignalFormToolkit` bundles Angular `FormRoot` plus the toolkit enhancer directives. Use it with `form[formRoot][ngxSignalForm]`.

### Directives

| Export                           | Selector                        | Description                                                 |
| -------------------------------- | ------------------------------- | ----------------------------------------------------------- |
| `NgxSignalFormDirective`         | `form[formRoot][ngxSignalForm]` | Form context, submitted status, error strategy              |
| `NgxSignalFormAutoAriaDirective` | auto                            | Applies `aria-invalid`, `aria-required`, `aria-describedby` |

**NgxSignalFormDirective input:**

| Input           | Type                   | Default      |
| --------------- | ---------------------- | ------------ |
| `errorStrategy` | `ErrorDisplayStrategy` | `'on-touch'` |

**NgxSignalFormDirective exposed signals:**

- `submittedStatus` — `Signal<'unsubmitted' | 'submitting' | 'submitted'>`

**NgxSignalFormAutoAriaDirective:**

- Applied automatically to text-like `input[formField]`, `textarea[formField]`, `select[formField]`, checkbox switches using `input[type="checkbox"][role="switch"][formField]`, and custom `[formField]` hosts.
- Standard checkboxes and radios remain excluded.
- Opt out per control with `ngxSignalFormAutoAriaDisabled` directive.
- In standalone Angular, import the toolkit bundle or directive in the component whose template renders the actual bound element; parent imports do not flow into child templates.

### Providers

```typescript
provideNgxSignalFormsConfig(config: NgxSignalFormsUserConfig): EnvironmentProviders
provideNgxSignalFormsConfigForComponent(config: NgxSignalFormsUserConfig): Provider[]
provideErrorMessages(configOrFactory: ErrorMessageRegistry | (() => ErrorMessageRegistry)): Provider
provideFieldLabels(configOrFactory: FieldLabelMap | (() => FieldLabelResolver)): Provider
```

### Provider-related exports

```typescript
interface ErrorMessageRegistry {
  [errorKind: string]:
    | string
    | ((params: Record<string, unknown>) => string)
    | undefined;
}

type FieldLabelResolver = (rawFieldPath: string) => string;
type FieldLabelMap = Record<string, string>;
interface NgxSignalFormFieldContext {
  readonly fieldName: Signal<string>;
}
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
type SignalLike<T> = Signal<T> | (() => T)
interface NgxSignalFormsConfig { ... }
type NgxSignalFormsUserConfig = DeepPartial<NgxSignalFormsConfig>
type ResolvedErrorDisplayStrategy = 'immediate' | 'on-touch' | 'on-submit';
type ErrorDisplayStrategy = ResolvedErrorDisplayStrategy | 'inherit';
type FormFieldAppearance = 'standard' | 'outline';
type FormFieldAppearanceInput = FormFieldAppearance | 'inherit';
type SubmittedStatus = 'unsubmitted' | 'submitting' | 'submitted';
type ErrorVisibilityState = Pick<FieldState<unknown>, 'invalid' | 'touched'>
type ErrorReadableState = Pick<FieldState<unknown>, 'errors' | 'invalid' | 'touched'>
type PartialErrorVisibilityState = Partial<ErrorVisibilityState>
interface SplitErrors {
  readonly blocking: ValidationError[]
  readonly warnings: ValidationError[]
}
interface OnInvalidHandlerOptions {
  readonly focusFirstInvalid?: boolean
  readonly afterInvalid?: (field: FieldTree<unknown>) => void
}
```

### Tokens

```typescript
const DEFAULT_NGX_SIGNAL_FORMS_CONFIG: NgxSignalFormsConfig;
const NGX_SIGNAL_FORMS_CONFIG: InjectionToken<NgxSignalFormsConfig>;
const NGX_SIGNAL_FORM_CONTEXT: InjectionToken<NgxSignalFormContext>;
const NGX_SIGNAL_FORM_FIELD_CONTEXT: InjectionToken<NgxSignalFormFieldContext>;
const NGX_ERROR_MESSAGES: InjectionToken<ErrorMessageRegistry>;
const NGX_FIELD_LABEL_RESOLVER: InjectionToken<FieldLabelResolver>;
```

### Utilities

```typescript
// Error visibility
showErrors(field, strategy, submittedStatus?): Signal<boolean>
combineShowErrors(signals: readonly Signal<boolean>[]): Signal<boolean>
shouldShowErrors(isInvalid, isTouched, strategy, submittedStatus): boolean

// Field and control resolution
injectFieldControl<TValue>(element, injector?): FieldTree<TValue>
resolveFieldName(element): string | null
generateErrorId(fieldName: string): string
generateWarningId(fieldName: string): string

// Submission helpers
focusFirstInvalid(form): boolean
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
injectFormContext(injector?): NgxSignalFormContext | undefined

// Message resolution
resolveValidationErrorMessage(error, registry?, options?): string
getDefaultValidationMessage(error, options?): string

// Strategy/context helpers
resolveErrorDisplayStrategy(inputStrategy, contextStrategy?, configDefault?): ResolvedErrorDisplayStrategy
resolveStrategyFromContext(inputStrategy, formContext, configDefault?): ResolvedErrorDisplayStrategy
resolveSubmittedStatusFromContext(inputStatus, formContext): SubmittedStatus | undefined

// Error grouping
splitByKind(errors): { blocking: ValidationError[]; warnings: ValidationError[] }

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

| Input             | Type                        | Notes                                                |
| ----------------- | --------------------------- | ---------------------------------------------------- |
| `formField`       | field                       | Single-field usage                                   |
| `errors`          | `Signal<ValidationError[]>` | Pre-aggregated list (alternative to `formField`)     |
| `fieldName`       | string                      | Required standalone; inherited inside wrapper        |
| `strategy`        | ErrorDisplayStrategy        | Override                                             |
| `submittedStatus` | `SubmittedStatus`           | For `on-submit` without form context                 |
| `listStyle`       | `plain` or `bullets`        | `'plain'` default; `'bullets'` for grouped summaries |

### Other assistive exports

- `NgxFormFieldHintComponent` — static descriptive hint content
- `NgxFormFieldAssistiveRowComponent` — stable row container for hint + character count

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
// Bundle: [NgxSignalFormFieldWrapperComponent,
//          NgxFormFieldHintComponent, NgxFormFieldCharacterCountComponent,
//          NgxFormFieldAssistiveRowComponent, NgxSignalFormErrorComponent,
//          NgxSignalFormFieldset]

import {
  NgxSignalFormFieldWrapperComponent,
  NgxSignalFormFieldset,
} from '@ngx-signal-forms/toolkit/form-field';
```

### NgxSignalFormFieldWrapperComponent inputs

| Input                | Type                                   | Default                                                                                         |
| -------------------- | -------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `formField`          | field                                  | Required                                                                                        |
| `fieldName`          | string                                 | Derived from bound control `id`; pass explicitly for nested custom controls or dynamic identity |
| `strategy`           | ErrorDisplayStrategy                   | Inherited                                                                                       |
| `appearance`         | `'standard' \| 'outline' \| 'inherit'` | `'inherit'`                                                                                     |
| `errorPlacement`     | `'top' \| 'bottom'`                    | `'bottom'`                                                                                      |
| `showRequiredMarker` | boolean                                | From config                                                                                     |
| `requiredMarker`     | string                                 | `'*'`                                                                                           |

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
createFieldStateFlags(fieldState: () => unknown): FieldStateFlags
readErrors(field): ValidationError[]
readDirectErrors(field): ValidationError[]
readFieldFlag(field, key: BooleanStateKey): boolean
dedupeValidationErrors(errors): ValidationError[]
createUniqueId(prefix: string): string
humanizeFieldPath(fieldName: string): string
resolveFieldNameFromError(error, resolver?): string
focusBoundControlFromError(error): void
toErrorSummaryEntry(error, registry?, options?, labelResolver?): ErrorSummaryEntryData
```

### Headless utility/result types

```typescript
type BooleanStateKey = 'invalid' | 'valid' | 'touched' | 'dirty' | 'pending'
type FieldStateLike = { ... }
interface FieldStateFlags { ... }
interface CreateErrorStateOptions<TValue = unknown> { ... }
interface ErrorStateResult { ... }
interface CreateCharacterCountOptions { ... }
interface CharacterCountResult { ... }
interface ErrorSummaryEntryData { ... }
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

import {
  SignalFormDebuggerComponent,
  DebuggerBadgeComponent,
  DebuggerBadgeIconDirective,
  type DebuggerBadgeAppearance,
  type DebuggerBadgeVariant,
} from '@ngx-signal-forms/toolkit/debugger';
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
