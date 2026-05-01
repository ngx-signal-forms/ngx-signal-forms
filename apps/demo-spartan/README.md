# demo-spartan

Reference wrapper integrating the **ngx-signal-forms toolkit** on top of
**Spartan Components** (`@spartan-ng/brain`). This is the canonical "host
directive" example for the toolkit's renderer-token seam — Spartan's
directive-first composition model maps directly onto how the toolkit
exposes its own seams (`NgxSignalFormControlSemanticsDirective`,
`NgxSignalFormAutoAria`).

- **Spartan version pinned:** `@spartan-ng/brain@0.0.1-alpha.682`
- **Toolkit version:** consumed in-tree via the workspace tsconfig path
  alias (no `@spartan-ng/*` reaches `packages/toolkit/package.json`).

## What this shows

- A custom wrapper component (`spartan-form-field`) that **composes**
  Spartan's `BrnField` host directive instead of re-skinning Spartan's
  internals.
- Renderer registration for both error and hint slots:
  - `NGX_FORM_FIELD_ERROR_RENDERER` falls back to
    `SpartanFormFieldErrorComponent` (a local `hlm-error` look-alike).
  - Hint output flows through `<ngx-form-field-hint>` projected as
    `<small data-slot="form-description">`-style copy.
- `NgxSignalFormControlSemanticsDirective` declared **alongside** Spartan's
  `[brnInput]` / native `<select>` / `<input type=checkbox>` directives —
  the toolkit reads control semantics through DI, not DOM heuristics, so
  layering both directives on the same host element is the canonical
  composition pattern.
- One representative form covering text input + select + checkbox.
- Warning rendering exercised via a `validate(..., { kind: 'warn:*' })`
  rule on the `displayName` field.
- Smoke spec asserting `aria-invalid='true'` and `aria-describedby`
  pointing at the rendered error element id.
- A single Playwright spec exercising fill → blur → observe-error.

## Spartan-specific gotchas

### Host-directive ordering

Spartan's `BrnField` is applied as a **host directive** on the wrapper
component itself (`hostDirectives: [{ directive: BrnField, inputs: [...] }]`)
rather than projected inside its template. That keeps Spartan's
`data-invalid` / `data-touched` attributes anchored to the wrapper element
where the styling expects them, while the toolkit's `[formField]`
directive stays attached to the **bound control** inside the wrapper —
not the wrapper itself. Mixing the two scopes (e.g. attaching
`[formField]` to the wrapper) double-binds Angular's submission tracker
and breaks both surfaces.

The wrapper deliberately does **not** compose `BrnFieldControl`. That
host directive is `NgControl`-based (Reactive Forms / Template-driven),
and Angular Signal Forms expose state through `[formField]` / `FieldState`
instead. Layering both would attempt to register the same control twice
and double-write `aria-describedby` (Spartan's `BrnFieldA11yService` chain
plus the toolkit's auto-ARIA chain). The toolkit's auto-ARIA owns the
ARIA writes — Spartan's a11y service stays out of the picture.

### Tailwind / CSS-variable interplay

Spartan's `helm` styled components (the `hlm-*` package) are not
distributed as a runtime npm package — they ship as a `@spartan-ng/cli`
generator that copies code into the consumer's tree. To keep this
reference reproducible (no codegen step in CI), the demo bundles a
hand-rolled `styles.css` with the same shape: `--background`,
`--foreground`, `--destructive`, `--ring`, `--radius`, etc. as HSL CSS
variables, so a real Spartan project's `hlm-tailwind-preset.css` can be
dropped in without rewriting the wrapper.

When integrating into a real Spartan-themed app:

1. Run `npx @spartan-ng/cli@latest ui form-field input select checkbox label`
   to copy the `hlm-*` styled components into your tree.
2. Replace this app's `styles.css` with the generated
   `hlm-tailwind-preset.css` import.
3. Swap `SpartanFormFieldErrorComponent` for the generated `HlmError` —
   the toolkit's `NGX_FORM_FIELD_ERROR_RENDERER` is the single point of
   change.

The wrapper's `data-spartan-form-field` attribute is the join point
between Spartan's `helm` selectors and the toolkit's chrome — your
generated styling can target it without forking the wrapper.

## What's not shown

- Spartan's `brn-select` / `brn-combobox` overlay-based controls. Those
  rely on `BrnPopover` and an `*hlmSelectPortal` template, which add a
  layer of indirection that distracts from the seam under test. A native
  `<select>` carries the toolkit semantics just as cleanly.
- `BrnFieldControl` and Spartan's `ErrorStateMatcher`. See "Host-directive
  ordering" above — the toolkit owns control state via `[formField]`.
- Light / dark theming. The hand-rolled CSS only ships a light palette;
  flipping themes in a real Spartan app uses Spartan's `cssVar` toolchain.
- Submission patterns (`submitWithWarnings`, async submission, server
  errors). Out of scope per the PRD; the existing `apps/demo`
  "Submission patterns" page covers those independently of the wrapper
  choice.
- A floating-label appearance. Spartan's design language doesn't ship
  one; the wrapper sticks to the `hlm-form-field` vertical-stack default.

## ARIA verification

The toolkit's `NgxSignalFormAutoAria` directive owns the following
attributes on the bound control:

- `aria-invalid` — flips to `true` when the field has blocking errors and
  the strategy says they should be visible (`on-touch` after blur, or
  `immediate` before blur).
- `aria-required` — reflects `required()` from Signal Forms.
- `aria-describedby` — chains projected hint ids + the rendered error /
  warning element ids, in DOM order.

Verify in DevTools:

```bash
pnpm nx serve demo-spartan
# Open http://localhost:4220, focus + blur the empty Display name field.
# In DevTools, the <input id="display-name"> shows:
#   aria-invalid="true"
#   aria-describedby="display-name-hint display-name-error"
# Type "Ada" + blur → the warning ID swaps in:
#   aria-describedby="display-name-hint display-name-warning"
```

The smoke spec
([`account-preferences-form.spec.ts`](src/app/form/account-preferences-form.spec.ts))
encodes the same expectations through `@testing-library/angular`. The
single Playwright spec
([`account-preferences.spec.ts`](../demo-spartan-e2e/src/account-preferences.spec.ts))
re-runs the fill → blur → observe-error path through a Vite-compiled
build.

## Run it

```bash
pnpm nx serve demo-spartan          # dev server on :4220
pnpm nx run demo-spartan:build      # production build
pnpm nx run demo-spartan:test       # smoke spec (vitest)
pnpm nx run demo-spartan-e2e:e2e    # Playwright spec
```
