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

**NgxSignalForm inputs:**

| Input             | Type                             | Default      |
| ----------------- | -------------------------------- | ------------ |
| `errorStrategy`   | `ResolvedErrorDisplayStrategy`   | `'on-touch'` |
| `warningStrategy` | `ResolvedWarningDisplayStrategy` | `'on-touch'` |

`'inherit'` is excluded at form level (there is nothing above the form root to inherit from), so binding it here is a compile error.

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

// Swap how the wrapper / fieldset renders the error and hint slots. Pass
// `{ component }` to set a standalone renderer component; pass `{}` to inherit
// a parent scope's renderer. See `docs/CUSTOM_WRAPPERS.md`.
provideFormFieldErrorRenderer(override: NgxFormFieldErrorRendererOverride): EnvironmentProviders
provideFormFieldErrorRendererForComponent(override: NgxFormFieldErrorRendererOverride): Provider[]
provideFormFieldHintRenderer(override: NgxFormFieldHintRendererOverride): EnvironmentProviders
provideFormFieldHintRendererForComponent(override: NgxFormFieldHintRendererOverride): Provider[]
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
    string | ((params: Record<string, unknown>) => string) | undefined;
}

type FieldLabelMap = Record<string, string>;
type FieldLabelResolver = (rawFieldPath: string) => string;
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
  'stacked' | 'inline-control' | 'group' | 'custom';
type NgxSignalFormControlAriaMode = 'auto' | 'manual';
```

### Config Interface

```typescript
interface NgxSignalFormsUserConfig {
  autoAria?: boolean; // default: true
  defaultErrorStrategy?: 'immediate' | 'on-touch' | 'on-submit'; // default: 'on-touch'
  defaultFormFieldAppearance?: 'standard' | 'outline' | 'plain'; // default: 'standard'
  defaultFormFieldOrientation?: 'vertical' | 'horizontal'; // default: 'vertical'
  defaultWarningStrategy?: ResolvedWarningDisplayStrategy; // default: 'on-touch' — warnings follow their own cascade, independent of errorStrategy
  // Migration: legacy `stacked` → `standard`, legacy `bare` → `plain`.
  showMarkerWhen?: 'required' | 'optional' | 'none'; // default: 'required'
  requiredMarker?: string; // default: ' *'
  optionalMarker?: string; // default: ' (optional)'
  requiredLegendText?: string; // default: '{marker} indicates a required field'
  optionalLegendText?: string; // default: 'All fields are required unless marked {marker}'
}
```

Migration note for `defaultFormFieldAppearance`:

- `bare` was renamed to `plain` (minimal wrapper chrome)
- the current release-candidate surface uses `standard` for the default appearance
- Recommended update: `stacked` → `standard`, `bare` → `plain`

### Types

```typescript
type SignalLike<T> = Signal<T> | (() => T);
type ReactiveOrStatic<T> = SignalLike<T> | T; // a plain value or a reactive source
type ResolvedErrorDisplayStrategy = 'immediate' | 'on-touch' | 'on-submit';
type ErrorDisplayStrategy = ResolvedErrorDisplayStrategy | 'inherit';
type ResolvedWarningDisplayStrategy = 'immediate' | 'on-touch' | 'on-submit';
type WarningDisplayStrategy = ResolvedWarningDisplayStrategy | 'inherit';
type FormFieldAppearance = 'standard' | 'outline' | 'plain';
type FormFieldAppearanceInput = FormFieldAppearance | 'inherit';
type FormFieldOrientation = 'vertical' | 'horizontal';
type FormFieldOrientationInput = FormFieldOrientation | 'inherit';
type SubmittedStatus = 'unsubmitted' | 'submitting' | 'submitted';
type FieldMarkingMode = 'required' | 'optional' | 'none';
type MarkerKind = Exclude<FieldMarkingMode, 'none'>; // 'required' | 'optional'
interface ResolvedMarker {
  readonly kind: MarkerKind;
  readonly text: string;
}
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
const NGX_FORM_FIELD_ERROR_RENDERER: InjectionToken<NgxFormFieldErrorRenderer | null>;
const NGX_FORM_FIELD_HINT_RENDERER: InjectionToken<NgxFormFieldHintRenderer | null>;
```

**Renderer-override types** (for the providers/tokens above — a renderer is a `{ component }` wrapper around a standalone component that owns the error/hint slot markup):

```typescript
interface NgxFormFieldErrorRenderer {
  readonly component: Type<unknown>;
}
interface NgxFormFieldHintRenderer {
  readonly component: Type<unknown>;
}
interface NgxFormFieldErrorRendererOverride {
  readonly component?: Type<unknown>; // omit `component` to inherit a parent scope
}
interface NgxFormFieldHintRendererOverride {
  readonly component?: Type<unknown>;
}
type NgxFormFieldErrorPlacement = 'top' | 'bottom';
```

> `NGX_ERROR_MESSAGES` and `NGX_FIELD_LABEL_RESOLVER` are internal tokens used by sibling entry points inside the toolkit package. Use `provideErrorMessages()` and `provideFieldLabels()` instead.

### Utilities

```typescript
// Error visibility
createShowErrorsComputed(field, strategy, submittedStatus?): Signal<boolean>
// `submittedStatus` is optional for 'immediate' and 'on-touch'; REQUIRED for
// 'on-submit' — without it the helper stays at 'unsubmitted' and errors never
// surface (dev mode logs a one-shot console.warn). Inside [formRoot][ngxSignalForm]
// the wrapper, auto-ARIA, and headless directives inherit it automatically.
// This is the shared visibility-timing primitive behind the wrapper,
// NgxFormFieldError, and NgxHeadlessErrorState. Not the same as
// shouldShowErrors() below — that's a pure boolean predicate, not a signal.
combineShowErrors(signals: readonly Signal<boolean>[]): Signal<boolean>
shouldShowErrors(isInvalid, isTouched, strategy, submittedStatus): boolean
shouldShowWarnings(hasWarnings, isTouched, strategy, submittedStatus): boolean
// Warning-specific counterpart to shouldShowErrors: checks warning presence,
// not invalidity — warnings never affect the `invalid` state.

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
isFormFieldAppearance(value): value is FormFieldAppearance
isFormFieldOrientation(value): value is FormFieldOrientation

