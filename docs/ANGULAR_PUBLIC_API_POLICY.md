# Angular Public API Policy

This document defines the ownership boundary between Angular Signal Forms and `@ngx-signal-forms/toolkit`. The toolkit **enhances** Angular's form engine — it never replaces or reimplements it.

## Ownership Boundary

### Angular Owns (Form Engine)

These APIs are part of Angular's `@angular/forms/signals` package. The toolkit consumes them but never reimplements them:

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
| `provideSignalFormsConfig` | Configure status classes, submit behavior           |
| `NG_STATUS_CLASSES`        | CSS class bindings for field states                 |
| `FormValueControl<T>`      | Interface for custom value controls                 |
| `FormCheckboxControl`      | Interface for checkbox-like controls                |
| `FormUiControl`            | Interface for UI-only controls                      |
| `compatForm()`             | Bridge to existing reactive forms                   |
| `FieldTree<T>`             | Reactive view of a data signal node                 |
| `FieldState<T>`            | Runtime state interface (valid, touched, etc.)      |

### Toolkit Owns (Enhancement Layer)

These APIs are part of `@ngx-signal-forms/toolkit`. They build on top of Angular's form engine:

| Feature                   | Entry Point          | Purpose                                              |
| ------------------------- | -------------------- | ---------------------------------------------------- |
| `ngxSignalForm` directive | `toolkit`            | Form-level context: error strategy, submitted status |
| Auto-ARIA directive       | `toolkit`            | Automatic `aria-invalid`, `aria-describedby`         |
| Error display strategies  | `toolkit`            | `'on-touch'`, `'on-submit'`, `'immediate'`           |
| Error message registry    | `toolkit`            | App-wide `NGX_ERROR_MESSAGES` provider               |
| `focusFirstInvalid()`     | `toolkit`            | Focus first invalid field via `errorSummary()`       |
| Submission helpers        | `toolkit`            | `createSubmittedStatusTracker()`                     |
| Headless error state      | `toolkit/headless`   | Strategy-aware error/warning signals                 |
| Headless error summary    | `toolkit/headless`   | Form-level error aggregation with focus              |
| Headless fieldset         | `toolkit/headless`   | Grouped error aggregation                            |
| Headless character count  | `toolkit/headless`   | Progressive character limits                         |
| Headless field name       | `toolkit/headless`   | ID generation for ARIA                               |
| Styled error component    | `toolkit/assistive`  | WCAG-compliant error/warning display                 |
| Styled error summary      | `toolkit/assistive`  | Clickable form-level error list                      |
| Styled hints              | `toolkit/assistive`  | Helper text components                               |
| Styled character count    | `toolkit/assistive`  | Visual character counter                             |
| Form field wrapper        | `toolkit/form-field` | Complete field layout with label + feedback          |
| Form fieldset             | `toolkit/form-field` | Grouped field layout                                 |
| Warning convention        | `toolkit/assistive`  | `warn:` prefix for non-blocking messages             |
| Vest integration          | `toolkit/vest`       | Vest v6+ validation suite adapter                    |
| Form debugger             | `toolkit/debugger`   | Development-time form state inspection               |

## Design Principles

### 1. Angular Public API Leads

The toolkit never provides an alternative API for something Angular already owns. For example:

- **Submit handling**: Angular's `submit()` or `FormRoot` handles form submission. The toolkit's `ngxSignalForm` only tracks submitted status — it does not call `submit()` or intercept the submit event.- **Field binding**: Angular's `[formField]` directive is the only way to bind fields. The toolkit never introduces its own field binding syntax.
- **Validation**: Angular's `schema()` and validators define rules. The toolkit only adds the warning convention (`warn:` prefix) and message resolution on top.

### 2. Enhance, Don't Replace

The toolkit's `ngxSignalForm` directive is additive — it requires Angular's `[formRoot]` to be present on the same `<form>`. Without `[formRoot]`, the toolkit directive has nothing to enhance.

```html
<!-- Angular owns the form, toolkit enhances it -->
<form [formRoot]="myForm" ngxSignalForm [errorStrategy]="'on-submit'"></form>
```

### 3. Standalone Components Work Without Toolkit Context

Toolkit components (errors, hints, character counts) work without `ngxSignalForm`:

```html
<!-- No ngxSignalForm - components fall back to defaults -->
<form [formRoot]="myForm">
  <input [formField]="myForm.email" />
  <ngx-signal-form-error [formField]="myForm.email" fieldName="email" />
</form>
```

Form-level features like `'on-submit'` strategy and inherited submitted status require the `ngxSignalForm` enhancer.

### 4. Duck-Typed Angular Integration

The toolkit uses duck-typing when accessing Angular Signal Forms internals that may change between versions. For example, `focusBoundControl()`, `errorSummary()`, and `name()` are accessed via type-safe duck-typed checks rather than hard imports of internal types.

## Angular Version Baseline

- **Tested baseline**: Angular 21.2.x
- **Signal Forms status**: Experimental (developer preview)
- **Toolkit stance**: We follow Angular's public API surface. When Angular makes breaking changes to Signal Forms, the toolkit will adapt accordingly.

## Related

- [Package Architecture](./PACKAGE_ARCHITECTURE.md) — Entry point structure and dependency hierarchy
- [Custom Controls](./CUSTOM_CONTROLS.md) — How custom controls interact with the toolkit
- [Parse Errors and Warnings](./PARSE_ERRORS_AND_WARNINGS.md) — Error flow and warning convention
