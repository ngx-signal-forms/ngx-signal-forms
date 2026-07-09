# FAQ — building real forms with `@ngx-signal-forms/toolkit`

This is a **use-case FAQ**: how do I actually do _X_ when building a form with Angular Signal
Forms and this toolkit. Each answer is short and links the canonical doc plus a runnable demo. For
conceptual "what is this / why / how does it differ from Angular's built-ins" questions, see the
[root README FAQ](../README.md#faq) and [docs/ANGULAR_VS_TOOLKIT.md](./ANGULAR_VS_TOOLKIT.md).

Throughout: primitives like `form`, `submit`, `validate`, `hidden`, `disabled`, `debounce`,
`validateHttp`, `validateStandardSchema`, `applyEach`, and the control contracts are **Angular
core** (`@angular/forms/signals`); everything else is the **toolkit**
(`@ngx-signal-forms/toolkit` and its `/form-field`, `/assistive`, `/headless`, `/vest`, `/testing`
entry points).

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

### How do I show validation errors only after the user leaves a field (on blur) instead of while they type?

You already have it — the toolkit's built-in default is `'on-touch'`, so a plain
`ngx-form-field-wrapper` shows a field's errors only after that field is blurred. No configuration
needed. If a field shows errors _while typing_, something upstream set `'immediate'`. The three
values are `'immediate'` (while typing), `'on-touch'` (after blur), `'on-submit'` (after a submit
attempt), resolved most-specific-first: field input → form directive → component provider → app
provider → built-in default. To be explicit or override, set `strategy` on the wrapper or
`errorStrategy` on the form directive:

```html
<form [formRoot]="userForm" ngxSignalForm errorStrategy="on-touch">
  <ngx-form-field-wrapper [formField]="userForm.email" strategy="on-submit"
    >…</ngx-form-field-wrapper
  >
</form>
```

Warnings have an independent `warningStrategy` (default `'immediate'`) that this doesn't affect.

**See:** [docs/BEST_PRACTICES.md](./BEST_PRACTICES.md) ·
[packages/toolkit/form-field/README.md](../packages/toolkit/form-field/README.md) ·
[demo: error-display-modes](../apps/demo/src/app/02-toolkit-core/error-display-modes/README.md) ·
[demo: your-first-form](../apps/demo/src/app/01-getting-started/your-first-form/README.md)

### How do I wire up a `<select>`, a radio group, and a checkbox group with `[formField]`?

A native `<select>` needs zero extra wiring — bind `[formField]="form.x"` and wrap it in
`<ngx-form-field-wrapper>` exactly like a text `<input>`; `<input>`, `<textarea>`, and `<select>`
are the default native families that get auto-ARIA (`aria-invalid`/`aria-required`/
`aria-describedby`) identically. For a **radio or checkbox group**, bind every input to the _same_
`[formField]="form.field"` (distinct `value`s, `name` for radios) inside one wrapper, and use a
neutral `<span ngxFormFieldLabel>` instead of `<label>` since the wrapper labels the group
container. The wrapper auto-detects the cluster and applies group-level ARIA and error styling —
the UX contract matches a text field even though the plumbing is group-level, not per-input. A
_single_ boolean checkbox (not a group) needs `ngxSignalFormControl="checkbox"` (or `"switch"`) so
the wrapper treats it as that family.

**See:** [packages/toolkit/form-field/README.md](../packages/toolkit/form-field/README.md) ·
[docs/CUSTOM_CONTROLS.md](./CUSTOM_CONTROLS.md) ·
[demo: complex-forms](../apps/demo/src/app/04-form-field-wrapper/complex-forms/README.md) ·
[demo: custom-controls](../apps/demo/src/app/04-form-field-wrapper/custom-controls/README.md)

---

## Errors, submit & UX

### How do I reset my form after a successful submit, and prefill it from an HTTP call?

The model `signal` you pass into `form(model, schema)` is the single source of truth, so both
operations are just writes to (or resets of) that state.

- **Prefill from HTTP:** load the record, then `model.set(record)`. Because the model is the
  source of truth, prefer building the whole object once and setting it, rather than patching
  field-by-field.
- **Reset after submit:** Angular's `FieldState.reset(value?)` clears `touched`/`dirty` on the
  field and its descendants; pass a value to also set the model back to a known state. Call it on
  the root: `this.form().reset(initialValues)`.

```ts
readonly #model = signal<Profile>(EMPTY_PROFILE);
protected readonly form = form(this.#model, profileSchema);

async load(id: string) {
  this.#model.set(await firstValueFrom(this.http.get<Profile>(`/api/profile/${id}`))); // prefill
}

async onSubmit() {
  const ok = await submit(this.form, { action: async (f) => { /* … */ } });
  if (ok) this.form().reset(this.#model()); // clear touched/dirty, keep saved values
}
```

`reset()` only clears interaction state and (optionally) value — it does not re-run your HTTP load;
re-fetch and `model.set(...)` if you want server-canonical values back. You can also drive the
model from `resource()`/`httpResource()` instead of an imperative `set` — the server-integration
demo shows the full fetch→prefill→edit→submit→reset flow with `resource()`.

**See:** [packages/toolkit/README.md](../packages/toolkit/README.md) ·
[demo: server-integration](../apps/demo/src/app/05-advanced/server-integration/README.md) ·
[demo: field-state-patterns](../apps/demo/src/app/05-advanced/field-state-patterns/README.md) ·
[demo: store-binding](../apps/demo/src/app/05-advanced/store-binding/README.md)

### How do I disable the submit button while the form is invalid or a submit is in flight?

For a plain form, Angular Signal Forms gives you the two signals directly — no toolkit helper
needed. `submitting()` is native Angular state that is `true` for the duration of a running
`submit()` action:

```html
<button
  type="submit"
  [disabled]="userForm().invalid() || userForm().submitting()"
>
  Save
</button>
```

If your form uses **non-blocking warnings**, don't hand-roll the gating — use the toolkit's
`canSubmitWithWarnings(form)`, which returns a `Signal<boolean>` that is `false` while
`submitting()` or `pending()` is true _and_ while any **blocking** error remains, but lets
warning-only forms through:

```html
<button type="submit" [disabled]="!canSubmit()">Save</button>
```

```ts
protected readonly canSubmit = canSubmitWithWarnings(this.userForm);
```

Pair it with `submitWithWarnings(form, action)` in the click handler — it marks all fields touched,
waits for validation to settle, guards against double-submits, and runs `action` only when no
blocking errors remain.

**See:** [docs/BEST_PRACTICES.md](./BEST_PRACTICES.md) ·
[docs/WARNINGS_SUPPORT.md](./WARNINGS_SUPPORT.md) ·
[docs/ANGULAR_VS_TOOLKIT.md](./ANGULAR_VS_TOOLKIT.md) ·
[demo: submission-patterns](../apps/demo/src/app/05-advanced/submission-patterns/README.md)

### What does `createOnInvalidHandler()` do on a failed submit, and can I customize it?

It builds the `onInvalid` callback for `form(model, schema, { submission: { action, onInvalid } })`.
On a failed submit it focuses the **first invalid, interactive field** (internally
`focusFirstInvalid(form)`), deliberately skipping errors on hidden/disabled fields and orphan
errors with no field. It _is_ customizable via an options object: `focusFirstInvalid` (default
`true`; set `false` to suppress auto-focus) and `afterInvalid: (field) => void` (runs after focus —
e.g. announce a message or scroll):

```ts
onInvalid: createOnInvalidHandler({
  afterInvalid: () => this.announce('Please fix the errors'),
});
```

For fully custom behavior, skip the helper and write your own `onInvalid`, optionally calling
`focusFirstInvalid(form)` yourself.

**See:** [packages/toolkit/README.md](../packages/toolkit/README.md) ·
[demo: submission-patterns](../apps/demo/src/app/05-advanced/submission-patterns/README.md)

### Can I set the error-display strategy once app-wide and override it per form or per field?

Yes. Set the default with `provideNgxSignalFormsConfig({ defaultErrorStrategy: 'on-touch' })` in
your app config. Every presentation setting resolves through one precedence chain (most specific
wins): field/component input → form directive (`ngxSignalForm`) → component-scoped provider
(`provideNgxSignalFormsConfigForComponent`) → app provider → built-in default. So: override a whole
form with `errorStrategy` on `<form [formRoot] ngxSignalForm>`, a single field with `strategy` on
`<ngx-form-field-wrapper>`, or a feature subtree with the `…ForComponent` provider. All accept the
same `ErrorDisplayStrategy` values (`'immediate' | 'on-touch' | 'on-submit' | 'inherit'`);
`'inherit'` (or omitting the input) falls through to the next tier.

**See:** [packages/toolkit/README.md](../packages/toolkit/README.md) ·
[demo: global-configuration](../apps/demo/src/app/05-advanced/global-configuration/README.md) ·
[demo: error-display-modes](../apps/demo/src/app/02-toolkit-core/error-display-modes/README.md)

---

## Custom controls & design systems

### How do I make my own design-system inputs work inside the wrapper (aria-invalid, aria-describedby, error timing)?

Implement Angular Signal Forms' native control contracts on your components, then project them
inside `ngx-form-field-wrapper` like any input. A value-bearing control (text field, dropdown)
implements `FormValueControl<T>` — expose `value = model<T>()`, optionally `touch = output()`, a
`focus()` method, and `disabled`/`invalid` signal inputs (no ControlValueAccessor). A toggle
implements `FormCheckboxControl` (`checked = model(false)`), or just wrap a native
`input[type=checkbox][role=switch]`. Bind with `[formField]="form.x"`; `NgxSignalFormAutoAria` then
writes `aria-invalid`/`aria-required`/`aria-describedby` on the bound host. If your widget already
manages its own ARIA (common when the focusable element is buried in its template), opt the host
out with `ngxSignalFormControlAria="manual"` and use `appearance="plain"` so the wrapper still
supplies label/hint/error content without fighting the widget. Give the control a stable `id` (or
set `fieldName` on the wrapper) so error/warning IDs resolve, and import
`NgxSignalFormToolkit`/`NgxSignalFormAutoAria` in the component that renders the `[formField]` host
(standalone imports are template-scoped).

**See:** [docs/CUSTOM_CONTROLS.md](./CUSTOM_CONTROLS.md) ·
[packages/toolkit/form-field/README.md](../packages/toolkit/form-field/README.md) ·
[demo: custom-controls](../apps/demo/src/app/04-form-field-wrapper/custom-controls/README.md)

### We don't want the toolkit's wrapper markup at all — how do I build my own with the headless APIs?

The `/headless` entry point is exactly this. Import from
`@ngx-signal-forms/toolkit/headless`: apply `[ngxHeadlessErrorState]` to your wrapper element for
`hasErrors()`, `shouldShowErrors()`, `resolvedErrors()`, and stable `errorId`/`warningId` signals —
or call `createErrorMessageSignal(() => form.field, { fieldName })` directly with no directive at
all. `[ngxHeadlessFieldset]` aggregates errors/touched/dirty/pending across descendant fields;
`createErrorState`, `createCharacterCount`, and `createFieldStateFlags` are plain factories for the
same state. You render 100% of the markup and wire ARIA yourself from those signals — nothing is
rendered for you, and everything composes via `hostDirectives`. For ARIA you can either use
`NgxSignalFormAutoAria` or compose it yourself from the pure factories `createAriaInvalidSignal`,
`createAriaRequiredSignal`, `createAriaDescribedBySignal`, and `createHintIdsSignal`.

**See:** [packages/toolkit/headless/README.md](../packages/toolkit/headless/README.md) ·
[docs/CUSTOM_WRAPPERS.md](./CUSTOM_WRAPPERS.md) ·
[demo: error-message-signal](../apps/demo/src/app/03-headless/error-message-signal/README.md) ·
[demo: fieldset-utilities](../apps/demo/src/app/03-headless/fieldset-utilities/README.md)

### How do I theme the built-in wrapper with our brand tokens?

Entirely through CSS custom properties — no forking, and you never touch the `:has()`-based
`appearance="outline"` selectors directly. Start with the semantic scale on `ngx-form-field-wrapper`
(`--ngx-form-field-color-primary`, `-color-error`, `-color-warning`, `-color-border`, …); overriding
these cascades into focus rings, borders, and backgrounds. Two prefixes exist:
`--ngx-form-field-*` for wrapper chrome and `--ngx-signal-form-*` for cross-cutting feedback text
(error/warning color/background shared by every helper surface). THEMING.md has ready-made "match my
brand", Bootstrap/Tailwind mapping, and dark-mode recipes. This is a deep topic; treat the guide as
canonical rather than re-deriving tokens.

**See:** [packages/toolkit/form-field/THEMING.md](../packages/toolkit/form-field/THEMING.md) ·
[docs/MIGRATING_CSS_VARS.md](./MIGRATING_CSS_VARS.md) ·
[docs/CSS_FRAMEWORK_INTEGRATION.md](./CSS_FRAMEWORK_INTEGRATION.md)

### How do I integrate a third-party datepicker (value/change API, not a native input)?

Write a thin adapter that implements `FormValueControl<Date | null>` on your datepicker host:
expose `value = model<Date | null>(null)` and sync it to/from the third-party widget's own
value/change events, add a `focus()` method (needed for `focusFirstInvalid()` and error-summary
navigation), and optional `touch`/`disabled`/`invalid`. Bind it with the standard
`[formField]="form.birthDate"`. Because the widget owns its own visuals and ARIA, pair it with
`ngxSignalFormControlAria="manual"` and `appearance="plain"` so the toolkit supplies label/hint/
error content and field-identity IDs without clashing. Handle any type mismatch (e.g. `Date` vs
ISO string) inside the adapter's read/write path. There is no runnable datepicker demo yet — the
adapter pattern generalizes from the `FormValueControl` examples in custom-controls; the Material
app's README also notes date-picker ARIA gotchas.

**See:** [docs/CUSTOM_CONTROLS.md](./CUSTOM_CONTROLS.md) ·
[demo: custom-controls](../apps/demo/src/app/04-form-field-wrapper/custom-controls/README.md) ·
[demo-material README](../apps/demo-material/README.md)

---

## Complex & dynamic forms

### How do I build a dynamic form array (e.g. invoice line items you can add/remove)?

Keep the array in your model signal — add/remove is just a `signal.update(rows => [...])`
mutation; there's no special array API. Loop with `@for`, wrap each row in its own
`<ngx-form-fieldset [field]="form.lineItems[i]">` so errors aggregate per row, and put
`<ngx-form-field-wrapper [formField]="form.lineItems[i].description">` inside it. Per-row validation
is Angular Signal Forms' job: use `applyEach(path.lineItems, (row) => validate(row.qty, …))` (or
`validateStandardSchema`) in the schema; the toolkit layers display/ARIA on top and inherits the
error strategy so you don't re-wire it per row.

