---
title: 'Migrating from Reactive Forms: the toolkit layer'
sidebarTitle: 'From Reactive Forms'
---

Angular maintains the framework-level migration guide for moving off `ReactiveFormsModule`: [angular.dev: Migrating from reactive forms](https://angular.dev/guide/forms/signals/migration). That guide covers `compatForm`, `SignalFormControl`, `NG_STATUS_CLASSES`, `extractValue`, and `CompatValidationError` from `@angular/forms/signals/compat`.

This page covers only the toolkit layer: how `ngx-form-field-wrapper`, `ngxSignalForm`, `provideErrorMessages`, error-display timing, and auto-ARIA behave when `[formField]` binds to a compat-bridged Reactive control instead of a native Signal Forms leaf.

Claims below are verified against Angular 22 (`@angular/forms`) and covered by [`form-field-wrapper.compat.integration.spec.ts`](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/8dc0df8f01d3dc76f0fa035c8fc242ef1294cd72/packages/toolkit/form-field/form-field-wrapper.compat.integration.spec.ts). For the short summary, see the [migration FAQ](/docs/FAQ#what-replaces-setvaluepatchvalue-valuechanges-markallastouched-and-validatorfn-when-migrating-from-reactive-forms).

## Choose a migration direction

`@angular/forms/signals/compat` provides two bridges. Pick the one that matches which system owns the outer form:

| Direction | Entry point                  | Use when                                                                                                                      |
| --------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Top-down  | `compatForm(model, schema?)` | A Signal Forms model keeps an existing `FormControl` or `FormGroup` at one or more leaves (for example a third-party widget). |
| Bottom-up | `SignalFormControl<T>`       | A Reactive `FormGroup` moves one field to Signal Forms rules while the rest of the group stays Reactive.                      |

Both return a standard `FieldTree<T>` from `@angular/forms/signals`, so every toolkit component and directive accepts a compat field with no cast and no special handling.

## Top-down: `compatForm` with `ngx-form-field-wrapper`

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

How it behaves:

- `nameForm.last().value()` returns the raw string value, not the `FormControl` instance.
- `ngx-form-field-wrapper`, error timing (`on-touch` by default), and `aria-describedby` work the same as on a native `form()` leaf.

### Keep validators on the Reactive control

A `compatForm` schema function does **not** run Signal Forms validators against a leaf backed by an `AbstractControl`. In the example above, `required(name.last, ...)` in the schema has no effect, while `required(name.first, ...)` works normally.

Keep Reactive validators (`Validators.*` or custom `ValidatorFn`) on the `FormControl` until you replace it with a plain value in the model signal. When those Reactive validators fail, Angular emits a `CompatValidationError` whose `kind` matches the Reactive error key (such as `'required'`), so `provideErrorMessages()` resolves it normally.

## Bottom-up: `SignalFormControl` inside a `FormGroup`

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

      <!-- Reactive field migrating later -->
      <input id="age" type="number" formControlName="age" />
    </form>
  `,
})
export class ProfileFormComponent {
  readonly nameControl = new SignalFormControl('', (p) => {
    required(p, { message: 'Name is required' });
  });

  readonly group = new FormGroup({
    name: this.nameControl,
    age: new FormControl(25),
  });
}
```

How it behaves:

- `[formField]="nameControl.fieldTree"` works directly with `ngx-form-field-wrapper` and runs the Signal Forms schema passed to `SignalFormControl`.
- Calling `nameControl.markAsTouched()` from Reactive code updates the underlying Signal Forms field state immediately, so wrapper timing and auto-ARIA react without extra wiring.

### Error-display timing across the bridge

`createErrorVisibility()`, the wrapper, `ngx-form-field-error`, and auto-ARIA read `.touched()` and `.invalid()` from whatever `FieldTree` they receive. Timing requires no compat-specific code.

For `on-submit` timing, you still need a `submittedStatus` source (either `[formRoot]` with `ngxSignalForm`, or an explicit `[submittedStatus]` input when the outer form is a Reactive `[formGroup]`).

## `NG_STATUS_CLASSES` and toolkit classes

Angular's `NG_STATUS_CLASSES` writes `ng-touched`, `ng-dirty`, `ng-valid`, and `ng-invalid` onto the native control element via `provideSignalFormsConfig`. The toolkit writes `.ngx-signal-form-field-wrapper--invalid` and `--warning` onto the wrapper host via `provideNgxSignalFormsConfig`, gated on the configured display strategy.

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

Because the two providers use separate tokens and write to different elements, they compose cleanly without colliding. You can keep legacy `ng-invalid` rules on Reactive fields while adopting the toolkit wrapper incrementally.

## `CompatValidationError` and `provideErrorMessages`

`provideErrorMessages()` resolves messages by `error.kind`. A `CompatValidationError` carries the Reactive validator's key as its `kind` string, so custom Reactive error keys resolve through the same registry and three-tier priority (explicit `message`, then registry, then toolkit fallback):

```ts
provideErrorMessages({
  required: 'This field is required',
  legacyPostalCode: (params) => `Postal code "${params.value}" is invalid`,
});
```

## Reading raw or dirty values with `extractValue`

`extractValue(field, filter?)` unwraps a compat or native `FieldTree` into plain values and can filter by `{ dirty, touched, enabled }`:

```ts
import { extractValue } from '@angular/forms/signals/compat';

const value = extractValue(nameForm);
const dirtyOnly = extractValue(nameForm, { dirty: true });
```

## Migrating one form step by step

To move a `FormGroup({ name, email, age })` incrementally:

1. Replace `new FormControl('', Validators.required)` with `new SignalFormControl('', (p) => required(p, { message: 'Name is required' }))`. Swap `formControlName="name"` for `[formField]="nameControl.fieldTree"` inside `ngx-form-field-wrapper`. Leave `email` and `age` untouched.
2. Migrate the remaining fields the same way.
3. Once every field is a `SignalFormControl`, replace the outer `FormGroup` and `ReactiveFormsModule` with a plain `signal(...)` model and `form(...)`. Wrappers, validators, and `provideErrorMessages()` stay unchanged.

Choose top-down (`compatForm`) instead when you want a Signal Forms root immediately and only need to keep one or two legacy `FormControl` widgets alive.

## See also

- [angular.dev: Migrating from reactive forms](https://angular.dev/guide/forms/signals/migration): Angular's framework-level guide
- [Migration FAQ](/docs/FAQ#what-replaces-setvaluepatchvalue-valuechanges-markallastouched-and-validatorfn-when-migrating-from-reactive-forms)
- [Angular vs toolkit](/docs/ANGULAR_VS_TOOLKIT): ownership boundary and CSS status classes
- [Validation strategy](/docs/VALIDATION_STRATEGY): choosing between Angular validators, Standard Schema, and Vest
- [Migrating from ngx-vest-forms](/docs/MIGRATING_FROM_NGX_VEST_FORMS)
- [`form-field-wrapper.compat.integration.spec.ts`](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/8dc0df8f01d3dc76f0fa035c8fc242ef1294cd72/packages/toolkit/form-field/form-field-wrapper.compat.integration.spec.ts): runnable integration spec backing this guide
