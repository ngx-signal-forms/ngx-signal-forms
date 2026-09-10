# Toolkit Core

Implements the root `@ngx-signal-forms/toolkit` entry point.

Use the [source index](../references/api.md) for exports, signatures, and config contracts.

## Principle

The toolkit is an enhancement layer, not a replacement. Angular Signal Forms owns the form model, validation, field state, and submission. The core entry point adds ARIA wiring, error visibility control, centralized message resolution, and submission lifecycle utilities on top.

## Workflow

1. **Start with Angular `form[formRoot]`; add `ngxSignalForm` when you need toolkit form context.** Angular `FormRoot` owns native form submission behavior. Toolkit wrappers, assistive components, and auto-ARIA can already work with the default `'on-touch'` / `'unsubmitted'` fallback when `ngxSignalForm` is absent. Add `ngxSignalForm` when the form needs shared toolkit context, `submittedStatus`, or a form-level `errorStrategy`. Add `novalidate` manually only when opting out of Angular `[formRoot]` entirely.

2. **Choose error strategy deliberately:**

- `'on-touch'` — show errors after user interaction (default, good for most forms, and works with or without `ngxSignalForm`)
- `'immediate'` — show errors from first load (useful for live guidance or sign-up flows)
- `'on-submit'` — show errors only after submission attempt. Inside `form[formRoot][ngxSignalForm]` the wrapper, auto-ARIA, and headless directives inherit `submittedStatus` automatically. **Standalone callers of `createShowErrorsComputed()` MUST pass `submittedStatus` explicitly when using `'on-submit'`** — otherwise the helper stays at `'unsubmitted'` and errors never surface (dev mode logs a one-shot `console.warn` to flag the silent failure).

