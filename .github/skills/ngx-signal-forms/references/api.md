# @ngx-signal-forms/toolkit — Public API Reference

## Entry Point: `@ngx-signal-forms/toolkit` (Core)

### Bundle

```typescript
import { FormField } from '@angular/forms/signals';
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';
// = [FormRoot, NgxSignalForm, NgxSignalFormAutoAria, NgxSignalFormControlSemanticsDirective]
```

`NgxSignalFormToolkit` bundles Angular `FormRoot` plus the toolkit enhancer directives, including `NgxSignalFormControlSemanticsDirective`. Use it on `form[formRoot]`, and add `ngxSignalForm` when you need form context, `submittedStatus`, or `'on-submit'` strategy behavior.

### Directives

| Export                                   | Selector                                    | Description                                                 |
| ---------------------------------------- | ------------------------------------------- | ----------------------------------------------------------- |
| `NgxSignalForm`                          | `form[formRoot][ngxSignalForm]`             | Form context, submitted status, error strategy              |
| `NgxSignalFormAutoAria`                  | auto                                        | Applies `aria-invalid`, `aria-required`, `aria-describedby` |
| `NgxSignalFormControlSemanticsDirective` | `[ngxSignalFormControl]` and related inputs | Declares stable wrapper/ARIA semantics for a control        |

**NgxSignalForm input:**

| Input           | Type                   | Default      |
| --------------- | ---------------------- | ------------ |
| `errorStrategy` | `ErrorDisplayStrategy` | `'on-touch'` |

**NgxSignalForm exposed signals:**

- `submittedStatus` — `Signal<'unsubmitted' | 'submitting' | 'submitted'>`

This enhancer is optional for basic `'on-touch'` flows. Add it when the form needs shared toolkit context, form-level `errorStrategy`, or `submittedStatus` for `'on-submit'` behavior.

**NgxSignalFormAutoAria:**

- Applied automatically to native `input[formField]`, `textarea[formField]`, and `select[formField]` controls (internally mapped to the `input-like` / `standalone-field-like` families), checkbox switches using `input[type="checkbox"][role="switch"][formField]`, and custom `[formField]` hosts.
- Standard checkboxes and radios remain excluded unless the control explicitly opts in with `ngxSignalFormControl`.
- Opt out per control with `ngxSignalFormAutoAriaDisabled` directive.
- Leaves existing `aria-describedby`, `aria-invalid`, and `aria-required` in place when `ngxSignalFormControlAria="manual"` is present.
- In standalone Angular, import the toolkit bundle or directive in the component whose template renders the actual bound element; parent imports do not flow into child templates.

**NgxSignalFormControlSemanticsDirective:**

> The directive class keeps the `Directive` suffix to avoid colliding with the
> `NgxSignalFormControlSemantics` interface that describes the same shape as a
> data type. Templates and `imports: [...]` use the directive class; type
> annotations use the suffix-less interface name.

- Accepts `ngxSignalFormControl="switch"` or an object form like `[ngxSignalFormControl]="{ kind: 'slider', layout: 'stacked' }"` (`'stacked'` here is a control layout — distinct from the `'standard'` appearance).
- Optional overrides: `ngxSignalFormControlLayout`, `ngxSignalFormControlAria`.
- Writes stable `data-ngx-signal-form-control-*` attributes used by the wrapper and auto-ARIA.
- Explicit directive inputs override any preset provider defaults.
- Declares toolkit behavior only; keep real widget semantics such as `role="switch"` on the actual interactive host when applicable.

### Providers

```typescript
provideNgxSignalFormsConfig(config: NgxSignalFormsUserConfig): EnvironmentProviders
provideNgxSignalFormsConfigForComponent(config: NgxSignalFormsUserConfig): Provider[]
provideNgxSignalFormControlPresets(presets: NgxSignalFormControlPresetOverrides): EnvironmentProviders
provideNgxSignalFormControlPresetsForComponent(presets: NgxSignalFormControlPresetOverrides): Provider[]
provideErrorMessages(configOrFactory: ErrorMessageRegistry | (() => ErrorMessageRegistry)): Provider
provideFieldLabels(configOrFactory: FieldLabelMap | (() => (rawFieldPath: string) => string)): Provider
```

