# NgRx Toolkit v22 audit

Checked 2026-09-08 against the live primary docs and tag `v22.0.1`, commit `d95889c739afa59b2c026fa1b21604cfff0000c1`. All 12 extensions linked by the [extensions index][index] were read. Tagged declarations and implementation take precedence over conflicting examples. This is a source audit, not a compilation or runtime test. Rechecked 2026-09-29: the npm `latest` tag is still 22.0.1, published 2026-09-01, so these findings stand.

## Verified facts

### Package and resources

- Starting with v22, install/import `@ngrx-toolkit/core`; v21 and earlier use `@angular-architects/ngrx-toolkit`. The tag requires Angular core/common and NgRx signals `^22.0.0`, RxJS `^7.0.0`; NgRx Store `^22.0.0` is an optional peer. [Index][index], [manifest][package], [release][release].
- `withResource(factory, options?)` accepts one `ResourceRef` or a named dictionary. Unnamed members are `value`, `status`, `error`, `isLoading`, `hasValue`, `_reload`, and **`snapshot`**. Named equivalents include `userValue`, `userHasValue`, `_userReload`, and **`userSnapshot`**, not `userResourceSnapshot`. [Source][resource-src].
- In v22.0.1, `store.hasValue()` narrows `store.value()`, and `store.userHasValue()` narrows `store.userValue()`. The predicates preserve the original store type while excluding `undefined` from the guarded value. Tagged type tests cover both forms. A blanket “flat aliases cannot narrow” rule is wrong for this tag. [Declarations][resource-src], [type tests][resource-tests].
- `mapToResource(storeInstance, 'user')` returns a typed `Resource<T>` with `value/status/error/isLoading/hasValue/snapshot`. Its `hasValue()` also narrows. It neither creates `store.userResource` nor returns a writable `ResourceRef`; reload stays on `_userReload()`. Its name constraint requires the complete named member set, including `Snapshot`. [Source][resource-src], [tests][resource-tests].
- Resource values are writable store state through `patchState` at `value` or `<name>Value`. The default error strategy, `'undefined value'`, can return `undefined` even with a resource default. `'previous value'` retains a previously observed value; `'native'` preserves native behavior. Snapshot signals are forwarded directly, not rebuilt from the proxied value. [Docs][resource-doc], [implementation][resource-src].
- `withEntityResources` composes `withResource`, adds `ids/entityMap/entities` or named equivalents, and forwards resource snapshots. Entities require an `id`. Entity updaters change the linked entity view, not the underlying resource array; later resource changes recompute that view. There is no second error-options argument in the tagged signature. [Docs][entity-doc], [source][entity-src].

### Mutations

