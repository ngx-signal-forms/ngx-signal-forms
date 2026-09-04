# Context

> **TODO:** Fill this in. The engineering skills (`improve-codebase-architecture`, `diagnose`, `tdd`,
> `to-issues`, `qa`) read this file to learn the project's domain language and key concepts.
> The `/grill-with-docs` skill can populate it incrementally as terms get resolved during real work.

## Project

ngx-signal-forms — an Angular toolkit for working with Signal Forms.

## Glossary

<!-- Populate with domain terms as they get resolved. Each entry: term, definition, and any
     synonyms to *avoid* drifting to. -->

- **Built-in validation error** — a validation error produced by Angular's own
  validators, i.e. a member of the `NgValidationError` union (`required`,
  `min`, `max`, `minDate`, `maxDate`, `minLength`, `maxLength`, `pattern`,
  `email`, `parse`, `standardSchema`). Has a known, typed `kind` and typed
  discriminating fields. The toolkit narrows these structurally (on `kind`,
  not `instanceof`) so they survive realm boundaries.
- **Custom validation error** — any validation error with a `kind` outside the
  `NgValidationError` union: async validators, cross-field checks, warnings
  (`warn:*` prefix), Vest results, etc. Shape is not known at compile time; the
  toolkit humanizes its `kind` string for display and types its registry
  factory params as `any`.
- **Warning** — a _non-blocking_ validation error, identified by a `warn:`
  prefix on its `kind`. It is **per-error**: one field can simultaneously carry
  a blocking error _and_ a warning, and the toolkit splits the two on the
  prefix. Deliberately **not** modelled on Angular's per-field `SEVERITY`
  metadata (which appears in post-22.0.0 docs and is absent from the pinned
  `22.0.0`): `SEVERITY` aggregates to a field's _highest_ severity and so
  cannot express "error A on this field blocks, error B is a warning". The
  toolkit will only retire `warn:` for a _per-`ValidationError`_ severity/blocking
  signal from Angular, not for field-level `SEVERITY`. Synonym to avoid: "soft
  error".
- **WCAG 2.2 AA** — the accessibility conformance level this project targets.
  Toolkit components must satisfy it unconditionally (hard fail in Vitest browser
  specs). Demo apps track compliance against a versioned baseline; deviations
  create GitHub issues but do not block PRs.
- **a11y baseline** — a per-demo-app JSON file (`a11y-baseline.json`) that
  records known axe violations. The CI `a11y` job diffs the current run against
  this file; new violations trigger auto-issue creation and a baseline update.
  Synonym to avoid: "known violations list" (ambiguous — use "a11y baseline").
- **Bound path** — the `SchemaPath` a Vest registration is attached to
  (`validateVest(path.address, suite)` → the bound path is `path.address`). It
  fixes two things at once: where the resulting errors attach, and what the
  suite input is. Synonym to avoid: "field path" (that is the Vest-side name,
  see **Vest field name**).
- **Suite input** — the value a Vest suite's callback receives. **The bound
  path's value _is_ the suite input.** Binding to the form root gives the suite
  the whole model; binding to a subtree gives it that subtree's value, and is
  correct only when the suite is authored for that shape. Synonyms to avoid:
  "model" (misleading once a subtree is bound), "form value".
- **Vest field name** — the string a Vest `test()` is registered under, e.g.
  `test('city', …)`. **Relative to the bound path**, never to the form root,
  because the suite only ever sees the suite input. A name that resolves to no
  field is either a **virtual Vest field name** or an authoring bug, split by
  shape: an unresolvable _first_ segment is virtual; a valid prefix with an
  invalid tail (`address.cityy`) is a typo and fails hard in dev mode.
- **Virtual Vest field name** — a Vest field name that deliberately matches no
  field in the suite input, used to carry a form-level error
  (`test('passwordMatch', 'Passwords must match', …)`). It attaches to the bound
  field. Legitimate and silent — the toolkit must not treat it as an error.