**Control semantics preset providers:**

- `provideNgxSignalFormControlPresets(...)` sets global or feature-level defaults for control families.
- `provideNgxSignalFormControlPresetsForComponent(...)` scopes those defaults to a component subtree.
- Prefer these providers for default `ariaMode` / `layout` behavior instead of extending `NgxSignalFormsUserConfig`.

```typescript
export const appConfig = {
  providers: [
    provideNgxSignalFormControlPresets({
      switch: { ariaMode: 'manual' },
      composite: { layout: 'custom' },
    }),
  ],
};
```

### Provider-related exports

```typescript
interface ErrorMessageRegistry {
  [errorKind: string]:
    | string
    | ((params: Record<string, unknown>) => string)
    | undefined;
}

type FieldLabelMap = Record<string, string>;
interface NgxSignalFormFieldContext {
  readonly fieldName: Signal<string | null>;
}
interface NgxSignalFormControlPreset {
  readonly layout: NgxSignalFormControlLayout;
  readonly ariaMode: NgxSignalFormControlAriaMode;
}
type NgxSignalFormControlPresetRegistry = Record<
  NgxSignalFormControlKind,
  NgxSignalFormControlPreset
>;
type NgxSignalFormControlPresetOverrides = Partial<
  Record<NgxSignalFormControlKind, Partial<NgxSignalFormControlPreset>>
>;
type NgxSignalFormControlKind =
  | 'input-like'
  | 'standalone-field-like'
  | 'switch'
  | 'checkbox'
  | 'radio-group'
  | 'slider'
  | 'composite';
type NgxSignalFormControlLayout =
  | 'stacked'
  | 'inline-control'
  | 'group'
  | 'custom';
type NgxSignalFormControlAriaMode = 'auto' | 'manual';
```

### Config Interface

```typescript
interface NgxSignalFormsUserConfig {
  autoAria?: boolean; // default: true
  defaultErrorStrategy?: 'immediate' | 'on-touch' | 'on-submit'; // default: 'on-touch'
  defaultFormFieldAppearance?: 'standard' | 'outline' | 'plain'; // default: 'standard'
  defaultFormFieldOrientation?: 'vertical' | 'horizontal'; // default: 'vertical'
  // Migration: legacy `stacked` → `standard`, legacy `bare` → `plain`.
  showRequiredMarker?: boolean;
  requiredMarker?: string; // default: ' *'
}
```

Migration note for `defaultFormFieldAppearance`:

- `bare` was renamed to `plain` (minimal wrapper chrome)
- `stacked` (briefly the new name during rc.1 – rc.4) was reverted to `standard` in `rc.5`
- Recommended update: `stacked` → `standard`, `bare` → `plain`

### Types

```typescript
type SignalLike<T> = Signal<T> | (() => T);
type ResolvedErrorDisplayStrategy = 'immediate' | 'on-touch' | 'on-submit';
type ErrorDisplayStrategy = ResolvedErrorDisplayStrategy | 'inherit';
type FormFieldAppearance = 'standard' | 'outline' | 'plain';
type FormFieldAppearanceInput = FormFieldAppearance | 'inherit';
type FormFieldOrientation = 'vertical' | 'horizontal';
type FormFieldOrientationInput = FormFieldOrientation | 'inherit';
type SubmittedStatus = 'unsubmitted' | 'submitting' | 'submitted';
type ErrorVisibilityState = Pick<FieldState<unknown>, 'invalid' | 'touched'>;
type ErrorReadableState = Pick<
  FieldState<unknown>,
  'errors' | 'invalid' | 'touched'
>;
interface SplitErrors {
  readonly blocking: ValidationError[];
  readonly warnings: ValidationError[];
}
interface OnInvalidHandlerOptions {
  readonly focusFirstInvalid?: boolean;
  readonly afterInvalid?: (field: FieldTree<unknown>) => void;
}
interface NgxSignalFormControlSemantics {
  readonly kind?: NgxSignalFormControlKind;
  readonly layout?: NgxSignalFormControlLayout;
  readonly ariaMode?: NgxSignalFormControlAriaMode;
}
interface ResolvedNgxSignalFormControlSemantics {
  readonly kind: NgxSignalFormControlKind | null;
  readonly layout: NgxSignalFormControlLayout | null;
  readonly ariaMode: NgxSignalFormControlAriaMode | null;
}
```

