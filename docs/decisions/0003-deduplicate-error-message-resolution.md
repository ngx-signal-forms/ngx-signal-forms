# ADR-0003: Deduplicate 3-tier error message resolution via a private helper

**Status:** Accepted  
**Date:** 2026-05-06  
**Issue:** [#67](https://github.com/ngx-signal-forms/ngx-signal-forms/issues/67)

## Context

After PR #63 introduced `createErrorMessageSignal`, two code paths in
`packages/toolkit/headless/src/lib/` call `resolveValidationErrorMessage`
with identical options (`{ stripWarningPrefix: true }`):

1. `create-error-message-signal.ts` — inside the `computed` that maps the
   ordered error list into `ResolvedFieldError` entries.
2. `error-state.ts` — inside `NgxHeadlessErrorState.#resolveErrorMessage`,
   called from the `resolvedErrors` and `resolvedWarnings` computeds.

The duplication is narrow (one function call, one fixed option object) but
meaningful: if the resolution default ever changes, both sites must be updated
in lockstep. There is no test or type that enforces that invariant today.

Two refactor paths were considered.

## Options considered

### Option A — extract a private `resolveErrorMessage` helper (chosen)

Add a non-exported `resolveErrorMessage(error, registry): string` to
`utilities.ts` that pins `{ stripWarningPrefix: true }` in one place.
Both call sites import and call it; each retains its own `.map()` because
the result shapes diverge (`ResolvedFieldError` vs `ResolvedError`).

### Option B — have the directive delegate to `createErrorMessageSignal`

Replace `resolvedErrors`/`resolvedWarnings` with signals produced by
`createErrorMessageSignal` internally.

Rejected for two reasons:

1. **Visibility-gate mismatch.** `createErrorMessageSignal` always gates its
   output by the error display strategy, returning an empty array when errors
   should not be shown. `NgxHeadlessErrorState.resolvedErrors` is intentionally
   un-gated — visibility lives in the separate `showErrors` signal so consumers
   can compose them independently. Delegating would either require adding a
   `bypassVisibility` flag to the primitive (tail wagging the dog) or silently
   changing the directive's contract.

2. **`errorsOverride` mode incompatibility.** When `errorsOverride` is bound,
   the directive uses a pre-aggregated error list that bypasses field-state
   extraction entirely. `createErrorMessageSignal` takes a `FieldStateAccessor`,
   not a pre-split list, so it cannot serve this mode without synthesising a
   fake field state.

## Decision

**Option A.** Extract `resolveErrorMessage` into `utilities.ts` as an
unexported (internal to the headless package) single-error helper:

```typescript
function resolveErrorMessage(
  error: ValidationError,
  registry: Readonly<ErrorMessageRegistry> | null | undefined,
): string {
  return resolveValidationErrorMessage(error, registry, {
    stripWarningPrefix: true,
  });
}
```

- Not added to the public barrel (`index.ts`) — consumers have no reason to
  call it directly; `resolveValidationErrorMessage` from core is their escape
  hatch when they need different options.
- Located in `utilities.ts` because that file already imports
  `resolveValidationErrorMessage` (for `toErrorSummaryEntry`) and is already
  the shared internal foundation for `NgxHeadlessErrorState`.
- Single-error granularity so each call site owns its own mapping shape
  (`ResolvedFieldError` with `id`+`error` vs `ResolvedError` with
  `kind`+`message` only).

## Consequences

- `stripWarningPrefix: true` is pinned in exactly one place; future changes
  are impossible to miss.
- `NgxHeadlessErrorState.resolvedErrors` / `resolvedWarnings` no longer call
  `resolveValidationErrorMessage` directly — satisfies the issue acceptance
  criterion.
- No public API change to `NgxHeadlessErrorState` or `createErrorMessageSignal`.
- `utilities.ts` gains one new import (`resolveValidationErrorMessage` already
  present) and one new private function — zero new public surface.
- `create-error-message-signal.ts` gains one new intra-package import
  (`./utilities`). This is the only new coupling introduced.
