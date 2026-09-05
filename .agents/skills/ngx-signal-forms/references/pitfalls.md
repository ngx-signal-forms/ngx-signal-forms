# Common Pitfalls

Mistakes that recur when using Angular Signal Forms and `@ngx-signal-forms/toolkit`.

## Signal Calls

| Wrong                          | Correct                      |
| ------------------------------ | ---------------------------- |
| `form.email.invalid()`         | `form.email().invalid()`     |
| `form.email.touched()`         | `form.email().touched()`     |
| `form().email.errors()`        | `form.email().errors()`      |
| `debugger [formTree]="form()"` | `debugger [formTree]="form"` |

Field accessors are signals — always call them: `form.email()` returns the field state, then `.invalid()` reads from it.

## Signal Forms Has No `untouched()` or `pristine()`

```typescript
// Wrong
form.email().untouched();
form.email().pristine();

// Correct
!form.email().touched();
!form.email().dirty();
```

## Submit Events — Use Native DOM Not ngSubmit

```html
<!-- Wrong -->
<form (ngSubmit)="save()"></form>

<!-- Correct with [formRoot] and configured submission.action -->
<form [formRoot]="myForm"></form>

<!-- Alternative without [formRoot]; save must prevent the default event -->
<form (submit)="save($event)" novalidate></form>
```

With `[formRoot]`, configure submission in `form()` options. Without it, always call `event.preventDefault()`.

## Value Resets

The method is `form().reset(value?: TValue)`, called on the field state.
Without an argument it clears touched/dirty state on the field and descendants
without changing values. With a value it also replaces the model value:

```typescript
// Keep current values; clear interaction state.
this.myForm().reset();

// Restore an explicitly retained initial value and clear interaction state.
this.myForm().reset(initialValue);
```

Angular does not retain an initial snapshot for this call. Toolkit submission
history resets separately when its tracker observes touched change from true
to false; `submittedStatus` is not an Angular reset field.

## Immutable Array Updates

```typescript
// Wrong — mutates signal state directly
this.#model().items.push(newItem);

// Correct
this.#model.update((d) => ({ ...d, items: [...d.items, newItem] }));
```

## Import Location Mismatch

```typescript
// Wrong — importing form-field from root
import { NgxFormField } from '@ngx-signal-forms/toolkit';

// Correct
import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';
import { NgxFormFieldError } from '@ngx-signal-forms/toolkit/assistive';
import { NgxHeadlessToolkit } from '@ngx-signal-forms/toolkit/headless';
import { NgxSignalFormDebugger } from '@ngx-signal-forms/debugger'; // Internal/demo only
import { validateVest } from '@ngx-signal-forms/toolkit/vest';
```

## ARIA ownership

```html
<!-- Wrong — toolkit auto-ARIA already manages these -->
<input [formField]="form.email" aria-invalid="true" aria-required="true" />

<!-- Correct — let NgxSignalFormAutoAria handle it -->
<input id="email" [formField]="form.email" />
```

Use automatic ARIA by default. Manual ownership requires an explicit mode;
using headless directives alone does not opt out. Static helper IDs in
`aria-describedby` may be preserved as the base of an automatic chain.

If you explicitly opt a control into `ngxSignalFormControlAria="manual"`, the
toolkit preserves your existing ARIA attributes instead of generating them.

## `aria-required` on Standard Schema (Zod) Fields Needs `requiredFromStandardSchema`

```typescript
// Wrong — validateStandardSchema alone never sets REQUIRED metadata, so
// FieldState.required() stays false: no aria-required, no required marker.
form(model, (path) => {
  validateStandardSchema(path, TravelerSchema);
});

// Correct — register required-ness per field alongside the schema (#215)
import { requiredFromStandardSchema } from '@ngx-signal-forms/toolkit';

form(model, (path) => {
  validateStandardSchema(path, TravelerSchema);
  requiredFromStandardSchema(path.firstName, TravelerSchema);
  requiredFromStandardSchema(path.lastName, TravelerSchema);
});
```

Standard Schema (Zod, Valibot, ArkType, …) has no runtime way to ask "is this
key required?", so `validateStandardSchema()` registers tree-level errors only —
it never touches `REQUIRED` metadata. Call `requiredFromStandardSchema()` once
per field for auto-ARIA `aria-required` and the `showMarkerWhen: 'required'`
marker to fire. Native `required()` validators already do this; only
schema-validated fields need the extra call.

## Notification Tone Is Content-Driven — There Is No `tone` Input

```html
<!-- Wrong — `tone` is not an input on the grouped panel -->
<ngx-form-field-error
  [errors]="field().errors()"
  presentation="panel"
  tone="auto"
/>

<!-- Correct — tone is resolved from the errors themselves -->
<ngx-form-field-error
  [errors]="field().errors()"
  fieldName="email"
  presentation="panel"
/>
```

