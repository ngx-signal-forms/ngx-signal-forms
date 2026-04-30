# Migrating from beta → current v1 API

This guide covers every breaking change between the last beta
(`1.0.0-beta.10`) and the current v1 release-candidate surface. It is
intentionally written against the **latest state only**.

That means this document does **not** walk through interim RC-to-RC
waypoints. Every “before → after” example below shows the migration from
beta-era usage to the API you should use **today**.

If a later RC ships without new beta-to-v1 breaking changes, this guide
remains the correct migration target without needing another RC-number bump.

The toolkit follows semver strictly from `1.0.0` onward. Future 1.x
releases will not include any of the renames below.

## At a glance

- **`[formRoot]` selector** — Directive is now an additive enhancer: add `ngxSignalForm`
- **Public API surface** — `/core` is hidden; `@internal` plumbing is no longer published
- **CSS custom properties** — several theming tokens were renamed or collapsed during the rc cycle (see [`MIGRATING_CSS_VARS.md`](./MIGRATING_CSS_VARS.md))
- **Removed helpers** — `computeShowErrors`, `canSubmit`, `injectFormConfig`, `walkFieldTree(visitor)`, `walkFieldTreeIterable`, …
- **Removed component** — `NgxFormFieldAssistiveRow` (inlined into `NgxFormFieldWrapper`)
- **Removed directive** — `NgxFloatingLabelDirective` (use `appearance="outline"`)
- **Renamed components** — `NgxSignalFormError*` → `NgxFormFieldError*`
- **Renamed appearances** — final appearance set is `standard` / `outline` / `plain`
- **Orientation API** — `vertical` / `horizontal` is a documented field-wrapper contract
- **Renamed control kinds** — `text-like` / `textarea-select-like` → `input-like` / `standalone-field-like`
- **Hybrid v1 naming** — drop `Component`/`Directive` suffixes; short prefixes per layer
- **Config typing** — `NgxSignalFormsUserConfig` is `Partial`, not `DeepPartial`
- **Behavior fix** — `on-submit` strategy now requires an explicit `submittedStatus`
- **New: control semantics** — `ngxSignalFormControl="…"` contract for layout + auto-ARIA
- **New: error summary** — `NgxFormFieldErrorSummary` + headless directive
- **New: field labels** — `provideFieldLabels()` + warning/error split utilities
- **New: debugger entry point** — `@ngx-signal-forms/toolkit/debugger`
- **New: `warningStrategy`** — decouples warning visibility from error timing; default `'immediate'`
- **New: `NgxFormField` bundle** — convenience import array of wrapper + assistive parts + auto-ARIA directive
- **New: fieldset toggle** — `includeNestedErrors` on fieldset; `submittedStatus` override input
- **New: error component APIs** — `errors`, `listStyle`, `submittedStatus` inputs on `NgxFormFieldError`
- **New: Vest options** — `only` selector, `resetOnDestroy`, `VEST_*_KIND_PREFIX` exports
- **A11y** — removed explicit `aria-live` / `aria-atomic`; role semantics now authoritative
- **Behavior** — missing `fieldName` / `id` now logs (dev mode) instead of throwing
- **Compatibility** — Angular peer-dep is `>=21.2.0 <22.0.0`

---

## 1. `NgxSignalForm` is now an additive enhancer

Earlier betas used `form[formRoot]` as the selector, which meant the
toolkit was effectively taking over Angular's built-in `FormRoot`
directive (submission handling, `novalidate`, `preventDefault`). That
was fragile and made our directive responsible for things Angular
already owns.

In the current API, the toolkit directive is an **additive enhancer** layered on top
of Angular's public `FormRoot`. You opt in to toolkit behavior per-form
by adding the `ngxSignalForm` attribute alongside `[formRoot]`.

```html
<!-- before (≤ beta.10) -->
<form [formRoot]="myForm" [errorStrategy]="'on-touch'">…</form>

<!-- after (v1) -->
<form [formRoot]="myForm" ngxSignalForm [errorStrategy]="'on-touch'">…</form>
```

