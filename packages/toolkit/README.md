# @ngx-signal-forms/toolkit

> Core directives, providers, and utilities for Angular Signal Forms — form-level context, error strategies, automatic ARIA, submission helpers, and warning support.

**[🚀 Live demo](https://ngx-signal-forms.github.io/ngx-signal-forms/)** · **[📖 Full documentation (GitHub)](https://github.com/ngx-signal-forms/ngx-signal-forms#readme)**

## Why this entry point exists

Angular Signal Forms provides the form model, validation, and field state. The core toolkit builds on top with three things Angular intentionally leaves to you:

1. **Form-level context** — error display strategy and submitted status, shared via DI so child components stay in sync without prop drilling.
2. **Automatic ARIA** — `aria-invalid`, `aria-required`, and `aria-describedby` applied to `[formField]` controls based on strategy-aware timing.
3. **Utilities** — error visibility helpers, focus management, warning support, and submission lifecycle tracking.

You always import the core entry point. The other entry points add UI components and adapters on top.

## Entry points

| Entry point                            | Purpose                                                            |
| -------------------------------------- | ------------------------------------------------------------------ |
| `@ngx-signal-forms/toolkit`            | Core directives, providers, and utilities                          |
| `@ngx-signal-forms/toolkit/assistive`  | Error, grouped notification, hint, counter, and summary components |
| `@ngx-signal-forms/toolkit/form-field` | Form field wrapper and fieldset components                         |
| `@ngx-signal-forms/toolkit/headless`   | Renderless primitives for custom UI                                |
| `@ngx-signal-forms/toolkit/vest`       | Optional Vest adapter (requires `vest@6`)                          |

**Which one do I pick?**

- **Ready-to-use styled fields** → [`/form-field`](./form-field/README.md)
- **Custom markup, reuse toolkit error/notification/hint/count/summary components** → [`/assistive`](./assistive/README.md)
- **Signals-only, fully custom markup** → [`/headless`](./headless/README.md)
- **Vest business rules** → [`/vest`](./vest/README.md)

## Import

```typescript
// Bundle import (recommended) — includes FormRoot, NgxSignalForm,
// NgxSignalFormAutoAria, NgxSignalFormControlSemanticsDirective
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';

// Individual imports when needed
import {
  NgxSignalForm,
  NgxSignalFormAutoAria,
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

> The directive class is `NgxSignalFormControlSemanticsDirective` — the only
> public class in v1 that keeps its `Directive` suffix, because the
> `NgxSignalFormControlSemantics` interface (in `core/types.ts`) already
> occupies the suffix-less name.

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

### NgxSignalForm

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

### NgxSignalFormAutoAria

Auto-applies to supported `[formField]` controls:

- `aria-invalid` (respects error strategy timing)
- `aria-required`
- `aria-describedby` (links to error/warning elements)

Covers native `<input>`, `<textarea>`, `<select>`, and custom `[formField]` hosts. Excludes `radio` and standard `checkbox` unless explicitly opted in. Checkbox-based switches (`role="switch"`) are included automatically.

- Disable per control with `ngxSignalFormAutoAriaDisabled`
- Use `ngxSignalFormControlAria="manual"` when a control already owns its ARIA attributes

### NgxSignalFormControlSemanticsDirective

Declares a control's family for wrapper layout and auto-ARIA classification.
The directive class keeps its `Directive` suffix to avoid colliding with the
`NgxSignalFormControlSemantics` interface in `core/types.ts`.

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

See [Custom Controls](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/docs/CUSTOM_CONTROLS.md) for detailed guidance.

## Configuration

```typescript
provideNgxSignalFormsConfig({
  autoAria: true, // default
  defaultErrorStrategy: 'on-touch', // 'immediate' | 'on-touch' | 'on-submit'
  defaultFormFieldAppearance: 'standard', // 'standard' | 'outline' | 'plain'
  defaultFormFieldOrientation: 'vertical', // 'vertical' | 'horizontal'
  showMarkerWhen: 'required', // 'required' | 'optional' | 'none'
  requiredMarker: ' *', // marker for required fields ('required' mode)
  optionalMarker: ' (optional)', // marker for optional fields ('optional' mode)
  requiredLegendText: '{marker} indicates a required field',
  optionalLegendText: 'All fields are required unless marked {marker}',
});
```

This is the canonical list of configuration keys and their defaults.

### How settings resolve (the cascade)

Every presentation setting — error strategy, appearance, orientation, markers,
control presets, renderers — resolves through **one precedence chain, most
specific wins**:

```
field / component input
  ?? form context (ngxSignalForm)
  ?? component-scoped provider (…ForComponent)
  ?? app-wide provider (provideNgxSignalForms…)
  ?? built-in default
```

Inheritance merges with nullish `??` **per key**: override one key and the rest
still inherit, and an explicit falsy value is respected (`requiredMarker: ''`
clears the marker; omitting the key inherits it). Every "you can override this"
in the sections below is a link in this chain — see the
[root README](https://github.com/ngx-signal-forms/ngx-signal-forms#how-settings-resolve-the-cascade)
for the adopter-level walkthrough.

### Field marking

`showMarkerWhen` controls which fields carry a visual marker:

- `'required'` (default) — mark required fields with `requiredMarker`.
- `'optional'` — mark optional fields with `optionalMarker` (best when most
  fields are required; the GOV.UK / NN/g "mark the exception" guidance).
- `'none'` — mark nothing. Required state is still exposed via `aria-required`,
  so this remains accessible.

Markers render in every appearance (`standard`, `outline`, `plain`) and are
`aria-hidden` (decorative). Drop `NgxFormMarkingLegend` anywhere in a form to
explain the marker — it is mode-aware, reads its text from config (or a `[text]`
input), substitutes `{marker}`, and hides itself when the form has no field of
the relevant kind:

```html
<form [formRoot]="form" ngxSignalForm>
  <ngx-form-marking-legend />
  <!-- fields… -->
</form>
```

Per-field / per-legend overrides are available via the `showMarkerWhen`,
`requiredMarker`, and `optionalMarker` inputs on both
`<ngx-form-field-wrapper>` and `<ngx-form-marking-legend>`.

For component-scoped overrides: `provideNgxSignalFormsConfigForComponent()`.
This is the component-scoped tier of the
[cascade](#how-settings-resolve-the-cascade): the provider merges with parent
configuration property-by-property via `skipSelf` DI — child values win for
keys they set, and every other key is inherited from the nearest ancestor
`provideNgxSignalFormsConfig` call. The same inheritance contract applies to
`provideNgxSignalFormControlPresetsForComponent()`.

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

#### Reading presets with `NgxControlPresetRegistry`

`NgxControlPresetRegistry` is an injectable read/merge surface over the
`NGX_SIGNAL_FORM_CONTROL_PRESETS` token. The token stays the source of truth,
so the registry observes whatever the **calling injector** resolves — including
component- and feature-scoped `provideNgxSignalFormControlPresetsForComponent()`
overrides.

`NgxControlPresetRegistry` is `providedIn: null`, so list it in the relevant
`providers` array (or environment injector) before injecting it — each provided
node then captures the presets effective at that node:

```typescript
@Component({
  // ...
  providers: [NgxControlPresetRegistry],
})
export class MyComponent {
  private readonly registry = inject(NgxControlPresetRegistry);
  // ...
}
```

```typescript
const registry = inject(NgxControlPresetRegistry);

registry.resolve('slider'); // → effective { layout, ariaMode } for 'slider'
registry.kinds(); // → readonly list of registered control kinds
```

Use `extend()` for a merge-not-replace layering: only the fields you pass are
overridden, every other kind (and untouched field) is preserved:

```typescript
const next = registry.extend({ slider: { layout: 'custom' } });
// next.slider.layout === 'custom'
// next.slider.ariaMode is unchanged; next.switch, next.composite, ... all stay default
```

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

> Warning **display timing** is controlled separately from error timing via the
> `warningStrategy` input on `NgxFormFieldError` (default:
> `'immediate'`). See
> [`WARNINGS_SUPPORT.md`](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/docs/WARNINGS_SUPPORT.md#when-warnings-appear--warningstrategy)
> and the [assistive README](./assistive/README.md#ngxformfielderrorcomponent)
> for usage.

### Field interactivity

| Function                              | Description                      |
| ------------------------------------- | -------------------------------- |
| `isFieldStateInteractive(fieldState)` | `false` when hidden or disabled  |
| `isFieldStateHidden(fieldState)`      | Narrow check for `hidden()` only |

### ARIA and identity

| Function                                        | Description                                                                                 |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `buildAriaDescribedBy(fieldName, options)`      | Assemble `aria-describedby` for manual ARIA controls                                        |
| `normalizeFieldName(value)`                     | Trim and null-collapse a candidate name into the v1 identity form                           |
| `resolveFieldName(element)`                     | Read a usable field name from an element's `id` (trimmed, with `element.id` fallback)       |
| `resolveFieldNameFromCandidates(...candidates)` | Pick the first non-blank field name from a precedence chain (explicit → host id → context)  |
| `generateErrorId(fieldName, kind?)`             | Derive `{fieldName}-error` (container) or `{fieldName}-error-{kind}` (per-error) element id |
| `generateWarningId(fieldName)`                  | Derive the `{fieldName}-warning` element id used for `aria-describedby`                     |
| `isElementCssVisible(element)`                  | CSS-visibility test (`Element.checkVisibility()` with `offsetParent` fallback)              |
| `injectFormContext()`                           | Get `ngxSignalForm` context or `undefined`                                                  |

### Field identity service

`NgxFieldIdentity` is the element-scoped service that consolidates the three
load-bearing accessibility primitives every assistive/headless surface depends
on: **field-name resolution**, **control visibility**, and **stable error /
warning ID generation**. The canonical `ngx-form-field-wrapper` provides and
drives it; custom controls and third-party wrappers can provide it themselves
to get identical behavior without re-deriving the rules.

| Member                      | Description                                                                                                                 |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `fieldName()`               | Resolved field name (explicit → bound-control `id` → `null`; the label `for=` tier is opt-in via `createFieldNameResolver`) |
| `controlId()`               | The bound control element's `id` attribute, or `null`                                                                       |
| `errorId()`                 | Stable `{fieldName}-error` id, or `null` when no name is resolved                                                           |
| `warningId()`               | Stable `{fieldName}-warning` id, or `null` when no name is resolved                                                         |
| `hintIds()`                 | Hint ids contributed by the surrounding registry for this field                                                             |
| `describedBy()`             | Aggregated `aria-describedby` chain from `hintIds()`, or `null`                                                             |
| `isControlVisible()`        | Callable signal: no-arg returns the cached, reactive visibility flag                                                        |
| `isControlVisible(element)` | Same member with an element argument: ad-hoc, non-reactive `isElementCssVisible(element)` probe                             |
| `resolveControlElement()`   | The currently bound control element, or `null`                                                                              |

Name resolution comes in two interchangeable shapes that produce **identical**
names:

- The service's internal resolution (driven by the wrapper) follows
  explicit → bound-control `id` — no label tier.
- `createFieldNameResolver({ explicit, labelFor?, boundControl, wrapperName })`
  exposes the same cascade for custom wrappers, with the label `for=` tier as
  an **opt-in** middle step. Omit `labelFor` and the two paths emit the same
  name byte-for-byte.

The `set*` writer methods are package-internal (stripped from the published
`.d.ts`): the surrounding `ngx-form-field-wrapper` **drives** the identity, and
consumers **read** the resolved signals — they do not drive them.

#### Custom control example

A custom control placed inside `ngx-form-field-wrapper` injects the
wrapper-provided `NgxFieldIdentity` and **reads** the resolved identity it
publishes — the resolved name, the stable error / warning ids, and the
aggregated `aria-describedby` chain — so the control stays in lockstep with
every other toolkit surface without re-deriving any of the rules:

```typescript
import { Component, ElementRef, inject } from '@angular/core';
import {
  NgxFieldIdentity,
  isElementCssVisible,
} from '@ngx-signal-forms/toolkit';

@Component({
  selector: 'my-rating-control',
  template: `
    <div role="radiogroup" [attr.aria-describedby]="identity.describedBy()">
      <!-- rating widget -->
    </div>
    @if (identity.errorId(); as errorId) {
      <div [id]="errorId"><!-- error message --></div>
    }
  `,
})
export class MyRatingControl {
  // Injected from the surrounding `ngx-form-field-wrapper`, which drives it.
  protected readonly identity = inject(NgxFieldIdentity);
  readonly #host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected describedBy(): string | null {
    return this.identity.describedBy();
  }

  // Read the cached, reactive visibility flag the wrapper maintains…
  protected isLaidOut(): boolean {
    return this.identity.isControlVisible();
  }

  // …or run the wrapper's exact CSS-visibility test against an arbitrary
  // element ad hoc, via the public `isElementCssVisible` helper.
  protected isElementLaidOut(): boolean {
    const el = this.#host.nativeElement.querySelector('input');
    return el ? isElementCssVisible(el) : true;
  }
}
```

`identity.errorId()` / `identity.warningId()` yield stable
`{name}-error` / `{name}-warning` ids the control wires into its error and
warning elements, matching every other toolkit surface.

### Other

| Function                                         | Description                           |
| ------------------------------------------------ | ------------------------------------- |
| `unwrapValue(signalOrValue)`                     | Extract value from `Signal` or static |
| `updateAt(array, index, updater)`                | Immutable array item update           |
| `updateNested(array, index, key, nestedIdx, fn)` | Immutable nested array update         |

## Related documentation

- [Root README](https://github.com/ngx-signal-forms/ngx-signal-forms#readme) — overview, installation, quick start
- [Form field wrapper](./form-field/README.md) — pre-styled wrapper component
- [Assistive components](./assistive/README.md) — standalone error, grouped notification, hint, counter, and summary components
- [Headless primitives](./headless/README.md) — renderless directives for custom UI
- [Vest integration](./vest/README.md) — Vest adapter
- [Theming guide](./form-field/THEMING.md) — CSS custom properties
- [Custom controls](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/docs/CUSTOM_CONTROLS.md) — wrapping custom and third-party widgets
- [Warnings support](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/docs/WARNINGS_SUPPORT.md) — warning convention and flow

## License

MIT © [ngx-signal-forms](https://github.com/ngx-signal-forms/ngx-signal-forms)
