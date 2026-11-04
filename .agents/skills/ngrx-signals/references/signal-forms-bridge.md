# Signal Forms bridge

## Model boundary

Angular Signal Forms needs a writable model signal. Keep that model plain, fully initialised, and stable in shape: no `undefined`, class instances, `Map`, or `Set` in the structural layer. Translate at the form boundary when the domain and UI shapes differ, such as a `Date` split into separate date and time fields.

A form model is not a second owner as long as it has one defined write path back to the store slice it edits. The two patterns below differ only in where that write path leads.

Bind fields with the `FormField` directive:

```ts
import { form, FormField } from '@angular/forms/signals';
```

```html
<input [formField]="userForm.displayName" />
```

`[formField]` binds `disabled`, `hidden`, `readonly`, and `name` from the field state. Leave `value`, `min`, `max`, `[disabled]`, and `[readonly]` out of the template — the field owns them. Static `value` on a radio or checkbox input is the exception and is required. Keep Reactive Forms `FormGroup`, `formControlName`, and `Validators` out of this pattern entirely; they carry a different model.

## Mutation outcome to form result

For Toolkit-backed Signal Forms saves, share one mapper from `MutationResult` to form state, for example at `shared/forms/to-submit-result.ts`. The Toolkit submit recipes in `recipes.md` and `recipes-combined.md` call it by name and assume that file exists.

Native or core-only commands use their own success, failure, and cancellation contracts. Map those outcomes or caught errors to `TreeValidationResult`, with visible messages and confirmed success before navigation. Signal Forms does not require installing Toolkit or adopting `MutationResult`.

```ts
import { HttpErrorResponse } from '@angular/common/http';
import type { MutationResult } from '@ngrx-toolkit/core';
import type { TreeValidationResult } from '@angular/forms/signals';

export function toSubmitResult(
  result: MutationResult<unknown>,
): TreeValidationResult {
  switch (result.status) {
    case 'success':
      return null;
    // Cancellation does not establish whether the server committed a write.
    case 'aborted':
      return {
        kind: 'aborted',
        message: 'Save outcome unconfirmed. Check the record before retrying.',
      };
    case 'error':
      return { kind: 'processing_error', message: toSaveMessage(result.error) };
  }
}

export function toSaveMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    return error.status === 409
      ? 'Someone else changed this record. Reload before saving.'
      : `Could not confirm the save (${error.status}).`;
  }
  return 'The save failed.';
}
```

Two facts decide the shape of that function.

**A mutation result has three branches, not two.** `MutationResult<T>` is `{ status: 'success'; value: T } | { status: 'error'; error: unknown } | { status: 'aborted' }`. An overlapping `exhaustOp` call is dropped; `switchOp` can cancel a subscription after its request reached the server. Neither an abort nor a transport failure proves rollback. Treat `aborted` as an unconfirmed outcome, never a success that clears the draft or advances navigation. Suppress its message only when another call provably owns reporting and the endpoint's ordering policy makes that safe.

**A form error carries `kind` and `message` only.** `ValidationError` is `{ kind: string; message?: string }`, and `submit()` types its callback's return as `TreeValidationResult` — `null | undefined | void`, one error, or a readonly array of errors. Add `fieldTree` to aim an error at one field.

Putting the server text under any other key — `{ kind: 'processing_error', error: result.error }` is the tempting shape — **fails silently**. The object still arrives in `field().errors()` with the extra key attached, but nothing reads it: `message` is the conventional carrier, and a template rendering `error.message` prints nothing. The user gets an error with no text, and the reason the save failed is stranded on a key no one looks at.

TypeScript's structural typing can allow extra properties on an inferred callback result. Do not rely on excess-property checks to catch this; convert the error to a string and put it in `message`.

`submit()` resolves `Promise<boolean>`. **`true` means the action was allowed to run and returned no errors.** It does not prove that all validation completed. The default `ignoreValidators` pending policy can allow the action while async validators are pending. Choose an appropriate pending policy or explicitly gate pending validation when completion is required. A returned validation error makes the result `false`; an exception from the action rejects the promise rather than resolving `false`.

Only navigate after confirmed mutation success, with the required validation gate and rejection handling:

```ts
try {
  if (await submit(this.userForm, action)) {
    this.router.navigate(['/tickets']);
  }
} catch (error) {
  this.saveError.set(toSaveMessage(error));
}
```

Here `saveError` is a component-owned message signal rendered in the template. For a Toolkit command, `action` maps the mutation result through `toSubmitResult` or an equivalent; returning `null` for an abort would allow navigation without confirmed success. A native command maps its own outcomes and errors instead.

### Showing the errors

Nothing renders errors for you — Angular exposes them as signals and the template decides. Three reads cover every case:

