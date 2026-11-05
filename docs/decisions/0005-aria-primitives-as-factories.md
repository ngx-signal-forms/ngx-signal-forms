# ADR-0005: ARIA primitives are factories, not directives

## Status

Accepted

## Date

2026-04-30

## Context

The toolkit's `NgxSignalFormAutoAria` directive owns three host ARIA
attributes and the hint-ID list primitive used to compose `aria-describedby`
on every `[formField]` host:

- `aria-invalid` — derived from `errors()` and the visibility cascade
- `aria-required` — derived from `required()`
- `aria-describedby` — composed from preserved IDs + hint IDs + generated
  error/warning IDs
- the hint-ID list itself — resolved from the field-identity service or the
  hint registry, then folded into `aria-describedby`

For 95 % of consumers — anyone using `NgxFormFieldWrapper` or building a
wrapper that pattern-matches it — `NgxSignalFormAutoAria` is the right
answer. Drop the directive into scope and ARIA flows automatically.

That story breaks down for wrappers built on top of an existing host that
already owns ARIA: Material's `mat-form-field`, PrimeNG's `p-iconfield`,
Spartan's form-control wrapper, or any in-house design-system shell whose
hint slot already drives `aria-describedby`. Those consumers had two bad
options:

1. **Inherit `NgxSignalFormAutoAria`.** This couples them to the directive
   shell — the `[formField]` selector matrix, the `afterEveryRender` DOM
   read/write loop, the manual-mode opt-out's exact wiring — and makes any
   change to the shell a breaking change for them.
2. **Re-implement `aria-describedby` ID composition from scratch** using
   `generateErrorId` / `generateWarningId`, manual hint-registry probing,
   and their own visibility wiring. This signs them up for breaking changes
   whenever the toolkit's ID-generation contract or visibility cascade
   evolves, and the duplication is exactly the kind of drift the toolkit
   exists to prevent.

Neither option lets a consumer compose ARIA _primitives_ — they get either
the whole directive or nothing.

## Decision

**ARIA primitives ship as pure signal factories, not as additional
directives.**

The four computeds that `NgxSignalFormAutoAria` uses internally are exposed
from `@ngx-signal-forms/toolkit/headless` (and `/core` for build-time
plumbing) as named factory functions:

- `createHintIdsSignal({ identity?, registry?, fieldName? })` →
  `Signal<readonly string[]>`
- `createAriaInvalidSignal(fieldState, visibility, isControlVisible?)` →
  `Signal<'true' | 'false' | null>`
- `createAriaRequiredSignal(fieldState)` → `Signal<'true' | null>`
- `createAriaDescribedBySignal({ fieldState, hintIds, visibility, preservedIds, fieldName })` →
  `Signal<string | null>`

`NgxSignalFormAutoAria` itself is a thin shell over these factories — it
owns the `[formField]` selector matrix, the `afterEveryRender` phasing, the
manual-mode opt-out branch, and the DOM snapshotting. The factories are
unconditional: `fieldState in → ARIA out`.

### Rules the factories follow

1. **Pure functions, no DI inside the factories themselves.** Consumers
   thread DI-resolved values (visibility computed from
   `createErrorVisibility`, optional identity service, optional hint
   registry) in as inputs. This keeps each factory testable without
   `TestBed.runInInjectionContext` and reusable from any injection context.
2. **Each factory takes `Signal<FieldState | null>`** (not
   `Signal<FieldState>`). Mirrors the directive shell's `#resolveFieldState`
   contract and avoids forcing every consumer to handle the null branch
   differently.
3. **`createAriaDescribedBySignal` accepts a `preservedIds: () => string | null`
   reader**, not a static value. The factory re-reads non-managed IDs across
   computeds, so consumers don't have to inline the preservation logic.
4. **Manual-mode behavior lives in the directive shell, not the factories.**
   The factories are unconditional. The directive decides whether to call
   them or pass through DOM-snapshot values when
   `ngxSignalFormControlAria='manual'`. This keeps the factory contract
   clean and the manual-mode escape hatch a single-point opt-out.
5. **The directive shell delegates to the same factories the public seam
   exposes.** It cannot drift from the public contract because the public
   contract _is_ what the directive runs.

### Why factories instead of additional directives

A directive has a host element, a selector, a lifecycle, and an injection
scope. ARIA composition has none of those — it's a reactive transform over
`FieldState`. Wrapping that transform in a directive would force consumers
to add another host directive to their template, deal with selector
matching, and handle `inject()` in the right injection context. None of that
buys them anything because the underlying logic is a `computed()`.

A pure factory has no host, no selector, no lifecycle, no DI dependency —
it's just a function that builds a `Signal`. Consumers compose the factories
inside their own directive, component, or service and own the wiring
themselves. That matches the granularity of the problem.

### Public surface

The factories are exported as **named exports** from
`@ngx-signal-forms/toolkit/headless`, not bundled into a single
`createAriaSignals` god-factory. Each factory is independently composable:
a wrapper that already owns `aria-describedby` from its own hint slot can
use only `createAriaInvalidSignal` + `createAriaRequiredSignal` and ignore
the other two.