// Field-name normalization
normalizeFieldName(fieldName): string | null // trim; empty/whitespace/nullish → null
resolveFieldNameFromCandidates(...candidates): string | null // first non-null normalized candidate wins
isElementCssVisible(element): boolean // used by field identity / focus management

// Layout probe for `createAriaInvalidSignal`'s third argument. Registers one
// `afterEveryRender` (probe in `earlyRead`, publish in `write`) and returns a
// reactive `Signal<boolean>`. `resolveElement` must return the element that
// CARRIES `aria-invalid`, not necessarily the wrapper host. Fails open:
// starts `true` and stays `true` while `resolveElement` returns `null`.
// Reach for it when the wrapper has no render hook of its own; a wrapper or
// shim that already runs `afterEveryRender` calls `isElementCssVisible` in
// its own `earlyRead` instead.
createControlVisibilitySignal(resolveElement, injector): Signal<boolean>

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
resolveWarningStrategy(inputStrategy, contextStrategy?, configDefault?): ResolvedWarningDisplayStrategy
resolveWarningStrategyFromContext(inputStrategy, formContext, configDefault?): ResolvedWarningDisplayStrategy
// Warning cascade (input → form context → config default → 'on-touch') is
// independent of the error cascade.
resolveSubmittedStatusFromContext(inputStatus, formContext): SubmittedStatus | undefined

// Error grouping
splitByKind(errors): { blocking: ValidationError[]; warnings: ValidationError[] }

// Immutable array helpers
updateAt(array, index, updater): array
updateNested(array, index, nestedKey, nestedIndex, updater): array

// Other
unwrapValue(signalOrValue): value
```

### Standard Schema required markers

Surfaces `aria-required` for fields validated by a Standard Schema (Zod, Valibot, etc.) instead of Angular's `required()`. Call it inside a schema definition, like `required()`:

```typescript
requiredFromStandardSchema(field, schema): void
// e.g. within a form schema:
//   requiredFromStandardSchema(path.firstName, TravelerSchema);

// Narrowed structural contract — only reads `~standard.validate`:
interface StandardSchemaLike<TInput = unknown> {
  readonly '~standard': {
    readonly validate: (value: unknown) =>
      | StandardSchemaLikeResult<TInput>
      | PromiseLike<StandardSchemaLikeResult<TInput>>;
  };
}
interface StandardSchemaLikeIssue {
  readonly message: string;
  readonly path?: ReadonlyArray<PropertyKey | { readonly key: PropertyKey }>;
}
interface StandardSchemaLikeResult<TInput> {
  readonly issues?: ReadonlyArray<StandardSchemaLikeIssue>;
  readonly value?: TInput;
}
```

### Advanced / custom-wrapper exports

These are public but only needed when building custom wrappers or low-level primitives — most consumers never touch them.

```typescript
// Low-level error-visibility factory (backs NgxSignalFormAutoAria and headless
// factories). Reach for it when hand-rolling a directive that needs the same
// strategy/submittedStatus resolution.
createErrorVisibility(options: CreateErrorVisibilityOptions): ControlVisibilitySignal
// CreateErrorVisibilityOptions: { strategy?, submittedStatus?, configDefault?, injector? }

// Services
NgxFieldIdentity        // resolves/tracks a control's field identity
NgxControlPresetRegistry // resolves control-semantics preset defaults

// Element-scoped field identity for a third-party wrapper. Selectorless —
// compose it on your wrapper's HOST via hostDirectives, which is what puts
// NgxFieldIdentity on the element injector your contained controls resolve
// through. Use it when the field's name is NOT the bound control's `id`
// (a widget that generates its own inner id; a role="group" cluster).
// See docs/CUSTOM_WRAPPERS.md and ADR-0011.
@Directive({ providers: [NgxFieldIdentity] })
class NgxFieldIdentityProvider {
  readonly fieldName: InputSignal<string | null | undefined>;
  // string    -> the resolved name (trimmed); all generated ids derive from it
  // null      -> bound but unresolvable yet; ARIA wiring is skipped, and it does
  //              NOT fall back to the control's `id`
  // unbound   -> publishes nothing, leaving the name to the composing component.
  //              Providing an identity still claims the naming channel, so a
  //              provider nobody drives logs a dev warning.
}
// Usage:
//   hostDirectives: [{ directive: NgxFieldIdentityProvider, inputs: ['fieldName'] }]
// It publishes the field-NAME channel only. Hints and display timing keep
// resolving through the two registries below — identity shadows them per
// channel, not by presence (ADR-0010).
// NgxFormFieldWrapper composes this same directive rather than providing
// NgxFieldIdentity itself, so the built-in wrapper runs on the public seam.
// If your component declares its own input under the SAME public name (as the
// wrapper does), Angular feeds one attribute to both it and the exposed
// host-directive input — consumers bind `fieldName` once. Declare a different
// name and you are asking for two bindings.

