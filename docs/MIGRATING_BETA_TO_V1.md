# Migrating from beta → current v1 API

This guide covers every breaking change between the last beta
(`1.0.0-beta.10`) and the current v1 release-candidate surface, including
`v1.0.0-rc.11`. It is intentionally written against the **latest state only**.

That means this document does **not** walk through interim RC-to-RC
waypoints. Every “before → after” example below shows the migration from
beta-era usage to the API you should use **today**. For an RC-to-RC upgrade,
read the applicable guide in [`docs/migrations/`](./migrations/README.md);
for example, [`v1.0.0-rc.11`](./migrations/v1.0.0-rc.11.md) documents the
upgrade from rc.10.

If a later RC ships without new beta-to-v1 breaking changes, this guide
remains the correct migration target without needing another RC-number bump.

The toolkit follows semver strictly from `1.0.0` onward. Future 1.x
releases will not include any of the renames below.

## At a glance

- **`[formRoot]` selector** — Directive is now an additive enhancer: add `ngxSignalForm`
- **Public API surface** — `/core` is hidden; `@internal` plumbing is no longer published
- **CSS custom properties** — several theming tokens were renamed or collapsed during the rc cycle (see [`MIGRATING_CSS_VARS.md`](./MIGRATING_CSS_VARS.md))
- **Removed helpers** — `computeShowErrors`, `canSubmit`, `injectFormConfig`, `walkFieldTree(visitor)`, `walkFieldTreeIterable`, … (the field-tree walker stays as an internal `/core` primitive; for error traversal reach for `errorSummary()` instead)
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
- **Debugger moved internal** — use `@ngx-signal-forms/debugger` in this repo's demos
- **New: `warningStrategy`** — decouples warning visibility from error timing; default `'immediate'`
- **New: `NgxFormField` bundle** — convenience import array of wrapper + assistive parts + auto-ARIA directive
- **New: fieldset toggle** — `includeNestedErrors` on fieldset; `submittedStatus` override input
- **New: error component APIs** — `errors`, `listStyle`, `submittedStatus` inputs on `NgxFormFieldError`
- **New: headless message resolution** — `createErrorMessageSignal()` combines visibility, the 3-tier message cascade, and stable per-error IDs for custom error renderers
- **New: Vest options** — `only` selector, `focusCurrentField` auto-focus, `VEST_*_KIND_PREFIX` exports
- **BREAKING: Vest `resetOnDestroy` now defaults to `true`** — the adapter resets module-scope suite state on teardown by default; pass `{ resetOnDestroy: false }` to keep persisting state across mounts
- **BREAKING: `ErrorMessageRegistry` is now strongly typed per built-in kind** — factory params for built-in kinds (`minLength`, `min`, `pattern`, …) are typed; custom kinds stay `any` (see [§5b](#5b-error-message-registry-is-now-strongly-typed))
- **A11y** — removed explicit `aria-live` / `aria-atomic`; role semantics now authoritative
- **Behavior** — missing `fieldName` / `id` now logs (dev mode) instead of throwing
- **A11y fix** — assistive live-region containers no longer toggle `aria-hidden`/`[hidden]` while empty, and `NgxFormFieldError`'s `id` binding no longer emits the literal string `"null"` (see [§6](#6-v100-audit-blockers-live-region-focus-and-dark-mode-fixes))
- **A11y fix** — `NgxFormFieldErrorSummary`'s `autoFocus` now only fires under the resolved `'on-submit'` strategy, never `'on-touch'`/`'immediate'` (see [§6](#6-v100-audit-blockers-live-region-focus-and-dark-mode-fixes))
- **BREAKING (a11y fix)** — dark mode no longer detects a `.dark` ancestor class via `:host-context()` (non-standard, unsupported in Firefox/Safari); class-based dark-mode apps must override the public `--ngx-signal-form-*` custom properties directly (see [§6](#6-v100-audit-blockers-live-region-focus-and-dark-mode-fixes))
- **Compatibility** — Angular peer-dep is `>=22.0.0 <23.0.0`
- **BREAKING: `@angular/common` is now a declared peer dependency** — it was always required at runtime (form-field wrapper/fieldset use `NgComponentOutlet`/`NgTemplateOutlet`) but was previously undeclared
- **BREAKING: `canSubmitWithWarnings()` now reads `errorSummary()`** — child-path blocking errors now correctly disable submission (see [§5c](#5c-cansubmitwithwarnings-now-aggregates-descendant-errors))
- **BREAKING: `injectFieldControl()` validates the resolved value against the runtime `FieldTree` contract** — an id resolving to a non-`FieldTree` property now throws instead of silently returning an unsound cast (see [§5d](#5d-injectfieldcontrol-validates-the-resolved-fieldtree))
- **BREAKING: `ErrorSummarySignals` gained `shouldShowWarnings`** — implementers of the interface must add this member (see [§8](#8-headless-audit-fixes-v100))
- **BREAKING: `CharacterCountResult` members are now typed `Signal<T>`** (was the looser `ReadSignal<T>` alias); a new `hasLimit` member was added — compile-time tightening only, no runtime change
- **Bug fix** — error summary no longer drops a second field's error when two different fields share the same kind + message-less default; `NgxHeadlessNotification` no longer leaks the internal `warn:` prefix; `createErrorMessageSignal`'s ID fallback strips Angular's internal `{appId}.form{n}.` prefix; required `Date`/`File`/`Map`-valued leaves no longer vanish from field-optionality summaries

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

- `[errorStrategy]` is the toolkit directive's only input; `submittedStatus`
  is a derived signal, not a bindable input.
- **`ngxSignalForm` is not required** to use toolkit features. Every toolkit
  component (wrapper, auto-ARIA, error display, error summary, headless
  directives) injects the form context optionally and falls back to
  `'on-touch'` / `'unsubmitted'` when it is absent — the right default for
  most forms. Add `ngxSignalForm` when you want a configurable
  `errorStrategy` (`'on-submit'` / `'immediate'`), submit-lifecycle tracking
  via `submittedStatus`, or one shared strategy propagated to every
  descendant via DI instead of passing inputs around. See the root
  [`README.md`](../README.md#adding-form-level-context-with-ngxsignalform)
  for the full with/without comparison.
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
`@internal` plumbing (`DEFAULT_NGX_SIGNAL_FORMS_CONFIG`, etc.).
`NGX_SIGNAL_FORM_HINT_REGISTRY`, `NGX_SIGNAL_FORM_ARIA_MODE`, and the hint
descriptor types were later promoted to the stable root barrel and are
legitimate public exports today — check `packages/toolkit/index.ts` if
you're unsure whether a given `/core` symbol is still internal.

Starting in v1, the published `package.json` no longer exposes the
`./core` export. Modern Node/TypeScript resolvers return
`ERR_PACKAGE_PATH_NOT_EXPORTED` if you try to import from it.

- **Action:** replace `@ngx-signal-forms/toolkit/core` imports with
  `@ngx-signal-forms/toolkit` (the root entry) and only use symbols
  that are re-exported from the root barrel.
- `packages/toolkit/index.ts` is the authoritative list of the stable
  public surface, enumerated by hand (the exact export count drifts as the
  API grows — check that file directly rather than trusting a number here).
- CSS custom properties — the two-prefix (`--ngx-signal-form-*` /
  `--ngx-form-field-*`) theming convention is unchanged; see
  [`packages/toolkit/form-field/THEMING.md`](../packages/toolkit/form-field/THEMING.md#architecture-semantic-layering)
  for the full layering. **Several tokens were renamed or collapsed during
  the rc cycle** — the full before/after table is in
  [`MIGRATING_CSS_VARS.md`](./MIGRATING_CSS_VARS.md).

If you were reaching into `/core` for something that is **not**
re-exported from root, it was `@internal` and is not part of the v1
public API contract. Open an issue if you need it exposed.

See [`docs/ANGULAR_PUBLIC_API_POLICY.md`](./ANGULAR_PUBLIC_API_POLICY.md)
for the full policy.

---

## 3. Removed APIs

The following symbols existed in betas or early RCs and have been
removed. Replace them with the v1 equivalents.

| Removed API                                 | Current replacement                                                                                                                                                                                                                                                                                                                                                |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `computeShowErrors()`                       | `showErrors()`                                                                                                                                                                                                                                                                                                                                                     |
| `createShowErrorsSignal()`                  | `showErrors()`                                                                                                                                                                                                                                                                                                                                                     |
| `canSubmit()`                               | `canSubmitWithWarnings()`                                                                                                                                                                                                                                                                                                                                          |
| `isSubmitting()`                            | `submittedStatus()` from the `ngxSignalForm` directive                                                                                                                                                                                                                                                                                                             |
| `'manual'` error strategy                   | `showErrors()` + a manual `WritableSignal<boolean>`                                                                                                                                                                                                                                                                                                                |
| `fieldNameResolver` config                  | Put an `id` on the bound control element                                                                                                                                                                                                                                                                                                                           |
| `strictFieldResolution` config              | Removed — strict by default                                                                                                                                                                                                                                                                                                                                        |
| `debug` config field                        | Removed — use the `/debugger` entry point instead                                                                                                                                                                                                                                                                                                                  |
| `injectFormConfig()`                        | `inject(NGX_SIGNAL_FORMS_CONFIG)`                                                                                                                                                                                                                                                                                                                                  |
| `NgxFloatingLabelDirective`                 | `<ngx-form-field-wrapper appearance="outline">`                                                                                                                                                                                                                                                                                                                    |
| `NgxSignalFormsUserConfig` as `DeepPartial` | `Partial<NgxSignalFormsConfig>` (top-level only)                                                                                                                                                                                                                                                                                                                   |
| `walkFieldTree(form, visitor)`              | Read `form().errorSummary()` (each entry carries a `fieldTree` back-reference) for error traversal — the walker is no longer part of the **public** API                                                                                                                                                                                                            |
| `walkFieldTreeIterable(form)`               | `form().errorSummary()` covers error traversal only. `walkFieldTreeEntries` / `isFieldTree` / `InvalidFieldTreeError` are no longer exported from the root entry — they remain an **internal `/core` primitive** because `errorSummary()` lacks stable dotted paths and per-field `touched()` / `errors()` state (the `/debugger` lib still depends on the walker) |
| `NgxFormFieldAssistiveRow`                  | Removed; markup + styles inlined into `NgxFormFieldWrapper`. CSS custom-property contract preserved.                                                                                                                                                                                                                                                               |

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
| `FieldsetFeedbackAppearance`        | `NgxFormFieldsetFeedbackAppearance`                                   |
| `FieldsetSurfaceTone`               | `NgxFormFieldsetSurfaceTone`                                          |
| `FieldsetValidationSurface`         | `NgxFormFieldsetValidationSurface`                                    |
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
  'text-like': {/* … */},
  'textarea-select-like': {/* … */},
});

// after
provideNgxSignalFormControlPresets({
  'input-like': {/* … */},
  'standalone-field-like': {/* … */},
});
```

The other kinds (`checkbox`, `switch`, `radio-group`, `slider`,
`composite`) are unchanged.

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

| Before                                    | After                                                                   |
| ----------------------------------------- | ----------------------------------------------------------------------- |
| `<ngx-signal-form-field-wrapper>`         | `<ngx-form-field-wrapper>`                                              |
| `<ngx-signal-form-fieldset>`              | `<ngx-form-fieldset>`                                                   |
| `<ngx-signal-form-field-hint>`            | `<ngx-form-field-hint>`                                                 |
| `<ngx-signal-form-field-character-count>` | `<ngx-form-field-character-count>`                                      |
| `<ngx-signal-form-field-assistive-row>`   | _Removed in v1 — inlined into `<ngx-form-field-wrapper>` (no selector)_ |

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

// after — pass the form's submittedStatus value or signal directly
// (the third parameter, not an options object)
const show = showErrors(field, 'on-submit', formDirective.submittedStatus);
```

---

## 5b. Error-message registry is now strongly typed

`ErrorMessageRegistry` previously typed every value as
`string | ((params: Record<string, unknown>) => string)` behind a single
string index signature. It now maps each **built-in** validation error kind to
its concrete `NgValidationError` subtype, so factory params are typed and
autocompleted:

```ts
provideErrorMessages({
  // built-in kinds → typed params
  minLength: (error) => `At least ${error.minLength} characters`, // error: MinLengthValidationError
  min: (error) => `Must be ≥ ${error.min}`, //                       error: MinValidationError
  // custom kinds → untyped params (any), as before
  username_taken: (error) => `${error.attemptedValue} is taken`,
});
```

What changed for migrators:

- **Factories that destructured fields a built-in error does not carry now fail
  to compile.** For example `email: ({ domain }) => …` no longer type-checks —
  `EmailValidationError` has no `domain`. Move such logic to a **custom kind**,
  which keeps `any`-typed params.
- **New default messages** are emitted for error kinds Angular 22 added:
  `minDate`, `maxDate` (locale-formatted date), and `standardSchema` (surfaces
  the schema issue message). Custom kinds are still humanized from their `kind`
  string.
- **No runtime behavior change** for existing string entries or correctly typed
  factories — this is a compile-time tightening only.

## 5c. `canSubmitWithWarnings()` now aggregates descendant errors

`canSubmitWithWarnings()` previously gated on `formTree().errors()`, which
only reports the root field's **own** errors. Validators are almost always
placed on child paths (`path.email`, not `path`), so a blocking `required`
error on a child field left the root's `errors()` empty and
`canSubmitWithWarnings()` returned `true` — while its sibling helper
`submitWithWarnings()` already correctly gated on `errorSummary()` (which
aggregates descendant errors) and silently refused to submit. That mismatch
produced a dead click: the submit button computed "submittable" while the
actual submit call was a no-op.

`canSubmitWithWarnings()` now reads `formTree().errorSummary()`, matching
`submitWithWarnings()`.

**Action:** This affects forms with blocking validators on descendant paths
(the common case, e.g. `path.email`) — previously, `canSubmitWithWarnings()`
ignored those child-path errors, so such a form's submit button could appear
submittable even while a child field was invalid. After this fix, that
button will now correctly stay disabled until the child error clears. This
is the intended fix — no code changes are needed unless you were
compensating for the bug elsewhere (e.g. manually re-checking
`errorSummary()` before calling `submitWithWarnings()`).

## 5d. `injectFieldControl()` validates the resolved `FieldTree`

`injectFieldControl()` previously validated only `isRecord(control) && part
in control` while walking the dotted id path, then cast the final value to
`FieldTree<TValue>` unconditionally. Any property reachable by the path —
including one that happens to collide with non-control data on the form
object — passed silently and was returned as though it were a real
`FieldTree`, deferring the failure to a confusing error at the first
downstream call site.

`injectFieldControl()` now validates the resolved value with the existing
`isFieldTree()` runtime guard and throws the same descriptive
`"Field "…" not found in form"` error immediately when it fails the check.

**Action:** No change needed for real Angular `form()` trees — they always
satisfy the `FieldTree` contract. If you were passing a hand-rolled mock form
into toolkit-consuming code under test, make sure the mocked leaf values are
callable and resolve to an object exposing `value`, `touched`, `errors`,
`errorSummary`, `submitting`, and `markAsTouched` as functions, plus a
`fieldTree` back-reference to the callable itself (mirrors what
`walkFieldTreeEntries()` already requires).

Resolution also remains a **one-shot, non-reactive** lookup — the form
instance and the element's `id` are both read once, at call time. This was
previously undocumented; see the updated `injectFieldControl()` JSDoc.

---

## 6. v1.0.0 audit blockers: live-region, focus, and dark-mode fixes

The `assistive` entry point (`NgxFormFieldError`, `NgxFormFieldNotification`,
`NgxFormFieldErrorSummary`) shipped a handful of accessibility defects that
were fixed as part of the v1.0.0 release audit. None of these rename or
remove an input/output, but they change runtime DOM/behavior in ways some
consumers (especially tests) may depend on.

### `id` binding no longer emits the literal string `"null"`

`NgxFormFieldError`'s error/warning containers used a **property** binding
(`[id]`) for their generated id. Binding `null` to the DOM `id` property
coerces to the string `"null"` (WebIDL `DOMString`), so every empty
container in the document ended up with `id="null"` — a real duplicate-id
bug. This is now an **attribute** binding (`[attr.id]`), matching
`NgxFormFieldNotification`, so a `null`/unresolvable id removes the
attribute entirely instead of emitting `"null"`.

- **Before:** `id="null"` could appear on empty error/warning containers.
- **After:** the `id` attribute is simply absent.
- If any test asserted `element.getAttribute('id') === 'null'`, update it to
  assert `element.hasAttribute('id') === false`.

### Empty live regions no longer toggle `aria-hidden` / `[hidden]`

`NgxFormFieldError`, `NgxFormFieldNotification`, and
`NgxFormFieldErrorSummary` previously toggled `aria-hidden="true"` and
`[hidden]` on their live-region containers while empty, removing them from
the DOM once the first error/warning/entry arrived. Flipping `aria-hidden`
off in the same change-detection pass that inserts the first message is
functionally equivalent to inserting a brand-new live region — which
reintroduces the exact NVDA + Chrome "missed first announcement" bug the
always-mounted container pattern exists to avoid.

The containers now stay mounted **and exposed** at all times; the `@if` in
each template already guarantees zero content (including whitespace) while
empty, and visual collapse is handled entirely by the existing `--empty`
CSS class.

- **Before:** `screen.queryByRole('alert')` (and `'status'`) returned `null`
  while there were no errors/warnings/entries, because the empty container
  carried `aria-hidden`/`[hidden]` and Testing Library's accessible-role
  queries exclude hidden elements by default.
- **After:** the container is always found by role; assert on its content
  instead — e.g. `expect(screen.queryByRole('alert')?.textContent?.trim() ?? '').toBe('')`.
- `NgxFormFieldErrorSummary`'s `role="alert"` container is now also
  rendered unconditionally (previously it was only added to the DOM once
  there were entries, which risked the same missed-first-announcement
  timing bug on the very first submit).

### `NgxFormFieldErrorSummary` `autoFocus` no longer fires under `'on-touch'` / `'immediate'`

`autoFocus` (default `true`) is documented as implementing the GOV.UK/WAI
pattern of moving focus to the summary "after a failed submit." Previously
it fired on _any_ 0 → N entries transition, including under the default
`'on-touch'` strategy — so blurring the first invalid field mid-fill (or,
under `'immediate'`, simply loading an already-invalid form) silently
stole focus. This violated WCAG 3.2.1/3.2.2 and contradicted the documented
contract.

`autoFocus` now only moves focus when the resolved strategy (explicit
`strategy` input → form context → `'on-touch'` default) is `'on-submit'`.
Under `'on-touch'`/`'immediate'`, focus is never moved automatically,
regardless of the `autoFocus` value.

- If you depended on the old on-touch/immediate auto-focus behavior, move
  focus yourself (e.g. in a submit handler) or switch the summary's
  `strategy` to `'on-submit'`.
- The new `resolvedStrategy` signal is exposed on the headless
  `NgxHeadlessErrorSummary` directive if you need to replicate this gating
  in a custom summary UI.

### Dark mode: `:host-context(.dark)` heuristic removed

`NgxFormFieldError` and `NgxFormFieldNotification` previously shipped a
`:host-context(.dark)` / `:host-context(:root:not(.dark))` heuristic
alongside their `prefers-color-scheme: dark` media query, intended to
support class-based dark-mode toggling (e.g. Tailwind's `.dark` strategy).
`:host-context()` is non-standard and unsupported in Firefox and Safari, so
the three engines disagreed on the resulting colors — in some
configurations this produced WCAG 1.4.3 contrast failures (as low as
~1.8:1). The heuristic has been removed; built-in dark defaults are now
driven by `prefers-color-scheme` only, consistently across all engines.

- **Breaking for class-based dark-mode consumers:** if your app toggles a
  `.dark` class instead of relying on the OS color scheme, the built-in
  dark tokens will no longer activate. Override the public
  `--ngx-signal-form-error-*` / `--ngx-signal-form-warning-*` /
  `--ngx-signal-form-notification-*` custom properties yourself, scoped to
  your `.dark` selector — see the [assistive README](../packages/toolkit/assistive/README.md#dark-mode).

---

## 7. Additional current APIs worth adopting

The following additions are part of the current public surface. They are
non-breaking (except where noted) but are worth calling out because they change
what the defaults cover and what you may want to adopt before going stable.

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

- `provideFieldLabels()` for mapping field paths to human-readable labels
  (used by error summary).
- `isBlockingError` / `isWarningError` / `warningError` helpers and
  the split between blocking errors and warnings, so
  `canSubmitWithWarnings()` lets a form submit while soft warnings
  remain visible. See [`docs/WARNINGS_SUPPORT.md`](./WARNINGS_SUPPORT.md).

### Headless error-message resolution — `createErrorMessageSignal()`

`@ngx-signal-forms/toolkit/headless` now exports a `createErrorMessageSignal(field, options?)`
primitive that returns a `Signal<readonly ResolvedFieldError[]>` combining the visibility
cascade (`createErrorVisibility`), the 3-tier message cascade (validator `message` →
`NGX_ERROR_MESSAGES` registry → default), and stable per-error DOM IDs
(`{fieldName}-error-{kind}` via `generateErrorId`). Each entry is `{ kind, message, id, error }`
— `kind`/`message`/`id` lifted to the top level for template ergonomics, with the raw
`ValidationError` retained on `.error` for consumers that need validator params.

Use it when you want the directive's resolution logic without the directive itself — for
example inside a custom error renderer driven via `*ngComponentOutlet` or any component
reading errors directly off a `FieldTree`. The in-tree `NgxFormFieldError` now consumes
this primitive, so external renderers and the wrapper share one resolution path.

```ts
import { createErrorMessageSignal } from '@ngx-signal-forms/toolkit/headless';

readonly resolvedErrors = createErrorMessageSignal(() => this.field()(), {
  fieldName: 'email',
  // includeWarnings: false (default) | true | 'only'
});
```

See [`packages/toolkit/headless/README.md`](../packages/toolkit/headless/README.md#createerrormessagesignal)
for full options and worked examples.

### Internal debugger entry point

The `@ngx-signal-forms/debugger` entry ships a development-only
component that replaces the old `debug: true` config flag. Gate it with
`isDevMode()` and drop it anywhere in the form template:

```ts
import { NgxSignalFormDebugger } from '@ngx-signal-forms/debugger';

@Component({
  imports: [NgxSignalFormDebugger /* … */],
  template: `
    @if (isDev()) {
      <ngx-signal-form-debugger [formTree]="form" />
    }
  `,
})
```

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

| Input             | Type                                           | Purpose                                                                                                                       |
| ----------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `errors`          | `ReactiveOrStatic<readonly ValidationError[]>` | Render pre-aggregated errors (e.g. fieldset-level); accepts a plain array or a signal (unwrapped internally). Takes priority. |
| `warningStrategy` | `ErrorDisplayStrategy`                         | See above                                                                                                                     |
| `listStyle`       | `'plain' \| 'bullets'`                         | Visual rendering of the message list                                                                                          |
| `submittedStatus` | `SubmittedStatus`                              | Manual override for `'on-submit'` timing                                                                                      |

### Fieldset (component + headless directive)

- New `includeNestedErrors` input (default `false`): when `true`, aggregates
  descendant-field errors instead of only direct group-level errors.
- New `submittedStatus` input on the headless fieldset directive to support
  `'on-submit'` strategy without a form-level `ngxSignalForm`.
- **Headless signal rename (breaking for direct consumers):** the directive's
  `submittedStatus` signal is now exposed as `resolvedSubmittedStatus`, and
  `strategy` is surfaced as `resolvedStrategy`. If you were reading either
  signal from a template reference variable or via dependency injection,
  update the property name.
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
containing the wrapper, fieldset, hint, error, character-count, and auto-ARIA
directive. Drop it into `imports` instead of listing each piece:

```ts
import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';

@Component({
  imports: [FormField, NgxFormField],
  // …
})
```

### Vest adapter additions

- **BREAKING — `resetOnDestroy` now defaults to `true`.** The adapter wires
  `suite.reset()` into `DestroyRef` by default so module-scope suites don't leak
  state across component mounts (previously this was opt-in via
  `resetOnDestroy: true`, defaulting to `false`).

  **Action:** Consumers who deliberately rely on persisted suite state across
  mounts (e.g. memoized async results or accumulated suite state intended to
  survive a remount) **must now pass `{ resetOnDestroy: false }`** to opt out.
  Everyone else can drop the now-redundant `{ resetOnDestroy: true }` — it is the
  default.

  ```typescript
  // Before (v1 beta): opt in to reset
  validateVest(path, suite, { resetOnDestroy: true });

  // After (v1): reset is the default — opt out to persist state
  validateVest(path, suite); // resets on teardown
  validateVest(path, suite, { resetOnDestroy: false }); // persists across mounts
  ```

- `only: (ctx) => string | string[] | undefined` — threads a focused field name
  into `suite.run(value, fieldName)` (or `suite.only(field).run(...)`), enabling
  per-field Vest runs for large suites.
- `focusCurrentField: true` — derives the focused Vest field name automatically
  from the bound field's `ctx.pathKeys()` (dotted, e.g. `items.0.sku`); ignored
  when `only` is set and falls back to a whole-suite run when bound to the form
  root.
- Exported kind prefixes `VEST_ERROR_KIND_PREFIX` (`'vest:'`) and
  `VEST_WARNING_KIND_PREFIX` (`'warn:vest:'`) for stable consumer checks.

See [`packages/toolkit/vest/README.md`](../packages/toolkit/vest/README.md#suite-lifecycle)
for the full suite-lifecycle discussion.

### Vest v1.0.0 audit fixes (non-breaking)

These are bug fixes, not public API changes — no consumer code changes are
required. Listed here because they change previously-broken observable
behavior:

- **Fixed: a superseded focused run could leave a field permanently
  `pending()`.** Vest 6 tracks a single resolver per suite instance, so two
  registrations of the same suite on different fields (e.g. two
  `focusCurrentField` validators) could steal each other's resolver, leaving
  the earlier field's async validation stuck pending forever. The adapter now
  falls back to the suite's `subscribe`/`get` API (when available) to detect
  settlement independently of the stolen resolver. `VestRunnableSuite` gained
  two new **optional** members, `subscribe` and `get`, to support this —
  existing suite shapes that omit them keep working unchanged.
- **Fixed: cross-field error mis-attribution for subfield-bound validators.**
  A `focusCurrentField`-bound validator (e.g. bound to `path.email`) could
  surface an unrelated field's retained Vest failure (e.g. `password`) as if
  it belonged to its own bound field, because Vest's `only()` mode retains
  other fields' previous failures in the same result. Validators bound to a
  specific field now only map entries for that field (or its descendants).
- **Fixed: a sync Vest warning could permanently suppress a blocking async
  Vest error on the same field.** Angular's `validateAsync` only schedules its
  resource when the bound subtree has zero sync errors, and toolkit warnings
  are ordinary `ValidationError`s. A sync `warn()` result therefore silently
  prevented the async phase (and any blocking async check, e.g. a
  "username already taken" check) from ever running. The adapter now defers
  surfacing a sync warning only while the suite has pending async tests, and
  re-surfaces it together with the settled result — so an advisory warning
  can no longer hide a blocking async error. If you inspect warnings
  synchronously (without waiting for `whenStable()`/the async result), a
  warning may now appear one tick later than before while async tests are
  in flight.
- **Fixed (#214): a suite instance shared across two concurrently-mounted,
  independent field trees could cross-contaminate their results.** Vest
  suites created via `create()` hold exactly ONE canonical accumulated result
  per suite _object_. When the SAME suite instance backed two unrelated,
  simultaneously-live `form()` trees (e.g. a module-scope suite reused by
  repeated form rows) with overlapping in-flight async validation, one tree
  could observe the OTHER tree's outcome instead of its own once both runs
  settled. The adapter now detects this exact overlap — two different field
  trees with a concurrently pending, unfocused run against the same suite —
  and defers the later-arriving tree's actual `suite.run()` call until the
  suite is idle, so the two runs never overlap. This is scoped to unfocused
  (whole-suite) runs only: the wave-3 pattern of several `focusCurrentField`/
  `only` registrations for different fields of the SAME form intentionally
  keeps sharing the suite's retained state and is unaffected. The only
  observable change is a small added latency for the rare case of two
  independent, concurrently-validating trees sharing one suite instance — the
  later one's validation now genuinely waits for the earlier one's async work
  to finish before its own starts, rather than racing it (and getting
  intermittently-wrong results). Consumers who give each field tree its own
  suite instance (or who don't share a suite across concurrently-mounted
  forms at all) see no behavior change.

### Vest peer dependency range widened

`vest@6.3.0` was previously excluded from the `vest` peer range
(`>=6.0.0 <6.3.0 || >=6.3.1`) over an unverified packaging-defect claim, and
the `>=6.3.1` half of that range pointed at a version that was never
published as stable (only `6.3.2` was). The peer range is now simply
`>=6.0.0` — see [`COMPATIBILITY.md`](../COMPATIBILITY.md#vest-compatibility).
This is a relaxation, not a breaking change.

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
`>=22.0.0 <23.0.0`. See [`COMPATIBILITY.md`](../COMPATIBILITY.md) for the
reasoning. If you are already on Angular 22, no migration action is required.

### `@angular/common` is now a declared peer dependency

`NgxFormFieldWrapper` and `NgxFormFieldset` have always imported
`NgComponentOutlet` / `NgTemplateOutlet` from `@angular/common` at runtime,
but the package previously declared `@angular/common` as a devDependency
only, not a peer dependency. This worked by accident whenever a consuming
app already depended on `@angular/common` (virtually all Angular apps do),
but strict installers and dependency audits correctly flagged it as an
undeclared dependency. `package.json` now lists
`"@angular/common": ">=22.0.0 <23.0.0"` under `peerDependencies`, matching
the `@angular/core` / `@angular/forms` range. No action is required for
apps that already have `@angular/common` installed (every Angular app
does); package managers with strict peer resolution will now correctly
surface it instead of silently allowing the gap.

---

## 8. Headless audit fixes (v1.0.0)

A pre-1.0 audit of `@ngx-signal-forms/toolkit/headless` found a handful of
correctness and API-surface issues. Fixes shipped together; the API-affecting
ones are called out here.

### `ErrorSummarySignals.shouldShowWarnings` (new, breaking for interface implementers)

`NgxHeadlessErrorSummary.shouldShow` gates `entries()` on `strategy &&
hasErrors()`. That gate can never reveal `warningEntries()` on a warnings-only
form, because `hasErrors()` is permanently `false` when there are no blocking
errors. `ErrorSummarySignals` now declares a dedicated
`shouldShowWarnings: Signal<boolean>` (`strategy && hasWarnings()`) — gate
`warningEntries()` on this instead of `shouldShow()`:

```html
<!-- before — warnings could never render -->
@if (summary.shouldShow()) { @for (e of summary.warningEntries(); track e.kind)
{ … } }

<!-- after -->
@if (summary.shouldShowWarnings()) { @for (e of summary.warningEntries(); track
e.kind) { … } }
```

If you implement `ErrorSummarySignals` yourself (e.g. a custom summary
directive), add the new member.

### `CharacterCountResult` — real `Signal<T>` typing + `hasLimit`

`createCharacterCount()`'s return type previously typed every member as the
looser `ReadSignal<T>` (`= () => T`) alias, even though every member was
already a real `computed()` at runtime. Members are now typed `Signal<T>`,
matching `NgxHeadlessCharacterCount`'s own `CharacterCountStateSignals`. A new
`hasLimit: Signal<boolean>` member was added (always `true` — `maxLength` is
required — kept for symmetry with the directive's `hasLimit`). This is a
compile-time tightening with no runtime change; it only affects code that
assigned the factory's return values to a hand-rolled `() => T`-shaped type
that isn't a real `Signal`.

### Error summary: per-field deduplication

`NgxHeadlessErrorSummary` deduplicated entries by `kind + message` only. Two
different fields both failing `required()` with no custom `message` (Angular's
default `ValidationError.message` is `undefined`) shared the same dedupe key
and the second field's error was silently dropped from the summary — a WCAG
3.3.1 violation. Deduplication is now per-field. If your tests asserted the
old (buggy) collapsed count for a summary with multiple message-less errors on
distinct fields, update the expected entry count.

`NgxHeadlessFieldset`'s grouped-message dedupe (a documented feature, not a
bug) is unchanged.

### `NgxHeadlessNotification` — warning messages no longer leak `warn:`

Message-less warnings with an unknown kind (e.g. `warningError('weak_password')`)
previously rendered as `warn:weak password` inside the notification's warning
live region because the internal `warn:` prefix wasn't stripped. It now
resolves to `weak password`, consistent with every other headless surface
(`NgxHeadlessErrorState`, `NgxHeadlessErrorSummary`,
`createErrorMessageSignal`). Update any test/snapshot asserting the old
`warn:`-prefixed text.

### `createErrorMessageSignal` — ID fallback strips the Angular-internal prefix

When `options.fieldName` is omitted, the per-error DOM id fallback previously
used `FieldState.name()` raw — which is Angular-internal-prefixed
(`${APP_ID}.form${n}.path`, e.g. `ng.form0.email`) and varies per form
instance. IDs are now derived from the stripped path (`email-error-required`),
matching the ids the in-tree wrapper and other consumers derive from the same
field. This restores the documented "lockstep" ID guarantee; pass an explicit
`fieldName` if you need to keep a specific id shape.

### Field-optionality — `Date` / `File` / `Map`-valued required leaves

`summarizeFieldOptionality()` / `createFieldOptionalitySummary()` walked the
`FieldTree` using "is this node iterable?" as a container check. Angular gives
any field whose _current_ value is a non-null object (including `Date`,
`File`, `Map`) an iterator, so a required `Date | null` field flipped out of
the walk — and lost its `hasRequired` contribution — the moment it was
populated. The walk now distinguishes genuine structural containers (plain
objects / arrays) from boxed leaf values, so a required `Date`/`File`/`Map`
leaf is counted consistently whether it's `null` or populated.

---

## 9. Migration checklist

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

- **Apply the current rc.11 API changes** when upgrading from any earlier
  release candidate:
  - replace form-level `errorStrategy="inherit"` with a concrete strategy or
    remove the binding;
  - replace `[formField]` with `[formTree]` on `NgxFormMarkingLegend`;
  - remove notification `tone` bindings and imports of
    `NgxNotificationTone` / `NgxFormFieldNotificationTone`;
  - rename `NgxFieldset*` option types to `NgxFormFieldset*`;
  - rename direct headless `showErrors` / `showWarnings` reads to
    `shouldShowErrors` / `shouldShowWarnings`;
  - add `@angular/common` to direct dependencies when strict peer resolution
    requires it.
    Read [`docs/migrations/v1.0.0-rc.11.md`](./migrations/v1.0.0-rc.11.md) for
    the bounded rc.10 → rc.11 upgrade guide and before/after templates.

- **Run your consumer's existing type-check, build, and relevant tests** to
  catch remaining references and behavior changes.

- **Sweep your stylesheets for renamed/removed CSS custom properties**
  if you themed the toolkit — see
  [`MIGRATING_CSS_VARS.md`](./MIGRATING_CSS_VARS.md) for the full
  before/after tables and a sanity-check grep command.

---

## Reference

- [`docs/ANGULAR_PUBLIC_API_POLICY.md`](./ANGULAR_PUBLIC_API_POLICY.md)
  — the boundary between Angular Signal Forms and toolkit, plus the
  build-time-only `/core` story.
- [`docs/MIGRATING_CSS_VARS.md`](./MIGRATING_CSS_VARS.md) — every
  renamed or removed CSS custom property with before/after examples.
- [`docs/migrations/README.md`](./migrations/README.md) — version-to-version
  release-candidate and stable upgrade guides.
- [`docs/CUSTOM_CONTROLS.md`](./CUSTOM_CONTROLS.md) — control semantics,
  manual ARIA ownership, third-party component patterns.
- [`docs/COMPLEX_NESTED_FORMS.md`](./COMPLEX_NESTED_FORMS.md) — fieldset
  aggregation and error summary usage.
- [`docs/WARNINGS_SUPPORT.md`](./WARNINGS_SUPPORT.md) — the warning
  convention and message resolution order.

---

## 10. `form-field` v1.0.0 audit blockers

The `form-field` entry point (`NgxFormFieldWrapper`, `NgxFormFieldset`) and
its `NgxFormFieldError` collaborator shipped several defects fixed as part
of the v1.0.0 release audit. Most are non-breaking bug fixes; the ones with
observable behavior changes are called out below.

### New: `warningStrategy` input on `NgxFormFieldWrapper`

The wrapper previously only mounted its projected error/warning renderer
when the **blocking-error** strategy (`strategy`, default `'on-touch'`)
said errors should show — so a warnings-only field never rendered anything
until the field was touched (or submitted), even though `NgxFormFieldError`
defaults its own warning timing to `'immediate'`. The wrapper now exposes a
`warningStrategy` input (forwarded to the renderer) and mounts the renderer
whenever errors **or** warnings should be visible, matching the
already-documented "warning timing is independent of error timing"
contract. Non-breaking / additive — no action required unless you want to
override the new input.

### Breaking (a11y fix): warnings no longer render alongside a visible blocking error

`NgxFormFieldError`'s warning live region (`role="status"`) previously
rendered even while the error live region (`role="alert"`) was also
visible for the same field — assertive **and** polite announcements firing
for one field at once. It now suppresses the warning region whenever a
blocking error is visible, matching `NgxFormFieldset`'s existing
"warnings hidden while errors present" behavior and the form-field
`README`'s documented contract. The corresponding `${fieldName}-warning`
id is also dropped from the composed `aria-describedby` in that state (see
`createAriaDescribedBySignal`) so nothing dangles.

- If a test asserted both a populated `role="alert"` and a populated
  `role="status"` for the same mixed error+warning field, update it to
  expect the `role="status"` container to be empty (it stays mounted per
  WCAG 4.1.3, just without an `id` or content) while errors are visible.

### Fix: dev-mode "could not resolve field name" diagnostics no longer fire spuriously

Both `NgxFormFieldWrapper.resolvedFieldName` and `NgxFormFieldError`'s
internal field-name resolution used to log their one-shot `console.error`
from inside a `computed()`. Projected children (`NgxFormFieldHint`,
`NgxFormFieldError` itself when nested in the wrapper) read that computed
via `NGX_SIGNAL_FORM_FIELD_CONTEXT` during the wrapper's first
change-detection pass — before `afterEveryRender` had populated the
resolved name — so the diagnostic fired even for correctly configured
fields (input with an `id`, no explicit `fieldName`). Both diagnostics now
fire from `afterEveryRender` once the DOM state has settled instead.

- If a unit test asserted `console.error` was called by reading
  `resolvedFieldName()` (or rendering) without ever running change
  detection, it now needs a render + `fixture.detectChanges()` /
  `await fixture.whenStable()` pass before the diagnostic fires. (Any
  test exercised through `@testing-library/angular`'s `render()` already
  gets this for free.)

### Fix: `[hidden]` on the wrapper host now actually hides the field

`ngx-form-field-wrapper`'s `:host { display: flex }` rule is author-origin
CSS, which beats the (non-`!important`) UA-stylesheet `[hidden] { display:
none }` rule regardless of specificity — so a field marked `hidden()` by
Angular Signal Forms kept rendering fully visible and focusable despite
carrying the `hidden` attribute. `:host([hidden]) { display: none
!important; }` has been added so the documented safety net actually works.
If you were relying on the old (broken) behavior to keep a `hidden()`
field visible, add your own `@if` instead of the `hidden()` schema logic.

### Fix: bound-control discovery no longer misroutes to a `[prefix]`/label-slot decoy

The wrapper's fallback DOM probe (used for plain controls without their
own `[formField]` binding, mocked field states, and the pre-init render
window) queried the whole wrapper host with one selector, which returns
the first match in **document order** — not by resolution tier. An
id-bearing `[prefix]`/label-slot element (e.g. a password-visibility
toggle button) could therefore outrank the real control in the `__main`
slot, silently misrouting `fieldName`, `data-signal-field`, semantics, and
required-detection. The probe now checks `__main` first and only falls
back to a whole-host scan when `__main` has no match (preserving the
implicit-label pattern, `<label>Email <input id="email"></label>`).
Non-breaking unless you had markup relying on the old mis-routing.

### Fix: author-supplied `aria-labelledby` / `aria-describedby` preserved instead of clobbered

`NgxFormFieldWrapper` (non-cluster mode) and `NgxFormFieldset` used to
bind `[attr.aria-labelledby]` / `[attr.aria-describedby]` unconditionally
to their internally-managed value (`null` in most cases), which silently
removed any value an author bound directly on the host element (e.g.
`<fieldset ngxFormFieldset aria-describedby="pw-rules">`). Both now merge
with (rather than replace) any author-supplied value captured at
construction — the same preservation rule auto-aria already applies to the
bound control itself.

### New: custom error-renderer `id` contract documented; `fieldName` passed through

`NgxFormFieldErrorRenderer` (`core/tokens.ts`) now documents that a custom
renderer **must** render `id="${fieldName}-error"` / `id="${fieldName}-warning"`
on the elements displaying each kind — the composed `aria-describedby`
references those ids regardless of which renderer is mounted, so a
renderer that doesn't satisfy this produces dangling references (an axe
`aria-valid-attr-value` violation). `NgxFormFieldWrapper` now also passes
`fieldName` directly to the renderer (in addition to
`{formField, strategy, submittedStatus, warningStrategy}`) so a custom
renderer can satisfy the contract without injecting
`NGX_SIGNAL_FORM_FIELD_CONTEXT` itself. See
[`docs/CUSTOM_WRAPPERS.md`](./CUSTOM_WRAPPERS.md#the-id-contract).

### New: `NgxFormField` bundle now includes `NgxSignalFormControlSemanticsDirective`

The wrapper's own "could not infer a control kind" dev warning instructs
authors to declare semantics via `ngxSignalFormControl="..."` — but that
attribute was inert for consumers who imported only the `NgxFormField`
convenience bundle (not the full `NgxSignalFormToolkit`), since the
directive that reads it was never declared. Worse, `ngxSignalFormControlAria="manual"`
was silently ignored while `NgxSignalFormAutoAria` (which the bundle does
include) kept managing ARIA anyway via its CSS attribute selector — actively
overriding what the author opted out of. `NgxFormField` now includes
`NgxSignalFormControlSemanticsDirective`; it's selector-gated and inert for
consumers who never add the attribute.

## 11. Public API consistency pass (v1.0.0 audit #165)

A pre-freeze sweep of the public surface. Breaking changes are listed first; the last two entries are deliberate design decisions recorded for clarity.

| Area                        | Before                                                                                                                                           | After                                                                                                           |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| Missing type exports        | `ErrorMessageRegistry`, `FieldLabelResolver` referenced by public signatures but unexported                                                      | both now exported from `@ngx-signal-forms/toolkit` (and `ErrorMessageRegistry` re-exported from `/headless`)    |
| Whole-tree input name       | `NgxFormMarkingLegend` took `[formField]` for a whole form root                                                                                  | now `[formTree]` (aligns with `NgxHeadlessErrorSummary`/`NgxFormFieldErrorSummary`)                             |
| Direct-errors input         | `[errors]` required a `Signal<ValidationError[]>` (`[errors]="sig"`)                                                                             | now accepts a plain array **or** a signal (unwrapped internally); pass `[errors]="sig()"` or `[errors]="array"` |
| Fieldset option types       | `NgxFieldsetAppearance`, `NgxFieldsetSurfaceTone`, `NgxFieldsetValidationSurface`, `NgxFieldsetFeedbackAppearance`                               | renamed `NgxFormFieldset*` (matches the `NgxFormFieldset` component)                                            |
| Dead input                  | `NgxHeadlessNotification`/`NgxFormFieldNotification` shipped a no-op `tone` input (+ `NgxNotificationTone`/`NgxFormFieldNotificationTone` types) | removed (tone is fully content-driven; re-adding later is non-breaking)                                         |
| Headless visibility signals | `NgxHeadlessErrorState` exposed `showErrors`/`showWarnings`; `createErrorState()` returned `showErrors`/`showWarnings`                           | both now `shouldShowErrors`/`shouldShowWarnings`, uniform with `NgxHeadlessFieldset`                            |

Bug fix (no API change): `NgxFormFieldHint` now mints its fallback id once in an injection context instead of lazily inside a computed — this removes the SSR-unsafe module-counter fallback + dev warning and stops `aria-describedby` from pointing at a stale id when the field name resolves and later clears.

Docs fix: removed phantom `@template TForm` / `@template TFieldset` JSDoc tags from `NGX_SIGNAL_FORM_CONTEXT` and `NgxFormFieldset` (neither declaration is generic).

**Intentional, documented decisions (not renamed):**

- **`strategy` (field-level) vs `errorStrategy` (form-level).** The form-level `NgxSignalForm` directive sets the workspace default via `[errorStrategy]`; individual field-level components (`NgxFormFieldWrapper`, `NgxFormFieldError`, `NgxFormFieldset`, `NgxHeadlessErrorState`, `NgxHeadlessFieldset`) override it per-field via `[strategy]`, paired with `[warningStrategy]` where warnings are configurable. This split is deliberate and preserved to avoid a churny rename of the most widely-used input. Visibility signals are uniform: `shouldShowErrors()` / `shouldShowWarnings()`.
- **`provideErrorMessages()` / `provideFieldLabels()` return `Provider` (not `EnvironmentProviders`).** These register level-agnostic registries usable in either environment or component providers — intentionally, so no `…ForComponent` variant is needed.

## Headless surfaces consistency pass (ticket #173)

Four promoted pre-1.0 findings from audit #139 (headless), all additive or
behavior-only fixes — no renames.

- **`NGX_SIGNAL_FORMS_CONFIG.defaultErrorStrategy` now honored by every
  standalone headless error surface, not just `NgxHeadlessFieldset`.**
  `NgxHeadlessErrorState`, `NgxHeadlessErrorSummary`, `createErrorState()`,
  and `createErrorMessageSignal()` previously hard-fell-back to `'on-touch'`
  when used outside an `[ngxSignalForm]` host, ignoring
  `provideNgxSignalFormsConfig({ defaultErrorStrategy: 'immediate' })`.
  All headless surfaces now apply the same cascade `NgxHeadlessFieldset`
  already used: explicit `strategy` → form context →
  `NGX_SIGNAL_FORMS_CONFIG.defaultErrorStrategy` → `'on-touch'`. If your
  standalone (no form host) headless usage relied on the old hard-coded
  `'on-touch'` behavior while also configuring a non-default
  `defaultErrorStrategy` globally, it now picks up that global default —
  scope the config with `provideNgxSignalFormsConfigForComponent()` if you
  need per-usage isolation. As a building block, `createErrorVisibility()`
  (core) gained a new opt-in `configDefault` option to support this; it is
  not auto-injected there, so existing core consumers (e.g.
  `NgxSignalFormAutoAria`) are unaffected.
- **`NgxHeadlessFieldset` gained `resolvedErrors` / `resolvedWarnings`
  signals.** The directive previously exposed only raw `aggregatedErrors`/
  `aggregatedWarnings`, whose `ValidationError.message` is `undefined` for
  framework-default errors (e.g. `required(path.x)` with no `message`
  option) — the documented usage example rendered empty spans for the most
  common validator usage. `resolvedErrors()`/`resolvedWarnings()` apply the
  same 3-tier message priority (validator message → `NGX_ERROR_MESSAGES`
  registry → default) as `NgxHeadlessErrorState.resolvedErrors`. Purely
  additive; existing `aggregatedErrors()`/`aggregatedWarnings()` consumers
  are unaffected.
- **`NgxHeadlessFieldset.fields` now distinguishes `null` ("not provided")
  from an explicitly bound `[]` ("provided but empty").** Previously both
  fell back to aggregating the fieldset's own (nested) errors, so a
  consumer dynamically computing the field list got surprising fallback
  errors when that list legitimately became empty. `[]` now aggregates
  nothing. Also retyped from `FieldTree<unknown>[] | null` to
  `readonly FieldTree<unknown>[] | null` for consistency with the rest of
  the toolkit — passing a mutable array still works (arrays are assignable
  to their readonly form).
- **`createErrorState()` gained an optional `injector` option**, routed
  through `assertInjector` like the sibling factories
  `createErrorVisibility()` and `createErrorMessageSignal()`. Callers no
  longer must wrap every call in `runInInjectionContext()`. Purely
  additive.

## 12. `@ngx-signal-forms/toolkit/testing` restored as a real secondary entry point (audit #142/#176)

`packages/toolkit/testing/` previously contained only an internal spec helper
(`a11y.ts`) with no `ng-package.json`/`package.json` — unlike every other
secondary entry point, it could not actually be imported as
`@ngx-signal-forms/toolkit/testing`. This is now a real, published entry
point:

- **New public API:** `expectNoA11yViolations(context?, options?)` and
  `WCAG_22_AA_TAGS` (+ `WCAG_22_AA_TAG` type) are importable from
  `@ngx-signal-forms/toolkit/testing`. See the
  [Accessibility testing harness](../packages/toolkit/README.md#accessibility-testing-harness)
  section of the toolkit README.
- **New optional peer dependency:** `axe-core` is now listed under
  `peerDependencies`/`peerDependenciesMeta` (optional) on
  `@ngx-signal-forms/toolkit`. Install it yourself if you use the `/testing`
  entry point; nothing else in the toolkit requires it.
- **Docs fix:** the JSDoc on `WCAG_22_AA_TAGS` incorrectly claimed axe-core's
  `wcag22aa` tag covers the two new WCAG 2.2 Level A criteria (Consistent
  Help, Redundant Entry). It does not — axe-core has no automated rule for
  either; there is no `wcag22a` tag because there is nothing for it to
  contain. Both criteria must be verified manually. The identical wrong claim
  in `tools/a11y/scan.ts` (the demo apps' Playwright baseline-scan helper) is
  fixed the same way, and that file now imports `WCAG_22_AA_TAGS` from
  `@ngx-signal-forms/toolkit/testing` instead of keeping its own
  comment-only-lockstep copy.
- **Dead code removed:** `packages/toolkit/test.utilities.ts`
  (`runInAngular`) had zero importers and a `@example` calling functions that
  don't exist anywhere in this repo. Deleted rather than published, since
  promoting it would have required writing a truthful example from scratch.

## Form-level `errorStrategy` no longer accepts `'inherit'` (#178)

`NgxSignalForm`'s `[errorStrategy]` input is now typed `ResolvedErrorDisplayStrategy` (`'immediate' | 'on-touch' | 'on-submit'`) instead of `ErrorDisplayStrategy`. `'inherit'` is a field-level-only value — there is nothing above the form root to inherit from — and was already silently treated as "use the default", so binding `[errorStrategy]="'inherit'"` on a `<form ngxSignalForm>` is now a compile-time error. **Fix:** remove the binding (the default already applies) or pass a concrete strategy. Field-level `[strategy]` still accepts `'inherit'`.

## New API: `requiredFromStandardSchema()` — `aria-required` for Standard Schema (Zod, etc.) fields (#118)

**Root cause:** `validateStandardSchema()` (from `@angular/forms/signals`) only
registers tree-level validation errors — it never touches Angular's
`REQUIRED` metadata, because the Standard Schema spec has no runtime way to
ask "is this key required?" (no shape/keys introspection, only
`~standard.validate(value)`). Without `REQUIRED` metadata,
`FieldState.required()` stayed `false` for every Zod/Valibot/ArkType-validated
field, so `NgxSignalFormAutoAria` never wrote `aria-required`, and
`ngx-form-field-wrapper`'s `showMarkerWhen: 'required'` auto-marker never
fired for them — only hand-written `required()` fields got the marker. The
`advanced-wizard` demo had worked around this with a hardcoded `*` span in
the label (kept intentionally pending this fix, see #117).

**New public API:** `requiredFromStandardSchema(path, schema)`, exported from
`@ngx-signal-forms/toolkit` (and `/core`). It closes the gap with the only
library-agnostic technique available: probing the schema with the field's own
key set to `undefined` (via `~standard.validate({ [key]: undefined })`) and
registering the result as `REQUIRED` metadata via Angular's own `metadata()` +
`REQUIRED` key. `REQUIRED` is an OR-reducing metadata key, so this composes
safely alongside `required()`/other `metadata(path, REQUIRED, …)`
registrations on the same field.

Call it once per field, bound directly to that field's own path, next to the
`validateStandardSchema()` call that validates the object owning it —
Standard Schema doesn't expose an object's keys at runtime, so there is no
way to derive every required field from a single root-level call:

```typescript
import { form, validateStandardSchema } from '@angular/forms/signals';
import { requiredFromStandardSchema } from '@ngx-signal-forms/toolkit';

const travelerForm = form(model, (path) => {
  validateStandardSchema(path, TravelerSchema);
  requiredFromStandardSchema(path.firstName, TravelerSchema);
  requiredFromStandardSchema(path.lastName, TravelerSchema);
});
```

**Known limitations** (documented on the function's JSDoc, not silently
papered over):

- Async validators (`~standard.validate` returning a `Promise`) can't be
  resolved synchronously, so the probe reports "not required" rather than
  block the reactive metadata graph on an async result.
- A schema that throws while being probed (e.g. a `.refine()` that assumes
  other fields are present) is treated as "not required" rather than
  propagating the exception into form compilation.
- Required-ness that only exists via cross-field refinement (e.g. "email is
  required only when phone is empty") isn't captured — only the field's
  unconditional base-schema requiredness is.

**Demo fix:** `apps/demo/src/app/05-advanced/advanced-wizard`'s
`traveler-step.form.ts` / `trip-step.form.ts` now call
`requiredFromStandardSchema()` for their Zod-required fields, and the
hardcoded `<span class="text-red-500">*</span>` markers have been removed
from `traveler-step.ts` / `trip-step.ts` — the wrapper's auto-marker now
covers them, consistent with every other demo. Purely additive; no existing
API changed.
