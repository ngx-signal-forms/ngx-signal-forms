# Toolkit extensions

The [ngrx-toolkit skill](../SKILL.md) owns Toolkit selection and workflow. This catalog covers extension contracts. Read [version gates](../../ngrx-signals/references/testing-and-version-gates.md) for package ownership and v22 migration, or [resources and mutations](../../ngrx-signals/references/resources-and-mutations.md) for adapter details.

## Choose an extension

| Need                              | Extension and decision                                                                                          |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Store-backed resource values      | `withResource`; choose error policy and named/unnamed members                                                   |
| Resource arrays with id lookups   | `withEntityResources`; linked entity edits are not server writes                                                |
| Backend commands                  | `withMutations`, `httpMutation`, `rxMutation`; choose concurrency and reconciliation                            |
| Redux DevTools                    | `withDevtools`; decide event tracking, redaction, and production behavior                                       |
| Persist local state               | `withStorageSync`; select keys, validate stored data, sequence hydration                                        |
| Reset local state                 | `withReset`; choose the reset baseline                                                                          |
| Edit history                      | `withUndoRedo`; scope collections/keys and define undo boundaries                                               |
| Mutable-state detection           | `withImmutableState`; replaces `withState` and freezes object-valued state                                      |
| Promise-based entity CRUD         | `withDataService`; check required entity/call-state contracts                                                   |
| Status for manual async work      | `withCallState`; avoid duplicating existing resource/mutation status                                            |
| Build two feature implementations | `withConditional`; see [custom features](../../ngrx-signals/references/custom-features.md#conditional-features) |
| Legacy Redux integration          | Migrate `withRedux` to native Events; `/redux-connector` is a distinct bridge to NgRx Store                     |

Check the installed exports before choosing an extension. Names in articles, such as `withPagination`, are not evidence of a Toolkit export.

## Devtools

`withDevtools("tickets")` records state updates. Keep ordinary writes as `patchState`; label selected writes with Toolkit's `updateState(store, "set query", ...updaters)` where the state diff is ambiguous.

For native Events, `withTrackedReducer` tracks event names and payloads. It requires `withDevtools("tickets", withGlitchTracking())`; missing glitch tracking throws during initialization. `withGlitchTracking` captures intermediate changes that signal consumers may batch.

Use `withMapper` to redact exported state and review event payloads separately. Devtools are enabled in production by default. Configure a production replacement using `withDevToolsStub`, with that exact spelling, when production tracking is unwanted.

## Storage hydration

`withStorageSync` defaults to local storage and automatic reading/writing. `select` restricts persisted state; `parse` and `stringify` define serialization. Prefer storage strategies such as `withSessionStorage()` or `withIndexedDB()` as the second argument over the deprecated `storage` config option.

Persist preferences or explicitly scoped drafts. Persisting server data requires a separate cache design with expiry, schema migration, and invalidation; a serialized resource value alone is not that design. Exclude secrets and unnecessary personal data.

For asynchronous storage, set `autoSync: false` and await `readFromStorage()` before dependent commands. An async `onInit` does not make store construction await hydration: expose readiness and gate consumers. Manual mode also requires explicit subsequent writes.

Test the target SSR runtime. Although the docs describe server stubs, the v22.0.1 source selects its default storage before platform guards. Keep browser globals behind platform-aware strategy construction; do not promise universal SSR safety from the stub documentation alone.

## Reset and history

`withReset()` captures its baseline during initialization; feature/hook order matters. `setResetState(store, state)` replaces that baseline. For an editor, decide whether reset means an empty form or the loaded record. Resetting state is not a promise to cancel requests, reset mutation metadata, or clear undo history.

`withUndoRedo` tracks entity collections and selected `keys`. A live draft can create one entry per keystroke; define history boundaries without delaying the form's authoritative model writes. Test `skip` behavior and the configured history limit. The tagged v22.0.1 implementation has a limit-enforcement discrepancy, so treat `maxStackSize` as a setting to verify, not a proven memory bound.

`clearUndoRedo(store)` clears the stacks while preserving the last record. `clearUndoRedo(store, { lastRecord: null })` also clears that history baseline. Neither resets store values. Prefer this helper over deprecated `clearStack()`.

## Call state, immutable state, and data services

`withCallState` adds `callState` and `loading/loaded/error` signals, with collection-prefixed variants. `setLoading`, `setLoaded`, and `setError` are imported updater functions used with `patchState`, not generated methods.

`withImmutableState` freezes object-valued state in development by default, optionally in production. It is runtime mutation detection, separate from SignalStore's compile-time protected state. Primitive root properties are not protected by this feature in v20+.

`withDataService` composes entity CRUD with a Promise-based `DataService`. The docs call call-state optional, but v22.0.1 public overloads require it. Include matching `withCallState` and entity state in typed examples. Its CRUD methods return `Promise<void>` and rethrow failures; give callers a visible failure path.

Sources and tagged discrepancies: [Toolkit v22 audit](toolkit-v22-audit.md), checked 2026-09-08. The audit separates verified declarations from runtime risks not tested in this workspace.