// Third-party wrapper hint-registry contract (link projected hints into
// aria-describedby without auto-ARIA querying the DOM). See docs/CUSTOM_WRAPPERS.md.
const NGX_SIGNAL_FORM_HINT_REGISTRY: InjectionToken<NgxSignalFormHintRegistry>;
interface NgxSignalFormHintDescriptor { readonly id: string; readonly fieldName: string | null }
interface NgxSignalFormHintRegistry { readonly hints: Signal<readonly NgxSignalFormHintDescriptor[]> }

// Wrapper-less standalone error surfaces (e.g. a sibling <ngx-form-field-error>
// with its own strategy/warningStrategy overrides) publish their resolved
// visibility here so auto-ARIA's aria-describedby mirrors what is actually
// rendered. Auto-ARIA reads this whenever no NgxFieldIdentity has PUBLISHED a
// strategy for the channel — including when an identity exists but owns only
// the field name. The error and warning channels fall back independently
// (ADR-0007, ADR-0010). See docs/CUSTOM_CONTROLS.md for the worked example.
const NGX_SIGNAL_FORM_FIELD_VISIBILITY_REGISTRY: InjectionToken<NgxSignalFormFieldVisibilityRegistry>;
interface NgxSignalFormFieldVisibilityDescriptor {
  readonly fieldName: string;
  readonly errorContainerVisible: Signal<boolean>;
  readonly warningContainerVisible: Signal<boolean>;
}
interface NgxSignalFormFieldVisibilityRegistry {
  register(descriptor: NgxSignalFormFieldVisibilityDescriptor): () => void; // returns unregister
  get(fieldName: string): NgxSignalFormFieldVisibilityDescriptor | undefined;
}
```

---

## Entry Point: `@ngx-signal-forms/toolkit/assistive`

```typescript
import {
  NgxFormFieldError, // <ngx-form-field-error>
  NgxFormFieldErrorSummary, // <ngx-form-field-error-summary>
  NgxFormFieldHint, // <ngx-form-field-hint>
  NgxFormFieldCharacterCount, // <ngx-form-field-character-count>
  NgxFormMarkingLegend, // <ngx-form-marking-legend>
} from '@ngx-signal-forms/toolkit/assistive';
import {
  warningError,
  isWarningError,
  isBlockingError,
} from '@ngx-signal-forms/toolkit';
```

### NgxFormFieldError inputs

Selector: `ngx-form-field-error`. Two presentations share this one component
— there is no separate notification component (folded in pre-1.0; see
`docs/migrations/v1.0.0-rc.12.md`).

| Input             | Type                                           | Notes                                                                                                       |
| ----------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `formField`       | field                                          | Single-field usage (`presentation="inline"`)                                                                |
| `errors`          | `ReactiveOrStatic<readonly ValidationError[]>` | Pre-aggregated, grouped source (alternative to `formField`); takes priority — strategy is bypassed          |
| `fieldName`       | string                                         | Required standalone; inherited inside wrapper                                                               |
| `strategy`        | ErrorDisplayStrategy                           | Override; ignored when `errors` is bound                                                                    |
| `warningStrategy` | WarningDisplayStrategy                         | Override warning display strategy (defaults to `'on-touch'`)                                                |
| `submittedStatus` | `SubmittedStatus`                              | For `on-submit` without form context                                                                        |
| `listStyle`       | `plain` or `bullets`                           | `'plain'` default; `'bullets'` for grouped summaries                                                        |
| `title`           | string                                         | Optional heading rendered above a visible container's messages                                              |
| `presentation`    | `'inline' \| 'panel'`                          | `'inline'` (default) = bare per-field messages; `'panel'` = bordered notification card for grouped feedback |

`errors` and `title` are the two inputs to reach for when building a grouped
notification: `presentation="panel"` with `[errors]` bound is content-driven
tone routing (no `tone` input) — any blocking error renders the `role="alert"`
container, a warning-only list renders the `role="status"` container, and an
empty list keeps both hidden. Uses dual stable live regions so the role is
never re-assigned at the same tick content is inserted.

### Other assistive exports

- `NgxFormFieldHint` — static descriptive hint content. Accepts an `id` input:
  a static `id="…"` attribute or a property-bound `[id]="expr"` both feed the
  `aria-describedby` wiring; when omitted, a stable id is generated.
- `NgxFormFieldListStyle` (`'plain' | 'bullets'`) — shared list-style union. `NgxFormFieldErrorListStyle` is a `@deprecated` alias of it.
- `NgxFormFieldErrorPresentation` (`'inline' | 'panel'`) — the `presentation` input's type.
- `NgxCharacterCountValue` + `NgxCharacterCountAnnouncement*` types — character-count announcement formatting hooks.

### NgxFormMarkingLegend inputs

Selector: `ngx-form-marking-legend`

| Input            | Type                 | Notes                                                                  |
| ---------------- | -------------------- | ---------------------------------------------------------------------- |
| `formTree`       | `FieldTree<unknown>` | Optional — falls back to ambient `ngxSignalForm` form context          |
| `showMarkerWhen` | `FieldMarkingMode`   | Override marking mode; falls back to config `showMarkerWhen`           |
| `text`           | string               | Override legend text entirely (`{marker}` is substituted)              |
| `requiredMarker` | string               | Override the required marker used for `{marker}`; falls back to config |
| `optionalMarker` | string               | Override the optional marker used for `{marker}`; falls back to config |

Renders the form-level legend explaining what the required/optional markers mean. Mode-aware: hides when the form has no field of the relevant kind, and renders nothing in `'none'` mode. Plain visible text — no `role` or live region (required state still reaches AT via each control's `aria-required`).

### NgxFormFieldErrorSummary inputs

Selector: `ngx-form-field-error-summary`

| Input             | Type                 | Default                              | Notes                                            |
| ----------------- | -------------------- | ------------------------------------ | ------------------------------------------------ |
| `formTree`        | `FieldTree<unknown>` | required                             | Root form tree to aggregate errors from          |
| `summaryLabel`    | string               | `'Please fix the following errors:'` | Header text above the error list                 |
| `strategy`        | ErrorDisplayStrategy | Inherited from form context          | Override error display strategy                  |
| `submittedStatus` | SubmittedStatus      | Inherited from form context          | Manual submission status override                |
| `autoFocus`       | boolean              | `true`                               | Focus the summary host the first time it appears |

Renders a styled GOV.UK-pattern list of blocking errors only (no warnings). Each entry is a focusable button that calls `focusBoundControl()` on click. Inherits `errorStrategy` and `submittedStatus` from `ngxSignalForm` context automatically. Uses `role="alert"` and relies on the role's implicit live-region semantics — no explicit `aria-live` / `aria-atomic`. Deduplicated — same error shown once even if multiple fields produce it.

**CSS custom properties for theming:**

- `--ngx-error-summary-border-color` (default: `#dc2626`)
- `--ngx-error-summary-bg` (default: `#fef2f2`)
- `--ngx-error-summary-label-color` (default: `#991b1b`)
- `--ngx-error-summary-link-color` (default: `#dc2626`)
- `--ngx-error-summary-link-hover-color` (default: `#991b1b`)
- `--ngx-error-summary-focus-color` (default: `#2563eb`)

