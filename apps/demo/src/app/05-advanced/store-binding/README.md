# Store Binding

## Intent

Shows **honest two-way binding** between a Signal Form and an `@ngrx/signals`
store. Edits flow straight back into the store via `patchState` — there is **no
draft/commit buffer**. Reads stay reactive to the store through a `linkedSignal`
seam, so an out-of-band store mutation is reflected back into the form.

This is the deliberate _contrast_ to the [Advanced Wizard](../advanced-wizard/README.md),
whose `destinationsDraft` → `commitDestinations()` draft/commit buffer keeps
edits local until committed. Pick draft/commit when you need a cancelable
editing session; pick live binding when the store should always mirror what the
user sees.

## The binding seam

`linkedSignal({ source, computation, set })` is the whole seam — a single
native `WritableSignal<T>` handle, no helper file:

- **Read seam** — `source` / `computation` project the store slice into the
  linked value. Reads re-evaluate whenever the store changes.
- **Write seam** — the native `set` callback receives every value the form
  writes and calls `store.updateSettings(...)` (which calls `patchState`).
  Every form edit lands in the store immediately.
- `set` deliberately never calls its `rawSet` parameter. There is no local
  draft buffer to keep in sync: once `patchState` updates the store's own
  signals, the next read of the linked signal re-runs `computation` against
  the fresh `source` value, so the field is coherent without mirroring
  anything locally.

This is Angular's native custom-`set` overload
([PR #68708](https://github.com/angular/angular/pull/68708), shipped in
**22.1**): `set?: (value, rawSet) => void`. `ngxtension`'s `writableSlice` and
ngrx's reverted `delegatedSignal` ([ngrx #5157](https://github.com/ngrx/platform/pull/5157))
both converged on this same native overload, which is why they were retired in
favor of it.

### History

Earlier revisions of this demo shipped a demo-local `delegatedStoreField`
helper, because the workspace was pinned to `22.0.0-rc.x`, where the
`WritableSignal` returned by `linkedSignal({ source, computation })` only
updated its **local** value — `.set()` never propagated back to `source`. Now
that the workspace is on Angular 22.1+, the native `set` option expresses the
same write-through behavior directly, so the helper (and its spec) were
deleted.

## Scope

Demo only. The `@ngx-signal-forms/toolkit` source is **not** touched, and the
`advanced-wizard` example is left unchanged.

## Key files

- [settings.store.ts](settings.store.ts) — `providedIn: 'root'` signal store with
  `updateSettings` and `simulateRemoteSync` mutators (no draft buffer).
- [store-binding.form.ts](store-binding.form.ts) — the form whose model is the
  native `linkedSignal({ source, computation, set })` handle.
- [store-binding.form.spec.ts](store-binding.form.spec.ts) — locks in the
  binding seam's reactive guarantees, including that omitting `rawSet` keeps
  reads coherent.
- [store-binding.page.ts](store-binding.page.ts) — page wrapper and debugger.

## How to test

1. Run the demo and navigate to `/advanced-scenarios/store-binding`.
2. Edit any field — confirm the live store snapshot updates on every keystroke
   with no commit step.
3. Press **Simulate remote sync** — confirm the form inputs reflect the
   out-of-band store mutation (two-way binding).
4. Press **Reset store** — confirm both the store and the form return to the
   initial settings.

## Related

- [Advanced Wizard](../advanced-wizard/README.md) — the contrasting draft/commit
  buffer pattern.
- [Autosave](../autosave/README.md) — the contrasting "persist valid, dirty
  changes as the user types" pattern, with no submit button.
