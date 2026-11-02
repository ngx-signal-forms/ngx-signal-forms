# Recipes

Six illustrative resource-based flows, targeting the versions in [`testing-and-version-gates.md`](testing-and-version-gates.md). Recipe 1 sets the shape, including the data-access service; later recipes show only what differs. Domain types and generated contracts are application-specific. These snippets have not been compiled or runtime-tested. Toolkit resources are optional; keep an existing RxJS/entity design that meets the task. Use plain methods for imperative transitions and `signalMethod` for reactive signal inputs.

For a single feature that needs several of these flows at once, read [`recipes-combined.md`](recipes-combined.md). Keep ordinary tasks on the smallest matching recipe; the combined file earns its size only where the interactions between flows are the task.

Names such as `TicketSchema` and `toUpdateTicketRequest()` stand for contracts and mappings from [`contracts.md`](contracts.md). Import `toSubmitResult` and `toSaveMessage` from the shared helper in [`signal-forms-bridge.md`](signal-forms-bridge.md#mutation-outcome-to-form-result). The outcome mapper handles success, error, and aborted calls.

Each `withResource` below uses `"undefined value"` for safe value-alias reads after resource errors; `withEntityResources` takes no options and has only its documented `'undefined value'` behaviour. In Toolkit 22.0.1, `"previous value"` can throw on the first value read after an error and can cache `undefined` during loading. It is not a guaranteed last-good-value cache. If stale values are required, use native resource extensions with a separate explicit retention/error policy.

## 1. Search with filters and paging

The base case: user input owns the request, the resource reacts, nothing else writes.

```ts
// ticket.service.ts — owns the endpoint. Signal parameters keep it reactive.
import { Service, Signal } from '@angular/core';
import { httpResource } from '@angular/common/http';

@Service()
export class TicketService {
  searchResource(
    query: Signal<string>,
    filters: Signal<Filters>,
    offset: Signal<number>,
  ) {
    return httpResource(
      () => {
        const { status, assignee } = filters();
        return {
          url: '/api/tickets',
          params: {
            q: query(),
            status,
            offset: offset(),
            ...(assignee == null ? {} : { assignee }),
          },
        };
      },
      { parse: TicketListSchema.parse, defaultValue: [] },
    );
  }
}
```

```ts
// ticket-search-store.ts — owns the state that drives the endpoint.
import { computed, debounced, inject } from '@angular/core';
import { withResource } from '@ngrx-toolkit/core';
import {
  patchState,
  signalMethod,
  signalStore,
  withComputed,
  withMethods,
  withProps,
  withState,
} from '@ngrx/signals';

type Filters = { status: 'all' | 'open' | 'closed'; assignee: string | null };

export const TicketSearchStore = signalStore(
  { providedIn: 'root' },

  withState({
    query: '',
    filters: { status: 'all', assignee: null } as Filters,
    page: 1,
  }),

  withProps(({ query }) => ({
    _tickets: inject(TicketService),
    // 👇 A debounced view of the query. The raw signal still drives the input.
    _debouncedQuery: debounced(query, 300),
  })),

  withComputed(({ page, _debouncedQuery }) => ({
    offset: computed(() => (page() - 1) * 20),
    // 👇 debounced() returns a Resource. `.value` is Signal<string> — it carries the
    //    source type, so it needs no fallback and passes straight through.
    debouncedQuery: _debouncedQuery.value,
  })),

  withMethods((store) => ({
    // 👇 Every filter change resets paging in the same boundary.
    setQuery: signalMethod<string>((query) =>
      patchState(store, { query, page: 1 }),
    ),
    setFilters: (filters: Filters) => patchState(store, { filters, page: 1 }),
    setPage: (page: number) => patchState(store, { page }),
  })),

  withResource(
    ({ _tickets, debouncedQuery, filters, offset }) => ({
      tickets: _tickets.searchResource(debouncedQuery, filters, offset),
    }),
    { errorHandling: 'undefined value' },
  ),
);
```

A plain input reaches the boundary without Signal Forms — the boundary takes a signal, so hand it one:

```ts
@Component({
  template: `
    <input
      [value]="queryText()"
      (input)="queryText.set($any($event.target).value)"
    />
    @if (store.ticketsIsLoading()) {
      <p>Searching…</p>
    }
    @if (store.ticketsError()) {
      <p role="alert">Could not load results. Results are unavailable.</p>
    }
  `,
})
export class TicketSearch {
  readonly store = inject(TicketSearchStore);
  readonly queryText = signal('');

  constructor() {
    // 👇 Runs in the component's injection context, so the subscription dies with it.
    this.store.setQuery(this.queryText);
  }
}
```

One reactive call in the constructor replaces an `(input)` handler that calls the store on every keystroke. Reach for Signal Forms when the input needs validation or a form model; a search box needs neither.

Decisions worth copying:

- **This search fires on an empty query**, returning the unfiltered first page. That is right for a results table the user expects to be populated on arrival. For a search that should stay idle until the user types, return `undefined` from the request factory instead — `() => (query().trim() ? { url, params } : undefined)` — which is the master–detail idiom in recipe 2. Pick one deliberately; an empty-query request against a large collection is a real cost.
- **Reset paging inside the boundary that changes the filter.** Two separate calls let a request go out with page 4 of a filter that has one page.
- **`errorHandling: 'undefined value'`** makes `ticketsValue()` safely return `undefined` on resource errors. Render absence explicitly, for example iterate `ticketsValue() ?? []`, and show `ticketsError()` rather than promising retained results.
- **`debounced()` returns `Resource<T>`, not a signal.** It adds no `undefined` to the source type, but `T` itself may include `undefined`. Here the source is `string`, so `.value` is `Signal<string>` and needs no fallback. Read `.status()` for a pending indicator. It needs Angular 22 and is experimental; earlier versions can use `rxMethod` and `debounceTime`.
- **Filters as one object** means any field change refetches once. Split them into separate slices only when one field must change without triggering a request.
- **The service takes `Signal` parameters.** Passing `store.filters()` instead of `store.filters` would read the value once and freeze the request for the life of the store.

## 2. Master–detail

A second resource reads the selection the first one populates. The selection is ordinary state with an ordinary boundary — the chaining is automatic.

```ts
withState({ selectedId: null as number | null }),
withMethods((store) => ({
  select: (selectedId: number | null) => patchState(store, { selectedId }),
})),
withResource(({ selectedId }) => ({
  tickets: httpResource(() => "/api/tickets", { parse: TicketListSchema.parse, defaultValue: [] }),
  // 👇 Idle until something is selected.
  ticket: httpResource(() => (selectedId() != null ? `/api/tickets/${selectedId()}` : undefined), { parse: TicketSchema.parse }),
}), { errorHandling: "undefined value" }),
```

Returning `undefined` from the detail factory keeps that resource idle. Use a nullish check because numeric id `0` is valid. Do not mirror the selected row into another read-model slice; `ticketValue` owns the detail.

## 3. Form with lookup data, saved on submit

Reference data for dropdowns is just another read model. Load it as named resources beside the record, and gate the form on all of them.

```ts
withResource(({ ticketId }) => ({
  ticket: httpResource(() => (ticketId() != null ? `/api/tickets/${ticketId()}` : undefined), { parse: TicketSchema.parse }),
  assignees: httpResource(() => "/api/users", { parse: UserListSchema.parse, defaultValue: [] }),
  priorities: httpResource(() => "/api/priorities", { parse: PriorityListSchema.parse, defaultValue: [] }),
}), { errorHandling: "undefined value" }),
withMutations((store) => ({
  saveTicket: httpMutation<{ id: Ticket["id"]; body: ReturnType<typeof toUpdateTicketRequest> }, Ticket>({
    request: ({ id, body }) => ({ url: `/api/tickets/${id}`, method: "PUT", body }),
    // TicketSchema is generated from the OpenAPI response contract.
    parse: TicketSchema.parse,
    operator: exhaustOp,
    onSuccess: () => { store._ticketReload(); },
  }),
})),
```

The form model holds only the editable fields, so the identity comes from the loaded record. Keep the pair of mappings explicit and pure:

```ts
export function toForm(ticket: Ticket): TicketForm {
  return {
    title: ticket.title,
    description: ticket.description,
    status: ticket.status,
  };
}

// 👇 Two arguments: the edits, plus the record that supplies the id and untouched fields.
export function toDomain(form: TicketForm, current: Ticket): Ticket {
  return { ...current, ...form };
}
```

```ts
import { computed, linkedSignal } from "@angular/core";
import { disabled, form, required, submit } from "@angular/forms/signals";

readonly formReady = computed(() => {
  const ticket = this.store.ticketValue();
  return ticket != null && ticket.id === this.store.ticketId()
    && !this.store.ticketIsLoading() && !this.store.ticketError()
    && this.store.assigneesValue() != null && !this.store.assigneesIsLoading() && !this.store.assigneesError()
    && this.store.prioritiesValue() != null && !this.store.prioritiesIsLoading() && !this.store.prioritiesError();
});

readonly draft = linkedSignal<{ id: Ticket["id"] | null; ticket: Ticket | undefined }, TicketForm | null>({
  source: () => ({ id: this.store.ticketId(), ticket: this.store.ticketValue() }),
  computation: ({ id, ticket }, previous): TicketForm | null => {
    if (id == null) return null;
    if (previous?.source.id === id && previous.value !== null) return previous.value;
    return ticket?.id === id ? toForm(ticket) : null;
  },
});
readonly formModel = linkedSignal(() => this.draft() ?? EMPTY_TICKET_FORM, {
  set: (draft) => this.draft.set(draft),
});
readonly ticketForm = form(this.formModel, (path) => {
  required(path.title);
  disabled(path, { when: () => !this.formReady() });
});

save(): void {
  submit(this.ticketForm, async (formTree) => {
    const current = this.store.ticketValue();
    // 👇 No loaded record means nothing to merge edits into.
    if (!current || !this.formReady()) return { kind: "not_loaded", message: "The ticket and lookups are not ready." };

    try {
      const body = toUpdateTicketRequest(toDomain(formTree().value(), current));
      const result = await this.store.saveTicket({ id: current.id, body });
      return toSubmitResult(result);
    } catch (error) {
      return { kind: "processing_error", message: toSaveMessage(error) };
    }
  });
}
```

The lookups load independently of the draft. Gate rendering on `formReady()` and show each resource's loading/error state. A native form must prevent default submit navigation. Import `FormField` in the component using this template:

```html
@if (formReady()) {
<form (submit)="$event.preventDefault(); save()">
  <input [formField]="ticketForm.title" />
  <button
    type="submit"
    [disabled]="ticketForm().submitting() || store.saveTicketIsPending()"
  >
    Save
  </button>
  @for (error of ticketForm().errors(); track $index) {
  <p role="alert">{{ error.message }}</p>
  }
</form>
}
```

This Angular 22.1 bridge seeds only from loaded detail matching the selected id, preserves the draft through same-id refetches and transient `undefined`, and discards it on selection change or deselection. Confirm unsaved-change discards before that transition. Success reloads the current detail without applying the old response to a new selection or clearing a newer draft. Reload completion is not awaited by the mutation callback. Adopting server-normalized draft values needs the session/draft guards in the combined recipe.

`exhaustOp` makes a double-clicked submit button send one request — and the ignored second call resolves `aborted`, not `success`. That is why the outcome goes through `toSubmitResult`: a bare `status === 'error'` check would mark the form saved for a call that never reached the server. Disable the button on `saveTicketIsPending()` so the case stays rare.

## 4. Autosave

Start from a store-owned draft, as in recipe 5. Autosave needs an endpoint concurrency policy, not just a different trigger:

1. Update the draft per keystroke. Debounce a command candidate containing the record id, edit-session token, and immutable draft snapshot, rather than debouncing the model write.
2. Seed without saving. Trigger only for a loaded matching record and a changed draft. Reject settled candidates from an old session; never combine an old debounced draft with the current selection's id. Map and validate the accepted snapshot inside the caller's `try` before invoking the mutation. Pass the prepared body with the captured command; the request factory only assembles that command's request.
3. Use `concatOp` for ordered writes, including partial PATCH changes. A client queue orders only its own requests; it does not resolve concurrent clients or an uncertain failed write. Pause and reconcile on conflicts or unconfirmed outcomes.
4. Use `switchOp` only with an explicit server version/conflict policy that makes superseded writes safe. Canceling a subscription neither rolls back a server write nor guarantees commit order, even for replacement-style saves.
5. Preserve the current draft on completion unless both the edit session and submitted draft or revision still match. Reload affected read models when local reconciliation cannot prove membership, order, and counts remain correct.
6. Handle `success`, `error`, `aborted`, caller-side mapping failures, and rejected calls. Catching a call does not prove settlement after a synchronous request-factory throw in Toolkit 22.0.1; keep potentially throwing preparation outside the mutation. Show pending/error state; an aborted promise is not represented by a mutation `aborted` status signal. Suppress abort messages only under a stated safe reporting policy.

Keep the mutation before any method that calls it. The combined recipe specifies how these rules extend its submit flow without duplicating a second unguarded implementation.

## 5. Live form bound to the store with `linkedSignal({ set })`

**Reach for recipe 3 first.** A load-edit-save screen can keep its draft in the component and send the mapped value on submit. It still needs a seeding and discard policy.

Use this recipe when something **other than the form** must read or act on the draft while the user types:

- autosave (recipe 4 is this recipe plus a debounced trigger);
- another component showing a live preview of the edit;
- validation against other store state;
- an unsaved-changes guard on route exit;
- a multi-step form where earlier steps stay live.

If none applies, keep the draft local rather than adding store state solely for the form.

The full cycle: a resource loads the record, the store owns the draft, the form writes straight into it, and a mutation reconciles. One owner throughout, and no `effect` anywhere.

```ts
export const ProfileEditorStore = signalStore(
  withState({ userId: null as string | null }),
  withProps(() => ({ _users: inject(UserService) })),

  withMethods((store) => ({
    setUserId: signalMethod<string | null>((userId) =>
      patchState(store, { userId }),
    ),
  })),

  withResource(
    ({ _users, userId }) => ({ user: _users.findByIdResource(userId) }),
    { errorHandling: 'undefined value' },
  ),

  // 👇 The draft derives from the loaded record and keeps its own edits.
  withLinkedState(({ userId, userValue }) => ({
    draft: linkedSignal<
      { id: string | null; user: ReturnType<typeof userValue> },
      ProfileForm | null
    >({
      source: () => ({ id: userId(), user: userValue() }),
      computation: ({ id, user }, previous): ProfileForm | null => {
        if (id == null) return null;
        if (previous?.source.id === id && previous.value !== null)
          return previous.value;
        return user?.id === id ? toForm(user) : null;
      },
    }),
  })),

  withMethods((store) => ({
    // 👇 The form's only way in. Everything outside the store writes the draft through here.
    setDraft: (draft: ProfileForm) => patchState(store, { draft }),
  })),

  withMutations(({ _users, ...store }) => ({
    saveProfile: _users.createSaveMutation({
      // Reload the current read model; never apply an old response to a new draft.
      onSuccess: () => {
        store._userReload();
      },
    }),
  })),
);
```

`withLinkedState` sits after `withResource` here because it reads `userValue`. Dependencies decide the order, not the numbering in [`store-and-reactivity.md`](store-and-reactivity.md).

The application-specific `findByIdResource` accepts a nullable id signal and returns no request for null. `createSaveMutation` accepts `{ id: User["id"]; body: ReturnType<typeof toUpdateUserRequest> }`, using the generated `User` type and the application's pure, schema-validating mapper. It validates responses and uses `exhaustOp` for submit. Its request factory only assembles the URL, method, and prepared body from that command; it neither maps nor validates the body and never reads the current selection.

`setDraft` handles edits and the linked computation seeds the draft. Both belong to the store. This recipe reloads the read model after success but preserves the draft, including newer edits. If the product needs server-normalized values applied to the draft, use the edit-session and submitted-draft guards in [`recipes-combined.md`](recipes-combined.md).

```ts
import { Component, inject, input, linkedSignal } from '@angular/core';
import { disabled, form, FormField, submit } from '@angular/forms/signals';

@Component({
  imports: [FormField],
  providers: [ProfileEditorStore],
  template: `<input [formField]="profileForm.displayName" />`,
})
export class ProfileEditor {
  readonly store = inject(ProfileEditorStore);
  readonly userId = input.required<string>();

  constructor() {
    // 👇 Nothing loads until the request input is set. This is the edge that starts the graph.
    this.store.setUserId(this.userId);
  }

  // 👇 Reads the draft, writes through the store's boundary. No second owner.
  readonly formModel = linkedSignal(
    () => this.store.draft() ?? EMPTY_PROFILE_FORM,
    {
      set: (draft) => this.store.setDraft(draft),
    },
  );

  readonly profileForm = form(this.formModel, (path) => {
    disabled(path, {
      when: () => {
        const user = this.store.userValue();
        return (
          !user || user.id !== this.store.userId() || this.store.userIsLoading()
        );
      },
    });
  });

  save(): void {
    submit(this.profileForm, async () => {
      const current = this.store.userValue();
      const draft = this.store.draft();
      if (
        !current ||
        current.id !== this.store.userId() ||
        this.store.userIsLoading() ||
        !draft
      ) {
        return {
          kind: 'not_loaded',
          message: 'The profile is not loaded yet.',
        };
      }

      try {
        const body = toUpdateUserRequest(toDomain(draft, current));
        const result = await this.store.saveProfile({ id: current.id, body });
        return toSubmitResult(result);
      } catch (error) {
        return { kind: 'processing_error', message: toSaveMessage(error) };
      }
    });
  }
}
```

### Seeding without a dirty flag

The source retains `userId` even while `userValue` is undefined. A null draft means this selection has not yet seeded; the first matching loaded user seeds it. Once seeded, the same id preserves the draft through loading, errors, and refetches. A different id or deselection discards it. Confirm unsaved-change discards before selection changes. The form sees `EMPTY_PROFILE_FORM` while absent and stays disabled. A save reload alone does not reset the draft or Signal Forms dirty metadata.

For a dirty state the **template** needs — enabling a save button, a route-exit guard — read it from Signal Forms: `profileForm().dirty()`, or `profileForm.displayName().dirty()` per field.

For store-owned value equality against the last accepted edit-session version, use the stable baseline in the combined recipe. Comparing a draft directly with a refetching resource can clear dirty state during absence or change its meaning after a refetch. Form dirty metadata has a separate reset policy.

### How the cycle closes

A keystroke calls `formModel.set(...)`, whose custom setter calls the plain `setDraft` method. That patches store state synchronously; the linked model reads the updated draft. Seeding and editing are separate transitions with the same store owner.

The same round trip is what the Angular docs demonstrate with Celsius and Fahrenheit: `tempF.set(212)` writes `tempC`, the computation re-runs, and `tempF()` reads back `212`. Substitute the store slice for `tempC` and that is this recipe.

`update()` routes through `set` as well, so a nested field edit reaches the store the same way. See [`signal-forms-bridge.md`](signal-forms-bridge.md) for the whole-value write semantics, the `rawSet` escape hatch, and the field-projection variant.

Needs Angular 22.1. Below that, keep a local writable form model, seed it at an explicit edit-session boundary, and send the mapped value on submit.

## 6. Flatten a nested response and join several resources

An API payload is not a frontend model. Transform one response at the resource boundary with `parse`; join several independently fetched models in `withComputed`. Neither result belongs in `withState`.

```ts
type WorkOrderResponse = {
  id: string;
  customer: { id: string; displayName: string };
  lines: Array<{
    id: string;
    productId: string;
    assigneeId: string | null;
    quantity: number;
  }>;
};
type WorkOrder = {
  id: string;
  customerId: string;
  customerName: string;
  lines: Array<{
    id: string;
    productId: string;
    assigneeId: string | null;
    quantity: number;
  }>;
};
type Product = { id: string; name: string; unitPrice: number };
type User = { id: string; name: string };
type WorkOrderView = {
  id: string;
  customerName: string;
  lines: Array<{
    id: string;
    quantity: number;
    product: Product | undefined;
    assignee: User | undefined;
  }>;
};

// Schema validation belongs in parse too; this function flattens only after it succeeds.
export function parseWorkOrder(raw: unknown): WorkOrder {
  const response = WorkOrderResponseSchema.parse(raw);
  return {
    id: response.id,
    customerId: response.customer.id,
    customerName: response.customer.displayName,
    lines: response.lines,
  };
}

// Pure: no injector, store, or signal. Unit-test this directly.
export function toWorkOrderView(
  order: WorkOrder,
  products: Record<string, Product>,
  users: Record<string, User>,
): WorkOrderView {
  return {
    id: order.id,
    customerName: order.customerName,
    lines: order.lines.map((line) => ({
      id: line.id,
      quantity: line.quantity,
      product: products[line.productId],
      assignee: line.assigneeId != null ? users[line.assigneeId] : undefined,
    })),
  };
}
```

```ts
import { computed } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { signalStore, withComputed, withState } from '@ngrx/signals';
import { withEntityResources, withResource } from '@ngrx-toolkit/core';

export const WorkOrderStore = signalStore(
  withState({ workOrderId: null as string | null }),

  // 👇 `parse` returns the flattened domain object or makes the resource fail.
  withResource(
    ({ workOrderId }) => ({
      workOrder: httpResource<WorkOrder>(
        () =>
          workOrderId() != null
            ? `/api/work-orders/${workOrderId()}`
            : undefined,
        { parse: parseWorkOrder },
      ),
    }),
    { errorHandling: 'undefined value' },
  ),

  // 👇 Server-owned arrays that this view joins by id.
  withEntityResources(() => ({
    products: httpResource(() => '/api/products', {
      parse: ProductListSchema.parse,
      defaultValue: [],
    }),
    users: httpResource(() => '/api/users', {
      parse: UserListSchema.parse,
      defaultValue: [],
    }),
  })),

  // 👇 The view follows every refetch without a synchronisation effect or copied state.
  withComputed(({ workOrderValue, productsEntityMap, usersEntityMap }) => ({
    workOrderView: computed(() => {
      const order = workOrderValue();
      return order
        ? toWorkOrderView(order, productsEntityMap(), usersEntityMap())
        : undefined;
    }),
  })),
);
```

The view is absent until the primary work order exists. Missing lookup entries stay `undefined` rather than being replaced with made-up defaults. Render each resource's loading and error state separately: the work order can resolve while the product lookup is still loading or has failed.

### When entities belong in this recipe

`withEntityResources` is right for `products` and `users`: they come from the server, can refetch, and the view needs `$O(1)$` lookup by id. A plain `withResource` array is cheaper when the template only iterates it.

`withEntities` can compose with `withEntityResources`, but only for a **different, client-owned collection**. For example, a work-order editor can keep unsaved per-line adjustments as a named private collection and derive an effective view from it:

```ts
import { patchState, type, withComputed, withMethods } from "@ngrx/signals";
import { setEntity, withEntities } from "@ngrx/signals/entities";

type LineAdjustment = { id: string; quantity: number };

withEntities({ entity: type<LineAdjustment>(), collection: "_lineAdjustment" }),
withMethods((store) => ({
  setLineAdjustment: (adjustment: LineAdjustment) =>
    patchState(store, setEntity(adjustment, { collection: "_lineAdjustment" })),
})),
withComputed(({ workOrderView, _lineAdjustmentEntityMap }) => ({
  effectiveWorkOrderView: computed(() => {
    const view = workOrderView();
    if (!view) return undefined;

    return {
      ...view,
      lines: view.lines.map((line) => ({
        ...line,
        quantity: _lineAdjustmentEntityMap()[line.id]?.quantity ?? line.quantity,
      })),
    };
  }),
})),
```

The adjustment collection is not a copy of the server's `workOrder.lines`; it is a separate local concern with its own owner. Never put `workOrder.lines` into both `withEntityResources` and `withEntities`: a refetch and an entity updater would become two writers of the same data. Keep collections named when composing them, and split into dedicated stores when they stop serving one coherent screen.

## Focused checks

These are test expectations, not results from a compiled example:

- For every resource recipe, fail before the first value-alias read, then test loading followed by error after a successful load. Value aliases must remain safe to read and return `undefined` on error. Show the error state without promising stale results.
- For recipes 3 and 5, seed only from matching loaded detail and preserve edits through same-id refetches, transient absence, and errors. Both `linkedSignal` calls using `previous` declare source and value type arguments. Save-triggered reloads must not clear newer edits.
- For recipes 3 and 5 and the autosave caller, make request mapping throw. Assert a visible error, no mutation invocation or HTTP request, and unchanged draft and mutation state. A later valid command must still save. Mapping belongs inside the caller's `try`, before the mutation call; caller catch alone cannot prove settlement after a request-factory throw in Toolkit 22.0.1.
- For the combined baseline policy, load S0, submit S1, edit S2 while pending, and acknowledge S1. Assert detail/baseline S1, draft S2, and dirty true. Restoring S0 remains dirty; restoring saved S1 becomes clean. Resource absence/error must not clear dirty state. Cover refused selection, confirmed discard, and rejection of old-save responses after A → B → A. See the combined recipe's full test list.

## What none of these do

- No `effect` copying one signal into another. Derivations are `withComputed` or `withLinkedState`.
- No resource reload in `onInit`. A resource fetches once its request factory returns a request.
- No resource issuing a write. Reads and commands stay separate.
- No custom feature. Each store here has one consumer and reads fine as one unit — extract when the reuse or cohesion test passes ([`custom-features.md`](custom-features.md)).