### Tokens

```typescript
const DEFAULT_NGX_SIGNAL_FORM_CONTROL_PRESETS: NgxSignalFormControlPresetRegistry;
const NGX_SIGNAL_FORMS_CONFIG: InjectionToken<NgxSignalFormsConfig>;
const NGX_SIGNAL_FORM_CONTROL_PRESETS: InjectionToken<NgxSignalFormControlPresetRegistry>;
const NGX_SIGNAL_FORM_CONTEXT: InjectionToken<NgxSignalFormContext>;
const NGX_SIGNAL_FORM_FIELD_CONTEXT: InjectionToken<NgxSignalFormFieldContext>;
```

> `NGX_ERROR_MESSAGES` and `NGX_FIELD_LABEL_RESOLVER` are internal tokens (used by sibling entry points via `@ngx-signal-forms/toolkit/core`). Use `provideErrorMessages()` and `provideFieldLabels()` instead.

### Utilities

```typescript
// Error visibility
showErrors(field, strategy, submittedStatus?): Signal<boolean>
// `submittedStatus` is optional for 'immediate' and 'on-touch'; REQUIRED for
// 'on-submit' — without it the helper stays at 'unsubmitted' and errors never
// surface (dev mode logs a one-shot console.warn). Inside [formRoot][ngxSignalForm]
// the wrapper, auto-ARIA, and headless directives inherit it automatically.
createShowErrorsComputed(field, strategy, submittedStatus?): Signal<boolean>
// Lower-level extraction used internally by showErrors(), the wrapper,
// NgxFormFieldError, and NgxHeadlessErrorState. Reach for it
// when you already own a FieldState signal and want the same visibility-timing
// rules without routing through showErrors()'s ErrorVisibilityState parameter.
combineShowErrors(signals: readonly Signal<boolean>[]): Signal<boolean>
shouldShowErrors(isInvalid, isTouched, strategy, submittedStatus): boolean

// Field interactivity (drives focus management, wrapper rendering, summary filtering)
isFieldStateInteractive(fieldState): boolean // false when hidden() or disabled(); readonly() counts as interactive
isFieldStateHidden(fieldState): boolean       // narrow check on hidden() only

// Field and control resolution
injectFieldControl<TValue>(element, injector?): FieldTree<TValue>
resolveFieldName(element): string | null
generateErrorId(fieldName: string): string
generateWarningId(fieldName: string): string
buildAriaDescribedBy(fieldName, options: AriaDescribedByChainOptions): string | null
resolveNgxSignalFormControlSemantics(element, presets): ResolvedNgxSignalFormControlSemantics
readNgxSignalFormControlSemantics(element): NgxSignalFormControlSemantics | null
// Reads the declared semantics for a control host without merging preset
// defaults. Useful in tooling / tests that need to know what the consumer
// wrote on the element itself.
inferNgxSignalFormControlKind(element): NgxSignalFormControlKind | null
// Resolves the toolkit control kind from DOM heuristics (tag, type, role).
// This is the fallback path the wrapper and auto-ARIA use when no explicit
// `ngxSignalFormControl` directive or preset applies.

// Type guard utilities
isNgxSignalFormControlKind(value): value is NgxSignalFormControlKind
isNgxSignalFormControlLayout(value): value is NgxSignalFormControlLayout
isNgxSignalFormControlAriaMode(value): value is NgxSignalFormControlAriaMode

interface AriaDescribedByChainOptions {
  readonly baseIds?: readonly string[];     // hint or helper IDs to prepend
  readonly showErrors?: boolean;             // whether the error ID should be in the chain
  readonly showWarnings?: boolean;           // whether the warning ID should be in the chain
}

// Submission helpers
focusFirstInvalid(form): boolean
// Skips errors whose bound field is non-interactive (hidden/disabled) and
// **skips orphan errors** with no field tree — focusing nothing is better than
// stealing focus to an unrelated control.
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
  NgxFormFieldError, // <ngx-form-field-error>
  NgxFormFieldErrorSummary, // <ngx-form-field-error-summary>
  NgxFormFieldHint, // <ngx-form-field-hint>
  NgxFormFieldCharacterCount, // <ngx-form-field-character-count>
  NgxFormFieldAssistiveRow, // <ngx-form-field-assistive-row>
  warningError,
  isWarningError,
  isBlockingError,
} from '@ngx-signal-forms/toolkit/assistive';
```

