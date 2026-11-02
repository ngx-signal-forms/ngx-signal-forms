# Store and reactivity

## State boundary

Keep SignalStore state protected. Components read store signals and call a store write boundary; `patchState` stays inside the store. This is what keeps each value's owner findable.

State is protected by default, so `patchState` from outside the store fails to compile. Keep writes behind public store methods. This is compile-time access control, not runtime deep freezing; Toolkit's immutable-state checks are a separate choice.

Place a feature after every member it consumes. A resource-backed draft follows the resource; a computed over that draft follows the draft; a method calling a mutation follows the mutation. Multiple `withMethods`, `withComputed`, or `withProps` blocks are valid. Hooks that call methods follow those methods. There is no universal feature-order template.

A custom feature slots in wherever its own dependencies allow. Reach for one when a slice and its boundaries repeat across stores — see [`custom-features.md`](custom-features.md).

## Dependencies with `withProps`

`withProps` adds non-state members: injected services, resource objects, static values, and observables. Use it for dependencies shared by later features. Feature factories may also inject a dependency locally when only that feature needs it. Capture dependencies during construction, not in later asynchronous callbacks.

```ts
withProps(() => ({
  booksService: inject(BooksService),
  logger: inject(Logger),
})),
withMethods(({ booksService, logger, ...store }) => ({ /* ... */ })),
```

Destructure the props you need and keep the rest as `store`, because `patchState` needs the store object, not the props.

Destructure members when their identity is stable. For v22 dynamic union slices, retain the store receiver when narrowing the current deep-signal object. Flat request signals make simple destructuring useful:

```ts
withResource(({ _tickets, query, offset }) => ({
  tickets: _tickets.searchResource(query, offset),
}), { errorHandling: "undefined value" }),
```

Keep the whole `store` parameter only where you need the object itself — a `patchState` call, or a `withMutations` callback reconciling state.

Prefix a prop with an underscore — `_flightService` — to make it store-internal. **This is enforced, not a convention.** `signalStore` strips every underscore-prefixed member from the store's public type, so later features inside the store reach `_flightService` while a component reading `store._flightService` fails to compile.

That makes the prefix the encapsulation tool: injected services, raw debounced resources, and any slice you do not want a template touching all take it. Anything without the prefix is public API, so name it deliberately.

The same rule explains the generated `_reload`: it is not merely discouraged from a component, it is unreachable. Expose it through a named `withMethods` method when a component must trigger a refresh.

## Write boundaries with `signalMethod`

`signalMethod` accepts a static value, a `Signal`, or a computation. Given a static value it applies one update; given a signal it tracks that signal and re-runs. It tracks **only the argument passed to it** — signals read inside the callback body are not tracked.

```ts
import {
  patchState,
  signalMethod,
  signalStore,
  withMethods,
  withState,
} from '@ngrx/signals';

type SearchState = { query: string; page: number };

export const SearchStore = signalStore(
  withState<SearchState>({ query: '', page: 1 }),
  withMethods((store) => ({
    setQuery: signalMethod<string>((query) => {
      patchState(store, { query, page: 1 });
    }),
    setPage: signalMethod<number>((page) => {
      patchState(store, { page });
    }),
  })),
);
```

`store.setQuery(queryControlSignal)` makes the query input reactive for as long as the caller lives. `store.setQuery('angular')` applies one immediate update.

### Lifecycle

A reactive `signalMethod` uses an effect internally, bound to the injection context where it is **called**. Call it inside the consuming component's injection context so cleanup follows that component. Outside an injection context, pass the injector explicitly:

```ts
readonly injector = inject(Injector);

ngOnInit(): void {
  this.store.setQuery(this.queryControl, { injector: this.injector });
}
```

A root-provided store called outside an injection context with a signal and no explicit injector retains the binding for the store's lifetime. This fallback is deprecated since NgRx 21.1. Bind signals/computations in the caller's injection context or pass its injector. Static value calls need no caller injector. The same lifetime rule applies to reactive `rxMethod` inputs.

### When `rxMethod` fits better

Reach for `rxMethod` from `@ngrx/signals/rxjs-interop` for stream ordering, retries, debounce, or recovery. Handle failures inside the inner request stream so later inputs still work. In NgRx v22, `tapResponse` from `@ngrx/operators` takes the observer-object signature, not positional callbacks. Signals batch synchronous changes and are not an event log.

