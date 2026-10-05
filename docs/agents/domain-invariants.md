# Domain invariants

This guide records implementation-level constraints behind the terms in
[GLOSSARY.md](../../GLOSSARY.md). Read the linked ADRs for their rationale.

## Validation and visibility

- Classify warnings per error by the `warn:` prefix on `kind`. A field can
  carry both blocking errors and warnings. Field-level severity cannot express
  that split. Replace the prefix only when Angular supplies a per-error
  severity or blocking signal, not a field-level aggregate.
- Narrow built-in validation errors by their public `kind`, not by
  `instanceof`. Custom validators can emit plain objects, and duplicated
  Angular packages can break nominal checks. Keep the built-in error-kind
  handling exhaustive so Angular additions require review.
- Route error visibility through `createErrorVisibility()` and warning
  visibility through `createWarningVisibility()`. Keep the two cascades
  separate: warnings are non-blocking, use their own strategy, and are not
  equivalent to Angular's field-level `invalid()` state. A visible blocking
  error suppresses a warning on the same field, but an error on one field must
  not suppress a sibling field's warning. See
  [ADR-0006](../decisions/0006-one-cascade-seam.md) and
  [ADR-0007](../decisions/0007-warning-display-timing-cascade.md).
- Resolve warning timing from the explicit input, then the form's
  `warningStrategy()`, then `defaultWarningStrategy`, then On Touch.
  Gate warnings on warning presence, not Angular's `invalid()` state.
- Feed resolved strategies into the visibility helpers when resolution has
  already happened. Otherwise pass the raw inputs and configuration defaults.
  A separately exposed resolved strategy does not replace the visibility seam.
- Aggregate surfaces gate warning presence during aggregation. They must not
  pass one member's blocking-error visibility into the warning cascade.
  Auto-ARIA suppresses warnings through its described-by guard instead.
  `createFieldPresentation()` passes visible blocking errors, not raw error
  timing: raw timing can be open on a warning-only field.
- Keep `showErrors` and `showWarnings` separate in the fieldset and error-summary
  pipelines. Do not merge direct `errors()` reads with aggregated
  `errorSummary()` reads or remove the deliberate focus-first-invalid policy
  differences.

## Accessibility checks

- Toolkit browser specs enforce WCAG 2.2 AA as a hard gate.
- Each demo app records accepted axe violations in its versioned
  `a11y-baseline.json`. A new violation fails a pull request check; on `main`,
  it opens an issue. A maintainer accepts a violation through a reviewed
  baseline change. See
  [ADR-0013](../decisions/0013-block-pr-on-new-demo-a11y-violations.md).

## ARIA and field identity

- `aria-describedby` must reflect the message regions that are actually
  rendered. A hidden message must not be referenced, and a visible message
  must have a matching description id. Keep strategy and visibility overrides
  connected through the field-identity or per-form visibility registry
  channels; resolve error and warning channels independently. See
  [ADR-0010](../decisions/0010-field-identity-shadows-registries-per-channel.md).
- Wrapped fields publish resolved strategies through
  `createFieldPresentation({ identity })`. Standalone error renderers register
  rendered visibility in the per-form field visibility registry. For each
  channel, a published identity strategy wins, then a registry value, then the
  ambient form context. Do not choose by whether an identity is injectable:
  a name-only identity must leave visibility to the registry.
- The described-by id order is authored ids, hints (including the character
  count limit), then the visible error or warning. Do not add a new id channel
  without deciding its place in this order.
- The provider of `NgxFieldIdentity` owns the field name. A `null` name means
  the name is unresolved; do not silently fall back to the control id.
  Wrappers expose the identity provider as a host directive. See
  [ADR-0011](../decisions/0011-field-identity-provider-host-directive.md).
- Without an identity provider, auto-ARIA derives the name from the control id.
  The identity provider publishes only the name; wrappers also manage the
  control, hints, and visibility. Keep identity writers internal.
- Keep control-kind inference separate from auto-ARIA eligibility. In a
  selection group, the group owns ARIA state; do not duplicate it on each
  checkbox or radio. See
  [ADR-0001](../decisions/0001-control-semantics-architecture.md).
- Native checkboxes and radios need explicit control semantics to opt into
  auto-ARIA. A checkbox with `role="switch"` is a single control and is eligible
  automatically.
- When an error summary announces a submit, render revealed field errors in a
  non-live region while keeping the empty field alert mounted for later edits.
  See [ADR-0012](../decisions/0012-error-summary-announces-alone.md).
- Coordinate submit announcements through per-form `NgxSubmitAnnouncements`,
  never a global service. Move content rather than toggling the live region's
  role. `errorSummaryAnnouncesAlone: false` disables this behavior.

## Styling ownership

- Public tokens use the documented `--ngx-form-field-*` or
  `--ngx-signal-form-*` names. Treat their names and defaults as public API;
  a default change is breaking. Name gap tokens for their layout area, not the
  CSS property, such as `selection-group-gap`. Documented internal coordination
  hooks are not public tokens. Private `--_` tokens are not consumer overrides.
- A selection row covers one checkbox or switch and its label, not a radio.
  Radios belong to a selection group. The wrapper owns the group's surface and
  option spacing; consumers own each option row and its control-to-label gap.
- Parent layouts own spacing between fields. Fields own their inner rhythm and
  assistive-row reservation. Consumers can opt into field-owned outer spacing
  with `--ngx-form-field-margin`, whose default is `0`.

## Public API and integrations

- `packages/toolkit/core` is an internal build-time entry point, not a
  published package entry point. Public exports are enumerated by the root
  barrel; do not assume `@public` in `/core` makes a symbol part of the public
  API.
- A Vest suite receives the value at its bound path, and its field names are
  relative to that value. Do not bind a suite at a leaf and expect it to read
  the form root. A non-matching first name segment can identify an intentional
  virtual Vest field; a typo after a valid prefix is an authoring error.
  Per-field focus remains a root-level concern. See
  [ADR-0008](../decisions/0008-vest-suite-input-is-the-bound-path.md).
- The horizontal form-field grid belongs on its structural child, not
  `:host`. Its container query responds to the wrapper's own width. See the
  horizontal-layout section in
  [the theming guide](../../packages/toolkit/form-field/THEMING.md).
- The structural layout is `display: contents` outside horizontal mode.
  Horizontal mode makes it a grid with `container-type: inline-size`.
  A size query cannot restyle its own container, and containment on the host
  can disrupt intrinsic sizing in consumer layouts.
- Below `20rem`, explicit full-width grid rows stack labels and controls.
  The threshold is not a public token: size-query conditions require literal
  lengths, not custom properties. Consumers who need another breakpoint must
  override the layout rows and columns in global CSS as described in the
  theming guide.
