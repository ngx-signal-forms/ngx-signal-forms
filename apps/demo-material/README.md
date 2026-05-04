# `apps/demo-material` — Reference wrapper for Angular Material 21+

A runnable end-to-end example showing how to integrate
[`@ngx-signal-forms/toolkit`](../../packages/toolkit/README.md) on top of
**Angular Material 21+**. Pinned to `@angular/material@~21.2.9` and
`@angular/cdk@~21.2.9`.

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

### Renderer registration

```ts
// main.ts
bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    provideAnimationsAsync('noop'),
    provideNgxSignalFormsConfig({ defaultErrorStrategy: 'on-touch' }),
    provideNgxMatForms(), // registers MaterialFeedbackRenderer for both error + hint slots
  ],
});
```

The renderer contract is the lean `{ message, severity }` shape
(ADR-0002 §7) — the slot directives resolve `formField` → message text
and the renderer is purely presentational. Override per app or per
component:

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

Angular Signal Forms' `submission.action` rejects fields with **any**
validation result, including non-blocking `warn:*` results. If a form
relies on warnings (e.g. `warn:short-name` on the contact form's `name`
field), submitting via `<form (submit)>` will be blocked by the warning
unless the consumer routes the submit through `submitWithWarnings()`
from `@ngx-signal-forms/toolkit`. The demo defaults to `on-touch` and
documents the choice — adopt `submitWithWarnings()` for any form that
needs warnings to remain non-blocking after a submit attempt.

### `<mat-checkbox>` aria wiring

`<mat-checkbox>` doesn't expose its inner `<input>` via a public API,
so `aria-describedby` cannot be wired to the feedback block
automatically. The demo leaves the wiring out because the
`role="alert"` / `role="status"` live regions inside `*ngxMatFeedback`
already announce changes to a screen reader. Consumers who need
belt-and-braces wiring can set the attribute by hand using the IDs the
directive emits (`{fieldName}-error` / `{fieldName}-warning`).

### `floatLabel` is out of scope

Material's `floatLabel` (`'auto' | 'always'`) interacts with Material's
internal `empty` / `focused` state and is not wired through the toolkit.
The demo uses Material's default (`'auto'`); set a different mode on
`<mat-form-field>` directly when needed.

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
`pnpm nx run demo-material:test`. Three assertions:

1. After typing into the name field and tabbing away, `<mat-error>`
   renders the toolkit-driven validation message and has a non-empty
   `id`.
2. After typing garbage into the email field and tabbing away,
   `aria-invalid="true"` is on the input, `aria-describedby` resolves
   to existing DOM IDs, and at least one of those IDs belongs to a
   `<mat-error>` element.
3. The `warn:short-name` warning renders inside `<mat-hint>` (not
   `<mat-error>`), and no `<mat-error>` is visible on that field.

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
pnpm nx serve demo-material           # dev server on http://localhost:4201
pnpm nx run demo-material:build       # production build (emits dist/apps/demo-material)
pnpm nx run demo-material:test        # smoke spec (jsdom + Vitest)
pnpm nx run demo-material-e2e:e2e     # Playwright spec
```

The smoke spec depends on a built toolkit (`pnpm nx build toolkit`),
which Nx schedules automatically via the `dependsOn` in
`project.json`.

## Pinned versions

| Package               | Version   |
| --------------------- | --------- |
| `@angular/material`   | `~21.2.9` |
| `@angular/cdk`        | `~21.2.9` |
| `@angular/animations` | `21.2.10` |
