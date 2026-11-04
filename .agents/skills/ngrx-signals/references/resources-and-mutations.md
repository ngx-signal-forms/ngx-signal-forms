# Resources and mutations

## Read graph: `withResource`

A resource is a **read model declared from request inputs**. It refetches when the signals its factory reads change. The NgRx Toolkit `withResource` extension lifts an Angular resource into SignalStore state and signals.

These examples target `@ngrx-toolkit/core` v22.0.1. Resource integration remains experimental. Pin the version and read [version gates](testing-and-version-gates.md) for older projects. Native NgRx [resource extensions](resource-extensions.md) customize an existing resource; they do not replace Toolkit's store integration or mutation APIs.

The generic snippets use names such as `UserSchema`, `UserListSchema`, and `toUpdateUserRequest()` as imports from the generated contract module in [`contracts.md`](contracts.md). They are not local substitute schemas.

```ts
import { httpResource } from '@angular/common/http';
import { signalStore, withState } from '@ngrx/signals';
import { withResource } from '@ngrx-toolkit/core';

type User = { id: string; name: string };

export const UsersStore = signalStore(
  withState({ query: '' }),
  withResource(
    ({ query }) => ({
      users: httpResource(
        () =>
          query().trim()
            ? `/api/users?q=${encodeURIComponent(query())}`
            : undefined,
        { parse: UserListSchema.parse, defaultValue: [] },
      ),
    }),
    { errorHandling: 'undefined value' },
  ),
);
```

The resource refetches because its URL factory reads `query()`. Returning `undefined` from the factory keeps the resource idle, which is how you express "no request yet".

### Generated names

| Form                                           | Exposes                                                                                                       |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Unnamed — `withResource(() => res)`            | `value`, `status`, `error`, `isLoading`, `hasValue`, `snapshot`, `_reload`                                    |
| Named — `withResource(() => ({ users: res }))` | `usersValue`, `usersStatus`, `usersError`, `usersIsLoading`, `usersHasValue`, `usersSnapshot`, `_usersReload` |

`_reload` carries an underscore because reloading is a store-internal command. Expose it through a named `withMethods` method when a component must trigger it.

Use the unnamed form for a store with one read model and named resources when it has several.

### Handing one resource to a component

A presentational component that renders loading, error, and value should take a `Resource<T>` input, not the whole store. `mapToResource(store, name)` rebuilds the flat `<name>*` members back into that interface:

```ts
import { mapToResource } from "@ngrx-toolkit/core";

readonly users = mapToResource(this.store, "users"); // Resource<User[] | undefined>
```

```html
<user-list [resource]="users" />
```

The component then works for any resource and needs no knowledge of the store. Reach for it when the same rendering shell serves several read models; read the `<name>*` signals directly in a component that already owns the store.

The mapped object includes `snapshot` and a narrowing `hasValue` guard. It is a `Resource`, not a writable `ResourceRef`, and does not expose reload or invent `store.usersResource`. Expose an explicit reload command if needed. Toolkit forwards the source snapshot rather than rebuilding it from its error proxy. Its fallback value can differ from the snapshot. Writes forward to the source value signal; test patch/status/snapshot transitions rather than assuming patches are excluded from snapshots.

### Who owns the collection

Entity helpers are a projection, not a second store. Pick by asking which side owns the list:

| The list comes from                                           | Use                                          | Written by                                                             |
| ------------------------------------------------------------- | -------------------------------------------- | ---------------------------------------------------------------------- |
| The server, and the UI needs lookups by id                    | `withEntityResources`                        | The resource. Updaters edit the view over it                           |
| A store-owned collection, local or loaded through RxJS/Events | `withEntities` from `@ngrx/signals/entities` | Entity updaters through `patchState` with a load/reconciliation policy |
| The server, and the UI only iterates it                       | `withResource` with a plain array            | The resource                                                           |

`withEntityResources` composes `withResource` with the entity utilities and links the entity state to the resource value with linked signals — **the resource stays the source of truth**. Its named form adds `<name>Ids`, `<name>EntityMap`, and `<name>Entities` next to the resource members above. Elements need an `id` compatible with `EntityId`.