Notes:

- `[errorStrategy]`, `[submittedStatus]`, and friends still live on the
  toolkit directive — you still need `ngxSignalForm` on any form that
  consumes toolkit features (wrapper, auto-aria, error display, error
  summary, headless directives).
- The directive's `exportAs` is now `ngxSignalForm` (was `ngxFormRoot`).
- The `NgxSignalFormToolkit` bundle now also re-exports Angular's
  `FormRoot`, so a single import keeps working:

  ```ts
  imports: [NgxSignalFormToolkit /* … */];
  ```

### Migration steps

1. Add `ngxSignalForm` to every `<form [formRoot]="…">` that uses
   toolkit features.
2. Replace any template reference variables using the old export name:

   ```html
   <!-- before -->
   <form #f="ngxFormRoot" …>
     <!-- after  -->
     <form #f="ngxSignalForm" …></form>
   </form>
   ```

3. Remove any code that manually called `preventDefault()` or set
   `novalidate` to work around the old directive owning submission —
   Angular's `FormRoot` does this correctly on its own.

---

## 2. `/core` is no longer a published entry point

In beta and the early RCs, `@ngx-signal-forms/toolkit/core` was
importable from consumer code, which accidentally exposed a lot of
`@internal` plumbing (`NGX_SIGNAL_FORM_HINT_REGISTRY`,
`NGX_SIGNAL_FORM_ARIA_MODE`, `DEFAULT_NGX_SIGNAL_FORMS_CONFIG`, hint
descriptor types, etc.).

Starting in v1, the published `package.json` no longer exposes the
`./core` export. Modern Node/TypeScript resolvers return
`ERR_PACKAGE_PATH_NOT_EXPORTED` if you try to import from it.

- **Action:** replace `@ngx-signal-forms/toolkit/core` imports with
  `@ngx-signal-forms/toolkit` (the root entry) and only use symbols
  that are re-exported from the root barrel.
- `packages/toolkit/index.ts` is the authoritative list of the stable
  public surface (54 values and 26 types, enumerated by hand).