```html
<!-- One field. -->
<input [formField]="userForm.displayName" />
@for (error of userForm.displayName().errors(); track error.kind) {
<p class="error">{{ error.message }}</p>
}

<!-- The whole form, including the submit result returned above. -->
@for (error of userForm().errors(); track error.kind) {
<p role="alert">{{ error.message }}</p>
}

<!-- Everything, wherever it sits in the tree — for a summary banner. -->
@if (userForm().errorSummary().length) {
<p role="alert">{{ userForm().errorSummary().length }} problems to fix.</p>
}
```

`errors()` is the errors on that node alone; `errorSummary()` is that node plus every descendant. A form-level error returned from `submit()` lands on the root, so `userForm().errors()` is where a failed save appears. Pair it with `userForm().submitting()` to disable the button while the save runs.

## Submit model: resource value to draft

For a form loaded from a resource and saved on submit, seed a local draft from matching loaded detail. The writable form model projects that draft; edits stay local until submit.

```ts
import { Component, inject, linkedSignal } from '@angular/core';
import {
  disabled,
  form,
  FormField,
  required,
  submit,
} from '@angular/forms/signals';

type UserForm = { displayName: string };

const EMPTY_USER_FORM: UserForm = { displayName: '' };

@Component({
  imports: [FormField],
  providers: [UserStore],
  template: `<input [formField]="userForm.displayName" />`,
})
class UserEditor {
  readonly store = inject(UserStore);

  // Assumes UserStore exposes selectedUserId and a matching user resource.
  readonly draft = linkedSignal<
    {
      id: ReturnType<InstanceType<typeof UserStore>['selectedUserId']>;
      user: ReturnType<InstanceType<typeof UserStore>['userValue']>;
    },
    UserForm | null
  >({
    source: () => ({
      id: this.store.selectedUserId(),
      user: this.store.userValue(),
    }),
    computation: ({ id, user }, previous): UserForm | null => {
      if (id == null) return null;
      if (previous?.source.id === id && previous.value !== null)
        return previous.value;
      return user?.id === id ? { displayName: user.displayName } : null;
    },
  });
  readonly formModel = linkedSignal(() => this.draft() ?? EMPTY_USER_FORM, {
    set: (draft) => this.draft.set(draft),
  });

  readonly userForm = form(this.formModel, (path) => {
    required(path.displayName);
    disabled(path, {
      when: () => {
        const user = this.store.userValue();
        return (
          !user ||
          user.id !== this.store.selectedUserId() ||
          this.store.userIsLoading()
        );
      },
    });
  });

  save(): void {
    void submit(this.userForm, async (formTree) => {
      const current = this.store.userValue();
      if (
        !current ||
        current.id !== this.store.selectedUserId() ||
        this.store.userIsLoading()
      ) {
        return {
          kind: 'not_loaded',
          message: 'The selected user is not loaded yet.',
        };
      }

      try {
        const body = toUpdateUserRequest({ ...current, ...formTree().value() });
        const result = await this.store.saveUser({ id: current.id, body });
        return toSubmitResult(result);
      } catch (error) {
        return { kind: 'processing_error', message: toSaveMessage(error) };
      }
    });
  }
}
```

The application-specific `UserStore` uses undefined-on-error resource reads and accepts a prepared `{ id, body }` save command. Import the schema-validating `toUpdateUserRequest` mapper from the application's [contracts](contracts.md). It runs inside the caller's `try` before the mutation, so an invalid body cannot enter a request factory whose synchronous throw may bypass Toolkit 22.0.1's normal settlement.

The `submit()` callback must return a `Promise`; `async` is the usual way to do that. Returning the mapped mutation outcome turns a server rejection into form state, displayed next to client-side validation errors.

This example needs Angular 22.1 for the custom setter. It seeds once when the selected user loads, preserves edits through same-id refetches and transient `undefined`, and discards the draft on selection change or deselection. Confirm discarding unsaved edits before changing the selection. Below 22.1, use a component-owned writable model with explicit edit-session seeding instead of the custom setter.

Saving does not reset this local draft. `saveUser` must also avoid patching a different selection from a late response. To adopt server-normalized values after success, capture an edit-session token and the submitted draft or revision, then replace only if both still match. See the combined recipe for store-owned reconciliation. Reset Signal Forms interaction metadata separately if the product requires it.

## Live model: `linkedSignal` custom `set`

When each keystroke must reach a protected store draft, give `linkedSignal` a custom `set`. The store owns the draft; the form model reads it and writes through it.