`withEntities` owns its collection outright, and `patchState(store, setAllEntities(list))` is how it changes. It also works with server data loaded by `rxMethod` or Events when that store owns loading and reconciliation. Avoid maintaining an independent mirror of a resource array without a stated synchronization policy.

Toolkit v22.0.1 has declaration discrepancies for `withEntityResources` array and unnamed-resource result types. Compile the concrete value/snapshot usage and readonly-array input before relying on inferred types; see the [tagged audit](../../ngrx-toolkit/references/toolkit-v22-audit.md). It accepts no second error-options argument.

Skip both when the UI only renders the array. `ids` and `entityMap` earn their cost through lookups by id, not through iteration.

### Resource status is request state

`status()` runs `'idle' | 'loading' | 'reloading' | 'error' | 'resolved' | 'local'`. It describes the **request**, never the model built from it. A draft can be edited while the resource is `'reloading'`, and be untouched while it is `'error'` — one signal cannot carry both.

`'local'` invites the mistake, because it means "the value was set through `.set()` or `.update()`" and reads like a dirty flag. Writing the resource value to hold an edit makes the resource the owner of the draft, so the next reload discards it and the server value is gone from the only slot that held it. Keep the edit in its own slice and let the resource stay a read model.

Reach for each state where it lives: resource status for loading, mutation status for saving, Signal Forms field state for validity and dirtiness, and a derivation over the draft for anything else.

## Resource errors

Resource error behaviour is the sharpest edge in this API. Three facts drive every decision:

1. **Reading `value()` on a resource in the error state throws at runtime** under native behaviour. Guard reads with `hasValue()`.
2. **`defaultValue` covers the idle and loading states only.** It does not apply on error.
3. **Nothing reports the failure for you.** A resource error surfaces only where a template or test reads `error()`.

An unextended `httpResource` has native error behavior and no Toolkit `errorHandling` option. Guard native value reads with `hasValue()`, or on NgRx v22 apply [resource extensions](resource-extensions.md) in place. Moving the resource into a store is an ownership choice, not a prerequisite for safe error handling.

```ts
// Throws on error: nothing guards the read.
readonly flight = httpResource<Flight>(() => `/api/flights/${this.id()}`);
// template: {{ flight.value().from }}
```

When using Toolkit `withResource`, choose one of its strategies below. When extending that source resource with NgRx loading/error policies, choose Toolkit's `native` strategy to preserve those policies rather than layering a conflicting proxy.

The Toolkit gives `withResource` an `errorHandling` option that decides which of these you live with:

```ts
withResource(
  ({ query }) => ({
    users: httpResource(() => `/api/users?q=${query()}`, {
      parse: UserListSchema.parse,
      defaultValue: [],
    }),
  }),
  { errorHandling: 'undefined value' },
);
```

| `errorHandling`               | Value after an error                                                           | Choose it when                                                      |
| ----------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| `'undefined value'` (default) | `undefined`, even when `defaultValue` is set                                   | The UI branches on `error()` before it reads the value              |
| `'previous value'`            | Previously observed value, possibly undefined; can throw without a cached read | Only after testing the tagged cache behavior for the intended flow  |
| `'native'`                    | Source behavior: an unextended resource throws                                 | Guard native reads, or preserve an NgRx extension's explicit policy |

Use `'undefined value'` for predictable safe alias reads on error. For stale-data requirements, choose an explicit native retention policy and preserve it with Toolkit's `'native'` strategy. Keep a visible error and decide whether retained data still belongs to the current request key.

Toolkit 22.0.1's `'previous value'` is an observation cache, not a last-successful-response cache. It records successful value reads, including `undefined` during loading. A first value read after failure can throw if nothing has been cached. Test first-error and loading-to-error paths before choosing it. The [tagged audit](../../ngrx-toolkit/references/toolkit-v22-audit.md) records the implementation evidence.