## Dynamic deep signals

In NgRx v22, object-literal members of a union become separate `DeepSignal` members; primitives and dynamic records remain regular signals. This applies to `signalState`, store state slices, and `deepComputed` results.

```ts
import { computed } from '@angular/core';
import { signalState } from '@ngrx/signals';

const state = signalState<{ user: { name: string } | null }>({ user: null });
const label = computed(() =>
  'name' in state.user ? state.user.name() : 'Guest',
);
```

Use `in` on the signal object to narrow access to nested signals. Alternatively, read `state.user()` once into a local and narrow that value. Re-evaluate the guard in a reactive computation when the union can change. Keep nullable state nullable instead of inventing placeholder records for deep access.

Generic custom features may now expose `DeepSignalOf<Entity | null>` rather than `Signal<Entity | null>`. Prefer inference; use the exported `DeepSignalOf` for explicit generic annotations and compile the feature's concrete usages. On v21, read/narrow the union value and derive individual fields with `computed`.

Sources: [SignalState](https://ngrx.io/guide/signals/signal-state), [DeepComputed](https://ngrx.io/guide/signals/deep-computed), [migration](https://ngrx.io/guide/migration/v22).

## Linked state

`withLinkedState` creates writable state derived from signals. Each slice accepts `patchState`; eligible object values gain deep signals under the rules above. Both explicit writes and source recomputation are legitimate. A custom computation can preserve the previous written value instead of replacing it on each source change.

Give it a computation for the simple case:

```ts
withLinkedState(({ options }) => ({
  selectedOption: () => options()[0] ?? undefined,
}));
```

Give it a `WritableSignal` — usually a `linkedSignal` — when the recomputation needs the previous value:

```ts
import { linkedSignal } from '@angular/core';
import { signalStore, withLinkedState, withState } from '@ngrx/signals';

type Option = { id: string; label: string };

export const OptionsStore = signalStore(
  withState({ options: [] as Option[] }),
  withLinkedState(({ options }) => ({
    selectedOption: linkedSignal<Option[], Option | undefined>({
      source: options,
      computation: (nextOptions, previous) =>
        nextOptions.find((option) => option.id === previous?.value?.id) ??
        nextOptions[0],
    }),
  })),
);
```

The `previous` argument is what keeps a still-valid selection alive when its source list changes.

Choose `withComputed` when nothing writes the value, and `withLinkedState` when something does. An unguarded linked slice sourced from a resource value resets when that source changes during refetch. A custom computation can preserve a seeded draft across refetches; choose the reset or preservation policy in [`signal-forms-bridge.md`](signal-forms-bridge.md).

## Lifecycle with `withHooks`

`withHooks` adds `onInit` and `onDestroy`. `onInit` runs inside the injection context, so `inject()` and `takeUntilDestroyed()` work there.

```ts
withHooks({
  onInit(store) {
    store.setQuery(inject(RouteQuery).value);
  },
  onDestroy(store) {
    console.log('final query', store.query());
  },
});
```

Use the factory form when both hooks share a dependency or a closure variable:

```ts
withHooks((store) => {
  const logger = inject(Logger);
  return {
    onInit() {
      logger.info('opened');
    },
    onDestroy() {
      logger.info('closed', store.query());
    },
  };
});
```

`onInit` earns its place for work that genuinely starts at store creation: seeding a draft from a route parameter, binding a reactive `signalMethod` to an external signal, subscribing to a stream that must outlive any one component.

Keep declarative work out of it. A resource already fetches when the signals its factory reads become valid, so kicking one off from `onInit` adds a second trigger for something that has one. If a hook exists only to copy one signal into another, that value wants `withComputed` or `withLinkedState` instead.

## Toolkit lifecycle and devtools

For reset baselines, storage hydration and SSR, undo/redo boundaries, or named DevTools updates, read [toolkit-extensions.md](../../ngrx-toolkit/references/toolkit-extensions.md). These extensions have their own version and lifecycle contracts.

## Store review

Before completion, verify:

- State changes only through store-owned boundaries.
- Every reactive `signalMethod` call has the injection context or explicit injector its lifetime needs.
- Each derived value is `withComputed` or `withLinkedState`, not a copy kept in sync.
- Feature order gives every factory the dependencies it reads.
- Writes use `patchState`, with `updateState` only where a DevTools name earns its call site.