## Key concepts

<!-- Populate with the load-bearing ideas a new contributor (or agent) needs to know before
     touching the code. -->

- **Structural vs. nominal error narrowing** — error-message resolution keys on
  the public `kind` discriminant rather than `instanceof NgValidationError`.
  Angular brands its error classes with a private field, so `instanceof` breaks
  across duplicated `@angular/forms` copies (monorepo / module federation) and
  for the plain objects custom validators emit. A compile-time exhaustiveness
  guard (`Record<NgValidationError['kind'], true>` + an `assertNever` switch
  default) forces review whenever an Angular minor adds a new built-in kind.

- **One cascade seam** — error-visibility timing is composed once, in
  `createErrorVisibility()`, and consumers call it rather than re-inlining the
  `resolveStrategyFromContext` → `resolveSubmittedStatusFromContext` →
  `createShowErrorsComputed` chain. All in-tree surfaces now route through it
  for blocking errors (`NgxHeadlessErrorState`, `NgxHeadlessFieldset`,
  `createErrorState()`, `NgxFormFieldWrapper`, plus the pre-existing
  `NgxSignalFormAutoAria` / `createAriaInvalidSignal` /
  `createErrorMessageSignal()` / `NgxHeadlessErrorSummary` callers). Surfaces
  that also expose a resolved strategy as public API keep that computed
  separately — the seam only returns a visibility boolean — rather than
  re-implementing the cascade a second time. How the two feed back into the
  seam differs: `NgxFormFieldWrapper.effectiveStrategy` /
  `submittedStatus` are already fully resolved, so the wrapper's _resolved_
  values feed the seam directly (no `configDefault`, since resolution
  already happened); `NgxHeadlessFieldset.resolvedStrategy` is a parallel
  computation kept only for its public API — `NgxHeadlessFieldset` feeds the
  seam its _raw_ `strategy` / `submittedStatus` inputs plus `configDefault`,
  so the seam re-runs the identical cascade independently rather than
  reusing `resolvedStrategy`. See
  [ADR-0006](docs/decisions/0006-one-cascade-seam.md). The **warning** channel
  has its own seam next to the error one, `createWarningVisibility()`, which
  composes the warning cascade (`resolveWarningStrategyFromContext()`: input →
  form context `warningStrategy()` → `defaultWarningStrategy` → `'on-touch'`)
  with the two rules that differ from the error channel — warnings gate on
  warning _presence_ rather than `invalid()`, and a visible blocking error on
  the same field suppresses them. Every warning-bearing surface routes
  through it: `NgxHeadlessErrorState`, `NgxHeadlessFieldset`,
  `NgxHeadlessErrorSummary` (and `NgxFormFieldErrorSummary` through it),
  `createErrorState()` and `createErrorMessageSignal()`. Aggregate surfaces —
  the fieldset and the summary — pass neither the presence check (their
  warnings live on member fields, and their aggregation applies that gate)
  nor a blocking-error visibility (an error on one member field must not
  silence a warning on a sibling). The pure pipelines
  `createFieldsetAggregation()` and `createErrorSummaryEntries()` take
  `showErrors` and `showWarnings` as two separate pre-resolved signals for
  the same reason. The single cascade fixed the drift where
  `warningStrategy="inherit"` gave two different answers outside a form host,
  and issue #439 removed the last surfaces that timed warnings by the error
  cascade. Note that `invalid()` cannot be used to tell the channels apart:
  Angular marks a `warn:`-prefixed error invalid like any other, so the split
  is on `kind`. See
  [ADR-0007](docs/decisions/0007-warning-display-timing-cascade.md).

