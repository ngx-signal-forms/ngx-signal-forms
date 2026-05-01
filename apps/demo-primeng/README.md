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
- A custom **`PrimeFieldErrorComponent`** registered through
  `provideFormFieldErrorRenderer({ component: ... })` that emits PrimeNG's
  `<small class="p-error">` idiom (and `<small class="p-warn">` for
  warnings) — so error display matches the rest of a Prime-themed app.
- A custom **`PrimeFieldHintComponent`** registered through
  `provideFormFieldHintRenderer({ component: ... })` so the hint slot is
  ready for the toolkit's future dynamic-outlet hint mode without any
  template changes.
- One representative form (`ProfileFormComponent`) covering:
  - text input with `p-iconfield` + `pInputText`
  - select via `<p-select>` (the current PrimeNG primitive — see version pin
    below)
  - checkbox via `<p-checkbox>`
  - a non-blocking warning on the email field, exercising the warnings
    branch of the renderer
- `NgxSignalFormControlSemanticsDirective` declared on each control
  (`ngxSignalFormControl="input-like"`, `"standalone-field-like"`,
  `"checkbox"`) so the toolkit knows the control kind without DOM
  heuristics — a must-have when bound controls live inside Prime's host
  components.

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
  The seam is identical; one representative select primitive (`p-select`)
  proves the contract.
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