```ts
import { Component, inject, linkedSignal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';

type ProfileForm = { displayName: string; marketingEnabled: boolean };

const EMPTY_PROFILE_FORM: ProfileForm = {
  displayName: '',
  marketingEnabled: false,
};

export const ProfileEditorStore = signalStore(
  withState({ draft: EMPTY_PROFILE_FORM }),
  withMethods((store) => ({
    setDraft(draft: ProfileForm) {
      patchState(store, { draft });
    },
  })),
);

@Component({
  imports: [FormField],
  providers: [ProfileEditorStore],
  template: `
    <input [formField]="profileForm.displayName" />
    <input type="checkbox" [formField]="profileForm.marketingEnabled" />
  `,
})
class ProfileEditor {
  readonly store = inject(ProfileEditorStore);

  readonly formModel = linkedSignal(() => this.store.draft(), {
    set: (draft) => this.store.setDraft(draft),
  });

  readonly profileForm = form(this.formModel);
}
```

The write is synchronous and `draft` has one owner. Do not add an `effect` that copies form values into the store: it runs after the form write, creates an indirect feedback path, and re-introduces a second writer.

Three properties of `set` decide how you use it:

- **`update()` routes through `set` too.** Both `set()` and `update()` on the linked signal reach the store boundary, so field-level edits from a nested control land there as well.
- **`set` receives the whole value, never a patch.** A single nested field edit arrives as a complete new model object. When the linked signal projects one part of a larger object, merge on write:

  ```ts
  readonly displayName = linkedSignal(() => this.store.profile().displayName, {
    // `patchProfile` is a store method that immutably merges this field.
    set: (displayName) => this.store.patchProfile({ displayName }),
  });
  ```

- **`rawSet` is the escape hatch.** The second argument of `set` writes the linked signal's internal value directly and skips the source of truth. Use it only to avoid re-running an expensive computation whose result you already hold. Store synchronisation writes the source instead.

Requires Angular 22.1 or later. On earlier versions keep the form model local and send its value through an explicit save method. Use plain methods for imperative writes; use `signalMethod` when the caller supplies a reactive signal input. Neither form pattern requires Toolkit resources.

## Draft initialisation policy

Seed an editable draft once a record matching the selected id loads. Keep the selected id or edit-session token separate from the resource value so transient `undefined` cannot erase the draft's identity.

Tracking a resource value into a live draft **without a guard** lets a background refetch delete the user's unsaved input. Pick one policy per editor and write it down:

- **Replace** on an explicit discard or new edit session. A save response may replace the draft only if its session and submitted draft or revision still match.
- **Preserve** the draft while it is dirty, and show that the server version moved.
- **Merge** only when the domain has a safe field-level conflict rule.

Recipe 5 in [`recipes.md`](recipes.md) preserves a seeded draft for the same edit session, including while the resource is absent. Comparing only `previous.source?.id` from a possibly undefined resource loses that identity during loading. Use a stable selection/session source and a nullable draft as the not-yet-seeded marker; the form itself still receives a fully initialized model. These examples preserve even clean drafts until an explicit transition, rather than silently adopting a refetch. Selection changes discard the old draft, so apply any unsaved-change confirmation before that boundary.

## Validation belongs in the schema

`form(model, path => ...)` takes a schema function, and everything that decides whether a value is acceptable goes inside it. Four builders cover the enterprise cases; reach for them before writing validation by hand in a submit handler.

### `validateStandardSchema` — a Zod or Valibot schema on the form

```ts
import { form, validateStandardSchema } from "@angular/forms/signals";
import { UpdateTicketRequestSchema } from "@app/api-contracts/tickets";

readonly ticketForm = form(this.formModel, (path) => {
  // 👇 Issue paths map onto matching fields. Nested paths land on nested fields.
  validateStandardSchema(path, UpdateTicketRequestSchema);
});
```

Any Standard Schema implementation works, so a generated OpenAPI Zod schema validates the form directly and its issues arrive on the fields they name. Use `standardSchemaError(issue, options)` only to build one issue by hand. See [`contracts.md`](contracts.md) for the whole generated-contract boundary.

### `validateHttp` — the server decides

For a check only the backend can make — a unique name, a booking still available — declare it in the schema rather than at submit time:

```ts
import { validateHttp } from '@angular/forms/signals';

validateHttp(path.slug, {
  request: ({ value }) =>
    value() ? `/api/tickets/slug-available?slug=${value()}` : undefined,
  onSuccess: (available: boolean) =>
    available ? null : { kind: 'slug_taken', message: 'Already in use.' },
  onError: () => ({
    kind: 'slug_check_failed',
    message: 'Could not check the slug.',
  }),
  debounce: 300,
});
```

It runs on an `httpResource` and starts only once synchronous validation passes. Returning `undefined` from `request` keeps it idle. `when` gates it further.

### `schema`, `apply`, and `applyEach` — reuse and arrays

`schema()` packages a reusable rule set; `apply()` mounts it on a path; `applyEach()` mounts it on every item of an array. `applyEach` is the answer for a line-items editor:

