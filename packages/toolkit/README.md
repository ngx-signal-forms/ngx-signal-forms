---
title: '@ngx-signal-forms/toolkit'
sidebarTitle: 'toolkit'
---

API reference for the root entry point, `@ngx-signal-forms/toolkit`.

The root entry point holds the parts every form uses: configuration, error
timing, automatic ARIA, focus on invalid submit, and warning helpers. It
renders no UI. You always import it, and you add a UI entry point on top.

To pick a UI entry point, read
[Choose your level](../../README.md#choose-your-level) in the root README.
For a complete, tested form, see the [quick start](../../README.md#quick-start).

## Entry points

| Entry point                            | Purpose                                                               |
| -------------------------------------- | --------------------------------------------------------------------- |
| `@ngx-signal-forms/toolkit`            | Configuration, directives, and utilities (this page)                  |
| `@ngx-signal-forms/toolkit/form-field` | [Styled field wrapper and fieldset](./form-field/README.md)           |
| `@ngx-signal-forms/toolkit/assistive`  | [Error, hint, counter, and summary components](./assistive/README.md) |
| `@ngx-signal-forms/toolkit/headless`   | [State-only directives for your own markup](./headless/README.md)     |
| `@ngx-signal-forms/toolkit/vest`       | [Vest adapter](./vest/README.md) (requires `vest`)                    |
| `@ngx-signal-forms/toolkit/testing`    | [WCAG 2.2 AA test helpers](./testing/README.md) (requires `axe-core`) |

## Import

Import the `NgxSignalFormToolkit` bundle next to Angular's `FormField`:

```typescript
import { FormField } from '@angular/forms/signals';
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';

@Component({
  imports: [FormField, NgxSignalFormToolkit],
})
export class ProfileFormComponent {}
```

The bundle contains four standalone directives:

| Directive                                | Selector                        | Does                                                         |
| ---------------------------------------- | ------------------------------- | ------------------------------------------------------------ |
| `FormRoot`                               | `form[formRoot]`                | Angular's form directive. Handles `submit()`                 |
| `NgxSignalForm`                          | `form[formRoot][ngxSignalForm]` | Shares error timing and submit status with the form's fields |
| `NgxSignalFormAutoAria`                  | `[formField]` controls          | Writes `aria-invalid`, `aria-required`, `aria-describedby`   |
| `NgxSignalFormControlSemanticsDirective` | `[ngxSignalFormControl]`        | Declares the kind of a custom control                        |

You can also import each directive on its own.

## Example: show an error with the root entry point only

The UI entry points render messages for you. This example renders the
message by hand, so you can see what the root entry point does by itself.

```typescript
import { Component, computed, signal } from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';
import {
  createErrorVisibility,
  createOnInvalidHandler,
  NgxSignalFormToolkit,
} from '@ngx-signal-forms/toolkit';

@Component({
  selector: 'app-newsletter',
  imports: [FormField, NgxSignalFormToolkit],
  templateUrl: './newsletter.html',
})
export class NewsletterComponent {
  readonly model = signal({ email: '' });
  readonly newsletterForm = form(
    this.model,
    (path) => {
      required(path.email, { message: 'Email is required' });
    },
    {
      submission: {
        action: async (tree) => console.log(tree().value()),
        onInvalid: createOnInvalidHandler(),
      },
    },
  );

  // true after the user leaves the field or submits (default 'on-touch')
  readonly showEmailError = createErrorVisibility(
    computed(() => this.newsletterForm.email()),
  );
}
```

```html
<!-- newsletter.html -->
<form [formRoot]="newsletterForm">
  <label for="email">Email</label>
  <input id="email" type="email" [formField]="newsletterForm.email" />
  @if (showEmailError()) {
  <div id="email-error" role="alert">
    @for (error of newsletterForm.email().errors(); track error.kind) {
    <p>{{ error.message }}</p>
    }
  </div>
  }
  <button type="submit">Subscribe</button>
</form>
```

What happens:

- `NgxSignalFormAutoAria` sets `aria-invalid="true"` and
  `aria-describedby="email-error"` on the input when the error shows. It
  builds the id from the input `id` plus `-error`.
- `aria-required="true"` comes from the `required()` validator.
- On an invalid submit, `createOnInvalidHandler()` moves focus to the input.

With `/form-field`, the wrapper replaces the `@if` block. See the
[quick start](../../README.md#quick-start).

## Core directives

### NgxSignalForm

Selector: `form[formRoot][ngxSignalForm]`. Template reference: `#f="ngxSignalForm"`.

Add `ngxSignalForm` next to `[formRoot]` when you need one of these:

- `on-submit` timing.
- One error or warning timing for the whole form.
- An error summary, or other components that read the form's submit status.

| Input             | Type                                       | Default                  |
| ----------------- | ------------------------------------------ | ------------------------ |
| `errorStrategy`   | `'immediate' \| 'on-touch' \| 'on-submit'` | From config (`on-touch`) |
| `warningStrategy` | `'immediate' \| 'on-touch' \| 'on-submit'` | From config (`on-touch`) |

The form does not accept `'inherit'`. Only field-level inputs accept it.

The `submittedStatus` signal is `'unsubmitted'`, `'submitting'`, or
`'submitted'`. It becomes `'submitted'` after any submit attempt, valid or not,
and returns to `'unsubmitted'` after `form.reset()`.

The directive provides `NGX_SIGNAL_FORM_CONTEXT`, so child components read the
timing and status without inputs. Angular's `FormRoot` still adds
`novalidate`, prevents the native submit, and calls `submit()`.

```html
<form [formRoot]="myForm" ngxSignalForm errorStrategy="on-submit">
  <button type="submit">Submit</button>
</form>
```

### NgxSignalFormAutoAria

Writes three attributes on each `[formField]` control:

- `aria-invalid`, when the error is visible under the current timing.
- `aria-required`, when the field is required.
- `aria-describedby`, which links hints, the error, and the warning.

It applies to `input`, `textarea`, `select`, and custom `[formField]` hosts.
It skips native checkboxes and radios unless you add `ngxSignalFormControl`,
because the wrapper puts that ARIA on the group instead. A checkbox with
`role="switch"` is included without extra markup. The full table of control
kinds and when auto-ARIA applies is in
[Custom controls](../../docs/CUSTOM_CONTROLS.md#inferred-kind-vs-auto-aria-eligibility).

To stop auto-ARIA on one control:

- Add `ngxSignalFormAutoAriaDisabled` to turn it off completely.
- Add `ngxSignalFormControlAria="manual"` when the control or its library
  writes its own ARIA.

To stop auto-ARIA on every control of one kind, set `ariaMode: 'manual'` in a
[control preset](#control-presets). The preset applies to each control that
declares that kind with `ngxSignalFormControl`:

```typescript
provideNgxSignalFormControlPresets({
  composite: { ariaMode: 'manual' },
});
```

```html
<app-date-range ngxSignalFormControl="composite" [formField]="form.dates" />
```

No config key turns auto-ARIA off for the whole app.

### NgxSignalFormControlSemanticsDirective

Tells the wrapper and auto-ARIA what kind of control a custom host is.

| Input                        | Values                                                                                            |
| ---------------------------- | ------------------------------------------------------------------------------------------------- |
| `ngxSignalFormControl`       | `input-like`, `standalone-field-like`, `switch`, `checkbox`, `radio-group`, `slider`, `composite` |
| `ngxSignalFormControlLayout` | `stacked`, `inline-control`, `group`, `custom`                                                    |
| `ngxSignalFormControlAria`   | `auto`, `manual`                                                                                  |

```html
<app-star-rating
  id="productRating"
  role="slider"
  ngxSignalFormControl="slider"
  ngxSignalFormControlAria="manual"
  [formField]="form.productRating"
/>
```

See [Custom controls](../../docs/CUSTOM_CONTROLS.md) for which kind to pick.

## Configuration

Set app-wide defaults in `app.config.ts`. Every key is optional:

```typescript
import { provideNgxSignalFormsConfig } from '@ngx-signal-forms/toolkit';

export const appConfig: ApplicationConfig = {
  providers: [
    provideNgxSignalFormsConfig({
      defaultErrorStrategy: 'on-submit',
      defaultFormFieldAppearance: 'outline',
    }),
  ],
};
```

All keys and their defaults:

| Key                           | Default                                            | Controls                                                                  |
| ----------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------- |
| `defaultErrorStrategy`        | `'on-touch'`                                       | When errors show: `'immediate'`, `'on-touch'`, or `'on-submit'`           |
| `defaultWarningStrategy`      | `'on-touch'`                                       | When warnings show. Same values                                           |
| `defaultFormFieldAppearance`  | `'standard'`                                       | Wrapper look: `'standard'`, `'outline'`, or `'plain'`                     |
| `defaultFormFieldOrientation` | `'vertical'`                                       | Wrapper layout: `'vertical'` or `'horizontal'`                            |
| `showMarkerWhen`              | `'required'`                                       | Which fields get a marker: `'required'`, `'optional'`, or `'none'`        |
| `requiredMarker`              | `' *'`                                             | Marker text in `'required'` mode                                          |
| `optionalMarker`              | `' (optional)'`                                    | Marker text in `'optional'` mode                                          |
| `requiredLegendText`          | `'{marker} indicates a required field'`            | Legend text in `'required'` mode                                          |
| `optionalLegendText`          | `'All fields are required unless marked {marker}'` | Legend text in `'optional'` mode                                          |
| `requiredHintText`            | `'required'`                                       | Hidden text that marks a required checkbox or radio group                 |
| `errorPrefixText`             | `'Error:'`                                         | Hidden prefix before each error in `NgxFormFieldError`. `''` turns it off |
| `warningPrefixText`           | `'Warning:'`                                       | Hidden prefix before each warning in `NgxFormFieldError`                  |
| `errorSummaryAnnouncesAlone`  | `true`                                             | With an error summary, only the summary announces on submit               |
| `characterCountLimitText`     | `'Up to {max} characters'`                         | Hidden limit text that the character count links to the control           |
| `hideHintOnError`             | `false`                                            | Hide the visible hint while an error or warning shows                     |

For one component and its children, use
`provideNgxSignalFormsConfigForComponent()` in the component's `providers`.
It overrides only the keys you pass. Other keys come from the nearest parent
config.

<a id="how-settings-resolve-the-cascade"></a>

### How settings resolve

When a setting is set in more than one place, the most specific one wins.

Error and warning timing use this order:

1. The field input, such as `strategy` on the wrapper.
2. The form: `errorStrategy` or `warningStrategy` on `ngxSignalForm`.
3. The component provider: `provideNgxSignalFormsConfigForComponent()`.
4. The app provider: `provideNgxSignalFormsConfig()`.
5. The built-in default, `on-touch`.

Other settings have their own order, most specific first:

| Setting                                      | Order                                                              |
| -------------------------------------------- | ------------------------------------------------------------------ |
| Submitted status                             | Explicit input → `ngxSignalForm` → `'unsubmitted'`                 |
| Wrapper appearance, orientation, and markers | Field input → component provider → app provider → built-in default |
| Control kind                                 | `ngxSignalFormControl` attribute → inferred from the DOM           |
| Control layout and ARIA mode                 | Explicit values → the preset for the resolved kind                 |
| Error and hint renderer                      | Nearest renderer provider → built-in renderer                      |

A component provider changes only the keys you pass. It inherits every other
key from the provider above it. An explicit empty value counts:
`requiredMarker: ''` removes the marker, while leaving the key out inherits it.

The full timing rules are in
[Warnings, timing, and messages](../../docs/WARNINGS_SUPPORT.md#timing-and-configuration).

### Field marking

`showMarkerWhen` picks which fields get a visual marker:

- `'required'` marks required fields with `requiredMarker`.
- `'optional'` marks optional fields with `optionalMarker`. Use it when most
  fields are required.
- `'none'` marks nothing. Screen readers still get `aria-required`.

Markers are decorative (`aria-hidden`). To explain the marker, add
`<ngx-form-marking-legend />` from `/assistive` to the form. The legend reads
its text from config and hides itself when no field needs it:

```html
<form [formRoot]="form" ngxSignalForm>
  <ngx-form-marking-legend />
  <!-- fields -->
</form>
```

The wrapper and the legend both accept `showMarkerWhen`, `requiredMarker`, and
`optionalMarker` inputs for one field or one legend.

### Control presets

Set the default layout and ARIA mode per control kind:

```typescript
provideNgxSignalFormControlPresets({
  slider: { layout: 'custom', ariaMode: 'manual' },
  composite: { layout: 'custom' },
});
```

Use `provideNgxSignalFormControlPresetsForComponent()` for one component. It
overrides only the kinds and fields you pass.

## Error messages

A field shows the first message it finds, in this order:

1. The `message` on the validation error.
2. The message registry from `provideErrorMessages()`.
3. The toolkit's built-in message for that error kind.

```typescript
provideErrorMessages({
  required: 'This field is required',
  email: 'Enter a valid email address',
  minLength: ({ minLength }) => `Use at least ${minLength} characters`,
});
```

To rename fields in the error summary, use `provideFieldLabels()`:

```typescript
provideFieldLabels({
  contactEmail: 'Email address',
  'address.postalCode': 'Postcode',
});
```

Both providers also accept a factory, for translation libraries. See
[message resolution](../../docs/WARNINGS_SUPPORT.md#message-resolution) and
[runtime language changes](../../docs/WARNINGS_SUPPORT.md#runtime-language-changes).

For your own error UI, one function gives you the same text:

| Function                                                    | Returns                                  |
| ----------------------------------------------------------- | ---------------------------------------- |
| `resolveValidationErrorMessage(error, registry?, options?)` | The message, using all three steps above |

## Utilities

### Show errors and warnings at the right time

| Function                                | Does                                                                      |
| --------------------------------------- | ------------------------------------------------------------------------- |
| `createErrorVisibility(field, opts?)`   | `Signal<boolean>`: show the error now? Reads the form's timing and status |
| `createWarningVisibility(field, opts?)` | Same for warnings. `false` while a blocking error shows                   |
| `readDirectErrors(state)`               | The field's own errors, without errors from child fields                  |
| `injectFormContext(injector?)`          | The nearest `ngxSignalForm` context, or `undefined`                       |

`createErrorVisibility` and `createWarningVisibility` read the
`ngxSignalForm` context through dependency injection. Call them in a component
inside the form. In the component that holds the `<form>` itself, pass
`strategy` and `submittedStatus` in the options.

### Focus and submission

| Function                             | Does                                                                             |
| ------------------------------------ | -------------------------------------------------------------------------------- |
| `createOnInvalidHandler(options?)`   | Returns an `onInvalid` handler for `form()` that focuses the first invalid field |
| `focusFirstInvalid(form)`            | Focuses the first invalid field that the user can reach. Returns `boolean`       |
| `createSubmittedStatusTracker(form)` | `Signal<SubmittedStatus>` for a form without `ngxSignalForm`                     |
| `hasSubmitted(form)`                 | `Signal<boolean>`: `true` after a submit attempt                                 |

Call `createSubmittedStatusTracker` and `hasSubmitted` in an injection
context, such as a field initializer.

### Warning support

A warning is a validation error whose `kind` starts with `warn:`. It gives
advice and does not block submit when you use the helpers below.

| Function                           | Does                                                                        |
| ---------------------------------- | --------------------------------------------------------------------------- |
| `warningError(kind, message?)`     | Creates a warning. Adds the `warn:` prefix if `kind` does not have it       |
| `isWarningError(error)`            | `true` when the kind starts with `warn:`                                    |
| `isBlockingError(error)`           | `true` when the error is not a warning                                      |
| `WARN_KIND_PREFIX`                 | The string `'warn:'`                                                        |
| `splitByKind(errors)`              | Splits a list into `{ blocking, warnings }`                                 |
| `getBlockingErrors(errors)`        | Only the blocking errors                                                    |
| `hasOnlyWarnings(errors)`          | `true` when no blocking error is in the list, including an empty list       |
| `canSubmitWithWarnings(form)`      | `Signal<boolean>`: `false` while submitting or while blocking errors remain |
| `submitWithWarnings(form, action)` | Submits when only warnings remain. Returns `Promise<boolean>`               |

Pending async validators do not block `canSubmitWithWarnings()` or
`submitWithWarnings()`. Validate on the server too. See
[Warnings](../../docs/WARNINGS_SUPPORT.md) for the submit patterns and for
`warningStrategy`. On a field, `warningStrategy` is inherited from the form or
config and falls back to `on-touch`.

### Standard Schema

`requiredFromStandardSchema(path, schema)` sets required state for one field
validated by a Standard Schema library, such as Zod. Angular's
`validateStandardSchema()` does not do this, so without it the field gets no
`aria-required` and no required marker. Call it once per field:

```typescript
form(model, (path) => {
  validateStandardSchema(path, TravelerSchema);
  requiredFromStandardSchema(path.firstName, TravelerSchema);
});
```

### Field state

| Function                              | Does                                         |
| ------------------------------------- | -------------------------------------------- |
| `isFieldStateInteractive(fieldState)` | `false` when the field is hidden or disabled |
| `isFieldStateHidden(fieldState)`      | `true` when the field is hidden              |

### Values and arrays

| Function                                         | Does                                                    |
| ------------------------------------------------ | ------------------------------------------------------- |
| `unwrapValue(signalOrValue)`                     | Reads a signal, or returns a plain value as it is       |
| `updateAt(array, index, updater)`                | Returns a new array with one item updated               |
| `updateNested(array, index, key, nestedIdx, fn)` | Returns a new array with one nested item updated        |
| `createUniqueId(prefix)`                         | Returns a new DOM id: `prefix-1`, `prefix-2`, and so on |

### Field presentation for custom wrappers

`createFieldPresentation(field, options?)` gives your own field wrapper the
same error and warning state that `NgxFormFieldWrapper` uses. Your wrapper
then shows messages at the same moments as the built-in one.

```typescript
protected readonly presentation = createFieldPresentation(
  computed(() => this.formField()()),
  {
    strategy: this.strategy,
    warningStrategy: this.warningStrategy,
    identity: inject(NgxFieldIdentity, { optional: true }),
  },
);
```

It returns read-only signals:

| Signal                                           | Meaning                                                        |
| ------------------------------------------------ | -------------------------------------------------------------- |
| `errors` / `warnings`                            | The field's own blocking errors and warnings                   |
| `hasErrors` / `hasWarnings`                      | Whether each list has items                                    |
| `showErrors`                                     | A blocking error shows now. Use it for invalid styling         |
| `showWarnings`                                   | A warning shows now. `false` while a blocking error shows      |
| `renderMessageSlot`                              | Render the message component. It picks which messages to print |
| `effectiveStrategy` / `effectiveWarningStrategy` | The resolved timings. Pass them to your message component      |

A hidden field (`hidden()`) shows no messages. Pass `hidden` in the options to
use your own signal. When you pass `identity`, auto-ARIA follows the field's
timing overrides. The full walkthrough is in
[Custom wrappers](../../docs/CUSTOM_WRAPPERS.md).

## For custom wrappers and controls

Most apps do not need these exports. They let a custom wrapper or control
behave like the built-in ones. Read
[Custom wrappers](../../docs/CUSTOM_WRAPPERS.md) and
[Custom controls](../../docs/CUSTOM_CONTROLS.md) before you use them.

**Field identity and registries**

| Export                                      | Does                                                                              |
| ------------------------------------------- | --------------------------------------------------------------------------------- |
| `NgxFieldIdentity`                          | Per-field service: field name, control id, error and warning ids, hint ids        |
| `NgxFieldIdentityProvider`                  | Host directive that sets the field name when it is not the control's `id`         |
| `NGX_SIGNAL_FORM_FIELD_CONTEXT`             | Field data a wrapper gives to the content inside it                               |
| `NGX_SIGNAL_FORM_HINT_REGISTRY`             | Registers hint ids so auto-ARIA adds them to `aria-describedby`                   |
| `NGX_SIGNAL_FORM_FIELD_VISIBILITY_REGISTRY` | Registers the timing of a message area outside a wrapper, so auto-ARIA follows it |
| `NGX_SIGNAL_FORM_CONTEXT`                   | The form's timing and submit status, from `ngxSignalForm`                         |
| `NGX_SIGNAL_FORMS_CONFIG`                   | The resolved configuration                                                        |

**Message renderers**

| Export                                                                          | Does                                               |
| ------------------------------------------------------------------------------- | -------------------------------------------------- |
| `provideFormFieldErrorRenderer({ component })`                                  | Replaces the wrapper's error component for the app |
| `provideFormFieldErrorRendererForComponent({ component })`                      | Same, for one component and its children           |
| `provideFormFieldHintRenderer()` / `provideFormFieldHintRendererForComponent()` | Same, for the hint component                       |
| `NGX_FORM_FIELD_ERROR_RENDERER` / `NGX_FORM_FIELD_HINT_RENDERER`                | The tokens these providers set                     |

**Control kinds and presets**

| Export                                                                                           | Does                                                                                          |
| ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| `resolveNgxSignalFormControlSemantics(element, presets)`                                         | Declared kind, then guessed kind, then preset. Same as the wrapper                            |
| `NgxControlPresetRegistry`                                                                       | Service with `resolve(kind)`, `kinds()`, and `extend(overrides)`. Add it to `providers` first |
| `NGX_SIGNAL_FORM_CONTROL_PRESETS` / `DEFAULT_NGX_SIGNAL_FORM_CONTROL_PRESETS`                    | The active presets and the built-in presets                                                   |
| `NGX_SIGNAL_FORM_ARIA_MODE`                                                                      | The `auto` or `manual` ARIA mode of one control host                                          |
| `isNgxSignalFormControlKind` / `isNgxSignalFormControlLayout` / `isNgxSignalFormControlAriaMode` | Type guards for preset values                                                                 |

**Ids and ARIA**

| Export                                                    | Does                                                              |
| --------------------------------------------------------- | ----------------------------------------------------------------- |
| `generateErrorId(fieldName, kind?)`                       | Returns `{fieldName}-error`, or `{fieldName}-error-{kind}`        |
| `generateWarningId(fieldName)`                            | Returns `{fieldName}-warning`                                     |
| `buildAriaDescribedBy(fieldName, options?)`               | Builds an `aria-describedby` value for a control with manual ARIA |
| `normalizeFieldName(value)`                               | Trims a name. Returns `null` for a blank name                     |
| `resolveFieldName(element)`                               | Reads a field name from an element's `id`                         |
| `resolveFieldNameFromCandidates(...candidates)`           | Returns the first name that is not blank                          |
| `isElementCssVisible(element)`                            | `true` when CSS shows the element                                 |
| `createControlVisibilitySignal(resolveElement, injector)` | `Signal<boolean>` that tracks whether the control is visible      |

Each function also has companion types exported from the root, such as
`CreateErrorVisibilityOptions` and `OnInvalidHandlerOptions`.

## Accessibility testing harness

`@ngx-signal-forms/toolkit/testing` checks a rendered component for WCAG 2.2 AA
violations with axe-core. See the [testing README](./testing/README.md).

## Related documentation

- [Root README](../../README.md): benefits, install, and quick start
- [Form field wrapper](./form-field/README.md)
- [Assistive components](./assistive/README.md)
- [Headless directives](./headless/README.md)
- [Vest adapter](./vest/README.md)
- [Theming](./form-field/THEMING.md)
- [Warnings, timing, and messages](../../docs/WARNINGS_SUPPORT.md)
- [Custom controls](../../docs/CUSTOM_CONTROLS.md)
- [Custom wrappers](../../docs/CUSTOM_WRAPPERS.md)

## For maintainers

- npm publishes the root `README.md`, not this file.
- `packages/toolkit/index.ts` lists every public root export by name. When you
  add a public symbol to `core/`, add it there and to this page.
- `NgxSignalFormControlSemanticsDirective` keeps the `Directive` suffix. The
  interface `NgxSignalFormControlSemantics` already uses the short name.
- `NgxFieldIdentity` has `set*` writer methods tagged `@internal`.
  `scripts/strip-internal-members.mjs` removes them from the published
  `.d.ts`. The build does not use TypeScript's `stripInternal`, because it
  drops public symbols in ng-packagr's multi-entry build (#289).
