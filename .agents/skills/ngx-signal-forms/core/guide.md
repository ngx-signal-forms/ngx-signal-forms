# Toolkit Core

Covers the root `@ngx-signal-forms/toolkit` entry point.
Use [api.md](../references/api.md) for exports, signatures, and configuration contracts.

## Bundle and directives

`NgxSignalFormToolkit` bundles four standalone directives:

| Directive               | Selector                        | Role                                                           |
| ----------------------- | ------------------------------- | -------------------------------------------------------------- |
| `FormRoot`              | `form[formRoot]`                | Angular native form submission and `novalidate`                |
| `NgxSignalForm`         | `form[formRoot][ngxSignalForm]` | Shared form context, message timing, and `submittedStatus`     |
| `NgxSignalFormAutoAria` | `[formField]` controls          | Writes `aria-invalid`, `aria-required`, and `aria-describedby` |
| `NgxSignalFormControl`  | `[ngxSignalFormControl]`        | Declares control kind, layout, and ARIA ownership              |

Plain `form[formRoot]` forms already work with the configured `defaultErrorStrategy` (default `'on-touch'`).
Add `ngxSignalForm` when you need `'on-submit'`, `submittedStatus`, form-level strategy overrides, or an error summary that announces alone.

## Message timing

Choose the strategy that fits the user flow:

- `'on-touch'` (default): shows messages after user interaction. In v1.0.0, typing in a touched control hides its blocking error, `aria-invalid`, and any `'on-touch'` warning until focus leaves or a DOM `submit` event fires. Other warnings also wait while the field has a blocking error. A programmatic `submit()` without a DOM event leaves editing active. Custom controls that emit no `input` event keep updating live.
- `'immediate'`: shows messages from first render.
- `'on-submit'`: shows messages after a submit attempt. Inside `form[formRoot][ngxSignalForm]`, toolkit components inherit `submittedStatus`. Standalone callers of `createErrorVisibility()` outside `ngxSignalForm` must pass `submittedStatus` explicitly so errors can appear.

Warnings time independently through their own cascade: field `warningStrategy` -> form `warningStrategy` -> `defaultWarningStrategy` -> `'on-touch'`.
Setting `errorStrategy` alone leaves warning timing unchanged.

## Control semantics and auto-ARIA