```ts
import { applyEach, disabled, form, schema, validateStandardSchema } from "@angular/forms/signals";

// 👇 Interaction only. The generated schema already states "productId is required"
//    and "quantity >= 1", so repeating them here would double every message.
const lineSchema = schema<WorkOrderLine>((line) => {
  disabled(line.productId, { when: ({ valueOf }) => valueOf(line.locked) });
});

readonly orderForm = form(this.formModel, (path) => {
  // 👇 The contract validates the whole payload, nested arrays included.
  validateStandardSchema(path, OrderRequestSchema);
  applyEach(path.lines, lineSchema);
});
```

The two compose: a schema issue at path `lines[2].quantity` lands on that row's field, and `applyEach` adds interaction rules on top.

**Without a generated schema**, `lineSchema` is where the per-row rules live instead:

```ts
import { min, required, schema } from '@angular/forms/signals';

const lineSchema = schema<WorkOrderLine>((line) => {
  required(line.productId);
  min(line.quantity, 1);
});
```

Pick one home per rule. A rule stated in both produces two errors with different `kind`s on the same field.

`applyWhen(path, condition, schema)` mounts a rule set only while a condition holds, which is how a multi-step or conditional form stays declarative.

### Rendering and editing the rows

An array path is iterable and indexable, so `@for` over it yields a field tree per row and rows bind exactly like scalars:

```html
@for (line of orderForm.lines; track $index) {
<input [formField]="line.productId" />
<input type="number" [formField]="line.quantity" />
<button type="button" (click)="removeLine($index)">Remove</button>
}
```

```ts
// 👇 Rows are added and removed on the MODEL, never on the form tree.
addLine(): void {
  this.model.update((order) => ({ ...order, lines: [...order.lines, EMPTY_LINE] }));
}
removeLine(index: number): void {
  this.model.update((order) => ({ ...order, lines: order.lines.filter((_, i) => i !== index) }));
}

// Per-row state reads off the same tree.
rowErrors(index: number) {
  return this.orderForm.lines[index]?.().errors() ?? [];
}
```

The form derives from the model, so structural edits belong to the model signal. When that model is a store draft behind `linkedSignal({ set })`, add and remove through the store's write boundary instead — the row list is state, and it keeps the one owner it already had.

### Duplicate rules produce duplicate errors

When a schema and a hand-written `required` both reject the same missing value, they produce separate errors with different `kind` values, both listed in `errors()`. Keep one home for that requirement:

- The generated schema states what the **API** accepts — types, lengths, enums, nullability.
- Hand-written rules state what the **interaction** needs — required in this step, disabled while loading, a cross-field rule the contract cannot express.

When a rule genuinely exists in both, keep the schema and drop the hand-written copy; render `errors()` and show the first message rather than every one.

### `debounce` — delays the model write, not the save

`debounce(path, 500 | 'blur' | Debouncer)` from `@angular/forms/signals` holds back the **model update itself**. That is the opposite of what autosave wants: autosave keeps the draft current per keystroke and debounces only the mutation trigger, with `debounced()` from `@angular/core` over the draft signal. Pick by asking what must stay live:

| Delay this      | Use                                 | Because                                                                          |
| --------------- | ----------------------------------- | -------------------------------------------------------------------------------- |
| The command     | `debounced(draft, 800)` from core   | The draft stays live for previews, dirty checks, and guards                      |
| The model write | `debounce(path, 'blur')` from forms | Nothing needs the intermediate value, and a per-keystroke validator is expensive |

## Save and refresh

For an autosave form, call the mutation from a focused command and reconcile afterwards. For a submit form, map the form value into the mutation and keep the resource read graph independent of the draft.

Make a resource depend on a form field only when the product genuinely wants a request per keystroke — a search-as-you-type box does, an edit form does not. Request inputs, editable drafts, and mutation inputs stay three separate roles.

## Form and store review

Before completion, verify:

- Every field has an initial value its control understands, and the model shape never changes.
- Domain-to-form and form-to-domain mapping is explicit wherever the shapes differ.
- Loading and disabled state come from the read model; resource-based editors also check loaded record identity.
- Seeded drafts survive transient missing data. Selection/discard boundaries are explicit, and save responses cannot replace a newer session or draft.
- Pending-validation policy is explicit where completion matters; thrown actions reject and need handling. An aborted mutation is unconfirmed, not proof nothing was saved.
- Every awaited Toolkit mutation result branches on `success`, `error`, and `aborted`, through `toSubmitResult` or an equivalent that states its abort policy. Native commands handle their own outcome and error contracts without requiring Toolkit.
- Every `submit()` error return carries `kind` and `message` only, plus `fieldTree` to aim it.
- Validation that a schema builder covers is declared in the schema, not hand-written in the submit handler.
- A live form uses `linkedSignal({ set })` only on Angular 22.1 or later.
- The form-to-store path contains no synchronisation `effect`.
