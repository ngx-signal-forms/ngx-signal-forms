---
title: 'Migrating from beta to v1'
sidebarTitle: 'Beta to v1'
---

This guide covers the breaking changes between the last beta (`1.0.0-beta.10`)
and the current v1 release-candidate API. Every replacement below uses current
public names.

If you are already on `1.0.0-rc.11` or later, use the hop-by-hop guides in the
[release migration index](./migrations/README.md) instead. For CSS custom
property renames, see [Migrating CSS custom properties](./MIGRATING_CSS_VARS.md).

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
| `NgxFormFieldNotification`                                        | `<ngx-form-field-error presentation="panel">` (see [RC.12](./migrations/v1.0.0-rc.12.md))                                                                              |
| `NgxHeadlessNotification`                                         | `NgxHeadlessErrorState` with `errorsOverride` (see [RC.16](./migrations/v1.0.0-rc.16.md))                                                                              |
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
  field hides its error until focus moves or the form submits (see
  [RC.17](./migrations/v1.0.0-rc.17.md)).
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
- [ ] Review [RC.15](./migrations/v1.0.0-rc.15.md) through
      [RC.17](./migrations/v1.0.0-rc.17.md) for container-owned field spacing,
      focus outline tokens, and `on-touch` edit-hiding behavior in tests.
- [ ] Run your type-check and test suite.

## Reference

- [Release migration index](./migrations/README.md): per-version RC.11 through RC.17 guides
- [Root README](../README.md): quick start and entry-point guide
- [Toolkit API reference](../packages/toolkit/README.md)
- [Form field wrapper](../packages/toolkit/form-field/README.md) and [Theming](../packages/toolkit/form-field/THEMING.md)
- [Assistive components](../packages/toolkit/assistive/README.md)
- [Headless primitives](../packages/toolkit/headless/README.md)
- [Vest adapter](../packages/toolkit/vest/README.md)
- [Testing helpers](../packages/toolkit/testing/README.md)