Structural option types (`HintIdsRegistryLike`, `HintIdsIdentityLike`,
`AriaRequiredFieldState`, `CreateAriaDescribedBySignalOptions`,
`CreateHintIdsSignalOptions`) are exported alongside the factories so
consumers can type-check their bindings without crossing into `@internal`
territory.

## Alternatives Considered

### A. Add a `NgxSignalFormAriaPrimitive` host directive

Expose ARIA composition as another directive that consumers list in
`hostDirectives`, and let the directive write the attributes itself.

- **Pros:** mirrors the existing `NgxSignalFormAutoAria` shape; consumers
  already know how to use host directives.
- **Cons:** still couples consumers to a selector + lifecycle they don't
  need; makes the manual-mode opt-out branching harder (two directives both
  wanting to own writes); breaks for design systems whose own host directive
  already writes the same attributes (Material's `mat-form-field` writes
  `aria-describedby` itself).
- **Rejected:** the directive shape is the wrong granularity. The problem
  is "compose a `Signal<string | null>`", not "attach to a host element".

### B. Expose a single `createAriaSignals` god-factory

One function that takes everything (`fieldState`, `visibility`, hint
registry, identity service, preservedIds reader, fieldName reader) and
returns an object `{ ariaInvalid, ariaRequired, ariaDescribedBy, hintIds }`.

- **Pros:** one import, one call site, one mental model.
- **Cons:** consumers who only want `aria-invalid` (because Material owns
  the rest) still have to thread inputs they don't use; the factory's
  options bag becomes a kitchen-sink interface; testing the four computeds
  in isolation requires constructing the whole bag. The named-exports
  variant has none of these problems and the same ergonomics for full
  composition.
- **Rejected:** loses the per-factory composability that's the whole
  point of the refactor.

### C. Keep ARIA composition private; ship first-party adapters instead

- **Pros:** no new public surface; tighter quality bar.
- **Cons:** every new design system requires a first-party adapter; the
  toolkit becomes responsible for tracking Material/PrimeNG/Spartan version
  matrices forever; in-house design systems still have no path. This was
  explicitly rejected in PRD #38 — adapters are out of scope; the seam is
  the contract.
- **Rejected:** the consumer extensibility is the point.

## Consequences

**Positive:**

- Wrapper authors composing on Material, PrimeNG, Spartan, or in-house
  design systems get a clean seam without forking the toolkit.
- Each factory has a unit-test surface that documents its behavior in
  isolation; the directive shell's spec stays as the integration test.
- Adding a fifth ARIA computed in the future means adding one more factory
  and one more line in the directive shell — no breaking changes.
- The directive shell _is_ the canonical reference implementation, because
  it consumes the same factories the public API exposes. Drift between
  "what the toolkit does" and "what the public seam does" is structurally
  impossible.

**Negative:**

- Five concepts (four factories + the directive shell) instead of one. The
  API surface is bigger and takes more explanation — this ADR exists
  because the split is non-obvious.
- Consumers composing the factories themselves own their own
  `afterEveryRender` phasing. Getting the `earlyRead` / `write` split wrong
  triggers layout thrash. `docs/CUSTOM_WRAPPERS.md` documents the canonical
  shape.
- Manual-mode behavior is asymmetric: it lives in the directive shell, not
  the factories, so consumers re-implementing manual-mode have to inline
  that branch themselves. This is a deliberate trade-off — keeping it in
  the factory would force every call site to either pass a
  `manual?: boolean` they don't need or accept a more complex contract.

**Mitigations:**

- `docs/CUSTOM_WRAPPERS.md` ships a worked example covering all four
  factories plus the visibility cascade and the `afterEveryRender` phasing.
- `packages/toolkit/core/directives/auto-aria.ts` is the canonical
  reference implementation — it's the directive shell consumers can study
  (and copy with attribution) when their own wrapper needs the manual-mode
  opt-out branch.
- Each factory has a `*.spec.ts` next to its source documenting reactive
  transitions on a stub `FieldState`.

## Planned feedback-ID composition refactor

The [feedback-ID composition specification](../specs/feedback-id-composition.md)
records the direction agreed on 2026-11-05. Implementation is pending; this
addendum does not change the accepted decision above.

Reuse the pure ARIA composition path to centralize toolkit-owned hint/count
preparation and description ordering. Keep ID creation, registration lifecycle,
visibility resolution and manual-mode DOM ownership with their current
owners. Do not introduce a field-name-keyed registration service or a public
count input merely for this refactor.

Counts remain part of the existing flat hint channel across identity and
registry boundaries. Preserve ADR-0010's publication semantics. Fieldset
aggregation and the design-system bridge retain their distinct policies.

## Related

- PRD #38 — Auto-ARIA composition refactor
- `packages/toolkit/core/directives/auto-aria.ts` — directive shell that
  consumes the factories
- `packages/toolkit/core/utilities/aria/create-{hint-ids,aria-invalid,aria-required,aria-described-by}-signal.ts`
  — factory implementations
- `packages/toolkit/core/utilities/create-error-visibility.ts` — visibility
  cascade the factories thread through
- `docs/CUSTOM_WRAPPERS.md` — "Composing ARIA primitives" — consumer-facing
  walkthrough
