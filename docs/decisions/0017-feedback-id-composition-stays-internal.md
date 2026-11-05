# ADR-0017: Feedback-ID Composition Stays Internal, with Two Deliberate Orders

## Status

Accepted

## Date

2026-11-04

## Context

Issue [#760](https://github.com/ngx-signal-forms/ngx-signal-forms/issues/760) moves the composition of a field's feedback IDs (hints, the character-count limit, the visible error or warning) into one module. Two questions came up that a future reader would otherwise reopen:

1. Should that module become a public registration interface, or a global registry keyed by field name, so third-party surfaces can register IDs?
2. Should the two existing description orders be unified?

## Decision

### 1. The module is internal and lives in the component tree

Feedback-ID composition is an internal module scoped to a field. It is not exported, and it is not a global registry. The supported public seams stay as they are: `NgxFieldIdentity`, `createHintIdsSignal`, `createAriaDescribedBySignal`, `createAriaDescribedByBridge`, and the hint and field-visibility registries. Per-channel shadowing from [ADR-0010](0010-field-identity-shadows-registries-per-channel.md) and the pure-factory shape from [ADR-0005](0005-aria-primitives-as-factories.md) are unchanged.

### 2. The two orders differ on purpose

- **Auto-ARIA controls** use: authored IDs, hints, the character-count limit, then the visible error or warning. A screen reader reads the instructions before the problem, and the error comes last, where it changes most often.
- **The design-system bridge** (`createAriaDescribedByBridge`) uses: toolkit IDs first, then the IDs the design system registers (its own descriptions and errors), deduplicated in first-seen order. The design system owns its own error rendering and order, and the bridge only prepends what the toolkit adds.

Do not unify the two orders. Each is a public behavior that consumers rely on.

## Consequences

- One internal place enforces the auto-ARIA order, and the bridge stays a thin, separately tested adapter.
- A third-party surface that needs to add a description uses the existing public seams, not a new registration API.
- Adding a new ID channel still means deciding its place in the auto-ARIA order (see [domain invariants](../agents/domain-invariants.md)).

## Alternatives Considered

**A public registration interface.** Rejected: it adds a public seam that the field-identity and registry tokens already cover, and every exported plumbing helper must stay stable.

**A global registry keyed by field name.** Rejected: field names are not unique across forms or nested fields, and the existing registries are deliberately per form.

**One shared order.** Rejected: either the auto-ARIA screen-reader order or the design system's ownership of its own descriptions would break.

## Related

- [ADR-0005](0005-aria-primitives-as-factories.md), [ADR-0010](0010-field-identity-shadows-registries-per-channel.md), [ADR-0011](0011-field-identity-provider-host-directive.md)
- Issue [#760](https://github.com/ngx-signal-forms/ngx-signal-forms/issues/760)
