# `apps/demo-spartan` — Reference wrapper for Spartan Components

A runnable end-to-end example showing how to integrate
[`@ngx-signal-forms/toolkit`](../../packages/toolkit/README.md) on top of
**Spartan Components** (`@spartan-ng/brain` + `@spartan-ng/helm`). This is
the canonical "host directive" example for the toolkit's renderer-token
seam — Spartan's directive-first composition model maps directly onto how
the toolkit exposes its own seams (`NgxSignalFormControlSemanticsDirective`,
`NgxSignalFormAutoAria`).

The four contracts from
[`docs/CUSTOM_WRAPPERS.md`](../../docs/CUSTOM_WRAPPERS.md) are satisfied
here; per
[ADR-0002 §8](../../docs/decisions/0002-ngx-mat-forms-package-shape.md)
the public surface mirrors the future `@ngx-signal-forms/spartan` package
so a graduation will be a single import-path swap.

## Why use this on Spartan?

Spartan's `helm` inputs already declare `BrnFieldControlDescribedBy` as a
host directive that owns `aria-describedby` on the control's host element,
and `BrnField` already owns `data-invalid` / `data-touched` for styling.
**Spartan-only apps that already use Reactive Forms (`NgControl`-based)
can keep using plain Spartan + helm form wiring** — Brain's
`BrnFieldA11yService` chain already does the right thing there.

This reference wrapper earns its keep when **a Spartan app adopts Angular
Signal Forms (`[formField]`)** and needs Brain's a11y service to consume
the toolkit's id composition instead of its own `register*` calls:

| Toolkit feature                                                                           | Plain Spartan + Reactive Forms | This wrapper                                    |
| ----------------------------------------------------------------------------------------- | ------------------------------ | ----------------------------------------------- |
| Angular Signal Forms (`[formField]`) instead of `NgControl`                               | ✗                              | ✅                                              |
| Unified `errorStrategy` (`on-touch` / `on-submit` / `immediate`) across non-Spartan forms | ✗                              | ✅                                              |
| First-class warnings (`warn:*`, non-blocking, role="status")                              | ✗                              | ✅ rendered through the same `hlm-error` outlet |
| Centralised label / error-message DI (`provideFieldLabels`, `provideErrorMessages`)       | ✗                              | ✅                                              |
| `submittedStatus` state machine (post-submit UI, "submitting…" guards)                    | ✗                              | ✅                                              |
| Brain `BrnField` `data-invalid` / `data-touched` styling tokens                           | ✅                             | ✅ (Brain remains source of truth)              |
| Brain `aria-describedby` ownership on helm controls                                       | ✅                             | ✅ (bridge feeds the toolkit composition in)    |

If none of the rows on the right line up with your app, **prefer plain
Spartan + Reactive Forms**. The wrapper does not change Spartan's styling
or its DOM contract; it adds Signal Forms + strategy + warnings +
centralised DI on top.

## What it looks like

