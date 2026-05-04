# `@ngx-signal-forms/toolkit` × PrimeNG reference

A runnable reference showing how to integrate
[`@ngx-signal-forms/toolkit`](../../packages/toolkit) on top of
[PrimeNG](https://primeng.org). Sibling references for
[Material](../demo-material) and [Spartan](../demo-spartan) live alongside
this app — diff them to see which contracts are universal vs design-system
specific.

## What this shows

- A custom **`PrimeFormFieldComponent`** wrapper that satisfies the four
  contracts documented in [`docs/CUSTOM_WRAPPERS.md`](../../docs/CUSTOM_WRAPPERS.md):
  - provides `NGX_SIGNAL_FORM_FIELD_CONTEXT` with a `fieldName` signal
  - provides `NGX_SIGNAL_FORM_HINT_REGISTRY` derived from projected
    `<ngx-form-field-hint>` children
  - injects `NGX_FORM_FIELD_ERROR_RENDERER` with `{ optional: true }` and
    falls back to `NgxFormFieldError`
  - keeps `NgxSignalFormAutoAria` in scope where consumers declare the
    `[formField]` control
- A single **`NgxPrimeFormBundle`** export that consumers can drop into
  their component's `imports` (mirrors `NgxMatFormBundle` /
  `NgxSpartanFormBundle`).
- A single **`provideNgxPrimeForms()`** bootstrap helper that registers
  both renderer tokens in one call (mirrors `provideNgxMatForms()`).
- A custom **`PrimeFieldErrorComponent`** registered through
  `provideFormFieldErrorRenderer({ component: ... })` that emits PrimeNG's
  `<small class="p-error">` idiom (and `<small class="p-warn">` for
  warnings) — so error display matches the rest of a Prime-themed app.
- A narrow **`PrimeSelectControlComponent`** compatibility shim for
  PrimeNG's `<p-select>`. The real integration seam in this demo is still
  the toolkit wrapper/renderer layer; this shim exists only because direct
  `[formField]` on `<p-select>` collides with PrimeNG's inherited
  Angular-forms-style inputs, so Signal Forms needs a clean
  `FormValueControl` host.
- A custom **`PrimeFieldHintComponent`** registered through
  `provideFormFieldHintRenderer({ component: ... })` so the hint slot is
  ready for the toolkit's future dynamic-outlet hint mode without any
  template changes.

The wrapper composes the toolkit's headless primitives directly
(`createFieldNameResolver`, `toHintDescriptors`,
`createErrorRendererInputs`, `createAriaInvalidSignal`,
`createAriaRequiredSignal`, `createShowErrorsComputed`) so the seam never
drifts from the canonical `NgxFormFieldWrapper` as the toolkit evolves.

## Quick start

```ts
// main.ts
bootstrapApplication(AppComponent, {
  providers: [
    provideNgxPrimeForms(),
    // …PrimeNG / animations / signal-forms-config
  ],
});
```

```ts
// my-form.component.ts
@Component({
  imports: [
    FormField,
    NgxSignalFormToolkit,
    NgxFormFieldHint,
    NgxPrimeFormBundle,
    /* PrimeNG modules */
  ],
  template: `
    <prime-form-field [ngxPrimeFormField]="form.email" fieldName="email">
      <label for="email">Email</label>
      <input
        id="email"
        pInputText
        [formField]="form.email"
        ngxSignalFormControl="input-like"
      />
    </prime-form-field>
  `,
})
export class MyFormComponent {
  /* … */
}
```

The aliased input (`[ngxPrimeFormField]`) avoids a subtle collision with
Angular Signal Forms' own `FormField` directive (selector `[formField]`),
which would otherwise double-bind to the wrapper element.

## Demo coverage

`ProfileFormComponent` exercises every contract above on a representative
form:

- text input with `p-iconfield` + `pInputText`
- select via `<prime-select-control>` (a minimal compatibility shim around
  PrimeNG's current `<p-select>` primitive — see version pin below)
- checkbox via `<p-checkbox>`
- a non-blocking warning on the email field, exercising the warnings
  branch of the renderer

`NgxSignalFormControlSemanticsDirective` is declared on every control
(`ngxSignalFormControl="input-like"`, `"standalone-field-like"`,
`"checkbox"`) so the toolkit knows the control kind without DOM
heuristics — a must-have when bound controls live inside PrimeNG's host
components, and the input the wrapper queries via `contentChildren` for
tier-3 field-name resolution and the dev-mode missing-control assertion.

## Design-system version pin

| Package            | Version pinned by this demo |
| ------------------ | --------------------------- |
| `primeng`          | `21.1.6`                    |
| `@primeuix/themes` | `2.0.3`                     |
| `primeicons`       | `7.0.0`                     |

The toolkit itself is unchanged — `packages/toolkit/package.json` declares
no `primeng` / `primeicons` / `@primeuix/*` entries, and the
`toolkit-isolation` CI job verifies that on every PR.

## Design-system-specific gotchas

### Floating-label modes

PrimeNG ships **multiple** floating-label idioms (`pFloatLabel` directive,
`p-floatlabel` component, `<input ifta>` "in-form-the-anchor" mode, plus
the unwrapped `<label>`-above variant used in this demo). They differ in
how the label slides on focus and on whether the label sits inside or
outside the control's bordered container.

This reference picks the **simplest** variant — a plain `<label>` rendered
above the control, shown unconditionally. Picking another mode is the
consumer's call: `PrimeFormFieldComponent` projects the label through
`<ng-content select="label" />`, so any of PrimeNG's floating-label
directives can be applied to that label without changes to the wrapper.

The other floating-label modes are intentionally **out of scope** — they
introduce their own ARIA wiring and styling tokens that are orthogonal
to the toolkit seam.

### Why the demo keeps a tiny wrapper for `p-select`

Tim Deschryver's directive-first pattern is the right default when you only
need to configure or extend a third-party component. This demo follows that
spirit for the actual integration seam: the Prime field wrapper, renderer
tokens, hint registry, and control semantics are all toolkit primitives
composed around PrimeNG.

`<p-select>` is the exception. PrimeNG already supports Angular's CVA-based
forms APIs, but Angular Signal Forms generates a broader host contract on a
direct `[formField]` binding (including inputs like `pattern`). PrimeNG's
inherited input surface does not line up with that contract, so a plain
directive on `<p-select>` still fails type-checking.

That is why this demo keeps a tiny wrapper component for select only: it
creates a clean `FormValueControl<string>` host for Signal Forms while still
rendering the real PrimeNG control inside. The wrapper is a compatibility
shim, not the main integration story.

### ARIA writes target the host element, not PrimeNG's inner input

PrimeNG's host components (`<p-select>`, `<p-checkbox>`,
`<p-multiselect>`, …) wrap an internal `<input>` — that internal input is
what owns visual focus and the WAI-ARIA combobox / checkbox role. The
toolkit's `[formField]` directive (and therefore `NgxSignalFormAutoAria`)
is declared on the **outer** PrimeNG host, so `aria-invalid` and
`aria-describedby` land there.

For the text-input case (`<input pInputText [formField]>` directly bound)
this is a non-issue — the bound element is also the focusable element AT
will read.

For host-component cases there is an additional twist: `<p-select>` and
`<p-checkbox>` write their **own** `aria-describedby` (e.g. PrimeNG's
auto-generated `pn_id_n-error` IDs) on the host element. That write
clobbers anything `NgxSignalFormAutoAria` would put there, so the
toolkit's `{fieldName}-error` ID never lands in the host's
`aria-describedby` chain — the e2e spec in this folder asserts that
boundary explicitly.

The Prime-flavoured error element still renders with the correct id and
live-region semantics — only the chain from the host to that id is
broken. Two ways to bridge:

- Implement a per-control bridge directive that mirrors the Material
  reference's `NgxMatTextControl` / `NgxMatSelectControl` /
  `NgxMatCheckboxControl` pattern
  (`apps/demo-material/src/app/wrapper/control-directives.ts`). Each
  bridge sets `aria-mode="manual"` (so auto-aria leaves the control
  alone) and forwards the inner-input's `aria-describedby` through a
  toolkit-driven composition. That would be the next step if this demo grows
  into a first-class `@ngx-signal-forms/primeng` package. For the reference
  app, the select shim keeps the integration understandable while the rest of
  the wrapper seam stays purely toolkit-driven.
