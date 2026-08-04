# ADR-0006: One cascade seam — visibility timing is composed once, never inlined

## Status

Accepted

## Date

2026-08-04

## Context

Deciding _when_ a field's errors become visible is the toolkit's central
behaviour. It is a four-step composition:

1. resolve the effective strategy from the explicit input, the form context,
   and the config default — `resolveStrategyFromContext`
2. resolve submission status from the same context —
   `resolveSubmittedStatusFromContext`
3. fold the two into a visibility computed — `createShowErrorsComputed`
4. expose that computed on the consuming surface

`createErrorVisibility()` (`core/utilities/create-error-visibility.ts:161`)
exists to be that composition, once. Its own docstring says so: it _"Replaces
the four-step manual composition … that every consumer used to inline."_

A whole-workspace audit ([#262]) found the sentence is not yet true. Four
in-tree surfaces inline all four steps of the **error** cascade, each
re-injecting `injectFormContext()` and `NGX_SIGNAL_FORMS_CONFIG` and
re-writing the same two computeds:

- `headless/src/lib/utilities.ts:457` — `createErrorStateInternal`
- `headless/src/lib/error-state.ts:215` — `NgxHeadlessErrorState`
- `headless/src/lib/fieldset.ts:236` — `NgxHeadlessFieldset`
- `form-field/form-field-wrapper.ts:873` — `NgxFormFieldWrapper` (and it
  reaches for `resolveErrorDisplayStrategy` rather than
  `resolveStrategyFromContext`)

Three surfaces call the seam: `core/directives/auto-aria.ts:174`,
`headless/src/lib/create-error-message-signal.ts:255`, and
`headless/src/lib/error-summary.ts:158` — the latter two passing
`configDefault`. The seam is not a hypothetical better way; it is what the
newer code already does, and the inlining surfaces are the holdouts.

Two corrections to the audit's own framing, recorded because they change how
the evidence reads:

- The audit counted **five** inliners, including `NgxFormFieldError`. That one
  is wrong, and instructively so: `assistive/form-field-error.ts:45-46`
  states that error-visibility logic _"lives exclusively in
  `NgxHeadlessErrorState`, which is composed via `hostDirectives`"_ — it
  delegates the error cascade exactly as this ADR asks. Its only copy is of
  the _warning_ cascade (`:391`).
- `headless/src/lib/error-summary.ts` appears on both lists. It calls the seam
  for visibility (`:158`) **and** inlines `resolveStrategyFromContext` at
  `:149-155` — because it exposes `resolvedStrategy` as public API and the
  seam returns only a visibility boolean. See "the seam's shape" under
  Consequences; that is a real gap, not a violation.

That would be ordinary duplication if the copies agreed. They do not.

The _warning_-strategy variant of the cascade is copy-pasted three times with a
genuine behavioural difference:

| site                                       | call                                                                                                  |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| `form-field/form-field-wrapper.ts:987-995` | `resolveStrategyFromContext(explicit, ctx)` — no `configDefault`                                      |
| `headless/src/lib/fieldset.ts:250-258`     | `resolveStrategyFromContext(explicit, ctx)` — no `configDefault`                                      |
| `assistive/form-field-error.ts:387-399`    | `resolveStrategyFromContext(explicit, ctx, this.#config?.defaultErrorStrategy)` — has `configDefault` |

So `warningStrategy="inherit"` outside an `[ngxSignalForm]` host resolves to
`'on-touch'` in the wrapper and the fieldset, but to
`NGX_SIGNAL_FORMS_CONFIG.defaultErrorStrategy` in `ngx-form-field-error`. One
documented contract, three implementations, two answers. That divergence is
tracked and resolved as a behavioural defect in [#264].

Two things about that divergence are easy to misread, so they are stated
outright:

- **It only bites when `warningStrategy` is explicitly set.** All three copies
  short-circuit to `'immediate'` when the input is unset, so a reader checking
  the code sees `return 'immediate'` and may conclude the claim is wrong.
  `"inherit"` is an explicit value; it reaches `resolveStrategyFromContext`,
  and that is where the three copies disagree.
- **`fieldset.ts:244-249` carries a docstring defending its cascade** as
  _"deliberately narrower than `resolvedStrategy`'s"_. That sentence documents
  the unset-input → `'immediate'` behaviour, which **all three copies share**.
  It does not document, and cannot sanction, the missing `configDefault` —
  which is the part that diverges. A defended difference and an undetected one
  sit two lines apart in the same docstring.

A separate, smaller divergence is the more revealing one, and it is in the
**error** cascade rather than the warning one. `fieldset.ts:239` passes
`this.#config?.defaultErrorStrategy ?? 'on-touch'` while all five other error
sites — `error-state.ts:218`, `error-summary.ts:152`, `utilities.ts:460`,
`form-field-wrapper.ts:876`, `create-error-message-signal.ts:247` — pass the
bare value. `resolveErrorDisplayStrategy` already returns `'on-touch'` as its
terminal fallback, so the extra coalesce is redundant. It exists only because
the author of that copy could not see the shared terminal. Nothing broke — but
the copy had already stopped being a copy, and no one could tell.

The same shape recurs elsewhere in the toolkit. `NgxHeadlessCharacterCount`
forked `createCharacterCount()` and the fork is where the dev diagnostic went
missing ([#269]). Six copies of "validate a string-union input, warn once, fall
back" drifted into six slightly different blocks. In each case the duplication
came first and the divergence followed, silently, at a point where no reviewer
was looking at both copies at once.

## Decision

**Visibility timing is composed in exactly one place. Consumers call the seam;
they do not re-implement it.**

Concretely:

- `createErrorVisibility()` is the single composition point for the
  error-visibility cascade. New surfaces that need error visibility call it.
- The warning cascade gets the same treatment: a
  `resolveWarningStrategy(explicit, ctx, configDefault?)` helper in
  `core/utilities/resolve-strategy.ts`, and the three existing copies route
  through it.
- `resolveErrorDisplayStrategy` owns the terminal fallback. Call sites do not
  re-state it.
- A surface that genuinely cannot use the seam must say why in a comment at the
  call site. "It was easier to inline" is not a reason; a real constraint is.

This is a constraint on future code, which is why it is an ADR rather than a
backlog entry. The cleanup that brings existing code into line is filed as
issues ([#280] for the five bypassing sites, [#276] for the character-count
fork, [#278] for the union-input and warn-once helpers).

**Corollary, stated because it is the part people skip:** consolidating copies
that currently disagree is a _behaviour_ change, not a refactor. Decide which
answer is correct first, then collapse. [#280] is therefore blocked on [#264],
not merely sequenced after it.

## Consequences

**Good.**

- One place to change visibility timing, and one place for a reviewer to look.
- The drift class this ADR targets — two copies, two answers, no one aware —
  becomes structurally hard rather than merely discouraged.
- ≈ −80 to −120 lines across five files from the cascade cleanup alone, and the
  redundant `?? 'on-touch'` disappears with the copy that hosted it.

**Costs.**

- The seam becomes a hot spot. Every visibility-timing change routes through
  `createErrorVisibility()`, so its spec coverage carries more weight than any
  individual consumer's.
- Indirection for the reader: a consumer's visibility behaviour is no longer
  legible from the consumer's own file. The seam's docstring has to carry that
  explanation, and must stay accurate — it is currently written in the past
  tense about a consolidation that has not finished.
- `configDefault` is now a real parameter with a decided semantic rather than a
  detail each site improvises. It must be documented as part of the contract.

**The seam's shape is currently too narrow, and that is a known gap.**
`createErrorVisibility()` returns a visibility `Signal<boolean>` and nothing
else. A surface that must expose the _resolved strategy value_ as public API —
`NgxHeadlessErrorSummary.resolvedStrategy`, `NgxHeadlessFieldset.resolvedStrategy` —
cannot get it from the seam, so it resolves the strategy a second time
alongside the seam call. `error-summary.ts` does exactly this today
(`:149-155` beside `:158`), and it is not a violation of this ADR: the rule
says do not re-implement the cascade, and there is presently no way to obtain
that value without doing so. Either the seam grows to return the resolved
strategy next to the boolean, or surfaces that need both keep two call sites.
Deciding that is left to [#280], which is where the migration happens and
where the requirement will be concrete.

**Explicitly not decided here.**

- Which `configDefault` semantic is correct for `warningStrategy="inherit"`
  outside a form host. That is [#264]. This ADR says there must be _one_
  answer; it does not pick it.

**Deliberately narrow.** This ADR covers the strategy/visibility cascade only.
It is not a general "never duplicate" rule — the audit also examined four
overlapping duck-typed field-state contracts and concluded they should _stay_
separate, because their divergences are documented and deliberate (direct
`errors()` vs aggregated `errorSummary()` reads; the `focus-first-invalid`
default-policy asymmetry marked "Both policies are deliberate; do not
'normalize' them"). Duplication is worth removing when the copies encode one
contract. When they encode different contracts that merely look alike,
merging them is the bug.

## References

- [#262] — the toolkit simplification audit and its findings
- [#265] — the accept/reject decision this ADR records
- [#264] — the `configDefault` behavioural decision this ADR defers to
- ADR-0003 — deduplicate error message resolution, the same instinct applied to
  message lookup
- ADR-0005 — ARIA primitives as factories; the audit confirmed it is honoured

[#262]: https://github.com/ngx-signal-forms/ngx-signal-forms/issues/262
[#264]: https://github.com/ngx-signal-forms/ngx-signal-forms/issues/264
[#265]: https://github.com/ngx-signal-forms/ngx-signal-forms/issues/265
[#269]: https://github.com/ngx-signal-forms/ngx-signal-forms/issues/269
[#276]: https://github.com/ngx-signal-forms/ngx-signal-forms/issues/276
[#278]: https://github.com/ngx-signal-forms/ngx-signal-forms/issues/278
[#280]: https://github.com/ngx-signal-forms/ngx-signal-forms/issues/280
