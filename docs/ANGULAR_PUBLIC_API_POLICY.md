---
title: 'Angular public API policy'
---

This document defines the ownership boundary between Angular Signal Forms and `@ngx-signal-forms/toolkit`. The toolkit enhances Angular's form engine without replacing or reimplementing it.

## Ownership boundary

### Angular owns (form engine)

These APIs belong to `@angular/forms/signals` (entries marked `*` live in `@angular/forms/signals/compat`). The toolkit consumes them and never reimplements them:

| API                        | Purpose                                             |
| -------------------------- | --------------------------------------------------- |
| `form()`                   | Create a signal-based form from a data signal       |
| `FormField`                | Bind a field tree node to an input element          |
| `FormRoot`                 | Form root directive (`[formRoot]`)                  |
| `submit()`                 | Validate, mark touched, run submission action       |
| `schema()` / validators    | Define validation rules (`required`, `email`, etc.) |
| `focusBoundControl()`      | Focus the UI control bound to a field               |
| `errorSummary()`           | Aggregate all errors across nested field trees      |
| `errors()`                 | Direct validation errors for a field                |
| `formFieldBindings`        | Track bound FormField directives                    |
| `provideSignalFormsConfig` | Configure status classes and submit behavior        |
| `NG_STATUS_CLASSES` *      | CSS class bindings for field states                 |
| `FormValueControl<T>`      | Interface for custom value controls                 |
| `FormCheckboxControl`      | Interface for checkbox-like controls                |
| `FormUiControl`            | Interface for UI-only controls                      |
| `compatForm()` *           | Bridge to existing Reactive Forms                   |
| `FieldTree<T>`             | Reactive view of a data signal node                 |
| `FieldState<T>`            | Runtime state interface (valid, touched, etc.)      |

\* Imported from `@angular/forms/signals/compat`, not `@angular/forms/signals`.

### Toolkit owns (enhancement layer)

These APIs belong to `@ngx-signal-forms/toolkit` and build on Angular's form engine:

| Feature                       | Entry point          | Purpose                                                                                                                   |
| ----------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `ngxSignalForm` directive     | `toolkit`            | Form-level error/warning strategy and submitted status context                                                            |
| Auto-ARIA and control kinds   | `toolkit`            | Automatic `aria-invalid`, `aria-required`, `aria-describedby`, and presets                                                |
| Configuration and registries  | `toolkit`            | `provideNgxSignalFormsConfig()`, `provideErrorMessages()`, `provideFieldLabels()`                                         |
| Focus and submission helpers  | `toolkit`            | `createOnInvalidHandler()`, `focusFirstInvalid()`, `createSubmittedStatusTracker()`, `hasSubmitted()`                     |
| Warning convention            | `toolkit`            | `warningError()`, `splitByKind()`, `hasOnlyWarnings()`, `canSubmitWithWarnings()`, `submitWithWarnings()`                 |
| Custom-wrapper primitives     | `toolkit`            | `createFieldPresentation()`, `NgxFieldIdentity`, `NgxFieldIdentityProvider`, renderer providers                           |
| Standard Schema helper        | `toolkit`            | `requiredFromStandardSchema()`                                                                                            |
| Form field wrapper & fieldset | `toolkit/form-field` | Styled field layout, fieldsets, and theming tokens                                                                        |
| Assistive components          | `toolkit/assistive`  | `NgxFormFieldError`, `NgxFormFieldErrorSummary`, `NgxFormFieldHint`, `NgxFormFieldCharacterCount`, `NgxFormMarkingLegend` |
| Headless directives & signals | `toolkit/headless`   | State-only directives, reactive primitives, and ARIA composition factories                                                |
| Vest integration              | `toolkit/vest`       | Vest 6 validation suite adapter                                                                                           |
| Accessibility test helpers    | `toolkit/testing`    | WCAG 2.2 AA axe-core helpers and `expectVisibleFocusIndicator()`                                                          |

## Design principles

### 1. Angular public API leads

The toolkit never provides an alternative API for something Angular already owns:

- **Submit handling.** Angular's `submit()` and `FormRoot` own submission. The toolkit observes submit attempts for status tracking and does not replace Angular's action or validation gate.
- **Field binding.** Angular's `[formField]` binds fields. The toolkit adds no replacement binding.
- **Validation.** Angular's `schema()` and validators define rules. The toolkit adds only the `warn:` warning convention and message resolution on top.

### 2. Enhance, do not replace

`ngxSignalForm` is additive and requires Angular's `[formRoot]` on the same `<form>`:

```html
<form [formRoot]="myForm" ngxSignalForm errorStrategy="on-submit"></form>
```

### 3. Standalone components work without toolkit context

Toolkit components (wrappers, errors, hints, character counts) work without `ngxSignalForm` and fall back to app config (default `'on-touch'`):

```html
<form [formRoot]="myForm">
  <label for="email">Email</label>
  <input id="email" [formField]="myForm.email" />
  <ngx-form-field-error [formField]="myForm.email" fieldName="email" />
</form>
```

Form-level features such as `'on-submit'` timing and shared submitted status require `ngxSignalForm`.

### 4. Structural checks on public Angular contracts

`focusBoundControl()` and `errorSummary()` are public Angular contracts. Some toolkit utilities use structural checks when accepting unknown state, which keeps them defensive against partial test doubles without relying on internal Angular APIs. Check the installed public `FieldState` declaration when adding integrations.

## Angular version baseline

Tracks the Angular 22 baseline and stability contract in [Compatibility](./COMPATIBILITY.md#angular-signal-forms-status).

## Internal `/core` secondary entry point

`@ngx-signal-forms/toolkit/core` exists at build time so sibling entry points can share internal plumbing, and `packages/toolkit/scripts/strip-internal-exports.mjs` removes `./core` from the published `exports` map. Consumers cannot import `@ngx-signal-forms/toolkit/core`.

`packages/toolkit/index.ts` enumerates every public root export explicitly rather than using `export * from './core'`. Add new public `core/` exports to that list by hand, and keep `@internal` symbols out of it. See [Package architecture](./PACKAGE_ARCHITECTURE.md) for the build and packaging details.

## Related

- [Angular vs toolkit](./ANGULAR_VS_TOOLKIT.md): user-level overview of what the toolkit adds
- [Package architecture](./PACKAGE_ARCHITECTURE.md): entry point structure and build pipeline
- [Custom controls](./CUSTOM_CONTROLS.md): how custom controls interact with the toolkit
- [Warnings support](./WARNINGS_SUPPORT.md): warning convention, error timing, and message resolution