```html
@for (item of form.lineItems; track $index; let i = $index) {
<ngx-form-fieldset [field]="form.lineItems[i]">
  <ngx-form-field-wrapper [formField]="form.lineItems[i].description">
    <input
      [id]="'line-' + i + '-desc'"
      [formField]="form.lineItems[i].description"
    />
  </ngx-form-field-wrapper>
</ngx-form-fieldset>
}
```

A root `<ngx-form-field-error-summary [formTree]="form">` still collects every row's errors and
deep-links to the field. Index-based IDs/labels recompute consistently on insert/remove; the docs
don't yet call out a keyed (stable-row-id) alternative if you delete from the middle a lot.

**See:** [docs/COMPLEX_NESTED_FORMS.md](./COMPLEX_NESTED_FORMS.md) ·
[demo: complex-forms](../apps/demo/src/app/04-form-field-wrapper/complex-forms/README.md)

### How do I hide/disable a group of fields based on another field, so hidden fields stop blocking validity?

Use Angular Signal Forms' native `hidden(path, { when })` and `disabled(path, { when })` schema
rules from `@angular/forms/signals`, applied at whatever level you want — a single field or a whole
nested object path:

```ts
form(model, (path) => {
  hidden(path.shippingAddress, {
    when: ({ valueOf }) => valueOf(path.sameAsBilling),
  });
});
```

