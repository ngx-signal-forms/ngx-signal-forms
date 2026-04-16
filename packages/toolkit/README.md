# @ngx-signal-forms/toolkit

> Core directives, providers, and utilities for Angular Signal Forms — form-level context, error strategies, automatic ARIA, submission helpers, and warning support.

## Why this entry point exists

Angular Signal Forms provides the form model, validation, and field state. The core toolkit builds on top with three things Angular intentionally leaves to you:

1. **Form-level context** — error display strategy and submitted status, shared via DI so child components stay in sync without prop drilling.
2. **Automatic ARIA** — `aria-invalid`, `aria-required`, and `aria-describedby` applied to `[formField]` controls based on strategy-aware timing.
3. **Utilities** — error visibility helpers, focus management, warning support, and submission lifecycle tracking.

You always import the core entry point. The other entry points add UI components and adapters on top.

## Entry points

| Entry point                            | Purpose                                     |
| -------------------------------------- | ------------------------------------------- |
| `@ngx-signal-forms/toolkit`            | Core directives, providers, and utilities   |
| `@ngx-signal-forms/toolkit/assistive`  | Error, hint, and character count components |
| `@ngx-signal-forms/toolkit/form-field` | Form field wrapper and fieldset components  |
| `@ngx-signal-forms/toolkit/headless`   | Renderless primitives for custom UI         |
| `@ngx-signal-forms/toolkit/vest`       | Optional Vest adapter (requires `vest@6`)   |
| `@ngx-signal-forms/toolkit/debugger`   | Development-time form inspector             |

**Which one do I pick?**

- **Ready-to-use styled fields** → [`/form-field`](./form-field/README.md)
- **Custom markup, reuse toolkit error/hint/count components** → [`/assistive`](./assistive/README.md)
- **Signals-only, fully custom markup** → [`/headless`](./headless/README.md)
- **Vest business rules** → [`/vest`](./vest/README.md)
- **Dev-time form inspection** → [`/debugger`](./debugger/README.md)

## Import

```typescript
// Bundle import (recommended) — includes FormRoot, NgxSignalFormDirective,
// NgxSignalFormAutoAriaDirective, NgxSignalFormControlSemanticsDirective
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';

// Individual imports when needed
import {
  NgxSignalFormDirective,
  NgxSignalFormAutoAriaDirective,
  NgxSignalFormControlSemanticsDirective,
  provideNgxSignalFormsConfig,
  provideErrorMessages,
  showErrors,
  focusFirstInvalid,
  createOnInvalidHandler,
  warningError,
  splitByKind,
} from '@ngx-signal-forms/toolkit';
```

## Quick start

```typescript
import { Component, signal } from '@angular/core';
import { form, required, FormField } from '@angular/forms/signals';
import {
  NgxSignalFormToolkit,
  createOnInvalidHandler,
} from '@ngx-signal-forms/toolkit';

@Component({
  imports: [FormField, NgxSignalFormToolkit],
  template: `
    <form [formRoot]="contactForm" ngxSignalForm errorStrategy="on-submit">
      <label for="email">Email</label>
      <input id="email" type="email" [formField]="contactForm.email" />
      <button type="submit">Send</button>
    </form>
  `,
})
export class ContactComponent {
  readonly #model = signal({ email: '' });
  protected readonly contactForm = form(
    this.#model,
    (path) => {
      required(path.email, { message: 'Email is required' });
    },
    {
      submission: {
        action: async () => console.log('Submit:', this.#model()),
        onInvalid: createOnInvalidHandler(),
      },
    },
  );
}
```

## Core directives

### NgxSignalFormDirective

Selector: `form[formRoot][ngxSignalForm]`

Enhances Angular's `FormRoot` with form-level context shared via DI:

- **Error strategy** (`errorStrategy` input) — `'immediate'`, `'on-touch'`, or `'on-submit'`
- **Submitted status** (`submittedStatus` signal) — `'unsubmitted' → 'submitting' → 'submitted'`
- **DI context** (`NGX_SIGNAL_FORM_CONTEXT`) — child components inherit strategy and status without prop drilling

Angular's `FormRoot` remains the owner of `novalidate`, `event.preventDefault()`, and `submit()`.

```html
<form [formRoot]="myForm" ngxSignalForm errorStrategy="on-submit">
  <button type="submit">Submit</button>
</form>
```

### NgxSignalFormAutoAriaDirective

Auto-applies to supported `[formField]` controls:

- `aria-invalid` (respects error strategy timing)
- `aria-required`
- `aria-describedby` (links to error/warning elements)

Covers native `<input>`, `<textarea>`, `<select>`, and custom `[formField]` hosts. Excludes `radio` and standard `checkbox` unless explicitly opted in. Checkbox-based switches (`role="switch"`) are included automatically.

- Disable per control with `ngxSignalFormAutoAriaDisabled`
- Use `ngxSignalFormControlAria="manual"` when a control already owns its ARIA attributes

### NgxSignalFormControlSemanticsDirective

Declares a control's family for wrapper layout and auto-ARIA classification:

```html
<app-star-rating
  id="productRating"
  role="slider"
  ngxSignalFormControl="slider"
  ngxSignalFormControlAria="manual"
  [formField]="form.productRating"
/>
```

Built-in kinds: `input-like`, `standalone-field-like`, `switch`, `checkbox`, `radio-group`, `slider`, `composite`.

