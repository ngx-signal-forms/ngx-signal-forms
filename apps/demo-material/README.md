# `apps/demo-material` — Reference wrapper for Angular Material 22+

A runnable end-to-end example showing how to integrate
[`@ngx-signal-forms/toolkit`](../../packages/toolkit/README.md) on top of
**Angular Material 22+**. Pinned via the workspace's `angular-material`
pnpm catalog — see `pnpm-workspace.yaml` for the exact versions in use.

## Why use this on Material?

Material already ships an `ErrorStateMatcher` and `MatFormField` aggregates
`<mat-error>` and `<mat-hint>` IDs into the projected control's
`aria-describedby` automatically. **Material-only apps with simple forms
should keep using plain Material + Signal Forms** — the toolkit's marquee
auto-ARIA layer is intentionally disabled on Material (Material owns
`aria-describedby`), so without other toolkit features the wrapper is net
boilerplate.

This reference wrapper earns its keep when **a single app has Material
forms next to non-Material forms** and needs a unified seam:

| Toolkit feature                                                                            | Plain Material + Signal Forms | This wrapper                        |
| ------------------------------------------------------------------------------------------ | ----------------------------- | ----------------------------------- |
| Unified `errorStrategy` (`on-touch` / `on-submit` / `immediate`) across non-Material forms | ✗                             | ✅                                  |
| First-class warnings (`warn:*`, non-blocking)                                              | ✗                             | ✅ rendered inside `<mat-hint>`     |
| Centralised label / error-message DI (`provideFieldLabels`, `provideErrorMessages`)        | ✗                             | ✅                                  |
| `submittedStatus` state machine (post-submit UI, "submitting…" guards)                     | ✗                             | ✅                                  |
| `<mat-error>` aggregation + Material `aria-describedby`                                    | ✅                            | ✅ (Material remains single writer) |
| Async validators, debugger panel                                                           | partial                       | ✅ via the rest of the toolkit      |

If none of the rows on the right line up with your app, **prefer plain
Material**. The wrapper does not change Material's a11y story; it adds
strategy/warnings/centralised-DI on top.

## What's wired

A single contact form (`src/app/contact-form/`) bound to Angular Signal
Forms via `[formField]`, using a custom Material wrapper
(`src/app/wrapper/`) that satisfies the four contracts in
[`docs/CUSTOM_WRAPPERS.md`](../../docs/CUSTOM_WRAPPERS.md).

```text
src/app/
  contact-form/                       form + validations + smoke spec
  wrapper/
    mat-form-field-wrapper.ts         directive applied on <mat-form-field>
    control-directives.ts             ngxMat*Control per-control directives
    slot-directives.ts                *ngxMatErrorSlot / *ngxMatHintSlot
    feedback-directive.ts             *ngxMatFeedback for non-form-field controls
    material-error-renderer.ts        renderer with { message, severity } contract
    warning-aware-error-state-matcher.ts  ErrorStateMatcher that ignores warn:* kinds
    index.ts                          provideNgxMatForms + bundle exports
```

Per [ADR-0002](../../docs/decisions/0002-ngx-mat-forms-package-shape.md)
the surface mirrors the future `@ngx-signal-forms/material` package — a
graduation will be a single import-path swap.

### Per-control directives (no string parameter)

```html
<input matInput [formField]="form.email" ngxMatTextControl />
<mat-select [formField]="form.topic" ngxMatSelectControl>…</mat-select>
<mat-checkbox [formField]="form.agree" ngxMatCheckboxControl>…</mat-checkbox>
<mat-slide-toggle [formField]="form.live" ngxMatSlideToggleControl
  >…</mat-slide-toggle
>
```

Each per-control directive composes the toolkit's semantics layer with
`ariaMode="manual"` baked in (Material owns `aria-describedby`). The
directive name **is** the kind — no `ngxSignalFormControl="text"` /
`ngxSignalFormControlAria="manual"` boilerplate.

The wrapper queries `contentChildren(NgxMatBoundControl)` to find the
projected control: pure-signal, lexical, zero `afterEveryRender` /
`querySelector` DOM probing.

### Structural slot directives

```html
<mat-form-field [ngxMatFormField]="form.name" fieldName="contact-name">
  <mat-label>Name</mat-label>
  <input matInput [formField]="form.name" ngxMatTextControl />
  <mat-hint *ngxMatHintSlot="form.name; let warning">
    @if (warning) {
    <ng-container
      *ngComponentOutlet="
          renderer;
          inputs: { message: warning, severity: 'warning' }
        "
    />
    } @else { What should we call you? }
  </mat-hint>
  <mat-error *ngxMatErrorSlot="form.name; let message">
    <ng-container
      *ngComponentOutlet="
        renderer;
        inputs: { message, severity: 'error' }
      "
    />
  </mat-error>
</mat-form-field>
```

