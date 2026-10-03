---
title: '@ngx-signal-forms/toolkit/headless'
sidebarTitle: 'headless'
---

Toolkit state as signals, with no markup and no styles. You write every element.
The toolkit tells you when to show an error, which message to show, and which
ids to use.

- **Use this when** you render all feedback markup yourself, for example in
  your own design system.
- **Use [`/assistive`](/packages/toolkit/assistive/README) instead when** ready-made
  feedback components fit. Use [`/form-field`](/packages/toolkit/form-field/README) when
  the toolkit's field layout fits.

See [Choose your level](/README#choose-your-level).

## Import

```typescript
import { FormField } from '@angular/forms/signals';
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';
import { NgxHeadlessToolkit } from '@ngx-signal-forms/toolkit/headless';
```

`NgxHeadlessToolkit` holds all five directives: `NgxHeadlessErrorState`,
`NgxHeadlessErrorSummary`, `NgxHeadlessFieldset`, `NgxHeadlessCharacterCount`,
and `NgxHeadlessFieldName`. You can also import
each directive by name.

Import `NgxSignalFormToolkit` from the root entry point too. It adds auto-ARIA
to eligible `[formField]` controls, and the `ngxSignalForm` directive that
shares form-level timing. Native checkboxes and radios are not eligible by
default, because their ARIA belongs on the group. See
[custom controls](/docs/CUSTOM_CONTROLS#inferred-kind-vs-auto-aria-eligibility).

## What you do and what the toolkit does

The toolkit does this for you:

- Decides when errors and warnings show (`on-touch` by default).
- Resolves the message text (validator `message`, then your
  `provideErrorMessages()` registry, then a built-in default).
- Gives you stable ids: `{fieldName}-error` and `{fieldName}-warning`.
- With `NgxSignalFormToolkit`, auto-ARIA writes `aria-invalid`,
  `aria-required`, and `aria-describedby` on each control. It points
  `aria-describedby` at `{id}-error` or `{id}-warning`, where `{id}` is the
  control's `id`.

You do this yourself:

- Render the error and warning elements, with `role="alert"` and
  `role="status"`, and the ids from the directive.
- Use a `fieldName` that equals the control's `id`, so auto-ARIA and your
  elements agree on the ids.
- Add `ngxSignalForm` to the form when you set `strategy` or
  `warningStrategy` on the directive. The directive then tells auto-ARIA when
  its messages show, so `aria-invalid` and `aria-describedby` change together
  with your message. Without `ngxSignalForm`, auto-ARIA follows the app
  config, not the directive, so set timing in the app config instead.
- Link hints yourself: give the hint an `id` and add it to the control's
  `aria-describedby`. Auto-ARIA keeps ids that you write.
- Style everything.

If auto-ARIA is off for a control (`ngxSignalFormControlAria="manual"`), you
write all ARIA yourself. The [ARIA factories](#aria-composition) help with
that.

## Example

An email field with your own error and warning markup. Copy it into an Angular
application and render `<app-contact />`.

```typescript
import { Component, signal } from '@angular/core';
import { email, form, FormField, required } from '@angular/forms/signals';
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';
import { NgxHeadlessErrorState } from '@ngx-signal-forms/toolkit/headless';

@Component({
  selector: 'app-contact',
  imports: [FormField, NgxSignalFormToolkit, NgxHeadlessErrorState],
  template: `
    <form [formRoot]="contactForm" ngxSignalForm>
      <div
        ngxHeadlessErrorState
        #errorState="errorState"
        [field]="contactForm.email"
        fieldName="email"
      >
        <label for="email">Email</label>
        <input id="email" type="email" [formField]="contactForm.email" />

        <div [id]="errorState.errorId()" role="alert" class="my-error">
          @if (errorState.shouldShowErrors()) {
            @for (error of errorState.resolvedErrors(); track $index) {
              <p>{{ error.message }}</p>
            }
          }
        </div>
        <div [id]="errorState.warningId()" role="status" class="my-warning">
          @if (errorState.shouldShowWarnings()) {
            @for (warning of errorState.resolvedWarnings(); track $index) {
              <p>{{ warning.message }}</p>
            }
          }
        </div>
      </div>

      <button type="submit">Send</button>
    </form>
  `,
})
export class ContactComponent {
  readonly model = signal({ email: '' });
  readonly contactForm = form(
    this.model,
    (path) => {
      required(path.email, { message: 'Email is required' });
      email(path.email, { message: 'Enter a valid email address' });
    },
    {
      submission: {
        action: async () => {
          // Call your API here.
        },
      },
    },
  );
}
```

The live regions stay in the DOM and only their content changes. Screen
readers announce a live region more reliably when it exists before its content
arrives.

## Which primitive do I need?

Each feature has a template directive and a factory function. Use the
directive in a template. Use the factory in a component class, a service, or a
host directive.

| You want to show…                  | Directive (`exportAs`)                         | Factory                             |
| ---------------------------------- | ---------------------------------------------- | ----------------------------------- |
| One field's errors and warnings    | `NgxHeadlessErrorState` (`errorState`)         | `createErrorState()`                |
| Resolved messages with ids         | `NgxHeadlessErrorState` (`resolvedErrors()`)   | `createErrorMessageSignal()`        |
| A summary of all form errors       | `NgxHeadlessErrorSummary` (`errorSummary`)     | `createErrorSummaryEntries()`       |
| Errors of a group of fields        | `NgxHeadlessFieldset` (`fieldset`)             | `createFieldsetAggregation()`       |
| A list of errors you computed      | `NgxHeadlessErrorState` (`errorsOverride`)     | `createErrorState()`                |
| A character count                  | `NgxHeadlessCharacterCount` (`characterCount`) | `createCharacterCount()`            |
| Error and warning ids only         | `NgxHeadlessFieldName` (`fieldName`)           | —                                   |
| Required or optional markers       | —                                              | `createFieldOptionalitySummary()`   |
| ARIA attributes you write yourself | —                                              | [ARIA factories](#aria-composition) |

## A reusable feedback component

Use `NgxHeadlessErrorState` as a
[host directive](https://angular.dev/guide/directives/directive-composition-api)
to build your own error component. This component renders feedback only. You
put it next to your control.

```typescript
import { Component, inject } from '@angular/core';
import { NgxHeadlessErrorState } from '@ngx-signal-forms/toolkit/headless';

@Component({
  selector: 'my-field-feedback',
  hostDirectives: [
    {
      directive: NgxHeadlessErrorState,
      inputs: ['field', 'fieldName', 'strategy', 'warningStrategy'],
    },
  ],
  template: `
    <div
      role="alert"
      [attr.id]="
        errorState.shouldShowErrors() && errorState.hasErrors()
          ? errorState.errorId()
          : null
      "
    >
      @if (errorState.shouldShowErrors()) {
        @for (error of errorState.resolvedErrors(); track $index) {
          <p class="error">{{ error.message }}</p>
        }
      }
    </div>
    <div
      role="status"
      [attr.id]="
        errorState.shouldShowWarnings() && errorState.hasWarnings()
          ? errorState.warningId()
          : null
      "
    >
      @if (errorState.shouldShowWarnings()) {
        @for (warning of errorState.resolvedWarnings(); track $index) {
          <p class="warning">{{ warning.message }}</p>
        }
      }
    </div>
  `,
})
export class MyFieldFeedback {
  protected readonly errorState = inject(NgxHeadlessErrorState);
}
```

```html
<label for="email">Email</label>
<input id="email" [formField]="form.email" />
<my-field-feedback [field]="form.email" fieldName="email" />
```

This component is complete for feedback when:

- `fieldName` equals the control's `id`.
- The form has `ngxSignalForm`. Then auto-ARIA follows the timing of this
  component, also when you set `strategy` or `warningStrategy` on it.

For a component that also owns the label, the control, and the hints, build a
full wrapper. See [custom wrappers](/docs/CUSTOM_WRAPPERS).

## Directives

### NgxHeadlessErrorState

Selector: `[ngxHeadlessErrorState]` · Export: `errorState`

The errors and warnings of one field, with timing applied.

| Input             | Type                                              | Default   | Description                                                                   |
| ----------------- | ------------------------------------------------- | --------- | ----------------------------------------------------------------------------- |
| `field`           | `FieldTree`                                       | —         | The field to track. Omit it when you bind `errorsOverride`.                   |
| `fieldName`       | `string \| null`                                  | `null`    | Base for the ids. `null` turns ids off.                                       |
| `errorsOverride`  | `NgxReactiveOrStatic<readonly ValidationError[]>` | —         | A list you computed, as an array, a signal, or a function. Wins over `field`. |
| `strategy`        | `ErrorDisplayStrategy`                            | inherited | When errors show.                                                             |
| `warningStrategy` | `WarningDisplayStrategy`                          | inherited | When warnings show. Falls back to `on-touch`.                                 |
| `renders`         | `NgxHeadlessErrorChannels`                        | `'both'`  | `'errors'`, `'warnings'` or `'both'`: the channels your template renders.     |
| `submittedStatus` | `SubmittedStatus`                                 | inherited | Submission state for `on-submit`, when there is no `ngxSignalForm`.           |

"Inherited" means the directive uses the form's `ngxSignalForm` setting, then
the provided config. See
[timing and configuration](/docs/WARNINGS_SUPPORT#timing-and-configuration).

Signals: `shouldShowErrors()`, `shouldShowWarnings()`, `hasErrors()`,
`hasWarnings()`, `errors()`, `warnings()`, `resolvedErrors()`,
`resolvedWarnings()`, `errorId()`, `warningId()`, `resolvedSubmittedStatus()`.
`errorId()` and `warningId()` are `null` when no `fieldName` is set.

- `shouldShowWarnings()` stays `false` while a blocking error shows on the same
  field.
- Set `renders` when your template has no error element or no warning element.
  The control's `aria-describedby` then leaves out the id of the missing
  element. `aria-invalid` still follows the real error state.
- With `errorsOverride`, `shouldShowErrors()` is always `true`. You decide when
  to pass the list.

### NgxHeadlessErrorSummary

Selector: `[ngxHeadlessErrorSummary]` · Export: `errorSummary`

All errors and warnings of a form, one entry per message.

| Input             | Type                     | Default   | Description                                          |
| ----------------- | ------------------------ | --------- | ---------------------------------------------------- |
| `formTree`        | `FieldTree` (required)   | —         | The root form.                                       |
| `strategy`        | `ErrorDisplayStrategy`   | inherited | When error entries show.                             |
| `warningStrategy` | `WarningDisplayStrategy` | inherited | When warning entries show. Falls back to `on-touch`. |
| `submittedStatus` | `SubmittedStatus`        | inherited | Submission state for `on-submit`.                    |

Signals: `entries()`, `warningEntries()`, `hasErrors()`, `hasWarnings()`,
`shouldShow()`, `shouldShowWarnings()`, `resolvedStrategy()`,
`resolvedWarningStrategy()`. Method: `focusFirst()`.

- Each entry has `key`, `kind`, `message`, `fieldName`, `focus()`, and
  `canFocus`. Render an entry as a button only when `canFocus` is `true`.
  Otherwise render plain text, because the error has no control to focus.
- Track rows by `key` (`@for (entry of summary.entries(); track entry.key)`).
  `fieldName` is display text: two fields can share it.
- `shouldShow()` controls error entries. `shouldShowWarnings()` controls
  warning entries. They are independent: a form that shows errors only after
  submit can still show warnings on touch.

### NgxHeadlessFieldset

Selector: `[ngxHeadlessFieldset]` · Export: `fieldset`

The errors and warnings of a group of fields.

| Input                 | Type                           | Default   | Description                                         |
| --------------------- | ------------------------------ | --------- | --------------------------------------------------- |
| `field`               | `FieldTree` (required)         | —         | The group.                                          |
| `fields`              | `readonly FieldTree[] \| null` | `null`    | Fields to collect from. `[]` collects nothing.      |
| `fieldsetId`          | `string`                       | generated | Base id for your group elements.                    |
| `includeNestedErrors` | `boolean`                      | `false`   | Also collect errors of the fields inside the group. |
| `strategy`            | `ErrorDisplayStrategy`         | inherited | When errors show.                                   |
| `warningStrategy`     | `WarningDisplayStrategy`       | inherited | When warnings show. Falls back to `on-touch`.       |
| `submittedStatus`     | `SubmittedStatus`              | inherited | Submission state for `on-submit`.                   |

Signals: `resolvedErrors()`, `resolvedWarnings()`, `aggregatedErrors()`,
`aggregatedWarnings()`, `hasErrors()`, `hasWarnings()`, `shouldShowErrors()`,
`shouldShowWarnings()`, `isValid()`, `isInvalid()`, `isTouched()`, `isDirty()`,
`isPending()`, `resolvedStrategy()`, `resolvedWarningStrategy()`,
`resolvedSubmittedStatus()`, `resolvedFieldsetId()`.

- `shouldShowErrors()` and `shouldShowWarnings()` are independent. If you show
  errors and warnings in one place, hide the warnings yourself while errors
  show.
- Render `resolvedErrors()`, not `aggregatedErrors()[i].message`. A validator
  without a `message` option has no `message`. The resolved signals fill it in.

```typescript
@Component({
  selector: 'app-address',
  imports: [FormField, NgxHeadlessFieldset],
  template: `
    <fieldset ngxHeadlessFieldset #fieldset="fieldset" [field]="form.address">
      <legend>Address</legend>
      <!-- controls -->
      <div role="alert" class="my-errors">
        @if (fieldset.shouldShowErrors() && fieldset.hasErrors()) {
          @for (error of fieldset.resolvedErrors(); track $index) {
            <p>{{ error.message }}</p>
          }
        }
      </div>
    </fieldset>
  `,
})
export class AddressComponent {
  // `form` holds an `address` group
}
```

See [grouped fields and arrays](/docs/COMPLEX_NESTED_FORMS) for
fieldset patterns.

### NgxHeadlessCharacterCount

Selector: `[ngxHeadlessCharacterCount]` · Export: `characterCount`

A character count with limit states.

| Input              | Type                             | Default  | Description                                                    |
| ------------------ | -------------------------------- | -------- | -------------------------------------------------------------- |
| `field`            | `FieldTree<CharacterCountValue>` | required | A `string`, `readonly string[]`, `null`, or `undefined` field. |
| `maxLength`        | `number`                         | required | The limit.                                                     |
| `warningThreshold` | `number`                         | `0.8`    | Share of the limit where `'warning'` starts.                   |
| `dangerThreshold`  | `number`                         | `0.95`   | Share of the limit where `'danger'` starts.                    |

Signals: `currentLength()`, `resolvedMaxLength()`, `remaining()`,
`limitState()` (`'ok' | 'warning' | 'danger' | 'exceeded'`), `hasLimit()`,
`isExceeded()`, `percentUsed()`.

- `remaining()` goes below zero when the value is over the limit.
  `percentUsed()` can go over 100.
- The default thresholds are exported as `DEFAULT_WARNING_THRESHOLD` and
  `DEFAULT_DANGER_THRESHOLD`.
- `createCharacterCount()` makes `maxLength` optional. Set
  `useValidatorMaxLength: true` to read the field's `maxLength` validator. With
  no limit, `resolvedMaxLength()` is `null`, so check `hasLimit()` first.

### NgxHeadlessFieldName

Selector: `[ngxHeadlessFieldName]` · Export: `fieldName`

Resolves a field name and its ids. It uses the `fieldName` input, or else the
host element's `id`.

Signals: `resolvedFieldName()`, `errorId()`, `warningId()`. All three are
`null` when neither a `fieldName` nor an `id` is set. The directive then logs
an error in development mode. Do not build ids from a `null` name.

## Reactive Primitives

Factory functions that return signals. Use them in a component class, a
service, or a host directive.

### createErrorMessageSignal

Resolved messages for one field, with timing applied and one id per message.
`NgxHeadlessErrorState` uses the same message resolution, so both give the
same text.

```typescript
import { Component, input } from '@angular/core';
import type { FieldTree } from '@angular/forms/signals';
import { createErrorMessageSignal } from '@ngx-signal-forms/toolkit/headless';

@Component({/* ... */})
export class EmailErrors {
  readonly field = input.required<FieldTree<string>>();

  readonly resolvedErrors = createErrorMessageSignal(() => this.field()(), {
    fieldName: 'email',
  });

  readonly resolvedWarnings = createErrorMessageSignal(() => this.field()(), {
    includeWarnings: 'only',
    fieldName: 'email',
  });
}
```

Each entry is `{ kind, message, id, error }`:

- `kind`: the validator kind.
- `message`: the resolved text.
- `id`: an id for this one message, `{fieldName}-error-{kind}`. Auto-ARIA
  points at the container ids `{fieldName}-error` and `{fieldName}-warning`,
  so keep those ids on the containers. Two messages with the same kind share an
  id, so do not use it as a DOM id when kinds can repeat.
- `error`: the original `ValidationError`.

Options:

| Option               | Default   | Description                                                                          |
| -------------------- | --------- | ------------------------------------------------------------------------------------ |
| `includeWarnings`    | `false`   | `false`: errors only. `true`: both. `'only'`: warnings only.                         |
| `stripWarningPrefix` | `true`    | Removes `warn:` from the kind. Set `false` to keep it.                               |
| `fieldName`          | —         | Base for the ids.                                                                    |
| `errorMessages`      | injected  | A `Signal<ErrorMessageRegistry>`. Defaults to the `provideErrorMessages()` registry. |
| `strategy`           | inherited | When errors show.                                                                    |
| `warningStrategy`    | inherited | When warnings show. Falls back to `on-touch`.                                        |
| `submittedStatus`    | inherited | Submission state for `on-submit`.                                                    |
| `injector`           | —         | Needed outside an injection context.                                                 |

A runnable demo is in
[`apps/demo/src/app/03-headless/error-message-signal`](https://github.com/ngx-signal-forms/ngx-signal-forms/tree/77ce2f7de996cc397982199d1b3822dedb259b29/apps/demo/src/app/03-headless/error-message-signal).

### createErrorState / createCharacterCount / createFieldStateFlags

```typescript
// Error state. `fieldName` is required; pass `null` to turn ids off.
const state = createErrorState({ field: form.email, fieldName: 'email' });

// Character count
const count = createCharacterCount({ field: form.bio, maxLength: 500 });

// Common flags: isTouched(), isDirty(), isValid(), isInvalid(), isPending()
const flags = createFieldStateFlags(() => form.email());
```

- `createErrorState()` returns `errors()` and `warnings()` as raw
  `ValidationError` lists, not resolved text. Use `createErrorMessageSignal()`
  for resolved messages, or `resolveValidationErrorMessage()` from
  `@ngx-signal-forms/toolkit` for one message.
- `createErrorState()` also returns `shouldShowErrors()`,
  `shouldShowWarnings()`, `hasErrors()`, `hasWarnings()`, `errorId()`,
  `warningId()`, and `fieldName()`. It takes `strategy`, `warningStrategy`,
  `submittedStatus`, and `injector` options.
- Call these factories in an injection context, or pass `injector`.

### createFieldOptionalitySummary

Tell whether a form has required or optional fields, for example to show a
legend:

```typescript
const summary = createFieldOptionalitySummary(() => this.formTree()); // signals
summary.hasRequired(); // boolean
summary.hasOptional(); // boolean
```

### createFieldsetAggregation / createErrorSummaryEntries

The functions behind `NgxHeadlessFieldset` and `NgxHeadlessErrorSummary`. They
need no injection context. You pass in the timing. `createErrorVisibility()` and
`createWarningVisibility()` read the `ngxSignalForm` context, so call them in an
injection context, such as a class field, or pass `injector`.

```typescript
import {
  createErrorVisibility,
  createWarningVisibility,
} from '@ngx-signal-forms/toolkit';
import { createErrorSummaryEntries } from '@ngx-signal-forms/toolkit/headless';

const fieldState = () => this.form();
const summary = createErrorSummaryEntries({
  fieldState,
  showErrors: createErrorVisibility(fieldState),
  showWarnings: createWarningVisibility(fieldState, { hasWarnings: true }),
});
// summary.entries(), summary.warningEntries(), summary.shouldShow(), ...
```

`createErrorSummaryEntries()` options:

| Option          | Required | Description                                                       |
| --------------- | -------- | ----------------------------------------------------------------- |
| `fieldState`    | yes      | A function that returns the form's state, such as `() => form()`. |
| `showErrors`    | yes      | A signal that says when errors show.                              |
| `showWarnings`  | yes      | A signal that says when warnings show.                            |
| `errorMessages` | no       | A message registry.                                               |
| `labelResolver` | no       | A function that turns a field path into a label.                  |

It returns `entries()`, `warningEntries()`, `hasErrors()`, `hasWarnings()`,
`shouldShow()`, and `shouldShowWarnings()`.

`createFieldsetAggregation()` takes `fieldState`, `showErrors`, and
`showWarnings`, plus optional `fields`, `includeNestedErrors`, and
`errorMessages`. It returns `aggregatedErrors()`, `aggregatedWarnings()`,
`resolvedErrors()`, `resolvedWarnings()`, `hasErrors()`, `hasWarnings()`,
`shouldShowErrors()`, and `shouldShowWarnings()`.

Rules for the timing signals:

- Pass two separate signals. One signal for both makes warnings follow error
  timing.
- For warnings, pass `hasWarnings: true` to `createWarningVisibility()`. Do not
  pass a form-wide `errorVisibility`, or an error on one field hides the
  warning on another.
- These helpers do not read `provideNgxSignalFormsConfig()`. Pass
  `configDefault` if you need the app default.

## ARIA composition

Use these factories when you write ARIA yourself instead of using auto-ARIA,
for example in a custom wrapper. See
[custom wrappers](/docs/CUSTOM_WRAPPERS) for a full example.

| Factory                            | Produces                                                                    |
| ---------------------------------- | --------------------------------------------------------------------------- |
| `createAriaInvalidSignal(...)`     | `aria-invalid`, with error timing applied                                   |
| `createAriaRequiredSignal(...)`    | `aria-required` from field state                                            |
| `createAriaDescribedBySignal(...)` | `aria-describedby` from your ids, hint ids, and error and warning ids       |
| `createHintIdsSignal(...)`         | The list of hint ids for `aria-describedby`                                 |
| `createAriaDescribedByBridge(...)` | `aria-describedby` for a control whose library also writes that attribute   |
| `createFieldNameResolver(...)`     | The field name: explicit name, then label `for` (opt-in), then control `id` |

`createAriaInvalidSignal()` takes a third argument: a `Signal<boolean>` that
is `true` while the control is visible on the page. Without it, a control in a
closed `<details>`, a hidden tab, or another wizard step keeps a stale
`aria-invalid`. Create it with `createControlVisibilitySignal(resolveElement,
injector)` from `@ngx-signal-forms/toolkit`. If your code already runs an
`afterEveryRender` read, call `isElementCssVisible(element)` there instead.

## Utility functions

Small helpers for one-off reads:

```typescript
dedupeValidationErrors(errors); // removes repeats with the same kind and message

humanizeFieldPath('address.postalCode'); // 'Address / Postal code'
```

For field state, use the typed field state (`field().invalid()`) or
`createFieldStateFlags()`. For errors, use `field().errorSummary()`; it keeps the
subtree behavior. `createErrorState()` gives one field's direct errors only, not
descendants. For a list of summary entries with `fieldName`, `focus()` and
`canFocus`, use `createErrorSummaryEntries()`. It accepts any subtree.

## Related documentation

- [Toolkit core](/packages/toolkit/README): configuration, auto-ARIA, and utilities
- [Assistive components](/packages/toolkit/assistive/README): styled errors, summary,
  hint, and character count
- [Form field wrapper](/packages/toolkit/form-field/README): the complete styled field
- [Custom wrappers](/docs/CUSTOM_WRAPPERS): build your own wrapper
