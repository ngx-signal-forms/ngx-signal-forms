---
title: 'Migrating from beta to v1'
sidebarTitle: 'Beta to v1'
---

Use this guide to upgrade from `1.0.0-beta.10` or an earlier release candidate
to `1.0.0`. Apply the items that affect your integration.

If you use `1.0.0-rc.16`, start with [Changes since rc.16](#changes-since-rc16). For CSS custom property renames, see [Migrating CSS custom properties](./MIGRATING_CSS_VARS.md).

## 1. `NgxSignalForm` is an additive enhancer

In beta releases, the toolkit directive used the `form[formRoot]` selector and
replaced Angular's own `FormRoot` behavior. Now `NgxSignalForm` is an additive
directive with selector `form[formRoot][ngxSignalForm]` and export name
`ngxSignalForm` (previously `ngxFormRoot`).

```html
<!-- before (beta.10) -->
<form [formRoot]="myForm" [errorStrategy]="'on-touch'"></form>

<!-- after (v1) -->
<form [formRoot]="myForm" ngxSignalForm errorStrategy="on-touch"></form>
```

Notes:

- `NgxSignalForm` accepts `errorStrategy` and `warningStrategy` (neither accepts
  `'inherit'`). `submittedStatus` is a read-only signal on the directive.
- Basic forms using default `on-touch` timing work with `[formRoot]` alone. Add
  `ngxSignalForm` when you use `on-submit`, set a form-level strategy, or render
  an error summary.
- `NgxSignalFormToolkit` re-exports Angular's `FormRoot` alongside
  `NgxSignalForm`, `NgxSignalFormAutoAria`, and `NgxSignalFormControl`.

## 2. `/core` is internal

`@ngx-signal-forms/toolkit/core` is no longer in the published `exports` map.
Import public core directives, providers, tokens, and utilities from the root entry
point `@ngx-signal-forms/toolkit`.

## 3. Removed APIs and replacements

| Removed API                                                       | Current replacement                                                                                                                                                    |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `computeShowErrors()`, `createShowErrorsSignal()`, `showErrors()` | `createErrorVisibility()` from `@ngx-signal-forms/toolkit`                                                                                                             |
| `canSubmit()`                                                     | `canSubmitWithWarnings()`                                                                                                                                              |
| `isSubmitting()`                                                  | `form().submitting()`, or `submittedStatus() === 'submitting'` on `NgxSignalForm`                                                                                      |
| `'manual'` error strategy                                         | Pass a `Signal<boolean>` as `showErrors` to `createErrorSummaryEntries()` or `createFieldsetAggregation()`                                                             |
| `fieldNameResolver` config                                        | Put a stable `id` on the control, or pass `fieldName` to the wrapper                                                                                                   |
| `strictFieldResolution` config                                    | Removed (strict by default; missing names log a dev-mode error)                                                                                                        |
| `debug` config field                                              | Removed; the debugger is repository-internal (`@ngx-signal-forms/debugger`)                                                                                            |
| `autoAria` config field                                           | Use `ngxSignalFormControlAria="manual"`, `ngxSignalFormAutoAriaDisabled`, or a preset such as `provideNgxSignalFormControlPresets({ slider: { ariaMode: 'manual' } })` |
| `injectFormConfig()`                                              | `inject(NGX_SIGNAL_FORMS_CONFIG)`                                                                                                                                      |
| `injectFieldControl()`                                            | Removed; pass the `FieldTree` directly                                                                                                                                 |
| `getDefaultValidationMessage()`                                   | `resolveValidationErrorMessage()`                                                                                                                                      |
| `NgxFloatingLabelDirective`                                       | `<ngx-form-field-wrapper appearance="outline">`                                                                                                                        |
| `NgxFormFieldAssistiveRow`                                        | Inlined into `NgxFormFieldWrapper`                                                                                                                                     |
| `NgxFormFieldNotification`                                        | `<ngx-form-field-error presentation="panel">`                                                                                                                          |
| `NgxHeadlessNotification`                                         | `NgxHeadlessErrorState` with `errorsOverride`                                                                                                                          |
| `NgxFormFieldErrorListStyle`, `NgxFormFieldNotificationListStyle` | `NgxFormFieldListStyle` from `@ngx-signal-forms/toolkit/assistive`                                                                                                     |
| `NgxFormFieldCharacterCount` `colorThresholds` input              | CSS custom properties `--ngx-form-field-char-count-warning-threshold` and `-danger-threshold`                                                                          |
| `walkFieldTree()`, `walkFieldTreeIterable()`                      | Read `form().errorSummary()` for error traversal                                                                                                                       |
| `toHintDescriptors()`, `createErrorRendererInputs()`              | Removed from `/headless`                                                                                                                                               |
| `NgxSignalFormsUserConfig` as `DeepPartial`                       | Flat `Partial<NgxSignalFormsConfig>` (accepts explicit `undefined`)                                                                                                    |
| `expectNoA11yViolations(..., { runOnly })`                        | Use `createA11yValidator({ tags })` from `@ngx-signal-forms/toolkit/testing`                                                                                           |
| Vest `focusCurrentField` and field-scoped registration            | Bind `validateVest(path, suite, { only })` at the group or root and track the active field in `only`                                                                   |

## 4. Renamed classes, selectors, types, and options

### Class names

Component and directive classes drop the `Component` / `Directive` suffixes and
use layer-specific prefixes (`NgxSignalForm*`, `NgxFormField*`, `NgxHeadless*`):

| Before                                                                    | After                        |
| ------------------------------------------------------------------------- | ---------------------------- |
| `NgxSignalFormDirective`                                                  | `NgxSignalForm`              |
| `NgxSignalFormAutoAriaDirective`                                          | `NgxSignalFormAutoAria`      |
| `NgxSignalFormControlSemanticsDirective`                                  | `NgxSignalFormControl`       |
| `NgxSignalFormFieldWrapperComponent`                                      | `NgxFormFieldWrapper`        |
| `NgxSignalFormFieldsetComponent`                                          | `NgxFormFieldset`            |
| `NgxSignalFormErrorComponent`, `NgxFormFieldErrorComponent`               | `NgxFormFieldError`          |
| `NgxSignalFormErrorSummaryComponent`, `NgxFormFieldErrorSummaryComponent` | `NgxFormFieldErrorSummary`   |
| `NgxFormFieldHintComponent`                                               | `NgxFormFieldHint`           |
| `NgxFormFieldCharacterCountComponent`                                     | `NgxFormFieldCharacterCount` |
| `NgxHeadlessErrorStateDirective`                                          | `NgxHeadlessErrorState`      |
| `NgxHeadlessErrorSummaryDirective`                                        | `NgxHeadlessErrorSummary`    |
| `NgxHeadlessCharacterCountDirective`                                      | `NgxHeadlessCharacterCount`  |
| `NgxHeadlessFieldsetDirective`                                            | `NgxHeadlessFieldset`        |
| `NgxHeadlessFieldNameDirective`                                           | `NgxHeadlessFieldName`       |

### Element and attribute selectors

| Before                                    | After                              |
| ----------------------------------------- | ---------------------------------- |
| `<ngx-signal-form-field-wrapper>`         | `<ngx-form-field-wrapper>`         |
| `<ngx-signal-form-fieldset>`              | `<ngx-form-fieldset>`              |
| `<ngx-signal-form-error>`                 | `<ngx-form-field-error>`           |
| `<ngx-signal-form-error-summary>`         | `<ngx-form-field-error-summary>`   |
| `<ngx-signal-form-field-hint>`            | `<ngx-form-field-hint>`            |
| `<ngx-signal-form-field-character-count>` | `<ngx-form-field-character-count>` |
| `[ngxSignalFormHeadlessErrorState]`       | `[ngxHeadlessErrorState]`          |
| `[ngxSignalFormHeadlessErrorSummary]`     | `[ngxHeadlessErrorSummary]`        |
| `[ngxSignalFormHeadlessCharacterCount]`   | `[ngxHeadlessCharacterCount]`      |
| `[ngxSignalFormHeadlessFieldset]`         | `[ngxHeadlessFieldset]`            |
| `[ngxSignalFormHeadlessFieldName]`        | `[ngxHeadlessFieldName]`           |

BEM host class names (`.ngx-signal-form-field-wrapper__*`,
`.ngx-signal-form-fieldset--*`) keep their existing prefix.

### Types, appearances, and control kinds

| Before                                              | After                               |
| --------------------------------------------------- | ----------------------------------- |
| `appearance="stacked"`                              | `appearance="standard"` (default)   |
| `appearance="bare"`                                 | `appearance="plain"`                |
| Control kind `text-like`                            | `input-like`                        |
| Control kind `textarea-select-like`                 | `standalone-field-like`             |
| `FieldsetErrorPlacement`, `FormFieldErrorPlacement` | `NgxFormFieldErrorPlacement`        |
| `FieldsetFeedbackAppearance`                        | `NgxFormFieldsetFeedbackAppearance` |
| `FieldsetSurfaceTone`                               | `NgxFormFieldsetSurfaceTone`        |
| `FieldsetValidationSurface`                         | `NgxFormFieldsetValidationSurface`  |
| `ReactiveOrStatic`                                  | `NgxReactiveOrStatic`               |
| `CharacterCountResult`                              | `CharacterCountState`               |

## 5. Key behavioral and contract changes

- **`on-submit` requires a real submit status.** Without `ngxSignalForm` or an
  explicit `submittedStatus`, `on-submit` stays `'unsubmitted'` (hiding errors)
  instead of falling back to `touched`.
- **Separate `warningStrategy`.** Warnings have their own display strategy
  (default `'on-touch'`, configurable via `defaultWarningStrategy`) and stay
  hidden while a blocking error is visible on the same field.
- **`on-touch` hides feedback while editing.** Typing into an already-touched
  field hides its error until focus moves or the form submits. See
  [Changes since rc.16](#changes-since-rc16).
- **`canSubmitWithWarnings()` aggregates descendants.** Child blocking errors
  now disable submission as expected.
- **Typed `ErrorMessageRegistry`.** Factory parameters for Angular's built-in
  error kinds (`minLength`, `min`, `max`, `pattern`, etc.) are typed.
- **Dark mode uses `color-scheme` and `light-dark()`.** The old
  `:host-context(.dark)` heuristic is gone. Declare `color-scheme: light dark`
  or toggle `color-scheme` on `:root` (see
  [THEMING.md](../packages/toolkit/form-field/THEMING.md#scenario-c-dark-mode)).
- **Live regions stay mounted.** Empty alert/status containers keep their DOM
  elements without toggling `aria-hidden` or `[hidden]`, and `id` bindings omit
  the attribute instead of emitting `"null"`.
- **Error summary `autoFocus`.** Only moves focus under `'on-submit'` timing,
  never under `'on-touch'` or `'immediate'`.
- **Vest adapter updates.** `validateVest(path, suite, options?)` sets
  `resetOnDestroy: true` by default, accepts typed suite field names in `only`,
  and requires `vest >=6.3.0 <7.0.0`.
- **Peer dependencies.** `@angular/common`, `@angular/core`, and
  `@angular/forms` all require `>=22.0.0 <23.0.0`. Optional peers are
  `vest >=6.3.0 <7.0.0` and `axe-core >=4.13.0 <5`.
- **Custom wrapper primitives.** Use `createFieldPresentation()` and
  `NgxFieldIdentityProvider` from `@ngx-signal-forms/toolkit` when building
  third-party wrappers. See [Custom wrappers](./CUSTOM_WRAPPERS.md).

## 6. Upgrade checklist

- [ ] Check the [Node requirement](#changes-since-rc16), then install the toolkit
      at `1.0.0` and update your lockfile.
- [ ] Update `@angular/core`, `@angular/common`, and `@angular/forms` to `22.x`
      (and `vest >=6.3.0 <7.0.0` or `axe-core >=4.13.0 <5` if used).
- [ ] Replace any `@ngx-signal-forms/toolkit/core` imports with
      `@ngx-signal-forms/toolkit`.
- [ ] Apply the class, selector, appearance, and control-kind renames above.
- [ ] Add `ngxSignalForm` next to `[formRoot]` on forms that use `on-submit`,
      form-level strategies, or `ngx-form-field-error-summary`.
- [ ] Apply CSS variable renames from
      [Migrating CSS custom properties](./MIGRATING_CSS_VARS.md) and review
      `color-scheme` for dark mode.
- [ ] Review the detailed migration sections below and test feedback timing.
- [ ] Run your type-check and test suite.

## Reference

- [Release migration index](./migrations/README.md): future release guides
- [Root README](../README.md): quick start and entry-point guide
- [Toolkit API reference](../packages/toolkit/README.md)
- [Form field wrapper](../packages/toolkit/form-field/README.md) and [Theming](../packages/toolkit/form-field/THEMING.md)
- [Assistive components](../packages/toolkit/assistive/README.md)
- [Headless primitives](../packages/toolkit/headless/README.md)
- [Vest adapter](../packages/toolkit/vest/README.md)
- [Testing helpers](../packages/toolkit/testing/README.md)

## Changes since rc.16

RC.16 accepts Node `^22.22.3 || ^24.15.0 || >=26.0.0`. The new requirement is
`^22.23.4 || ^24.22.1 || >=26.12.1`. Check local builds and CI before you install
`@ngx-signal-forms/toolkit@1.0.0` and update the lockfile.

### Public entry points and inputs

Public entry points and export names are unchanged. `NgxFormFieldErrorSummary.autoFocus`
and `NgxFormFieldCharacterCount.showLimitColors` now use Angular's `booleanAttribute`
transform. Both still read as booleans and default to `true`. An empty attribute
enables the behavior and the literal attribute value `"false"` disables it.

### `on-touch` hides errors and warnings while the user types

Before, once a field was touched, every keystroke could reveal a new error. Each reveal re-announced the `role="alert"` region and replayed the slide-in, so screen reader users heard errors for values they had not finished typing.

Now a touched field hides its error from the first keystroke until the user stops editing:

- Moving focus to another element or submitting the form, including with Enter, checks the field again.
- Focusing a field with a visible error does not hide that error; only typing does.
- A programmatic `submit()` with no DOM `submit` event does not end editing.
- Custom controls that fire no `input` event keep updating errors as their value changes.

The visual error, `aria-invalid`, and the error summary follow the same signal, so they stay in sync. Warnings with the `on-touch` warning strategy also wait while the user types. Other warnings stay hidden while the user types in a field that has a blocking error, so a warning never replaces an error that is hidden mid-edit. The `on-submit` and `immediate` strategies are unchanged.

Tests that type into a touched field and assert an error must move focus first, for example with `await user.tab()`.

### Feedback motion

- The inline error and warning slide-in now plays. Before, Angular's style encapsulation renamed the keyframes, and the default animation referenced them by their unscoped name, so messages appeared without animation. The slide-in runs for `180ms` with `cubic-bezier(0.23, 1, 0.32, 1)` and moves `0.25rem` without scaling.
- Leave `--ngx-signal-form-error-animation` and `--ngx-signal-form-fieldset-message-animation` unset to use the built-in motion. A custom value must reference keyframes from a global stylesheet.
- Under `prefers-reduced-motion: reduce`, messages fade in instead of appearing without any transition. Spatial movement stays off.
- Fieldset message spacing no longer transitions under `prefers-reduced-motion: reduce`.
- `expectNoA11yViolations` and `createA11yValidator` from `@ngx-signal-forms/toolkit/testing` now wait for running finite animations before the axe scan, so entry fades do not cause false color-contrast failures.
- The character count no longer transitions `font-weight` and uses tabular numerals, so the counter no longer shifts width while you type.

Set `--ngx-signal-form-error-animation: none` to keep messages appearing without animation, as they did before.

### Invalid-submit focus

`focusFirstInvalid()` skips warnings and returns `false` when the form has only warnings. Under `on-submit`, the error summary focuses on each failed submit. It also focuses after pending validation produces errors, unless the user edits the form first.

### Field feedback and theme tokens

Inline messages honor their contextual start and end padding. Selection rows
and plain fieldset messages can align feedback with their content. Standalone
inline feedback still defaults to zero inline padding. A fieldset with
top-placed feedback adds `--ngx-signal-form-fieldset-message-margin-bottom`
spacing only while it has visible messages. Fieldset legends inherit their
font family unless you set `--ngx-signal-form-fieldset-legend-font-family`.

On coarse pointers, selection controls and error summary buttons use a
`2.75rem` default target size. The `--ngx-form-field-touch-target` and
`--ngx-error-summary-link-min-target-size` overrides still apply. With
`prefers-contrast: more`, wrappers and fieldsets default to a `2px` border
and use higher-contrast border and secondary text colors.

Set `--ngx-form-field-valid-border-color` to opt in to a valid border on touched, valid textual fields without warnings. The border does not apply on hover or focus. Pair color with text or an icon when users need a success cue.

## Detailed beta and release-candidate changes

Apply the sections that match your integration. These replace the former release-candidate guides.

### Form bindings and behavior

- Change `NgxFormMarkingLegend` from `[formField]` to `[formTree]`, and `ngx-form-fieldset` from `[fieldsetField]` to `[field]`.
- Direct implementations of `ErrorSummarySignals` and `FieldsetStateSignals` must include their current required members. Error-state results use `shouldShowErrors` and `shouldShowWarnings`.
- Remove notification `tone` inputs and tone types. Feedback severity follows the supplied messages. Use the panel replacement below.
- The `NgxFormField` bundle activates `NgxSignalFormControl`. Remove workarounds for ignored manual ARIA. Hidden wrapped fields are hidden, and the marking legend excludes hidden and disabled fields. A warning ID is not added to `aria-describedby` while a blocking error is visible.
- A shared Vest suite serializes validation across independent mounted field trees. An explicit empty `fields` array on `NgxHeadlessFieldset` aggregates nothing.

### Notification, Vest, and testing migrations

#### 1. `NgxFormFieldNotification` is folded into `NgxFormFieldError`

`NgxFormFieldNotification` (`<ngx-form-field-notification>`) is removed from
`@ngx-signal-forms/toolkit/assistive`, along with
`NgxFormFieldNotificationListStyle`. Use `NgxFormFieldError` with the new
`presentation="panel"` input instead — it accepts the same `errors`,
`fieldName`, `title`, and `listStyle` inputs the notification component did:

```html
<!-- Before -->
<ngx-form-field-notification
  [errors]="groupedErrors"
  fieldName="address"
  title="Please review the following"
  listStyle="bullets"
/>

<!-- After -->
<ngx-form-field-error
  [errors]="groupedErrors"
  fieldName="address"
  title="Please review the following"
  listStyle="bullets"
  presentation="panel"
/>
```

The `presentation` input is typed `NgxFormFieldErrorPresentation`, newly
exported from `@ngx-signal-forms/toolkit/assistive`. It defaults to `'inline'`,
which preserves the existing per-field rendering, so no template change is
required. `NgxFormFieldset`'s own
`feedbackAppearance`/`notificationTitle` inputs are unaffected; the fieldset
now renders `ngx-form-field-error presentation="panel"` internally instead of
the deleted component.

**CSS selectors and custom properties**: the `.ngx-form-field-notification*`
classes are gone. `presentation="panel"` renders the same BEM classes as
`presentation="inline"` (`.ngx-form-field-error`,
`.ngx-form-field-error--error`, `.ngx-form-field-error__list`,
`.ngx-form-field-error__message`, plus the new
`.ngx-form-field-error__title`), gated by a `[data-presentation="panel"]`
host attribute. The public custom properties are renamed to match:

| Before                                                | After                                                                      |
| ----------------------------------------------------- | -------------------------------------------------------------------------- |
| `--ngx-signal-form-notification-padding`              | `--ngx-signal-form-error-panel-padding`                                    |
| `--ngx-signal-form-notification-message-spacing`      | `--ngx-signal-form-error-panel-message-spacing`                            |
| `--ngx-signal-form-notification-border-width`         | `--ngx-signal-form-error-panel-border-width`                               |
| `--ngx-signal-form-notification-border-radius`        | `--ngx-signal-form-error-panel-border-radius`                              |
| `--ngx-signal-form-notification-error-bg`             | `--ngx-signal-form-error-panel-bg`                                         |
| `--ngx-signal-form-notification-error-color`          | `--ngx-signal-form-error-panel-color`                                      |
| `--ngx-signal-form-notification-error-border-color`   | `--ngx-signal-form-error-panel-border-color`                               |
| `--ngx-signal-form-notification-warning-bg`           | `--ngx-signal-form-warning-panel-bg`                                       |
| `--ngx-signal-form-notification-warning-color`        | `--ngx-signal-form-warning-panel-color`                                    |
| `--ngx-signal-form-notification-warning-border-color` | `--ngx-signal-form-warning-panel-border-color`                             |
| `--ngx-signal-form-notification-title-color`          | `--ngx-signal-form-error-title-color` _(shared across both presentations)_ |
| `--ngx-signal-form-notification-font-size`            | `--ngx-signal-form-error-panel-font-size`                                  |
| `--ngx-signal-form-notification-line-height`          | `--ngx-signal-form-error-panel-line-height`                                |

`NgxHeadlessNotification` was also removed. Use `NgxHeadlessErrorState` with `errorsOverride` for a custom grouped notification. See [Replace NgxHeadlessNotification](#replace-ngxheadlessnotification).

#### 2. `toHintDescriptors` and `createErrorRendererInputs` are removed

`toHintDescriptors` and `createErrorRendererInputs` are removed from
`@ngx-signal-forms/toolkit/headless` (and their option/return types
`CreateErrorRendererInputsOptions`, `HintLike`,
`NgxFormFieldErrorRendererInputs`). Both had exactly one first-party adapter
(the form-field wrapper) plus the reference custom wrappers in the demo apps,
and each is a single `computed()` — inline it directly instead of importing a
shared helper:

```ts
// Hint descriptors for NGX_SIGNAL_FORM_HINT_REGISTRY
readonly hintDescriptors = computed(() =>
  this.hintChildren().map((hint) => ({
    id: hint.resolvedId(),
    fieldName: hint.resolvedFieldName(),
  })),
);

// *ngComponentOutlet inputs for a custom error renderer
readonly errorRendererInputs = computed<Record<string, unknown>>(() => ({
  formField: this.formField(),
  strategy: this.effectiveStrategy(),
  submittedStatus: this.submittedStatus(),
}));
```

#### Replace `showErrors`

Replace `showErrors()` with `createErrorVisibility()` from the root entry point. The options are passed as an object. Call it in an injection context.

```ts
const visible = createErrorVisibility(field, { strategy, submittedStatus });
```

#### 4. `colorThresholds` is removed from `NgxFormFieldCharacterCount`

The character-count warning/danger breakpoints are now **CSS-only**. Move the
values from the template to a stylesheet:

```html
<!-- before -->
<ngx-form-field-character-count
  [formField]="form.bio"
  [maxLength]="500"
  [colorThresholds]="{ warning: 70, danger: 90 }"
/>

<!-- after -->
<ngx-form-field-character-count [formField]="form.bio" [maxLength]="500" />
```

```css
.bio-field {
  --ngx-form-field-char-count-warning-threshold: 70; /* plain number, no % */
  --ngx-form-field-char-count-danger-threshold: 90;
}
```

Defaults stay 80/95. The component publishes
`--ngx-form-field-char-count-percent-used` and compares it against the two
tokens in CSS via a `clamp()`/`color-mix()` toggle, so a wrapper restyles
without touching TypeScript.

**The `[liveAnnounce]` wording and the `data-limit-state` attribute keep the
fixed 80/95 defaults regardless of any token override.** Announcement timing
is accessible behavior, not presentation, and must stay predictable under a
CSS-only restyle. See
[THEMING.md → Character count](../packages/toolkit/form-field/THEMING.md#character-count).

#### 5. `/testing`: `expectNoA11yViolations` no longer accepts `runOnly`

The second parameter is narrowed to `Omit<axe.RunOptions, 'runOnly'>`, and
`runOnly` is now applied **after** the spread inside `axe.run()`. The WCAG 2.2
AA tag set is the non-negotiable baseline:

```ts
// before — silently replaced the baseline
await expectNoA11yViolations(el, { runOnly: ['wcag2a'] });

// after — compile error. Scan the full baseline, or filter the result yourself.
await expectNoA11yViolations(el);
```

Every other `axe.RunOptions` key is still honored. A literal `runOnly` is a
compile error; a `runOnly` smuggled through a value already widened to
`axe.RunOptions` is overridden at runtime. No call site in this workspace
passed `runOnly`, so for most consumers this is a type-only change.

#### 6. Vest: the bound path's value **is** the suite input

`focusCurrentField` and `deriveVestFieldNameFromContext` are deleted. A Vest
registration's bound path value is the suite input, not a second source
resolved separately — binding a suite to a leaf field while the suite expected
the whole model made `data.email` on a bare `string` read `undefined` forever,
producing a permanent blocking error on a valid value.

```ts
// before — field-scoped registration with focusCurrentField
validateVest(form.email, { suite, focusCurrentField: true });

// after — register at the root the suite was authored for,
// and track the focus name yourself
validateVest(form, suite, { only: () => currentFieldName() });
```

Binding a suite to a **subtree** whose value it was authored for stays legal.
`VestRunnableSuite.run`/`only` and `VestResultLike.getErrors`/`getWarnings`
are now readonly function properties rather than methods, so their parameters
are contravariant and a model-scoped suite is no longer assignable where a
field-scoped one is expected. See
[ADR-0008](./decisions/0008-vest-suite-input-is-the-bound-path.md).

#### 7. Vest: the typed field-name union now flows through the adapter

`VestRunnableSuite`, `VestOnlyFieldSelector`, `VestResultLike`,
`VestRegisterOptions`, `RunVestSuiteParams`/`RunVestSuiteResult`,
`ValidateVestOptions`, `validateVest`, `validateVestWarnings`, and
`VestSuiteAdapter.register`/`runVestSuite` all gain a field-name type
parameter `F extends string = string`, inferred from the `suite` argument at
the call site. **No caller writes it explicitly**, and an untyped suite (`F`
defaulting to `string`) is unaffected.

The change surfaces a previously silent, fail-open defect: with a suite
declared as `create<{ fields: 'email' | 'password' }>(…)`, a mistyped focus
name is now a compile error.

```ts
const suite = create<{ fields: 'email' | 'password' }>('login', (data) => {
  /* ... */
});

validateVest(form, suite, { only: () => 'emial' });
//                                     ^^^^^^^ now a compile error;
//                          previously ran zero tests and reported valid
```

If your suite is typed and you were relying on a name the union does not
contain, fix the name — the old behavior ran no tests at all for that field.

#### 8. `NgxFieldIdentity.hintIds` widens to `| null`

`NgxFieldIdentity.hintIds` is now `Signal<readonly string[] | null>` (was
`Signal<readonly string[]>`), and the structural type `HintIdsIdentityLike` —
published from `@ngx-signal-forms/toolkit/headless` — widens with it. The two
empty-ish states now mean different things:

| Value  | Meaning                                                            |
| ------ | ------------------------------------------------------------------ |
| `null` | Channel never published — consumers fall back to the hint registry |
| `[]`   | Published, and this field genuinely has no hints — authoritative   |

```ts
// before
const ids: readonly string[] = identity.hintIds();

// after — decide which of the two empty states you mean
const ids = identity.hintIds() ?? [];
```

**Only code that reads `identity.hintIds()` directly is affected.**
`createHintIdsSignal` coalesces internally and still returns a non-null
`Signal<readonly string[]>`, so a wrapper that composes ARIA through the
published factories — the documented path — needs no change.

`NgxFieldIdentity.describedBy` is unchanged (`string | null`).

#### 9. Four public types now accept an explicit `undefined`

Under `exactOptionalPropertyTypes`, a bare `?:` member permits omission but
not an explicit `undefined`. Four surfaces accepted explicit `undefined` at
runtime while their types denied it. This is a **widening only** — every
previously-valid input still compiles — but it changes exported type shapes,
so it is called out here:

- `NgxSignalFormsUserConfig` — every member. The config merge is `??`-based
  precisely so a caller can spread partially-populated config and have
  `undefined` members inherit from the parent.
- `NgxSignalFormControlPresetOverrides` — the inner `Partial<>` is replaced by
  an explicit-undefined mapped type, so `{ slider: { layout: maybeUnset } }`
  preserves base preset invariants instead of being rejected outright.
- `ErrorMessageRegistry` (via `BuiltInErrorMessages`) — an `undefined` entry
  already fell through to the next tier.
- `resolveValidationErrorMessage` takes `ResolvableValidationError`. The
  former `getDefaultValidationMessage` is removed. Angular's own `ValidationError` declares
  `message?: string` and cannot express the explicit-undefined shape a custom
  validator produces from optional data.

`ResolvableValidationError` and `ResolveErrorMessageOptions` are both exported
from the package root, so a wrapper around either function can name its
parameter types:

```ts
import {
  resolveValidationErrorMessage,
  type ResolvableValidationError,
  type ResolveErrorMessageOptions,
} from '@ngx-signal-forms/toolkit';

function describe(
  error: ResolvableValidationError,
  options?: ResolveErrorMessageOptions,
) {
  return resolveValidationErrorMessage(error, myRegistry, options);
}
```

#### 10. `isElementCssVisible()` no longer has an `offsetParent` fallback

If you assert control visibility in tests, those assertions now need a real
browser. `isElementCssVisible()` reports `true` on runtimes without
`Element.checkVisibility()`. jsdom implements neither `checkVisibility()` nor
layout, so a jsdom test can no longer observe "hidden". See the behavior
change below for why.

#### 11. The warning-error helpers moved off `/assistive`

`warningError`, `isWarningError`, and `isBlockingError` are no longer exported
from `@ngx-signal-forms/toolkit/assistive`. They were always available from the
package root as well, and the root is now the only path. The functions
themselves are unchanged — update the import specifier only:

```ts
// before
import { warningError } from '@ngx-signal-forms/toolkit/assistive';

// after
import { warningError } from '@ngx-signal-forms/toolkit';
```

### Behavior changes

- **Warnings now wait for touch instead of appearing immediately.** Warning
  display timing resolves through its own cascade, terminating at `'on-touch'`
  instead of the previous `'immediate'`. A warning on an untouched field no
  longer renders until the user blurs it or the form is submitted.

  This is the most visible change in the release. Nothing to edit if the new
  timing is what you want; restore the old behavior per field, per form, or
  app-wide:

  ```html
  <!-- per field -->
  <ngx-form-field-wrapper
    [formField]="form.password"
    warningStrategy="immediate"
  />

  <!-- per form -->
  <form [formRoot]="form" ngxSignalForm warningStrategy="immediate"></form>
  ```

  ```ts
  // app-wide
  provideNgxSignalFormsConfig({ defaultWarningStrategy: 'immediate' });
  ```

  The cascade is `warningStrategy` input → form context → config
  `defaultWarningStrategy` → `'on-touch'`, and **no tier reaches into the error
  channel** — previously `warningStrategy="inherit"` resolved through the error
  cascade and produced different answers on different surfaces. `'inherit'` is a
  field-level value only; the form-level input is typed
  `ResolvedWarningDisplayStrategy`, so binding `'inherit'` there is a compile
  error. A live password-strength meter is the canonical case for keeping
  `'immediate'`. See
  [ADR-0007](./decisions/0007-warning-display-timing-cascade.md).

- **`aria-invalid` no longer goes stale on a control with no layout box.** The
  gate that removes it read a flag only the built-in wrapper published, so a
  custom wrapper inside a collapsed `<details>`, an inactive tab, or a
  non-current wizard step kept a stale attribute — with `'manual'` ARIA mode as
  the only escape. `NgxSignalFormAutoAria` now probes its own host element, so
  the fix applies to every wrapper. In a selection cluster the group element
  now tracks its own layout state rather than inheriting whichever single
  control the wrapper resolved, so hiding one option no longer strips
  `aria-invalid` from a visible group.

  A wrapper that opts out of `NgxSignalFormAutoAria` and composes
  `createAriaInvalidSignal` itself owns the probe: pass the third
  `isControlVisible` argument, probed from **the element that carries the
  attribute**. See call-out 5 under "Composing ARIA primitives" in
  [`docs/CUSTOM_WRAPPERS.md`](./CUSTOM_WRAPPERS.md).

- **`isElementCssVisible()` fails open on runtimes without
  `Element.checkVisibility()`.** The old `offsetParent !== null` fallback was
  wrong in both directions: a false positive for a collapsed `<details>` and
  for `content-visibility: hidden` — the very cases it existed for — and a
  false negative for `position: fixed` elements and for any environment with
  no layout engine. `checkVisibility()` is Baseline 2024, so the fallback is
  reached only on genuinely old runtimes, where reporting "visible" preserves
  prior behavior instead of stripping ARIA on a guess. The call passes
  `visibilityProperty` (and its historic `checkVisibilityCSS` alias) but
  deliberately **not** `opacityProperty`: an `opacity: 0` control is still
  laid out, focusable, and interactive — the standard custom-checkbox pattern.

- **Field identity now shadows the fallback registries per channel, not by
  presence.** `NgxSignalFormAutoAria` and `createHintIdsSignal` used to switch
  wholesale onto an `NgxFieldIdentity` whenever one was injectable. They now
  test whether that identity has actually _published_ the channel, and fall
  back to `NGX_SIGNAL_FORM_HINT_REGISTRY` /
  `NGX_SIGNAL_FORM_FIELD_VISIBILITY_REGISTRY` otherwise. The error and warning
  strategy channels fall back independently of one another. `NgxFormFieldWrapper`
  publishes every channel on every render, so its behavior is unchanged. See
  [ADR-0010](./decisions/0010-field-identity-shadows-registries-per-channel.md).

### Submission, warnings, and custom controls

#### 1. Update explicit submission return types

`submitWithWarnings()` now returns `Promise<boolean>` instead of
`Promise<void>`. Code that awaits it and ignores the value keeps working. Code
that assigned the result to a `Promise<void>` needs its annotation changed.
These excerpts assume an existing field tree `form` and a `save: () => Promise<void>`:

```typescript
import { submitWithWarnings } from '@ngx-signal-forms/toolkit';

// Before
const done: Promise<void> = submitWithWarnings(form, save);

// After
const done: Promise<boolean> = submitWithWarnings(form, save);
```

If your own public function must retain `Promise<void>`, await the helper
without returning its result. `true` means the callback completed normally;
it does not independently confirm a server save. `false` means blocking errors
refused the call or a concurrent call was dropped. A rejected callback still
rejects the promise, so keep your error handling.

#### 2. Give custom summary factories a warning visibility signal

`createErrorSummaryEntries()` now requires `showWarnings` as well as
`showErrors`. Built-in summaries supply both internally. Only direct factory
callers need this edit.

The following excerpts assume an existing reactive `fieldState` reader for
the root field state and a resolved `showErrors` signal. Create the warning
signal in an injection context, or pass an `injector` option.

```typescript
import { createWarningVisibility } from '@ngx-signal-forms/toolkit';
import { createErrorSummaryEntries } from '@ngx-signal-forms/toolkit/headless';

// Before
const summary = createErrorSummaryEntries({ fieldState, showErrors });

// After
const showWarnings = createWarningVisibility(fieldState, {
  hasWarnings: true,
});
const summary = createErrorSummaryEntries({
  fieldState,
  showErrors,
  showWarnings,
});
```

`hasWarnings: true` lets the summary factory check aggregated warning presence.
Without it, the visibility helper reads only the root's direct errors and can
miss descendant warnings. Do not pass the form-wide error visibility as
`errorVisibility`: a blocking error on one field must not hide a sibling's
warning. Preserve any existing message registry and label resolver options.

The new helper resolves its `strategy` option, then the form context's
`warningStrategy()`, then its explicit `configDefault`, then `'on-touch'`.
Unlike the higher-level factories, it does not read provider configuration
itself. Pass `configDefault` when your custom composition needs that fallback.

### Warning timing and optional adoption

`createErrorState()`, `createErrorMessageSignal()`, and
`NgxHeadlessErrorSummary` now use the independent warning cascade:
`warningStrategy` → form context's `warningStrategy()` → provider
`defaultWarningStrategy` → `'on-touch'`. Omitting the override and using
`'inherit'` both follow that cascade. An error strategy of `'on-submit'` no
longer holds these warnings until submit.

Choose the intended timing rather than removing old workarounds blindly:

```typescript
import { createErrorMessageSignal } from '@ngx-signal-forms/toolkit/headless';

// Before: warning-only messages borrowed the error strategy.
createErrorMessageSignal(() => form.email(), {
  includeWarnings: 'only',
  strategy: 'immediate',
});

// After: preserve immediate warnings explicitly.
createErrorMessageSignal(() => form.email(), {
  includeWarnings: 'only',
  warningStrategy: 'immediate',
});

// Optional: use inherited warning timing instead.
createErrorMessageSignal(() => form.email(), { includeWarnings: 'only' });
```

To retain submit-only warnings, set `warningStrategy: 'on-submit'` on the
factory or `warningStrategy="on-submit"` on the form/directive/component that
owns the warning timing. Supply shared submitted status through
`form[formRoot][ngxSignalForm]`, or pass it explicitly to a factory.

Visible blocking errors suppress warnings on the same field. Grouped summaries
keep sibling warnings independent. `NgxHeadlessErrorState`'s explicit `errorsOverride`
override still bypasses timing; its caller owns visibility.

The styled summary renders blocking errors only. Use `NgxHeadlessErrorSummary` and its `warningStrategy` input to render warning entries.

### Custom controls, ARIA, and theming

If a custom combobox **must stay a widget** (own border, own focus ring),
set the kind yourself so inference does not pull it into the wrapper
shell:

```html
<!-- Before: role="combobox" inferred composite -->
<my-combobox id="city" role="combobox" [formField]="form.city" />

<!-- After: keep widget chrome -->
<my-combobox
  id="city"
  role="combobox"
  ngxSignalFormControl="composite"
  [formField]="form.city"
/>
```

For wrapper-owned styling, keep the custom control's trigger unstyled:

```html
<!-- Combobox: role + id is enough -->
<ngx-form-field-wrapper [formField]="form.framework">
  <label for="framework">Framework</label>
  <my-autocomplete
    id="framework"
    role="combobox"
    [formField]="form.framework"
  />
</ngx-form-field-wrapper>

<!-- Closed select: no combobox role, so declare the family -->
<ngx-form-field-wrapper [formField]="form.country">
  <label for="country">Country</label>
  <my-select
    id="country"
    ngxSignalFormControl="input-like"
    [formField]="form.country"
  />
</ngx-form-field-wrapper>
```

These template excerpts assume existing custom controls that implement the
Angular Signal Forms control contract and expose an accessible label. Keep
Angular's `FormField` import from `@angular/forms/signals`. Import
`NgxSignalFormToolkit` from `@ngx-signal-forms/toolkit` and `NgxFormField` from
`@ngx-signal-forms/toolkit/form-field` into the consuming component. Import
auto-ARIA in a child template too if that child owns the actual `[formField]`.

Do not add a second border or focus ring to an `input-like` trigger. Existing
public `--ngx-form-field-input-*` tokens keep their names and now style these
custom controls too. No public CSS-token rename is required in this hop.
See [theming](../packages/toolkit/form-field/THEMING.md) and
[custom controls](./CUSTOM_CONTROLS.md).

### Behavior changes

- **`role="combobox"` with an `id` infers `input-like`, not `composite`.**
  The wrapper then owns border, focus, invalid chrome, and the public
  input type tokens (`--ngx-form-field-input-size`,
  `--ngx-form-field-input-line-height`,
  `--ngx-form-field-input-font-family`, `--ngx-form-field-input-weight`,
  plus the outline aliases and `--ngx-form-field-placeholder-color`).
  Hosts that already set `ngxSignalFormControl` keep that value.

- **There is still no `select` kind.** A closed custom select that is not
  a combobox must set `ngxSignalFormControl="input-like"` on the
  `[formField]` host.

- **Auto-ARIA writes on the inner combobox.** When `[formField]` sits on a
  custom host and a descendant has `role="combobox"` plus an `id`,
  `NgxSignalFormAutoAria` puts `aria-invalid`, `aria-required`, and
  `aria-describedby` on that descendant and clears the same names from the
  host. A native `input[formField]` is unchanged.

  Without an explicit field identity, the field name comes from the host's `id`
  when present; only the attributes relocate. A sibling `<ngx-form-field-error>` must
  set its explicit `fieldName` to that host name to agree with
  `aria-describedby`. When the host has no `id`, the name falls back
  to the inner combobox's. A host-authored `aria-describedby` is
  preserved on the relocated combobox rather than dropped; a one-time
  dev-mode `console.warn` flags the relocation.

- **The required marker also reads `FieldState.required()`.** Outline
  appearance no longer depends only on a `required` or `aria-required`
  attribute on the bound control.

- **`submitWithWarnings()` delegates to Angular `submit()`.** Once its
  blocking-error gate passes it calls `submit()` with
  `ignoreValidators: 'all'`, so `submitting()` flips and
  `createSubmittedStatusTracker` can observe the accepted submission.
  RC.12 called the action outside Angular submission. Refused calls still do
  not flip `submitting()`. A programmatic button that needs submit-only error
  feedback must still record the failed attempt through the tracker's
  `submitAttempted` signal and pass that status to its feedback. Do not treat
  every `false` result as invalid: concurrent calls also return `false`.

- **Pending validation no longer blocks either warning helper.** RC.12 checked
  `pending()` in both `submitWithWarnings()` and `canSubmitWithWarnings()`.
  RC.13 checks settled blocking errors, including descendants, but yields only
  one microtask before submission. It does not wait for async validation to
  finish. If your save requires a completed availability or server check,
  enforce that policy in the submission path, not only on the button. Recheck
  pending state and blocking errors before saving and validate on the server.
  Do not call this helper from an already-running Angular submission action;
  it drops the call while `submitting()` is true.

  Warnings remain Angular validation errors. Ordinary Angular submission can
  still reject a warning-only form. Use the warning helper or an equivalent
  blocking-error guard, never an unguarded `ignoreValidators: 'all'` bypass.
  See [warning submission](./WARNINGS_SUPPORT.md).

- **Standalone errors render the headless directive's resolved messages.**
  `NgxFormFieldError` no longer resolves a second message list with separate
  timing. Recheck standalone warning and explicit-error rendering if you had
  workarounds for the old mismatch. Container IDs remain the contract for
  auto-ARIA; per-message IDs are not interchangeable with them.

- **`focusFirstInvalid()` reports where focus ended up, not that it made the
  call.** It returns `true` when focus moved, or when focus was already inside
  one of the candidate field's registered bindings, including Enter-to-submit,
  where the control it would focus is the one the user submitted from. It used
  to return `true` whenever `focusBoundControl()` existed on the field state,
  which is always. A field with no registered binding makes that call a silent
  no-op, so the helper moves on to the next candidate; when none works it
  returns `false` and fires the dev-mode warning.

- **A second unnamed hint in one wrapper gets a unique id.** Hints without an
  explicit `id` fell back to `${fieldName}-hint`, so two of them collided and
  `aria-describedby` reached only the first (WCAG 1.3.1). The first hint keeps
  the short name; later ones become `${fieldName}-hint-2`, `-hint-3`, and so
  on. Hints with their own `id` never claim a slot.

- **A superseded Vest run no longer leaves a field pending forever.** The
  adapter checks whether the suite is already idle before awaiting a run's
  settlement, and reuses one payload object per run so Angular's `resource`
  stops reloading on unrelated re-evaluations, such as a `hidden()` or
  `disabled()` toggle.

- **All toolkit components run on `OnPush`.** They were already
  signal-driven, so rendering is unchanged. A consumer that mutated a
  toolkit component's inputs outside Angular's knowledge would now need a
  signal.

### Field spacing and selection rows

#### 1. `--ngx-form-field-margin` now defaults to `0`

`--ngx-form-field-margin` — the field wrapper's own bottom margin — defaults
to `0` instead of `1rem`. Spacing between fields is now container-owned: the
parent layout's `gap` owns the space between fields, not the wrapper. This
also removes the trailing margin that used to follow the last field in a
form.

The assistive row (hint, error, warning) reservation is unaffected; only the
outer margin between fields changed.

If your form relied on the old default — no `gap` on the parent, spacing
supplied "for free" by the wrapper — add a `gap` to the parent instead of
overriding the token:

```css
/* Before: no gap needed, the wrapper supplied 1rem between fields */
.my-form {
  display: grid;
}

/* After: the parent owns the spacing */
.my-form {
  display: grid;
  gap: 1rem;
}
```

If you cannot add a parent `gap` (for example, fields are not siblings in a
single flex/grid container), opt the wrapper back into its own margin at
whatever scope you need:

```css
.my-form ngx-form-field-wrapper {
  --ngx-form-field-margin: 1rem;
}
```

See [container-owned spacing](../packages/toolkit/form-field/THEMING.md#container-owned-spacing)
in the theming guide.

#### 2. Switch row column gap default changed from 0.5rem to 0.75rem

The switch row's control-to-label gap used to resolve through a private
token that defaulted to `0.5rem` (8px). It now resolves through the new
public `--ngx-form-field-selection-row-gap` token, which defaults to
`0.75rem` (12px) — the same default the checkbox row already used. If your
layout depends on the tighter switch gap, restore it explicitly:

```css
ngx-form-field-wrapper {
  --ngx-form-field-selection-row-gap: 0.5rem;
}
```

#### 3. Checkbox and switch row label now uses the label tokens, not the input tokens (#474)

Before: a checkbox or switch row's projected `<label>` read `font-size`
from `--ngx-form-field-input-size` (default `0.875rem`/14px), `line-height`
from `--ngx-form-field-input-line-height` (default `1.25rem`/20px), and
`color` from `--ngx-form-field-color-text` (default `#324155`).

After: the same row label reads `--ngx-form-field-label-size` (default
`0.75rem`/12px), `--ngx-form-field-label-line-height` (default
`1rem`/16px), `--ngx-form-field-label-weight`,
`--ngx-form-field-label-font-family`, and `--ngx-form-field-label-color`
(default `--ngx-form-field-color-text-secondary`) — the same tokens every
other projected label consumes. A default install renders checkbox and
switch labels slightly smaller and in the secondary (muted) text color
instead of the primary input color. If you need the previous look, set these
three tokens on the affected wrappers:

```css
.my-selection-rows {
  --ngx-form-field-label-size: 0.875rem;
  --ngx-form-field-label-line-height: 1.25rem;
  --ngx-form-field-label-color: var(--ngx-form-field-color-text);
}
```

### Additions and compatibility

- Added `--ngx-form-field-selection-row-gap` (default `0.75rem`), a public
  token for the horizontal gap between a checkbox or switch and its label
  in a wrapper-owned selection row. It is distinct from
  `--ngx-form-field-selection-group-gap`, which controls the vertical gap
  between options in a grouped selection surface. See
  [THEMING.md — Selection row gap](../packages/toolkit/form-field/THEMING.md#selection-row-gap).
  (#473)

- `form-field-wrapper.label-tokens.browser.spec.ts` adds computed-style
  regression coverage for the label token contracts: the outline label and
  the checkbox/switch row label (#474), plus the plain appearance, native
  `<select>`, radio-group legend, and field-shaped custom control cells
  (#476). THEMING.md documents the cascade recipe, the checkbox/switch label
  typography source, and the legend ownership boundary.
- `--ngx-form-field-prefix-gap` now has an active CSS consumer: it sizes the
  gap between multiple `[prefix]` children, matching
  `--ngx-form-field-suffix-gap`'s existing behavior for `[suffix]`. No
  default spacing changes for the common single-prefix case. See
  THEMING.md's "Prefix & Suffix" table and "Padding ownership recipe for
  field-shaped autocomplete adapters" (#475).
- `docs/CUSTOM_CONTROLS.md` and `packages/toolkit/form-field/THEMING.md`
  each gained a "Padding ownership recipe for field-shaped autocomplete
  adapters" section, plus a runnable mocked-autocomplete example on the
  demo's `custom-controls` page (#475).

### Entry point and type migrations

## Public API changes

Most breaking changes remove helpers that only the toolkit used, remove duplicate aliases, or give an existing concept one public home. Update code that imports or calls the symbols listed here.

### Core entry point: `@ngx-signal-forms/toolkit`

#### `NgxSignalFormsConfig` has five new members

Code that constructs the full `NgxSignalFormsConfig` object, such as a custom `NGX_SIGNAL_FORMS_CONFIG` provider using `useValue`, must add these members:

```ts
const config = {
  ...myConfig,
  errorPrefixText: 'Error:',
  warningPrefixText: 'Warning:',
  errorSummaryAnnouncesAlone: true,
  characterCountLimitText: 'Up to {max} characters',
  hideHintOnError: false,
} satisfies NgxSignalFormsConfig;
```

`provideNgxSignalFormsConfig()` and `provideNgxSignalFormsConfigForComponent()` accept partial user config and fill in defaults. Their callers do not need to add these members unless they want to override them.

#### Remove `autoAria` from config

`autoAria` had no effect and is no longer accepted. Delete `autoAria: true`. There is no whole-form replacement for `autoAria: false`:

- To turn off auto-ARIA for one host, use `ngxSignalFormAutoAriaDisabled`.
- If the control owns its own ARIA, use `ngxSignalFormControlAria="manual"`.
- Presets apply only to controls that declare their kind with `ngxSignalFormControl`.

See the [custom wrapper guide](./CUSTOM_WRAPPERS.md) for ARIA ownership rules.

#### Use the visibility helpers instead of removed exports

Only `createErrorVisibility()` and `createWarningVisibility()` remain as visibility-timing helpers on the root entry point. `createFieldPresentation()` also remains public. The other helpers below were removed from the root entry point:

| Removed export                                                                                                                                                  | Use instead                                                                                            |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `combineShowErrors`                                                                                                                                             | `computed(() => a() \|\| b())`                                                                         |
| `createShowErrorsComputed`, `shouldShowErrors`, `shouldShowWarnings`                                                                                            | `createErrorVisibility()` or `createWarningVisibility()`                                               |
| `resolveErrorDisplayStrategy`, `resolveWarningStrategy`, `resolveStrategyFromContext`, `resolveWarningStrategyFromContext`, `resolveSubmittedStatusFromContext` | The visibility helpers, which resolve the strategy from input, form context, config, then `'on-touch'` |
| `getDefaultValidationMessage`                                                                                                                                   | `resolveValidationErrorMessage()`                                                                      |
| `readNgxSignalFormControlSemantics`, `inferNgxSignalFormControlKind`                                                                                            | `resolveNgxSignalFormControlSemantics()`                                                               |
| `injectFieldControl`                                                                                                                                            | No replacement; it had no toolkit or demo consumer                                                     |
| `isFormFieldAppearance`, `isFormFieldOrientation`                                                                                                               | Compare against the supported literals or use `FormFieldAppearance` / `FormFieldOrientation`           |

For example:

```ts
// Before
import { createShowErrorsComputed } from '@ngx-signal-forms/toolkit';
const showErrors = createShowErrorsComputed(field, strategy, submittedStatus);

// After
import { createErrorVisibility } from '@ngx-signal-forms/toolkit';
const showErrors = createErrorVisibility(field, {
  strategy: this.mode,
  submittedStatus,
});
```

Call `createErrorVisibility()` and `createWarningVisibility()` in an injection context, such as a field initializer.

#### Rename the control semantics directive and generic types

The directive class is now `NgxSignalFormControl`; its selector and inputs are unchanged. The interface `NgxSignalFormControlSemantics` keeps its name.

```ts
// Before
import { NgxSignalFormControlSemanticsDirective } from '@ngx-signal-forms/toolkit';

// After
import { NgxSignalFormControl } from '@ngx-signal-forms/toolkit';
```

The generic types were renamed to avoid collisions:

| Before             | After                 |
| ------------------ | --------------------- |
| `SignalLike`       | `NgxSignalLike`       |
| `ReactiveOrStatic` | `NgxReactiveOrStatic` |

#### Use one entry point per shared symbol

| Symbol                       | Import in v1                           |
| ---------------------------- | -------------------------------------- |
| `NgxFieldIdentityProvider`   | `@ngx-signal-forms/toolkit`            |
| `NgxFormFieldErrorPlacement` | `@ngx-signal-forms/toolkit/form-field` |

For example, move `NgxFieldIdentityProvider` imports out of `/form-field`, and move `NgxFormFieldErrorPlacement` imports out of the root entry point.

#### Replace `NgxControlPresetRegistry`

The registry facade is removed. Inject `NGX_SIGNAL_FORM_CONTROL_PRESETS`
directly. Replace its methods as follows:

| Registry method | Replacement                                           |
| --------------- | ----------------------------------------------------- |
| `resolve(kind)` | `presets[kind]`                                       |
| `kinds()`       | `Object.keys(presets) as Array<keyof typeof presets>` |
| `extend(patch)` | `mergeNgxSignalFormControlPresets(presets, patch)`    |

The `Object.keys()` cast preserves the preset keys as a type-safe union.

```ts
// Before
const slider = registry.resolve('slider');
const next = registry.extend({ slider: { layout: 'custom' } });

// After
const presets = inject(NGX_SIGNAL_FORM_CONTROL_PRESETS);
const slider = presets['slider'];
const next = mergeNgxSignalFormControlPresets(presets, {
  slider: { layout: 'custom' },
});
```

Pass `null` as the first argument to merge onto the built-in presets. Component-scoped preset providers still take precedence.

`NgxFieldIdentity` also no longer has `isControlVisible()`, `isControlVisible(element)`, or `setControlVisible()`, and the `ControlVisibilitySignal` type is removed. Use `createControlVisibilitySignal(resolveElement, injector)` for a reactive visibility signal, or call `isElementCssVisible(element)` in your own `afterEveryRender` `earlyRead`. In a custom wrapper that composes ARIA primitives, pass the resulting signal as the third argument to `createAriaInvalidSignal()` so `aria-invalid` is removed when the control is hidden:

```ts
const controlVisibility = createControlVisibilitySignal(
  () => resolveElementThatCarriesAriaInvalid(),
  injector,
);
const ariaInvalid = createAriaInvalidSignal(
  fieldState,
  showErrors,
  controlVisibility,
);
```

Resolve the element that carries `aria-invalid`, which may be an inner control rather than the wrapper host. The built-in auto-ARIA behavior is unchanged.

### Assistive and headless entry points

#### Update character-count types

`CharacterCountResult` and `CharacterCountStateSignals` are replaced by `CharacterCountState`, exported from `/headless`:

```ts
// Before
import type {
  CharacterCountResult,
  CharacterCountStateSignals,
} from '@ngx-signal-forms/toolkit/headless';

// After
import type { CharacterCountState } from '@ngx-signal-forms/toolkit/headless';
```

`CharacterCountState.resolvedMaxLength` is now `Signal<number | null>`. Check `hasLimit()` before treating it as a number. `createCharacterCount()` now accepts an optional `maxLength`; its new `useValidatorMaxLength` option defaults to `false`. Existing calls that pass an explicit limit are unchanged. `NgxHeadlessCharacterCount` still requires `maxLength`, so its `resolvedMaxLength` remains non-nullable.

The aliases below were also removed:

| Removed export                                 | Use instead                               |
| ---------------------------------------------- | ----------------------------------------- |
| `NgxFormFieldErrorListStyle` from `/assistive` | `NgxFormFieldListStyle` from `/assistive` |
| `NgxCharacterCountValue` from `/assistive`     | `CharacterCountValue` from `/headless`    |
| `ErrorSummaryEntryData` from `/headless`       | `ErrorSummaryEntry`                       |

#### Replace `NgxHeadlessNotification`

`NgxHeadlessNotification`, `NotificationStateSignals`, and `ResolvedNotificationMessage` are removed. For computed field errors, use `NgxHeadlessErrorState` with its `errorsOverride` input:

```html
<!-- Before -->
<section ngxHeadlessNotification [errors]="addressErrors" fieldName="address">
  ...
</section>

<!-- After -->
<section
  ngxHeadlessErrorState
  #state="errorState"
  [errorsOverride]="addressErrors"
  fieldName="address"
>
  @if (state.hasErrors()) { ... }
</section>
```

The shared helpers `createUniqueId`, `readDirectErrors`, and the `ErrorMessageRegistry` type now come from the root entry point, not `/headless`. `summarizeFieldOptionality` is removed; use `createFieldOptionalitySummary()`. The `warningStrategy` input was also removed from `NgxFormFieldErrorSummary`; use `NgxHeadlessErrorSummary` when you need to render warning entries yourself.

#### Replace low-level headless helpers

These helpers are no longer public. Use the higher-level API that matches the data you need:

| Removed helper               | Use instead                                                                                                                                                                                             |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `readFieldFlag`              | Typed field state such as `field().invalid()`, or `createFieldStateFlags()`                                                                                                                             |
| `readErrors`                 | `field().errorSummary()` for subtree errors; `createErrorState()` for one field's direct errors                                                                                                         |
| `toErrorSummaryEntry`        | Use `createErrorSummaryEntries({ fieldState, showErrors, showWarnings })` for a form-level summary; it returns `entries()` and `warningEntries()` signals, not a single entry from a `ValidationError`. |
| `resolveFieldNameFromError`  | The summary entry's `fieldName`                                                                                                                                                                         |
| `focusBoundControlFromError` | The summary entry's `focus()` and `canFocus`                                                                                                                                                            |

`createErrorSummaryEntries()` filters hidden and disabled fields and deduplicates by field, kind, and message. `createErrorState()` reads direct errors only; use `errorSummary()` when descendant errors are needed.

### Testing entry point

`findAlertContaining` is no longer exported from `/testing`. Replace it with a local query:

```ts
const alert = [
  ...container.querySelectorAll<HTMLElement>('[role="alert"]'),
].find((element) => element.textContent?.includes('Email is required'));
```

`createA11yValidator`, `expectNoA11yViolations`, and `expectVisibleFocusIndicator` are unchanged.

## Other consumer-visible changes

These changes do not require a TypeScript migration, but may affect app styles, screenshots, tests, or accessibility output.

- **Field wrapper defaults:** the border is darker, and `--ngx-form-field-warning-box-shadow` now defaults to `none`. If you override either token, check the new focus outline and contrast. See [THEMING.md — States & Focus](../packages/toolkit/form-field/THEMING.md#states--focus).
- **Dark mode:** toolkit colors now follow the element's `color-scheme`, not `.dark` or the operating-system preference. Set the scheme on the app if needed:

  ```css
  :root {
    color-scheme: light dark;
  }
  /* For a class-based toggle: */
  :root {
    color-scheme: light;
  }
  :root.dark {
    color-scheme: dark;
  }
  ```

  See [THEMING.md — Scenario C: Dark mode](../packages/toolkit/form-field/THEMING.md#scenario-c-dark-mode).

- **Submit announcements:** when a styled error summary is inside `form[formRoot][ngxSignalForm]`, it announces submit-revealed errors instead of each field announcing at the same time. Tests should locate those field errors by id or text, not by `role="alert"`. Set `errorSummaryAnnouncesAlone: false` to restore the old behavior.
- **Error and warning text:** styled field feedback now starts with a visually hidden prefix (`Error:` or `Warning:`). Update exact text or ARIA snapshot assertions if needed. Configure `errorPrefixText` and `warningPrefixText` to translate or remove the prefixes. The summary and headless output are unchanged.
- **Hints:** hints stay visible alongside blocking errors and warnings by default. Set `hideHintOnError: true` globally or on `NgxFormFieldWrapper` to restore the old behavior.
- **Auto-ARIA timing:** without `ngxSignalForm`, auto-ARIA now follows the configured `defaultErrorStrategy`. If you added `ngxSignalForm` only to correct ARIA timing, you can remove it.
- **Focus and contrast:** textual wrappers with standard or outline appearance now receive a solid 2px container outline. Selection controls and non-textual custom controls keep their own focus indicators; the plain appearance keeps its existing input-level outline. New public tokens include `--ngx-form-field-focus-outline-width`, `--ngx-form-field-focus-outline-offset`, and `--ngx-form-field-invalid-box-shadow`. See [THEMING.md — States & Focus](../packages/toolkit/form-field/THEMING.md#states--focus).
- **Fieldset and assistive colors:** dark defaults now use `light-dark()` and `color-scheme`; see [THEMING.md — Fieldset](../packages/toolkit/form-field/THEMING.md#fieldset).