A `hidden()` subtree is excluded from the parent's validity computation, so its empty/invalid
required fields no longer block `form().valid()` or `submit()` — this is core Signal Forms behavior,
not something the toolkit re-implements. On the UI side `NgxFormFieldWrapper` mirrors `hidden()` to
the host's `[hidden]` attribute, and `focusFirstInvalid()`/auto-ARIA automatically skip
hidden/disabled fields. The field-state-patterns demo shows the shared `{ when }` syntax on leaf
fields; applying it to a whole nested group isn't demoed yet but works identically.

**See:** [demo: field-state-patterns](../apps/demo/src/app/05-advanced/field-state-patterns/README.md) ·
[docs/BEST_PRACTICES.md](./BEST_PRACTICES.md) ·
[docs/VALIDATION_STRATEGY.md](./VALIDATION_STRATEGY.md)

### For a multi-step wizard, how do I validate only the current step before "Next", with one form model?

Keep one `form()` model spanning all steps, bind each step's template to its slice, and gate
navigation on that slice's validity. The reusable wizard component fires a `(stepChange)` event
_before_ the step changes; validate the step being left and call `event.preventDefault()` to cancel:

```ts
async onStepChange(event: WizardNavigationEvent) {
  if (event.toIndex > event.fromIndex) {
    this.form.step1().markAsTouched();            // surface this step's errors
    if (this.form.step1().invalid()) event.preventDefault();
  }
}
```

