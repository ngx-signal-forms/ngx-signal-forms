# ADR-0002: Reference-Wrapper Ergonomics and `@ngx-signal-forms/material` Package Shape

## Status

Accepted

## Date

2026-05-02

## Context

PRD #40 ships three reference wrapper apps under `apps/demo-material`,
`apps/demo-primeng`, `apps/demo-spartan`. The first iteration of #59
(`apps/demo-material`) shipped a directive on `<mat-form-field>` plus a
`MaterialFeedbackRenderer` registered through the toolkit's renderer token,
with consumers writing `*ngComponentOutlet` boilerplate and a
`feedbackInputs` lambda for every `<mat-error>` and `<mat-hint>` slot.

A grilling pass on whether the demo justifies its existence surfaced three
problems:

1. **Per-field cost was higher than plain Material + Signal Forms.** The
   marquee toolkit feature on Material — auto-ARIA — is intentionally
   disabled (`ngxSignalFormControlAria="manual"`) because Material owns
   `aria-describedby`. Without that win, ~15 lines per field of toolkit
   wiring is a net loss for Material-only consumers.
2. **The README told consumers _how_ but not _when_ or _why_.** A Material
   consumer reading the demo would conclude they don't need the toolkit at
   all unless they have warnings, mixed-stack forms, or scale-justifying
   centralised error/label DI.
3. **Bound-control discovery used `afterEveryRender` + `querySelector`** to
   find the projected `[formField]` element. That is imperative DOM probing
   in a signal-driven directive — fragile (multi-control templates, custom
   widgets) and out of step with Angular's signal-native discovery patterns.

`apps/demo-primeng` and `apps/demo-spartan` (already merged) inherited the
same ergonomic shape and would benefit from a single shared upgrade.

## Decision

### 1. Audience and framing

The Material reference targets **mixed-stack apps that include Material**,
not Material-only apps. Material-only consumers with simple forms should use
plain Material + Signal Forms + a minimal `ErrorStateMatcher`. The toolkit
earns its keep when a single app has Material forms next to non-Material
forms and wants:

- a unified `errorStrategy` (`on-touch` / `on-submit` / `immediate`)
- first-class warnings (`warn:*`), which Material does not ship
- centralised label / error-message DI (`provideFieldLabels`,
  `provideErrorMessages`)
- a `submittedStatus` state machine for post-submit UI

The README leads with "Why use this on Material" + "When NOT to" + a
side-by-side comparison with plain Material + Signal Forms.

### 2. Per-control directives, no string parameter

Replace `ngxSignalFormControl="text" ngxSignalFormControlAria="manual"` with
a per-control directive family:

- `ngxMatTextControl` (matches `<input matInput>` and `<textarea matInput>`)
- `ngxMatSelectControl`
- `ngxMatCheckboxControl`
- `ngxMatSlideToggleControl` (dedicated alias of checkbox; future-proofs the
  switch-vs-checkbox distinction)
- `ngxMatRadioControl` (future)

Each directive composes `NgxSignalFormControlSemanticsDirective` as a host
directive with `ariaMode="manual"` baked in. No string parameter. No runtime
auto-detection. The directive name **is** the kind. Mirrors Material's own
per-control naming (`matInput`, `matNativeControl`, `MatSelect`).

### 3. Structural slot directives

Replace `<mat-error>` + `*ngComponentOutlet` with structural directives that
own conditional rendering:

```html
<mat-error *ngxMatErrorSlot="form.email"></mat-error>
<mat-hint *ngxMatHintSlot="form.email">Optional helper text</mat-hint>
```

The host element exists only when the slot is visible — matches Material's
own conditional-rendering idiom. Hint slot semantics: when `warningVisible()`
is true the projected neutral content is replaced by the warning renderer
(one `<mat-hint>`, never two).

For consumers who need to compose extras inside `<mat-error>` (icons, custom
typography), the verbose `*ngComponentOutlet` form survives in a documented
"Extending the error slot" appendix.

### 4. `*ngxMatFeedback` for non-form-field controls

Material's `<mat-checkbox>` does not implement `MatFormFieldControl`. So
will `<mat-radio-group>`, `<mat-button-toggle-group>`, `<mat-slide-toggle>`,
`<mat-chip-grid>`, `<mat-datepicker>`. Replace the per-control
`<ngx-mat-checkbox-feedback>` with a single control-agnostic
`*ngxMatFeedback="form.field"` (or `<ngx-mat-feedback>`) used adjacent to
any control that lives outside `<mat-form-field>`.

### 5. Provider shape

Two providers, renderer registration only:

- `provideNgxMatForms()` — application-level, registers the default
  `MaterialFeedbackRenderer` once. Recommended path.
- `provideNgxMatFormsForComponent()` — component-level override for the
  "swap renderer in one screen" use case.

Neither touches `NGX_SIGNAL_FORMS_CONFIG`. Defaults stay opt-in via
`provideNgxSignalFormsConfig`.

### 6. Bound-control discovery via `contentChildren`