For full DOM control over the error summary (incl. warning entries), use `NgxHeadlessErrorSummary` from `@ngx-signal-forms/toolkit/headless`.

### NgxFormFieldCharacterCount inputs

| Input             | Type    | Notes                                   |
| ----------------- | ------- | --------------------------------------- |
| `formField`       | field   | Required                                |
| `maxLength`       | number  | Auto-detected from validator if omitted |
| `showLimitColors` | boolean | Default: `true`                         |
| `liveAnnounce`    | boolean | SR live announcement                    |

Warning/danger color thresholds are CSS-only — no `colorThresholds` input. Override `--ngx-form-field-char-count-warning-threshold` / `--ngx-form-field-char-count-danger-threshold` (default `80`/`95`).

---

## Entry Point: `@ngx-signal-forms/toolkit/form-field`

```typescript
import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';
// Bundle: [NgxSignalFormAutoAria,
//          NgxSignalFormControlSemanticsDirective,
//          NgxFormFieldWrapper,
//          NgxFormFieldHint, NgxFormFieldCharacterCount,
//          NgxFormFieldError, NgxFormFieldset]

import {
  NgxFormFieldWrapper,
  NgxFormFieldset,
} from '@ngx-signal-forms/toolkit/form-field';
```

### NgxFormFieldWrapper inputs

| Input             | Type                                              | Default                                                                                         |
| ----------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `formField`       | field                                             | Required                                                                                        |
| `fieldName`       | string                                            | Derived from bound control `id`; pass explicitly for nested custom controls or dynamic identity |
| `strategy`        | ErrorDisplayStrategy                              | Inherited                                                                                       |
| `warningStrategy` | WarningDisplayStrategy                            | Inherited — warnings time independently of errors                                               |
| `appearance`      | `'standard' \| 'outline' \| 'plain' \| 'inherit'` | `'inherit'`                                                                                     |
| `orientation`     | `'vertical' \| 'horizontal' \| 'inherit'`         | `'inherit'`                                                                                     |
| `errorPlacement`  | `'top' \| 'bottom'`                               | `'bottom'`                                                                                      |
| `showMarkerWhen`  | `'required' \| 'optional' \| 'none'`              | From config                                                                                     |
| `requiredMarker`  | string                                            | `' *'`                                                                                          |
| `optionalMarker`  | string                                            | `' (optional)'`                                                                                 |