- `rxMutation<Parameter, Result>` accepts an operation returning `Observable<Result>`, either directly or under `operation`. `httpMutation<Parameter, Result>` accepts a request function directly or options containing `request`; `url` and `method` are required. `parse?: (response: unknown) => Result` transforms the body. Explicit response generics are supported without `parse`; a cast alone does not validate the response. [Rx source][rx-src], [HTTP source][http-src].
- Calling either mutation returns `Promise<MutationResult<Result>>`: `{status: 'success', value}`, `{status: 'error', error}`, or `{status: 'aborted'}`. The status signal instead uses `idle/pending/error/success`; it has no `aborted` state. Standalone mutations expose `value/status/error/isPending/isSuccess/hasValue`; HTTP mutations also expose progress, headers, and a string-valued `statusCode`. [Types][mutation-types], [HTTP source][http-src].
- `withMutations` exposes each callable method plus only `<name>IsPending`, `<name>Status`, and `<name>Error`. It does **not** expose `<name>Value`, `<name>HasValue`, `<name>IsSuccess`, or the standalone mutation object's properties on the method. This matches the v22.0.1 method-signature fix. Consume the returned result or patch state in callbacks. [Source][mutations-src], [release][release].
- Operator adapters are `concatOp` by default for queuing, `exhaustOp` for ignoring overlapping calls, `mergeOp` for concurrency, and `switchOp` for switching subscriptions. Exhausted calls resolve as `aborted`; cancellation before an emission can also resolve as `aborted`. Use Toolkit adapters, not bare RxJS operators. [Docs][mutations-doc], [adapters][operators], [implementation][rx-src].
- `onSuccess(result, parameter)` and `onError(error, parameter)` return `void` and are not awaited. A mutation promise therefore does not wait for asynchronous callback work. `rxMutation` uses an explicit injector or the current injection context for destruction; `httpMutation` additionally calls `inject(HttpClient)` directly. [Rx source][rx-src], [HTTP source][http-src].
- Mutation `hasValue()` still excludes `undefined` from **Parameter**, not Result, so it does not narrow `value(): Result | undefined`. This differs from the fixed resource guards. Narrow the awaited result by `status`, or read the standalone value once and check that local variable. [Types][mutation-types], [issue #235][narrowing-issue].

### Remaining indexed extensions

- Devtools: `updateState(store, actionName, ...updaters)` labels updates; `renameDevtoolsName` changes instance names; `withDisabledNameIndices` rejects duplicate active names; `withMapper` transforms exported state. `withTrackedReducer` tracks native Events reducers and payloads, and requires `withDevtools(name, withGlitchTracking())`, otherwise initialization throws. Devtools remain enabled in production by default; the exported stub is spelled `withDevToolsStub`. [Docs][devtools-doc], [tracked reducer][tracked-src], [exports][exports].
- Storage sync: defaults to local storage, JSON serialization, initial reading, and automatic writes. `select` limits persisted state; `parse/stringify` customize serialization. `autoSync: false` leaves `readFromStorage/writeToStorage/clearStorage` under caller control. `withSessionStorage()` and async `withIndexedDB()` select strategies; await initial synchronization before dependent writes, or explicitly sequence manual reads/writes. The docs describe server stubs, subject to the SSR caveat below. [Docs][storage-doc], [source][storage-src].
- Undo/redo: exposes `undo/redo/canUndo/canRedo`; options select collections, extra state keys, initial changes to skip, and a documented stack limit. `clearUndoRedo(store)` clears both stacks but preserves the last record. `{lastRecord: null}` clears that baseline too; neither form resets store state. [Docs][undo-doc], [source][undo-src].
- Reset: `withReset()` exposes `resetState()` and captures state in its initialization hook. `setResetState(store, state)` replaces that baseline. Reset patches state; it is not documented as canceling requests or clearing mutation metadata or undo history. [Docs][reset-doc], [source][reset-src].
- Conditional: both branches must produce the same state, props, and methods. The condition chooses a branch when the feature is applied, not reactively when signals later change. [Docs][conditional-doc], [source][conditional-src].
- Data service: composes with entity state and a Promise-based `DataService` implementing `load/loadById/create/update/updateAll/delete`. Store CRUD methods return `Promise<void>`, patch results, and rethrow failures. Collection names generate methods such as `loadFlightEntities` and `updateSelectedFlightEntities`. The call-state requirement has a doc/type discrepancy below. [Docs][data-doc], [source][data-src].
- Immutable state: `withImmutableState` replaces `withState`, recursively freezes object-valued state under its own keys, and watches changes. It runs in development unless `enableInProduction: true`. Primitive root properties are not protected in v20+. [Docs][immutable-doc], [source][immutable-src], [freezer][freeze-src].
- Call state: state is `'init' | 'loading' | 'loaded' | {error: string}`, with `loading/loaded/error` signals. `setLoading/setLoaded/setError` are imported patch helpers, not automatically attached store methods. Both `collection` and `collections` configurations prefix state/signals. [Docs][call-doc].
- Redux: `withRedux` is deprecated in favor of `@ngrx/signals/events`, available since 19.2. The separately documented Redux connector is a secondary entry point, `@ngrx-toolkit/core/redux-connector`, with an NgRx Store dependency; it is not the native Events replacement. [Redux docs][redux-doc], [connector docs][connector-doc].

## Migration and replacement guidance

- Update the old package dependency and imports to `@ngrx-toolkit/core` for v22, including `/redux-connector` where used. The reviewed release notes do not establish an automatic rename migration. The tagged source manifest says `22.0.0` despite the `v22.0.1` tag; this audit does not verify registry tarball metadata. [Release][release], [manifest][package].
- Replace deprecated `withFeatureFactory` with `withFeature` from `@ngrx/signals`, available since 19.1; replace `withRedux` with native Events. [Feature-factory docs][factory-doc], [Redux docs][redux-doc].
- Replace deprecated `store.clearStack()` with `clearUndoRedo(store)`, `withIndexeddb` with `withIndexedDB`, and the storage config's `storage` option with a strategy such as `withSessionStorage()`. [Undo source][undo-src], [exports][exports], [storage source][storage-src].
- `withResource`, `mapToResource`, and `withEntityResources` remain marked experimental in source. The resource docs discuss a possible future NgRx implementation, not a shipped replacement to assume today. [Resource docs][resource-doc], [resource source][resource-src], [entity source][entity-src].

## Documentation gaps and untested risks

- Resource examples omit v22 snapshots, sometimes import `httpResource` from the wrong package, and interpolate signal functions without invoking them. Tagged tests use `@angular/common/http` and invoke signals. Prefer declarations and tests over copying those snippets. [Docs][resource-doc], [tests][resource-tests].
- Mutation docs advertise named value aliases absent from the tag and overstate `parse` as necessary for response typing. Their warning about mutation narrowing remains valid; it must not be applied to the fixed resource guards. [Docs][mutations-doc], [store mapping][mutations-src], [HTTP source][http-src], [resource tests][resource-tests].
- Named mutation error aliases are declared `Signal<Error | undefined>`, although runtime forwards the standalone `Signal<unknown>` without validation. Treat the value as untrusted and narrow it before accessing properties. [Store mapping][mutations-src], [types][mutation-types].
- The resource `'previous value'` proxy caches every successful observed read, including undefined during loading. It can throw on the first error-state read when no value was observed. It does not guarantee the last successful response or a safe first-error fallback. Snapshots forward the source, while writes forward to the source value signal; verify patch/status/snapshot behavior rather than assuming patches never reach snapshots. [Implementation][resource-src].
- `httpMutation` calls its request factory inside `rxMutation`'s operation, before returning the inner Observable. A synchronous factory throw occurs outside that inner pipeline's catch/finalize. Promise settlement and recovery need runtime tests. Validate potentially throwing request mappings before invoking the mutation; a caller's catch alone does not prove this internal path settles. [HTTP source][http-src], [Rx source][rx-src].
- Entity docs advertise readonly arrays, but tagged input aliases accept mutable arrays. The unnamed result composes `ResourceResult<Entity>` rather than an array result, and the named result uses `NamedResourceResult<T, false>` despite runtime default undefined-on-error handling. These are declaration discrepancies; compile concrete entity examples before promising their resource value/snapshot types. [Docs][entity-doc], [source][entity-src].
- Data-service docs call `withCallState` optional and runtime checks are conditional, but both public overloads require call-state state. Include matching `withCallState` in typed examples unless compilation proves otherwise. [Docs][data-doc], [source][data-src].
- Mutation completion reads shared `innerStatus/value/error`, not per-invocation result storage. Interleaved multi-emission streams and cancellation after an emission need targeted tests before claiming isolated concurrent results. Async callback completion is already excluded by the implementation. [Rx source][rx-src].
- Storage's default strategy selection accesses `config.storage()` and `localStorage` before platform guards. Treat universal SSR safety as unverified, despite the documented stubs; test explicit strategies in the target server runtime. Undo source also checks a cleared redo stack for its size limit and calls `undoStack.unshift()` without arguments, so the documented `maxStackSize` bound is not enforced by that code. [Storage docs][storage-doc], [storage source][storage-src], [undo source][undo-src].

## Skill ownership and audit use

- The [ngrx-toolkit skill](../SKILL.md) owns Toolkit selection and workflow, including this audit and the extension catalog. Native SignalStore, Events, and general state architecture remain in `ngrx-signals`. Both skills link to one authoritative copy of each reference.
- Gate examples on the installed Toolkit version. For v22, cover snapshots and both resource guard forms; distinguish standalone mutation objects from `withMutations` methods. Compile entity and mutation examples and test concurrent results, hydration order, and history limits before treating them as recipes.
- Keep this audit as dated evidence; consult tagged declarations again when versions change rather than converting unresolved risks into permanent API rules.

## Sources

[index]: https://ngrx-toolkit.angulararchitects.io/docs/extensions
[release]: https://github.com/ngrx-toolkit/core/releases/tag/v22.0.1
[package]: https://github.com/ngrx-toolkit/core/blob/v22.0.1/libs/ngrx-toolkit/package.json
[resource-doc]: https://ngrx-toolkit.angulararchitects.io/docs/with-resource
[resource-src]: https://github.com/ngrx-toolkit/core/blob/v22.0.1/libs/ngrx-toolkit/src/lib/with-resource.ts
[resource-tests]: https://github.com/ngrx-toolkit/core/blob/v22.0.1/libs/ngrx-toolkit/src/lib/with-resource.spec.ts
[entity-doc]: https://ngrx-toolkit.angulararchitects.io/docs/with-entity-resources
[entity-src]: https://github.com/ngrx-toolkit/core/blob/v22.0.1/libs/ngrx-toolkit/src/lib/with-entity-resources.ts
[mutations-doc]: https://ngrx-toolkit.angulararchitects.io/docs/mutations
[mutations-src]: https://github.com/ngrx-toolkit/core/blob/v22.0.1/libs/ngrx-toolkit/src/lib/with-mutations.ts
[mutation-types]: https://github.com/ngrx-toolkit/core/blob/v22.0.1/libs/ngrx-toolkit/src/lib/mutation/mutation.ts
[rx-src]: https://github.com/ngrx-toolkit/core/blob/v22.0.1/libs/ngrx-toolkit/src/lib/mutation/rx-mutation.ts
[http-src]: https://github.com/ngrx-toolkit/core/blob/v22.0.1/libs/ngrx-toolkit/src/lib/mutation/http-mutation.ts
[operators]: https://github.com/ngrx-toolkit/core/blob/v22.0.1/libs/ngrx-toolkit/src/lib/flattening-operator.ts
[narrowing-issue]: https://github.com/ngrx-toolkit/core/issues/235
[devtools-doc]: https://ngrx-toolkit.angulararchitects.io/docs/with-devtools
[tracked-src]: https://github.com/ngrx-toolkit/core/blob/v22.0.1/libs/ngrx-toolkit/src/lib/devtools/with-tracked-reducer.ts
[exports]: https://github.com/ngrx-toolkit/core/blob/v22.0.1/libs/ngrx-toolkit/src/index.ts
[storage-doc]: https://ngrx-toolkit.angulararchitects.io/docs/with-storage-sync
[storage-src]: https://github.com/ngrx-toolkit/core/blob/v22.0.1/libs/ngrx-toolkit/src/lib/storage-sync/with-storage-sync.ts
[undo-doc]: https://ngrx-toolkit.angulararchitects.io/docs/with-undo-redo
[undo-src]: https://github.com/ngrx-toolkit/core/blob/v22.0.1/libs/ngrx-toolkit/src/lib/undo-redo/with-undo-redo.ts
[reset-doc]: https://ngrx-toolkit.angulararchitects.io/docs/with-reset
[reset-src]: https://github.com/ngrx-toolkit/core/blob/v22.0.1/libs/ngrx-toolkit/src/lib/with-reset.ts
[conditional-doc]: https://ngrx-toolkit.angulararchitects.io/docs/with-conditional
[conditional-src]: https://github.com/ngrx-toolkit/core/blob/v22.0.1/libs/ngrx-toolkit/src/lib/with-conditional.ts
[data-doc]: https://ngrx-toolkit.angulararchitects.io/docs/with-data-service
[data-src]: https://github.com/ngrx-toolkit/core/blob/v22.0.1/libs/ngrx-toolkit/src/lib/with-data-service.ts
[immutable-doc]: https://ngrx-toolkit.angulararchitects.io/docs/with-immutable-state
[immutable-src]: https://github.com/ngrx-toolkit/core/blob/v22.0.1/libs/ngrx-toolkit/src/lib/immutable-state/with-immutable-state.ts
[freeze-src]: https://github.com/ngrx-toolkit/core/blob/v22.0.1/libs/ngrx-toolkit/src/lib/immutable-state/deep-freeze.ts
[call-doc]: https://ngrx-toolkit.angulararchitects.io/docs/with-call-state
[redux-doc]: https://ngrx-toolkit.angulararchitects.io/docs/with-redux
[connector-doc]: https://ngrx-toolkit.angulararchitects.io/docs/create-redux-state
[factory-doc]: https://ngrx-toolkit.angulararchitects.io/docs/with-feature-factory
