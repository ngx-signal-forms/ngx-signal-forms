# ADR-0001: Control Semantics Architecture

## Status

Accepted

## Date

2026-04-07

## Context

The toolkit wraps Angular Signal Forms with an accessibility-first UX layer.
Three surfaces need to agree on how a given control should be treated:

1. **Wrapper layout** (`NgxFormFieldWrapper`) — should this
   field use stacked chrome, inline controls, a group layout, or no chrome at
   all?
2. **Auto-ARIA** (`NgxSignalFormAutoAria`) — does the toolkit own
   `aria-invalid`, `aria-required`, and `aria-describedby` on this host, or
   does the control author own them?
3. **Error surfacing** — `isErrorOnInteractiveField`, `focusFirstInvalid`,
   and headless aggregation all need a consistent view of which controls are
   real, interactive field hosts.

Before this refactor the wrapper inferred all of this from DOM heuristics
(element tag, `type`, `role`), and `NgxSignalFormsConfig` carried a flat set
of defaults. That broke down as soon as custom and third-party controls
entered the picture:

- Sliders, date pickers, combobox widgets, and rating controls cannot be
  identified by DOM shape alone.
- Different parts of an app wanted different defaults — e.g. sliders that
  always use `appearance="plain"` plus manual ARIA ownership inside a
  settings shell, but not elsewhere.
- Auto-ARIA needed to know whether the control author had opted into manual
  ownership, but importing the control-semantics directive class into
  auto-ARIA coupled two otherwise independent concerns.
- The existing `NgxSignalFormsConfig` had no natural place for per-control
  defaults without growing into a union of unrelated concerns.

We also wanted consumers to be able to **opt out of the contract entirely**
for native fields — a plain `<input type="text">` should still just work
without any directive, provider, or preset.

## Decision

Split the control-semantics contract into four cooperating pieces, each with
a narrow purpose:

### 1. `NgxSignalFormControlSemanticsDirective`

A directive authors apply directly to a control host when they want explicit
semantics instead of DOM inference.

> **Naming exception.** The directive class keeps its `Directive` suffix
> because the suffix-less `NgxSignalFormControlSemantics` name is occupied
> by the matching public _interface_ in `core/types.ts` (used for typing
> the same shape as a data value). This is the only exported class in v1
> that does not follow the toolkit-wide "drop the `Directive` suffix"
> convention — `imports: [...]` and `inject(...)` use the directive class
> name, type annotations use the interface.

```html
<app-star-rating
  id="productRating"
  role="slider"
  ngxSignalFormControl="slider"
  ngxSignalFormControlAria="manual"
  [formField]="form.productRating"
/>
```

Inputs:

- `ngxSignalFormControl` — the control family (`input-like`,
  `standalone-field-like`, `switch`, `checkbox`, `radio-group`, `slider`,
  `composite`), or an object literal for one-off layout/aria combinations.
- `ngxSignalFormControlLayout` — one-off wrapper layout override.
- `ngxSignalFormControlAria` — `'auto'` or `'manual'` ARIA ownership.

The directive writes stable `data-ngx-signal-form-control-*` attributes so
wrapper styling and test selectors can key off them.

### 2. `NGX_SIGNAL_FORM_CONTROL_PRESETS` + preset providers

A dedicated injection token, separate from `NGX_SIGNAL_FORMS_CONFIG`, holds
the per-family defaults. Two providers manage it:

- `provideNgxSignalFormControlPresets()` — environment providers for app- or
  feature-level defaults.
- `provideNgxSignalFormControlPresetsForComponent()` — component-scoped
  providers for isolated subtrees.

Both merge into the parent registry (if any) rather than replacing it, so
nested overrides compose naturally.

### 3. `NGX_SIGNAL_FORM_ARIA_MODE` (DI token)

A separate injection token exposes the **resolved** ARIA mode for a single
control host as `Signal<NgxSignalFormControlAriaMode | null>`. The
control-semantics directive provides it at its own directive level; auto-ARIA
reads it via `{ optional: true, self: true }`.

Auto-ARIA **does not import** the control-semantics directive class. The two
directives communicate entirely through this token.

### 4. `NGX_SIGNAL_FORM_HINT_REGISTRY` (DI token)

The same decoupling idea applied to hints. The form field wrapper exposes a
`NgxSignalFormHintRegistry` via DI so auto-ARIA can build
`aria-describedby` chains without querying the DOM for hint elements by
selector. Auto-ARIA never has to know about the wrapper component.

### Override hierarchy

When resolving semantics for a control, the toolkit walks four layers,
highest precedence first:

1. **Directive inputs** on the control host itself
   (`[ngxSignalFormControl]`, `ngxSignalFormControlLayout`,
   `ngxSignalFormControlAria`).