A resource's `<name>Error` is typed `Signal<Error | undefined>`. An `httpResource` failure carries an `HttpErrorResponse`, so narrow before you read `status` or `message`:

```ts
import { HttpErrorResponse } from "@angular/common/http";

readonly userErrorMessage = computed(() => {
  const error = this.store.usersError();
  if (error instanceof HttpErrorResponse) {
    return error.status === 404 ? "No such user" : "Could not load users";
  }
  return error ? "Could not load users" : undefined;
});
```

Use the `httpResource` `parse` option for schema validation, such as a Zod or Valibot schema. The return type of `parse` becomes the resource value type, and a parse failure puts the resource in the error state — the same path as a transport failure.

Every resource in the UI needs three visible branches: loading, error, and value. Drive them from `isLoading()`, `error()`, and `hasValue()`.

Toolkit v22.0.1 fixes resource narrowing: `store.hasValue()` narrows `store.value()`, and `store.usersHasValue()` narrows `store.usersValue()`. The mapped `Resource` guard works too. Keep the receiver intact when using these type predicates. Strict templates also need valid narrowing; they are not exempt from type checks.

For older Toolkit versions, read a safe value into a local and narrow it when the alias guard cannot narrow. Under native behavior, guard before reading the value. This resource fix does not fix standalone mutation `hasValue()`; prefer the mutation result's `status` discriminator.

## Where the HTTP lives

Prefer a data-access service that builds the resources and mutations, and a store that wires them into state. The service owns the API — URL, params, method, `parse`. The store owns the reaction — what state feeds the request, and what happens on success.

Pass changing request inputs as `Signal` parameters or reactive getters read inside the request factory. A one-time value freezes that input; constants and immutable configuration can remain plain values.

```ts
import { Service } from '@angular/core';

@Service()
export class FlightService {
  // 👇 Signal in, resource out. The request recomputes when id changes.
  findByIdResource(id: Signal<number | null>) {
    return httpResource(
      () => {
        const flightId = id();
        return flightId != null
          ? { url: '/api/flight', params: { id: flightId } }
          : undefined;
      },
      {
        parse: FlightSchema.parse,
        defaultValue: initFlight,
      },
    );
  }

  // 👇 The store passes its own onSuccess and onError.
  createSaveMutation(options: Partial<HttpMutationOptions<Flight, Flight>>) {
    return httpMutation({
      ...options,
      request: (flight) => ({
        url: '/api/flight',
        method: 'POST',
        body: flight,
      }),
      parse: FlightSchema.parse,
      operator: concatOp,
    });
  }
}
```

```ts
export const FlightDetailStore = signalStore(
  { providedIn: 'root' },
  withState<{ id: number | null }>({ id: null }),
  withProps(() => ({ _flightService: inject(FlightService) })),
  withMethods((store) => ({
    setId: signalMethod<number | null>((id) => patchState(store, { id })),
  })),
  // 👇 Read-only factory: destructure what it depends on.
  withResource(
    ({ _flightService, id }) => ({
      flight: _flightService.findByIdResource(id),
    }),
    { errorHandling: 'undefined value' },
  ),
  // 👇 Needs the store object for patchState, so keep the rest.
  withMutations(({ _flightService, ...store }) => ({
    saveFlight: _flightService.createSaveMutation({
      onSuccess: (flight) => {
        if (store.id() === flight.id)
          patchState(store, { flightValue: flight });
      },
    }),
  })),
);
```

Both factories run during store construction, which is an injection context, so the service resolves normally.

What each side keeps:

- **The service** knows endpoints, request shapes, and response validation. It holds **no state** — a service that caches its own results becomes a second owner of data the resource already owns.
- **The store** keeps `onSuccess`, `onError`, and every reconciliation decision. Those are state questions, and a service that patched store state would write state it does not own.

Skip the service for a resource with one consumer and no reuse — the same test as extracting a custom feature. A data-access layer built for a single URL is indirection without a payoff. The recipes in [`recipes.md`](recipes.md) inline their resources for exactly that reason: it keeps the reactive graph readable in one block. Split the moment a second store, a guard, or a route resolver needs the same endpoint.