### NgxFormFieldError inputs

| Input             | Type                        | Notes                                                |
| ----------------- | --------------------------- | ---------------------------------------------------- |
| `formField`       | field                       | Single-field usage                                   |
| `errors`          | `Signal<ValidationError[]>` | Pre-aggregated list (alternative to `formField`)     |
| `fieldName`       | string                      | Required standalone; inherited inside wrapper        |
| `strategy`        | ErrorDisplayStrategy        | Override                                             |
| `submittedStatus` | `SubmittedStatus`           | For `on-submit` without form context                 |
| `listStyle`       | `plain` or `bullets`        | `'plain'` default; `'bullets'` for grouped summaries |

### Other assistive exports

- `NgxFormFieldHint` — static descriptive hint content
- `NgxFormFieldAssistiveRow` — stable row container for hint + character count

### NgxFormFieldErrorSummary inputs

Selector: `ngx-form-field-error-summary`

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

For full DOM control over the error summary (incl. warning entries), use `NgxHeadlessErrorSummary` from `@ngx-signal-forms/toolkit/headless`.

### NgxFormFieldCharacterCount inputs

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
// Bundle: [NgxFormFieldWrapper,
//          NgxFormFieldHint, NgxFormFieldCharacterCount,
//          NgxFormFieldAssistiveRow, NgxFormFieldError,
//          NgxFormFieldset]

import {
  NgxFormFieldWrapper,
  NgxFormFieldset,
} from '@ngx-signal-forms/toolkit/form-field';
```

### NgxFormFieldWrapper inputs

| Input                | Type                                              | Default                                                                                         |
| -------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `formField`          | field                                             | Required                                                                                        |
| `fieldName`          | string                                            | Derived from bound control `id`; pass explicitly for nested custom controls or dynamic identity |
| `strategy`           | ErrorDisplayStrategy                              | Inherited                                                                                       |
| `appearance`         | `'standard' \| 'outline' \| 'plain' \| 'inherit'` | `'inherit'`                                                                                     |
| `orientation`        | `'vertical' \| 'horizontal' \| 'inherit'`         | `'inherit'`                                                                                     |
| `errorPlacement`     | `'top' \| 'bottom'`                               | `'bottom'`                                                                                      |
| `showRequiredMarker` | boolean                                           | From config                                                                                     |
| `requiredMarker`     | string                                            | `' *'`                                                                                          |

### NgxFormFieldset inputs

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
// Bundle: [NgxHeadlessErrorState, NgxHeadlessErrorSummary,
//          NgxHeadlessFieldset, NgxHeadlessCharacterCount,
//          NgxHeadlessFieldName]
```

### Additional exports

Directive-level types and constants also available from this entry point:

- `ErrorStateSignals`, `ResolvedError` — from `NgxHeadlessErrorState`
- `FieldsetStateSignals` — from `NgxHeadlessFieldset`
- `CharacterCountStateSignals`, `CharacterCountLimitState` — from `NgxHeadlessCharacterCount`
- `DEFAULT_WARNING_THRESHOLD` (80), `DEFAULT_DANGER_THRESHOLD` (95) — default thresholds
- `ErrorSummaryEntry`, `ErrorSummarySignals` — from `NgxHeadlessErrorSummary`
- `FieldNameStateSignals` — from `NgxHeadlessFieldName`

### NgxHeadlessErrorState

Selector: `[ngxHeadlessErrorState]` | Export: `#errorState="errorState"`