`*ngxMatErrorSlot` stamps **one `<mat-error>` per blocking error message**
the toolkit resolves — Material then aggregates each rendered ID into the
projected control's `aria-describedby` automatically.

`*ngxMatHintSlot` always stamps **exactly one `<mat-hint>`**; consumers
branch on the `let warning` implicit to swap between the neutral helper
text and the warning message without rendering two competing hints.

### `*ngxMatFeedback` for controls outside `<mat-form-field>`

`<mat-checkbox>`, `<mat-slide-toggle>`, `<mat-radio-group>`,
`<mat-button-toggle-group>`, `<mat-chip-grid>`, and `<mat-datepicker>` do
not implement `MatFormFieldControl`. Use `*ngxMatFeedback` adjacent to
those controls:

```html
<mat-checkbox [formField]="form.agree" ngxMatCheckboxControl>
  I agree to be contacted
</mat-checkbox>

<ng-container
  *ngxMatFeedback="
    form.agree;
    fieldName: 'contact-agree';
    let messages;
    severity as severity;
    id as id
  "
>
  <p [attr.role]="severity === 'error' ? 'alert' : 'status'" [id]="id">
    @for (message of messages; track message) {
    <ng-container
      *ngComponentOutlet="
          renderer;
          inputs: { message, severity }
        "
    />
    }
  </p>
</ng-container>
```

The directive stamps **at most one block per kind** (one error block, one
warning block) so each block owns a single stable ID
(`{fieldName}-error` / `{fieldName}-warning`) consumers can wire into
`aria-describedby` manually if Material's auto-aggregation is not
available.

Internally, `*ngxMatFeedback` resolves messages through the public
`createErrorMessageSignal` primitive, so any registry configured via
`NGX_ERROR_MESSAGES` (e.g. through `provideErrorMessages`) flows through
the same 3-tier cascade (validator message → registry → default) used by
the in-tree `NgxFormFieldError`.

### Renderer registration

```ts
// main.ts
bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    provideNgxSignalFormsConfig({ defaultErrorStrategy: 'on-touch' }),
    provideNgxMatForms(), // MaterialFeedbackRenderer/MaterialHintRenderer + NgxMatWarningAwareErrorStateMatcher
  ],
});
```

