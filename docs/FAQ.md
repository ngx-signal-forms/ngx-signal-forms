---
title: 'FAQ: building forms with @ngx-signal-forms/toolkit'
sidebarTitle: 'FAQ'
---

Short answers to "how do I do X" questions. Each answer links the guide that
explains the topic in full, and a runnable demo where one exists. For what the
toolkit adds on top of Angular, see
[Angular and toolkit ownership](/docs/ANGULAR_VS_TOOLKIT).

`form`, `submit`, `validate`, `hidden`, `disabled`, `debounce`,
`validateHttp`, `validateStandardSchema`, `applyEach`, and the control
interfaces come from Angular (`@angular/forms/signals`). Everything else comes
from the toolkit (`@ngx-signal-forms/toolkit` and its `/form-field`,
`/assistive`, `/headless`, `/vest`, and `/testing` entry points).

## Table of contents

- **[Getting started](#getting-started)**
  - [How do I show validation errors only after the user leaves a field (on blur) instead of while they type?](#how-do-i-show-validation-errors-only-after-the-user-leaves-a-field-on-blur-instead-of-while-they-type)
  - [How do I wire up a `<select>`, a radio group, and a checkbox group with `[formField]`?](#how-do-i-wire-up-a-select-a-radio-group-and-a-checkbox-group-with-formfield)
- **[Errors, submit & UX](#errors-submit--ux)**
  - [How do I reset my form after a successful submit, and prefill it from an HTTP call?](#how-do-i-reset-my-form-after-a-successful-submit-and-prefill-it-from-an-http-call)
  - [How do I disable the submit button while the form is invalid or a submit is in flight?](#how-do-i-disable-the-submit-button-while-the-form-is-invalid-or-a-submit-is-in-flight)
  - [What does `createOnInvalidHandler()` do on a failed submit, and can I customize it?](#what-does-createoninvalidhandler-do-on-a-failed-submit-and-can-i-customize-it)
  - [Can I set the error-display strategy once app-wide and override it per form or per field?](#can-i-set-the-error-display-strategy-once-app-wide-and-override-it-per-form-or-per-field)
- **[Custom controls & design systems](#custom-controls--design-systems)**
  - [How do I make my own design-system inputs work inside the wrapper (aria-invalid, aria-describedby, error timing)?](#how-do-i-make-my-own-design-system-inputs-work-inside-the-wrapper-aria-invalid-aria-describedby-error-timing)
  - [How do I make a custom combobox or closed select look like the native text field?](#how-do-i-make-a-custom-combobox-or-closed-select-look-like-the-native-text-field)
  - [We don't want the toolkit's wrapper markup at all — how do I build my own with the headless APIs?](#we-dont-want-the-toolkits-wrapper-markup-at-all--how-do-i-build-my-own-with-the-headless-apis)
  - [How do I theme the built-in wrapper with our brand tokens?](#how-do-i-theme-the-built-in-wrapper-with-our-brand-tokens)
  - [How do I integrate a third-party datepicker (value/change API, not a native input)?](#how-do-i-integrate-a-third-party-datepicker-valuechange-api-not-a-native-input)
- **[Complex & dynamic forms](#complex--dynamic-forms)**
  - [How do I build a dynamic form array (e.g. invoice line items you can add/remove)?](#how-do-i-build-a-dynamic-form-array-eg-invoice-line-items-you-can-addremove)
  - [How do I hide/disable a group of fields based on another field, so hidden fields stop blocking validity?](#how-do-i-hidedisable-a-group-of-fields-based-on-another-field-so-hidden-fields-stop-blocking-validity)
  - [For a multi-step wizard, how do I validate only the current step before "Next", with one form model?](#for-a-multi-step-wizard-how-do-i-validate-only-the-current-step-before-next-with-one-form-model)
  - [How do I two-way sync my form model with an NgRx SignalStore without update loops?](#how-do-i-two-way-sync-my-form-model-with-an-ngrx-signalstore-without-update-loops)
- **[Validation](#validation)**
  - [How do I do debounced async validation (e.g. username availability) and show the pending state?](#how-do-i-do-debounced-async-validation-eg-username-availability-and-show-the-pending-state)
  - [After submit my API returns field errors like `{ email: 'already taken' }` — how do I map them onto fields?](#after-submit-my-api-returns-field-errors-like--email-already-taken---how-do-i-map-them-onto-fields)
  - [How do I reuse a Zod schema as the validation source, and how do Zod issues become field errors?](#how-do-i-reuse-a-zod-schema-as-the-validation-source-and-how-do-zod-issues-become-field-errors)
  - [Can I keep my existing Vest suites, and how do warnings map onto the toolkit?](#can-i-keep-my-existing-vest-suites-and-how-do-warnings-map-onto-the-toolkit)
- **[i18n, a11y & testing](#i18n-a11y--testing)**
  - [How do I translate error messages and field labels with Transloco/`$localize`?](#how-do-i-translate-error-messages-and-field-labels-with-translocolocalize)
  - [How do I render an accessible error summary that links to each invalid field on submit?](#how-do-i-render-an-accessible-error-summary-that-links-to-each-invalid-field-on-submit)
  - [How do I unit-test a form component (set value, touch, assert rendered error + `aria-invalid`) in Vitest/TestBed?](#how-do-i-unit-test-a-form-component-set-value-touch-assert-rendered-error--aria-invalid-in-vitesttestbed)
- **[Migration](#migration)**
  - [I'm migrating from Reactive Forms — what replaces `setValue`/`patchValue`, `valueChanges`, `markAllAsTouched`, and `ValidatorFn`, and can I migrate one form at a time?](#im-migrating-from-reactive-forms--what-replaces-setvaluepatchvalue-valuechanges-markallastouched-and-validatorfn-and-can-i-migrate-one-form-at-a-time)

---

## Getting started

<a id="how-do-i-show-validation-errors-only-after-the-user-leaves-a-field-on-blur-instead-of-while-they-type"></a>

### How do I show validation errors only after the user leaves a field (on blur) instead of while they type?

You do not need to do anything. The default strategy is `on-touch`, so
`ngx-form-field-wrapper` shows a field's errors after the user leaves the
field, or after submit. If errors show while the user types, a setting
somewhere uses `immediate`. To change timing for one field, set `strategy` on
the wrapper:

```html
<ngx-form-field-wrapper [formField]="userForm.email" strategy="on-submit">
  <label for="email">Email</label>
  <input id="email" [formField]="userForm.email" />
</ngx-form-field-wrapper>
```

See [timing and configuration](/docs/WARNINGS_SUPPORT#timing-and-configuration)
for the full precedence rules, and the
[error-display-modes demo](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/77ce2f7de996cc397982199d1b3822dedb259b29/apps/demo/src/app/02-toolkit-core/error-display-modes/README.md).

<a id="how-do-i-wire-up-a-select-a-radio-group-and-a-checkbox-group-with-formfield"></a>

### How do I wire up a `<select>`, a radio group, and a checkbox group with `[formField]`?

- **`<select>`:** bind `[formField]` and put it in a wrapper, the same as a
  text `<input>`. Auto-ARIA works on it without extra attributes.
- **Radio or checkbox group:** bind every input in the group to the same
  field, inside one wrapper. Give radios a shared `name` and distinct `value`s.
  Use `<span ngxFormFieldLabel>` instead of `<label>`, because the wrapper
  labels the group container. The wrapper detects the group and puts
  `role`, `aria-labelledby`, `aria-describedby`, and `aria-required` on the
  container.
- **One boolean checkbox:** add `ngxSignalFormControl="checkbox"` so auto-ARIA
  writes to it. A native `input[type=checkbox][role=switch]` needs no extra
  attribute.

See [control kinds and auto-ARIA](/docs/CUSTOM_CONTROLS#inferred-kind-vs-auto-aria-eligibility)
and the [complex-forms demo](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/77ce2f7de996cc397982199d1b3822dedb259b29/apps/demo/src/app/04-form-field-wrapper/complex-forms/README.md).

---

<a id="errors-submit--ux"></a>

## Errors, submit & UX

<a id="how-do-i-reset-my-form-after-a-successful-submit-and-prefill-it-from-an-http-call"></a>

### How do I reset my form after a successful submit, and prefill it from an HTTP call?

The model signal you pass to `form(model, schema)` holds the data. Both tasks
write to it.

- **Prefill:** load the record, then call `model.set(record)`. Set the whole
  object once rather than patching field by field.
- **Reset:** Angular's `reset(value?)` clears `touched` and `dirty` on the
  field and its descendants. Pass a value to also set the model. Call it on
  the root: `this.form().reset(initialValues)`.

```ts
readonly #model = signal<Profile>(EMPTY_PROFILE);
protected readonly form = form(this.#model, profileSchema);

async load(id: string) {
  this.#model.set(
    await firstValueFrom(this.http.get<Profile>(`/api/profile/${id}`)),
  );
}

async onSubmit() {
  const ok = await submit(this.form, {
    action: async (tree) => {
      await this.api.save(tree().value());
    },
  });
  if (ok) {
    this.form().reset(this.#model()); // clear touched/dirty, keep saved values
  }
}
```

`reset()` does not fetch again. To get the server values back, fetch and call
`model.set(...)`. The
[server-integration demo](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/77ce2f7de996cc397982199d1b3822dedb259b29/apps/demo/src/app/05-advanced/server-integration/README.md)
shows fetch, prefill, edit, submit, and reset with `resource()`.

<a id="how-do-i-disable-the-submit-button-while-the-form-is-invalid-or-a-submit-is-in-flight"></a>

### How do I disable the submit button while the form is invalid or a submit is in flight?

Use Angular's own signals. `submitting()` is `true` while a `submit()` action
runs:

```html
<button
  type="submit"
  [disabled]="userForm().invalid() || userForm().submitting()"
>
  Save
</button>
```

If the form has warnings, `invalid()` is also `true` for warning-only forms.
Use `canSubmitWithWarnings(form)` instead. It returns `false` while the form
submits or while blocking errors remain. Pending async validators do not make
it `false`. See [form submission behavior](/docs/WARNINGS_SUPPORT#form-submission-behavior)
and the [submission-patterns demo](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/77ce2f7de996cc397982199d1b3822dedb259b29/apps/demo/src/app/05-advanced/submission-patterns/README.md).

<a id="what-does-createoninvalidhandler-do-on-a-failed-submit-and-can-i-customize-it"></a>

### What does `createOnInvalidHandler()` do on a failed submit, and can I customize it?

It builds the `onInvalid` callback for Angular's `submission` options. On a
failed submit, it moves focus to the first invalid field that the user can
reach. It skips hidden and disabled fields. It takes two options:

- `focusFirstInvalid` (default `true`): set `false` to turn off the focus move.
- `afterInvalid: (field) => void`: runs after the focus move, for example to
  announce a message.

```ts
onInvalid: createOnInvalidHandler({
  afterInvalid: () => this.announce('Please fix the errors'),
});
```

For other behavior, write your own `onInvalid` and call
`focusFirstInvalid(form)` where you need it. See
[submission and invalid-focus handling](/packages/toolkit/README).

<a id="can-i-set-the-error-display-strategy-once-app-wide-and-override-it-per-form-or-per-field"></a>

### Can I set the error-display strategy once app-wide and override it per form or per field?

Yes. The most specific setting wins:

- **App:** `provideNgxSignalFormsConfig({ defaultErrorStrategy: 'on-touch' })`
  in `app.config.ts`.
- **Feature:** `provideNgxSignalFormsConfigForComponent(...)` in a
  component's `providers`.
- **Form:** `errorStrategy` on `<form [formRoot] ngxSignalForm>`. It accepts
  `'immediate'`, `'on-touch'`, or `'on-submit'`.
- **Field:** `strategy` on `<ngx-form-field-wrapper>`. It also accepts
  `'inherit'`, which is the same as leaving it out.

Only error timing, warning timing, and submitted status go through the form
directive. Visual settings such as `appearance` skip it. See
[timing and configuration](/docs/WARNINGS_SUPPORT#timing-and-configuration)
and the [global-configuration demo](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/77ce2f7de996cc397982199d1b3822dedb259b29/apps/demo/src/app/05-advanced/global-configuration/README.md).

---

<a id="custom-controls--design-systems"></a>

## Custom controls & design systems

<a id="how-do-i-make-my-own-design-system-inputs-work-inside-the-wrapper-aria-invalid-aria-describedby-error-timing"></a>

### How do I make my own design-system inputs work inside the wrapper (aria-invalid, aria-describedby, error timing)?

Implement Angular's control interfaces on your component and bind it with
`[formField]` inside the wrapper. Use `FormValueControl<T>` for a value
(`value = model<T>()`) or `FormCheckboxControl` for a toggle
(`checked = model(false)`). Add a `focus()` method so invalid-submit focus and
error-summary links can reach it. Give it a stable `id`. If the widget writes
its own ARIA, add `ngxSignalFormControlAria="manual"` to it.

See [custom controls](/docs/CUSTOM_CONTROLS) and the
[custom-controls demo](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/77ce2f7de996cc397982199d1b3822dedb259b29/apps/demo/src/app/04-form-field-wrapper/custom-controls/README.md).

<a id="how-do-i-make-a-custom-combobox-or-closed-select-look-like-the-native-text-field"></a>

### How do I make a custom combobox or closed select look like the native text field?

Treat it as a field-shaped control. Keep the trigger without its own border,
padding, or focus ring, and let `ngx-form-field-wrapper` draw them.

- An inner `role="combobox"` with a stable `id` is inferred as `input-like`.
- A closed select whose host has `role="button"` needs
  `ngxSignalFormControl="input-like"` on the `[formField]` host. There is no
  `select` kind.
- Inner text uses `font: inherit`. Placeholder text uses
  `--ngx-form-field-placeholder-color`.
- To change the type scale, override the `--ngx-form-field-input-*` and
  `--ngx-form-field-outline-input-*` tokens on a parent. Do not hardcode `rem`
  on the widget.

Sliders, ratings, and datepickers are widget-shaped: use `appearance="plain"`,
usually with `ngxSignalFormControlAria="manual"`. See
[field-shaped vs widget-shaped](/docs/CUSTOM_CONTROLS#field-shaped-vs-widget-shaped-custom-controls).

<a id="we-dont-want-the-toolkits-wrapper-markup-at-all--how-do-i-build-my-own-with-the-headless-apis"></a>

### We don't want the toolkit's wrapper markup at all — how do I build my own with the headless APIs?

Use `@ngx-signal-forms/toolkit/headless`. It gives you state as signals and
renders nothing:

- `[ngxHeadlessErrorState]` gives `hasErrors()`, `shouldShowErrors()`,
  `resolvedErrors()`, `errorId()`, and `warningId()`.
- `[ngxHeadlessFieldset]` combines the state of a group of fields.
- `createErrorMessageSignal()`, `createErrorState()`,
  `createCharacterCount()`, and `createFieldStateFlags()` give the same state
  without a directive.

For ARIA, keep `NgxSignalFormAutoAria` on the control, or build it yourself
with `createAriaInvalidSignal`, `createAriaRequiredSignal`,
`createAriaDescribedBySignal`, and `createHintIdsSignal`. See the
[headless reference](/packages/toolkit/headless/README) and
[custom wrappers](/docs/CUSTOM_WRAPPERS).

<a id="how-do-i-theme-the-built-in-wrapper-with-our-brand-tokens"></a>

### How do I theme the built-in wrapper with our brand tokens?

Set CSS custom properties. Start with the semantic colors on
`ngx-form-field-wrapper`, such as `--ngx-form-field-color-primary`,
`--ngx-form-field-color-error`, and `--ngx-form-field-color-border`. Error and
warning text use the `--ngx-signal-form-*` tokens. See
[theming](/packages/toolkit/form-field/THEMING) and the
[brand-theming demo](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/77ce2f7de996cc397982199d1b3822dedb259b29/apps/demo/src/app/04-form-field-wrapper/brand-theming/README.md).

<a id="how-do-i-integrate-a-third-party-datepicker-valuechange-api-not-a-native-input"></a>

### How do I integrate a third-party datepicker (value/change API, not a native input)?

Write a small adapter component that implements `FormValueControl<Date | null>`.
Sync its `value` model with the widget's own value and change events, and
convert types (for example, `Date` and ISO string) inside the adapter. Add a
`focus()` method. Because the widget draws itself and writes its own ARIA, use
`appearance="plain"` and `ngxSignalFormControlAria="manual"`.

See [adapting a third-party widget](/docs/CUSTOM_CONTROLS#adapting-an-existing-third-party-widget).
The "Date of Birth" field in the
[custom-controls demo](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/77ce2f7de996cc397982199d1b3822dedb259b29/apps/demo/src/app/04-form-field-wrapper/custom-controls/README.md)
is a runnable example.

---

<a id="complex--dynamic-forms"></a>

## Complex & dynamic forms

<a id="how-do-i-build-a-dynamic-form-array-eg-invoice-line-items-you-can-addremove"></a>

### How do I build a dynamic form array (e.g. invoice line items you can add/remove)?

Keep the array in your model signal. To add or remove a row, call
`model.update(...)`. Loop over the rows with `@for`, and put each row in its own
`<ngx-form-fieldset [field]="form.lineItems[i]">`. Write per-row rules with
Angular's `applyEach(path.lineItems, (row) => ...)`. A root
`<ngx-form-field-error-summary [formTree]="form">` still lists every row's
errors.

See [arrays of field groups](/docs/COMPLEX_NESTED_FORMS#arrays-of-field-groups)
and the [complex-forms demo](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/77ce2f7de996cc397982199d1b3822dedb259b29/apps/demo/src/app/04-form-field-wrapper/complex-forms/README.md).

<a id="how-do-i-hidedisable-a-group-of-fields-based-on-another-field-so-hidden-fields-stop-blocking-validity"></a>

### How do I hide/disable a group of fields based on another field, so hidden fields stop blocking validity?

Use Angular's `hidden()` or `disabled()` rule on the field or on a whole
object path:

```ts
form(model, (path) => {
  hidden(path.shippingAddress, {
    when: ({ valueOf }) => valueOf(path.sameAsBilling),
  });
});
```

Angular leaves a hidden subtree out of the form's validity, so its errors do
not block `valid()` or `submit()`. The wrapper sets the `hidden` attribute on
itself for a hidden field. `focusFirstInvalid()` and auto-ARIA skip hidden and
disabled fields. See the
[field-state-patterns demo](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/77ce2f7de996cc397982199d1b3822dedb259b29/apps/demo/src/app/05-advanced/field-state-patterns/README.md).

<a id="for-a-multi-step-wizard-how-do-i-validate-only-the-current-step-before-next-with-one-form-model"></a>

### For a multi-step wizard, how do I validate only the current step before "Next", with one form model?

Keep one `form()` for all steps. Before you move to the next step, touch the
current step's part of the form and check that it is valid. The demo wizard
component takes a `canNavigate` guard (`(event) => boolean | Promise<boolean>`)
for this. Do not validate in `(stepChange)` with `event.preventDefault()`:
the wizard reads `preventDefault()` only synchronously, so a call after an
`await` comes too late.

```ts
// <ngx-wizard [canNavigate]="guardStep" …>
protected readonly guardStep: WizardCanNavigate = (event) => {
  if (event.toIndex <= event.fromIndex) {
    return true; // always allow going back
  }
  const step = this.formForStep(event.fromStep); // e.g. form.account
  step().markAsTouched(); // show this step's errors
  return step().valid();
};
```

On the last step, submit the whole form. `submit()` marks every field touched.
See the [single-model-wizard demo](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/77ce2f7de996cc397982199d1b3822dedb259b29/apps/demo/src/app/05-advanced/single-model-wizard/README.md).
The [advanced-wizard demo](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/77ce2f7de996cc397982199d1b3822dedb259b29/apps/demo/src/app/05-advanced/advanced-wizard/README.md)
uses one form per step with NgRx instead.

<a id="how-do-i-two-way-sync-my-form-model-with-an-ngrx-signalstore-without-update-loops"></a>

### How do I two-way sync my form model with an NgRx SignalStore without update loops?

Read with `linkedSignal({ source, computation })` from the store slice. Write
through `patchState` or store methods, not through the linked signal's `set`.
Do not mirror form and store with `effect()`, because that causes loops. For
cancelable editing, bind the form to a draft copy and commit it to the store on
save. See the [store-binding demo](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/77ce2f7de996cc397982199d1b3822dedb259b29/apps/demo/src/app/05-advanced/store-binding/README.md)
for live sync, and the
[advanced-wizard demo](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/77ce2f7de996cc397982199d1b3822dedb259b29/apps/demo/src/app/05-advanced/advanced-wizard/README.md)
for draft and commit.

---

## Validation

<a id="how-do-i-do-debounced-async-validation-eg-username-availability-and-show-the-pending-state"></a>

### How do I do debounced async validation (e.g. username availability) and show the pending state?

Use Angular's `validateHttp()` in the schema. Its `debounce` option delays the
request. It cancels a stale request when the value changes, so you do not need
RxJS:

```ts
form(model, (path) => {
  validateHttp(path.username, {
    request: ({ value }) =>
      `/api/username-available?u=${encodeURIComponent(value())}`,
    debounce: 300,
    onSuccess: (result: { available: boolean }) =>
      result.available ? null : { kind: 'taken', message: 'Username is taken' },
    onError: () => ({
      kind: 'check-failed',
      message: 'We could not check this username',
    }),
  });
});
```

The field's `pending()` signal is `true` while the check runs. Show a spinner
in the wrapper's `suffix` slot with `@if (form.username().pending())`. Angular
`submit()` does not wait for pending validators by default. If a pending check
must block the save, check `pending()` in the submit path too. See the
[async-validation demo](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/77ce2f7de996cc397982199d1b3822dedb259b29/apps/demo/src/app/05-advanced/async-validation/README.md).

<a id="after-submit-my-api-returns-field-errors-like--email-already-taken---how-do-i-map-them-onto-fields"></a>

### After submit my API returns field errors like `{ email: 'already taken' }` — how do I map them onto fields?

Return the errors from the submission action. Angular attaches each error to
the field in its `fieldTree` property:

```ts
submit(this.form, {
  action: async (form) => {
    try {
      await this.api.save(form().value());
      return; // success
    } catch (err) {
      const { fieldErrors } = err as ApiError; // { email: 'already taken', … }
      return Object.entries(fieldErrors).map(([field, message]) => ({
        kind: 'server',
        message,
        fieldTree: form[field as keyof Profile], // the field, not form.email()
      }));
    }
  },
});
```

An error without `fieldTree` attaches to the root. Read it with
`form().errors()` and show it as a banner. Angular clears a submission error
when the value of its field changes. A root error clears on any edit. See the
[server-integration demo](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/77ce2f7de996cc397982199d1b3822dedb259b29/apps/demo/src/app/05-advanced/server-integration/README.md).

<a id="how-do-i-reuse-a-zod-schema-as-the-validation-source-and-how-do-zod-issues-become-field-errors"></a>

### How do I reuse a Zod schema as the validation source, and how do Zod issues become field errors?

Angular supports Standard Schema libraries (Zod, Valibot, ArkType) directly.
Call `validateStandardSchema(path, schema)` at the root of your schema
function. Angular maps each issue's path to the matching field, and the
wrapper shows the issue's message.

Standard Schema cannot tell Angular which keys are required. To get
`aria-required` and the required marker, call the toolkit's
`requiredFromStandardSchema(path.field, schema)` for each required field. See
[validation choices](/docs/VALIDATION_STRATEGY) and the
[zod-validation demo](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/77ce2f7de996cc397982199d1b3822dedb259b29/apps/demo/src/app/05-advanced/zod-validation/README.md).

<a id="can-i-keep-my-existing-vest-suites-and-how-do-warnings-map-onto-the-toolkit"></a>

### Can I keep my existing Vest suites, and how do warnings map onto the toolkit?

Yes. Your `test()`, `enforce()`, and `warn()` bodies carry over. The `/vest`
adapter needs Vest 6. Call
`validateVest(path, suite, { includeWarnings: true })` in your `form()`
schema. Vest `warn()` results become toolkit warnings. Warnings still make the
form `invalid()`, so submit with the warning-aware path in
[warnings](/docs/WARNINGS_SUPPORT#form-submission-behavior). See
[migrating from ngx-vest-forms](/docs/MIGRATING_FROM_NGX_VEST_FORMS) and the
[`/vest` reference](/packages/toolkit/vest/README).

---

<a id="i18n-a11y--testing"></a>

## i18n, a11y & testing

<a id="how-do-i-translate-error-messages-and-field-labels-with-translocolocalize"></a>

### How do I translate error messages and field labels with Transloco/`$localize`?

Register messages with `provideErrorMessages()` and labels with
`provideFieldLabels()`. For a runtime language switch (Transloco,
ngx-translate), make each entry a function that reads a language signal. A
plain string entry is read once and does not change. `$localize` works only
at build time, one build per locale, so it cannot switch language at runtime.

See [message resolution](/docs/WARNINGS_SUPPORT#errors-and-message-resolution)
and the [i18n demo](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/77ce2f7de996cc397982199d1b3822dedb259b29/apps/demo/src/app/05-advanced/i18n/README.md), which
switches language at runtime.

<a id="how-do-i-render-an-accessible-error-summary-that-links-to-each-invalid-field-on-submit"></a>

### How do I render an accessible error summary that links to each invalid field on submit?

Use `<ngx-form-field-error-summary [formTree]="form" />` from
`@ngx-signal-forms/toolkit/assistive`. Add `ngxSignalForm` to the form. It
tracks submit, and it lets a submit announce the errors through the summary
only, not once per field. Each entry moves focus to its field.

```html
<form [formRoot]="form" ngxSignalForm errorStrategy="on-submit">
  <ngx-form-field-error-summary [formTree]="form" />
  <!-- fields -->
</form>
```

Use `provideFieldLabels()` to show readable field names. See
[error summaries](/docs/COMPLEX_NESTED_FORMS#error-summaries-across-the-whole-form).

<a id="how-do-i-unit-test-a-form-component-set-value-touch-assert-rendered-error--aria-invalid-in-vitesttestbed"></a>

### How do I unit-test a form component (set value, touch, assert rendered error + `aria-invalid`) in Vitest/TestBed?

Render the component and drive it with DOM events: type, then tab away. Do not
write the model signal directly, because that does not mark the field touched,
and `on-touch` timing hides the error. Wait for the attributes with `waitFor()`.

```ts
const user = userEvent.setup();
await render(LoginForm);
const email = screen.getByLabelText(/email/i);
await user.type(email, 'not-an-email');
await user.tab();
await waitFor(() => {
  expect(email.getAttribute('aria-invalid')).toBe('true');
});
```

See [testing form components](/docs/TESTING) for the full walkthrough.

---

## Migration

<a id="im-migrating-from-reactive-forms--what-replaces-setvaluepatchvalue-valuechanges-markallastouched-and-validatorfn-and-can-i-migrate-one-form-at-a-time"></a>

### I'm migrating from Reactive Forms — what replaces `setValue`/`patchValue`, `valueChanges`, `markAllAsTouched`, and `ValidatorFn`, and can I migrate one form at a time?

- **`setValue` / `patchValue`:** write the model signal with `model.set(next)`
  or `model.update((m) => ...)`.
- **`valueChanges`:** read the model in `computed(() => model())`, or run a
  side effect with `effect(() => this.autosave(model()))`.
- **`markAllAsTouched`:** `form().markAsTouched()` marks the field and every
  descendant. Angular's `submit()` also marks every field touched.
- **`ValidatorFn`:** schema rules. Use `validate()` or `validateAsync()` for
  your own rules, `validateStandardSchema()` for Zod, and `validateVest()` for
  Vest suites.
- **One form at a time:** `compatForm()` and `SignalFormControl` from
  `@angular/forms/signals/compat` let Signal Forms and Reactive Forms share a
  form, so you can migrate one field or one form at a time.

Angular's [migration guide](https://angular.dev/guide/forms/signals/migration)
covers the `compat` API. [Migrating from Reactive Forms](/docs/MIGRATING_FROM_REACTIVE_FORMS)
covers how the toolkit behaves on a field that `compat` connects, with a worked
example.
