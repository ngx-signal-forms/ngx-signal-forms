# Events and coordination

## When a direct method is enough

For state a component owns, calling a method on its own provided store is the simplest design. Keep the action and the owner close together.

Reach for an event when the occurrence is meaningful on its own and several independent features react to it: authentication completed, the active organisation changed, a global refresh was requested. An event bus that only replaces a local setter adds a hop and removes the owner from view.

## Event shape

Name events `[Source] EventName`. Use `eventGroup` when a source emits several.

```ts
import { type } from '@ngrx/signals';
import { eventGroup } from '@ngrx/signals/events';

export const accountEvents = eventGroup({
  source: 'Account Page',
  events: {
    opened: type<void>(),
    organizationChanged: type<string>(),
  },
});
```

Use the single `event('[Source] Name', type<Payload>())` creator for a one-off event.

## Reducers own state

`withReducer` with `on()` handles synchronous state transitions. A handler returns a partial state object, a partial state updater, or an array of either.

```ts
import { signalStore, withState } from '@ngrx/signals';
import { on, withReducer } from '@ngrx/signals/events';

export const AccountStore = signalStore(
  withState({ organizationId: '' }),
  withReducer(
    on(accountEvents.organizationChanged, ({ payload: organizationId }) => ({
      organizationId,
    })),
  ),
);
```

## Handlers own side effects

`withEventHandlers` holds synchronous or asynchronous side effects. Each handler is an observable, commonly a pipe over `inject(Events)`; a `name$` key is a naming convention. Emit named success or failure events when other consumers need the outcome.

```ts
import { inject } from '@angular/core';
import { mapResponse } from '@ngrx/operators';
import { Events, withEventHandlers } from '@ngrx/signals/events';
import { switchMap, tap } from 'rxjs';

export const BookSearchStore = signalStore(
  // ... state and reducers
  withEventHandlers(
    (store, events = inject(Events), books = inject(BooksService)) => ({
      loadBooks$: events
        .on(bookSearchEvents.opened, bookSearchEvents.queryChanged)
        .pipe(
          switchMap(() =>
            books.getByQuery(store.query()).pipe(
              mapResponse({
                next: (result) => booksApiEvents.loadedSuccess(result),
                error: (error: unknown) =>
                  booksApiEvents.loadedFailure(
                    error instanceof Error
                      ? error.message
                      : 'Could not load books',
                  ),
              }),
            ),
          ),
        ),
      logError$: events
        .on(booksApiEvents.loadedFailure)
        .pipe(tap(({ payload }) => console.error(payload))),
    }),
  ),
);
```

`withEventHandlers` was named `withEffects` in earlier releases and in some articles. Check which name the installed `@ngrx/signals` exports before writing it.

## Where the event features sit

Feature order follows consumed members ([store-and-reactivity.md](store-and-reactivity.md)). State precedes its reducer and resource. Keeping reducers next to state is readable, but a resource that only consumes state need not follow the reducer to compile. Handlers follow any methods or props their factories use.

## Events and resources

For new read flows, prefer a resource over an event handler. Preserve existing event-handler reads unless migration is requested or needed for the fix. In a resource-based flow, let a reducer update the request state, and let the resource refetch through its own declared dependency:

```text
event
  → reducer updates organizationId
  → resource factory reads organizationId
  → resource refetches
```

The resource factory stays unaware of the event transport. For new reads, choose a handler pipe when the operation needs RxJS semantics a resource cannot express.

## Dispatch

`injectDispatch` keeps the event group's shape at the call site.

```ts
import { injectDispatch } from '@ngrx/signals/events';

@Component({/* ... */})
class OrganizationSelector {
  readonly dispatch = injectDispatch(accountEvents);

  selectOrganization(organizationId: string): void {
    this.dispatch.organizationChanged(organizationId);
  }
}
```

Inject `Dispatcher` directly when the event is chosen at runtime.

`Dispatcher` is `providedIn: 'platform'`. Without `provideDispatcher()`, instantiated consumers share that platform dispatcher, potentially across applications on the same platform. Stores must be instantiated to register consumers; dispatch does not create every store.

`provideDispatcher()` in a component's providers creates a child scope. Dispatched events then stay inside that subtree unless the call names a wider one: `this.dispatch({ scope: 'parent' }).queryChanged(query)` or `{ scope: 'global' }`. The three scopes are `'self'` (the default — stay in the current scope), `'parent'`, and `'global'`. Add a scope only where a subtree must keep its events to itself.

## Event review

Before completion, verify:

- Each event has a real cross-feature consumer or a stated decoupling purpose.
- Reducers hold synchronous event-driven state changes; ordinary store methods remain valid for local commands.
- Handlers hold side effects and emit outcomes needed by other consumers.
- In resource-based flows, refreshes follow changed request state, not a manual copy from the event side. Existing handler-based reads need not migrate.
- Dispatcher scope matches the intended audience; defaults are platform-wide, not local.