Inputs: `field` (required), `fieldName` (required), `strategy`

Signals:

- `showErrors()` — whether to display errors now
- `hasErrors()` / `hasWarnings()`
- `resolvedErrors()` / `resolvedWarnings()` — `ResolvedError[]` with `.message`, `.kind`
- `errorId` / `warningId` — stable IDs for `aria-describedby`

### NgxHeadlessErrorSummary

Selector: `[ngxHeadlessErrorSummary]` | Export: `#summary="errorSummary"`

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

Use this directive instead of `NgxFormFieldErrorSummary` when you need full DOM control, want to include warnings, or need a custom design that doesn't match the default styled output.

### NgxHeadlessCharacterCount

Selector: `[ngxHeadlessCharacterCount]` | Export: `#charCount="charCount"`

Inputs: `field` (required), `maxLength`

Signals: `currentLength()`, `resolvedMaxLength()`, `remaining()`, `limitState()` (`'ok'|'warning'|'danger'|'exceeded'`), `hasLimit()`, `isExceeded()`, `percentUsed()` (0–100, clamped)

### NgxHeadlessFieldset

Selector: `[ngxHeadlessFieldset]` | Export: `#fieldset="fieldset"`

Inputs: `fieldsetField` (required), `fields`, `strategy`, `includeNestedErrors`

Signals: `isValid()`, `isInvalid()`, `isTouched()`, `isDirty()`, `aggregatedErrors()`, `aggregatedWarnings()`, `shouldShowErrors()`, `shouldShowWarnings()`

### NgxHeadlessFieldName

Selector: `[ngxHeadlessFieldName]` | Export: `#fieldName="fieldName"`

Inputs: `field` (required), `fieldName`

Signals: `resolvedFieldName()` (`string | null`), `errorId` (`Signal<string | null>`), `warningId` (`Signal<string | null>`)

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
type BooleanStateKey = 'invalid' | 'valid' | 'touched' | 'dirty' | 'pending';
type CharacterCountLimitState = 'ok' | 'warning' | 'danger' | 'exceeded';
type CharacterCountValue = string | readonly unknown[] | null | undefined;

// Minimal shape consumed by field-state helpers (duck-typed — any object that
// exposes these signals works, so tests and adapters don't need to construct
// a full FieldState).
interface FieldStateLike {
  readonly valid: Signal<boolean>;
  readonly invalid: Signal<boolean>;
  readonly touched: Signal<boolean>;
  readonly dirty: Signal<boolean>;
  readonly pending: Signal<boolean>;
}

interface FieldStateFlags {
  readonly isValid: Signal<boolean>;
  readonly isInvalid: Signal<boolean>;
  readonly isTouched: Signal<boolean>;
  readonly isDirty: Signal<boolean>;
  readonly isPending: Signal<boolean>;
}

interface CreateErrorStateOptions<TValue = unknown> {
  readonly field: FieldTree<TValue>;
  readonly fieldName?: string;
  readonly strategy?: ErrorDisplayStrategy;
  readonly submittedStatus?: SignalLike<SubmittedStatus>;
}

interface ErrorStateResult {
  readonly showErrors: Signal<boolean>;
  readonly hasErrors: Signal<boolean>;
  readonly hasWarnings: Signal<boolean>;
  readonly resolvedErrors: Signal<readonly ResolvedError[]>;
  readonly resolvedWarnings: Signal<readonly ResolvedError[]>;
  readonly errorId: Signal<string | null>;
  readonly warningId: Signal<string | null>;
}

interface CreateCharacterCountOptions {
  readonly field: FieldTree<CharacterCountValue>;
  readonly maxLength?: SignalLike<number | null | undefined>;
}

interface CharacterCountResult {
  readonly currentLength: Signal<number>;
  readonly resolvedMaxLength: Signal<number | null>;
  readonly remaining: Signal<number | null>;
  readonly limitState: Signal<CharacterCountLimitState>;
  readonly hasLimit: Signal<boolean>;
  readonly isExceeded: Signal<boolean>;
  readonly percentUsed: Signal<number>;
}

