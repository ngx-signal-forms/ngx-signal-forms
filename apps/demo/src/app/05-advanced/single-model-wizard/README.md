# Single-Model Wizard

## Intent

A three-step wizard (Account → Shipping → Review) built on **one shared `form()` model**,
answering [docs/FAQ.md's condensed answer](../../../../../docs/FAQ.md#for-a-multi-step-wizard-how-do-i-validate-only-the-current-step-before-next-with-one-form-model)
in full: how to gate "Next" on only the active step's subtree, run cross-step validation
against a single model, and submit the whole thing once at the end. It reuses the shared
`ngx-wizard` component **unmodified** — no fork, no new inputs.

This demo is a sibling of [`advanced-wizard`](../advanced-wizard/README.md), not a
replacement for it. Read both READMEs together; the contrast is the point.

## Toolkit features showcased

- One `form()` spanning every step; each step's template binds only its own slice
  (`wizardForm.account…`, `wizardForm.shipping…`).
- The shared `ngx-wizard`'s async-aware `canNavigate` input as the subtree-validation gate
  (progress-header navigation, and — via a shared helper — the custom Next button; see the
  "Shared component finding" section below) — see
  [`components/wizard.ts`](../../shared/wizard/wizard.ts) and its
  [README](../../shared/wizard/README.md).
- Cross-step `validate(path, ctx => …)`: step 2's `expressShipping` reads step 1's `email`
  via `ctx.valueOf(path.account.email)` — no store, no event, no manual sync.
- Whole-form `submit()` (returns `Promise<boolean>`) on the final step, which re-validates
  every field, not just the one on screen.
- `focusFirstInvalid()` on both the per-step gate and the final submit failure path.

## Form model

```ts
interface SingleModelWizardValue {
  account: { fullName: string; email: string };
  shipping: {
    street: string;
    city: string;
    postalCode: string;
    expressShipping: boolean;
  };
}
```

One `form(model, singleModelWizardSchema)` call. There is no per-step model, no
`linkedSignal` bridge, and nothing to "commit" between steps — every step reads and writes
the same signal directly.

## Validation rules

### Errors

- Account — full name required; email required and must look like an email address.
- Shipping — street, city, postal code required.
- Cross-step — `expressShipping` (step 2) requires a non-free email domain on `account.email`
  (step 1). Unchecking the box, or leaving it unchecked, needs no email at all.

### Warnings

- None.

## How `canNavigate` gates a single-model wizard

Bound as `[canNavigate]="guardStep"` on `<ngx-wizard>`. Per
[`docs/FAQ.md`](../../../../../docs/FAQ.md#for-a-multi-step-wizard-how-do-i-validate-only-the-current-step-before-next-with-one-form-model),
the guard validates the subtree of the step being **left**, not the one being entered:

```ts
protected readonly guardStep: WizardCanNavigate = (event) => {
  if (event.toIndex <= event.fromIndex) return true; // always allow going back
  return this.#validateStep(event.fromStep); // 'account' → wizardForm.account
};

#validateStep(stepId: string): boolean {
  const stepField = this.#stepField(stepId);
  if (!stepField) return true;

  stepField().markAsTouched(); // cascades to every descendant field
  if (stepField().invalid()) {
    focusFirstInvalid(stepField);
    return false;
  }
  return true;
}
```

`markAsTouched()` cascading to descendants (Angular 22 Signal Forms) is what makes this
work with one call: the whole step's errors surface at once, exactly like a normal
single-screen form submit — just scoped to a subtree instead of the whole model.

`#validateStep` is called from two places: `guardStep` (bound to `canNavigate`, gating
progress-header clicks) and the custom Next button's `nextStep()` method (see the finding
below for why Next can't drive through `canNavigate` directly). Both paths enforce the
identical rule, so there's exactly one place that decides what "this step is valid enough
to leave" means.

The final step's Confirm button calls `submit(wizardForm, action)` directly — it isn't
gated by `canNavigate` at all, because `submit()` performs its own whole-form validation
and touches everything itself.

## Shared component finding

**The wizard's built-in Next button cannot be used to drive `canNavigate`-gated
progression to a step that hasn't been visited yet — including the very first "Next"
click of the whole wizard.**

`WizardComponent.next()` calls `goToStep()`, which checks `canNavigateToStep()` **before**
ever touching the `canNavigate` guard:

```ts
async goToStep(stepId: string): Promise<void> {
  if (!this.canNavigateToStep(stepId)) {
    return; // canNavigate is never even invoked
  }
  // ...only here does `canNavigate` get awaited
}
```

`canNavigateToStep()` allows navigation to a step only if it's the current step, already
**visited**, or already marked **completed**. On a fresh wizard, step 2 is none of those —
so clicking the built-in "Next" button on step 1 is a no-op, silently, regardless of
whether step 1 is valid. This isn't specific to a single-model form; it would affect any
consumer trying to use the built-in Next button purely as a `canNavigate`-gated "validate
then advance" control. `advanced-wizard` never hits this because it doesn't call
`next()`/`goToStep()` for its own Next/Previous flow at all — it drives `currentStep`
through its NgRx store directly (`[showNavigation]="false"` plus custom buttons calling
`store.goToNextStep()`), which happens to sidestep the check without anyone having
diagnosed it as one.

**Resolution, without touching the shared component:** this demo also uses
`[showNavigation]="false"` with custom buttons — the "Custom Navigation" pattern the
wizard's own README already documents — but goes one step further than `advanced-wizard`:
`nextStep()` calls the exact same `#validateStep()` helper the `canNavigate` guard uses,
then writes `currentStep` directly (bypassing `goToStep()`/`canNavigateToStep()`
entirely). The `canNavigate` guard stays bound and does real work for the progress
header's own step-click navigation. Zero changes were made to
[`shared/wizard/wizard.ts`](../../shared/wizard/wizard.ts).

One consequence worth naming: because the custom Next/Previous buttons never call
`goToStep()`, the wizard's own `#visitedSteps` set is never populated by this demo — so a
header button is only ever enabled for the _current_ step or a step whose subtree is
_presently_ valid (`completedSteps()`), never for "a step you visited a while ago,
whatever state it's in now". That turns out to matter for the next section.

If the shared component is ever revisited, the fix is narrow: `canNavigateToStep()`
should not gate `next()`'s call into `goToStep()` — only header-click navigation needs
the visited/completed check. That's a decision for the shared component's own owners, not
something this demo should decide unilaterally.

## Confirm is unreachable with an invalid earlier step

A natural question: can you reach Review with Account or Shipping quietly broken (e.g.
edited back into an invalid state after already passing it once), and have `submit()`
fail at Confirm? Tested and confirmed **no** — this is not just untested, it's
unreachable through the UI, by construction:

- Every forward transition — the custom Next button (`nextStep()`) and the progress
  header's own clicks (`goToStep()` → `canNavigate`) — re-validates the subtree of the
  step **currently being left**, per `#validateStep()`. An invalid step can never be left
  forward, by either path.
- The Confirm button only renders once `isLastStep()` (Review). Reaching Review requires
  leaving Shipping forward at least once _after_ it was last made invalid — which
  `#validateStep()` blocks.
- Cross-step validators (the express-shipping rule) live on the field whose value depends
  on the other step (`shipping.expressShipping`), so editing `account.email` after the
  fact reactively invalidates that field immediately — which also drops `'shipping'` out
  of `completedSteps()` right away, disabling its own header button before you could even
  attempt the workaround.

Pinned by the "per-subtree gating makes reaching Confirm … unreachable" e2e test: it
deliberately tries to construct the broken path (complete the wizard once, go back,
invalidate Shipping, attempt to return to Review both via Next and via the progress
header) and asserts every attempt is blocked.

This does **not** mean `submit()`'s own whole-form validation in `confirmOrder()` is dead
code — it's a safety net for exactly this state, kept as defense in depth in case the
gating above is ever loosened. See that method's doc comment for the known UX nit if it
ever does trigger: `focusFirstInvalid()` can't focus fields on Account/Shipping from
Review, since those steps' `ng-template`s aren't rendered there — the `review-error`
alert would be the only feedback. A "jump to the first invalid step" helper is a possible
future improvement, not built here since the state it would help with isn't reachable
today.

## Strong suites (favor one model)

- **Cross-step validation that reads another step's value while validating this step's
  field** — one `validate()` call, no plumbing.
- **Live cross-step values** — the running total in the status row and the Review step's
  summary read the exact same signal every other step writes to; nothing is copied or
  synced.
- **A single submit at the end** — `submit()` runs once, against the whole model, and
  there's exactly one source of truth to validate.

## Weak suites (reach for `advanced-wizard`'s form-per-step instead)

- **Steps that must be submittable and persisted independently of each other.** A single
  model has no natural "save step 1 now, without step 2 existing yet" boundary.
- **A draft that should survive navigating away and back.** `advanced-wizard`'s
  `linkedSignal` + store draft/commit pattern gives every step its own recoverable state;
  a single in-memory model here resets like any other unsaved form.
- **Independently-typed or independently-versioned step schemas**, e.g. steps built by
  different teams or loaded from different sources — a shared model couples them at the
  type level.

## Keyboard and screen-reader behavior on step change

The shared `ngx-wizard` component does **not** manage focus itself — that's deliberately
left to the consumer (see its README's "Validation with canNavigate" section). This demo
follows the same recipe `advanced-wizard`'s `wizard-container.ts` uses — a `#pendingFocus`
signal plus a named `afterRenderEffect()` that focuses a `tabindex="-1"` step heading once
it renders — with one difference:

- `advanced-wizard` sets `#pendingFocus` only inside its own custom `nextStep()` /
  `previousStep()` methods, so navigating via the progress header's step buttons (which
  call the wizard's `goToStep()` directly) does **not** move focus.
- This demo instead watches the two-way-bound `currentStep` signal itself with a small
  `effect()`, so focus moves to the new step's heading no matter which UI path triggered
  the navigation — Next/Previous buttons, submit, or a progress-header step click alike.

Each step heading is prefixed with its position ("Step 2 of 3: Shipping details"), so
moving focus there both places the cursor sensibly **and** is the de facto step-change
announcement for screen readers — there is no separate `aria-live` announcement, because
focus movement onto content that states the new step number and name already conveys it.
This is a consumer-side pattern, not a change to the shared component; verified with an
axe-core scan (no new violations) and manual keyboard walkthrough (Tab order stays inside
the active step, heading receives focus on every transition).

## Key files

- [single-model-wizard.model.ts](single-model-wizard.model.ts) — the one model, its initial
  value, and step ids.
- [single-model-wizard.validations.ts](single-model-wizard.validations.ts) — the single
  schema, including the cross-step express-shipping rule.
- [single-model-wizard.form.ts](single-model-wizard.form.ts) — the wizard: `form()`
  creation, the `canNavigate` guard, focus management, and `submit()`.
- [single-model-wizard.form.html](single-model-wizard.form.html) — step templates, each
  binding only its own slice of `wizardForm`.

## How to test

1. Run the demo and navigate to `/advanced-scenarios/single-model-wizard`.
2. Click **Next** on the empty Account step — confirm navigation is blocked, errors
   appear, and focus lands on the first invalid field.
3. Enter a personal email (e.g. `you@gmail.com`), advance to Shipping, and check
   **Express shipping** — confirm the cross-step error naming step 1 appears.
4. Go back to Account, change the email to a non-free domain, return to Shipping — confirm
   the express-shipping error clears without touching that field again.
5. Toggle Express shipping on/off and confirm the running total in the status row updates
   immediately.
6. Reach Review and confirm the summary matches steps 1–2 exactly, and the progress bar
   above the steps reaches 100% (Review has no fields of its own, so it's treated as
   completed once reached — otherwise the bar would max out at 2/3).
7. Click **Confirm order** — confirm the success message appears and focus/announcement
   behavior holds.

## Related

- [Advanced Wizard](../advanced-wizard/README.md) — the form-per-step + store
  architecture; read together with this page for the full contrast.
- [Shared wizard component](../../shared/wizard/README.md) — the `canNavigate` guard this
  demo relies on.
- [Cross-Field Validation](../cross-field-validation/README.md) — the single-screen
  primer for `validate(path, ctx => …)`, without the wizard step-gating layer on top.