### NgxFormFieldset inputs

| Input                 | Type                                                                     | Default                                           |
| --------------------- | ------------------------------------------------------------------------ | ------------------------------------------------- |
| `field`               | field tree                                                               | Required                                          |
| `fields`              | field[]                                                                  | Auto-traversed if omitted                         |
| `fieldsetId`          | string                                                                   | Auto-generated                                    |
| `strategy`            | ErrorDisplayStrategy                                                     | Inherited                                         |
| `warningStrategy`     | WarningDisplayStrategy                                                   | Inherited — warnings time independently of errors |
| `showErrors`          | boolean                                                                  | `true`                                            |
| `includeNestedErrors` | boolean                                                                  | `false`                                           |
| `errorPlacement`      | `'top' \| 'bottom'`                                                      | `'bottom'`                                        |
| `appearance`          | `'outline' \| 'plain'`                                                   | `'outline'`                                       |
| `feedbackAppearance`  | `'auto' \| 'plain' \| 'notification'`                                    | `'auto'`                                          |
| `notificationTitle`   | string                                                                   | none                                              |
| `listStyle`           | `NgxFormFieldListStyle`                                                  | `'bullets'`                                       |
| `surfaceTone`         | `'default' \| 'neutral' \| 'info' \| 'success' \| 'warning' \| 'danger'` | `'default'`                                       |
| `validationSurface`   | `'never' \| 'always'`                                                    | `'never'`                                         |

Exported types: `NgxFormFieldsetAppearance`, `NgxFormFieldsetFeedbackAppearance`,
`NgxFormFieldsetSurfaceTone`, `NgxFormFieldsetValidationSurface`. `appearance="plain"`
is semantic-only grouping (no border/padding/surface); `validationSurface="always"`
tints the surface on invalid/warning state.

---

## Entry Point: `@ngx-signal-forms/toolkit/headless`

```typescript
import { NgxHeadlessToolkit } from '@ngx-signal-forms/toolkit/headless';
// Bundle: [NgxHeadlessErrorState, NgxHeadlessErrorSummary,
//          NgxHeadlessFieldset, NgxHeadlessCharacterCount,
//          NgxHeadlessFieldName, NgxHeadlessNotification]
```

### Additional exports

Directive-level types and constants also available from this entry point:

- `createErrorMessageSignal(field, options?): Signal<readonly ResolvedFieldError[]>` — reactive primitive that resolves a field's errors (with the 3-tier message cascade + stable IDs) for custom rendering. Options: `CreateErrorMessageSignalOptions`; `IncludeWarningsOption` (`false` blocking-only \| `true` blocking then warnings \| `'only'` warnings) selects the subset; `ResolvedFieldError` is `{ kind, message, id, error }`. Blocking errors are timed by `strategy`, the selected warnings by `warningStrategy` — two independent cascades (ADR-0007).
- `ErrorStateSignals`, `ResolvedError` — from `NgxHeadlessErrorState`
- `FieldsetStateSignals` — from `NgxHeadlessFieldset`
- `CharacterCountStateSignals`, `CharacterCountLimitState` — from `NgxHeadlessCharacterCount`
- `DEFAULT_WARNING_THRESHOLD` (80), `DEFAULT_DANGER_THRESHOLD` (95) — default thresholds
- `ErrorSummaryEntry`, `ErrorSummarySignals` — from `NgxHeadlessErrorSummary`
- `FieldNameStateSignals` — from `NgxHeadlessFieldName`
- `NotificationStateSignals`, `ResolvedNotificationMessage` — from `NgxHeadlessNotification`

### NgxHeadlessErrorState

Selector: `[ngxHeadlessErrorState]` | Export: `#errorState="errorState"`

Inputs: `field` (optional — omit when `errorsOverride` is bound or a host bridges state via `connectFieldState()`), `fieldName` (optional, default `null` — `null` disables ID generation), `errorsOverride`, `strategy`, `warningStrategy`, `submittedStatus`

Signals:

- `shouldShowErrors()` — whether to display errors now
- `shouldShowWarnings()` — whether to display warnings now, on `warningStrategy`'s own cascade
- `hasErrors()` / `hasWarnings()`
- `resolvedErrors()` / `resolvedWarnings()` — `ResolvedError[]` with `.message`, `.kind`
- `errorId` / `warningId` — stable IDs for `aria-describedby`

### NgxHeadlessErrorSummary

Selector: `[ngxHeadlessErrorSummary]` | Export: `#summary="errorSummary"`

Inputs: `formTree` (required), `strategy`, `warningStrategy`, `submittedStatus`

Signals/methods (implements `ErrorSummarySignals`):

- `entries()` — `ErrorSummaryEntry[]` — blocking errors ready for rendering
- `warningEntries()` — `ErrorSummaryEntry[]` — warning entries (not available in styled component)
- `hasErrors()` / `hasWarnings()`
- `shouldShow()` — computed from strategy + submittedStatus
- `shouldShowWarnings()` — computed from `warningStrategy`'s own cascade, independent of `shouldShow()`
- `resolvedStrategy()` / `resolvedWarningStrategy()`
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

Inputs: `field` (required), `fields`, `strategy`, `warningStrategy`, `includeNestedErrors`