Run whole-form validation at the end by touching everything (`submit()` marks all fields touched
internally) before the final action. Honest gap: the maintained `advanced-wizard` demo uses a
_form-per-step_ + NgRx architecture rather than one shared model, so treat it as a reference for
step orchestration, not for the single-model pattern above.

**See:** [demo: wizard component](../apps/demo/src/app/shared/wizard/README.md) ·
[demo: advanced-wizard](../apps/demo/src/app/05-advanced/advanced-wizard/README.md)

### How do I two-way sync my form model with an NgRx SignalStore without update loops?

Use `linkedSignal({ source, computation })` as the **read** seam (projects the store slice into a
writable handle that re-evaluates when the store changes) and route all **writes** through
`patchState`/store methods — not the linked signal's own `.set`. Do **not** mirror form and store
with `effect()`; that's the loop-causing anti-pattern the read/write seam replaces. For large forms
that need cancelable editing, use the draft/commit variant instead: bind the form to a draft copy
and `commit()` draft→committed on save. The store-binding demo is the runnable live-sync reference
(keystroke sync + a "simulate remote sync" round-trip); advanced-wizard shows draft/commit.

**See:** [demo: store-binding](../apps/demo/src/app/05-advanced/store-binding/README.md) ·
[demo: advanced-wizard](../apps/demo/src/app/05-advanced/advanced-wizard/README.md) ·
[docs/COMPLEX_NESTED_FORMS.md](./COMPLEX_NESTED_FORMS.md)

