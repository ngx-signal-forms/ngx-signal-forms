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
- A computed patch gate: a field is included only when it is both `dirty()`
  **and** `valid()`.
- `httpResource` (`@angular/common/http`, `@publicApi 22.0`) — the request
  function returns `undefined` whenever nothing dirty+valid is waiting,
  pausing the resource. No separate "should I save?" flag.
- `reset(value)` on a successful save — the same call
  [Server Integration](../server-integration/README.md) makes after a
  successful submit — re-baselines `dirty()`/`touched()` without touching
  what the user typed.
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
  service, `httpResource`'s loading/error states here come from an actual
  (mocked) HTTP round trip.

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
  if (displayName.dirty() && displayName.valid()) patch.displayName = displayName.value();
  if (bio.dirty() && bio.valid()) patch.bio = bio.value();
  return Object.keys(patch).length > 0 ? patch : undefined;
});
```

Both conditions matter independently:

- `dirty()` alone would resend an already-saved value on any unrelated
  re-render.
- `valid()` alone would happily PATCH a value the user hasn't finished
  typing (e.g. a required field mid-edit, before `debounce` even lets the
  invalid intermediate value settle — though in practice `debounce` means
  validators only ever see the settled value).

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
  calls `saveResource.reload()`, which re-issues the same patch.
- **Reset demo:** `profileForm().reset(createInitialAutosaveProfile())` — one
  call sets the model back to its initial value _and_ clears
  `dirty()`/`touched()`.

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

- **Conflict resolution / optimistic concurrency.** A successful save calls
  `reset(this.profileForm().value())` — the form's _current_ value at
  resolve time, not a snapshot of exactly what was sent. If the user edits a
  different field while a PATCH is in flight, that edit gets marked clean
  too once the in-flight request resolves, even though the server hasn't
  seen it yet (it will be picked up by the next debounce/valid cycle,
  because `httpResource` re-issues on any change to the computed patch).
  Last-write-wins is fine for this demo; a production autosave with real
  conflict risk needs more than this.
- **Offline queueing / `localStorage` persistence.** Not implemented.

## Key files

- [autosave.model.ts](autosave.model.ts) — `AutosaveProfileModel`.
- [autosave.validations.ts](autosave.validations.ts) — `debounce()` +
  validators.
- [autosave.api.ts](autosave.api.ts) — endpoint + failure-marker constants.
- [autosave.form.ts](autosave.form.ts) — the dirty+valid gate, `httpResource`,
  save-status live regions.
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

## Related

- [Server Integration](../server-integration/README.md) — explicit submit +
  server-error mapping; contrast with this demo's no-submit-button autosave.
- [Advanced Wizard](../advanced-wizard/README.md) — draft/commit buffer with
  an explicit commit step, plus the pre-existing RxJS-based auto-save this
  demo's native `debounce()` supersedes for simple field-level cases.
- [Store Binding](../store-binding/README.md) — live two-way form ↔
  `@ngrx/signals` store, the third existing form↔backend pattern this demo
  completes the set against.