- Use `<input pInputText>` directly where AT compatibility through the
  bound control's own `aria-describedby` is critical. The text-input
  path is fully covered by the smoke + Playwright specs.

The smoke + Playwright specs cover the text-input path end-to-end. The
host-component path is verified at the wrapper level (host data
attributes, error element id and role) and at the boundary (the
PrimeNG-owned `aria-describedby` is asserted to be present and
non-empty, but its content is left to PrimeNG).

### Theme-token interplay

PrimeNG ships several themes (Aura, Lara, Material, Nora, plus user-defined
presets). Each exposes a different set of CSS custom properties — Aura's
`--p-content-background` is `--surface-card` in Lara, etc. The toolkit
exposes its own token namespace
(`--ngx-form-field-*`, `--ngx-signal-form-*`); the two namespaces are
_independent_, and either can be overridden without affecting the other.

This reference pins **`@primeuix/themes/aura`** with no overrides
(`prefix: 'p'`, `darkModeSelector: 'system'`, `cssLayer: false`). Theme
customisation is intentionally out of scope — the goal is to show the
toolkit seam, not to ship a styled showcase.

### Timing: ship now or wait for PrimeNG v22?

Current PrimeNG documentation shows first-class support for Angular's
template-driven and reactive forms APIs (`ngModel`, `formControlName`), but
not yet a native Angular Signal Forms surface. Angular's own Signal Forms
guidance explicitly allows custom `FormValueControl` components as the bridge
for third-party libraries that have not caught up yet.

That makes this demo valid **today** as a documented compatibility reference:

- keep it if the goal is "how to use `@ngx-signal-forms/toolkit` with
  PrimeNG as it exists now"
- revisit and simplify it once PrimeNG v22 support is actually adopted in
  this workspace

In other words: do **not** block the PrimeNG demo on v22, but do document it
as a pre-v22 integration seam rather than the final long-term shape.

If you need to bridge tokens (e.g. mirror PrimeNG's `--p-form-field-invalid-border-color`
into the toolkit's `--ngx-form-field-error-color`), do it in your app's
`styles.css`. The wrapper itself does not consume Prime tokens directly so
that the same wrapper can render under any Prime theme.

## What's _not_ shown

- PrimeNG's `pFloatLabel`, `pFloatLabelInside`, or `<p-floatlabel>` modes —
  see the gotchas section above.
- Theming or token customisation — the demo uses Aura unmodified.
- PrimeNG's filled / outlined `pInputText` variants. Pick whichever your
  product uses; the wrapper is variant-agnostic.
- `p-multiselect`, `p-autocomplete`, `p-calendar`, `p-radiobutton`, etc.
  The seam is similar; this demo uses one representative select path
  (`p-select` through `PrimeSelectControlComponent`) to prove the current
  compatibility contract.
- A submission backend. The form's submit handler logs the JSON payload
  inline so the integration is self-contained.
- Theme dark / light toggling. PrimeNG's Aura preset auto-switches with
  `darkModeSelector: 'system'`, which is enough for the reference.

## ARIA verification

The smoke spec (`profile-form.smoke.spec.ts`) and the Playwright spec
(`apps/demo-primeng-e2e/src/profile-form.spec.ts`) jointly assert:

- when the email field is invalid, the Prime error element renders as
  `<small class="p-error">` with the `{fieldName}-error` id;
- `aria-invalid='true'` is wired on the bound control by
  `NgxSignalFormAutoAria` once the field is touched;
- `aria-describedby` on the bound control points at the rendered error
  element id;
- the warning branch (`<small class="p-warn">`) renders alongside the
  error idiom for the personal-email warning.

## Scripts

```bash
pnpm nx serve demo-primeng       # http://localhost:4220
pnpm nx run demo-primeng:build   # production build
pnpm nx run demo-primeng:test    # vitest smoke specs
pnpm nx run demo-primeng-e2e:e2e # playwright spec
pnpm nx lint demo-primeng        # oxlint
```