- **`aria-describedby` tracks what is rendered, not what is validated.**
  `NgxSignalFormAutoAria` composes the control's `aria-describedby` from the
  same two visibility decisions the renderer uses — the error cascade for
  `{name}-error`, the warning cascade for `{name}-warning` — so a rendered
  region is always referenced and a suppressed one never is. There are two
  channels field-level overrides reach it through, depending on composition:
  a **wrapped** field's `NgxFormFieldWrapper` publishes both resolved
  strategies via `NgxFieldIdentity.setResolvedStrategies()`; a **standalone**
  `<ngx-form-field-error>` — a sibling of the control it describes, not an
  ancestor, so it has no shared element injector to publish an identity
  through — instead registers its already-rendered
  `errorContainerVisible()`/`warningContainerVisible()` booleans into
  `NGX_SIGNAL_FORM_FIELD_VISIBILITY_REGISTRY`, keyed by field name and
  provided per-form by `NgxSignalForm`. Auto-aria resolves these **per
  channel**, on the published value: a strategy the identity has actually
  published wins, otherwise the registry entry does, otherwise it sees only
  the ambient form context. It never branches on whether `NgxFieldIdentity`
  is injectable — an identity that owns only the field name must leave both
  strategy channels to the registry, and the error and warning channels fall
  back independently of one another (ADR-0010). Any new surface that gates a message region must
  feed its decision through one of these two channels, or it will produce a
  dangling id (axe `aria-valid-attr-value`) or an unreferenced one
  (WCAG 1.3.1).
  The rule is narrow on purpose: it applies to the strategy/visibility cascade,
  where the copies encode _one_ contract. Where duplicated-looking code encodes
  _different_ contracts — direct `errors()` vs aggregated `errorSummary()`
  reads, the deliberate `focus-first-invalid` policy asymmetry — merging is the
  bug, and those are marked in place as intentional.

- **A field's name is owned by whoever provides its identity.** Auto-aria
  derives a field name from the bound control's `id` unless an ancestor
  provides an `NgxFieldIdentity`, in which case that service owns the name
  outright — a `null` there means "not resolvable yet" and skips ARIA wiring,
  it does not revert to the `id`. Wrappers get an identity by composing
  `NgxFieldIdentityProvider` as a host directive, the built-in
  `NgxFormFieldWrapper` included, so the public seam and the internal one are
  the same seam. The provider publishes the name channel only; the wrapper
  additionally drives the control element, visibility, hints, and resolved
  strategies in-package, because none of those can travel through an input.
  See ADR-0011.

- **`packages/toolkit/core` is not a public entry point.** It is a
  build-time-only secondary entry that sibling entries compile against;
  `packages/toolkit/scripts/strip-internal-exports.mjs` deletes `"./core"` from
  the published `exports` map at post-build, and `packages/toolkit/index.ts`
  hand-enumerates the public surface rather than re-exporting `/core`
  wholesale, so `@internal` plumbing stays out of the shipped `.d.ts`. A symbol
  tagged `@public` inside `/core` is only public if the root barrel lists it.

- **A Vest registration binds a path and a suite that must agree.** The
  **bound path**'s value is the **suite input**, and **Vest field names** are
  relative to that path. There is no second value source: Angular's
  `FieldContext` exposes no parent or root accessor, so a registration cannot
  reach past its own path to fetch the model. This is why `focusCurrentField`
  and field-scoped registration were **deleted** rather than repaired — they
  bound a suite to a leaf while the suite expected the model, so
  `suite.run(<the field's string>)` made every `data.x` read `undefined` and
  produced a blocking error that never cleared, on a valid value. Do not
  reintroduce a "bind here, read the model from over there" shape: the
  descendant relation between the two paths is not expressible in TypeScript, so
  its central invariant cannot be enforced. Automatic per-field focus is a
  _root-level_ concern instead — see
  [ADR-0008](docs/decisions/0008-vest-suite-input-is-the-bound-path.md).
  Implemented in
  [#287](https://github.com/ngx-signal-forms/ngx-signal-forms/issues/287);
  the unresolvable-Vest-field-name rule
  ([#291](https://github.com/ngx-signal-forms/ngx-signal-forms/issues/291))
  shipped in [#307](https://github.com/ngx-signal-forms/ngx-signal-forms/pull/307).