## Shaping the read model

Backend shapes rarely match what a screen needs. The question is never whether to map, only where — and the read path offers three places with a strict order of preference.

| Map here       | For                                                                      |
| -------------- | ------------------------------------------------------------------------ |
| `parse`        | Validation and a pure reshape of one response into the domain type       |
| `withComputed` | A view model combining several sources, or a projection one screen needs |
| `withState`    | Never. A mapped copy is a second owner                                   |

The last row is the one that costs teams weeks. Mapping a response into a state slice looks harmless and creates a value that no longer updates when its source refetches. If a value is derived, it is `computed`.

### Reshaping one response

`httpResource` has a `parse` option, not a `map` option. Its return type becomes the resource value type, and a throw puts the resource in the error state alongside transport failures. Use it to validate and flatten one response, then keep the reshaping function pure and exported.

```ts
withResource(({ id }) => ({
  ticket: httpResource<Ticket>(() => `/api/tickets/${id()}`, {
    parse: (raw) => toTicket(ticketSchema.parse(raw)),
  }),
}), { errorHandling: "undefined value" }),
```

### Combining several read models

A view model that joins resources belongs in `withComputed`, reading their values directly. A missing required source makes the combined value absent. Optional enrichment can remain undefined, as the assignee and project do below. Define which inputs are required rather than disguising missing required data with defaults.

```ts
withComputed(({ ticketValue, assigneesValue, projectEntityMap }) => ({
  ticketView: computed(() => {
    const ticket = ticketValue();
    if (!ticket) return undefined;

    return {
      ...ticket,
      assignee: assigneesValue()?.find((user) => user.id === ticket.assigneeId),
      project: projectEntityMap()[ticket.projectId],
    };
  }),
})),
```

Joining by id can use an `entityMap`. A computed caches its result; an array `find` runs when that computed recomputes, not on every read. Choose an entity map for repeated lookups or larger collections, not because computed reads are uncached.

### Keep the mapping function outside the store

Write the transformation as a plain exported function and call it from the computed:

```ts
export function toTicketView(
  ticket: Ticket,
  users: User[],
  projects: Record<EntityId, Project>,
): TicketView {
  /* ... */
}
```

It then tests as a pure function with no store, no injector, and no signals, and both a store and a mutation `parse` can reuse it. Reserve the computed for the reactive wiring — reading the signals and handling absence.

Map once, at the deepest point that owns the shape. A component that reshapes a store value it received has put a fourth representation in play; give it a named computed on the store instead.

## Write graph: `withMutations`

Mutations are backend commands. `httpMutation` wraps an `HttpClient` request; `rxMutation` wraps any RxJS operation. Note the different key for each: `httpMutation` takes `request`, `rxMutation` takes `operation`.

```ts
import {
  exhaustOp,
  httpMutation,
  rxMutation,
  withMutations,
  withResource,
} from '@ngrx-toolkit/core';
import { httpResource } from '@angular/common/http';
import { inject } from '@angular/core';
import { patchState, signalStore, withState } from '@ngrx/signals';

type User = { id: string; name: string };

export const UserStore = signalStore(
  withState({ userId: '' }),
  withResource(
    ({ userId }) => ({
      user: httpResource(
        () => (userId() ? `/api/users/${userId()}` : undefined),
        { parse: UserSchema.parse },
      ),
    }),
    { errorHandling: 'undefined value' },
  ),
  withMutations((store, telemetry = inject(Telemetry)) => ({
    saveUser: httpMutation<
      { id: User['id']; body: ReturnType<typeof toUpdateUserRequest> },
      User
    >({
      request: ({ id, body }) => ({
        url: `/api/users/${id}`,
        method: 'PUT',
        body,
      }),
      // UserSchema is generated from the OpenAPI response contract.
      parse: UserSchema.parse,
      operator: exhaustOp,
      onSuccess: (saved) => {
        if (store.userId() === saved.id)
          patchState(store, { userValue: saved });
      },
      // 👇 Put the failure somewhere the UI reads. `saveUserError` already holds it,
      //    so this hook is for work the signal cannot do — telemetry, a toast, a rollback.
      onError: (error) => telemetry.saveFailed(error),
    }),
    deleteUser: httpMutation<{ id: string }, void>({
      request: ({ id }) => ({ url: `/api/users/${id}`, method: 'DELETE' }),
      // 👇 The second callback argument is the original call parameter.
      onSuccess: (_result, params) =>
        patchState(store, {
          userId: params.id === store.userId() ? '' : store.userId(),
        }),
    }),
  })),
);
```