See [Custom Controls](../../docs/CUSTOM_CONTROLS.md) for detailed guidance.

## Configuration

```typescript
provideNgxSignalFormsConfig({
  autoAria: true, // default
  defaultErrorStrategy: 'on-touch', // 'immediate' | 'on-touch' | 'on-submit'
  defaultFormFieldAppearance: 'stacked', // 'stacked' | 'outline' | 'plain'
  showRequiredMarker: false, // outlined required field indicator
  requiredMarker: '*', // marker character
});
```

For component-scoped overrides: `provideNgxSignalFormsConfigForComponent()`.

### Error messages

```typescript
provideErrorMessages({
  required: 'This field is required',
  email: 'Invalid email format',
  minLength: (params) => `Minimum ${params.minLength} characters`,
});
```

Priority: validator `error.message` → registry → default toolkit message.

### Control presets

Global or feature-scoped defaults for control ARIA and layout:

```typescript
provideNgxSignalFormControlPresets({
  slider: { layout: 'custom', ariaMode: 'manual' },
  composite: { layout: 'custom' },
});
```

For component-scoped overrides: `provideNgxSignalFormControlPresetsForComponent()`.

### Field labels

Override how field paths appear in error summaries:

```typescript
provideFieldLabels({
  contactEmail: 'E-mailadres',
  'address.postalCode': 'Postcode',
});
```

Use a factory for dynamic resolvers (ngx-translate, `$localize`, etc.):

```typescript
provideFieldLabels(() => {
  const translate = inject(TranslateService);
  return (fieldPath) =>
    translate.instant(`fields.${fieldPath}`) || humanizeFieldPath(fieldPath);
});
```

`humanizeFieldPath` is available from `@ngx-signal-forms/toolkit/headless`.

## Utilities

### Error visibility

| Function                                               | Description                                        |
| ------------------------------------------------------ | -------------------------------------------------- |
| `showErrors(field, strategy, status?)`                 | `Signal<boolean>` — whether errors should show now |
| `shouldShowErrors(invalid, touched, strategy, status)` | Pure boolean strategy helper                       |
| `combineShowErrors(...signals)`                        | Combines multiple visibility signals               |
| `createShowErrorsComputed(field, strategy, status?)`   | Lower-level extraction for custom UIs              |

### Focus management

| Function                           | Description                                         |
| ---------------------------------- | --------------------------------------------------- |
| `focusFirstInvalid(form)`          | Focus first invalid, interactive field              |
| `createOnInvalidHandler(options?)` | Creates `onInvalid` handler for `FormSubmitOptions` |

### Submission lifecycle

| Function                             | Description                                                   |
| ------------------------------------ | ------------------------------------------------------------- |
| `createSubmittedStatusTracker(form)` | Derives `unsubmitted/submitting/submitted` status             |
| `hasSubmitted(form)`                 | `Signal<boolean>` — whether at least one submission completed |

### Warning support

| Function                             | Description                                   |
| ------------------------------------ | --------------------------------------------- |
| `warningError(kind, message)`        | Creates a non-blocking warning                |
| `isWarningError(error)`              | `true` if kind starts with `warn:`            |
| `isBlockingError(error)`             | `true` if not a warning                       |
| `splitByKind(errors)`                | Partition into `blocking` and `warnings`      |
| `hasOnlyWarnings(errors)`            | `true` when no blocking errors are present    |
| `getBlockingErrors(errors)`          | Filters out warning-only messages             |
| `canSubmitWithWarnings(form)`        | Allows submission when only warnings remain   |
| `submitWithWarnings(form, callback)` | Submit helper that blocks only on real errors |

### Field interactivity

| Function                              | Description                      |
| ------------------------------------- | -------------------------------- |
| `isFieldStateInteractive(fieldState)` | `false` when hidden or disabled  |
| `isFieldStateHidden(fieldState)`      | Narrow check for `hidden()` only |

### ARIA and identity

| Function                                   | Description                                          |
| ------------------------------------------ | ---------------------------------------------------- |
| `buildAriaDescribedBy(fieldName, options)` | Assemble `aria-describedby` for manual ARIA controls |
| `injectFormContext()`                      | Get `ngxSignalForm` context or `undefined`           |

### Other

| Function                                         | Description                           |
| ------------------------------------------------ | ------------------------------------- |
| `unwrapValue(signalOrValue)`                     | Extract value from `Signal` or static |
| `updateAt(array, index, updater)`                | Immutable array item update           |
| `updateNested(array, index, key, nestedIdx, fn)` | Immutable nested array update         |

## Related documentation

- [Root README](../../README.md) — overview, installation, quick start
- [Form field wrapper](./form-field/README.md) — pre-styled wrapper component
- [Assistive components](./assistive/README.md) — standalone error, hint, and count components
- [Headless primitives](./headless/README.md) — renderless directives for custom UI
- [Vest integration](./vest/README.md) — Vest adapter
- [Debugger](./debugger/README.md) — development-time form inspector
- [Theming guide](./form-field/THEMING.md) — CSS custom properties
- [Custom controls](../../docs/CUSTOM_CONTROLS.md) — wrapping custom and third-party widgets
- [Warnings support](../../docs/WARNINGS_SUPPORT.md) — warning convention and flow

## License

MIT © [ngx-signal-forms](https://github.com/ngx-signal-forms/ngx-signal-forms)
