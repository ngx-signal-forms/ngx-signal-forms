# Field Identity (Custom Wrapper)

## Intent

Every other demo on this site uses the built-in `ngx-form-field-wrapper`. This one does not. It builds a small third-party-style wrapper from scratch and gives it the one thing a wrapper author reaches for when the bound control's DOM `id` is not the field's name: `NgxFieldIdentityProvider`.

Two behaviors, one story — a wrapper that owns its identity, inside UI that collapses:

1. A widget generates its own inner `id` (`demo-widget-1`), and the wrapper declares `fieldName="emailAddress"`. The rendered message elements, and the `aria-describedby` that points at them, follow the declared name.
2. The same wrapper inside a `<details>`. While collapsed the control has no layout box, so `aria-invalid` is removed rather than left stale.

## Toolkit features showcased

- `NgxFieldIdentityProvider` composed via `hostDirectives` with its `fieldName` input exposed. It is selectorless — host placement is load-bearing, because that host element injector is what projected content resolves through.
- `NGX_SIGNAL_FORM_FIELD_CONTEXT` — lets the projected `<ngx-form-field-hint>` correlate with the field.
- `NGX_SIGNAL_FORM_HINT_REGISTRY` — feeds hint ids into `aria-describedby` through DI rather than a DOM query.
- `NGX_SIGNAL_FORM_FIELD_VISIBILITY_REGISTRY` — the wrapper never touches this token. The `<ngx-form-field-error>` it renders publishes the boolean that already gates its own live region, and auto-aria reads it back from there.
- `NgxSignalFormAutoAria`'s per-render visibility probe — imported in the widget's template, because that is where `[formField]` is declared.
- `isElementCssVisible()` — used by the on-page readout to show what the toolkit's own probe sees.

## Form model

- Signal model: `signal<FieldIdentityModel>()` with `emailAddress` and `deliveryNote`.
- Schema: `form(model, fieldIdentitySchema, { submission })`.

## Validation rules

### Errors

- `emailAddress` — required, plus a pattern check.
- `deliveryNote` — required.

Both are invalid while empty on purpose. The page defaults to the "Immediate" error display mode so the collapse behavior in section 2 is observable without typing first.

### Warnings

- None.

## Strong suites

- The only place in the catalog where a wrapper declares its own field name, so it is the reference for the third-party-widget and `role="group"` cases.
- The readout under each control shows `control id`, `aria-invalid`, and every `aria-describedby` token with whether it resolves — a dangling id is visible as a red ✗ without opening DevTools.
- Makes the channel split legible: the wrapper owns the name, hints and display timing keep resolving through their registries.

## Gotchas worth copying

- **Do not name the wrapper's field input `formField`.** Both `NgxSignalFormAutoAria` and Angular's own `FormField` select on `[formField]`, including on non-control elements. A wrapper that reuses the attribute name pulls both directives onto its host, and auto-aria then fails to inject `FORM_FIELD` on an element that is not a control. This wrapper names it `field`.
- **Bind `<details open>` to a signal.** A bare `<details>` toggles in the browser without telling Angular, so nothing re-runs the render hook that re-probes visibility. The page binds `[open]` and writes the state back from `(toggle)`.

## Related

- [`docs/CUSTOM_WRAPPERS.md`](../../../../../../docs/CUSTOM_WRAPPERS.md) — the four contracts and the identity seam.
- ADR-0010 (per-channel identity resolution) and ADR-0011 (the host-directive design).
