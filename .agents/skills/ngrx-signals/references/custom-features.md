# Custom store features

## When to extract a feature

A custom feature packages a state contract and its transitions. Its standalone updaters may be called by a consuming store; ownership does not require hiding every updater inside a feature method.

**Reuse** — the same slice and boundaries belong in more than one store:

- A cross-cutting concern orthogonal to every domain: call state, storage sync, undo/redo, logging, devtools.
- A team-wide convention that must be applied identically everywhere.

**Composition** — one coherent piece of a single store's domain, named and packaged. Business logic belongs in a feature just as readily as mechanics do; the Toolkit's own `withDataService` bundles searching, filtering, and selection, which is domain behaviour, not a technical concern. A single consumer is enough here. The test is cohesion: the state, its boundaries, and the work that reads it move together and can be read as one unit.

Write the state inline when neither test passes. A feature that wraps one method or one field removes the state from where a reader looks for it and buys nothing.

## The guardrail: do not shrink features to fit a large store

Check the installed overloads if a large composition stops inferring. A feature-count limit is a prompt to review cohesion, not a universal architecture rule. Group related behavior into a custom feature or split independent lifetimes into separate stores. State used by one component tree usually belongs in a component-provided store. Use events for independent cross-store consumers ([`events-and-coordination.md`](events-and-coordination.md)).

For new production cross-cutting features, prefer an equivalent from the installed Toolkit when it fits. Check the [Toolkit catalog](../../ngrx-toolkit/references/toolkit-extensions.md) and verify installed exports. Core-only implementations remain valid; this is not a requirement to install Toolkit or replace existing features.

## A reuse feature

`signalStoreFeature` composes store features into one unit. Return it from a function so callers spell it like any built-in feature. The local `withCallState` below teaches composition and supports core-only projects; prefer the installed Toolkit equivalent for new production use when it fits.

```ts
import { computed } from '@angular/core';
import {
  patchState,
  signalStoreFeature,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';

export type CallState = 'init' | 'loading' | 'loaded' | { error: string };

export function withCallState() {
  return signalStoreFeature(
    withState<{ callState: CallState }>({ callState: 'init' }),
    withComputed(({ callState }) => ({
      isLoading: computed(() => callState() === 'loading'),
      error: computed(() => {
        const state = callState();
        return typeof state === 'object' ? state.error : null;
      }),
    })),
  );
}
```

Prefer standalone updater functions when callers need to compose state changes in one `patchState` call or test them without a store. Feature methods remain valid write boundaries; exporting updaters is not mandatory.

```ts
export function setLoading(): { callState: CallState } {
  return { callState: 'loading' };
}

// in a consuming store
patchState(store, setLoading(), { query });
```

## A domain feature

A feature can own a whole slice of the domain: its request state, the write boundary for that state, and the resource that reacts to it. This is the skill's default architecture packaged as one unit — and it is worth extracting on cohesion alone, before any second consumer exists.

```ts
import { httpResource } from '@angular/common/http';
import { withResource } from '@ngrx-toolkit/core';
import {
  patchState,
  signalMethod,
  signalStoreFeature,
  withMethods,
  withState,
} from '@ngrx/signals';

type Route = { from: string; to: string };

export function withFlightSearch() {
  return signalStoreFeature(
    withState<Route>({ from: '', to: '' }),
    withMethods((store) => ({
      setRoute: signalMethod<Route>((route) => patchState(store, route)),
    })),
    withResource(
      ({ from, to }) => ({
        flights: httpResource<Flight[]>(
          () =>
            from() && to()
              ? { url: '/api/flights', params: { from: from(), to: to() } }
              : undefined,
          { parse: FlightListSchema.parse, defaultValue: [] },
        ),
      }),
      { errorHandling: 'undefined value' },
    ),
  );
}

export const FlightBookingStore = signalStore(
  { providedIn: 'root' },
  withFlightSearch(),
  withFlightBooking(),
);
```

The store now lists its responsibilities. The feature owns its request inputs; `signalMethod` supports reactive callers here, while an ordinary method is enough for static calls. The resource reads the state that decides its request.

Feature order still binds across the composition. `withFlightSearch()` declares its state before the resource that reads it, so a later feature can consume `flightsValue` — and a feature that needs a member from an earlier one must come after it.

## Connecting a feature to the store