The consumer template uses the aliased `[ngxSpartanFormField]` input
(`[formField]` on the wrapper would collide with Angular Signal Forms'
own `FormField` directive — see
[CUSTOM_WRAPPERS.md → Common pitfalls](../../docs/CUSTOM_WRAPPERS.md#common-pitfalls)):

```html
<form [formRoot]="form" ngxSignalForm>
  <spartan-form-field [ngxSpartanFormField]="form.displayName">
    <label hlmLabel for="display-name">Display name</label>
    <input
      hlmInput
      id="display-name"
      [formField]="form.displayName"
      ngxSignalFormControl="input-like"
    />
    <ngx-form-field-hint
      >Public name shown on your profile.</ngx-form-field-hint
    >
  </spartan-form-field>
</form>
```

```ts
import { NgxSpartanFormBundle } from './wrapper/spartan-form-field';

@Component({
  imports: [
    NgxSpartanFormBundle, // wrapper + semantics directive
    NgxSignalFormToolkit, // ngxSignalForm + auto-ARIA
    NgxFormFieldHint, // hint element
    HlmInput,
    HlmLabel, // helm directives
  ],
  // ...
})
export class MyForm {
  /* ... */
}
```

`NgxSpartanFormBundle` is the import bundle for the wrapper itself plus
`NgxSignalFormControlSemanticsDirective`. The error renderer
(`NgxSpartanFormFieldError`) is mounted dynamically via
`*ngComponentOutlet` and resolved through `NGX_FORM_FIELD_ERROR_RENDERER`,
so it is intentionally not in the bundle — see
[Customising the error renderer](#customising-the-error-renderer) below.

## What's wired

```text
src/app/
  form/                                form + validations + smoke spec
  wrapper/
    spartan-form-field.ts              the wrapper component (BrnField host directive + inline BrnFieldA11yService factory)
    spartan-form-field-error.ts        default error renderer (role="alert" + role="status"); resolves messages via `createErrorMessageSignal` so it inherits the toolkit's 3-tier cascade (validator message → `NGX_ERROR_MESSAGES` → default)
```

- A custom wrapper component (`spartan-form-field`) that **composes**
  Spartan's `BrnField` host directive instead of re-skinning Spartan's
  internals.
- Real `@spartan-ng/helm` components scaffolded into `libs/spartan/ui` via
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
- A wrapper-scoped `BrnFieldA11yService` replacement, registered via an
  inline `useFactory` provider on `<spartan-form-field>` that delegates
  to the toolkit's `createAriaDescribedByBridge` primitive — Brain's
  `BrnFieldControlDescribedBy` host binding then writes the
  toolkit-managed `aria-describedby` IDs onto the helm input host
  element. See the "`aria-describedby` interop" section below.
- One representative form covering text input + select + checkbox.
- Warning rendering exercised via a `validate()` callback on the
  `displayName` field that returns a `ValidationError` with
  `kind: 'warn:...'`.
- Smoke spec asserting `aria-invalid='true'` and `aria-describedby`
  pointing at the rendered error element id.
- A single Playwright spec exercising fill → blur → observe-error.

## Customising the error renderer

`NgxSpartanFormFieldError` is the default; consumers swap it via the
toolkit's standard `provideFormFieldErrorRenderer` family — same pattern
as the canonical wrapper, no Spartan-specific helper needed:

```ts
// Per app (environment scope)
bootstrapApplication(App, {
  providers: [
    provideFormFieldErrorRenderer({ component: MyBrandedSpartanError }),
  ],
});

// Per component (component scope)
@Component({
  providers: [
    provideFormFieldErrorRendererForComponent({
      component: MyBrandedSpartanError,
    }),
  ],
  // ...
})
export class CheckoutForm {}
```

A custom renderer receives the toolkit's standard renderer-input contract
(`{ formField, strategy, submittedStatus }`). See
[CUSTOM_WRAPPERS.md → The renderer interface](../../docs/CUSTOM_WRAPPERS.md#the-renderer-interface).

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

The wrapper itself doesn't add a second `BrnFieldControl` — but that's
not because `BrnFieldControl` is reactive-forms-only. **It isn't.**
Angular signal forms' `FormField` directive provides an interop
`NgControl` on every bound control, and Brain 1.0.4 detects it
(`createStateTracker()` picks its `SignalStateTracker` branch over the
reactive-forms `ReactiveStateTracker`) and tracks it live — this is
exactly why `data-touched` / `data-dirty` / `data-matches-spartan-invalid`
reflect real field state on every helm control in this demo, with no
`FormControl` anywhere. The helm directives (`[hlmInput]`, `[brnSelect]`,
`brn-checkbox`) each bring their own `BrnFieldControl` host directive
already, so the wrapper doesn't need to add one.

What the wrapper — and the toolkit's auto-ARIA in general — does _not_
uniformly own is the ARIA writes. See "`aria-invalid` ownership varies
per control" below: `BrnInput`, `BrnSelectTrigger`, and `BrnCheckbox`
each host-bind their own `aria-invalid` straight off `BrnFieldControl`'s
raw (ungated) `invalid` signal, independently of any strategy. Whether
auto-ARIA's strategy-gated value wins depends on whether `[formField]`
happens to sit on the exact DOM node Brain writes to.

### `aria-describedby` interop — wrapper-scoped `BrnFieldA11yService`

`[hlmInput]` declares `BrnFieldControlDescribedBy` as a host directive
that owns `aria-describedby` on the helm input host element via a host
binding fed by `BrnFieldA11yService`. Brain populates the service
through label/hint registrations in `NgControl`-based reactive forms;
Angular Signal Forms (`[formField]`) does not run those registrations,
so the toolkit's auto-aria writes the composed id list directly to the
host element — only for Brain's host binding to overwrite those writes
on the next change-detection tick (its `aria-describedby` input alias
does not observe DOM mutations).

`apps/demo-spartan/src/app/wrapper/spartan-form-field.ts` provides a
wrapper-scoped `BrnFieldA11yService` replacement via an inline
`useFactory` at the `<spartan-form-field>` component level (these
providers win over the host-directive provider Brain registers via
`BrnField`). The factory delegates to the toolkit's
`createAriaDescribedByBridge` primitive — its `describedBy` signal
mirrors the toolkit composition (hint ids + error/warning ids gated on
the strategy), so `BrnFieldControlDescribedBy` writes the
toolkit-managed ids onto the helm input host element through its own
host binding — no DOM tug-of-war. Brain's original `register*` API is
preserved so any other helm primitive that registers a description id
stays compatible. This is a reusable pattern for any Brain + toolkit
interop — the bridge primitive is exposed from
`@ngx-signal-forms/toolkit/headless`.

This bridge works for the text input because `BrnFieldControlDescribedBy`
writes onto `[hlmInput]`'s own host element — the same element that's in
the accessibility tree. It does **not** by itself fix the checkbox: see
"Checkbox: `aria-describedby` needs an explicit hookup" below.

### Checkbox: `aria-describedby` needs an explicit hookup

`<hlm-checkbox>`'s host is `class: 'contents peer'` — `display: contents`,
invisible to the accessibility tree. `HlmCheckbox` also brings
`BrnFieldControlDescribedBy` as a `hostDirective`, so both Brain's own
write and auto-ARIA's write land on that invisible host; neither reaches
the real `role="checkbox"` button rendered inside `<brn-checkbox>`.

`HlmCheckbox` does expose `aria-describedby` as a genuine `@Input()`
(separate from the host-directive one) that it forwards straight to
`<brn-checkbox [aria-describedby]="ariaDescribedby()">` — and that
binding _does_ land on the real button. The consumer template feeds this
wrapper's composed `toolkitAriaDescribedBy` signal into it explicitly,
via an exported template reference:

```html
<spartan-form-field
  [ngxSpartanFormField]="form.newsletter"
  #newsletterField="ngxSpartanFormField"
>
  <hlm-checkbox
    ngxSignalFormControl="checkbox"
    [formField]="form.newsletter"
    [aria-describedby]="newsletterField.toolkitAriaDescribedBy()"
  />
  ...
</spartan-form-field>
```

`NgxSpartanFormField` exports itself as `ngxSpartanFormField` for exactly
this purpose. Brain's own describedby write onto the `display: contents`
host still happens — it's harmless, just invisible to AT — so no opt-out
is needed.

### `aria-invalid` ownership varies per control

Auto-ARIA does not uniformly own `aria-invalid` across every helm
control — whether its strategy-gated write "wins" over Brain's own raw
(ungated) host binding depends entirely on _where_ Brain's write lands
relative to `[formField]`:

- **Text input** — `[formField]` sits on the same `<input>` element
  `BrnInput` host-binds `aria-invalid` to. Auto-ARIA's `afterEveryRender`
  write runs after Brain's per-change-detection write and overwrites it
  with the strategy-gated value every render. Effectively shared
  ownership, with auto-ARIA writing last.
- **Select** — `[formField]` sits on `<hlm-select>`, one level above the
  real `role="combobox"` button rendered inside `<hlm-select-trigger>`'s
  own template. Auto-ARIA can only reach the `hlm-select` host, never the
  button an AT actually reads, so Brain's raw `aria-invalid` (from
  `BrnSelectTrigger`) would otherwise show `"true"` on a pristine,
  required-and-empty select before it's touched.
  `libs/spartan/ui/select/src/lib/hlm-select-trigger.ts` fixes this at
  the source instead: it reads `BrnFieldControl.spartanInvalid()` —
  Brain's own touched-gated invalid signal, the same one driving the
  `data-matches-spartan-invalid` destructive-ring styling — and writes
  the gated `aria-invalid` onto the button in `afterEveryRender`,
  deterministically after Brain's raw write. No toolkit coupling needed.
- **Checkbox** — `newsletter` has no validators in this demo, so its
  `aria-invalid` is always `false` regardless of gating; not fixed here
  because there's nothing to observe. A required checkbox would hit the
  same displaced-write problem as the select (`[formField]` on
  `<hlm-checkbox>`, whose host is `display: contents`), and would need
  the same kind of fix.

`aria-required` stays owned by the toolkit's auto-aria — Brain does not
write it.

### `hlm-select`: pin `fieldName` explicitly

Helm select splits its concerns across two elements: `<hlm-select>`
hosts the form control (and the toolkit's semantics directive), while
the native focusable surface — and the visible `<label for=…>` target —
lives on `<hlm-select-trigger>`. The wrapper's tier-3 field-name
fallback (bound-control host `id`) reads `<hlm-select>`'s id, which is
invisible to the label, so a refactor that drops the host id silently
breaks `aria-describedby` correlation. Pin the namespace with
`[fieldName]="'plan'"` on `<spartan-form-field>` instead of relying on
the fallback. The text-input and checkbox controls don't have this
split, so they can rely on label-`for=` resolution (tier-2).

## What's not shown

- Overriding Spartan's `ErrorStateMatcher` (`provideErrorStateMatcher`).
  `HlmSelectTrigger`'s `aria-invalid` gating reads
  `BrnFieldControl.spartanInvalid()`, which is driven by whichever
  `ErrorStateMatcher` is registered (default: `invalid && touched` — the
  same semantics as this demo's `on-touch` default). A demo configuring a
  different `errorStrategy` and wanting the select's `aria-invalid` to
  track it exactly (rather than Brain's own touched gate) would need to
  provide a custom `ErrorStateMatcher`, or feed the wrapper's own
  strategy-aware `ariaInvalidValue` into the trigger instead — out of
  scope here since Brain's default already matches this demo's strategy.
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
# Open http://127.0.0.1:4621, focus + blur the empty Display name field.
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

## Demo-internal notes

### Tailwind / CSS-variable interplay

Spartan's `helm` styled components are not distributed as a runtime npm
package — they ship as a `@spartan-ng/cli` generator that copies source
into the consumer's tree. This demo did exactly that: `libs/spartan/ui` was
scaffolded via the workspace-root `components.json` config and exposes
`@spartan-ng/helm/*` secondary entry points. The Spartan version is
pinned via the `spartan:` pnpm catalog in `pnpm-workspace.yaml`.

`apps/demo-spartan/src/styles.css` bootstraps Tailwind v4
(`@import 'tailwindcss'` + `tw-animate-css`) and defines the design
tokens helm uses (`--background`, `--foreground`, `--destructive`,
`--ring`, `--radius`, etc.) in `oklch`. Both light and dark palettes
ship; theme flipping uses the `.dark` variant.

`@source '../../../libs/spartan/ui'` is what makes Tailwind's JIT scan
the vendored helm components for the utility classes embedded in their
templates — Nx runs Vite with `cwd: apps/demo-spartan` (see
`project.json`'s `build`/`serve` options), so Tailwind's own auto-detection
never reaches `libs/`. If this glob ever points at the wrong path (it's
resolved relative to the stylesheet, not the repo root), helm components
render structurally correct but completely unstyled — no build error, no
failing test, just a silently unstyled `dist/` bundle. Verify after
touching this line by building and grepping the output CSS for a
helm-only class that isn't used anywhere in this demo's own templates
(e.g. `data-highlighted`, from `hlm-select-item`):

```bash
pnpm nx build demo-spartan
grep -c 'data-highlighted' dist/apps/demo-spartan/assets/*.css   # must be > 0
```

The wrapper's `data-spartan-form-field` attribute is the join point
between Spartan's `helm` selectors and the toolkit's chrome — bespoke
styling can target it without forking the wrapper.

### Error/warning color overrides for `.dark`

The toolkit's own error/warning colors (`--ngx-signal-form-error-color` /
`--ngx-signal-form-warning-color`, consumed by
`packages/toolkit/assistive`) default to tracking `prefers-color-scheme`
directly — they do **not** detect a `.dark` ancestor class. Since this
demo themes via a `.dark` class toggled independently of the OS
preference (see `:root` / `.dark` above), `styles.css` sets both custom
properties explicitly per theme:

```css
:root {
  --ngx-signal-form-error-color: #db1818;
  --ngx-signal-form-warning-color: #a16207;
}
.dark {
  --ngx-signal-form-error-color: #fca5a5;
  --ngx-signal-form-warning-color: #fcd34d;
}
```

Without this, an explicit-light UI on an OS-prefers-dark machine (or vice
versa) would show the wrong theme's error colors. `apps/demo` follows the
same convention for the same reason.

## Pinned versions

| Package             | Version               |
| ------------------- | --------------------- |
| `@spartan-ng/brain` | `1.0.4`               |
| `@spartan-ng/cli`   | (catalog: `spartan:`) |
| `@ng-icons/core`    | `>=32.0.0 <34.0.0`    |
| `@ng-icons/lucide`  | `>=32.0.0 <34.0.0`    |
| `tw-animate-css`    | (catalog: `spartan:`) |

The toolkit itself is consumed in-tree via the workspace tsconfig path
alias (no `@spartan-ng/*` reaches `packages/toolkit/package.json`).

## Run it

```bash
pnpm nx serve demo-spartan          # dev server on http://127.0.0.1:4621
pnpm nx run demo-spartan:build      # production build
pnpm nx run demo-spartan:test       # smoke spec (vitest)
pnpm nx run demo-spartan-e2e:e2e    # Playwright spec
```