Inferred control kind (wrapper layout) and auto-ARIA eligibility (whether the toolkit writes `aria-invalid`, `aria-required`, and `aria-describedby`) are two separate decisions ([ADR-0001](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/docs/decisions/0001-control-semantics-architecture.md#auto-aria-eligibility-boundary)):

| Markup                                                                                      | Inferred kind                              | Auto-ARIA default                                              | Configuration                                                                                                                         |
| ------------------------------------------------------------------------------------------- | ------------------------------------------ | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Plain `input` / single `select` / `textarea`                                                | `input-like` / `standalone-field-like`     | Eligible                                                       | Works out of the box (`<select multiple>` is unsupported; see [signal-forms.md](../references/signal-forms.md#model-and-field-state)) |
| `[role="combobox"]` with a stable `id`                                                      | `input-like`                               | Eligible                                                       | Works out of the box                                                                                                                  |
| `input[type="checkbox"][role="switch"]`                                                     | `switch`                                   | Eligible                                                       | Works out of the box                                                                                                                  |
| `input[type="checkbox"]`                                                                    | `checkbox`                                 | Excluded (group owns ARIA)                                     | Opt in with `ngxSignalFormControl="checkbox"`                                                                                         |
| `input[type="radio"]`                                                                       | `radio-group`                              | Excluded (group owns ARIA)                                     | Opt in with `ngxSignalFormControl="radio-group"`                                                                                      |
| Switch host without `role="switch"` on host (`mat-slide-toggle`, `p-toggleswitch`, Spartan) | None until declared                        | Eligible, but writes on the host rather than the nested switch | Add `ngxSignalFormControl="switch"` and `ngxSignalFormControlAria="manual"`, then bind ARIA on inner control                          |
| Other custom `[formField]` host                                                             | Inferred from role, or none until declared | Eligible                                                       | Declare `ngxSignalFormControl` kind; opt out with `ngxSignalFormControlAria="manual"` or `ngxSignalFormAutoAriaDisabled`              |

Key rules:

- Standalone imports are template-local. If a child custom control renders the real `[formField]` element, import `NgxSignalFormToolkit` or `NgxSignalFormAutoAria` in that child component too.
- `NgxSignalFormControl` (the directive; `NgxSignalFormControlSemantics` is the matching interface) accepts a kind string (`'switch'`, `'slider'`, `'composite'`, `'checkbox'`, `'radio-group'`, `'input-like'`, `'standalone-field-like'`) or an object such as `[ngxSignalFormControl]="{ kind: 'slider', layout: 'stacked', ariaMode: 'manual' }"` (`'stacked'` is a control layout, distinct from `'standard'` appearance).
- `ariaMode` in a preset applies only to controls that are already auto-ARIA eligible; it does not opt native checkboxes or radios in.
- Share defaults with `provideNgxSignalFormControlPresets()` (app or route scope) or `provideNgxSignalFormControlPresetsForComponent()` (component scope):

```typescript
providers: [
  ...provideNgxSignalFormControlPresetsForComponent({
    slider: { layout: 'custom', ariaMode: 'manual' },
  }),
];
```

Explicit directive inputs override presets. Use `resolveNgxSignalFormControlSemantics(element, presets)` in tests and tooling.

## Configuration and messages

Provide app defaults with `provideNgxSignalFormsConfig()`, or component-scoped partial overrides with `provideNgxSignalFormsConfigForComponent()` (unset keys inherit from the parent provider).
Use `'inherit'` only on component inputs, never in provider config.

```typescript
import {
  provideErrorMessages,
  provideFieldLabels,
  provideNgxSignalFormsConfig,
} from '@ngx-signal-forms/toolkit';

export const appConfig = {
  providers: [
    provideNgxSignalFormsConfig({
      defaultErrorStrategy: 'on-submit',
      defaultWarningStrategy: 'on-touch',
      defaultFormFieldAppearance: 'outline',
    }),
    provideErrorMessages({
      required: 'This field is required',
      email: 'Enter a valid email address',
      minLength: ({ minLength }) => `At least ${minLength} characters`,
    }),
    provideFieldLabels({
      contactEmail: 'Email address',
    }),
  ],
};
```

Message resolution priority: validator `error.message` -> `provideErrorMessages()` registry -> built-in default.

Other root config and integration hooks:

- **Required/optional markers:** configure `showMarkerWhen` (`'required' | 'optional' | 'none'`), `requiredMarker`, `optionalMarker`, `requiredLegendText`, `optionalLegendText`, and `requiredHintText` (default `'required'`). Render `<ngx-form-marking-legend>` from `@ngx-signal-forms/toolkit/assistive` to explain markers.
- **Hide hints while feedback shows:** `hideHintOnError` (default `false`) hides visible hints during active errors or warnings while keeping their id in `aria-describedby` under auto-ARIA. Keep it off unless required (hiding format guidance when an error appears hurts WCAG 3.3.2), and avoid it on selection groups where projected hints are not linked through the group's `aria-describedby`.
- **Standard Schema required metadata:** `validateStandardSchema()` never registers Angular's `REQUIRED` metadata, so `required()`, `aria-required`, and `'required'` markers stay off. Call `requiredFromStandardSchema(path.field, Schema)` once per required field beside `validateStandardSchema()`.
- **Custom wrappers and renderers:** use `createFieldPresentation()` for wrapper feedback timing (see [headless-composition.md](../references/headless-composition.md#field-presentation-for-wrappers)), and `provideFormFieldErrorRenderer()` / `provideFormFieldHintRenderer()` (plus `*ForComponent` variants) to swap renderers.
- **Immutable array helpers:** use `updateAt()` and `updateNested()` for concise signal or SignalStore array updates.

## Submission and interactivity helpers

- `focusFirstInvalid(form)`: focuses the first invalid interactive field, skipping `hidden()`, `disabled()`, unbound, and orphan errors. Returns `true` only when focus moved or was already inside the target.
- `createOnInvalidHandler(options?)`: builds an `onInvalid` callback for `form()` submission options.
- `hasSubmitted(form)`: `Signal<boolean>` tracking completed submission attempts.
- `isFieldStateInteractive(state)` and `isFieldStateHidden(state)`: shared interactivity checks. `readonly()` counts as interactive; `NgxFormFieldWrapper` mirrors `hidden()` onto `[attr.hidden]`. Headless aggregation keeps orphan errors visible so validation messages are not silently lost.

## Warning helpers

Warnings use the `warn:` kind prefix (`warningError('weak-password', 'Use 12+ characters')`) and render with polite `role="status"` while blocking errors render with assertive `role="alert"`.

Angular treats `warn:` errors as invalid and blocks ordinary submission.
Use `canSubmitWithWarnings(form)` (returns `Signal<boolean>`) and `submitWithWarnings(form, callback)` (returns `Promise<boolean>`) when users may proceed with warnings:

- `submitWithWarnings()` verifies that `errorSummary()` contains no blocking errors, then delegates to Angular `submit()` with `ignoreValidators: 'all'`. Pending async validators do not block it, and its microtask yield does not wait for pending checks.
- Return value: `true` after `callback` settles; `false` when blocking errors refuse the attempt or an overlapping call is dropped. A rejected callback rejects the returned promise.
- Keep one submit owner per form: call `submitWithWarnings()` from a native `(submit)` handler with `event.preventDefault()` and `novalidate`, never inside an active `submission.action`.
- For manual `'on-submit'` feedback, create `createSubmittedStatusTracker(form, submitAttempted)` in an injection context and update `submitAttempted` on refused invalid attempts (ignoring overlapping `false` calls).

See [vest/guide.md](../vest/guide.md#warnings-and-submission) for complete event wiring and [WARNINGS_SUPPORT.md](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/docs/WARNINGS_SUPPORT.md#form-submission-behavior) for deeper detail.

## Core pattern

```typescript
import { Component, signal } from '@angular/core';
import { email, form, FormField, required } from '@angular/forms/signals';
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';
import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';

@Component({
  selector: 'app-example',
  imports: [FormField, NgxSignalFormToolkit, NgxFormField],
  template: `
    <form [formRoot]="userForm" ngxSignalForm errorStrategy="on-submit">
      <ngx-form-field-wrapper [formField]="userForm.email">
        <label for="email">Email</label>
        <input id="email" type="email" [formField]="userForm.email" />
      </ngx-form-field-wrapper>
      <button type="submit" [disabled]="userForm().submitting()">Submit</button>
    </form>
  `,
})
export class ExampleComponent {
  readonly #model = signal({ email: '' });
  protected readonly savedEmail = signal<string | null>(null);
  protected readonly userForm = form(
    this.#model,
    (path) => {
      required(path.email, { message: 'Email is required' });
      email(path.email, { message: 'Enter a valid email' });
    },
    {
      submission: {
        action: async (tree) => {
          this.savedEmail.set(tree().value().email);
        },
      },
    },
  );
}
```

## Done

Verify the checks that apply to your change:

- Submission changes keep one submit owner, match the chosen `ignoreValidators` policy, handle rejection and overlap, and prove callback counts and invalid focus.
- Warning flows cover warning-only, descendant blocking, pending, rejected, and overlapping attempts, plus independent error/warning timing and mounted live-region hosts.
- ARIA changes confirm one writer per control and valid description targets.
- Report checks that did not run.