Two ways to give a feature access to store members. They are not interchangeable.

### `withFeature` — pass the signals in

The default. The feature takes plain `Signal` arguments and knows nothing about the store's shape, so it composes anywhere.

```ts
import { Signal, computed } from '@angular/core';
import {
  patchState,
  signalMethod,
  signalStore,
  signalStoreFeature,
  withComputed,
  withFeature,
  withMethods,
  withState,
} from '@ngrx/signals';
import { withEntities } from '@ngrx/signals/entities';

export function withBooksFilter(books: Signal<Book[]>) {
  return signalStoreFeature(
    withState({ query: '' }),
    withComputed(({ query }) => ({
      filteredBooks: computed(() =>
        books().filter((book) => book.name.includes(query())),
      ),
    })),
    withMethods((store) => ({
      setQuery: signalMethod<string>((query) =>
        patchState(store, setQueryState(query)),
      ),
    })),
  );
}

// 👇 The state change as a standalone updater: tree-shakes, tests without a store,
//    and a consuming store can compose it into one patchState call.
export function setQueryState(query: string): { query: string } {
  return { query };
}

export const BooksStore = signalStore(
  withEntities<Book>(),
  withFeature(({ entities }) => withBooksFilter(entities)),
);
```

`withFeature` comes from `@ngrx/signals` 19.1 and later. The Toolkit's `withFeatureFactory` did the same job and is deprecated — migrate calls to `withFeature`.

### Input constraints — require the shape

Declare required `state`, `props`, or `methods` with the `type` helper when the feature must reach members it cannot receive as arguments — everything `withEntities` generates is the usual case. This is how a reusable feature attaches to a shape rather than to a store.

```ts
import { computed } from '@angular/core';
import {
  signalStoreFeature,
  type,
  withComputed,
  withState,
} from '@ngrx/signals';
import { EntityId, EntityState, withEntities } from '@ngrx/signals/entities';

export function withSelectedEntity<Entity>() {
  return signalStoreFeature(
    // 👇 Any store carrying entity state can take this feature.
    { state: type<EntityState<Entity>>() },
    withState<{ selectedEntityId: EntityId | null }>({
      selectedEntityId: null,
    }),
    withComputed(({ entityMap, selectedEntityId }) => ({
      selectedEntity: computed(() => {
        const selectedId = selectedEntityId();
        // 👇 `!= null`, not a truthy check: EntityId is string | number, so a valid
        //    id of 0 or "" would read as "nothing selected".
        return selectedId != null ? (entityMap()[selectedId] ?? null) : null;
      }),
    })),
  );
}

export const BooksStore = signalStore(
  withEntities<Book>(),
  withSelectedEntity(),
);
```

This variant requires the entity-state shape. A different generic variant could accept `Signal<EntityMap<Entity>>` through `withFeature` instead. TypeScript rejects a missing input contract. Prefer explicit signal arguments when the feature need not depend on generated store member names.

**A constraint on `EntityState` fits only the unnamed collection.** `withEntities({ entity: type<Book>(), collection: 'books' })` produces `NamedEntityState<Book, 'books'>` with `booksEntityMap` and `booksIds` — which does not satisfy `type<EntityState<Entity>>()`, so the store fails to compile. This is the common reason a constrained feature suddenly stops fitting.

Two ways out, and the first is usually right:

1. **Rewrite the feature to take the entity-map signal through `withFeature`**. That variant can serve named and unnamed collections. The zero-argument constrained implementation above must change before passing it an argument.
2. **Constrain on `NamedEntityState<Entity, Collection>`** with the collection name as a second generic parameter, when the feature must generate matching names of its own.

`entityMap()[id]` is typed as always present because `EntityMap<Entity>` is `Record<EntityId, Entity>`, so a missing id returns `undefined` at runtime while the type claims otherwise. The `?? null` above is deliberate: it makes the absent case explicit rather than trusting the index signature. Enable `noUncheckedIndexedAccess` and the compiler agrees with the runtime.

The guide documents an inference issue when combining static-input custom features without generics. If reproduced in the target compiler, add an unused generic parameter to the affected feature factories as the guide shows. Keep inferred outputs rather than erasing them to a broad `SignalStoreFeature` return type.

### Reuse a feature contract