Signals: `isValid()`, `isInvalid()`, `isTouched()`, `isDirty()`, `aggregatedErrors()`, `aggregatedWarnings()`, `shouldShowErrors()`, `shouldShowWarnings()`

### NgxHeadlessFieldName

Selector: `[ngxHeadlessFieldName]` | Export: `#fieldName="fieldName"`

Inputs: `field` (required), `fieldName`

Signals: `resolvedFieldName()` (`string | null`), `errorId` (`Signal<string | null>`), `warningId` (`Signal<string | null>`)

### NgxHeadlessNotification

Selector: `[ngxHeadlessNotification]` | Export: `#notification="notificationState"`

Inputs (no `tone` — routing is content-driven):

- `errors` (required) — `ReactiveOrStatic<readonly ValidationError[]>` (plain array or signal/getter; unwrapped internally)
- `fieldName` — `string | null | undefined`

Signals/methods (implements `NotificationStateSignals`):

- `hasMessages()`
- `resolvedTone()` — `'error' | 'warning'`
- `showErrorContainer()` / `showWarningContainer()`
- `errorContainerId()` / `warningContainerId()`
- `resolvedMessages()` — `ResolvedNotificationMessage[]`

Tone resolution is content-aware:

- any blocking error forces the error container / `role="alert"`
- warning-only lists resolve to the warning container / `role="status"`
- empty lists keep both containers hidden

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

// Aggregation factories — the pipelines behind NgxHeadlessFieldset and
// NgxHeadlessErrorSummary, extracted for custom grouped surfaces. Pure: no
// inject(), no injection context required (ADR-0005), testable with plain
// signal() mocks. Visibility timing is NOT resolved inside — pass pre-resolved
// showErrors/showWarnings signals from your own createErrorVisibility() /
// createWarningVisibility() seam calls (ADR-0006). Two separate signals:
// passing one for both re-couples the channels (ADR-0007).
createFieldsetAggregation(options: CreateFieldsetAggregationOptions): FieldsetAggregationResult
// Options: { fieldState: () => unknown;              // reader for field()()
//            fields?; includeNestedErrors?;          // same contract as the directive inputs
//            showErrors; showWarnings;               // pre-resolved visibility signals
//            errorMessages? }
// Result: { aggregatedErrors, aggregatedWarnings, resolvedErrors,
//           resolvedWarnings, hasErrors, hasWarnings,
//           shouldShowErrors, shouldShowWarnings } — all Signal<...>
createErrorSummaryEntries(options: CreateErrorSummaryEntriesOptions): ErrorSummaryEntriesResult
// Options: { fieldState: () => unknown;              // reader for formTree()()
//            showErrors; showWarnings;               // pre-resolved visibility, one per channel
//            errorMessages?; labelResolver? }        // labelResolver falls back to humanizeFieldPath
// Reads errorSummary(), filters out hidden/disabled fields, dedupes per field,
// splits by kind, maps to focusable entries.
// Result: { entries, warningEntries, hasErrors, hasWarnings,
//           shouldShow, shouldShowWarnings } — all Signal<...>

// Field optionality — does a form tree have any required / any optional leaf?
summarizeFieldOptionality(tree): FieldOptionality // synchronous; reactive when read inside a computed()
createFieldOptionalitySummary(treeSource: () => FieldTree | null | undefined): {
  readonly hasRequired: Signal<boolean>;
  readonly hasOptional: Signal<boolean>;
}
// FieldOptionality: { readonly hasRequired: boolean; readonly hasOptional: boolean }
// Both flags can be true (mixed form); an empty / leaf-less form reports false for both.
// Backs NgxFormMarkingLegend's mode-aware show/hide.
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
  readonly warningStrategy?: WarningDisplayStrategy;
  readonly submittedStatus?: SignalLike<SubmittedStatus>;
}