`NgxFormFieldError`'s `presentation="panel"` mode (assistive) and
`NgxHeadlessNotification` (headless) route tone automatically from content:
any blocking error raises the error container (`role="alert"`); a
warning-only list raises the warning container (`role="status"`); an empty
list hides both. Do not try to set a tone — there is
no such input.

## Warnings Have Their Own Timing — `warningStrategy`, Not `strategy`

```html
<!-- Wrong — expects warnings to follow the error strategy -->
<ngx-form-field-wrapper strategy="on-submit" [formField]="form.bio">
  ...
</ngx-form-field-wrapper>

<!-- Correct — warnings time through their own cascade -->
<ngx-form-field-wrapper
  strategy="on-submit"
  warningStrategy="on-submit"
  [formField]="form.bio"
>
  ...
</ngx-form-field-wrapper>
```

The warning cascade is `warningStrategy` input → the form context's
`warningStrategy()` → `defaultWarningStrategy` config → `'on-touch'`. No tier
consults `defaultErrorStrategy`. Set `warningStrategy` on the wrapper or on
`ngxSignalForm` when warnings should surface on the same schedule as errors.

A `warn:` error does mark the field `invalid()` — Angular has no separate
non-invalidating channel, and the toolkit splits the two on `kind`. So do not
reach for `invalid()` to tell a warning-only field from a failing one; use
`splitByKind()` or `isWarningError()`.

## Wrapper identity: control `id` or explicit `fieldName`

```html
<!-- Wrong — wrapper can't derive field identity -->
<ngx-form-field-wrapper [formField]="form.email">
  <label>Email</label>
  <input [formField]="form.email" />
</ngx-form-field-wrapper>

<!-- Correct — id enables automatic error/label linkage -->
<ngx-form-field-wrapper [formField]="form.email">
  <label for="email">Email</label>
  <input id="email" [formField]="form.email" />
</ngx-form-field-wrapper>
```

For nested or dynamically identified controls, set the wrapper's `fieldName`
explicitly. This supplies message identity, not an accessible label; keep a
valid label association for the actual control.

## Removed / Non-Public APIs — Never Use

These were removed or are not public:

| Removed                        | Use Instead                                                                                                     |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| `'manual'` strategy            | `createShowErrorsComputed()` + manual signal                                                                    |
| `computeShowErrors()`          | `createShowErrorsComputed()`                                                                                    |
| `createShowErrorsSignal()`     | `createShowErrorsComputed()`                                                                                    |
| `showErrors()`                 | `createShowErrorsComputed()` — same signature, gone (not deprecated)                                            |
| `canSubmit()`                  | `canSubmitWithWarnings()`                                                                                       |
| `isSubmitting()`               | Angular `form().submitting()` for in-flight state; toolkit `submittedStatus()` from `ngxSignalForm` for history |
| `fieldNameResolver` config     | Control `id` or explicit wrapper `fieldName`                                                                    |
| `strictFieldResolution` config | Removed — strict by default                                                                                     |
| `NgxFormFieldNotification`     | `NgxFormFieldError` with `presentation="panel"` + `[errors]`                                                    |
| `toHintDescriptors()`          | Inline the two-line `computed()` — see `docs/CUSTOM_WRAPPERS.md`                                                |
| `createErrorRendererInputs()`  | Inline the two-line `computed()` — see `docs/CUSTOM_WRAPPERS.md`                                                |
| `resolveUnionInput()`          | Inline the union unwrap at the call site                                                                        |

The notification fold also renamed the CSS hooks: `--ngx-signal-form-notification-*`
became `--ngx-signal-form-error-panel-*` / `--ngx-signal-form-warning-panel-*`.

## Renamed — Update the Name, Same Behavior

These still exist under a new name:

| Old                    | New                     |
| ---------------------- | ----------------------- |
| `appearance="stacked"` | `appearance="standard"` |
| `appearance="bare"`    | `appearance="plain"`    |

> A brief RC cycle (rc.1 – rc.4) shipped `appearance="stacked"` as the new name
> for the default. The current release-candidate surface uses `"standard"` again. The
> control _layout_ value `'stacked'` (in `NgxSignalFormControlLayout`) is
> unrelated and remains unchanged.

## The Outline Label Does Not Float — Drop the Placeholder Space

`appearance="outline"` puts the label inside the bordered container as a static
caption above the control. It never moves, so there is no float to trigger:

```html
<!-- Pointless — the space placeholder animates nothing -->
<input id="email" [formField]="form.email" placeholder=" " />

<!-- Fine — no placeholder, or a real one the user should read -->
<input id="email" [formField]="form.email" />
<input id="email" [formField]="form.email" placeholder="name@example.com" />
```