In v22, `SignalStoreFeatureType` extracts the state, props, and methods produced by a feature factory. Use it when another feature intentionally depends on that whole contract; use a narrower explicit input for looser coupling.

```ts
import { computed } from '@angular/core';
import {
  SignalStoreFeatureType,
  signalStoreFeature,
  type,
  withComputed,
} from '@ngrx/signals';

type CallStateFeature = SignalStoreFeatureType<typeof withCallState>;

export function withStatusLabel<_>() {
  return signalStoreFeature(
    type<CallStateFeature>(),
    withComputed(({ isLoading, error }) => ({
      statusLabel: computed(() =>
        isLoading() ? 'Loading' : (error() ?? 'Ready'),
      ),
    })),
  );
}
```

Here `withCallState` is the local example above, not Toolkit's differently named computed members. Place it before `withStatusLabel`. Compile generic feature consumers affected by [dynamic deep signals](store-and-reactivity.md#dynamic-deep-signals); their union slices may need `DeepSignalOf<T>` annotations.

Source: [custom store features](https://ngrx.io/guide/signals/signal-store/custom-store-features).

## Generic and dynamically named features

A feature that names its members from a config — `withCallState({ prop: 'books' })` producing `booksCallState` and `booksLoading` — needs mapped types plus an overload pair: a precise public signature, and a loose implementation signature.

```ts
export type NamedCallState<Prop extends string> = {
  [K in Prop as `${K}CallState`]: CallState;
};

export type NamedCallStateComputed<Prop extends string> = {
  [K in Prop as `${K}Loading`]: Signal<boolean>;
};

// 👇 Public signature: precise.
export function withCallState<Prop extends string>(config: {
  prop: Prop;
}): SignalStoreFeature<
  { state: {}; props: {}; methods: {} },
  {
    state: NamedCallState<Prop>;
    props: NamedCallStateComputed<Prop>;
    methods: {};
  }
>;
// 👇 Implementation signature: loose, so computed keys type-check inside.
export function withCallState<Prop extends string>(config: {
  prop: Prop;
}): SignalStoreFeature {
  const callStateKey = `${config.prop}CallState`;
  return signalStoreFeature(
    withState({ [callStateKey]: 'init' }),
    withComputed((state: Record<string, Signal<CallState>>) => {
      const callState = state[callStateKey];
      if (!callState) {
        throw new Error(`Missing required call-state signal: ${callStateKey}`);
      }
      return {
        [`${config.prop}Loading`]: computed(() => callState() === 'loading'),
      };
    }),
  );
}
```

This is library-grade cost. Pay it for a feature many stores consume, and take a fixed property name for anything narrower.

## Conditional features

`withConditional(condition, whenTrue, whenFalse)` from the Toolkit picks between two implementations. Both branches must expose **exactly the same** state, props, and methods, or the types reject it. That constraint is the whole design: the store's shape cannot depend on a runtime condition.

So the normal shape is two real implementations of one interface — a live one and a stub:

```ts
import { withConditional } from '@ngrx-toolkit/core';

signalStore(
  withState({ isAdmin: false }),
  withConditional(
    ({ isAdmin }) => isAdmin(),
    withLiveAdminTools(),
    withStubAdminTools(),
  ),
);
```

The condition runs when the feature is applied. Changing `isAdmin` later does not switch implementations; use a reactive check inside methods/computeds for runtime permissions. `emptyFeature` fits only a branch that also adds no members, such as a hooks-only feature:

```ts
import { emptyFeature, withConditional } from '@ngrx-toolkit/core';

signalStore(
  withState({ isAdmin: false }),
  // 👇 withAuditHooks() adds only withHooks, so its output is empty too.
  withConditional(({ isAdmin }) => isAdmin(), withAuditHooks(), emptyFeature),
);
```

## Custom feature review

Before completion, verify:

- The feature passes the reuse test or the cohesion test, and which one is clear from its name.
- New production features prefer an installed Toolkit equivalent when it fits; teaching examples, core-only projects, and existing features remain valid.
- The store fits installed composition overloads without erasing feature types; its features have coherent responsibilities.
- Standalone updaters are considered for composable state changes; feature methods may own the transitions instead.
- The feature takes signals through `withFeature` unless it must constrain the store's shape.
- No call to the deprecated `withFeatureFactory` remains.
- Dynamic naming is used only where several stores consume the feature.