The wrapper queries
`contentChildren(NgxSignalFormControlSemanticsDirective, { descendants: true })`
to find its bound control. Pure signals, zero `afterEveryRender`. The query
re-runs only when projected content changes.

To make this work without a per-design-system base class, the toolkit-side
`NgxSignalFormControlSemanticsDirective` exposes `elementRef` publicly:

```ts
export class NgxSignalFormControlSemanticsDirective {
  readonly elementRef = inject(ElementRef<HTMLElement>);
  // ...
}
```

This is an additive surface change. Cost: zero runtime overhead (the
directive already lives on the host for its host bindings). Benefit: every
reference wrapper (Material, PrimeNG, Spartan) and every consumer custom
wrapper queries the same directive — no per-DS base class required.

The `preservedIds` reader for Material's `aria-describedby` ownership still
performs imperative DOM reads, but inside a `computed` triggered by signal
changes, not a render hook.

### 7. Renderer contract simplification

`MaterialFeedbackRenderer` accepts `{ message, severity }` only. The slot
directive resolves `formField` → message text via `readDirectErrors` + the
toolkit's strategy and hands the resolved string to the renderer. Smaller
public surface for consumers swapping the renderer (icon prefix, custom
typography); easier to forward-port into the future
`@ngx-signal-forms/material` package.

### 8. Forward-compatibility: future `@ngx-signal-forms/material` package

The selectors, bundle name (`NgxMatFormBundle`), and provider names
(`provideNgxMatForms*`) are chosen so the demo's wrapper can graduate into a
published `@ngx-signal-forms/material` package in a future v1.x line **with
no rename**. The migration path is a single import-path swap from
`./wrapper` to `@ngx-signal-forms/material`.

The published package will own its own `@angular/material` peer-dep range
and a CI isolation job mirroring `toolkit-isolation` to keep
`@ngx-signal-forms/toolkit` core design-system-neutral.

## Consequences

### Positive

- Per-field consumer cost drops from ~15 lines to ~5 lines, competitive with
  plain Material + Signal Forms.
- One canonical bound-control discovery pattern (`contentChildren` on the
  toolkit's semantics directive) shared across all reference wrappers.
- The demo's API ships the same names a future published package will use.
  No rename / migration churn for consumers who copy the demo today.
- Forward-port to a published package is purely additive — no design
  decisions deferred.
- `apps/demo-primeng` and `apps/demo-spartan` get follow-up cleanup PRs that
  delete their `afterEveryRender` + DOM-probing branches, consolidating on
  `contentChildren`.

### Negative / accepted trade-offs

- The toolkit's semantics directive grows by one public field
  (`elementRef`). This is a permanent stability commitment. Mitigated by:
  the field is a standard Angular `ElementRef` (no custom shape), every
  Angular form directive exposes `ElementRef`, and consumers querying via
  `contentChildren` need _some_ way to reach the host — exposing `ElementRef`
  is the canonical Angular answer.
- Bare `<input matInput [formField]>` (no `ngxMat*Control` directive) stops
  working with `[ngxMatFormField]`. The wrapper's `contentChildren` query
  returns empty and renders nothing. Mitigated by: a dev-mode error message
  pointing the consumer at the `ngxMat*Control` directives and an explicit
  smoke-spec assertion.
- The structural-slot pattern means consumers cannot put their own content
  inside `<mat-error>` by default. Mitigated by: the verbose
  `*ngComponentOutlet` form is documented as the escape hatch in a "Under
  the hood" appendix.

## Alternatives Considered

### A. Keep #59 as-is, file an ergonomics follow-up

Rejected. The current shape would seed copy-paste consumer code with
`*ngComponentOutlet` boilerplate that all has to be deleted later. Doing the
refactor now means the demo on day 1 is the pattern we want consumers to
copy.

### B. Auto-detect control kind from element tag (`mat-select`,

`mat-checkbox`, `<input type=...>`)

Rejected. Auto-detection is brittle (custom widgets that mimic `matInput`),
and the override escape hatch reintroduces the string parameter we were
trying to remove. Per-directive naming sidesteps both problems and matches
Material's own idiom.

### C. Stamp content into `<mat-error>` from the parent

`[ngxMatFormField]` directive (no slot directive)

Rejected. Content projection into queried `MatError` instances from a
sibling directive is awkward and surprising; Material may not support
having its `<mat-error>` content rewritten by a third party.

### D. Defer `elementRef` exposure on the toolkit semantics directive to a

separate PRD

Rejected. The change is a one-line additive, motivated by all three
reference wrappers, with zero runtime cost. PRD #40's "escalate surface
changes" rule exists to prevent feature creep, not to block trivially
additive changes that the PRD itself motivates.

## References

- PRD #40 — Reference wrapper implementations
- Issue #59 — `feat(demo-material)` reference wrapper
- ADR-0001 — Control semantics architecture
- `docs/CUSTOM_WRAPPERS.md` — the four contracts every wrapper satisfies
