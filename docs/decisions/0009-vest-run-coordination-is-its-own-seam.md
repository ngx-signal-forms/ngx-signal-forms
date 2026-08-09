# ADR-0009: Vest run coordination is its own seam

## Status

Accepted — implemented for issue
[#295](https://github.com/ngx-signal-forms/ngx-signal-forms/issues/295).
Coordination lives in `packages/toolkit/vest/src/vest-run-coordinator.ts`;
`vest-adapter.ts` keeps registration.

## Date

2026-08-09

## Context

Roughly a third of `vest-adapter.ts` implemented run coordination:

- a two-level identity cache keyed on suite and Angular field tree, then
  gated on value identity and focus equality
- detection of a suite contested by a second field tree
- a FIFO queue serialising contested unfocused runs
- a settlement race between the suite's returned promise and its
  `ALL_RUNNING_TESTS_FINISHED` bus event

None of it had an interface. It was reachable only by registering through
`validateTree` / `validateAsync` and driving a rendered component, so the
documented FIFO ordering and single-execution guarantees carried zero direct
assertions. The module also mixed coordination with path binding, focus
resolution, field-name resolution, and result mapping.

Two consequences followed from the missing seam:

1. Three casts existed purely to fit values through `unknown`-keyed caches
   (`suite as object` twice, `fieldTree as ReadonlyFieldTree<unknown>` once).
2. The documented degraded behaviour for a suite **without** `subscribe` /
   `get` was untestable, because every spec spread a real `create()` suite
   that has them.

## Decision

Coordination gets its own interface **inside** the module. It is an internal
seam, not a new public entry point: `validateVest`, `validateVestWarnings`,
`createVestAdapter`, `sharedVestAdapter` and the adapter interface are
unchanged, and `./index.ts` exports exactly the same names.

```ts
interface VestRunCoordinator {
  request<TValue>(request: VestRunRequest<TValue>): VestRunHandle<TValue>;
  invalidate(suite: object): void;
}
```

Three decision points shape it.

### 1. The cache key is an argument, not a reconstruction

The cache key used to be rebuilt at the call site from the suite object plus
the validator's bound `ReadonlyFieldTree`. It is now
`VestRunCacheKey = object` — an opaque identity the coordinator only ever
compares and uses as a `WeakMap` key. Registration passes `ctx.fieldTree`, so
the per-(suite, field tree) semantics are byte-for-byte the same; a spec
passes `{}`.

This is what deletes the casts: with an opaque key there is nothing to widen
to `ReadonlyFieldTree<unknown>`, and an interface-typed `suite` is assignable
to `object` without help.

### 2. The suite contract belongs with the coordinator

`VestRunnableSuite`, `VestResultLike` and `VestFieldExclusion` moved to
`vest-run-coordinator.ts` and are re-exported from `vest-adapter.ts`, which
stays their documented public home. `subscribe` / `get` stay optional: their
absence is a stated part of the coordinator's contract (best-effort
settlement, no idle signal), so it must be reachable by a hand-rolled suite
in a spec.

### 3. Settlement is the coordinator's, exposed as a lazy promise

`VestRunHandle.settled()` encapsulates the choice the resource loader used to
make: await a deferred run's own promise directly, or race an immediate run
against the suite bus. Registration now just awaits the handle. It is a
function rather than an eager property so a request that never reaches the
async phase costs no bus subscription.

## Consequences

- FIFO ordering, single execution across the sync and async phases, cache
  invalidation, focus keying and the no-`subscribe`/`get` settlement path are
  asserted directly in `vest-run-coordinator.spec.ts` with no `TestBed`, no
  rendering, and no Angular validators.
- Registration keeps only what is properly its own: bind the path, resolve
  the focus, map results to validation errors, attach them.
- Caching and contention **semantics** are unchanged — this ADR records an
  exposure, not a redesign. The existing `validate-vest.spec.ts` and
  `vest-adapter.spec.ts` pass untouched, which is the evidence.
- Further splitting (field-name resolution, result mapping) stays open. One
  seam at a time.