- CSS custom properties — two prefix families remain stable and split by
  role: `--ngx-signal-form-*` covers cross-cutting feedback concerns
  (e.g. `--ngx-signal-form-feedback-font-size`,
  `--ngx-signal-form-error-color`, `--ngx-signal-form-fieldset-*`) and
  `--ngx-form-field-*` covers wrapper-level chrome
  (e.g. `--ngx-form-field-color-primary`, `--ngx-form-field-focus-color`).
  **Several tokens were renamed or collapsed during the rc cycle** — the
  full before/after table is in
  [`MIGRATING_CSS_VARS.md`](./MIGRATING_CSS_VARS.md). See
  [`packages/toolkit/form-field/THEMING.md`](../packages/toolkit/form-field/THEMING.md#architecture-semantic-layering)
  for the full layering.

If you were reaching into `/core` for something that is **not**
re-exported from root, it was `@internal` and is not part of the v1
public API contract. Open an issue if you need it exposed.

See [`docs/ANGULAR_PUBLIC_API_POLICY.md`](./ANGULAR_PUBLIC_API_POLICY.md)
for the full policy.

---

## 3. Removed APIs

The following symbols existed in betas or early RCs and have been
removed. Replace them with the v1 equivalents.

| Removed API                                 | Current replacement                                                                                  |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `computeShowErrors()`                       | `showErrors()`                                                                                       |
| `createShowErrorsSignal()`                  | `showErrors()`                                                                                       |
| `canSubmit()`                               | `canSubmitWithWarnings()`                                                                            |
| `isSubmitting()`                            | `submittedStatus()` from the `ngxSignalForm` directive                                               |
| `'manual'` error strategy                   | `showErrors()` + a manual `WritableSignal<boolean>`                                                  |
| `fieldNameResolver` config                  | Put an `id` on the bound control element                                                             |
| `strictFieldResolution` config              | Removed — strict by default                                                                          |
| `debug` config field                        | Removed — use the `/debugger` entry point instead                                                    |
| `injectFormConfig()`                        | `inject(NGX_SIGNAL_FORMS_CONFIG)`                                                                    |
| `NgxFloatingLabelDirective`                 | `<ngx-form-field-wrapper appearance="outline">`                                                      |
| `NgxSignalFormsUserConfig` as `DeepPartial` | `Partial<NgxSignalFormsConfig>` (top-level only)                                                     |
| `walkFieldTree(form, visitor)`              | `for (const { state } of walkFieldTreeEntries(form)) { visitor(state); }`                            |
| `walkFieldTreeIterable(form)`               | `walkFieldTreeEntries(form)` (same iterator shape, yields `{ state, path }`)                         |
| `NgxFormFieldAssistiveRow`                  | Removed; markup + styles inlined into `NgxFormFieldWrapper`. CSS custom-property contract preserved. |

### `NgxFloatingLabelDirective` → `appearance="outline"`

```html
<!-- before -->
<div ngxFloatingLabel>
  <input id="email" [formField]="form.email" />
  <label for="email">Email</label>
</div>

<!-- after -->
<ngx-form-field-wrapper [formField]="form.email" appearance="outline">
  <label for="email">Email</label>
  <input id="email" [formField]="form.email" />
</ngx-form-field-wrapper>
```

The wrapper now owns floating-label behavior via the `appearance`
input, so there is nothing extra to import.

### `NgxSignalFormsUserConfig` is now flat

`provideNgxSignalFormsConfig()` previously accepted a `DeepPartial`,
but the `NgxSignalFormsConfig` interface has no nested objects, so the
`DeepPartial` wrapper was doing nothing useful and pulled in
`ts-essentials` as a transitive dependency. It is now
`Partial<NgxSignalFormsConfig>`. No caller changes should be needed
unless you were explicitly typing a partial config by hand.

---

## 4. Renames (same behavior, new names)

### 4a. Error components renamed for prefix consistency

Every other field-scoped component used the `NgxFormField*` prefix
(`NgxFormFieldHint`, `NgxFormFieldCharacterCount`), but the error
display and error summary components used `NgxSignalFormError*`. That
mismatch is fixed.

| Before                                     | After                                     |
| ------------------------------------------ | ----------------------------------------- |
| `NgxSignalFormErrorComponent`              | `NgxFormFieldError`                       |
| `NgxSignalFormErrorSummaryComponent`       | `NgxFormFieldErrorSummary`                |
| `NgxSignalFormErrorListStyle`              | `NgxFormFieldErrorListStyle`              |
| selector `<ngx-signal-form-error>`         | selector `<ngx-form-field-error>`         |
| selector `<ngx-signal-form-error-summary>` | selector `<ngx-form-field-error-summary>` |

```ts
// before
import {
  NgxSignalFormErrorComponent,
  NgxSignalFormErrorSummaryComponent,
} from '@ngx-signal-forms/toolkit/assistive';

// after
import {
  NgxFormFieldError,
  NgxFormFieldErrorSummary,
} from '@ngx-signal-forms/toolkit/assistive';
```

```html
<!-- before -->
<ngx-signal-form-error [formField]="form.email" fieldName="email" />
<ngx-signal-form-error-summary [formTree]="form" />

<!-- after -->
<ngx-form-field-error [formField]="form.email" fieldName="email" />
<ngx-form-field-error-summary [formTree]="form" />
```

CSS custom properties are unchanged: overrides targeting
`--ngx-signal-form-error-color`, `--ngx-signal-form-error-bg`, etc.
keep working.

### 4a-bis. Shared list-style and placement types

Several list-style and placement unions used to be exported under
component-specific names. V1 consolidates them so bindings compose without
casts when passing values between the wrapper, fieldset, and notification
components.

| Before (rc)                         | After (v1)                                                            |
| ----------------------------------- | --------------------------------------------------------------------- |
| `FieldsetErrorPlacement`            | `NgxFormFieldErrorPlacement`                                          |
| `FormFieldErrorPlacement`           | `NgxFormFieldErrorPlacement`                                          |
| `FieldsetFeedbackAppearance`        | `NgxFieldsetFeedbackAppearance`                                       |
| `FieldsetSurfaceTone`               | `NgxFieldsetSurfaceTone`                                              |
| `FieldsetValidationSurface`         | `NgxFieldsetValidationSurface`                                        |
| `NgxFormFieldNotificationListStyle` | `NgxFormFieldListStyle` _(shared)_                                    |
| `NgxFormFieldErrorListStyle`        | `NgxFormFieldListStyle` _(shared, old name kept as deprecated alias)_ |

The two deprecated list-style aliases still resolve to the same union, so
existing imports keep compiling; switch to `NgxFormFieldListStyle` at your
convenience.

### 4b. Appearances renamed

| Before                 | After                   |
| ---------------------- | ----------------------- |
| `appearance="stacked"` | `appearance="standard"` |
| `appearance="bare"`    | `appearance="plain"`    |

`outline` and `inherit` are unchanged. The default appearance is now
`"standard"`.

If you adopted the temporary `stacked` name during the RC cycle, move it back
to `standard`. The current public appearance set is `standard`, `outline`,
`plain`, and `inherit`.

### 4c. Native control kinds renamed

The two public family names used by `ngxSignalFormControl` and by
`provideNgxSignalFormControlPresets()` were renamed so they describe
layout behavior instead of implementation details:

| Before                 | After                   |
| ---------------------- | ----------------------- |
| `text-like`            | `input-like`            |
| `textarea-select-like` | `standalone-field-like` |

```ts
// before
provideNgxSignalFormControlPresets({
  'text-like': {
    /* … */
  },
  'textarea-select-like': {
    /* … */
  },
});

// after
provideNgxSignalFormControlPresets({
  'input-like': {
    /* … */
  },
  'standalone-field-like': {
    /* … */
  },
});
```

The other kinds (`checkbox`, `switch`, `slider`, `composite`,
`standalone`) are unchanged.

### 4d. Orientation is part of the public wrapper contract

`ngx-form-field-wrapper` now documents `orientation="vertical" | "horizontal"`
as part of the stable public API.

- `vertical` keeps the label above the field (default)
- `horizontal` moves the label into a shared column to the left of the field
- `outline` always resolves back to vertical
- checkbox, switch, and radio-group rows keep their own inline layouts

`orientation` changes an individual wrapper, not the parent form layout. If you
want one field row per line for `standard + horizontal`, collapse the container
grid in your page/component rather than expecting the wrapper to rewrite it.

### 4e. Hybrid v1 naming — drop `Component`/`Directive` suffixes, shorten prefixes

To align with Angular v20+ style guidance and reduce noise at import sites, the
toolkit drops the `Component` / `Directive` suffix from public class names. A
short prefix is applied per conceptual layer:

- **Form-level** → `NgxSignalForm*`
- **Field-level UI** → `NgxFormField*` (short prefix)
- **Headless** → `NgxHeadless*` (with shortened `[ngxHeadless*]` attribute selectors)
- **Debugger** → `NgxSignalFormDebugger*`

The single exception is `NgxSignalFormControlSemanticsDirective`, which keeps
its `Directive` suffix because the `NgxSignalFormControlSemantics` interface
already exists in `core/types.ts`. The directive class still ships under that
name.

#### Class names

| Before                                   | After                                                |
| ---------------------------------------- | ---------------------------------------------------- |
| `NgxSignalFormDirective`                 | `NgxSignalForm`                                      |
| `NgxSignalFormAutoAriaDirective`         | `NgxSignalFormAutoAria`                              |
| `NgxSignalFormControlSemanticsDirective` | _(unchanged — exception)_                            |
| `NgxSignalFormFieldWrapperComponent`     | `NgxFormFieldWrapper`                                |
| `NgxSignalFormFieldsetComponent`         | `NgxFormFieldset`                                    |
| `NgxFormFieldErrorComponent`             | `NgxFormFieldError`                                  |
| `NgxFormFieldErrorSummaryComponent`      | `NgxFormFieldErrorSummary`                           |
| `NgxFormFieldHintComponent`              | `NgxFormFieldHint`                                   |
| `NgxFormFieldCharacterCountComponent`    | `NgxFormFieldCharacterCount`                         |
| `NgxFormFieldAssistiveRowComponent`      | _Removed in v1 — inlined into `NgxFormFieldWrapper`_ |
| `NgxHeadlessErrorStateDirective`         | `NgxHeadlessErrorState`                              |
| `NgxHeadlessErrorSummaryDirective`       | `NgxHeadlessErrorSummary`                            |
| `NgxHeadlessCharacterCountDirective`     | `NgxHeadlessCharacterCount`                          |
| `NgxHeadlessFieldsetDirective`           | `NgxHeadlessFieldset`                                |
| `NgxHeadlessFieldNameDirective`          | `NgxHeadlessFieldName`                               |
| `SignalFormDebuggerComponent`            | `NgxSignalFormDebugger`                              |
| `DebuggerBadgeComponent`                 | `NgxSignalFormDebuggerBadge`                         |
| `DebuggerBadgeIconComponent`             | `NgxSignalFormDebuggerBadgeIcon`                     |

The debugger bundle const is `NgxSignalFormDebuggerToolkit` (mirrors
`NgxSignalFormToolkit`).

#### Element selectors

| Before                                    | After                              |
| ----------------------------------------- | ---------------------------------- |
| `<ngx-signal-form-field-wrapper>`         | `<ngx-form-field-wrapper>`         |
| `<ngx-signal-form-fieldset>`              | `<ngx-form-fieldset>`              |
| `<ngx-signal-form-field-hint>`            | `<ngx-form-field-hint>`            |
| `<ngx-signal-form-field-character-count>` | `<ngx-form-field-character-count>` |
| `<ngx-signal-form-field-assistive-row>`   | `<ngx-form-field-assistive-row>`   |

The `<ngx-form-field-error*>` and `<ngx-signal-form-debugger>` selectors
already use the current naming pattern.

#### Attribute selectors (headless)

| Before                                  | After                         |
| --------------------------------------- | ----------------------------- |
| `[ngxSignalFormHeadlessErrorState]`     | `[ngxHeadlessErrorState]`     |
| `[ngxSignalFormHeadlessErrorSummary]`   | `[ngxHeadlessErrorSummary]`   |
| `[ngxSignalFormHeadlessCharacterCount]` | `[ngxHeadlessCharacterCount]` |
| `[ngxSignalFormHeadlessFieldset]`       | `[ngxHeadlessFieldset]`       |
| `[ngxSignalFormHeadlessFieldName]`      | `[ngxHeadlessFieldName]`      |

#### What is _not_ renamed

- BEM class names on the wrapper / fieldset hosts
  (`.ngx-signal-form-field-wrapper__*`, `.ngx-signal-form-fieldset--*`) keep
  the long prefix — they are a public theming contract, and renaming would
  break every consumer's CSS overrides.
- CSS custom properties (`--ngx-signal-form-*`, `--ngx-form-field-*`,
  `--ngx-debugger-*`) are unchanged.
- The `NgxSignalFormControlSemantics` interface in `core/types.ts` is unchanged
  (the directive that consumed the class name was kept distinct via the
  `Directive` suffix).

#### Mechanical migration

Most consumers can complete this with a project-wide search-and-replace on
class names (TypeScript surface) plus the element / attribute selector tables
above (template surface). The Angular compiler will surface any miss.

---

## 5. Behavior fix: `on-submit` requires an explicit `submittedStatus`

In betas, `computeShowErrorsInternal` silently fell back to
`touched ? 'submitted' : 'unsubmitted'` when no `submittedStatus` was
wired. A consumer calling `showErrors()` / `createErrorState()` with
the `'on-submit'` strategy but without a status would see errors
surface after blur, defeating the whole point of `on-submit`.

The fallback is now `'unsubmitted'`, so errors stay hidden until a real
status is supplied. A one-shot `console.warn` is emitted in
`ngDevMode` when `'on-submit'` is used without a status, to make the
miswiring loud during development without throwing.

- **In-toolkit surfaces** (wrapper, auto-aria, error display, headless
  error-state / error-summary / fieldset directives) all already
  resolve `submittedStatus` through the `ngxSignalForm` directive, so
  they are **unaffected**.
- **Only direct consumers** of `showErrors(field, 'on-submit')`
  without a status see a behavior change — which is the intended fix.

### Migration

```ts
// before — relied on the accidental fallback
const show = showErrors(field, 'on-submit');

// after — pass the form's submittedStatus explicitly
const show = showErrors(field, 'on-submit', {
  submittedStatus: formDirective.submittedStatus,
});
```

If you are rendering errors inside a form that has `ngxSignalForm` on
the `<form>` element, prefer `<ngx-form-field-error>`, the wrapper, or
`createErrorState()` — they all read the status from DI automatically.

---

## 6. Current features worth adopting

### Control semantics contract — `ngxSignalFormControl`

A small, directive-first API for telling the toolkit how a control
should be laid out and wired for ARIA, without brittle DOM heuristics:

```html
<!-- Treat this checkbox as a switch for layout + auto-ARIA -->
<input
  id="emailUpdates"
  type="checkbox"
  role="switch"
  ngxSignalFormControl="switch"
  [formField]="form.emailUpdates"
/>
```

Custom widgets can opt out of toolkit ARIA management entirely with
`ngxSignalFormControlAria="manual"` or
`ngxSignalFormAutoAriaDisabled` on the host element, and use
`buildAriaDescribedBy()` to assemble their own described-by chain. See
[`docs/CUSTOM_CONTROLS.md`](./CUSTOM_CONTROLS.md).

### Error summary

First-class error-summary feature split across headless and assistive
entry points:

- `NgxHeadlessErrorSummary` — strategy-aware visibility,
  deduplicated entries, `focusBoundControl()` support.
- `NgxFormFieldErrorSummary` — WCAG 2.2-compliant clickable
  error list with `role="alert"` and themable CSS custom properties.

See [`docs/COMPLEX_NESTED_FORMS.md`](./COMPLEX_NESTED_FORMS.md) for
usage patterns.

### Field labels and warning/error split utilities

- `provideFieldLabels()` / `NGX_SIGNAL_FORM_FIELD_LABELS` for mapping
  field paths to human-readable labels (used by error summary).
- `isBlockingError` / `isWarningError` / `warningError` helpers and
  the split between blocking errors and warnings, so
  `canSubmitWithWarnings()` lets a form submit while soft warnings
  remain visible. See [`docs/WARNINGS_SUPPORT.md`](./WARNINGS_SUPPORT.md).

### `/debugger` entry point

The `@ngx-signal-forms/toolkit/debugger` entry ships a development-only
component that replaces the old `debug: true` config flag. Gate it with
`isDevMode()` and drop it anywhere in the form template:

```ts
import { NgxSignalFormDebugger } from '@ngx-signal-forms/toolkit/debugger';

@Component({
  imports: [NgxSignalFormDebugger /* … */],
  template: `
    @if (isDev()) {
      <ngx-signal-form-debugger [formTree]="form" />
    }
  `,
})
```

---

## 7. Additional current APIs worth adopting

The following additions are part of the current public surface. They are
non-breaking (except where noted) but are worth calling out because they change
what the defaults cover and what you may want to adopt before going stable.

### `warningStrategy` input — independent warning timing

`NgxFormFieldError` (and by extension the wrapper / assistive bundle)
now accepts a `warningStrategy` input that is independent from the error
`strategy`. It defaults to `'immediate'` so advisory messages such as
"consider 12+ characters" appear as the user types, even when errors are gated
with `'on-touch'` or `'on-submit'`.

See [`WARNINGS_SUPPORT.md`](./WARNINGS_SUPPORT.md#when-warnings-appear--warningstrategy)
for the full input table and worked example. No migration action is required
unless you previously relied on warnings sharing the error timing, in which
case set `warningStrategy="inherit"` (or match `strategy` explicitly).

### `NgxFormFieldError` — new inputs

| Input             | Type                        | Purpose                                                             |
| ----------------- | --------------------------- | ------------------------------------------------------------------- |
| `errors`          | `Signal<ValidationError[]>` | Render pre-aggregated errors (e.g. fieldset-level). Takes priority. |
| `warningStrategy` | `ErrorDisplayStrategy`      | See above                                                           |
| `listStyle`       | `'plain' \| 'bullets'`      | Visual rendering of the message list                                |
| `submittedStatus` | `SubmittedStatus`           | Manual override for `'on-submit'` timing                            |

### Fieldset (component + headless directive)

- New `includeNestedErrors` input (default `false`): when `true`, aggregates
  descendant-field errors instead of only direct group-level errors.
- New `submittedStatus` input on the headless fieldset directive to support
  `'on-submit'` strategy without a form-level `ngxSignalForm`.
- **Headless output rename (breaking for direct consumers):** the directive's
  `submittedStatus` output is now `resolvedSubmittedStatus`, and `strategy` is
  surfaced as `resolvedStrategy`. If you were reading either output from a
  template reference or through Angular's output API, update the binding name.
- **`errorPlacement` default flipped from `'top'` to `'bottom'`** (breaking).
  Grouped summaries now render after the projected field content by default,
  which matches dense review-style layouts. This is a DOM-order change, not
  just a CSS tweak — screen-reader reading order for grouped sections shifts
  accordingly. To preserve pre-v1 behavior, pin `errorPlacement="top"` on any
  `<ngx-form-fieldset>` that relies on the summary appearing directly below
  the legend. Re-record any visual snapshots that cover grouped fieldsets.
- **`feedbackAppearance` default `'auto'` resolves to `'notification'`**
  (breaking). Grouped summaries now render inside the surfaced notification
  card by default. Pass `feedbackAppearance="plain"` to keep the compact
  inline `ngx-form-field-error` treatment.
- **`validationSurface` is now `'never' | 'always'` (default `'never'`)**
  (breaking). The old `'auto'` value was dropped as a dead branch; opt in
  explicitly with `validationSurface="always"` when every invalid/warning
  fieldset surface should tint.

### `NgxFormField` convenience bundle

`@ngx-signal-forms/toolkit/form-field` now exports a `NgxFormField` const array
containing the wrapper, fieldset, hint, error, character-count, assistive-row,
and auto-ARIA directive. Drop it into `imports` instead of listing each piece:

```ts
import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';

@Component({
  imports: [FormField, NgxFormField],
  // …
})
```

### Vest adapter additions

- `resetOnDestroy: true` — wires `suite.reset()` into `DestroyRef` so
  module-scope suites don't leak state across component mounts.
- `only: (ctx) => string | string[] | undefined` — threads a focused field name
  into `suite.run(value, fieldName)` (or `suite.only(field).run(...)`), enabling
  per-field Vest runs for large suites.
- Exported kind prefixes `VEST_ERROR_KIND_PREFIX` (`'vest:'`) and
  `VEST_WARNING_KIND_PREFIX` (`'warn:vest:'`) for stable consumer checks.

See [`packages/toolkit/vest/README.md`](../packages/toolkit/vest/README.md#suite-lifecycle)
for the full suite-lifecycle discussion.

### Null-safe field-name resolution

The wrapper, error, and headless field-name directives previously threw when
neither a `fieldName` input nor a non-empty host `id` was provided. In v1 RC
they return `null` from the affected signals (`resolvedFieldName`, `errorId`,
`warningId`) and skip ARIA wiring. In development mode a one-shot
`console.error` surfaces the misconfiguration.

**Action:** Continue to provide an `id` (or explicit `fieldName`) for
production A11y — the fallback exists to keep render trees intact, not to
replace correct configuration. Any custom ARIA wiring you built should gate on
a non-null value rather than produce unstable `"-error"` IDs.

### Accessibility — removed explicit `aria-live` / `aria-atomic`

Error (`role="alert"`) and warning (`role="status"`) containers no longer stamp
explicit `aria-live` / `aria-atomic` attributes. The ARIA 1.2 specification
defines these as implicit on both roles; duplicating them caused NVDA + Firefox
to double-announce messages. No action is required unless you explicitly
queried the attributes in tests — switch tests to assert `role` instead.

### Angular peer-dependency ceiling

Peer dependencies now constrain `@angular/core` and `@angular/forms` to
`>=21.2.0 <22.0.0`. Angular 22 compatibility will ship in a future toolkit
line. See [`COMPATIBILITY.md`](../COMPATIBILITY.md) for the reasoning. No
action is required on Angular 21.x.

---

## 8. Migration checklist

- **Add `ngxSignalForm`** next to every `[formRoot]` that uses toolkit
  features.

- **Rename exports and selectors** in templates and imports.
  - `NgxSignalFormError*` → `NgxFormFieldError*`
  - `<ngx-signal-form-error*>` → `<ngx-form-field-error*>`
  - `appearance="stacked"` → `appearance="standard"`
  - `appearance="bare"` → `appearance="plain"`
  - `'text-like'` → `'input-like'`
  - `'textarea-select-like'` → `'standalone-field-like'`
  - **Drop `Component` / `Directive` suffix** from every public class import
    and rename the legacy `<ngx-signal-form-*>` element selectors and
    `[ngxSignalFormHeadless*]` attribute selectors per §4e. The compiler will
    surface any missed reference.

- **Replace `@ngx-signal-forms/toolkit/core` imports** with
  `@ngx-signal-forms/toolkit`. If a symbol is missing from the root
  barrel, it was `@internal` — file an issue if you need it exposed.

- **Remove `NgxFloatingLabelDirective`** usages and migrate to
  `<ngx-form-field-wrapper appearance="outline">`.

- **Replace `injectFormConfig()`** with
  `inject(NGX_SIGNAL_FORMS_CONFIG)`.

- **Grep for the other removed APIs** (`computeShowErrors`,
  `createShowErrorsSignal`, `canSubmit`, `isSubmitting`, `'manual'`
  strategy, `fieldNameResolver`, `strictFieldResolution`, `debug`
  config) and swap for the replacements in §3.

- **If you call `showErrors(field, 'on-submit')` directly**, pass an
  explicit `submittedStatus` — otherwise errors will stay hidden (this
  is the fix, not a regression).

- **Run the build** (`pnpm nx run-many -t build`) to catch remaining
  references at compile time, then run your tests.

- **Sweep your stylesheets for renamed/removed CSS custom properties**
  if you themed the toolkit — see
  [`MIGRATING_CSS_VARS.md`](./MIGRATING_CSS_VARS.md). Common renames:
  `-border` → `-border-color`; `-list-style-type` + `-list-style-position`
  → `-list-style` shorthand; `-padding-horizontal` shortcuts →
  `-padding-inline-start` / `-inline-end` pairs; legacy
  `--ngx-form-field-outline-*` aliases removed.

---

## Reference

- [`docs/ANGULAR_PUBLIC_API_POLICY.md`](./ANGULAR_PUBLIC_API_POLICY.md)
  — the boundary between Angular Signal Forms and toolkit, plus the
  build-time-only `/core` story.
- [`docs/MIGRATING_CSS_VARS.md`](./MIGRATING_CSS_VARS.md) — every
  renamed or removed CSS custom property with before/after examples.
- [`docs/CUSTOM_CONTROLS.md`](./CUSTOM_CONTROLS.md) — control semantics,
  manual ARIA ownership, third-party component patterns.
- [`docs/COMPLEX_NESTED_FORMS.md`](./COMPLEX_NESTED_FORMS.md) — fieldset
  aggregation and error summary usage.
- [`docs/WARNINGS_SUPPORT.md`](./WARNINGS_SUPPORT.md) — the warning
  convention and message resolution order.