---

## Validation

### How do I do debounced async validation (e.g. username availability) and show the pending state?

Use Angular Signal Forms' async primitives inside the schema, not manual RxJS. `debounce(path.field,
ms)` throttles re-validation, and `validateHttp(path, { request, onSuccess, onError })` fires the
request and auto-cancels stale in-flight calls when the value changes — no `switchMap` needed:

```ts
form(model, (path) => {
  debounce(path.username, 300);
  validateHttp(path.username, {
    request: ({ value }) => `/api/username-available?u=${value()}`,
    onError: () => ({ kind: 'taken', message: 'Username is taken' }),
  });
});
```

The field exposes a `pending()` signal; project a loading indicator into the wrapper's `<span
suffix>` slot with `@if (form.username().pending())`, and disable submit while `pending()` is true.
The async-validation demo is the canonical runnable reference.

**See:** [demo: async-validation](../apps/demo/src/app/05-advanced/async-validation/README.md) ·
[docs/VALIDATION_STRATEGY.md](./VALIDATION_STRATEGY.md)

### After submit my API returns field errors like `{ email: 'already taken' }` — how do I map them onto fields?

The real mechanism Angular supports is the submission **action's return value**: an action returns
`Promise<TreeValidationResult>`, which is either "success" (`null`/`undefined`) or one-or-many
validation errors, and each error may carry a `fieldTree` pointing at the field it belongs to. So a
caught server response becomes per-field errors by returning them from the action:

```ts
submit(this.form, {
  action: async (form) => {
    try {
      await this.api.save(form().value());
      return; // success
    } catch (err) {
      const { fieldErrors } = err as ApiError; // { email: 'already taken', … }
      // `fieldTree` targets the field itself (form.email), not its state (form.email()).
      return Object.entries(fieldErrors).map(([field, message]) => ({
        kind: 'server',
        message,
        fieldTree: form[field as keyof Profile],
      }));
    }
  },
});
```

An error returned with **no** `fieldTree` attaches to the root — render it as a form-level banner
by reading `form().errors()`. Submission errors **auto-clear when the owning field's value
changes**: the email error clears as the user edits email, and a root-attached banner clears on
_any_ edit (the root's value is the whole model). If you need different clearing behavior, the
alternative is holding server errors in a signal read by a normal `validate(path.email, () =>
serverErrors()['email'] ? { kind: 'server', message: … } : null)`, which re-runs on every edit.
The server-integration demo exercises the full mapping end-to-end.

**See:** [demo: server-integration](../apps/demo/src/app/05-advanced/server-integration/README.md) ·
[demo: submission-patterns](../apps/demo/src/app/05-advanced/submission-patterns/README.md) ·
[demo: async-validation](../apps/demo/src/app/05-advanced/async-validation/README.md)

### How do I reuse a Zod schema as the validation source, and how do Zod issues become field errors?

You don't need a toolkit adapter — Angular Signal Forms has native Standard Schema support (Zod,
Valibot, ArkType). Call `validateStandardSchema(path, yourZodSchema)` once at the **root** path
inside your `form(model, (path) => {…})` callback; Zod validates the whole tree, its `issues[].path`
map to the matching nested fields, and each issue's `.message` becomes that field's error (rendered
by `ngx-form-field-wrapper`/`ngx-form-field-error`). It composes with Angular's own validators and
with `validateVest(...)` on the same path. One gotcha: Standard Schema can't expose which keys are
required, so `aria-required`/the required marker won't fire for Zod-required fields unless you also
call the toolkit's `requiredFromStandardSchema(path.field, zodSchema)` per field.

**See:** [docs/VALIDATION_STRATEGY.md](./VALIDATION_STRATEGY.md) ·
[demo: zod-validation](../apps/demo/src/app/05-advanced/zod-validation/README.md) ·
[demo: zod-vest-validation](../apps/demo/src/app/05-advanced/zod-vest-validation/README.md)

### Can I keep my existing Vest suites, and how do warnings map onto the toolkit?

Yes — your `test()`/`enforce()`/`warn()` bodies carry over almost unchanged; the required step is
upgrading Vest 5.x → 6.x first (the `/vest` adapter needs Vest 6, which implements Standard Schema).
Drop the `ngxVestForm`/`ngModel`/`validationConfig` shell and instead call `validateVest(path, suite,
{ includeWarnings: true })` inside your `form(...)` schema (or `validateStandardSchema(path, suite)`
if you only need blocking validation). Angular Signal Forms has no native non-blocking concept, so
the toolkit maps Vest `warn()` results to errors with a `warn:vest:` kind prefix, rendered with
`role="status"` and an independent `warningStrategy`. Because Signal Forms still counts warnings
toward `invalid()`, submit warning-only forms via `canSubmitWithWarnings`/`submitWithWarnings` (or
`hasOnlyWarnings(form().errorSummary())` with `submission: { ignoreValidators: 'all' }`).

**See:** [docs/MIGRATING_FROM_NGX_VEST_FORMS.md](./MIGRATING_FROM_NGX_VEST_FORMS.md) ·
[docs/WARNINGS_SUPPORT.md](./WARNINGS_SUPPORT.md) ·
[packages/toolkit/vest/README.md](../packages/toolkit/vest/README.md) ·
[demo: vest-validation](../apps/demo/src/app/05-advanced/vest-validation/README.md)

---

## i18n, a11y & testing

### How do I translate error messages and field labels with Transloco/`$localize`?

Both go through provider factories that you can wire to your translation service.
`provideErrorMessages(factory)` registers a message registry (keys are camelCase error kinds, values
are a string or `(params) => string`); `provideFieldLabels(factory)` does the same for field
labels/paths. Use the factory form so you can `inject()` your translation service:

```ts
provideFieldLabels(() => {
  const t = inject(TranslateService);
  return (path) => t.instant(`fields.${path}`) || humanizeFieldPath(path);
});
```

Validators keep emitting plain `{ kind, message }`; the toolkit resolves display text via a 3-tier
cascade (validator `message` → registry → built-in fallback), exposed declaratively
(`ngx-form-field-error`, wrapper) and programmatically (`createErrorMessageSignal`,
`resolveValidationErrorMessage`). Honest gaps: the worked i18n example in the docs is written for
`provideFieldLabels` (apply the same shape to `provideErrorMessages`), there is no i18n demo, and
whether an already-rendered message re-renders on a runtime language switch is not documented as a
guarantee.

**See:** [docs/WARNINGS_SUPPORT.md](./WARNINGS_SUPPORT.md) ·
[packages/toolkit/README.md](../packages/toolkit/README.md) ·
[packages/toolkit/headless/README.md](../packages/toolkit/headless/README.md)

### How do I render an accessible error summary that links to each invalid field on submit?

There's a built-in primitive — don't build it from raw signals. Use `<ngx-form-field-error-summary
[formTree]="form" summaryLabel="…" />` from `@ngx-signal-forms/toolkit/assistive` (or the headless
`ngxHeadlessErrorSummary` if you want to own the markup). It aggregates every invalid field, renders
as an assertive `role="alert"` live region when strategy-visible, and its entries move focus to the
matching control on click. Pair it with `submission: { onInvalid: createOnInvalidHandler() }` and the
`[formRoot] ngxSignalForm` directive, which handle `preventDefault`, submitting state, and focusing
the first invalid field. Use `provideFieldLabels()` to turn raw paths into human/translated names in
the summary.

**See:** [packages/toolkit/assistive/README.md](../packages/toolkit/assistive/README.md) ·
[demo: submission-patterns](../apps/demo/src/app/05-advanced/submission-patterns/README.md) ·
[demo: fieldset-utilities](../apps/demo/src/app/03-headless/fieldset-utilities/README.md)

### How do I unit-test a form component (set value, touch, assert rendered error + `aria-invalid`) in Vitest/TestBed?

Render the component with TestBed, drive state through the model signal and the field's own methods,
then assert on the toolkit's documented, stable id/attribute contract: error containers use
`{fieldName}-error`, and the bound input carries `aria-invalid="true"` and an `aria-describedby`
that chains to that id. Blocking errors render inside a `role="alert"` element.

```ts
const fixture = TestBed.createComponent(LoginForm);
const cmp = fixture.componentInstance;