interface ErrorSummaryEntryData {
  readonly kind: string;
  readonly message: string;
  readonly fieldName: string;
}
```

---

## Entry Point: `@ngx-signal-forms/toolkit/vest`

```typescript
import {
  VEST_ERROR_KIND_PREFIX, // 'vest:'
  VEST_WARNING_KIND_PREFIX, // 'warn:vest:'
  validateVest,
  validateVestWarnings,
  type ValidateVestOptions,
  type VestOnlyFieldSelector,
} from '@ngx-signal-forms/toolkit/vest';

interface ValidateVestOptions<TValue = unknown> {
  includeWarnings?: boolean; // default: false — surface warn() as toolkit warnings
  resetOnDestroy?: boolean; // default: false — call suite.reset() on DestroyRef teardown
  only?: VestOnlyFieldSelector<TValue>; // default: undefined — focus the run on a field
}

type VestOnlyFieldSelector<TValue> = (
  ctx: FieldContext<TValue>,
) => string | readonly string[] | undefined;
```

The blocking and warning `kind` prefixes are public so custom error strategies,
debugger filters, and tests can detect Vest-origin errors without re-deriving
the string literal:

```typescript
const isVestWarning = (kind: string) =>
  kind.startsWith(VEST_WARNING_KIND_PREFIX);
```

See `packages/toolkit/vest/README.md` for the full suite-lifecycle rationale
(why `resetOnDestroy` matters for module-scope suites, async thenable handling,
`only()` selector patterns).

---

## Entry Point: `@ngx-signal-forms/toolkit/debugger`

```typescript
// Bundle (recommended): the panel + the badge directives
import { NgxSignalFormDebuggerToolkit } from '@ngx-signal-forms/toolkit/debugger';
// = [NgxSignalFormDebugger, NgxSignalFormDebuggerBadge, NgxSignalFormDebuggerBadgeIcon]

// Individual imports
import {
  NgxSignalFormDebugger,
  NgxSignalFormDebuggerBadge,
  NgxSignalFormDebuggerBadgeIcon,
  type NgxSignalFormDebuggerBadgeAppearance,
  type NgxSignalFormDebuggerBadgeVariant,
} from '@ngx-signal-forms/toolkit/debugger';
```

### NgxSignalFormDebugger inputs

| Input           | Type                 | Notes                                |
| --------------- | -------------------- | ------------------------------------ |
| `formTree`      | field tree           | Required — pass `form`, not `form()` |
| `errorStrategy` | ErrorDisplayStrategy | Highlight a specific strategy        |
| `title`         | string               | Panel title                          |
| `subtitle`      | string               | Panel subtitle                       |

### NgxSignalFormDebuggerBadge / NgxSignalFormDebuggerBadgeIcon

Exposed for advanced customization (the debugger panel composes them
internally). Use the standalone badge directive when you want a compact status
chip inline with your form — e.g., next to a submit button — without the full
panel.

```typescript
type NgxSignalFormDebuggerBadgeAppearance = 'solid' | 'outline';
type NgxSignalFormDebuggerBadgeVariant =
  | 'neutral'
  | 'success'
  | 'warning'
  | 'danger';
```

### Production tree-shaking

The debugger component self-guards rendering with `isDevMode()`, so a
production build ships zero DOM even if the element is unconditionally placed.
**For true bundle tree-shaking** (dropping the ~13 KB JS + ~15 KB SCSS at
build time), wrap the element in an `@if (isDevMode())` block so the compiler
can drop the code path entirely.

### Theming

CSS hooks use the shorter `--ngx-debugger-*` prefix. The selector prefix
`ngx-signal-form-debugger-*` is reserved for element and directive names.

```css
ngx-signal-form-debugger {
  --ngx-debugger-bg: #ffffff;
  --ngx-debugger-border-color: #e5e7eb;
  --ngx-debugger-text-color: #111827;
  --ngx-debugger-color-success: #22c55e;
  --ngx-debugger-color-warning: #f59e0b;
  --ngx-debugger-color-danger: #ef4444;
  --ngx-debugger-font-size-base: 0.875rem;
  --ngx-debugger-border-radius: 0.5rem;
}
```

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