2. **Component-scoped presets** via
   `provideNgxSignalFormControlPresetsForComponent()`.
3. **App-level presets** via `provideNgxSignalFormControlPresets()`.
4. **Toolkit defaults** (`DEFAULT_NGX_SIGNAL_FORM_CONTROL_PRESETS`).

### Default families

`DEFAULT_NGX_SIGNAL_FORM_CONTROL_PRESETS` ships with:

| Kind                    | Default layout   | Default ARIA mode |
| ----------------------- | ---------------- | ----------------- |
| `input-like`            | `stacked`        | `auto`            |
| `standalone-field-like` | `stacked`        | `auto`            |
| `switch`                | `inline-control` | `auto`            |
| `checkbox`              | `group`          | `auto`            |
| `radio-group`           | `group`          | `auto`            |
| `slider`                | `stacked`        | `auto`            |
| `composite`             | `custom`         | `auto`            |

DOM inference still covers the common native case: a plain
`<input type="text">` without any directive resolves to `input-like`, a
`<textarea>` to `standalone-field-like`, and `input[type="checkbox"][role="switch"]`
to `switch`. Explicit semantics are only needed when inference cannot reach
the right answer.

## Alternatives Considered

### A. Extend `NgxSignalFormsConfig` with per-control defaults

- **Pros:** one config surface, one provider.
- **Cons:** `NgxSignalFormsConfig` is for form-system-wide behavior
  (default error strategy, appearance, required marker text). Grafting a
  preset registry onto it would couple two unrelated concerns, and every
  subtree override would have to re-state the whole form config just to
  change a slider default.
- **Rejected:** we wanted presets to be independently scoped.

### B. Single `NgxSignalFormControlDirective` that also writes ARIA

- **Pros:** one directive, no token indirection.
- **Cons:** auto-ARIA would need to import and inject a directive that most
  forms never use; the two directives have different selector surfaces
  (auto-ARIA applies broadly, control-semantics applies narrowly); changes
  to one would leak into the other's test surface.
- **Rejected:** the DI token gives us a clean contract with no class
  coupling.

### C. Query the DOM for semantics each render

- **Pros:** no new API surface for consumers.
- **Cons:** cannot represent per-control overrides, breaks for custom
  components that do not expose DOM shapes, forces every layer to re-query
  on every render.
- **Rejected:** does not solve the custom-control problem and is a
  performance regression on large forms.

### D. Make explicit control semantics mandatory

- **Pros:** zero DOM heuristics, fully deterministic.
- **Cons:** every native `<input>`, `<textarea>`, and `<select>` would need
  a directive — enormous boilerplate tax on the common case. The whole
  point of the toolkit is that simple forms "just work".
- **Rejected:** breaks the out-of-the-box native-control promise.

## Consequences

**Positive:**

- Native fields keep working with zero added API surface.
- Custom and third-party controls have a stable contract
  (`ngxSignalFormControl`) that does not depend on DOM shape.
- Presets compose across injector scopes, so feature teams can set defaults
  for their subtree without affecting the rest of the app.
- Auto-ARIA and control-semantics evolve independently; adding a new ARIA
  mode only touches the token and auto-ARIA, not the wrapper or the
  directive.
- Hint aggregation no longer requires DOM selector knowledge in auto-ARIA.

**Negative:**

- Four concepts (directive, providers, presets, DI tokens) instead of one.
  The API surface is bigger and takes more explanation — this ADR exists
  because the split is non-obvious.
- Consumers mixing DOM inference and explicit semantics need to understand
  the override hierarchy to predict behavior.
- The DI-token contract between directives is an internal boundary that
  must be kept stable even though neither token is in the common consumer
  path.

**Mitigations:**

- `docs/CUSTOM_CONTROLS.md` walks through practical examples.
- `packages/toolkit/README.md` documents the preset families and override
  hierarchy in-line.
- The `data-ngx-signal-form-control-*` attributes give tests and consumer
  stylesheets a stable hook that does not depend on internal signals.

## Related

- `packages/toolkit/README.md` — public API reference (directive + providers)
- `docs/CUSTOM_CONTROLS.md` — practical integration guide
- `packages/toolkit/core/tokens.ts` — token definitions and default presets
- `packages/toolkit/core/providers/control-semantics.provider.ts` — preset
  provider implementation
- `packages/toolkit/core/directives/control-semantics.ts` —
  directive implementation
- `packages/toolkit/core/directives/auto-aria.ts` — consumer of
  `NGX_SIGNAL_FORM_ARIA_MODE` and `NGX_SIGNAL_FORM_HINT_REGISTRY`