3. **Use automatic ARIA by default.** `NgxSignalFormAutoAria`, bundled in `NgxSignalFormToolkit`, handles `aria-invalid`, `aria-required`, and `aria-describedby` for native input-like controls, custom `[formField]` hosts, and checkbox switches with `role="switch"`. Standard checkboxes and radios are excluded by default; explicit `ngxSignalFormControl` semantics opt them in. A control that owns these attributes must explicitly select `ngxSignalFormControlAria="manual"` or `ariaMode: 'manual'` through semantics or presets. Headless markup alone does not disable auto-ARIA.

   **Inferred control kind and auto-ARIA eligibility are two decisions.**
   Control-kind inference answers "which wrapper layout does this control
   get". Auto-ARIA eligibility answers "does the toolkit own
   `aria-invalid`, `aria-required`, and `aria-describedby` on this host".
   The two do not always agree:

   | Markup                                                      | Inferred kind                               | Auto-ARIA default      | How to opt in                                                                       |
   | ----------------------------------------------------------- | ------------------------------------------- | ---------------------- | ----------------------------------------------------------------------------------- |
   | `input[type="checkbox"]`                                    | `checkbox`                                  | Not eligible           | Add `ngxSignalFormControl="checkbox"`                                               |
   | `input[type="checkbox"][role="switch"]`                     | `switch`                                    | Eligible automatically | None — works out of the box                                                         |
   | `input[type="radio"]`                                       | `radio-group`                               | Not eligible           | Add `ngxSignalFormControl="radio-group"`                                            |
   | `[role="combobox"]` element with a stable `id`              | `input-like`                                | Eligible automatically | None — works out of the box                                                         |
   | Plain `input` / `select` / `textarea`                       | `input-like` / `standalone-field-like`      | Eligible automatically | None — works out of the box                                                         |
   | Custom `[formField]` host (not `input`/`textarea`/`select`) | inferred from shape, or none until declared | Eligible automatically | Opt out with `ngxSignalFormAutoAriaDisabled` or `ngxSignalFormControlAria="manual"` |

   A native checkbox or radio infers a wrapper kind (`checkbox` /
   `radio-group`). It is **not** auto-ARIA eligible by default. In a
   selection group, `ngx-form-field-wrapper` owns `role`, `aria-labelledby`,
   `aria-describedby`, and `aria-required` on the group container. Writing
   those same attributes on each grouped input would duplicate or
   contradict the group-level values. A checkbox with `role="switch"` is
   always a single control. It never joins a group, so it is eligible
   automatically. `ariaMode` in a control preset only applies once a host
   is already auto-ARIA eligible. It does not itself grant eligibility. See
   [ADR-0001](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/docs/decisions/0001-control-semantics-architecture.md#auto-aria-eligibility-boundary).

4. **Remember that standalone imports are template-local.** Importing `NgxSignalFormToolkit` in a parent form component does not make `NgxSignalFormAutoAria` available inside a child component's template. If a custom control renders the actual `<input [formField]>` itself, import the toolkit bundle or the directive in that child component.

5. **Declare control semantics for controls outside the default native field families.** `NgxSignalFormControlSemanticsDirective` (the directive class — included in `NgxSignalFormToolkit`; the suffix-less `NgxSignalFormControlSemantics` name is the matching public _interface_ in `core/types.ts`) writes stable `data-ngx-signal-form-control-*` attributes the wrapper and auto-ARIA use to pick correct layout and ARIA behavior instead of guessing from DOM heuristics.
   - Use `ngxSignalFormControl="switch"` on a native `input[type="checkbox"][role="switch"]` to opt it into switch wrapper styling and ARIA.
   - Use `ngxSignalFormControl="checkbox"` on a plain `input[type="checkbox"]` when it should opt in to wrapper validation display.
   - Use `ngxSignalFormControl="slider"` or `ngxSignalFormControl="composite"` on a custom component host to declare layout and ARIA ownership.
   - Pass an object for combined overrides: `[ngxSignalFormControl]="{ kind: 'slider', layout: 'stacked', ariaMode: 'manual' }"` (`'stacked'` here is a control layout, not an appearance).
   - Use `ngxSignalFormControlAria="manual"` alone when you only need to suppress auto-ARIA without declaring a kind.

6. **Use the preset provider that matches the scope you need.** Use `provideNgxSignalFormControlPresets()` for app- or feature-level defaults, and `provideNgxSignalFormControlPresetsForComponent()` for component-scoped semantic defaults. When all sliders or all switches in a feature should share the same `layout`/`ariaMode`, avoid repeating the directive object on every element:

   ```typescript
   providers: [
     ...provideNgxSignalFormControlPresetsForComponent({
       slider: { layout: 'custom', ariaMode: 'manual' },
     }),
   ];
   ```

   Explicit `ngxSignalFormControl` directive inputs still override preset defaults.

   For tooling and tests, two low-level helpers expose the same lookup:
   `readNgxSignalFormControlSemantics(element)` returns exactly what the
   consumer declared on the host (or `null`), and `inferNgxSignalFormControlKind(element)`
   runs the DOM-heuristic fallback that the wrapper and auto-ARIA use when no
   explicit semantics are present. Prefer `resolveNgxSignalFormControlSemantics`
   for merged results that include preset defaults.

7. **Use `provideErrorMessages()` for centralized validation copy.** Message priority: validator-provided `error.message` → registry → toolkit default.

8. **Use warning helpers for non-blocking guidance.** Warnings use `kind: 'warn:*'` convention and render with polite ARIA (`role="status"`). Blocking errors render with assertive ARIA (`role="alert"`). Warnings time independently of errors through their own cascade: `warningStrategy` input on the wrapper or `ngxSignalForm` → `defaultWarningStrategy` config → terminal `'on-touch'` (see `resolveWarningStrategy` in `../references/api.md`). Setting `errorStrategy` alone does not move warnings.

9. **Use submission helpers over manual state tracking:**
   - `focusFirstInvalid(form)` — focus on invalid target after failed submit. Skips errors whose bound field is `hidden()` or `disabled()` — focusing a non-interactive control would either throw or strand focus on something the user cannot operate. Also skips orphan errors with no field tree (nothing to focus is better than stealing focus to an unrelated control). Returns `true` only when focus actually moved, or when it was already inside the candidate field (submitting with Enter from within it). A field with no registered binding makes Angular's `focusBoundControl()` a silent no-op, so the helper moves on to the next candidate; if none works it returns `false` and warns in dev mode.
   - `createOnInvalidHandler()` — creates an `onInvalid` callback for `form()` submit options
   - `submitWithWarnings(form, callback)` — submit even when only warnings remain or a validator is still pending. Delegates to Angular `submit()` once its own gate passes, so `submitting()` and `submittedStatus` track automatically. Returns `Promise<boolean>`: `true` once `callback` has run and settled, `false` when refused (blocking errors) or dropped (re-entrant call)
   - `hasSubmitted(form)` — `Signal<boolean>` for completed submission tracking

10. **Field interactivity helpers** (`isFieldStateInteractive`, `isFieldStateHidden`) drive consistent behavior across focus, wrapper rendering, and error surfacing. The wrapper mirrors `hidden()` onto the host via `[attr.hidden]` so screen readers skip it. `readonly()` counts as interactive — the control is still visible and focusable, and the error remains meaningful. Headless aggregation filters errors through `isErrorOnInteractiveField()`, which uses the same predicate but **keeps orphan errors visible** — the asymmetry vs. `focusFirstInvalid()` is deliberate: silently hiding a validation message is worse than showing one without focus.

## Core Pattern

```typescript
import { Component, signal } from '@angular/core';
import { form, FormField, required, email } from '@angular/forms/signals';
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
      <button type="submit">Submit</button>
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

## Global Configuration

```typescript
// app.config.ts
import {
  provideNgxSignalFormsConfig,
  provideErrorMessages,
} from '@ngx-signal-forms/toolkit';

export const appConfig = {
  providers: [
    provideNgxSignalFormsConfig({
      defaultErrorStrategy: 'on-submit', // 'immediate' | 'on-touch' | 'on-submit'
      defaultWarningStrategy: 'on-submit', // warnings time independently; default: 'on-touch'
      defaultFormFieldAppearance: 'outline', // 'standard' | 'outline' | 'plain'
      autoAria: true, // default: true
    }),
    provideErrorMessages({
      required: 'This field is required',
      email: 'Please enter a valid email address',
      minLength: ({ minLength }) => `At least ${minLength} characters`,
    }),
  ],
};
```

Never use `'inherit'` in global config — only in field-level or component-level inputs.

## Warning Helpers

```typescript
import { warningError } from '@ngx-signal-forms/toolkit';

// In a validator
return warningError('weak-password', 'Consider using 12+ characters');
```

Use `canSubmitWithWarnings(form)` and `submitWithWarnings(form, callback)` when
warnings should not block submission. Angular treats `warn:` errors as invalid
and blocks ordinary submission. Both helpers ignore pending validators.
`submitWithWarnings()` checks blocking errors in `errorSummary()` before
delegating with `ignoreValidators: 'all'`; its microtask
yield is not a wait for async validation. `canSubmitWithWarnings()` returns a
signal; `submitWithWarnings()` returns `Promise<boolean>`. `true` means the
callback completed normally, not independent confirmation of a server save.
`false` means blocking errors refused the attempt or an overlapping call was
dropped. A rejected callback rejects the promise.

Use one native submit owner. Never call the helper from an already-running
Angular submission action. For manual submit-only feedback, create
`createSubmittedStatusTracker(form, submitAttempted)` in an injection context,
record refused attempts with the writable signal, and pass the returned status
to feedback. A refused helper call does not set `submitting()`; do not treat
every `false` as an invalid attempt because overlap also returns `false`.

Warnings have their own timing cascade and polite status hosts; changing error
timing alone does not change warning timing. Keep alert/status hosts mounted
before their content appears. Read [event wiring](../vest/guide.md#warnings-and-submission)
and [testing](../testing/guide.md) before changing this flow. For deeper detail,
see the [warning submission doc](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/docs/WARNINGS_SUPPORT.md#form-submission-behavior).

## Immutable Array Helpers

```typescript
import { updateAt, updateNested } from '@ngx-signal-forms/toolkit';

// Concise immutable state updates for NgRx Signal Store or signal.update()
patchState(store, (s) => ({
  destinations: updateNested(
    s.destinations,
    destIdx,
    'activities',
    actIdx,
    (a) => ({ ...a, name: 'Updated' }),
  ),
}));
```

## Required Markers, Standard Schema & Renderer Overrides

- **Configure required/optional markers.** Global config takes `showMarkerWhen: FieldMarkingMode` (`'required' | 'optional' | 'none'`) plus `requiredMarker` / `optionalMarker` / `requiredLegendText` / `optionalLegendText`. `requiredHintText`, default `'required'`, sets the wrapper's required hint text. `MarkerKind` is the non-`none` subset (`'required' | 'optional'`) and `ResolvedMarker` is the resolved shape. Render the form-level marker explanation with `NgxFormMarkingLegend` (`<ngx-form-marking-legend>`) from `@ngx-signal-forms/toolkit/assistive`.
- **Surface `aria-required` for Standard Schema (Zod) fields.** Fields validated only through `validateStandardSchema()` (Zod, Valibot, ArkType, …) never register Angular's `required()` metadata, so `FieldState.required()` stays `false` and neither auto-ARIA's `aria-required` nor the `'required'` auto-marker fires. Call `requiredFromStandardSchema(path.field, Schema)` once per field, next to the `validateStandardSchema()` call, to close that gap. Types: `StandardSchemaLike`, `StandardSchemaLikeIssue`, `StandardSchemaLikeResult`.
- **Swap error/hint rendering.** `provideFormFieldErrorRenderer()` / `provideFormFieldHintRenderer()` (and their `*ForComponent` variants) replace how the wrapper renders error and hint content, injected through the `NGX_FORM_FIELD_ERROR_RENDERER` / `NGX_FORM_FIELD_HINT_RENDERER` tokens. See `../references/api.md` for the override signatures (`NgxFormFieldErrorRendererOverride`, `NgxFormFieldHintRendererOverride`, `NgxFormFieldErrorPlacement`).

## Done

- Each submit event has one owner. The action and pending policy match the
  [Angular contract](../references/signal-forms.md#submission). Accepted and
  blocked attempts, pending refusal and later deliberate retry, rejected saves,
  overlapping attempts, and invalid focus/feedback have evidence where
  submission changed. Assert cleanup and callback counts, not just button state.
- Warning-aware flows test warning-only and descendant blocking errors, plus
  clean, pending, rejected, and overlapping attempts and their boolean outcomes.
  Manual submit-only feedback records refused attempts. Independent timing and
  mounted alert/status hosts have evidence.
- Each changed control has one ARIA writer, stable description targets, and
  independent error/warning timing. Missing browser evidence is reported.

## Troubleshooting

- If `'on-submit'` errors don't appear: verify the form uses `form[formRoot][ngxSignalForm]`, or pass `submittedStatus` explicitly to standalone `createShowErrorsComputed()` callers.
- If `aria-describedby` links are missing: ensure bound controls have a stable `id` attribute; for nested or dynamically identified controls inside wrappers, prefer an explicit `fieldName` on the wrapper.
- If a switch does not receive auto-ARIA: confirm the actual bound element is `input[type="checkbox"][role="switch"]` and that the component rendering it imported the toolkit in its own standalone `imports`.
- If ARIA attributes are duplicated: check for manual additions alongside auto-ARIA; remove the manual ones, or use `ngxSignalFormControlAria="manual"` to suppress auto management.
- If wrapper layout is wrong for a custom control (e.g., outlined appearance on a slider, or inline layout on a composite): add `ngxSignalFormControl="slider"` (or the appropriate kind) to declare explicit semantics. For component-wide defaults, use `provideNgxSignalFormControlPresetsForComponent()`.
- If warnings block submission: Angular treats `warn:` errors as invalid. Use `submitWithWarnings()` for a warning-aware submit path and `warningError()` to create the warning kind. Warning helpers intentionally allow warnings. See [Vest submission](../vest/guide.md#warnings-and-submission) for event wiring.
