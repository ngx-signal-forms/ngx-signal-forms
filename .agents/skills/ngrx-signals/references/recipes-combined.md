# Combined flows: one feature, several recipes

Use this only when one feature combines search, selection, lookup data, a mapped editor, Signal Forms, and a backend write. For a narrow screen, use [`recipes.md`](recipes.md). This is an illustrative Toolkit 22.0.1 / Angular 22.1+ design, not a compiled or runtime-tested application. Resource-based reads are optional, not a requirement of NgRx 22.

Three things only the combination teaches, and they are the reason to read on:

- **Feature order under many dependencies.** Each feature follows the members it reads.
- **Reconciliation across three read models at once.** One save has to land on the search list, the detail resource, and the draft.
- **Save and autosave as exclusive trigger policies** over the same graph.

Everything else here — the data-access service, the `linkedSignal({ set })` bridge, the debounced query — is a recipe applied unchanged. Follow the pointers rather than reading it twice.

`toSubmitResult` and `toSaveMessage` come from [`signal-forms-bridge.md`](signal-forms-bridge.md#mutation-outcome-to-form-result). Request mappings follow [`contracts.md`](contracts.md). Domain types and the lookup service methods are application-specific.

## Ticket workspace

A ticket workspace demonstrates the full graph:

```text
query / filters / page ──→ ticketSearch resource ──→ result list
selectedTicketId ─────────→ selectedTicket resource ─→ draft seed
assignees / tags resources ─────────────────────────→ editor view model
draft ←── Signal Form linkedSignal({ set })
draft ──→ save mutation ────────────────────────────→ selected ticket + search result reconciliation
```

The form has two valid save modes:

- **Submit** is the default. The user explicitly sends one authoritative draft through an `exhaustOp` mutation.
- **Autosave** is an alternative. The draft changes immediately; the trigger is debounced and writes queue with `concatOp` unless the endpoint has an explicit version/conflict policy.

Use one active trigger mode by default. If explicit save remains available during autosave, serialize and deduplicate both triggers under the same policy rather than letting independent writes race.

Optional autosave can be a composition choice or a runtime preference. Keep one write policy:

- **A per-deployment or per-feature choice** — compose the shared graph as a `signalStoreFeature` and build two stores from it, one ending in the submit tail and one in the autosave tail ([`custom-features.md`](custom-features.md)).
- **A per-user preference** can gate the autosave trigger and route explicit saves through the same mutation. Define how toggling modes handles already queued candidates and how duplicate draft snapshots are suppressed. One mutation alone does not make conflicting triggers safe.

What breaks is declaring two mutations against the same record and leaving both live.

## Owners

| Value                                                         | Owner and write path                                                                                                                                                              |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `query`, `filters`, `page`, `selectedTicketId`, `editSession` | `withState`; plain methods for imperative changes, `signalMethod` for reactive query input                                                                                        |
| `ticketSearch`, `selectedTicket`, `assignees`                 | `withResource`; request factories read the request inputs                                                                                                                         |
| `tags` and its id lookup                                      | `withEntityResources`; the resource remains the source                                                                                                                            |
| `_baseline`, `draft`                                          | `withLinkedState`; the private edit-session baseline seeds the draft; `setDraft` changes only the draft; confirmed saves advance the baseline and conditionally replace the draft |
| `editorView`, `isDirty`, `formReady`                          | `withComputed`; they never patch state                                                                                                                                            |
| `saveTicket` or `autosaveTicket`                              | `withMutations`; the backend write and its request status                                                                                                                         |

The ticket API service owns endpoint details and response validation. The store owns request inputs, success reconciliation, and user-visible policy. Its resource factories take `Signal` parameters, never one-time values.

```ts
import { Service, Signal } from '@angular/core';
import { httpResource } from '@angular/common/http';
import {
  SearchTicketsResponseSchema,
  TicketSchema,
} from '@app/api/generated/zod';

@Service()
export class TicketApi {
  // 👇 Signal in, resource out — the request recomputes when any input changes.
  searchResource(
    query: Signal<string>,
    filters: Signal<TicketFilters>,
    offset: Signal<number>,
  ) {
    return httpResource(
      () => ({
        url: '/api/tickets',
        params: { q: query(), status: filters().status, offset: offset() },
      }),
      {
        parse: SearchTicketsResponseSchema.parse,
        defaultValue: { items: [], total: 0 },
      },
    );
  }

  ticketResource(id: Signal<string | null>) {
    return httpResource(
      () => (id() != null ? `/api/tickets/${id()}` : undefined),
      { parse: TicketSchema.parse },
    );
  }

  // assigneesResource() and tagsResource() are plain lookups. They take no arguments.
}
```

The pattern is recipe 1's; see [`resources-and-mutations.md`](resources-and-mutations.md#where-the-http-lives) for what stays on each side of the boundary.

## Store: search, selection, lookup data, draft, and submit save

Keep domain-to-form mapping and the multi-resource editor projection as exported pure functions. They can then be tested independently, and the store only wires reactive edges.

```ts
import { computed, debounced, inject, linkedSignal } from '@angular/core';
import {
  patchState,
  signalMethod,
  signalStore,
  withComputed,
  withLinkedState,
  withMethods,
  withProps,
  withState,
} from '@ngrx/signals';
import {
  withEntityResources,
  withMutations,
  withResource,
  exhaustOp,
  httpMutation,
} from '@ngrx-toolkit/core';
import {
  TicketSchema,
  UpdateTicketRequestSchema,
} from '@app/api/generated/zod';
import type {
  Tag,
  Ticket,
  UpdateTicketRequest,
  User,
} from '@app/api/generated/types';

type TicketFilters = { status: 'all' | Ticket['status'] };
type TicketForm = Pick<
  Ticket,
  'title' | 'description' | 'status' | 'assigneeId' | 'tagIds'
>;
type SaveTicket = {
  id: Ticket['id'];
  session: number;
  draft: TicketForm;
  body: UpdateTicketRequest;
};
type TicketEditSource = {
  id: Ticket['id'] | null;
  session: number;
  ticket: Ticket | undefined;
};
type TicketDraftSource = {
  id: Ticket['id'] | null;
  session: number;
  baseline: TicketForm | null;
};
type TicketEditorView = {
  draft: TicketForm;
  assignees: User[];
  selectedTags: Tag[];
};

const EMPTY_TICKET_FORM: TicketForm = {
  title: '',
  description: '',
  status: 'open',
  assigneeId: null,
  tagIds: [],
};

export function toTicketForm(ticket: Ticket): TicketForm {
  return {
    title: ticket.title,
    description: ticket.description,
    status: ticket.status,
    assigneeId: ticket.assigneeId,
    tagIds: ticket.tagIds,
  };
}

// Pure mapping and schema validation run at the caller boundary, before the mutation.
export function toUpdateTicketRequest(draft: TicketForm): UpdateTicketRequest {
  return UpdateTicketRequestSchema.parse({
    title: draft.title.trim(),
    description: draft.description,
    status: draft.status,
    assigneeId: draft.assigneeId,
    tagIds: draft.tagIds,
  });
}

export function toTicketEditorView(
  draft: TicketForm,
  assignees: User[],
  tagMap: Record<string, Tag>,
): TicketEditorView {
  return {
    draft,
    assignees,
    selectedTags: draft.tagIds.flatMap((id) =>
      tagMap[id] ? [tagMap[id]] : [],
    ),
  };
}

function sameTicketForm(left: TicketForm, right: TicketForm): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export const TicketWorkspaceStore = signalStore(
  // Request inputs. The form draft does not belong here yet: it depends on the detail resource.
  withState({
    query: '',
    filters: { status: 'all' } as TicketFilters,
    page: 1,
    selectedTicketId: null as string | null,
    editSession: 0,
  }),

  // Store-private dependencies and a debounced request input.
  withProps(({ query }) => ({
    _api: inject(TicketApi),
    _settledQuery: debounced(query, 250),
  })),

  withComputed(({ page, _settledQuery }) => ({
    offset: computed(() => (page() - 1) * 25),
    // 👇 `.value` is Signal<string>, not Signal<string | undefined>. No fallback needed.
    settledQuery: _settledQuery.value,
  })),

  // Every change that affects the result set resets paging atomically.
  withMethods((store) => ({
    setQuery: signalMethod<string>((query) =>
      patchState(store, { query, page: 1 }),
    ),
    setFilters: (filters: TicketFilters) =>
      patchState(store, { filters, page: 1 }),
    setPage: (page: number) => patchState(store, { page }),
  })),

  // Reads declare their signal dependencies. There is no onInit reload.
  withResource(
    ({ _api, settledQuery, filters, offset }) => ({
      ticketSearch: _api.searchResource(settledQuery, filters, offset),
    }),
    { errorHandling: 'undefined value' },
  ),

  withResource(
    ({ _api, selectedTicketId }) => ({
      selectedTicket: _api.ticketResource(selectedTicketId),
      assignees: _api.assigneesResource(),
    }),
    { errorHandling: 'undefined value' },
  ),

  // Tags are resource-backed, but editor mapping needs id lookup rather than repeated array scans.
  // withEntityResources uses its documented `undefined value` error behavior.
  withEntityResources(({ _api }) => ({
    tags: _api.tagsResource(),
  })),

  // Refetches must not move the edit session's comparison baseline.
  withLinkedState(({ selectedTicketId, selectedTicketValue, editSession }) => ({
    _baseline: linkedSignal<TicketEditSource, TicketForm | null>({
      source: () => ({
        id: selectedTicketId(),
        session: editSession(),
        ticket: selectedTicketValue(),
      }),
      computation: ({ id, session, ticket }, previous) => {
        if (id == null) return null;
        if (
          previous?.source.id === id &&
          previous.source.session === session &&
          previous.value !== null
        ) {
          return previous.value;
        }
        return ticket?.id === id ? toTicketForm(ticket) : null;
      },
    }),
  })),

  withLinkedState(({ selectedTicketId, editSession, _baseline }) => ({
    draft: linkedSignal<TicketDraftSource, TicketForm | null>({
      source: () => ({
        id: selectedTicketId(),
        session: editSession(),
        baseline: _baseline(),
      }),
      computation: ({ id, session, baseline }, previous) => {
        if (id == null) return null;
        if (
          previous?.source.id === id &&
          previous.source.session === session &&
          previous.value !== null
        ) {
          return previous.value;
        }
        return baseline;
      },
    }),
  })),

  // The baseline is edit-session state, not another read resource.
  withComputed((store) => ({
    editorView: computed(() => {
      const draft = store.draft();
      return draft
        ? toTicketEditorView(
            draft,
            store.assigneesValue() ?? [],
            store.tagsEntityMap(),
          )
        : undefined;
    }),
    formReady: computed(() => {
      const ticket = store.selectedTicketValue();
      return (
        ticket != null &&
        ticket.id === store.selectedTicketId() &&
        store.draft() != null &&
        !store.selectedTicketIsLoading() &&
        !store.selectedTicketError() &&
        store.assigneesValue() != null &&
        !store.assigneesIsLoading() &&
        !store.assigneesError() &&
        store.tagsValue() != null &&
        !store.tagsIsLoading() &&
        !store.tagsError()
      );
    }),
    isDirty: computed(() => {
      const baseline = store._baseline();
      const draft = store.draft();
      return (
        baseline != null && draft != null && !sameTicketForm(draft, baseline)
      );
    }),
  })),

  // Selection needs isDirty, so its boundary follows the computed feature.
  withMethods((store) => ({
    setDraft: (draft: TicketForm) => patchState(store, { draft }),
    requestSelection(
      selectedTicketId: string | null,
      discard = false,
    ): boolean {
      if (selectedTicketId === store.selectedTicketId()) return true;
      if (store.isDirty() && !discard) return false;
      patchState(store, {
        selectedTicketId,
        editSession: store.editSession() + 1,
      });
      return true;
    },
  })),

  // Submit is the default command. `exhaustOp` turns a double-click into one request.
  withMutations((store) => ({
    saveTicket: httpMutation<SaveTicket, Ticket>({
      request: ({ id, body }) => ({
        url: `/api/tickets/${id}`,
        method: 'PUT',
        body,
      }),
      parse: TicketSchema.parse,
      operator: exhaustOp,
      onSuccess: (saved, submitted) => {
        // A title/status edit can change list membership, order, page, and count.
        store._ticketSearchReload();
        if (
          saved.id !== submitted.id ||
          store.selectedTicketId() !== submitted.id ||
          store.editSession() !== submitted.session
        )
          return;
        const replaceDraft = store.draft() === submitted.draft;
        const baseline = toTicketForm(saved);
        patchState(store, {
          selectedTicketValue: saved,
          _baseline: baseline,
          ...(replaceDraft ? { draft: baseline } : {}),
        });
      },
    }),
  })),
);
```

Feature order follows dependencies, not a fixed visual template: resources need state and props; `_baseline` needs the selected-ticket resource; `draft` needs the baseline; selection needs `isDirty`; the mutation needs every state slice it reconciles. Both `linkedSignal` computations that read `previous` supply explicit source and value type arguments.

The private baseline seeds once from the first loaded detail matching the selected id; the draft seeds from that baseline. Both survive same-session refetches and transient `undefined`, even when clean. `isDirty` compares the draft with this stable edit-session baseline, not the mutable read resource. A refetch can update detail without accepting that server version as the editor's new baseline.

`requestSelection` refuses a different selection or deselection while dirty unless the caller explicitly permits discard. The component below asks for confirmation before retrying. Accepted selection changes start a fresh session and discard both baseline and draft. Selecting the current id is a no-op. A separate reset-to-server action is omitted; it would obtain the desired server version and start a fresh session. The session counter protects even an A → B → A sequence from an old save response.

Writes must replace draft objects immutably, including nested arrays, so reference comparison detects newer edits. A successful same-record, same-session save always updates detail and the baseline to the saved response. Only an unchanged submitted snapshot permits draft replacement with server-normalized values. If S0 was loaded, S1 was submitted, and S2 was edited while pending, success leaves baseline S1 and draft S2. Restoring S0 is still dirty against S1. Old-session responses leave the current detail, baseline, and draft untouched.

Reloading the list is safer than replacing a row unless unchanged membership, ordering, paging, and count are proven. The callback is synchronous and does not await that reload. Signal Forms dirty/touched metadata is separate from the store's value comparison and needs its own reset policy.

## Signal Form bridge and visible resource states

`linkedSignal({ set })` makes the store draft the form's model source and destination. `set()` and `update()` both synchronously enter the store boundary. The custom setter receives a whole `TicketForm`; for a field projection of a larger object, merge the field inside the store boundary instead.

```ts
import { Component, inject, linkedSignal } from '@angular/core';
import {
  disabled,
  form,
  FormField,
  submit,
  validateStandardSchema,
} from '@angular/forms/signals';
import { UpdateTicketRequestSchema } from '@app/api/generated/zod';

@Component({
  imports: [FormField],
  providers: [TicketWorkspaceStore],
  template: `
    @if (store.ticketSearchIsLoading()) {
      <p>Loading tickets…</p>
    }
    @if (store.ticketSearchError()) {
      <p role="alert">Could not load tickets. Results are unavailable.</p>
    }
    @for (ticket of store.ticketSearchValue()?.items ?? []; track ticket.id) {
      <button type="button" (click)="selectTicket(ticket.id)">
        {{ ticket.title }}
      </button>
    }

    @if (store.selectedTicketError()) {
      <p role="alert">Could not load the selected ticket.</p>
    }
    @if (store.assigneesError()) {
      <p role="alert">Could not load assignees.</p>
    }
    @if (store.tagsError()) {
      <p role="alert">Could not load tags.</p>
    }
    @if (
      store.selectedTicketIsLoading() ||
      store.assigneesIsLoading() ||
      store.tagsIsLoading()
    ) {
      <p>Loading editor data…</p>
    }
    @if (store.formReady()) {
      <form (submit)="$event.preventDefault(); save()">
        <input [formField]="ticketForm.title" />
        <textarea [formField]="ticketForm.description"></textarea>
        <select [formField]="ticketForm.assigneeId"></select>
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
    } @else if (store.selectedTicketId() == null) {
      <p>Select a ticket to edit.</p>
    } @else {
      <p>
        The editor is unavailable until the selected ticket and lookups are
        ready.
      </p>
    }
  `,
})
export class TicketWorkspaceComponent {
  readonly store = inject(TicketWorkspaceStore);

  readonly ticketModel = linkedSignal(
    () => this.store.draft() ?? EMPTY_TICKET_FORM,
    {
      set: (draft) => this.store.setDraft(draft),
    },
  );

  readonly ticketForm = form(this.ticketModel, (path) => {
    // 👇 The generated contract validates the shape; its issues land on named fields.
    validateStandardSchema(path, UpdateTicketRequestSchema);
    disabled(path, { when: () => !this.store.formReady() });
  });

  selectTicket(id: string): void {
    if (
      !this.store.requestSelection(id) &&
      window.confirm('Discard unsaved changes and switch tickets?')
    ) {
      this.store.requestSelection(id, true);
    }
  }

  save(): void {
    submit(this.ticketForm, async () => {
      const ticket = this.store.selectedTicketValue();
      const draft = this.store.draft();
      if (!ticket || !draft || !this.store.formReady()) {
        return {
          kind: 'not_loaded',
          message: 'The selected ticket and lookups are not ready.',
        };
      }
      try {
        const command: SaveTicket = {
          id: ticket.id,
          session: this.store.editSession(),
          draft,
          body: toUpdateTicketRequest(draft),
        };
        const result = await this.store.saveTicket(command);
        return toSubmitResult(result);
      } catch (error) {
        return { kind: 'processing_error', message: toSaveMessage(error) };
      }
    });
  }
}
```

All reads use `"undefined value"` error handling for safe value-alias reads after a resource error. Toolkit 22.0.1's `"previous value"` cache can throw on the first value read after an error and can cache `undefined` during loading; it does not guarantee last-good data. If stale values are required, use native resource extensions with a separate explicit retention/error policy. The edit-session baseline is not a stale-resource fallback. The editor still requires matching loaded detail and ready lookups. In Toolkit 22.0.1, resource `hasValue()` guards, named and unnamed, narrow their value aliases. Mutation narrowing remains a separate issue in the audit.

The browser's native confirmation is called only from the selection click handler. Cancel leaves the current session unchanged; confirm retries with explicit discard permission. Route exits need their own guard using the same dirty policy.

The assignee options and field-level error markup are omitted; supply options from the loaded lookup and render field errors as shown in the forms bridge. The generated schema must match this form's fields, without a duplicate `required` rule. Submit success does not itself prove pending async validation completed; apply the validation policy in the bridge if async rules are added. Request mapping runs inside the caller's `try` before mutation invocation, so mapping failures become form errors without entering the mutation. The command retains the immutable draft reference for the success guard and a prepared body for the request; neither may be mutated while pending. Catching the awaited call handles rejections, but does not prove settlement after a synchronous request-factory throw in Toolkit 22.0.1. See the source-order caveat in [`contracts.md`](contracts.md#request-boundary-the-generated-request-schema).

## Autosave variation

Replace the submit trigger only when the product needs settled edits persisted. Keep the same captured `SaveTicket` input, guarded success handling, and list reload. The additional policy is more important than another copy of the mutation:

1. Derive a candidate only for loaded matching detail with a changed draft. Capture `{ id, session, draft }` before debouncing it. `debounced()` returns `Resource<T>` without adding undefined, but this candidate type can itself include undefined while not ready.
2. Feed the settled candidate into a reactive `signalMethod` declared after the mutation. Reject absent candidates, old sessions, and draft snapshots that are no longer current. Suppress the initial seed and already acknowledged or queued snapshots so response-driven updates cannot loop back into saves. Inside the caller's `try`, map and validate the accepted draft into `body` before invoking the mutation with `{ ...candidate, body }`. A mapping failure must report a visible error without invoking the mutation or marking the snapshot queued. The request factory only assembles the request from this prevalidated command.
3. Queue writes with `concatOp`, including partial PATCH operations. Queued commands retain their own id and snapshot. Define whether leaving an edit session drains or cancels unsent work; cancellation cannot undo work already sent. On conflict or an uncertain failure, pause and reconcile before sending more writes.
4. Use `switchOp` only with an explicit endpoint version/conflict policy. It switches subscriptions, not server transactions. It provides neither rollback nor commit-order guarantees, even for full replacements.
5. Advance detail and baseline on each confirmed same-record, same-session save; guard draft replacement separately by submitted snapshot, and reload the list on success. Do not reset a newer draft to an older acknowledgement. Track acknowledged or queued versions for deduplication; the stable `isDirty` comparison is not a write-history ledger.
6. Render pending/error state and handle all returned outcomes plus exceptions. `withMutations` exposes pending/status/error aliases, not a last-result value alias. An abort is unconfirmed; suppress its message only when the endpoint and reporting policies make a newer call authoritative.

Autosave is a policy outline here, not a complete implementation. See [`contracts.md`](contracts.md) for partial request mapping. Verify the chosen queue and endpoint policy before shipping it.

## Tests that prove the graph

Use `TestBed` to instantiate the store and test only its public API. Cover each edge, rather than snapshotting internal slices:

1. Call `setQuery()` or `setFilters()` and assert page reset plus a resource request built from the new inputs.
2. Select a ticket through `requestSelection`, resolve detail S0, and edit. Pass through transient `undefined`, a resource error, and a same-id refetch with changed server data; assert draft and dirty comparison still use the seeded S0 baseline. Also refetch a clean draft and assert it stays clean. A mismatched detail must not seed either value. Dirty selection/deselection must return false without changing the id or session. Cancel confirmation and assert no change; confirm and assert a fresh session seeds only matching detail. Same-id selection is a no-op.
3. Update a Signal Form field and assert the draft changes immediately; change the draft through `setDraft()` and assert the form model follows.
4. Resolve `saveTicket` with no newer edits and assert same-session detail, baseline, and draft adopt the server-normalized response and `isDirty()` is false. Load S0, submit S1, edit S2 while pending, then acknowledge S1: detail and baseline must become S1, draft must remain S2, and dirty must remain true. Restore S0 and assert it is still dirty; set the saved S1 values and assert clean. Infer the private baseline through these public comparisons. Change selection, select A → B → A even without intermediate signal reads, or return a mismatched saved id; assert old responses cannot update the current detail, baseline, or draft. Check membership/order/count changes through the list reload in each success case.
5. Test a returned mutation error separately from a rejected `saveTicket` call. Assert `toSubmitResult` handles the returned error and the caller's catch returns a processing error for the rejection; detail, baseline, and draft remain unchanged. Failed or aborted saves must not advance the baseline.
6. Double-submit against `exhaustOp` and assert the dropped call returns `aborted` — and that the form is not marked saved by it.
7. Put each resource in loading/error/absence states, including an error before its first value read and loading followed by error. Value aliases must be safely readable and undefined on error, with visible error banners rather than a promised stale list. A seeded dirty draft must stay dirty throughout resource absence and errors. Assert the form requires matching loaded detail and all lookups, and native submit does not navigate.
8. For autosave, assert queued command order, captured ids, deduplication, stale-session rejection, and newer-draft preservation. If using switching, test the endpoint's version policy rather than assuming client cancellation orders commits.
9. Change a tag or assignee resource and assert `editorView` recomputes; test `toTicketEditorView` directly as a pure function.
10. Throw from caller-side request mapping and assert a visible form error, no mutation invocation or HTTP request, and unchanged mutation state, detail, baseline, and draft. A later valid command must still save. Cover the same boundary for autosave. Do not use a request-factory throw plus caller catch as proof of normal settlement. Test pending validation policy and action rejection separately from returned mutation errors.

If a reactive `signalMethod` is called with a signal, run it in an injection context and flush the effect before asserting. Static values remain synchronous.