cmp.model.update((m) => ({ ...m, email: 'not-an-email' })); // set value
cmp.form.email().markAsTouched(); // trigger 'on-touch' visibility
fixture.detectChanges();
await fixture.whenStable();

const input = fixture.nativeElement.querySelector('#email');
expect(input.getAttribute('aria-invalid')).toBe('true');
expect(fixture.nativeElement.querySelector('#email-error')).toHaveTextContent(
  /valid email/i,
);
```

To assert a submit-time path, call Angular's `submit(cmp.form, { action })` (it marks every field
touched). For accessibility, the toolkit ships `expectNoA11yViolations()` from
`@ngx-signal-forms/toolkit/testing` (axe-core WCAG 2.2 AA) for use in a Vitest browser-mode spec
after rendering a fixture. Honest gap: no dedicated component-testing guide or example spec exists
yet — the mechanics above are assembled from the id/ARIA contract plus Angular's own testing
conventions.

**See:** [packages/toolkit/README.md](../packages/toolkit/README.md) ·
[packages/toolkit/headless/README.md](../packages/toolkit/headless/README.md) ·
[docs/decisions/0004-wcag22-testing-strategy.md](./decisions/0004-wcag22-testing-strategy.md)

---

## Migration

### I'm migrating from Reactive Forms — what replaces `setValue`/`patchValue`, `valueChanges`, `markAllAsTouched`, and `ValidatorFn`, and can I migrate one form at a time?

Mappings (Signal Forms + this toolkit):

- **`setValue`/`patchValue`** → write the model signal: `model.set(next)` / `model.update(m => …)`.
  The model is the source of truth.
- **`valueChanges`** → read the model reactively: `computed(() => model())`, or run a side effect
  with `effect(() => this.autosave(model()))`.
- **`markAllAsTouched`** → `form().markAsTouched()` cascades to every descendant; Angular's
  `submit()` also marks everything touched internally.
- **custom `ValidatorFn`** → schema functions: `validate()`/`validateAsync()` for sync/async field
  rules, `validateStandardSchema()` for Zod/contract schemas, `validateVest()` for business policy.
- **coexistence** → `compatForm()` (from `@angular/forms/signals/compat`) lets a Signal Form model
  embed existing Reactive `FormControl` instances as leaf values, so you can absorb Reactive
  controls incrementally rather than rewrite a whole form at once.

Honest gap: there is **no dedicated Reactive Forms migration guide or demo** yet (the existing
migration docs cover ngx-vest-forms and the toolkit beta→v1), and `compatForm()` has no worked
example in this repo — the mappings above are the pattern, verified against the Angular 22 types.

**See:** [../README.md](../README.md) ·
[docs/ANGULAR_VS_TOOLKIT.md](./ANGULAR_VS_TOOLKIT.md) ·
[docs/VALIDATION_STRATEGY.md](./VALIDATION_STRATEGY.md) ·
[docs/ANGULAR_PUBLIC_API_POLICY.md](./ANGULAR_PUBLIC_API_POLICY.md)
