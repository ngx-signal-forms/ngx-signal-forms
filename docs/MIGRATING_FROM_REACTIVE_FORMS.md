# Migrating from Reactive Forms: the toolkit layer

Angular ships its own framework-level migration guide for teams moving off
`ReactiveFormsModule`:
**[angular.dev: Migrating from reactive forms](https://angular.dev/guide/forms/signals/migration)**.
That guide is the canonical source for `compatForm`, `SignalFormControl`,
`NG_STATUS_CLASSES`, `extractValue`, and `CompatValidationError` — the
`@angular/forms/signals/compat` API — and Angular will keep it current as the
API evolves.

**This document does not repeat that guide.** It covers only what Angular's
guide cannot: how `@ngx-signal-forms/toolkit` — `ngx-form-field-wrapper`,
`ngxSignalForm`, `provideErrorMessages`, the error-display strategy cascade,
and auto-ARIA — behaves when the field on the other end of `[formField]` is a
Reactive control bridged through compat, not a native Signal Forms leaf.

Every claim below was checked against the installed `@angular/forms@22.1.0`
compat build (both its `.d.ts` and its compiled `.mjs`), not inferred from
types, and most are also asserted by a real, running spec:
[`packages/toolkit/form-field/form-field-wrapper.compat.integration.spec.ts`](../packages/toolkit/form-field/form-field-wrapper.compat.integration.spec.ts).

For the condensed, one-paragraph answer, see
[FAQ §Migration](./FAQ.md#im-migrating-from-reactive-forms--what-replaces-setvaluepatchvalue-valuechanges-markallastouched-and-validatorfn-and-can-i-migrate-one-form-at-a-time) —
this document is that answer's expansion.

## The two migration directions

`@angular/forms/signals/compat` gives you two independent bridges. Pick the
one that matches which system currently owns the form.

| Direction     | Entry point                  | Use when                                                                                                                                                                           |
| ------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Top-down**  | `compatForm(model, schema?)` | A Signal Forms model needs to keep an existing Reactive `FormControl`/`FormGroup` alive at one or more leaves, usually because a third-party component still binds to it directly. |
| **Bottom-up** | `SignalFormControl<T>`       | A Reactive `FormGroup` needs one field's validation and state written with Signal Forms rules, while the rest of the group stays Reactive.                                         |

Both directions produce a `FieldTree<T>` — the same type `form(...)` returns —
so every toolkit surface that accepts `[formField]` accepts a compat field
with **no cast and no special-casing**. This is confirmed structurally:
`compatForm<TModel>(...): FieldTree<TModel>` and
`SignalFormControl<T>.fieldTree: FieldTree<T>` both come from the same
`@angular/forms/signals` `FieldTree` type as `form(...)`.

## Top-down: `compatForm` + `ngx-form-field-wrapper`

```ts
import { Component, signal } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { FormField, required } from '@angular/forms/signals';
import { compatForm } from '@angular/forms/signals/compat';
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';
import { NgxFormFieldWrapper } from '@ngx-signal-forms/toolkit/form-field';

@Component({
  selector: 'ngx-name-form',
  imports: [FormField, NgxSignalFormToolkit, NgxFormFieldWrapper],
  template: `
    <form [formRoot]="nameForm" ngxSignalForm>
      <ngx-form-field-wrapper [formField]="nameForm.last" fieldName="last-name">
        <label for="last-name">Last name</label>
        <input id="last-name" type="text" [formField]="nameForm.last" />
      </ngx-form-field-wrapper>
    </form>
  `,
})
export class NameFormComponent {
  // An existing Reactive control — untouched by the migration.
  readonly lastNameControl = new FormControl('', Validators.required);

  readonly nameModel = signal({
    first: '',
    last: this.lastNameControl,
  });

  readonly nameForm = compatForm(this.nameModel, (name) => {
    required(name.first, { message: 'First name is required' });
  });
}
```

Verified:

- `nameForm.last().value()` yields the control's raw string value, never the
  `FormControl` instance — `compatForm` unwraps it on every read.
- `ngx-form-field-wrapper` and `aria-describedby` composition behave exactly
  the same for `nameForm.last` as for a native `form()` leaf: no error is
  shown until the field is touched (`'on-touch'` is still the default
  strategy), and once touched, the wrapper renders the error and links it via
  `aria-describedby` the same way it would for any other field.

### Divergence: validation stays on the Reactive control, not the schema

This is the one behavioral difference worth calling out explicitly, because
it is easy to assume otherwise: **a `compatForm` schema function does not run
declarative Signal Forms validators against a leaf whose value is an
`AbstractControl`.** Only the control's own Reactive validators
(`Validators.required`, a custom `ValidatorFn`) determine whether that leaf is
valid.

Concretely, given the model above, `required(name.last, ...)` registered in
the schema function has **no effect** on `nameForm.last`'s validity — even
though `required(name.first, ...)` on the plain string sibling works exactly
as it would in any native Signal Forms schema. This matches Angular's own
`compatForm` usage example, which validates the plain field (`name.first`)
and leaves the control-backed one (`name.last`) to its own validators — that
asymmetry in the official example is the same finding, not a coincidence.

When a compat leaf's `AbstractControl` does have Reactive validators and they
fail, the resulting error is a `CompatValidationError`. It still carries a
`kind` string (e.g. `'required'`), so it still resolves through the toolkit's
error-message registry (see below) — the wrapper cannot tell the difference
between a `CompatValidationError` and any other custom-kind error, and
neither should you when writing message overrides.

**Migration takeaway:** while a form field is still backed by a Reactive
`AbstractControl`, keep its validators on that control (`Validators.*`, your
existing `ValidatorFn`s). Move a field's validation into the Signal Forms
schema only once you replace its `FormControl` with a plain value in the
model — at that point `required()`/`validate()`/`validateStandardSchema()`
start applying to it like any other leaf.

## Bottom-up: `SignalFormControl` inside an existing `FormGroup`

```ts
import { Component } from '@angular/core';
import { FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { FormField, required } from '@angular/forms/signals';
import { SignalFormControl } from '@angular/forms/signals/compat';
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';
import { NgxFormFieldWrapper } from '@ngx-signal-forms/toolkit/form-field';

@Component({
  selector: 'ngx-profile-form',
  imports: [
    FormField,
    ReactiveFormsModule,
    NgxSignalFormToolkit,
    NgxFormFieldWrapper,
  ],
  template: `
    <form [formGroup]="group">
      <ngx-form-field-wrapper
        [formField]="nameControl.fieldTree"
        fieldName="name"
      >
        <label for="name">Name</label>
        <input id="name" type="text" [formField]="nameControl.fieldTree" />
      </ngx-form-field-wrapper>

      <!-- Untouched Reactive field, migrating later. -->
      <input id="age" type="number" formControlName="age" />
    </form>
  `,
})
export class ProfileFormComponent {
  // A Signal-Forms-backed control, migrated first, living inside a Reactive group.
  readonly nameControl = new SignalFormControl('', (p) => {
    required(p, { message: 'Name is required' });
  });

  readonly group = new FormGroup({
    name: this.nameControl,
    age: new FormControl(25),
  });
}
```

Verified:

- `[formField]="nameControl.fieldTree"` type-checks and renders through
  `ngx-form-field-wrapper` exactly like a native field. Unlike the top-down
  case, `required()` **does** apply here — the schema passed to
  `SignalFormControl`'s constructor is the field's real Signal Forms schema,
  not a schema layered on top of an opaque `AbstractControl` value.
- `SignalFormControl.markAsTouched()` — called from Reactive-side code, not a
  DOM blur — writes straight through to the same field state the wrapper and
  error-display cascade read (`this.fieldState.markAsTouched()` internally).
  There is no separate "Reactive touched" flag shadowing the Signal Forms
  one. Calling `markAsTouched()` on the `AbstractControl` and reading
  `.touched()` off the `FieldTree` agree, immediately.

### Error-display strategy: transparent across the bridge

The toolkit's `'immediate'` / `'on-touch'` / `'on-submit'` cascade
(`createErrorVisibility`, used by the wrapper, `ngx-form-field-error`, and
auto-ARIA) only ever calls `.touched()` / `.invalid()` on whatever `FieldTree`
it is given — it never inspects where that `FieldTree` came from. Since both
`compatForm` and `SignalFormControl.fieldTree` return the same `FieldTree`
type as native `form()`, the cascade requires **no compat-specific handling**
and behaves identically whether touched state was set by a real blur, by
`field().markAsTouched()`, or by `SignalFormControl.markAsTouched()` from
Reactive code.

One caveat that applies universally, not specifically to compat: the
`'on-submit'` strategy still needs a `submittedStatus` — from `[formRoot]` +
`ngxSignalForm`, or supplied manually — to know a submit attempt happened.
`compatForm`/`SignalFormControl` don't change that requirement.

## `NG_STATUS_CLASSES` vs the toolkit's own classes: they compose, they don't collide

Angular's `NG_STATUS_CLASSES` (from `@angular/forms/signals/compat`) is a
`SignalFormsConfig['classes']` value that reproduces Reactive's
`ng-touched` / `ng-untouched` / `ng-dirty` / `ng-pristine` / `ng-valid` /
`ng-invalid` / `ng-pending` classes, written directly onto the **bound native
control element**:

```ts
import { provideSignalFormsConfig } from '@angular/forms/signals';
import { NG_STATUS_CLASSES } from '@angular/forms/signals/compat';
import { provideNgxSignalFormsConfig } from '@ngx-signal-forms/toolkit';

export const appConfig: ApplicationConfig = {
  providers: [
    provideNgxSignalFormsConfig({ defaultErrorStrategy: 'on-touch' }),
    provideSignalFormsConfig({ classes: NG_STATUS_CLASSES }),
  ],
};
```

The toolkit's own state classes — `.ngx-signal-form-field-wrapper--invalid`
and `--warning` — are written to the **wrapper host element**, driven by a
completely separate DI token (`NGX_SIGNAL_FORMS_CONFIG`, which has no
`classes` property at all). They are also not a raw mirror of
`touched`/`dirty`: `--invalid` only appears once the configured error
strategy says the error should be _visible_, not just whenever the field is
invalid.

Because the two systems write to different elements through different
tokens, **there is no last-provider-wins collision.** A team migrating a
form that still ships `ng-touched`/`ng-invalid` stylesheet rules can keep
`NG_STATUS_CLASSES` enabled on the native inputs indefinitely — including
after the field itself is fully migrated off Reactive Forms — while the
wrapper's own `--invalid`/`--warning` classes and `--ngx-form-field-*` custom
properties keep working on the wrapper host, unaffected. See also
[`docs/ANGULAR_VS_TOOLKIT.md`](./ANGULAR_VS_TOOLKIT.md) for the general
"who owns which visual state" boundary.

## `CompatValidationError` and `provideErrorMessages`

The toolkit's error-message registry
(`provideErrorMessages({ [kind]: message | factory })`) resolves purely on an
error's `kind` string — it has no special case for Angular's built-in error
shapes and none for `CompatValidationError` either:

```ts
declare class CompatValidationError<T = unknown> implements ValidationError {
  readonly kind: string;
  readonly control: AbstractControl;
  readonly fieldTree: ReadonlyFieldTree<unknown>;
  readonly context: T;
  readonly message?: string;
}
```

Because `kind` is a plain `string`, a `CompatValidationError` produced from a
Reactive `ValidatorFn`'s error key (`'required'`, `'pattern'`, or a custom key
from your own validator) resolves through `provideErrorMessages` exactly like
any other custom-kind error:

```ts
provideErrorMessages({
  required: 'This field is required', // already the toolkit default
  legacyPostalCode: (params) => `Postal code "${params.value}" is invalid`,
});
```

Message priority is unchanged by compat: a `message` set directly on the
`CompatValidationError` (or on the originating `ValidatorFn`'s error object)
wins over a registry entry, which wins over the toolkit's built-in fallback —
the same 3-tier order documented for every other error kind.

## `extractValue` — reading only what changed

`extractValue(field, filter?)` recursively unwraps a `FieldTree` (compat or
native) to its raw value, and can filter to only the fields matching
`{ dirty, touched, enabled }`:

```ts
import { extractValue } from '@angular/forms/signals/compat';

// Full raw value — AbstractControl leaves unwrapped to their own values.
const value = extractValue(nameForm);

// Only what the user actually changed — useful for PATCH-style autosave.
const dirtyOnly = extractValue(nameForm, { dirty: true });
```

This is genuinely useful outside compat migrations too — see
[issue #266](https://github.com/ngx-signal-forms/ngx-signal-forms/issues/266)
(autosave demo), which independently flagged `extractValue(field, { dirty:
true })` as a good fit for "save only what's dirty". That demo is not part of
this guide's scope; it is cross-referenced here so the idea isn't lost.

## Worked coexistence example: migrating one form at a time

A realistic migration rarely flips a whole form at once. A profile form with
`name`, `email`, and `age` fields can move field-by-field:

1. **Start**: `FormGroup({ name, email, age })`, all plain `FormControl`s,
   `ReactiveFormsModule` template bindings, `Validators.required` /
   `Validators.email` for validation.
2. **Migrate `name` first** (bottom-up): replace
   `new FormControl('', Validators.required)` with
   `new SignalFormControl('', (p) => required(p, { message: 'Name is required' }))`.
   The `FormGroup` doesn't change shape — `SignalFormControl` is still an
   `AbstractControl`. Swap the template's `formControlName="name"` for
   `[formField]="nameControl.fieldTree"`, wrapped in
   `ngx-form-field-wrapper` for the toolkit's error rendering and ARIA.
   `email` and `age` keep their existing Reactive bindings, untouched.
3. **Migrate `email` next**, the same way. At this point most of the form's
   validation and display already goes through Signal Forms and the
   toolkit, even though the outer container is still a `FormGroup`.
4. **Retire the `FormGroup` last.** Once every field is a
   `SignalFormControl`, replace the `FormGroup` and its Reactive template
   directives with a plain `signal(...)` model and `form(...)` — dropping
   `SignalFormControl` and `ReactiveFormsModule` entirely. Nothing about the
   wrapper, validators, or error-message registry changes in this step; only
   the root container does.

Going top-down instead — starting from a Signal Forms model and absorbing
Reactive controls with `compatForm` — is the right choice when the _outer_
container is what's hard to change quickly (e.g. a third-party component
still requires a real `FormControl` at one leaf). The two directions are not
mutually exclusive within the same app; pick per-form, or even per-field,
based on which system currently owns that piece.

## See also

- [angular.dev: Migrating from reactive forms](https://angular.dev/guide/forms/signals/migration) — the canonical framework-level guide this document defers to
- [FAQ §Migration](./FAQ.md#im-migrating-from-reactive-forms--what-replaces-setvaluepatchvalue-valuechanges-markallastouched-and-validatorfn-and-can-i-migrate-one-form-at-a-time)
- [docs/ANGULAR_VS_TOOLKIT.md](./ANGULAR_VS_TOOLKIT.md) — CSS status classes and the general ownership boundary
- [docs/VALIDATION_STRATEGY.md](./VALIDATION_STRATEGY.md) — choosing between Angular validators, Standard Schema, and Vest
- [docs/MIGRATING_FROM_NGX_VEST_FORMS.md](./MIGRATING_FROM_NGX_VEST_FORMS.md) — migrating from `ngx-vest-forms` instead of `ReactiveFormsModule`
- [`packages/toolkit/form-field/form-field-wrapper.compat.integration.spec.ts`](../packages/toolkit/form-field/form-field-wrapper.compat.integration.spec.ts) — the runnable spec backing every claim above