The wrapper stylesheet has no `:placeholder-shown` rule, no transition and no
keyframes on the label. Guides written for Material-style floating labels do
not carry over.

## Angular Template Binding — Prefer Static Attributes for Literal Strings

```html
<!-- Wrong — Angular parses this as an expression, not a string literal -->
<ngx-form-field-wrapper [strategy]="on-submit">...</ngx-form-field-wrapper>

<!-- Correct — use a plain attribute for literal values -->
<ngx-form-field-wrapper strategy="on-submit">...</ngx-form-field-wrapper>
```

For literal string inputs, prefer the plain attribute form because it is shorter
and easier to scan. Use property binding only when the value comes from a real
template expression. In skill docs and examples, prefer the plain attribute form
for static strings so the canonical pattern stays obvious.

## Switch Semantics — Use a Real Switch, Not Just Switch Styling

```html
<!-- Wrong — visually switch-like, but still just a plain checkbox semantic -->
<input id="emailUpdates" type="checkbox" [formField]="form.emailUpdates" />

<!-- Correct — native checkbox plus real switch semantics -->
<input
  id="emailUpdates"
  type="checkbox"
  role="switch"
  [formField]="form.emailUpdates"
/>
```

Use a native checkbox with `role="switch"` on the actual bound control when the
UI is conceptually an on/off switch. This preserves native keyboard behavior and
lets toolkit auto-ARIA opt the control back in.

For custom controls or fallback-free wrapper behavior, prefer the explicit
semantics directive as well:

```html
<input
  id="emailUpdates"
  type="checkbox"
  role="switch"
  ngxSignalFormControl="switch"
  [formField]="form.emailUpdates"
/>
```

## Standalone Imports — Parent Imports Do Not Flow Into Child Templates

```typescript
// Wrong mental model
// Importing NgxSignalFormToolkit in the parent component does NOT make
// NgxSignalFormAutoAria available inside a child custom control template.

// Correct
@Component({
  imports: [FormField, NgxSignalFormToolkit],
  template: `<input [formField]="field()" role="switch" type="checkbox" />`,
})
export class SwitchControlComponent {}
```

## Custom Controls — Declare Semantics to Avoid Layout Heuristics

Without `ngxSignalFormControl`, the wrapper must infer the control kind from DOM heuristics. This can produce wrong wrapper layout (e.g., outlined text-field chrome around a slider) or suppress auto-ARIA for valid switch controls.

```html
<!-- Wrong — wrapper guesses control kind from DOM, may get layout wrong -->
<ngx-form-field-wrapper appearance="plain" [formField]="form.rating">
  <label for="rating">Rating</label>
  <ngx-rating-control id="rating" [formField]="form.rating" />
</ngx-form-field-wrapper>

<!-- Correct — explicit semantics give the wrapper stable contract.
     'stacked' here is the control LAYOUT (NgxSignalFormControlLayout),
     not the renamed 'standard' appearance. -->
<ngx-form-field-wrapper appearance="plain" [formField]="form.rating">
  <label for="rating">Rating</label>
  <ngx-rating-control
    id="rating"
    [ngxSignalFormControl]="{ kind: 'slider', layout: 'stacked' }"
    [formField]="form.rating"
  />
</ngx-form-field-wrapper>
```

When multiple controls in a component use the same semantics, use `provideNgxSignalFormControlPresetsForComponent()` to set defaults once instead of repeating the object on every control.

Angular standalone imports are template-local. If the real `[formField]` host
element lives inside `SwitchControlComponent`, that component needs the toolkit
import in its own `imports` array.

The same rule applies to `ngxSignalFormControl`: import the toolkit bundle or
directive in the component that renders the actual control host.

## Nested Custom Controls May Need Explicit `fieldName`

```html
<!-- Fragile — wrapper relies on discovering identity from nested markup timing -->
<ngx-form-field-wrapper [formField]="form.emailUpdates">
  <label for="emailUpdates">Email updates</label>
  <app-switch-control inputId="emailUpdates" [field]="form.emailUpdates" />
</ngx-form-field-wrapper>

<!-- Safer for nested/dynamic controls -->
<ngx-form-field-wrapper
  [formField]="form.emailUpdates"
  fieldName="emailUpdates"
>
  <label for="emailUpdates">Email updates</label>
  <app-switch-control inputId="emailUpdates" [field]="form.emailUpdates" />
</ngx-form-field-wrapper>
```

When the actual bound control is nested inside a custom component or its `id` is
resolved dynamically, pass `fieldName` explicitly on the wrapper to keep error
IDs and described-by wiring deterministic.

## Your Own Wrapper — Publish the Name, and Call the Input `field`