`httpMutation` also accepts a request factory directly — `httpMutation((user: User) => ({ url, method, body }))` — when no `parse`, `operator`, or callbacks are needed.

Prepare `toUpdateUserRequest(user)` inside the caller's `try`, then call `saveUser({ id: user.id, body })`. Toolkit 22.0.1 does not establish safe promise settlement after a synchronous request-factory throw. Keep potentially throwing mapping and validation outside that factory, as shown in [contracts](contracts.md).

### Concurrency

Pass the policy with the `operator` option. `concatOp` applies when `operator` is omitted.

- `concatOp` — queue commands in call order. The default, and correct for most writes.
- `exhaustOp` — ignore new calls while one is running. Use for a submit button.
- `switchOp` — unsubscribe from the running operation for the newest one. Cancellation is not server rollback; use it for writes only with an endpoint ordering/version policy.
- `mergeOp` — run concurrently; the commands are independent.

### Mutation state

A mutation reports its outcome twice, through **two different status unions**. Confusing them is the defect this section exists to prevent.

**The signals describe the mutation over time.** In Toolkit v22.0.1, `withMutations` exposes the callable method and only `<name>Status`, `<name>Error`, and `<name>IsPending`. It does not expose `<name>Value`, `<name>IsSuccess`, or `<name>HasValue`. The standalone mutation object has `value`, `isSuccess`, and `hasValue`; the store method is narrowed to its callable signature. Read the returned result or explicitly store an outcome you need.

`<name>Status` is `'idle' | 'pending' | 'error' | 'success'`, without `aborted`. The tagged public declaration types `<name>Error` as `Signal<Error | undefined>`, but runtime forwards the standalone mutation's unvalidated `Signal<unknown>`. Narrow runtime errors before reading properties; the alias declaration does not validate them. `onSuccess` and `onError` callbacks return void and are not awaited. Capture injected dependencies in the factory and explicitly await any follow-up work the caller must wait for.

**The promise describes one call.** Calling a mutation returns `Promise<MutationResult<T>>`, and that result has three branches:

```ts
type MutationResult<T> =
  | { status: 'success'; value: T }
  | { status: 'error'; error: unknown }
  | { status: 'aborted' };
```

`exhaustOp` drops an overlapping call before sending it. A `switchOp` cancellation may happen after the request reached the server. Both can produce `aborted`; treat it as an unconfirmed outcome, not proof of rollback. Branch on all three:

```ts
const body = toUpdateUserRequest(user); // Inside the caller's try, before invocation.
const result = await store.saveUser({ id: user.id, body });
switch (result.status) {
  case 'success':
    this.dialog.close(result.value);
    break;
  case 'error':
    this.notify(result.error);
    break;
  // A dropped or cancelled call cannot confirm a save.
  case 'aborted':
    break;
}
```

`if (result.status === 'error')` with an implicit else is the trap: an abort takes the success path.

**Where the outcome goes depends on whether there is a form.** Both paths branch on the same three statuses:

- **With a Signal Form** — route through `toSubmitResult` in [`signal-forms-bridge.md`](signal-forms-bridge.md#mutation-outcome-to-form-result), so the failure lands next to validation errors.
- **Without a form** — a toolbar button, a row action, a confirm dialog — branch at the call site and drive the UI from `<name>Error()`:

  ```ts
  async save(): Promise<void> {
    const flight = this.store.flightValue(); // Uses undefined-on-error policy.
    if (flight === undefined) return;
    try {
      const result = await this.store.saveFlight(flight);
      if (result.status === "success") this.dialog.close();
      else if (result.status === "error") this.notify(result.error);
      else this.notify("Save completion was not confirmed.");
    } catch (error) {
      this.notify(error);
    }
  }
  ```

The rule holds either way: **only `'success'` may advance the UI.** `onError` is for work the error signal cannot do on its own — telemetry, a rollback, a toast — never for swallowing the failure with a log.

**Why an abort resolves faster than a save.** Under `exhaustOp`, a call made while another is in flight does not wait for anything — it resolves `aborted` immediately, before any request goes out. That inverts the timing you would assume: the _dropped_ call answers first, and the real save is still running.

That inversion is what turns the trap into data loss. A double-clicked submit button on a **component-provided** store runs this chain:

```text
click 1 → request in flight
click 2 → resolves 'aborted' at once
        → code reads "not an error" as success
        → navigates away
        → the component is destroyed
        → takeUntilDestroyed cancels the in-flight request from click 1
        → the first save's outcome is unconfirmed
```

A root-provided store survives navigation, which can make the symptom scope-dependent. Gate navigation on confirmed success and disable duplicate submit while pending. Test the backend outcome separately from client cancellation.

## Reconciliation policy

Every successful mutation needs one stated policy:

1. **Patch** the resource-backed state from the server response when that response is authoritative. This is the default: the write endpoint already returned the new truth.
2. **Reload** the affected resource when the server did work the client cannot reconstruct.
3. **Optimistic patch with rollback** only when the product needs instant feedback and the previous value is captured for the rollback.

Patch resource-backed state with the generated value name — `patchState(store, { userValue: saved })`. Use the `params` argument of `onSuccess` to reconcile a delete or an item-level update without re-reading the call site.

**Create-then-select is the case that looks like two writers.** A create mutation returns a new record and the screen should select it, so `onSuccess` writes both the read model and `selectedId` — a slice that also has a `signalMethod` boundary. That is still one owner: both writes are the store writing its own state, and the boundary is only how the _outside_ asks for a selection.

```ts
createTicket: httpMutation<ReturnType<typeof toCreateTicketRequest>, Ticket>({
  request: (body) => ({ url: "/api/tickets", method: "POST", body }),
  parse: TicketSchema.parse,
  operator: exhaustOp,
  // 👇 Select the created record from the response, not from a second round trip.
  onSuccess: (saved) => patchState(store, { selectedTicketId: saved.id, selectedTicketValue: saved }),
}),
```

Prepare and validate `toCreateTicketRequest(form)` inside the caller's `try` before invoking `createTicket`.

Changing `selectedTicketId` still invalidates the resource request. Patching `selectedTicketValue` does not suppress that fetch; test the resulting request and loading transitions. Reconcile a selected detail only if the saved record still matches the current selection, and preserve draft edits made after the submitted snapshot. For autosave, carry record id and draft revision with each command.

For a worked captured-id, edit-session, and draft-snapshot guard, read the save mutation in [the combined recipe](recipes-combined.md#store-search-selection-lookup-data-draft-and-submit-save). Its [autosave variation](recipes-combined.md#autosave-variation) adds queueing and deduplication requirements; it is a policy outline, not a complete autosave implementation.

## Resource and mutation review

Before completion, verify:

- Changing request inputs are read reactively inside the resource factory, including across service boundaries. Constants need no signal wrapper.
- Services build requests; stores own `onSuccess`, `onError`, and state.
- Toolkit `withResource` has a chosen `errorHandling` strategy. Native resources use guards or native extensions, not a Toolkit-only option. Value reads match the selected policy.
- Every resource and mutation error reaches the UI or the caller. None is swallowed.
- Every mutation names its `operator` deliberately, and every awaited result branches on `success`, `error`, and `aborted`.
- Every success path patches or reloads each affected read model.
- `withEntityResources` is used only for resource-backed arrays with stable `id` fields.
