# `apps/demo-material` — Reference wrapper for Angular Material 21+

A runnable end-to-end example showing how to integrate
[`@ngx-signal-forms/toolkit`](../../packages/toolkit/README.md) on top of
**Angular Material 21+**. Pinned to `@angular/material@~21.2.9` and
`@angular/cdk@~21.2.9`.

## What this shows

A single contact form (`src/app/contact-form/`) bound to Angular Signal
Forms via `[formField]`, using a custom Material wrapper
(`src/app/wrapper/`) that satisfies the four contracts in
[`docs/CUSTOM_WRAPPERS.md`](../../docs/CUSTOM_WRAPPERS.md):

- **One representative form** — text input (`<input matInput>`), select
  (`<mat-select>`), and checkbox (`<mat-checkbox>`) covering the three
  control kinds the toolkit recognises.
- **Renderer-token registration** — `provideMaterialFeedbackRenderer()`
  scopes a `MaterialFeedbackRenderer` component to the form via
  `provideFormFieldErrorRendererForComponent`. The wrapper instantiates it
  through `*ngComponentOutlet` inside both `<mat-error>` (errors) and
  `<mat-hint>` (warnings) so output renders in Material's idiom.
- **`NgxSignalFormControlSemanticsDirective`** — declared on every control
  with `ngxSignalFormControl="<kind>"` and `ngxSignalFormControlAria="manual"`.
- **Strategy-aware visibility** — the wrapper drives `<mat-error>` /
  `<mat-hint>` visibility from the toolkit's `createShowErrorsComputed`
  helper, **not** Material's default "invalid + touched" rule. Switching
  the global strategy (e.g. to `on-submit` via `provideNgxSignalFormsConfig`)
  takes effect immediately.
- **All four ARIA primitive factories from `@ngx-signal-forms/toolkit/headless`**:
  - `createAriaInvalidSignal`, `createAriaRequiredSignal` — surfaced on the
    wrapper's host as `data-ngx-mat-invalid` / `data-ngx-mat-required` so
    consumers and tests can probe the toolkit's view.
  - `createHintIdsSignal` — collected for forward-compat with projected
    `<ngx-form-field-hint>`.
  - `createAriaDescribedBySignal` — composes a toolkit-managed
    `aria-describedby` value layered on top of Material's IDs via the
    `preservedIds` reader (see "Material-specific gotchas" below).
- **Warnings rendering** — the `name` field exercises a `kind: 'warn:short-name'`
  warning. The toolkit treats it as non-blocking and renders it inside
  `<mat-hint>`; the form remains submittable.

```text
src/app/
  contact-form/             form + validations + smoke spec
  wrapper/
    mat-form-field-wrapper.ts   directive applied on <mat-form-field>
    material-error-renderer.ts  renderer component for the error/hint slots
    mat-checkbox-feedback.ts    standalone error slot for <mat-checkbox>
```

## Material-specific gotchas

### `aria-describedby` ownership

Material's `MatFormFieldControl` (the directive on `<input matInput>`,
`<mat-select>`, `<mat-checkbox>`, etc.) **owns** the projected control's
`aria-describedby`. Every render, Material aggregates the IDs of its
projected `<mat-error>` and `<mat-hint>` elements and writes them back
onto the bound control. Letting `NgxSignalFormAutoAria` participate in
that write would result in two directives stomping each other on the
same attribute.

**Resolution: declare `ngxSignalFormControlAria="manual"` on the bound
control.** That opt-out tells `NgxSignalFormAutoAria` to leave
`aria-invalid` / `aria-required` / `aria-describedby` alone — Material
becomes the single writer.

If you need to add a non-Material assistive ID (a custom hint, a tooltip
description, etc.), use the wrapper's `toolkitAriaDescribedBy` signal
(driven by `createAriaDescribedBySignal`) and bind it to
`<mat-form-field [userAriaDescribedBy]>`. The factory uses the
`preservedIds` reader to read the bound control's _current_
`aria-describedby`, preserve every ID Material wrote there, and append
only the IDs the toolkit owns. This is the documented escape hatch for
Material's ARIA ownership.

### `<mat-checkbox>` lives outside `<mat-form-field>`

Material's `<mat-checkbox>` does not implement `MatFormFieldControl`,
so it cannot project into `<mat-form-field>`. The demo handles checkbox
errors via `MatCheckboxFeedback` — a standalone component that uses the
**same renderer token** to render its messages but stamps its own
`${fieldName}-error` / `${fieldName}-warning` IDs (the toolkit's
managed ID convention). Consumers who want belt-and-braces ARIA can
manually set `aria-describedby="contact-agree-error"` on the checkbox's
inner `<input>`; the demo leaves that wiring out because Material
doesn't expose the inner input through a public API and screen readers
already announce the `role="alert"` live region inside
`MatCheckboxFeedback`.

### `floatLabel` is out of scope

Material's `floatLabel` (`'auto' | 'always'`) interacts with Material's
internal `empty` / `focused` state and is **not** wired through the
toolkit. The demo uses Material's default (`'auto'`) and lets
`<mat-label>` projection do the rest. Consumers needing a different
mode set it on `<mat-form-field>` directly:

```html
<mat-form-field [ngxMatFormField]="form.email" floatLabel="always">
  <mat-label>Email</mat-label>
  <input matInput [formField]="form.email" />
</mat-form-field>
```

## What's not shown

- `floatLabel` modes other than the default (out of scope; documented above).
- `mat-form-field-prefix` / `mat-form-field-suffix` icons — orthogonal to
  the toolkit seam.
- Async validators (e.g. `validateAsync`) and the toolkit's debugger
  panel. The toolkit demo (`apps/demo`) exercises both.
- Material theming customisation. The demo uses the prebuilt
  `azure-blue.css` theme.
- Multi-form scenarios (wizards, fieldsets, error summaries). One
  representative form covers the seam; the rest is application-level
  composition.
- Material's `errorStateMatcher` integration. The toolkit drives
  visibility timing instead, so consumers don't need a custom matcher.

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
   `<mat-error>`), and no `<mat-error>` is visible on that field — the
   form is still submittable.

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