`fieldName` is an input on `ngx-form-field-wrapper`. A wrapper **you** wrote has
no such input: auto-ARIA on the projected control resolves the name from the
control's `id` and never asks your component. A widget that mints its own inner
`id` then gets `pn_id_42-error` while your wrapper renders `country-error`, and
`aria-describedby` points at nothing. Nothing throws.

```typescript
// Correct — publish the field-NAME channel from your wrapper's host
@Component({
  selector: 'my-field',
  hostDirectives: [
    { directive: NgxFieldIdentityProvider, inputs: ['fieldName'] },
  ],
})
export class MyField {
  // Name it `field`, not `formField`.
  readonly field = input.required<FieldTree<unknown>>();
}
```

Two rules travel with this:

- **Import `NgxFieldIdentityProvider` from the package root**, not `/headless`.
- **Call the field input `field`.** `NgxSignalFormAutoAria` and Angular's own
  `FormField` both select on `[formField]` _including on elements that are not
  controls_, so `<my-field [formField]="...">` pulls both directives onto your
  wrapper host and auto-ARIA fails to inject `FORM_FIELD`:
  `NG0201: No provider found for InjectionToken FORM_FIELD`. Reusing the name
  works only if every consumer template also has `FormField` in scope — which is
  why `ngx-form-field-wrapper` gets away with it.

The provider publishes the name channel only; hints and display timing keep
resolving through their registries. Full contract: `docs/CUSTOM_WRAPPERS.md`.

## Error Strategy `'on-submit'` Without `[formRoot]`

```html
<!-- Wrong — no submitted status source, errors never show -->
<form (submit)="save($event)" novalidate>
  <ngx-form-field-wrapper [formField]="form.email" strategy="on-submit"
    >...</ngx-form-field-wrapper
  >
</form>

<!-- Correct — ngxSignalForm provides submittedStatus context; configure submission.action -->
<form [formRoot]="form" ngxSignalForm errorStrategy="on-submit">...</form>
```

## Standalone `createShowErrorsComputed('on-submit')` Without `submittedStatus`

```typescript
// Wrong — silently never shows errors. Dev mode logs a one-shot
// console.warn("[ngx-signal-forms] createShowErrorsComputed(): 'on-submit' strategy
// requires an explicit submittedStatus signal. Without it, errors will never
// surface. Wire the status from NgxSignalForm ('ngxSignalForm') or pass
// submittedStatus explicitly.").
const visible = createShowErrorsComputed(form.email, 'on-submit');

// Correct — pass the submitted-status signal explicitly
const visible = createShowErrorsComputed(form.email, 'on-submit', () =>
  submittedStatus(),
);
```

The wrapper, auto-ARIA, and headless directives inherit `submittedStatus` from
`form[formRoot][ngxSignalForm]`. A direct `createShowErrorsComputed()` call does
not inject context. Always pass its status argument for `'on-submit'`, even
inside that form's injection context.

## Vest — An Invalid Field Name Throws in Dev Mode

```typescript
// Wrong — `address.cityy` is a typo: `address` resolves on the bound field
// tree, but `cityy` does not. Throws synchronously in dev mode.
const suite = create((data: { address: { city: string } }) => {
  test('address.cityy', 'City is required', () => {
    /* ... */
  });
});

// Correct — name a real child of the bound path
const suite = create((data: { address: { city: string } }) => {
  test('address.city', 'City is required', () => {
    /* ... */
  });
});
```

A Vest field name whose FIRST segment does not resolve (e.g.
`test('passwordMatch', …)` on a model with no `passwordMatch` field) is a
legitimate **virtual** field name — a deliberate, form-level error — and
never throws. Only a valid prefix followed by an unresolvable tail, or a
resolution probe that throws, is treated as an authoring bug: a hard throw in
dev mode, `console.error()` in production (still attaching the failure to
the bound field either way). See [Vest field-name resolution](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/packages/toolkit/vest/README.md#vest-field-name-resolution)
and [ADR-0008](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/docs/decisions/0008-vest-suite-input-is-the-bound-path.md).

## Vest concurrency and request isolation

Registrations reference-count teardown and reset the suite only after the last
registration leaves. This prevents one mount's teardown from resetting another,
but does not make every concurrent execution safe.

The coordinator defers overlapping unfocused runs from different field trees.
Focused `only` runs are not deferred. Shared focused registrations for fields
of the same form are supported; a focused run racing an unrelated form on the
same suite is not. Give independently mounted forms separate suite instances
in that case.

For SSR, create a suite and `createVestAdapter()` per request rather than share
module-scope suite state or `sharedVestAdapter` across requests. Await a manual
run's `settled()`, not `runResult`, which can be superseded and remain pending.
See [Vest lifecycle](../vest/SKILL.md#suite-lifecycle) for the full contract.
