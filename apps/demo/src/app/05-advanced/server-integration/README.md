# Server Integration

## Intent

The most-requested real-world flow with no runnable demo before this one: load a record from a server, let the user edit it, and map the server's response — success or rejection — back onto the form. This demo shows the whole loop: `resource()` prefill, declarative `submission`, and mapping a rejected save's `{ fieldErrors, formError }` payload onto a native `TreeValidationResult`.

## Toolkit features showcased

- `resource({ loader })` — fetches the fake profile record; an `effect()` pushes the resolved value into the form's model signal and calls `reset(value)` so the freshly loaded record starts pristine.
- `form(model, schema, { submission })` + `[formRoot]` — the same declarative submission lifecycle as [Submission Patterns](../submission-patterns/README.md).
- Native `TreeValidationResult` returned from `action` — an array of `{ kind, message, fieldTree }`, mapped from the fake API's `fieldErrors` dictionary by walking a statically-typed `PROFILE_FIELD_KEYS` list (avoids the `keyof`-widening `Object.entries`/`Object.keys` would need an unsafe cast to undo).
- `NgxFormField` wrapper — renders the server-mapped field error with zero special-case markup; it is indistinguishable from a client-side validation error.
- `createOnInvalidHandler()` — focuses the first invalid field on a client-side-invalid submit attempt.

## Form model

- Signal model: `signal<ProfileFormModel>({ name: '', email: '' })`, replaced by the loaded record once `resource()` resolves.
- Schema: `form(model, profileSchema, { submission })`.
- Fake backend: `ProfileApiService` (`server-integration.api.ts`) — in-memory record, `setTimeout`-based ~400ms latency, **no real HTTP** (no `HttpClient`, no MSW handler; contrast with [Async Validation](../async-validation/README.md), which does route through MSW).

## Validation rules

### Errors

- Name — required; min length 2.
- Email — required; must be a valid email format.
- Email — server-side only: `saveProfile()` rejects whenever the submitted email is `taken@example.com`, returning both a field message (`This email is already taken.`) and a general message (`Please fix the errors below.`).

### Warnings

- None.

## The `TreeValidationResult` mechanism

Verified directly against `node_modules/@angular/forms/types/_structure-chunk.d.ts`:

```ts
interface FormSubmitOptions<TRootModel, TSubmittedModel> {
  action: (
    field: FieldTree<TRootModel & TSubmittedModel>,
    detail: {
      root: FieldTree<TRootModel>;
      submitted: FieldTree<TSubmittedModel>;
    },
  ) => Promise<TreeValidationResult>;
  // ...
}

type TreeValidationResult<
  E extends ValidationError.WithOptionalFieldTree =
    ValidationError.WithOptionalFieldTree,
> = ValidationSuccess | OneOrMany<E>;
```

`action` returns `undefined`/`null` for success, or one error / an array of errors for failure. Each error may carry an optional `fieldTree`:

- **With `fieldTree`** (e.g. `{ kind: 'server-field-error', message, fieldTree: formData.email }`) — the error attaches to that specific field and the wrapper renders it exactly like any client-side error.
- **Without `fieldTree`** — per the compiled implementation (`setSubmissionErrors` in `_validation_errors-chunk.mjs`), Angular calls `addDefaultField(error, submittedField.fieldTree)`, defaulting the missing `fieldTree` to the field that was actually passed to `submit()`. Because this page uses `[formRoot]="profileForm"`, that's the **form root** — which is exactly how the general `formError` message becomes a form-level banner: `profileForm().errors()` (root-only errors) contains it, while `profileForm.email().errors()` (a different, per-field signal) contains the field error.

## Auto-clear on edit — verified behavior

Submission errors are **not** static: `FieldSubmitState.submissionErrors` (in `_validation_errors-chunk.mjs`) is a `linkedSignal` whose `source` is the **owning field's own value signal**:

```js
this.submissionErrors = linkedSignal({
  source: this.node.structure.value,
  computation: () => [],
});
```

This has a precise, non-obvious consequence this demo makes visible:

- The **email field error** clears the instant the **email field's own value** changes — editing Name does not clear it.
- The **form-level banner** (attached to the root, with no `fieldTree`) clears the instant **any** field's value changes, because the root's `structure.value` signal is the whole model — it changes whenever any descendant field changes. Editing Name after a failed submit clears the banner even though Name had nothing to do with the rejection.

Try step 5 in "Try This" below to see this asymmetry directly.

## Reset behavior

- **After a successful save**, the `action` calls `formData().reset(formData().value())` — this re-baselines the form at the just-saved value: `dirty()`/`touched()` clear immediately, but the fields keep showing exactly what the user typed.
- The **Reset** button calls `profileForm().reset()` with no argument — this only clears `dirty()`/`touched()`, it does not change field values.
- The **Reload from server** button calls `profileResource.reload()`, which re-runs the fake API's `loadProfile()`; the component's `effect()` then copies the new value into the model and calls `reset(value)` again, so a reload also lands pristine.

## Key files

- [server-integration.api.ts](server-integration.api.ts) — the fake, in-memory, no-HTTP "server."
- [server-integration.model.ts](server-integration.model.ts) — `ProfileFormModel`.
- [server-integration.validations.ts](server-integration.validations.ts) — client-side schema.
- [server-integration.form.ts](server-integration.form.ts) — `resource()` prefill, declarative submission, `TreeValidationResult` mapping.
- [server-integration.page.ts](server-integration.page.ts) — page wrapper and debugger.

## How to test

1. Run the demo and navigate to `/advanced-scenarios/server-integration`.
2. Watch the loading indicator, then confirm the form prefills with **Grace Hopper** / `grace@example.com`.
3. Clear **Name** — confirm **Save profile** disables (`form().invalid()`).
4. Restore the name, set **Email** to `taken@example.com`, and submit — confirm the button reads _Saving…_, then both a red form-level banner and a field error under Email appear.
5. Edit **Email** only — confirm its field error clears immediately, before resubmitting.
6. Repeat the failed submission, then edit **Name** instead of Email — confirm the form-level banner clears even though Email was untouched.
7. Set a valid, non-taken email and submit — confirm the success banner appears and `dirty()` in the state panel reads `false`.
8. Click **Reload from server** — confirm the button reads _Reloading…_ and the form re-populates from the fake API's in-memory record.

## Related

- [Submission Patterns](../submission-patterns/README.md) — declarative submission and the GOV.UK-style error summary; contrast its checkbox-triggered server error with this demo's real `TreeValidationResult` mapping.
- [Field State Patterns](../field-state-patterns/README.md) — the `reset()` semantics used here also drive its Reset button.
- [Async Validation](../async-validation/README.md) — the one demo in this section that _does_ route through MSW/real HTTP, for contrast with this demo's in-memory fake API.
