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

- **Read seam** — `linkedSignal({ source, computation })` projects the store
  slice into a writable handle. Reads re-evaluate whenever the store changes.
- **Write seam** — a demo-local `delegatedStoreField` helper overrides `set` /
  `update` on that handle to call `store.updateSettings(...)` (which calls
  `patchState`). Every form edit lands in the store immediately.
- The helper returns a genuine `WritableSignal<T>` that `form(model)` accepts as
  its model.

### Why the helper is needed on `22.0.0-rc.x`

On rc.x, the `WritableSignal` returned by `linkedSignal({ source, computation })`
is writable, but its `.set` only updates the **local** linked value — it does
**not** propagate back to `source`. The delegated-write helper closes that gap by
routing writes through `patchState` first.

### 22.1 follow-up

Angular [PR #68708](https://github.com/angular/angular/pull/68708)
(`target: minor`, ships in **22.1+**) adds a native custom-`set` overload to
`linkedSignal`. Once the workspace moves to ≥ 22.1, the `delegatedStoreField`
helper can be deleted and replaced with the built-in `set`. `ngxtension`'s
`writableSlice` and ngrx's reverted `delegatedSignal`
([ngrx #5157](https://github.com/ngrx/platform/pull/5157)) both converge on that
same native overload.

## Scope

Demo only. The `@ngx-signal-forms/toolkit` source is **not** touched, and the
`advanced-wizard` example is left unchanged.

## Key files

- [settings.store.ts](settings.store.ts) — `providedIn: 'root'` signal store with
  `updateSettings` and `simulateRemoteSync` mutators (no draft buffer).
- [delegated-store-field.ts](delegated-store-field.ts) — the delegated-write
  helper (read via `linkedSignal`, write via `patchState`).
- [store-binding.form.ts](store-binding.form.ts) — the form wired to the helper.
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
