# Autosave

## Intent

`05-advanced/` had three form↔backend patterns and no runnable example of the
one developers ask for most: persist valid, dirty changes as the user types,
with no submit button. This demo fills that gap — debounced field-level save
via the native `debounce()` schema rule, a "save only dirty+valid" gate, and
an accessible save-status announcement.

Prompted by [Auto-Saving Signal Forms](https://tech.trellis.org/blog/2026-07-08-Auto-Saving-Signal-Forms)
(Trellis) — this demo takes the use case, not that post's mechanism. See
"What this demo deliberately does not do" below.

## Toolkit features showcased

- `debounce(path, 500)` (`@angular/forms/signals`, `@publicApi 22.0`) — delays
  writing a UI edit into a field's own value signal until 500ms after the
  user stops typing it. Applied per field (`displayName`, `bio`), so each
  debounces independently.
- A computed patch gate includes a field only when it is dirty, valid,
  and its control buffer equals its model value.
- `HttpClient.patch()` from an `effect` — the save is a write, so it is not a
  resource. Saves run one at a time and are never aborted (see "Why not
  `httpResource`" below).
- Per-field, no-argument `reset()` on a successful save — clears
  `dirty()`/`touched()` for exactly the fields the resolved request covered,
  leaving any field edited again mid-flight dirty so it autosaves for real
  on the next debounce cycle (see "Lost-update guard" below).
- `NgxFormField` wrapper for the two fields; no other toolkit-specific
  save-status API — the status region is hand-rolled (see below).

## Form model

- Signal model: `signal<AutosaveProfileModel>({ displayName, bio })`
  (`autosave.model.ts`).
- Schema: `schema<AutosaveProfileModel>` with `debounce()` + validators per
  field (`autosave.validations.ts`). No `form(..., { submission })` — there
  is nothing to submit.
- Backend: a real MSW handler, `PATCH /api/autosave/profile`
  (`apps/demo/src/mocks/handlers.ts`) — unlike
  [Server Integration](../server-integration/README.md)'s in-memory fake
  service, the saving/error states here come from an actual (mocked) HTTP
  round trip.

## Validation rules

### Errors

- Display name — required; min length 2.
- Bio — max length 280.

### Warnings

- None.

## Save-only-dirty-and-valid gate

```ts
protected readonly dirtyValidPatch = computed(() => {
  const displayName = this.profileForm.displayName();
  const bio = this.profileForm.bio();
  const patch: Partial<AutosaveProfileModel> = {};
  if (
    displayName.dirty() &&
    displayName.valid() &&
    untracked(displayName.controlValue) === displayName.value()
  ) {
    patch.displayName = displayName.value();
  }
  if (
    bio.dirty() &&
    bio.valid() &&
    untracked(bio.controlValue) === bio.value()
  ) {
    patch.bio = bio.value();
  }
  return Object.keys(patch).length > 0 ? patch : undefined;
});
```

Three conditions matter independently:

- `dirty()` tracks interaction state, not inequality with an original value.
  It excludes fields marked pristine by `reset()`. Without it, `valid()`
  alone would keep re-including an already-saved value forever, since
  validity doesn't change just because a request resolved.
- `valid()` excludes a settled invalid value. Without it, `dirty()` alone
  would happily PATCH a value that currently fails validation.
- `controlValue() === value()` excludes a value that's still mid-debounce.
  This one is the counter-intuitive part, and got this demo wrong for a
  while (see [#366](https://github.com/ngx-signal-forms/ngx-signal-forms/issues/366)):
  `debounce()` only delays `value()`, the field's canonical, model-facing
  signal — writing to a control marks `dirty()` `true` **synchronously**,
  on the same keystroke. `ReadonlyFieldState.value`'s own doc comment says
  as much: "updates from the UI control are eventually reflected here,
  they may be delayed if debounced." Gating on `dirty()` and `valid()`
  alone reads `value()` while it is still the field's _previous_ settled
  value — not the edit the user just made — and PATCHes that: a save that
  fires before the user has even stopped typing, carrying stale content.
  `ReadonlyFieldState.controlValue` (`@publicApi 22.0`) is the literal,
  undebounced value of the bound control. Equality shows that the buffer and
  model match; it does not prove a timer elapsed. Blur can flush the value,
  and typing back to the current model value can also restore equality. Peeking it with
  `untracked` keeps every keystroke (which changes `controlValue()` on its
  own) from re-running this computed — it still only re-runs when
  `dirty()`, `valid()`, or `value()` change, exactly as the two-condition
  version did.

Each field is gated independently, so one invalid field never blocks the
other from autosaving.

### Why not `extractValue()`

`@angular/forms/signals/compat` exports `extractValue(field, { dirty: true })`,
which would collect the whole dirty subtree in one call instead of two
explicit per-field checks. It was considered and not used here, for two
reasons:

1. It lives in the **compat** entry point, whose stated purpose is Reactive
   Forms interop — importing it into a pure Signal Forms demo would be
   off-label, even though nothing about `extractValue` itself is
   compat-specific.
2. With only two fields, two explicit `if` checks are more legible than a
   loop plus a compat import, and they keep the same `keyof`-precision style
   as `server-integration.form.ts`'s `PROFILE_FIELD_KEYS`.

If a real form had a dozen+ autosaved fields, `extractValue` would very
likely be the better trade — this demo's teaching point is the gate, not
"never use extractValue."

## One save at a time

An `effect` watches `dirtyValidPatch()` and sends each new patch with
`HttpClient.patch()`. When a save is already in flight, the new patch is not
sent. The component sets a flag instead. When the current save settles, it
reads `dirtyValidPatch()` again and sends what is still unsaved, as one
follow-up request. Edits made during a save are never lost. They fold into
that follow-up request.

### Why not `httpResource`

An earlier version of this demo used `httpResource` with `method: 'PATCH'`.
That is wrong for a write, and Angular's own docs say so: `resource` is for
read operations. A resource aborts its in-flight request whenever its request
changes. For a read, that is correct. For a write, it is a bug:

- The server may already have applied the aborted PATCH. The client then
  treats it as "not sent".
- An aborted request can still reach the server _after_ the request that
  replaced it. The server then ends with the older value.
- A resource also drops back to `idle` when its request becomes `undefined`.
  Resetting the saved field did exactly that, so "All changes saved." never
  rendered.

## Lost-update guard

What is not automatically safe is an edit that lands _after_ a request is
already dispatched and _before_ it resolves. A naive "reset the whole form on
success" (`this.profileForm().reset(this.profileForm().value())`, this
demo's first draft) would mark that concurrently-edited field pristine too,
even though the server never saw the newer value — a **lost update**, not
"last write wins" (nothing was ever un-sent; the fact it changed after being
sent was just forgotten).

The fix, in `autosave.form.ts`:

1. `#save(patch)` keeps the exact patch it sent and passes it to
   `#reconcileAfterSave(patch)` when the request resolves. It does not
   re-read `dirtyValidPatch()`, which could already reflect a newer edit.
2. On a resolved save, `fieldsSafeToMarkSaved()` (`autosave.save-reconciliation.ts`,
   a pure function with its own spec) compares the sent patch against
   each field's **current** value. A field is safe to mark saved only if it
   was part of the request that resolved **and** its value hasn't moved on
   since.
3. Before resetting, `#reconcileAfterSave()` checks one more thing:
   `field.controlValue() !== field.value()`. `FieldState.reset()` (no
   argument) aborts that field's pending debounce sync internally, so
   calling it while an edit is still buffered behind an _unelapsed_
   debounce would discard those keystrokes instead of letting them sync
   normally — the same race `dirtyValidPatch()`'s settledness check
   guards against, on the other side of the request (see
   [#366](https://github.com/ngx-signal-forms/ngx-signal-forms/issues/366)).
   `fieldsSafeToMarkSaved()` only sees `value()`, so it can't detect this
   on its own.
4. Each field that passes both checks gets its own no-argument `reset()` —
   `this.profileForm[key]().reset()` — which clears that field's
   `dirty()`/`touched()` alone, without touching its value or any sibling
   field. A field that fails any check is left dirty, so the next debounce
   cycle autosaves it for real instead of silently dropping it.

This works because Signal Forms' `FieldState.reset()` takes an optional
value but doesn't require one: called on a single field with no argument, it
resets only that field's touched/dirty state, "per-field markAsPristine" —
there is no separately-named method for it, but the no-argument form of
`reset()` on a leaf field _is_ that mechanism.

## Accessible save status

Idle / saving / saved / failed is surfaced through **two fixed-role live
regions**, always present in the DOM:

- `role="status"` (polite) for "Saving…" and "All changes saved."
- `role="alert"` (assertive) for a failed save, paired with a **Retry save**
  button.

Only the content _inside_ each region is conditionally rendered via `@if`;
the container and its `role` never toggle. That is deliberate: toggling
`role` in the same tick content is inserted is the exact bug
`packages/toolkit/assistive/form-field-notification.ts` documents (NVDA +
Chrome miss the first announcement when role and content arrive together).
A save-status region has the same failure mode, so it gets the same fix.

Announcements are naturally coalesced without extra debounce logic: the
status only changes on a genuine state-machine transition
(`idle → saving → saved`), not on every keystroke, so there's nothing to
separately throttle.

**A companion issue, [#267](https://github.com/ngx-signal-forms/ngx-signal-forms/issues/267),
proposes a toolkit primitive for this exact save-status announcement shape.**
This demo does not block on it and hand-rolls the live regions instead — see
the `TODO(#267)` comment in `autosave.form.ts`. If the primitive lands, this
demo should adopt it.

## Retry and reset

- **Retry:** a failed save leaves its field(s) `dirty()`; **Retry save**
  sends the current `dirtyValidPatch()` again (picking up any edits made
  since the failure).
- **Reset demo:** `profileForm().reset(createInitialAutosaveProfile())` — one
  call sets the model back to its initial value _and_ clears
  `dirty()`/`touched()` for the whole form. The save status goes back to
  idle. This one is a deliberate
  whole-form reset (there is nothing to preserve — the demo is starting
  over), unlike the per-field reconciliation after a successful save.

## What this demo deliberately does not do

The source post builds a Proxy-based path builder with a dual `from`/`to`
schema and RxJS (`share`, `distinctUntilChanged`, `takeUntilDestroyed`). This
demo does not adopt that:

- its hardest part — debouncing — is now the native `debounce()` schema
  rule, so hand-rolling it would be outdated;
- the post's own published version is "simplified" and leaves nested arrays,
  reset-state tracking, and pristine-vs-debounce discrimination unsolved;
- a Proxy path-builder is a state/persistence framework, and this toolkit
  deliberately stays out of state management.

Contrast with [Advanced Wizard](../advanced-wizard/README.md): its
`wizard.store.ts` already has an auto-save-with-debounce feature (`rxMethod`
with RxJS `debounceTime(2000)` over the whole draft), predating the native
`debounce()` rule. This demo is the idiomatic Signal Forms alternative for
that same "save as you go" need, at the field level instead of the whole
form.

## Out of scope

- **Conflict resolution / optimistic concurrency.** The client-side
  lost-update guard above (only marking a field saved if it still matches
  what was sent) is not the same thing as server-side conflict detection —
  there's no ETag/version check, and two different clients autosaving the
  same record concurrently can still silently overwrite each other on the
  server. Last-write-wins at the server is fine for this demo; a production
  autosave with real multi-client conflict risk needs more than this
  (optimistic concurrency tokens, CRDTs, or similar).
- **Retries with backoff, and saving on page unload.** A failed save waits
  for the user to click **Retry save** or to edit again.
- **Offline queueing / `localStorage` persistence.** Not implemented.

## Key files

- [autosave.model.ts](autosave.model.ts) — `AutosaveProfileModel`.
- [autosave.validations.ts](autosave.validations.ts) — `debounce()` +
  validators.
- [autosave.api.ts](autosave.api.ts) — endpoint + failure-marker constants.
- [autosave.save-reconciliation.ts](autosave.save-reconciliation.ts) — the
  pure lost-update guard (`fieldsSafeToMarkSaved()`), with its own
  [spec](autosave.save-reconciliation.spec.ts).
- [autosave.form.ts](autosave.form.ts) — the dirty+valid+settled gate,
  the one-at-a-time save, the post-save reconciliation, save-status live regions,
  with its own [spec](autosave.form.spec.ts) covering the settled-value
  race from #366.
- [autosave.page.ts](autosave.page.ts) — page wrapper and debugger.
- `apps/demo/src/mocks/handlers.ts` — the `PATCH /api/autosave/profile` MSW
  handler.

## How to test

1. Run the demo and navigate to `/advanced-scenarios/autosave`.
2. Edit **Display name** and stop typing — after ~500ms the status region
   reads _Saving…_, then _All changes saved._ after the ~400ms mocked PATCH
   resolves. Confirm `dirty()` in the state panel returns to `false`.
3. Type `FAIL_SAVE` anywhere in **Bio** and stop typing — confirm the
   assertive region shows a failure message and a **Retry save** button, and
   that `dirty()` for `bio` stays `true`.
4. Click **Retry save** without changing anything — confirm it fails again
   (the marker is still present).
5. Remove `FAIL_SAVE` from **Bio** and stop typing — confirm it autosaves
   successfully this time.
6. Clear **Display name** entirely — confirm it shows a required error and
   the state panel's pending PATCH body omits `displayName` (invalid fields
   are never sent).
7. Click **Reset demo** — confirm both fields return to their initial values
   and `dirty()` is `false` for both.
8. **Lost-update guard**, covered automatically by
   `autosave.save-reconciliation.spec.ts` at the unit level; to see it live:
   edit **Display name** and, within the ~400ms the mocked PATCH is in
   flight (right after the 500ms debounce fires — watch for _Saving…_), also
   edit **Bio**. Confirm both eventually read _All changes saved._ and both
   `dirty()` flags return to `false` — no edit is ever lost, regardless of
   which request happens to be in flight when the other field's debounce
   fires.

## Related

- [Server Integration](../server-integration/README.md) — explicit submit +
  server-error mapping; contrast with this demo's no-submit-button autosave.
- [Advanced Wizard](../advanced-wizard/README.md) — draft/commit buffer with
  an explicit commit step, plus the pre-existing RxJS-based auto-save this
  demo's native `debounce()` supersedes for simple field-level cases.
- [Store Binding](../store-binding/README.md) — live two-way form ↔
  `@ngrx/signals` store, the third existing form↔backend pattern this demo
  completes the set against.
