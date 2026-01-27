# @ngx-signal-forms/toolkit

[![Github Stars](https://badgen.net/github/stars/nngx-signal-forms/nngx-signal-forms?color=yellow&label=Github%20🌟)](https://github.com/nngx-signal-forms/nngx-signal-forms)
[![Version](https://badgen.net/npm/v/nngx-signal-forms?&icon=npm)](https://www.npmjs.com/package/nngx-signal-forms)
[![Downloads](https://badgen.net/npm/dt/nngx-signal-forms?label=Downloads)](https://www.npmjs.com/package/nngx-signal-forms)
[![License](https://badgen.net/npm/license/nngx-signal-forms)](https://opensource.org/licenses/MIT)

> **Enhancement toolkit for Angular Signal Forms with automatic accessibility and progressive error disclosure**

Directives, components, and utilities that enhance Angular's Signal Forms with automatic accessibility features, flexible error display strategies, and reusable form field wrappers—all without modifying the core Signal Forms API.

## Installation

```bash
npm install @ngx-signal-forms/toolkit
```

---

## Why This Library?

Angular Signal Forms (introduced in v21) provides an excellent foundation for reactive forms. **@ngx-signal-forms/toolkit** builds on this foundation by adding accessibility, UX patterns, and developer conveniences that would otherwise require significant boilerplate.

---

## What's Included?

### 🛠️ Core Toolkit (`@ngx-signal-forms/toolkit`)

Every installation includes these essentials to streamline your forms logic:

- **Auto-ARIA Automation**: Automatically manages `aria-invalid` and `aria-describedby` for WCAG compliance.
- **Smart Error Strategies**: Control when errors appear (`'on-touch'`, `'on-submit'`, `'immediate'`) without complex template logic.
- **Submission Utilities**: Helpers like `focusFirstInvalid()`, `canSubmit()`, and `isSubmitting()` signals.
- **Status Classes**: Strategy-aware wrapper for Angular's `provideSignalFormsConfig({ classes })`. Syncs CSS classes (like `.is-invalid`) with your error strategy—so users don't see red fields while typing.
- **Warning Logic**: Support for non-blocking validation messages ("warnings") alongside standard errors.

### 📦 Form Field (`@ngx-signal-forms/toolkit/form-field`)

A set of cohesive UI components to build consistent, accessible form layouts:

- **Unified Wrapper**: `<ngx-signal-form-field>` encapsulates label, input, errors, warnings and hints in a semantic structure.
- **Two Layout Modes**: Default (stacked) or `outline` attribute for Material-like floating labels.
- **Fieldset Grouping**: `<ngx-signal-form-fieldset>` groups related fields with aggregated validation messages.
- **Character Count**: Auto-detects `maxLength` validators and displays a progressive character counter.
- **Accessibility Components**: Special `<ngx-signal-form-error>` and hints with correct ARIA roles.
- **Theming**: Comprehensive CSS Custom Properties API for deep customization. [See Theming Guide](./packages/toolkit/form-field/THEMING.md).

### 🧩 Headless Primitives (`@ngx-signal-forms/toolkit/headless`)

Renderless directives that expose signals without any UI—build custom form components that match your exact design system:

- **State-Only Logic**: Error states, character counts, and field grouping as pure signals.
- **Host Directive Composition**: Use with Angular's Directive Composition API for clean component architecture.
- **Zero UI Coupling**: Works with Tailwind, Bootstrap, Material, or any custom CSS.

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

| Feature                 | Signal Forms Alone                                                | With Core Toolkit                                                            |
| ----------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| **Warning Support**     | ❌ Not supported                                                  | ✅ Non-blocking validation via `warningError()` convention                   |
| **ARIA Attributes**     | ❌ Manual `[attr.aria-invalid]`, `[attr.aria-describedby]`        | ✅ Automatic via `NgxSignalFormAutoAriaDirective`                            |
| **Error Display Logic** | ❌ Manual `@if` conditions in every template                      | ✅ Strategy-based (`'on-touch'`, `'on-submit'`, `'immediate'`, `'manual'`)   |
| **Error Component**     | ❌ Custom error rendering per component                           | ✅ Reusable `<ngx-signal-form-error>` with ARIA roles                        |
| **HTML5 Validation**    | ❌ Manual `novalidate` on every form                              | ✅ Automatic `novalidate` on any form with `(submit)`                        |
| **CSS Status Classes**  | ⚠️ Manual via `provideSignalFormsConfig`                          | ✅ `ngxStatusClasses()` syncs classes with error display strategy            |
| **Submission Helpers**  | ❌ Manual `form().valid() && !form().submitting()`                | ✅ `canSubmit()`, `isSubmitting()`, `hasSubmitted()` computed signals        |
| **Focus Management**    | ⚠️ Manual via `errorSummary()[0].fieldTree().focusBoundControl()` | ✅ `focusFirstInvalid(form)` one-liner wrapping native API                   |
| **Form Context**        | ❌ Manual form setup                                              | ✅ Optional `[ngxSignalForm]` provides DI context for `'on-submit'` strategy |

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

### Form Field (`@ngx-signal-forms/toolkit/form-field`)

| Feature               | Headless Primitives        | With Form Field                                               |
| --------------------- | -------------------------- | ------------------------------------------------------------- |
| **Field Wrapper**     | ❌ Build your own          | ✅ `<ngx-signal-form-field>` with automatic error display     |
| **Layout Modes**      | ❌ Build your own CSS      | ✅ Default (stacked) or `outline` (floating labels)           |
| **Fieldset Grouping** | ✅ Signals via directive   | ✅ `<ngx-signal-form-fieldset>` styled component              |
| **Character Count**   | ✅ Signals via directive   | ✅ `<ngx-signal-form-field-character-count>` styled component |
| **Hints**             | ❌ Build your own          | ✅ `<ngx-signal-form-field-hint>` with proper styling         |
| **Theming**           | ❌ Your own CSS            | ✅ 20+ CSS custom properties for deep customization           |
| **Effort**            | ⚠️ More code, full control | ✅ Ready-to-use, less code                                    |

---

## Code Comparison

### Without Toolkit (Manual ARIA and Error Logic)

```html
<form (submit)="save($event)" novalidate>
  <label for="email">Email</label>
  <input
    id="email"
    [formField]="userForm.email"
    [attr.aria-invalid]="userForm.email().invalid() ? 'true' : null"
    [attr.aria-describedby]="userForm.email().invalid() && userForm.email().touched() ? 'email-error' : null"
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

### With Toolkit (Automatic ARIA + Error Display)

```html
<!-- No [ngxSignalForm] needed for default 'on-touch' strategy! -->
<form (submit)="save($event)">
  <ngx-signal-form-field [formField]="userForm.email" fieldName="email">
    <label for="email">Email</label>
    <input id="email" [formField]="userForm.email" />
  </ngx-signal-form-field>
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
  submit,
} from '@angular/forms/signals';
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';
import { NgxSignalFormFieldComponent } from '@ngx-signal-forms/toolkit/form-field';

@Component({
  selector: 'app-contact',
  imports: [FormField, NgxSignalFormToolkit, NgxSignalFormFieldComponent],
  template: `
    <form (submit)="save($event)">
      <ngx-signal-form-field [formField]="contactForm.email" fieldName="email">
        <label for="email">Email</label>
        <input id="email" [formField]="contactForm.email" type="email" />
      </ngx-signal-form-field>
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
  );

  protected save(event: Event): void {
    event.preventDefault();
    submit(this.contactForm, async () => {
      console.log('Submit:', this.model());
    });
  }
}
```

### What You Get Automatically

- ✅ `novalidate` attribute (prevents browser validation bubbles)
- ✅ `aria-invalid` and `aria-describedby` for accessibility
- ✅ **Errors** display after blur OR submit (default `'on-touch'` strategy) with `role="alert"`
- ✅ **Warnings** (non-blocking) display with `role="status"` when no errors present
- ✅ **Hints** render below the input with proper ARIA association
- ✅ Consistent layout with label, input, feedback messages in semantic structure

> **How it works:** Angular's `submit()` calls `markAllAsTouched()`, so errors appear after both blur AND submit—without any form wrapper!

---

## Entry Points

### @ngx-signal-forms/toolkit (Core)

**What**: Essential directives, utilities, and providers for accessible, strategy-based error handling.

**When to use**: Every project that uses Angular Signal Forms.

**Key exports**:

- `NgxSignalFormToolkit` — Bundle import for all core directives
- `ngxStatusClasses()` — Align CSS classes with your error strategy
- `focusFirstInvalid()` — Convenience wrapper for Angular's `focusBoundControl()` via `errorSummary()`
- `canSubmit()`, `isSubmitting()`, `hasSubmitted()` — Computed submission signals
- `warningError()` — Create non-blocking validation messages

```typescript
import {
  NgxSignalFormToolkit,
  focusFirstInvalid,
  canSubmit,
} from '@ngx-signal-forms/toolkit';
```

**[📖 Full Documentation →](./packages/toolkit/README.md)**

---

### @ngx-signal-forms/toolkit/form-field

**What**: Pre-built UI components for consistent form layouts with automatic error display.

**When to use**: When you want ready-to-use form field wrappers with floating labels, hints, and character counters.

**Key exports**:

- `NgxSignalFormFieldComponent` — Unified wrapper for label, input, errors
- `NgxSignalFormFieldsetComponent` — Group related fields with aggregated errors
- `NgxFloatingLabelDirective` — Material Design-like outlined inputs (`outline` attribute)
- `NgxSignalFormFieldCharacterCountComponent` — Progressive character counter

```html
<ngx-signal-form-field [formField]="form.bio" outline>
  <label for="bio">Bio</label>
  <textarea id="bio" [formField]="form.bio"></textarea>
  <ngx-signal-form-field-hint
    >Tell us about yourself</ngx-signal-form-field-hint
  >
  <ngx-signal-form-field-character-count [formField]="form.bio" />
</ngx-signal-form-field>
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

## Advanced Configuration

For CSS framework integration or custom error strategies, add providers to `app.config.ts`:

```typescript
import {
  provideNgxSignalFormsConfig,
  ngxStatusClasses,
} from '@ngx-signal-forms/toolkit';

export const appConfig: ApplicationConfig = {
  providers: [
    provideNgxSignalFormsConfig({
      defaultErrorStrategy: 'on-touch', // When errors appear
      defaultFormFieldAppearance: 'outline', // Default to floating labels
      // CSS class sync (e.g., for Bootstrap 'is-invalid')
      statusClasses: ngxStatusClasses({
        strategy: 'on-touch',
        invalidClass: 'is-invalid',
      }),
    }),
  ],
};
```

**[📖 Configuration Reference →](./packages/toolkit/README.md#configuration)** | **[🎨 CSS Frameworks →](./docs/CSS_FRAMEWORK_INTEGRATION.md)**

---

## Documentation

| Document                                                             | Description                                                 |
| -------------------------------------------------------------------- | ----------------------------------------------------------- |
| **[Toolkit API Reference](./packages/toolkit/README.md)**            | Complete API documentation with all options and examples    |
| **[Form Field Components](./packages/toolkit/form-field/README.md)** | Form field wrapper, outlined layout, hints, character count |
| **[Headless Primitives](./packages/toolkit/headless/README.md)**     | Renderless directives for custom design systems             |
| **[CSS Framework Integration](./docs/CSS_FRAMEWORK_INTEGRATION.md)** | Bootstrap 5.3, Tailwind CSS 4, Angular Material setup       |
| **[Theming Guide](./packages/toolkit/form-field/THEMING.md)**        | CSS custom properties, dark mode, brand customization       |
| **[Warnings Support](./docs/WARNINGS_SUPPORT.md)**                   | Non-blocking validation messages                            |
| **[Package Architecture](./docs/PACKAGE_ARCHITECTURE.md)**           | Library structure and design decisions                      |

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