interface ErrorStateResult {
  readonly shouldShowErrors: Signal<boolean>;
  readonly shouldShowWarnings: Signal<boolean>;
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

### Custom-wrapper ARIA composition

The headless entry point re-exports these core factories for custom wrappers
that own their DOM and ARIA. Use the factories as one composition unit instead
of reproducing the wrapper's strategy, identity, hint, and renderer rules.

```typescript
createAriaInvalidSignal(fieldState, visibility, isControlVisible?): Signal<'true' | 'false' | null>
createAriaRequiredSignal(fieldState): Signal<'true' | null>
createAriaDescribedBySignal(options): Signal<string | null>
createHintIdsSignal(options): Signal<readonly string[]>
createAriaDescribedByBridge(options): AriaDescribedByBridge
createFieldNameResolver(options): Signal<string | null>
```

- `createFieldNameResolver` resolves explicit input → optional label `for` →
  bound control `id`.
- `createAriaInvalidSignal`'s third argument is optional in the type signature
  only. A wrapper that composes the factory owns the layout probe itself —
  without it `aria-invalid` goes stale on a control inside a collapsed
  `<details>`, an inactive tab panel, or a non-current wizard step. Two forms:
  `createControlVisibilitySignal(resolveElement, injector)` from the root
  entry when the wrapper has no render hook, or `isElementCssVisible` inside
  an existing `afterEveryRender` `earlyRead` phase when it already runs one.
  Probe the element that carries the attribute, which is not always the host.
  See `docs/CUSTOM_WRAPPERS.md` call-out 5 under "Composing ARIA primitives".
- `createAriaDescribedByBridge` coordinates the chain with a third-party host
  that owns `aria-describedby`; ordinary custom wrappers use
  `createAriaDescribedBySignal` directly.
- Joining a custom error renderer to `{ formField, strategy, submittedStatus }`,
  or projected hints to `NGX_SIGNAL_FORM_HINT_REGISTRY`'s wire format, is a
  single inline `computed()` in the wrapper — no shared helper for either
  (each has too few call sites to earn one). See `docs/CUSTOM_WRAPPERS.md`
  for the inlined shape.

Read `packages/toolkit/headless/README.md` or `docs/CUSTOM_WRAPPERS.md` for the
full composition examples and the exported option types.

---

## Entry Point: `@ngx-signal-forms/toolkit/vest`

```typescript
import {
  VEST_ERROR_KIND_PREFIX, // 'vest:'
  VEST_WARNING_KIND_PREFIX, // 'warn:vest:'
  createVestAdapter,
  sharedVestAdapter,
  validateVest,
  validateVestWarnings,
  type RunVestSuiteParams,
  type RunVestSuiteResult,
  type ValidateVestOptions,
  type VestAdapterOptions,
  type VestCoordinatedSuite,
  type VestFieldExclusion,
  type VestOnlyFieldSelector,
  type VestRegisterOptions,
  type VestRunnableSuite,
  type VestSuiteAdapter,
} from '@ngx-signal-forms/toolkit/vest';

interface ValidateVestOptions<TValue = unknown, F extends string = string> {
  includeWarnings?: boolean; // default: false — surface warn() as toolkit warnings
  resetOnDestroy?: boolean; // default: true — call suite.reset() on DestroyRef teardown; pass false to persist state across mounts
  only?: VestOnlyFieldSelector<TValue, F>; // default: undefined — focus the run on a field
}

type VestOnlyFieldSelector<TValue, F extends string = string> = (
  ctx: FieldContext<TValue>,
) => VestFieldExclusion<F>;

// A field name, a list of field names, `undefined` for a whole-suite run, or
// `false` to focus nothing. `false` THROWS at run time: Vest's `suite.only()`
// and `suite.run(value, fieldName)` both treat an empty/falsy selection as
// "no filter" (run everything), so there is no way to honor "focus nothing".
type VestFieldExclusion<F extends string = string> =
  | F
  | readonly F[]
  | undefined
  | false;

// A registration's bound path value IS the suite input (ADR-0008): `path`'s
// value type and `suite`'s input type (TValue) must match. Binding a suite
// to a path of a different shape is a compile error, not a runtime footgun.

// `F` is the suite's own Vest field-name union — Vest ≥6.3.2 propagates one
// through `create<{ fields: 'email' | 'password' }>(…)` or a schema-typed
// suite. It defaults to `string`, so a plain `create(…)` suite (no `fields`,
// no schema) is unaffected, and it is always inferred from the `suite`
// argument itself: no call site writes an explicit type argument. When `F`
// narrows, `only`'s accepted return value narrows with it, so a mistyped
// focus name (`only: () => 'emial'`) is a compile error instead of a
// focused run that silently executes zero tests. See issue #292.

interface VestAdapterOptions {
  readonly resetOnDestroy?: boolean; // default: true
}
interface VestRegisterOptions<TValue = unknown, F extends string = string> {
  readonly includeErrors?: boolean;
  readonly includeWarnings?: boolean;
  readonly resetOnDestroy?: boolean;
  readonly only?: VestOnlyFieldSelector<TValue, F>;
}
// The exact slice of `VestRunnableSuite` the run coordinator drives (`run`,
// `only`, `subscribe`, `get`) — NOT the full suite contract. `reset` is
// registration-layer-only (`resetOnDestroy`), never passed to a run.
type VestCoordinatedSuite<TValue, F extends string = string> = Pick<
  VestRunnableSuite<TValue, F>,
  'run' | 'only' | 'subscribe' | 'get'
>;

interface RunVestSuiteParams<TValue, F extends string = string> {
  readonly suite: VestCoordinatedSuite<TValue, F>;
  readonly fieldTree: ReadonlyFieldTree<TValue>;
  readonly value: TValue;
  readonly focus?: VestFieldExclusion<F>;
}
interface RunVestSuiteResult<TValue, F extends string = string> {
  readonly value: TValue;
  // The `focus` exactly as requested — a field name, a list of field names,
  // `false`, or `undefined` — NOT the coordinator's internal cache key.
  readonly focus: VestFieldExclusion<F>;
  readonly runResult: VestResultLike<F> | PromiseLike<VestResultLike<F>>;
  readonly initialResult: VestResultLike<F> | undefined;
  readonly fromCache: boolean;
  // `true` when this run was queued behind another field tree's pending run
  // on the SAME suite instead of starting immediately.
  readonly deferred: boolean;
  // Resolves once this run's outcome is observable, recovering from a
  // superseded Vest resolver. Await THIS, not `runResult` — see
  // "Awaiting a manual run's outcome" in the vest package README.
  readonly settled: () => PromiseLike<unknown>;
}
interface VestSuiteAdapter {
  register<TValue, F extends string = string>(path, suite, options?): void;
  runVestSuite<TValue, F extends string = string>(
    params: RunVestSuiteParams<TValue, F>,
  ): RunVestSuiteResult<TValue, F>;
  invalidate(suite: object): void;
}

createVestAdapter(options?): VestSuiteAdapter
sharedVestAdapter: VestSuiteAdapter
```

`validateVest()` and `validateVestWarnings()` delegate to `sharedVestAdapter`.
Use `createVestAdapter()` for an isolated cache, or
`sharedVestAdapter.runVestSuite()` when a custom validator must share the same
run as a built-in registration. `runVestSuite()` is sync-only unless the custom
flow also owns an async validation phase.

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

## Entry Point: `@ngx-signal-forms/toolkit/testing`

A small consumer-facing accessibility test harness. `axe-core` is an **optional peer dependency** of the toolkit — it is only required if you import from this entry point (intended for Vitest browser-mode specs after rendering a component fixture).

```typescript
import {
  createA11yValidator,
  expectNoA11yViolations,
  findAlertContaining,
  WCAG_22_AA_TAGS,
  type A11yValidator,
  type WCAG_22_AA_TAG,
} from '@ngx-signal-forms/toolkit/testing';
```

```typescript
// Runs an axe-core audit and HARD-FAILS (throws) on any WCAG 2.2 AA violation.
// One call per rendered fixture scans the whole subtree.
expectNoA11yViolations(
  context?: axe.ElementContext,              // default: document.body
  options?: Omit<axe.RunOptions, 'runOnly'>, // merged over the defaults
): Promise<void>
// The WCAG 2.2 AA `runOnly` tag set is the hard-fail baseline and is NOT
// overridable: a fresh literal carrying `runOnly` is a compile error, and the
// baseline is applied after the options spread, so it wins at runtime even for
// an axe.RunOptions-typed value smuggling one through. `resultTypes` stays
// caller-overridable.

// Builds a same-shaped validator scoped to a caller-chosen WCAG 2.2 AA tag
// subset, instead of the full expectNoA11yViolations baseline — for custom
// wrappers that only need part of the tag set checked at a given call site.
// The toolkit's own specs keep the hard-coded baseline. `tags` is typed to
// WCAG_22_AA_TAG (not string[]), so an invented tag is a compile error;
// omitted, it defaults to the full WCAG_22_AA_TAGS baseline. `tags: []`
// type-checks but throws synchronously at creation time (not a silently
// always-passing validator). The returned validator keeps the same
// non-overridable `runOnly` guarantee.
createA11yValidator(options?: { tags?: readonly WCAG_22_AA_TAG[] }): A11yValidator
type A11yValidator = (
  context?: axe.ElementContext,
  options?: Omit<axe.RunOptions, 'runOnly'>,
) => Promise<void>

// axe-core tag set mapping to WCAG 2.2 AA (additive across versions):
WCAG_22_AA_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] as const
// No `wcag22a`: the two new 2.2 Level A criteria (Consistent Help, Redundant
// Entry) are non-automatable, so automated scans cover only a subset of full
// 2.2 AA conformance.
type WCAG_22_AA_TAG = (typeof WCAG_22_AA_TAGS)[number]

// Finds the [role="alert"] element in `container` whose text includes `text`.
// Toolkit surfaces mount several live regions at once (some mounted-but-empty
// per the WCAG 4.1.3 first-insertion pattern), so a bare getByRole('alert') is
// ambiguous — narrow to the region carrying the expected message first.
findAlertContaining(container: ParentNode, text: string): HTMLElement | undefined
```

```typescript
// Example (Vitest browser mode)
await render(MyFormComponent);
await expectNoA11yViolations(); // throws with a formatted report on any violation
```

---

## Entry Point: `@ngx-signal-forms/debugger` (Internal/Demo Only)

**Note:** The debugger is no longer part of the published `@ngx-signal-forms/toolkit` package. It is now an internal component for demo and development use only.

```typescript
// Bundle (recommended): the panel + the badge directives
import { NgxSignalFormDebuggerToolkit } from '@ngx-signal-forms/debugger';
// = [NgxSignalFormDebugger, NgxSignalFormDebuggerBadge, NgxSignalFormDebuggerBadgeIcon]

// Individual imports
import {
  NgxSignalFormDebugger,
  NgxSignalFormDebuggerBadge,
  NgxSignalFormDebuggerBadgeIcon,
  type NgxSignalFormDebuggerBadgeAppearance,
  type NgxSignalFormDebuggerBadgeVariant,
} from '@ngx-signal-forms/debugger';
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
type NgxSignalFormDebuggerBadgeVariant = 'solid' | 'outline' | 'ghost';
type NgxSignalFormDebuggerBadgeAppearance =
  'neutral' | 'info' | 'success' | 'warning' | 'danger';
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
--ngx-signal-form-warning-color: #a16207;

/* Form field */
--ngx-form-field-color-primary: #3b82f6;
```

See `packages/toolkit/form-field/THEMING.md` for the full property list (20+).
