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
  `<small class="p-error">` idiom for blocking errors plus a demo-local
  `<small class="p-warn">` for non-blocking warnings (`p-error` is the
  documented PrimeNG class; `p-warn` is a wrapper-local class styled in
  `prime-field-error.ts` so the warning slot uses the same Prime visual
  weight without claiming to be a standard PrimeNG hook).
- A narrow **`PrimeSelectControlComponent`** compatibility shim for
  PrimeNG's `<p-select>`. The real integration seam in this demo is still
  the toolkit wrapper/renderer layer; this shim exists only because direct
  `[formField]` on `<p-select>` collides with PrimeNG's inherited
  Angular-forms-style inputs, so Signal Forms needs a clean
  `FormValueControl` host.
- A matching **`PrimeCheckboxControlComponent`** compatibility shim for
  PrimeNG's `<p-checkbox>`, bridging the toolkit's ARIA primitives onto the
  real native `<input type="checkbox">` PrimeNG renders internally (see
  "ARIA writes target the host element" below).
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
- checkbox via `<prime-checkbox-control>` (the same shim pattern applied to
  `<p-checkbox>`, since its native `<input type="checkbox">` needs the same
  host-vs-inner-element ARIA bridging as `<p-select>` — see "ARIA writes
  target the host element" below)
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
| `primeng`          | `21.1.9`                    |
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

### Why the demo keeps tiny wrappers for `p-select` and `p-checkbox`

Tim Deschryver's directive-first pattern is the right default when you only
need to configure or extend a third-party component. This demo follows that
spirit for the actual integration seam: the Prime field wrapper, renderer
tokens, hint registry, and control semantics are all toolkit primitives
composed around PrimeNG.

`<p-select>` and `<p-checkbox>` are the exceptions. PrimeNG already supports
Angular's CVA-based forms APIs, but Angular Signal Forms generates a broader
host contract on a direct `[formField]` binding (including inputs like
`pattern`). PrimeNG's inherited input surface does not line up with that
contract, so a plain directive on either host still fails type-checking —
and, independently, both hosts render their real focusable element as an
_internal_ child rather than on the host itself (see "ARIA writes target
the host element" below), so a plain directive on the host couldn't reach
the right element even if it did type-check.

That is why this demo keeps tiny wrapper components for select and
checkbox: each creates a clean `FormValueControl` host for Signal Forms
while still rendering the real PrimeNG control inside. The wrappers are
compatibility shims, not the main integration story.

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
`<p-checkbox>` would normally write their **own** `aria-describedby`
(e.g. PrimeNG's auto-generated `pn_id_n-error` IDs) onto the inner
combobox/checkbox. Left alone, that write would clobber anything
`NgxSignalFormAutoAria` puts on the host, so the toolkit's
`{fieldName}-error` and `{fieldName}-hint` IDs would never reach the
focusable inner element AT actually reads.

The select and checkbox demos both solve this with a per-control bridge
component (`PrimeSelectControlComponent` and `PrimeCheckboxControlComponent`
in `apps/demo-primeng/src/app/controls/`) that mirrors the Material
reference's `NgxMatSelectControl` pattern. Each shim provides
`NGX_SIGNAL_FORM_ARIA_MODE: 'manual'` so auto-aria leaves the host alone,
then binds the toolkit's `createAriaDescribedBySignal` /
`createAriaInvalidSignal` / `createAriaRequiredSignal` outputs onto the real
inner element:

- `PrimeSelectControlComponent` binds directly onto the inner `<p-select>`
  via `[attr.*]`, and forwards a caller-supplied `ariaLabelledBy` id through
  `<p-select>`'s own `ariaLabelledBy` input so the combobox's accessible
  name comes from the visible `<label>`, not the transient
  placeholder/selected-value content.
- `PrimeCheckboxControlComponent` writes the three ARIA attributes
  imperatively onto the real native `<input type="checkbox">`, reached via
  `Checkbox.inputViewChild` — PrimeNG doesn't forward `aria-describedby` /
  `aria-invalid` / `aria-required` from the host the way it does
  `ariaLabelledBy` / `ariaLabel`, so `[formField]`'s `id`-based `for`
  association on the checkbox's `<label>` already works out of the box, but
  the toolkit's error/hint wiring needs the explicit bridge.

The Playwright spec asserts the select result explicitly: the role combobox
carries `aria-describedby` containing both `profile-role-hint` and
`profile-role-error` tokens (plus `aria-invalid="true"` and
`aria-required="true"`) — the host-component ARIA boundary is verified
end-to-end via `NgxSignalFormAutoAria` + the shim, not just inferred from
the rendered error element's id.

For text inputs (`<input pInputText [formField]>`) the bound element is
the focusable element, so no shim is needed — the smoke + Playwright
specs cover that path end-to-end.

If you build a first-class `@ngx-signal-forms/primeng` package, ship a
matching bridge for every remaining host component (multiselect, calendar,
…) that renders its focusable surface as an internal child. The select and
checkbox shims in this demo are the reference pattern.

### Theme-token interplay

PrimeNG ships several themes (Aura, Lara, Material, Nora, plus user-defined
presets). Each exposes a different set of CSS custom properties — Aura's
`--p-content-background` is `--surface-card` in Lara, etc. The toolkit
exposes its own token namespace
(`--ngx-form-field-*`, `--ngx-signal-form-*`); the two namespaces are
_independent_, and either can be overridden without affecting the other.

This reference pins **`@primeuix/themes/aura`** with effectively no overrides
(`prefix: 'p'`, `darkModeSelector: 'system'`, `cssLayer: false`). Theme
customisation is intentionally out of scope — the goal is to show the
toolkit seam, not to ship a styled showcase.

The **one exception** is a WCAG 2.2 AA fix: Aura's default primary button
renders a white label on emerald-500 (`#10b981` ≈ 2.5:1), below the 4.5:1
contrast threshold. `src/styles.css` darkens the primary button surface to
emerald-700/800 (light scheme only) so the label clears AA. This is the sole
token override; everything else is stock Aura.

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
- Theming or token customisation — the demo uses Aura unmodified, save for a
  single WCAG-AA primary-button contrast override (see "Theme-token interplay").
- PrimeNG's filled / outlined `pInputText` variants. Pick whichever your
  product uses; the wrapper is variant-agnostic.
- `p-multiselect`, `p-autocomplete`, `p-calendar`, `p-radiobutton`, etc.
  The seam is similar; this demo uses two representative host-component
  paths (`p-select` through `PrimeSelectControlComponent`, `p-checkbox`
  through `PrimeCheckboxControlComponent`) to prove the current
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
pnpm nx serve demo-primeng       # http://127.0.0.1:4620
pnpm nx run demo-primeng:build   # production build
pnpm nx run demo-primeng:test    # vitest smoke specs
pnpm nx run demo-primeng-e2e:e2e # playwright spec
pnpm nx lint demo-primeng        # oxlint
```
