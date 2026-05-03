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
- Real `@spartan-ng/helm` components scaffolded into `libs/ui` via
  `@spartan-ng/cli` (`hlmInput`, `<hlm-select>`, `<hlm-checkbox>`,
  `[hlmLabel]`) — the demo exercises the actual Spartan toolchain rather
  than a CSS impersonation.
- Renderer registration for both error and hint slots:
  - `NGX_FORM_FIELD_ERROR_RENDERER` falls back to
    `NgxSpartanFormFieldError` (a local `hlm-error` look-alike that
    splits blocking errors and warnings into role="alert" / role="status"
    live regions).
  - Hint output flows through `<ngx-form-field-hint>` projected as
    `<small data-slot="form-description">`-style copy.
- `NgxSignalFormControlSemanticsDirective` declared **alongside** the
  helm directives (`[hlmInput]` / `<hlm-select>` / `<hlm-checkbox>`) —
  the toolkit reads control semantics through DI, not DOM heuristics, so
  layering both directives on the same host element is the canonical
  composition pattern.
- A wrapper-scoped `NgxSpartanAriaDescribedByBridge` that swaps Brain's
  `BrnFieldA11yService` (via component-level `useClass`) so Brain's
  `BrnFieldControlDescribedBy` host binding writes the toolkit-managed
  `aria-describedby` IDs onto the helm input host element — see the
  "`aria-describedby` interop" section below.
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

### `aria-describedby` interop — `NgxSpartanAriaDescribedByBridge`

`[hlmInput]` declares `BrnFieldControlDescribedBy` as a host directive
that owns `aria-describedby` on the helm input host element via a host
binding fed by `BrnFieldA11yService`. Brain populates the service
through label/hint registrations in `NgControl`-based reactive forms;
Angular Signal Forms (`[formField]`) does not run those registrations,
so the toolkit's auto-aria writes the composed id list directly to the
host element — only for Brain's host binding to overwrite those writes
on the next change-detection tick (its `aria-describedby` input alias
does not observe DOM mutations).

`apps/demo-spartan/src/app/wrapper/spartan-aria-describedby-bridge.ts`
provides a wrapper-scoped `BrnFieldA11yService` replacement (registered
via `useClass` at the `<spartan-form-field>` component level — these
providers win over the host-directive provider Brain registers via
`BrnField`). The bridge's `describedBy` signal mirrors the toolkit
composition (hint ids + error/warning ids gated on the strategy), so
`BrnFieldControlDescribedBy` writes the toolkit-managed ids onto the
helm input host element through its own host binding — no DOM
tug-of-war. Brain's original `register*` API is preserved so any other
helm primitive that registers a description id stays compatible. This
is a reusable pattern for any Brain + toolkit interop.

`aria-invalid` and `aria-required` stay owned by the toolkit's
auto-aria — Brain does not write either of those, so no bridge is
needed there.

### Tailwind / CSS-variable interplay

Spartan's `helm` styled components are not distributed as a runtime npm
package — they ship as a `@spartan-ng/cli` generator that copies source
into the consumer's tree. This demo did exactly that: `libs/ui` was
scaffolded via the workspace-root `components.json` config and exposes
`@spartan-ng/helm/*` secondary entry points. The Spartan version is
pinned via the `spartan:` pnpm catalog in `pnpm-workspace.yaml`.

`apps/demo-spartan/src/styles.css` bootstraps Tailwind v4
(`@import 'tailwindcss'` + `tw-animate-css`) and defines the design
tokens helm uses (`--background`, `--foreground`, `--destructive`,
`--ring`, `--radius`, etc.) in `oklch`. Both light and dark palettes
ship; theme flipping uses the `.dark` variant.

The wrapper's `data-spartan-form-field` attribute is the join point
between Spartan's `helm` selectors and the toolkit's chrome — bespoke
styling can target it without forking the wrapper.

## What's not shown

- `BrnFieldControl` and Spartan's `ErrorStateMatcher`. See "Host-directive
  ordering" above — the toolkit owns control state via `[formField]`,
  and Brain's a11y service is replaced by the bridge.
- Submission patterns (`submitWithWarnings`, async submission, server
  errors). Out of scope per the PRD; the existing `apps/demo`
  "Submission patterns" page covers those independently of the wrapper
  choice.
- A floating-label appearance. Spartan's design language doesn't ship
  one; the wrapper sticks to the `hlm-form-field` vertical-stack default.
- Theme switching UI. The `.dark` palette is wired in `styles.css`, but
  there's no toggle in the demo — flip `<html class="dark">` in DevTools
  to verify both palettes resolve through helm's `data-state` selectors.

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