The renderer contract is the lean `{ message, severity }` shape
(ADR-0002 §7) — the slot directives resolve `formField` → message text
and the renderer is purely presentational. `provideNgxMatForms()` also
registers `NgxMatWarningAwareErrorStateMatcher` in place of Material's
default `ErrorStateMatcher` (see "Warnings and Material's
`ErrorStateMatcher`" below) — every app wiring the wrapper should call
it, not just apps that need renderer overrides. Override the renderers
per app or per component:

```ts
provideNgxMatForms({
  feedbackRenderer: { component: MyIconPrefixedRenderer },
});

// Component-scoped:
providers: [
  provideNgxMatFormsForComponent({
    feedbackRenderer: { component: FlashyRenderer },
  }),
];
```

## Material-specific gotchas

### `aria-describedby` ownership

Material's `MatFormFieldControl` owns the projected control's
`aria-describedby`. Every render Material aggregates the IDs of its
projected `<mat-error>` and `<mat-hint>` elements and writes them onto
the bound control. Letting `NgxSignalFormAutoAria` participate would
double-write the attribute.

**Resolution:** the per-control directives
(`ngxMatTextControl`/`ngxMatSelectControl`/`ngxMatCheckboxControl`/`ngxMatSlideToggleControl`)
provide `NGX_SIGNAL_FORM_ARIA_MODE` as the frozen `'manual'` signal at
construction. Auto-aria leaves `aria-invalid` / `aria-required` /
`aria-describedby` alone — Material is the single writer. No
per-control consumer ceremony.

If you need to compose a non-Material assistive ID (a tooltip
description, a custom hint outside Material's slots, etc.) bind the
wrapper's `toolkitAriaDescribedBy` signal to
`<mat-form-field [userAriaDescribedBy]>`. The factory uses the
`preservedIds` reader to read the bound control's _current_
`aria-describedby`, preserve every ID Material wrote, and append only
the IDs the toolkit owns. This is the documented escape hatch for
Material's ARIA ownership.

### Warnings under `submission.action`

Angular Signal Forms' native `submit()` only runs `submission.action`
when the field tree is not `invalid()` — and `invalid()` is `true` for
**any** validation result on the tree, including the toolkit's
non-blocking `warn:*` results. Left unpatched, a warning (e.g.
`warn:short-name` on the contact form's `name` field) would silently
prevent submission and route straight to `onInvalid`, contradicting the
"gentle warning, not a blocker" contract warnings are supposed to have.

The contact form's declarative `{ submission }` therefore sets
`ignoreValidators: 'all'` and gates the actual submit logic on
`hasOnlyWarnings(contactForm().errorSummary())` inside `action` itself
(falling through to the toolkit's `onInvalid` handler when a real
blocking error remains):

```ts
readonly contactForm = form(this.model, contactFormSchema, {
  submission: {
    ignoreValidators: 'all',
    action: async () => {
      if (!hasOnlyWarnings(this.contactForm().errorSummary())) {
        this.#onInvalid(this.contactForm);
        return;
      }
      await submitToApi(this.contactForm().value());
    },
  },
});
```

This mirrors `apps/demo-primeng`'s profile form and is the pattern
[`apps/demo`'s advanced section](../demo/src/app/05-advanced/README.md)
documents as preferred for warning-tolerant submission when you're
using declarative `{ submission }` rather than calling `submit()` /
`submitWithWarnings()` by hand — see the
[toolkit README](../../packages/toolkit/README.md)'s submission
helpers table for `hasOnlyWarnings()` / `submitWithWarnings()`.

### Warnings and Material's `ErrorStateMatcher`

Material's `matInput` / `mat-select` compute `errorState` (and
`aria-invalid`) from the injected `ErrorStateMatcher`. Signal Forms'
`InteropNgControl` (the `NgControl` bridge Angular's `FormField`
directive provides) reports `invalid` as `true` for **any**
`ValidationError` on the field, warnings included — so Material's
default matcher (`invalid && (touched || form.submitted)`) would give a
warning-only field `aria-invalid="true"` and the full
`mat-form-field-invalid` red-outline treatment, contradicting the
`<mat-hint>` copy sitting right next to it that calls the same state a
"gentle warning."

`provideNgxMatForms()` (and `provideNgxMatFormsForComponent()`)
therefore also registers `NgxMatWarningAwareErrorStateMatcher`
(`src/app/wrapper/warning-aware-error-state-matcher.ts`) in place of
Material's default. It reads the `warn:*` / non-`warn:*` split off
`control.errors`' keys via the toolkit's canonical `isBlockingError()`
predicate, and only falls through to the normal touched/submitted
timing check when at least one **blocking** error is present — a
warning-only field always reports `errorState: false`.

### `<mat-checkbox>` aria wiring

`<mat-checkbox>` **does** expose a public `aria-describedby` input
(`ariaDescribedby`, forwarded straight to the native `<input>`) even
though it doesn't implement `MatFormFieldControl` — so the checkbox
control-directives section above still applies, and `*ngxMatFeedback`
exposes exactly what's needed to wire it by hand: a
`describedByIds()` signal (via `exportAs: 'ngxMatFeedback'`) that
resolves to the currently-rendered block's id, or `null` when neither
an error nor a warning is showing (no dangling IDREFs). The contact
form grabs the directive with a `viewChild(NgxMatFeedback)` query and
binds it on the checkbox:

```html
<div class="demo-form__row demo-form__row--agree">
  <!-- *ngxMatFeedback is declared BEFORE <mat-checkbox> — Angular
       evaluates a template's property bindings in source order, so the
       checkbox's binding below cannot forward-reference an input this
       directive hasn't been assigned yet. CSS `order` restores the
       checkbox-first visual layout. -->
  <ng-container
    *ngxMatFeedback="
      form.agree;
      fieldName: 'contact-agree';
      let messages;
      severity as severity;
      id as id
    "
  >
    <p [id]="id" [attr.role]="severity === 'error' ? 'alert' : 'status'">…</p>
  </ng-container>

  <mat-checkbox
    [formField]="form.agree"
    ngxMatCheckboxControl
    [aria-describedby]="agreeFeedback()?.describedByIds() ?? null"
  >
    I agree to be contacted
  </mat-checkbox>
</div>
```

```ts
protected readonly agreeFeedback = viewChild(NgxMatFeedback);
```

The `role="alert"` / `role="status"` live region inside `*ngxMatFeedback`
still announces changes transiently; the `aria-describedby` wiring adds
the missing piece — a screen reader that focuses the checkbox **after**
the error already rendered now hears the description too, not just
whatever happened to be announced live.

### `floatLabel="always"`

Material's `floatLabel` (`'auto' | 'always'`) interacts with Material's
internal `empty` / `focused` state and is not wired through the
toolkit. The contact form sets `floatLabel: 'always'` (along with
`appearance: 'outline'` and `subscriptSizing: 'dynamic'`) once, app-wide,
via `MAT_FORM_FIELD_DEFAULT_OPTIONS` in `main.ts` — purely a visual
preference for this demo, not a toolkit requirement — so every
`<mat-form-field>` inherits it instead of repeating the same three
attributes on each field. Labels stay put instead of floating back down
into the input on blur-with-empty-value. Override
`MAT_FORM_FIELD_DEFAULT_OPTIONS` (or set the input directly on a field
for a one-off exception) for Material's default float-on-focus behavior.

## Extending the error slot

For consumers who need to compose extras inside `<mat-error>` (icons,
custom typography, multi-line layouts), the verbose `*ngComponentOutlet`
form remains a documented escape hatch. Use the wrapper's `errorVisible`
/ `warningVisible` computeds in place of the slot directives:

```html
<mat-form-field
  [ngxMatFormField]="form.email"
  fieldName="contact-email"
  #wrap="ngxMatFormField"
>
  … @if (wrap.errorVisible()) {
  <mat-error>
    <mat-icon>error</mat-icon>
    <ng-container
      *ngComponentOutlet="renderer; inputs: customInputs(form.email, 'error')"
    />
  </mat-error>
  }
</mat-form-field>
```

This bypasses the slot directive entirely and gives the consumer full
control over the rendered tree, at the cost of explicit visibility
management.

## ARIA verification

Two automated layers verify the wrapper's ARIA wiring stays correct:

### Smoke spec (jsdom)

`src/app/contact-form/contact-form.spec.ts` runs under
`pnpm nx run demo-material:test`:

1. After typing into the name field and tabbing away, `<mat-error>`
   renders the toolkit-driven validation message and has a non-empty
   `id`.
2. After typing garbage into the email field and tabbing away,
   `aria-invalid="true"` is on the input, `aria-describedby` resolves
   to existing DOM IDs, and at least one of those IDs belongs to a
   `<mat-error>` element.
3. The `warn:short-name` warning renders inside `<mat-hint>` (not
   `<mat-error>`), no `<mat-error>` is visible on that field, **and**
   `aria-invalid` is `"false"` / `mat-form-field-invalid` is absent —
   pinning `NgxMatWarningAwareErrorStateMatcher`.
4. Leaving the consent checkbox unchecked and blurring renders the
   `agree-required` error via `*ngxMatFeedback`, and the checkbox's
   `aria-describedby` resolves to that block's id (dropping back to
   `null` once checked) — pinning the checkbox aria wiring.
5. Filling out the whole form with a short-but-valid name (`'Bob'`,
   trips `warn:short-name`) and submitting reaches the success banner —
   pinning that a non-blocking warning never blocks `submission.action`.

`src/app/wrapper/warning-aware-error-state-matcher.spec.ts` unit-tests
`NgxMatWarningAwareErrorStateMatcher.isErrorState()` directly (null
control, no errors, warning-only, blocking-but-untouched,
blocking-and-touched, blocking-via-form-submitted, warning+blocking
mixed).

A wrapper-level spec
(`src/app/wrapper/mat-form-field-wrapper.spec.ts`) additionally asserts
the `toolkitAriaDescribedBy` composition (preserved IDs + projected
`<ngx-form-field-hint>` IDs, with toolkit-owned error IDs suppressed in
the Material setup) and the dev-mode console error fired when a
projected `[formField]` element is missing one of the
`ngxMat*Control` directives.

### Playwright spec

`../demo-material-e2e/src/contact-form.spec.ts` runs the same fill →
blur → observe-error path in a real browser via
`pnpm nx run demo-material-e2e:e2e`. Catches any timing or layout
issue jsdom doesn't surface.

## Running

```bash
pnpm nx serve demo-material           # dev server on http://127.0.0.1:4601
pnpm nx run demo-material:build       # production build (emits dist/apps/demo-material)
pnpm nx run demo-material:test        # smoke spec (jsdom + Vitest)
pnpm nx run demo-material-e2e:e2e     # Playwright spec
```

The smoke spec depends on a built toolkit (`pnpm nx run toolkit:build`),
which Nx schedules automatically via the `test` target's `dependsOn` in
`project.json`.

## Pinned versions

Versions are pinned via the workspace's pnpm catalogs (`pnpm-workspace.yaml`),
not hard-coded here, so they stay in sync automatically. At the time of
writing:

| Package               | Version  |
| --------------------- | -------- |
| `@angular/material`   | `22.0.3` |
| `@angular/cdk`        | `22.0.3` |
| `@angular/animations` | `22.0.5` |
