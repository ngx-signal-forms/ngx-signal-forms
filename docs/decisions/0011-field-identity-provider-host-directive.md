# ADR-0011: Field Identity Is Provided by a Host Directive, Not by Promoted Writers

## Status

Accepted

## Date

2026-08-17

## Context

Issue [#387](https://github.com/ngx-signal-forms/ngx-signal-forms/issues/387) asked whether `NgxFieldIdentity`'s five `set*` writers should become the supported surface for third-party wrapper authors. Two capability gaps motivated the question.

**Field naming.** `NgxSignalFormAutoAria` derives a field name from the bound control's `id` attribute unless an ancestor provides an `NgxFieldIdentity`, and only `NgxFormFieldWrapper` ever did. A custom wrapper therefore could not use a field name that differed from the control's DOM `id`. That breaks for a third-party widget that generates its own inner input id, and for a `role="group"` cluster whose name belongs to the group rather than to any single control. The generated `{fieldName}-error` id then disagrees with what the wrapper rendered — a dangling `aria-describedby`, which axe reports as `aria-valid-attr-value` and which leaves the error text unreachable by assistive technology. `NGX_SIGNAL_FORM_FIELD_VISIBILITY_REGISTRY` cannot rescue this: its lookup is keyed on the same DOM-derived name.

**Stale `aria-invalid`.** The gate that removes `aria-invalid` from a control with no layout box read the wrapper-published `NgxFieldIdentity.isControlVisible`, so it only ever fired for the built-in wrapper. A custom wrapper inside a collapsed `<details>`, an inactive tab, or a non-current wizard step kept a stale `aria-invalid` on a hidden control. The only escape was `NGX_SIGNAL_FORM_ARIA_MODE: 'manual'` — forfeiting all of auto-aria to fix one attribute.

The build had already answered the literal question. `strip-internal-members.mjs` removes `@internal` members from the published `.d.ts`, so the writers are not public today and promoting them would be new API, not a status-quo confirmation.

## Decision

### 1. Ship a selectorless host directive, not promoted writers

`NgxFieldIdentityProvider` is a `@Directive` with `providers: [NgxFieldIdentity]` and one input, composed onto a wrapper's host via `hostDirectives`. It drives the `@internal` writers itself. No writer becomes public.

A wrapper author does not actually want the writers — they want an `NgxFieldIdentity` **provided at their own host and already driven**, because auto-aria finds one by walking up the element injector. The directive is that, and it is strictly better than the writers as a contract: one declarative input instead of a five-call, ordering-sensitive protocol, with the "name before element" invariant enforced by the toolkit rather than by consumer discipline. It is also the composition pattern already used across the package.

**No selector.** Placement on the host element is load-bearing — that is the element injector descendants resolve through — and a selector invites putting it somewhere that silently does nothing. Verified against Angular 22.1: `hostDirectives` resolves the directive definition directly and never consults its selector.

**The field-name channel is claimed by provision, not by publication.** Unlike hints and strategy (ADR-0010), providing an identity hands it the naming channel outright: a binding of `null` means "not resolvable yet" and skips ARIA wiring rather than reverting to the control's `id`. A wrapper that declares its own naming has already said the control's `id` is not the name, so falling back to it during a transient unresolved window would emit ids that are wrong rather than absent. Because that makes an un-driven provider harmful rather than inert, a dev-mode diagnostic fires when nothing publishes a name.

### 2. The input is optional, not required

`input<string | null | undefined>(undefined)`, not `input.required`.

A required input on a host directive must be re-exposed by the composing component (`NG2019`, `HOST_DIRECTIVE_MISSING_REQUIRED_BINDING`), and once exposed, every consumer template must bind it (`NG8008`) — attributed to the host directive's class, and firing even with `strictTemplates: false`. Making the input required would therefore make `[fieldName]` mandatory on every wrapper that composes this directive, in every downstream template. `required` buys nothing here anyway: `null` is a legal bound value, so the only thing lost is the unbound-vs-null distinction, which we use for a different purpose.

### 3. `NgxFormFieldWrapper` does **not** compose the directive

This deviates from the plan recorded on the issue, which called for the built-in wrapper to refactor onto the new surface to dogfood it. Angular does not permit it.

A component cannot bind its own host directive's inputs — the only way in is to expose the input to _its_ consumers, which for `NgxFormFieldWrapper` would make `[fieldName]` mandatory on every `<ngx-form-field-wrapper>` in existence. And it could not use the input even if it were bindable: the wrapper's name is DOM-derived in its `afterEveryRender` write phase, strictly after inputs are set.

Composing the directive with its input left unbound would work mechanically, but it would only be reusing a one-line `providers` array while adding a false-positive dev warning and a provider-resolution risk to the most-used component in the package. That is indirection, not dogfooding. The wrapper keeps `providers: [NgxFieldIdentity]` and drives it directly, as an in-package consumer of an in-package service.

The third-party path is instead proven by test fixtures that are genuine custom wrappers, including an axe scan of one inside collapsible markup.

### 4. Auto-aria probes its own host element for the `aria-invalid` gate

Auto-aria no longer reads a wrapper-published visibility flag. It probes its own host element in the `earlyRead` phase of the `afterEveryRender` it already runs.

The probe belongs in a render read phase, not an `effect()`: effects flush strictly before render hooks in the same change-detection cycle, so an effect-based probe reads pre-layout geometry. The initial pre-layout snapshot seeds `true` so ARIA is never stripped on the strength of a probe that ran before the element was laid out.

This closes the gap for every wrapper, built-in or not. It is also more correct for a multi-control cluster, where the wrapper published one control's visibility for all of them and each control should track its own.

Note this is **staleness prevention, not a conformance requirement**. Nothing in WCAG or ARIA mandates removing state from an unrendered element — an unrendered element is not in the accessibility tree at all. The value is that the attribute is correct at the moment the container reopens.

### 5. `isElementCssVisible` fails open instead of guessing from `offsetParent`

The old fallback for runtimes without `Element.checkVisibility()` was `offsetParent !== null`. That is wrong in both directions, and browser-verified in `field-identity.visibility.browser.spec.ts`:

- **False positive** for a collapsed `<details>` and for `content-visibility: hidden` — the headline cases this probe exists for. The fallback reported those controls visible, so on any runtime taking that branch the staleness fix silently did nothing.
- **False negative** for `position: fixed` elements, for `<body>`/`<html>`, and for every environment with no layout engine — jsdom, and any non-rendering host. There it would strip correct ARIA from controls the user can plainly see.

`checkVisibility()` is Baseline 2024, so the fallback is reached only on genuinely old runtimes. Reporting `true` there keeps the pre-existing behaviour instead of stripping ARIA on a guess. The call also now passes `visibilityProperty` and `opacityProperty` alongside the historic `checkVisibilityCSS` alias; browsers ignore dictionary members they do not know.

## Consequences

- New public API: `NgxFieldIdentityProvider`, exported from the package root barrel. A root re-export is required because `/core` is stripped from the published `exports` map.
- `NgxFieldIdentity`'s published `.d.ts` is unchanged — still no `set*` members after `post-build`.
- `aria-invalid` behaviour changes for multi-control clusters: each control now tracks its own layout state rather than the cluster's first control's. Asserted deliberately rather than incidentally.
- `isElementCssVisible` changes behaviour on runtimes without `checkVisibility()`, from "guess from `offsetParent`" to "report visible". It is exported publicly, so this is a behaviour change on a public function.
- Visibility semantics are now only assertable in browser specs. The jsdom specs pin the fail-open contract instead, which is all jsdom can honestly answer.

## Alternatives Considered

**Promote the five `set*` writers.** Rejected. It publishes an ordering-sensitive imperative protocol, forces `strip-internal-members.mjs` to carve out exceptions, and hands consumers channels (strategy) where the registry's observed booleans are strictly safer.

**Expose only `setFieldName`.** Rejected for the same protocol reasons, and because the consumer still has to provide and wire the service themselves — the part the directive actually removes.

**Give the directive a `controlElement` input, or invert DI so auto-aria registers itself upward.** Rejected as unnecessary. Nothing reads the shared control element, and the only reader of the cached visibility flag now self-probes. Inversion stays additive if a future consumer needs it.

**Replace auto-aria's imperative writes with `host: { '[attr.aria-describedby]': '…' }`.** Rejected. A host binding owns the attribute outright, and auto-aria merges consumer-authored `aria-describedby` ids with generated ones. Manual ARIA mode also needs read-then-passthrough, which a host binding cannot express. The imperative read/write phase is what buys that merge.

## Related

- [ADR-0010](0010-field-identity-shadows-registries-per-channel.md) — per-channel resolution, the prerequisite that keeps this directive from disabling the registries.
- [ADR-0007](0007-warning-display-timing-cascade.md) — independence of the error and warning cascades.
- Issue [#387](https://github.com/ngx-signal-forms/ngx-signal-forms/issues/387).
