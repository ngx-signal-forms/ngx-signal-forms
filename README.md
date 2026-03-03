# @ngx-signal-forms/toolkit

[![GitHub Stars](https://badgen.net/github/stars/ngx-signal-forms/ngx-signal-forms?color=yellow&label=GitHub%20%E2%AD%90)](https://github.com/ngx-signal-forms/ngx-signal-forms)
[![CI Status](https://img.shields.io/github/actions/workflow/status/ngx-signal-forms/ngx-signal-forms/ci.yml?branch=main&label=CI)](https://github.com/ngx-signal-forms/ngx-signal-forms/actions/workflows/ci.yml)
[![Coverage](https://img.shields.io/codecov/c/github/ngx-signal-forms/ngx-signal-forms?branch=main&label=coverage)](https://codecov.io/gh/ngx-signal-forms/ngx-signal-forms)
[![Release Tag](https://img.shields.io/github/v/release/ngx-signal-forms/ngx-signal-forms?display_name=tag)](https://github.com/ngx-signal-forms/ngx-signal-forms/releases)
[![Version](https://badgen.net/npm/v/%40ngx-signal-forms%2Ftoolkit?icon=npm)](https://www.npmjs.com/package/@ngx-signal-forms/toolkit)
[![Downloads](https://badgen.net/npm/dt/%40ngx-signal-forms%2Ftoolkit?label=Downloads)](https://www.npmjs.com/package/@ngx-signal-forms/toolkit)
[![License](https://badgen.net/npm/license/%40ngx-signal-forms%2Ftoolkit)](https://opensource.org/licenses/MIT)

> **Enhancement toolkit for Angular Signal Forms with automatic accessibility and progressive error disclosure**

Directives, components, and utilities that enhance Angular's Signal Forms with automatic accessibility features, flexible error display strategies, and reusable form field wrappers—all without modifying the core Signal Forms API.

## Installation

```bash
npm install @ngx-signal-forms/toolkit
```

## Upgrade Notes (beta.5)

If you are upgrading from earlier beta releases, review the migration guide:

- [Migration Guide: `1.0.0-beta.5`](./docs/MIGRATION_BETA5.md)

Key updates in `beta.5`:

- Angular baseline aligned to `21.2.0`
- Declarative submission preferred (`[formRoot]` + `submission` config)
- `canSubmit()` and `isSubmitting()` removed (use native `valid()` / `submitting()`)
- `computeShowErrors()` usage replaced by `showErrors()`

---

## Why This Library?

Angular Signal Forms (introduced in v21) provides an excellent reactive foundation, but intentionally leaves UX and accessibility concerns up to the developer. **@ngx-signal-forms/toolkit** bridges the gap between raw state and a polished, production-ready user experience.

Here is what it solves out of the box:

- **Progressive Error Disclosure (UX)**: Instead of turning fields red the moment a user types their first character, errors are intelligently held back based on configurable strategies (`'on-touch'`, `'on-submit'`, `'immediate'`).
- **Zero-Boilerplate Accessibility**: Fully automates `aria-invalid`, `aria-required`, and dynamically links `aria-describedby` to matching error IDs for WCAG 2.2 Level AA compliance without manual template bindings.
- **Full Submission Lifecycle**: Tracks the complete `'unsubmitted' → 'submitting' → 'submitted'` flow, allowing error components to reveal themselves globally the moment a user clicks submit.
- **Component Composition (No Context Drilling)**: The `[formRoot]` directive provides a DI context. You can drop an error component anywhere inside the form, and it automatically knows the form's global error strategy and submission status.

---

## What's Included?

### 🛠️ Core Toolkit (`@ngx-signal-forms/toolkit`)

Every installation includes these essentials to streamline your forms logic:

- **Auto-ARIA Automation**: Automatically manages `aria-invalid` and `aria-describedby` for WCAG compliance.
- **Smart Error Strategies**: Control when errors appear (`'on-touch'`, `'on-submit'`, `'immediate'`) without complex template logic.
- **Submission Utilities**: Helpers like `focusFirstInvalid()`, `hasSubmitted()`, and `createOnInvalidHandler()` for managing submission flow.
- **Status Classes**: Strategy-aware wrapper for Angular's `provideSignalFormsConfig({ classes })`. Syncs CSS classes (like `.is-invalid`) with your error strategy—so users don't see red fields while typing.
- **Warning Logic**: Support for non-blocking validation messages ("warnings") alongside standard errors.

### 🧩 Headless Primitives (`@ngx-signal-forms/toolkit/headless`)

Renderless directives that expose signals without any UI—build custom form components that match your exact design system:

- **State-Only Logic**: Error states, character counts, and field grouping as pure signals.
- **Host Directive Composition**: Use with Angular's Directive Composition API for clean component architecture.
- **Zero UI Coupling**: Works with Tailwind, Bootstrap, Material, or any custom CSS.

### 🎯 Assistive Components (`@ngx-signal-forms/toolkit/assistive`)

Lightly-styled, accessible components for form feedback—designed to be easily themed or used as building blocks:

- **Error Display**: `<ngx-signal-form-error>` with proper ARIA roles (`role="alert"` for errors, `role="status"` for warnings).
- **Hint Text**: `<ngx-signal-form-field-hint>` with smart positioning (auto-flips to avoid collisions).
- **Character Counter**: `<ngx-signal-form-field-character-count>` with automatic maxLength detection.
- **Warning Support**: `warningError()`, `isWarningError()`, `isBlockingError()` utilities for non-blocking validation.
- **Theming**: Minimal CSS that integrates with any design system.

### 📦 Form Field (`@ngx-signal-forms/toolkit/form-field`)

A set of cohesive UI components to build consistent, accessible form layouts:

- **Unified Wrapper**: `<ngx-signal-form-field-wrapper>` encapsulates label, input, errors, warnings and hints in a semantic structure.
- **Two Layout Modes**: Standard (stacked) or outline (floating labels) via `appearance` input—matches Angular Material's design patterns.
- **Fieldset Grouping**: `<ngx-signal-form-fieldset>` groups related fields with aggregated validation messages.
- **Character Count**: Auto-detects `maxLength` validators and displays a progressive character counter.
- **Accessibility Components**: Special `<ngx-signal-form-error>` and hints with correct ARIA roles.
- **Theming**: Comprehensive CSS Custom Properties API for deep customization. [See Theming Guide](./packages/toolkit/form-field/THEMING.md).

### 🐞 Debugger (`@ngx-signal-forms/toolkit/debugger`)

A development tool to inspect form state and validation logic:

- **State Visualization**: Real-time badges for valid, invalid, dirty, pending, and submitted states.
- **Error Inspection**: See exactly which errors are active, which are hidden by strategy, and why.
- **Live Model**: Inspect the underlying form model JSON as you type.
- **Zero Dependencies**: Styled with CSS custom properties (no Tailwind/Bootstrap required).

---

## Comparison Matrix

### Angular Signal Forms (Baseline)

| Feature           | Signal Forms Alone                                 | With Toolkit         |
| ----------------- | -------------------------------------------------- | -------------------- |
| **Form Creation** | ✅ `form()`, `schema()`, validators                | ✅ Same (no changes) |
| **Validation**    | ✅ Built-in and custom validators                  | ✅ Same (no changes) |
| **Field State**   | ✅ `touched()`, `dirty()`, `invalid()`, `errors()` | ✅ Same (no changes) |
| **Touch on Blur** | ✅ Automatic via `[formField]` directive           | ✅ Same (no changes) |
| **Submission**    | ✅ `submitting()` + `submit()` helper              | ✅ Same (no changes) |

### Core Toolkit (`@ngx-signal-forms/toolkit`)

| Feature                 | Signal Forms Alone                                                | With Core Toolkit                                                          |
| ----------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------- |
| **Warning Support**     | ❌ Not supported                                                  | ✅ Non-blocking validation via `warningError()` convention                 |
| **ARIA Attributes**     | ❌ Manual `[attr.aria-invalid]`, `[attr.aria-describedby]`        | ✅ Automatic via `NgxSignalFormAutoAriaDirective`                          |
| **Error Display Logic** | ❌ Manual `@if` conditions in every template                      | ✅ Strategy-based (`'on-touch'`, `'on-submit'`, `'immediate'`, `'manual'`) |
| **Error Component**     | ❌ Custom error rendering per component                           | ➡️ Use Assistive entry point (`<ngx-signal-form-error>`)                   |
| **HTML5 Validation**    | ⚠️ Automatic with `[formRoot]`; manual `novalidate` otherwise     | ✅ Automatic `novalidate` via `[formRoot]` directive                       |
| **CSS Status Classes**  | ⚠️ Manual via `provideSignalFormsConfig`                          | ↗️ Use Angular's `provideSignalFormsConfig` (toolkit uses ARIA attributes) |
| **Submission Helpers**  | ❌ Manual submission lifecycle tracking                           | ✅ `hasSubmitted()`, `focusFirstInvalid()`, `createOnInvalidHandler()`     |
| **Focus Management**    | ⚠️ Manual via `errorSummary()[0].fieldTree().focusBoundControl()` | ✅ `focusFirstInvalid(form)` one-liner wrapping native API                 |
| **Form Context**        | ❌ Manual form setup                                              | ✅ Optional `[formRoot]` provides DI context for `'on-submit'` strategy    |

### Headless (`@ngx-signal-forms/toolkit/headless`)

| Feature             | Angular + Core Toolkit                      | With Headless                                                  |
| ------------------- | ------------------------------------------- | -------------------------------------------------------------- |
| **Error State**     | ❌ Manual `invalid()`, `touched()` tracking | ✅ `visibleErrors()`, `hasVisibleErrors()` computed signals    |
| **Character Count** | ❌ Manual tracking + maxLength detection    | ✅ `current()`, `max()`, `remaining()`, `percentage()` signals |
| **Fieldset State**  | ❌ Manual aggregation across fields         | ✅ `invalid()`, `touched()`, `errors()` aggregate signals      |
| **Host Directives** | ❌ Not composable                           | ✅ Use with Angular's Directive Composition API                |
| **UI Rendering**    | ✅ Your custom templates                    | ✅ Your custom templates (signals only, no markup)             |
| **Styling Control** | ✅ Full control                             | ✅ Full control over markup and styling                        |
| **Design System**   | ✅ Your design tokens                       | ✅ Build components matching your exact design tokens          |

### Assistive (`@ngx-signal-forms/toolkit/assistive`)

| Feature             | Headless Primitives                  | With Assistive                                                |
| ------------------- | ------------------------------------ | ------------------------------------------------------------- |
| **Error Component** | ❌ Build your own                    | ✅ `<ngx-signal-form-error>` with ARIA roles                  |
| **Hint Component**  | ❌ Build your own                    | ✅ `<ngx-signal-form-field-hint>` with smart positioning      |
| **Character Count** | ✅ Signals via directive             | ✅ `<ngx-signal-form-field-character-count>` styled component |
| **Warning Support** | ❌ Manual implementation             | ✅ `warningError()`, `isWarningError()` utilities             |
| **ARIA Roles**      | ❌ Manual ARIA attributes            | ✅ Automatic `role="alert"` / `role="status"`                 |
| **Theming**         | ❌ Your own CSS                      | ✅ Minimal, themeable CSS                                     |
| **Use Case**        | Build from scratch with full control | Use styled components as building blocks                      |

### Form Field (`@ngx-signal-forms/toolkit/form-field`)

| Feature               | Assistive Components       | With Form Field                                                           |
| --------------------- | -------------------------- | ------------------------------------------------------------------------- |
| **Field Wrapper**     | ❌ Build your own          | ✅ `<ngx-signal-form-field-wrapper>` with automatic error display         |
| **Layout Modes**      | ❌ Build your own CSS      | ✅ Standard (stacked) or outline (floating labels) via `appearance` input |
| **Fieldset Grouping** | ❌ Build your own          | ✅ `<ngx-signal-form-fieldset>` styled component                          |
| **Error Display**     | ✅ Component available     | ✅ Integrated automatically in wrapper                                    |
| **Character Count**   | ✅ Component available     | ✅ Integrated in wrapper layout                                           |
| **Hints**             | ✅ Component available     | ✅ Integrated in wrapper layout                                           |
| **Theming**           | ✅ Minimal CSS             | ✅ 20+ CSS custom properties for deep customization                       |
| **Effort**            | ⚠️ More code, full control | ✅ Ready-to-use, less code                                                |

---

## Code Comparison

### Without Toolkit (Manual ARIA + Native `formRoot`)

```html
<form [formRoot]="userForm">
  <label for="email">Email</label>
  <input
    id="email"
    [formField]="userForm.email"
    [attr.aria-invalid]="userForm.email().invalid() ? 'true' : null"
    [attr.aria-describedby]="userForm.email().invalid() && (userForm.email().touched() || userForm().touched()) ? 'email-error' : null"
  />
  @if (userForm.email().invalid() && (userForm.email().touched() ||
  userForm().touched())) {
  <span id="email-error" role="alert">
    {{ userForm.email().errors()[0].message }}
  </span>
  }
  <button type="submit">Submit</button>
</form>
```

### With Toolkit (Automatic ARIA + Error Display + Declarative Submission)

```html
<!-- [formRoot] replicates Angular FormRoot behavior: novalidate + submit() -->
<form [formRoot]="userForm">
  <ngx-signal-form-field-wrapper [formField]="userForm.email">
    <label for="email">Email</label>
    <input id="email" [formField]="userForm.email" />
  </ngx-signal-form-field-wrapper>
  <button type="submit">Submit</button>
</form>
```

**Result:** ~15 lines → ~6 lines (60% reduction), with ARIA compliance, automatic error display, and consistent UX.

---

## Quick Start

The toolkit works **out of the box**—no configuration required for most use cases.

```typescript
import { Component, signal } from '@angular/core';
import {
  form,
  schema,
  required,
  email,
  FormField,
} from '@angular/forms/signals';
import {
  NgxSignalFormToolkit,
  createOnInvalidHandler,
} from '@ngx-signal-forms/toolkit';
import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';

@Component({
  selector: 'app-contact',
  imports: [FormField, NgxSignalFormToolkit, NgxFormField],
  template: `
    <form [formRoot]="contactForm">
      <ngx-signal-form-field-wrapper [formField]="contactForm.email">
        <label for="email">Email</label>
        <input id="email" [formField]="contactForm.email" type="email" />
      </ngx-signal-form-field-wrapper>
      <button type="submit">Send</button>
    </form>
  `,
})
export class ContactComponent {
  protected readonly model = signal({ email: '' });

  protected readonly contactForm = form(
    this.model,
    schema((path) => {
      required(path.email, { message: 'Email is required' });
      email(path.email, { message: 'Invalid email format' });
    }),
    {
      submission: {
        action: async () => {
          console.log('Submit:', this.model());
        },
        onInvalid: createOnInvalidHandler(),
      },
    },
  );
}
```

### What You Get Automatically

- ✅ `novalidate` attribute via `[formRoot]` directive (prevents browser validation bubbles)
- ✅ FormRoot-equivalent submit handling via directive replication (`novalidate` + `submit()`)
- ✅ Declarative submission via `form()` options — no manual `submit()` calls needed
- ✅ `aria-invalid` and `aria-describedby` for accessibility
- ✅ **Errors** display after blur OR submit (default `'on-touch'` strategy) with `role="alert"`
- ✅ **Warnings** (non-blocking) display with `role="status"` when no errors present
- ✅ **Hints** render below the input with proper ARIA association
- ✅ Consistent layout with label, input, feedback messages in semantic structure

> **How it works:** The `[formRoot]` directive replicates Angular's `FormRoot` behavior (`novalidate`, `preventDefault()`, `submit()`), and adds DI context, submitted status tracking, and error display strategy management. Define your submission action declaratively in `form()` options.

---

## Entry Points

### @ngx-signal-forms/toolkit (Core)

**What**: Essential directives, utilities, and providers for accessible, strategy-based error handling.

**When to use**: Every project that uses Angular Signal Forms.

**Key exports**:

- `NgxSignalFormToolkit` — Bundle import for all core directives
- `focusFirstInvalid()` — Convenience wrapper for Angular's `focusBoundControl()` via `errorSummary()`
- `createOnInvalidHandler()` — Factory for `onInvalid` callbacks (auto-focuses first invalid control)
- `hasSubmitted()` — Computed signal tracking submission completion
- `warningError()` — Create non-blocking validation messages

```typescript
import {
  NgxSignalFormToolkit,
  focusFirstInvalid,
  createOnInvalidHandler,
  hasSubmitted,
} from '@ngx-signal-forms/toolkit';
```

**[📖 Full Documentation →](./packages/toolkit/README.md)**

---

### @ngx-signal-forms/toolkit/assistive

**What**: Lightly-styled, accessible components for form feedback—error display, hints, and character counters.

**When to use**: When you want ready-to-use feedback components without the full form field wrapper, or as building blocks for custom layouts.

**Key exports**:

- `NgxSignalFormErrorComponent` — Error/warning display with ARIA roles
- `NgxFormFieldHintComponent` — Helper text below inputs
- `NgxFormFieldCharacterCountComponent` — Character counter with maxLength detection
- `NgxFormFieldAssistiveRowComponent` — Layout row for hints and counters
- `warningError()`, `isWarningError()`, `isBlockingError()` — Warning utilities

```typescript
import {
  NgxSignalFormErrorComponent,
  NgxFormFieldHintComponent,
  warningError,
} from '@ngx-signal-forms/toolkit/assistive';
```

```html
<label for="email">Email</label>
<input id="email" [formField]="form.email" />
<!-- fieldName auto-derived from input id when used standalone -->
<ngx-signal-form-error [formField]="form.email" fieldName="email" />
<ngx-signal-form-field-hint
  >We'll never share your email</ngx-signal-form-field-hint
>
```

**[📖 Full Documentation →](./packages/toolkit/assistive/README.md)**

---

### @ngx-signal-forms/toolkit/form-field

**What**: Pre-built UI components for consistent form layouts with automatic error display.

**When to use**: When you want ready-to-use form field wrappers with floating labels, hints, and character counters.

**Key exports**:

- `NgxFormField` — Bundle import for form field wrapper, outlined layout, hints, and character count
- `NgxSignalFormFieldset` — Group related fields with aggregated errors (use `includeNestedErrors` to control aggregation)

```html
<ngx-signal-form-field-wrapper [formField]="form.bio" appearance="outline">
  <label for="bio">Bio</label>
  <textarea id="bio" [formField]="form.bio"></textarea>
  <ngx-signal-form-field-hint
    >Tell us about yourself</ngx-signal-form-field-hint
  >
  <ngx-signal-form-field-character-count [formField]="form.bio" />
</ngx-signal-form-field-wrapper>
```

**[📖 Full Documentation →](./packages/toolkit/form-field/README.md)** | **[🎨 Theming Guide →](./packages/toolkit/form-field/THEMING.md)**

---

### @ngx-signal-forms/toolkit/headless

**What**: Renderless (headless) primitives—state-only directives that expose signals without any UI.

**When to use**: When you need full control over markup and styling (design systems, custom components).

**Key exports**:

- `NgxHeadlessErrorStateDirective` — Error/warning state as signals
- `NgxHeadlessCharacterCountDirective` — Character count and limit states
- `NgxHeadlessFieldsetDirective` — Aggregated validation for field groups
- `createErrorState()`, `createCharacterCount()` — Programmatic utilities

```html
<div
  ngxSignalFormHeadlessErrorState
  #errorState="errorState"
  [field]="form.email"
  fieldName="email"
>
  <input [formField]="form.email" />
  @if (errorState.showErrors() && errorState.hasErrors()) {
  <div class="my-custom-error">
    @for (error of errorState.resolvedErrors(); track error.kind) {
    <span>{{ error.message }}</span>
    }
  </div>
  }
</div>
```

**[📖 Full Documentation →](./packages/toolkit/headless/README.md)**

---

### @ngx-signal-forms/toolkit/debugger

**What**: Visual debugger for inspecting form state, errors, and warnings.

**When to use**: During development to troubleshoot validation logic or form state issues.

**Key exports**:

- `NgxSignalFormDebugger` — Bundle import
- `SignalFormDebuggerComponent` — Standalone component

```html
<form [formRoot]="form">
  <!-- ... fields ... -->
  <ngx-signal-form-debugger [formTree]="form" />
</form>
```

**Note:** Pass the FieldTree function (e.g. `form`), not the root state (`form()`).
The debugger supports `FieldState`, but it cannot traverse child fields, so visibility may look wrong.

**[📖 Full Documentation →](./packages/toolkit/debugger/README.md)**

---

## Advanced Configuration

For CSS framework integration or custom error strategies, add providers to `app.config.ts`:

```typescript
import {
  provideSignalFormsConfig,
  NG_STATUS_CLASSES,
} from '@angular/forms/signals';
import { provideNgxSignalFormsConfig } from '@ngx-signal-forms/toolkit';

export const appConfig: ApplicationConfig = {
  providers: [
    provideNgxSignalFormsConfig({
      defaultErrorStrategy: 'on-touch',
      defaultFormFieldAppearance: 'outline',
    }),
    // CSS status classes - use Angular's native API
    provideSignalFormsConfig({
      classes: NG_STATUS_CLASSES, // Adds ng-valid, ng-invalid, ng-touched, etc.
    }),
  ],
};
```

**[📖 Configuration Reference →](./packages/toolkit/README.md#configuration)** | **[🎨 CSS Frameworks →](./docs/CSS_FRAMEWORK_INTEGRATION.md)**

---

## Demo examples overview

Live demo (GitHub Pages): [https://ngx-signal-forms.github.io/ngx-signal-forms/](https://ngx-signal-forms.github.io/ngx-signal-forms/)

Each example below links to its source folder in `apps/demo/src/app`, with a short summary of the use case and the toolkit features it demonstrates.

<!-- markdownlint-disable MD060 -->

| Example                     | Use case / type of form          | Toolkit features shown (why)                                                            | Library entry points used                        | Source                       |
| --------------------------- | -------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------ | ---------------------------- |
| Pure Signal Forms           | Baseline Comparison              | Standard Angular Signal Forms without toolkit (for contrast)                            | None (Standard Angular)                          | [source][src-00]             |
| Your First Form             | Simple contact form              | Auto-ARIA and error component for progressive disclosure without boilerplate            | [core][core-docs], [assistive][assistive-docs]   | [source][src-01]             |
| Accessibility Comparison    | Side-by-side baseline vs toolkit | Auto-ARIA + error component to show code reduction and WCAG-aligned output              | [core][core-docs], [assistive][assistive-docs]   | [source][src-02]             |
| Error Display Modes         | Same form, different strategies  | Error strategies (`immediate`, `on-touch`, `on-submit`, `manual`) to choose UX behavior | [core][core-docs], [assistive][assistive-docs]   | [source][src-03]             |
| Warning Support             | Validation with warnings         | `warningError()` and warning roles to show non-blocking feedback                        | [core][core-docs], [assistive][assistive-docs]   | [source][src-04]             |
| Field States                | State exploration form           | Field state signals (touched, dirty, pending, invalid) to clarify visibility logic      | [core][core-docs]                                | [source][src-05]             |
| Headless Error State        | Custom UI, no toolkit UI         | Headless error state to build your own rendering while keeping strategies               | [headless][headless-docs]                        | [source][src-06]             |
| Headless Fieldset Utilities | Grouped validation               | Headless fieldset aggregation and field name resolution for custom layouts              | [headless][headless-docs]                        | [source][src-07]             |
| Form Field Basic Usage      | Standard input layout            | `NgxFormField` wrapper for consistent markup and automatic error display                | [form-field][form-field-docs]                    | [source][src-08]             |
| Form Field Complex Forms    | Realistic registration form      | `NgxFormField` with nested objects and cross-field validation                           | [form-field][form-field-docs]                    | [source][src-09]             |
| Form Field Fieldset         | Grouped sections                 | `NgxSignalFormFieldset` for aggregated errors and grouped semantics                     | [form-field][form-field-docs]                    | [source][src-10]             |
| Custom Controls             | Custom Input Component           | `FormValueControl` integration for custom form components                               | [form-field][form-field-docs]                    | [source][src-custom-control] |
| Outline Form Field          | Material-like layout             | Outlined appearance and field wrapper theming defaults                                  | [form-field][form-field-docs]                    | [source][src-11]             |
| Global Configuration        | App-wide defaults                | `provideNgxSignalFormsConfig` for default strategy, appearance, and resolution          | [core][core-docs]                                | [source][src-12]             |
| Submission Patterns         | Async submit flows               | `submit()` helper + submission state signals for server errors and loading              | [core][core-docs]                                | [source][src-13]             |
| Error Messages              | Centralized messaging            | Error message registry and priority tiers for i18n-ready messaging                      | [core][core-docs]                                | [source][src-14]             |
| Dynamic List                | Add/remove items                 | Array handling with signals and `NgxFormField` for repeated fields                      | [core][core-docs]                                | [source][src-15]             |
| Nested Groups               | Deep data structures             | Nested group handling with auto-ARIA and consistent error surfaces                      | [core][core-docs]                                | [source][src-16]             |
| Async Validation            | Server checks                    | Async validation + pending state visibility in toolkit UI                               | [core][core-docs]                                | [source][src-17]             |
| Stepper Form                | Multi-step wizard                | Step validation patterns with strategy-aware errors per step                            | [core][core-docs]                                | [source][src-18]             |
| Advanced Wizard             | Form-per-step wizard             | Toolkit field wrappers, auto-ARIA, and cross-step validation in a store-backed wizard   | [core][core-docs], [form-field][form-field-docs] | [source][src-20]             |
| Cross-Field Validation      | Dependent fields                 | Cross-field rules with grouped error display in toolkit components                      | [core][core-docs]                                | [source][src-19]             |

<!-- markdownlint-enable MD060 -->

[core-docs]: ./packages/toolkit/README.md
[assistive-docs]: ./packages/toolkit/assistive/README.md
[form-field-docs]: ./packages/toolkit/form-field/README.md
[headless-docs]: ./packages/toolkit/headless/README.md
[src-01]: ./apps/demo/src/app/01-getting-started/your-first-form
[src-02]: ./apps/demo/src/app/02-toolkit-core/accessibility-comparison
[src-03]: ./apps/demo/src/app/02-toolkit-core/error-display-modes
[src-04]: ./apps/demo/src/app/02-toolkit-core/warning-support
[src-05]: ./apps/demo/src/app/02-toolkit-core/field-states
[src-06]: ./apps/demo/src/app/03-headless/error-state
[src-07]: ./apps/demo/src/app/03-headless/fieldset-utilities
[src-08]: ./apps/demo/src/app/04-form-field-wrapper/basic-usage
[src-09]: ./apps/demo/src/app/04-form-field-wrapper/complex-forms
[src-10]: ./apps/demo/src/app/04-form-field-wrapper/fieldset
[src-11]: ./apps/demo/src/app/04-form-field-wrapper/outline-form-field
[src-12]: ./apps/demo/src/app/05-advanced/global-configuration
[src-13]: ./apps/demo/src/app/05-advanced/submission-patterns
[src-14]: ./apps/demo/src/app/05-advanced/error-messages
[src-15]: ./apps/demo/src/app/05-advanced/dynamic-list
[src-16]: ./apps/demo/src/app/05-advanced/nested-groups
[src-17]: ./apps/demo/src/app/05-advanced/async-validation
[src-18]: ./apps/demo/src/app/05-advanced/stepper-form
[src-19]: ./apps/demo/src/app/05-advanced/cross-field-validation
[src-20]: ./apps/demo/src/app/05-advanced/advanced-wizard
[src-00]: ./apps/demo/src/app/00-signal-forms-only/pure-signal-form
[src-custom-control]: ./apps/demo/src/app/04-form-field-wrapper/custom-controls

## Documentation

| Document                                                             | Description                                                  |
| -------------------------------------------------------------------- | ------------------------------------------------------------ |
| **[Toolkit API Reference](./packages/toolkit/README.md)**            | Complete API documentation with all options and examples     |
| **[Headless Primitives](./packages/toolkit/headless/README.md)**     | Renderless directives for custom design systems              |
| **[Assistive Components](./packages/toolkit/assistive/README.md)**   | Error, hint, and character count components                  |
| **[Form Field Components](./packages/toolkit/form-field/README.md)** | Form field wrapper, outlined layout, hints, character count  |
| **[Debugger Tool](./packages/toolkit/debugger/README.md)**           | Visual form inspector for state, errors, and model debugging |
| **[Migration Guide (beta.5)](./docs/MIGRATION_BETA5.md)**            | Upgrade steps for Angular 21.2 and toolkit beta.5 changes    |
| **[CSS Framework Integration](./docs/CSS_FRAMEWORK_INTEGRATION.md)** | Bootstrap 5.3, Tailwind CSS 4, Angular Material setup        |
| **[Theming Guide](./packages/toolkit/form-field/THEMING.md)**        | CSS custom properties, dark mode, brand customization        |
| **[Warnings Support](./docs/WARNINGS_SUPPORT.md)**                   | Non-blocking validation messages                             |
| **[Package Architecture](./docs/PACKAGE_ARCHITECTURE.md)**           | Library structure and design decisions                       |

---

## Browser Support

- Angular 21+ (Signal Forms API)
- All modern browsers with ES2022+ support
- TypeScript 5.8+

## Accessibility

This toolkit follows **WCAG 2.2 Level AA** guidelines:

- ✅ Automatic `aria-invalid` and `aria-describedby` attributes
- ✅ Proper `role="alert"` for errors (assertive live region)
- ✅ Proper `role="status"` for warnings (polite live region)
- ✅ Progressive error disclosure (on-touch strategy)
- ✅ Keyboard accessible
- ✅ Screen reader tested

---

## License

MIT © [ngx-signal-forms](https://github.com/ngx-signal-forms/ngx-signal-forms)
