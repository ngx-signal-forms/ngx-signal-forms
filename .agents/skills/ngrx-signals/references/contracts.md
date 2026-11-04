# Generated contracts at the HTTP boundary

When OpenAPI generates both TypeScript types and Zod schemas, the schemas are the **contract**. Use them instead of local DTO schemas, `as` casts, or type-only trust at every HTTP boundary.

Keep the generated type names and schema names in one API-contract module. Generator naming differs, so substitute the names yours exports.

```ts
// api-contracts/tickets.ts — generated from OpenAPI; never duplicate these by hand.
import {
  CreateTicketRequestSchema,
  PatchTicketRequestSchema,
  TicketSchema,
  UpdateTicketRequestSchema,
} from '@app/api/generated/zod';
import type {
  CreateTicketRequest,
  PatchTicketRequest,
  Ticket,
  UpdateTicketRequest,
} from '@app/api/generated/types';

export {
  CreateTicketRequestSchema,
  PatchTicketRequestSchema,
  TicketSchema,
  UpdateTicketRequestSchema,
};
export type {
  CreateTicketRequest,
  PatchTicketRequest,
  Ticket,
  UpdateTicketRequest,
};
```

Names such as `TicketSchema` and `UserListSchema` throughout this skill stand for imports from this module.

The contract has three boundaries, and each one has its own owner.

| Boundary | Owner                                                                                                         | Failure becomes                                                         |
| -------- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Response | `parse` on the resource or mutation                                                                           | Resource error state, or a mutation error result                        |
| Form     | `validateStandardSchema` in the form schema                                                                   | Field errors when issue paths match the model                           |
| Request  | The generated request schema in the pure mapping, called inside the caller's `try` before mutation invocation | A caught contract failure without entering the mutation or sending HTTP |

## Response boundary: `parse`

Validate data-bearing resource and mutation responses with the generated schema's `parse`. A malformed `200` is a contract failure, not data the store should own. Angular sends a thrown `httpResource` parser failure through the resource error path; Toolkit sends a thrown mutation response parser failure through the mutation error result. A bodyless `204` delete needs no response schema or dummy parser. Explicit response generics provide typing without runtime validation.

```ts
import { httpResource } from "@angular/common/http";
import { httpMutation, withMutations, withResource } from "@ngrx-toolkit/core";
import { TicketSchema } from "@app/api-contracts/tickets";

withResource(({ ticketId }) => ({
  ticket: httpResource(
    () => (ticketId() != null ? `/api/tickets/${ticketId()}` : undefined),
    { parse: TicketSchema.parse },
  ),
}), { errorHandling: "undefined value" }),

withMutations(() => ({
  deleteTicket: httpMutation<string, void>({
    request: (id) => ({ url: `/api/tickets/${id}`, method: "DELETE" }),
  }),
})),
```

Use the schema type as a compile-time compatibility check against the generated TypeScript type, rather than asserting the response:

```ts
import { TicketSchema, type Ticket } from '@app/api-contracts/tickets';

export const parseTicket = (raw: unknown): Ticket => TicketSchema.parse(raw);
```

If this does not type-check, the generator outputs disagree. Fix the contract generation rather than casting either side.

## Form boundary: `validateStandardSchema`

A Zod schema is a Standard Schema, so Angular binds it to the form directly and maps each issue onto the field its path names. This replaces validating by hand in the submit handler.

```ts
import { form, validateStandardSchema } from "@angular/forms/signals";
import { UpdateTicketRequestSchema } from "@app/api-contracts/tickets";

readonly ticketForm = form(this.formModel, (path) => {
  // 👇 Nested issue paths land on nested fields. No manual path mapping.
  validateStandardSchema(path, UpdateTicketRequestSchema);
});
```

The generated schema states what the API accepts. Add hand-written rules only for interaction requirements it does not already express, such as disabling a field while loading. Repeating a required-title rule produces duplicate errors.

**Issue paths must match the form model.** A schema keyed by `assignee_id` does not directly describe a form keyed by `assigneeId`. Do not assume a mismatch is silent, leaves the form valid, throws, or logs; those effects are not guaranteed. Verify how the installed adapter handles unmatched paths and assert the error reaches the intended field.

A generator that emits snake_case is the common cause. Two ways out, in order:

1. Keep the form in the wire shape when that is acceptable, or use a generator-supported model adapter that also serializes back to the original wire names. Renaming generated properties alone must not change the HTTP contract.
2. Keep a camelCase form and map explicitly to the snake_case request before parsing. Use form-shaped validation or map schema issue paths back to form paths. Request parsing alone does not provide per-field form errors.

Test this edge deliberately: an invalid value must produce an error on the intended field, and the serialized request must retain the API's wire keys. A passing form followed by an API rejection has other possible causes too.

When one editor serves several operations, bind the schema for the operation it will actually send — the create schema for a new record, the update schema for an existing one. Pass a `LogicFn` instead of a schema to switch on form state: `validateStandardSchema(path, () => isNew() ? CreateSchema : UpdateSchema)`.

Reach for `standardSchemaError(issue, options)` only to build a single issue by hand, and for a `LogicFn` second argument to `validateStandardSchema` when the schema itself depends on form state.

## Request boundary: the generated request schema

Use the operation-specific schema: create for `POST`, full replacement for `PUT`, and the OpenAPI-defined partial for `PATCH`. Do not invent a patch contract with `.partial()` when the specification already defines one.

Keep the mapping pure and let the schema decide whether its output is a request. Every caller must run potentially throwing mapping and validation inside `try` before invoking the mutation. The mutation request factory only assembles a request from the captured id and prepared body. This example assumes the API itself uses camelCase wire keys; for a snake_case API, explicitly emit its keys in both the full and partial mappings:

```ts
import {
  CreateTicketRequestSchema,
  PatchTicketRequestSchema,
  UpdateTicketRequestSchema,
  type CreateTicketRequest,
  type PatchTicketRequest,
  type UpdateTicketRequest,
} from '@app/api-contracts/tickets';

type TicketForm = {
  title: string;
  description: string;
  assigneeId: string | null;
  status: 'open' | 'closed';
};

// Pure mapping. Owns UI-to-API shape changes only; the schemas own validation.
export function toTicketRequestCandidate(form: TicketForm) {
  return {
    title: form.title.trim(),
    description: form.description,
    assigneeId: form.assigneeId,
    status: form.status,
  };
}

export function toCreateTicketRequest(form: TicketForm): CreateTicketRequest {
  return CreateTicketRequestSchema.parse(toTicketRequestCandidate(form));
}

export function toUpdateTicketRequest(form: TicketForm): UpdateTicketRequest {
  return UpdateTicketRequestSchema.parse(toTicketRequestCandidate(form));
}

export function toPatchTicketRequest(
  changes: Partial<TicketForm>,
): PatchTicketRequest {
  return PatchTicketRequestSchema.parse({
    ...changes,
    ...(changes.title === undefined ? {} : { title: changes.title.trim() }),
  });
}
```

```ts
import { concatOp, exhaustOp, httpMutation, withMutations } from "@ngrx-toolkit/core";
import { TicketSchema, type Ticket, type CreateTicketRequest, type UpdateTicketRequest, type PatchTicketRequest } from "@app/api-contracts/tickets";

withMutations(() => ({
  createTicket: httpMutation<CreateTicketRequest, Ticket>({
    request: (body) => ({ url: "/api/tickets", method: "POST", body }),
    parse: TicketSchema.parse,
    operator: exhaustOp,
  }),
  replaceTicket: httpMutation<{ id: Ticket["id"]; body: UpdateTicketRequest }, Ticket>({
    request: ({ id, body }) => ({
      url: `/api/tickets/${id}`,
      method: "PUT",
      body,
    }),
    parse: TicketSchema.parse,
    operator: exhaustOp,
  }),
  patchTicket: httpMutation<{ id: Ticket["id"]; body: PatchTicketRequest }, Ticket>({
    request: ({ id, body }) => ({
      url: `/api/tickets/${id}`,
      method: "PATCH",
      body,
    }),
    parse: TicketSchema.parse,
    operator: concatOp,
  }),
})),
```

Capture the record id with the command so a queued request cannot target a later selection. Queue partial PATCH writes with `concatOp` unless the endpoint has an explicit version/conflict policy. `switchOp` cancels subscriptions, not server commits, and does not guarantee server write order even for full replacements. A client queue orders its own requests; concurrent clients still need a server conflict policy.

Request mapping and schema `parse()` can throw even after form validation: trimming or other transforms may invalidate a value, the operation schema may differ, or pending validation may not have blocked the action. In Toolkit 22.0.1, `httpMutation.operation` calls `options.request(param)` before returning its inner `defer` Observable. `rxMutation` invokes the operation in an outer `defer`, then attaches the inner catch/finalize handlers. A synchronous request-factory throw therefore cannot be promised to settle normally; caller catch alone is not proof that the result resolves or pending state clears. Keep potentially throwing preparation before mutation invocation, inside the caller's `try`. Handle returned outcomes and awaited-call rejections separately. A response parse failure can follow an already committed write, so it is not evidence of rollback.

The mutation's input type is not runtime validation. Apply this boundary to every caller, including autosave and non-form commands. Create callers prepare `toCreateTicketRequest(form)`; PATCH callers prepare `toPatchTicketRequest(changes)`. Pass those bodies without remapping or parsing inside the request factory, and keep queued command data immutable.

The submit handler captures the target and handles returned outcomes and exceptions:

```ts
save(): void {
  submit(this.ticketForm, async (formTree) => {
    const id = this.store.selectedTicketId();
    if (id == null) return { kind: "not_loaded", message: "Select a ticket before saving." };
    try {
      const body = toUpdateTicketRequest(formTree().value());
      const result = await this.store.replaceTicket({ id, body });
      return toSubmitResult(result);
    } catch (error) {
      return { kind: "processing_error", message: toSaveMessage(error) };
    }
  });
}
```

`toSubmitResult` and `toSaveMessage` live in [`signal-forms-bridge.md`](signal-forms-bridge.md#mutation-outcome-to-form-result). That section also covers `submit()` pending-validation and rejection semantics. Detail editors must additionally check that the loaded model matches this id; these contract-only examples do not patch detail or draft state.

## Contract review

Before completion, verify:

- Every data-bearing resource and mutation response passes through a generated schema's `parse`; bodyless deletes need none.
- The form uses `validateStandardSchema` where shapes match; an adapted form uses form-shaped rules or mapped issue paths without duplicating contract rules.
- `POST`, `PUT`, and `PATCH` bodies are built by a pure mapping and validated by the operation's own generated schema inside the caller's `try`, before mutation invocation. Request factories only assemble requests from prevalidated captured commands.
- No local duplicate DTO schema and no `as` cast appears at any HTTP boundary.
- Form issue paths match the UI model, while request mapping preserves wire keys. Caller-side mapping failures and call rejections have a visible error path; a caught request-factory throw is not proof of normal mutation settlement.
- Partial writes queue unless an endpoint version policy makes another operator safe.
- Tests cover three edges: an invalid response enters the error path, an invalid form value produces field errors, and a valid request reaches reconciliation without a cast.
- A throwing request mapper produces a visible caller error without mutation invocation or HTTP, leaves mutation state unchanged, and does not block a later valid command.
