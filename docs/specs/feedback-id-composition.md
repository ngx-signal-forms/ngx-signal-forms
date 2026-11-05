# Shared feedback-ID composition

Status: agreed specification; implementation pending.

Agreed on 2026-11-05. This document does not describe a shipped refactor.

Implementation is tracked by [#760](https://github.com/ngx-signal-forms/ngx-signal-forms/issues/760).
It is blocked by [#761](https://github.com/ngx-signal-forms/ngx-signal-forms/issues/761),
which plans to change the ownership of visible-message state and error/warning IDs.
After #761 merges, check its resulting contracts before starting #760. Do not
undo intentional changes made by #761.

## Goal

Give toolkit-owned feedback-ID composition one pure policy owner. Remove
duplicated preparation rules without changing accessible descriptions or adding
a new registration system.

The architecture review proposed a field-name-keyed feedback registry. This
specification chooses a smaller boundary. The existing ARIA factories already
compose descriptions, and the identity and registry contracts already carry
character-count IDs within the hint channel.

## Existing contracts

- [ADR-0005](../decisions/0005-aria-primitives-as-factories.md) keeps ARIA
  factories pure and DI-free. The directive shell owns manual-mode opt-out.
- [ADR-0010](../decisions/0010-field-identity-shadows-registries-per-channel.md)
  resolves identity and registry values independently for each channel.
  Published hint IDs are authoritative, including an empty list.
- [ADR-0017](../decisions/0017-feedback-id-composition-stays-internal.md)
  keeps feedback-ID composition internal and preserves the distinct
  auto-ARIA and design-system bridge orders.
- [Issue #499](https://github.com/ngx-signal-forms/ngx-signal-forms/issues/499)
  establishes character-limit discoverability and description ordering.
- [Issue #589](https://github.com/ngx-signal-forms/ngx-signal-forms/issues/589)
  preserves stable limit IDs for manual standalone-count wiring.

The implementation starts from these surfaces:

| Surface                                                                                                                                                                                             | Responsibility to preserve                                                                                                   |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| [Form-field wrapper](../../packages/toolkit/form-field/form-field-wrapper.ts)                                                                                                                       | Query projected hints and counts; prepare ordinary hints before count-limit descriptions; publish the combined hint channel. |
| [Hint resolver](../../packages/toolkit/core/utilities/aria/create-hint-ids-signal.ts)                                                                                                               | Resolve identity publication before registry fallback; retain field-name filtering.                                          |
| [Description composer](../../packages/toolkit/core/utilities/aria/create-aria-described-by-signal.ts)                                                                                               | Compose preserved IDs, resolved hints and eligible error/warning IDs.                                                        |
| [Auto-ARIA directive](../../packages/toolkit/core/directives/auto-aria.ts)                                                                                                                          | Supply resolved inputs and retain DOM ownership and manual-mode behavior.                                                    |
| [Hint](../../packages/toolkit/assistive/hint.ts), [character count](../../packages/toolkit/assistive/character-count.ts), and [error state](../../packages/toolkit/headless/src/lib/error-state.ts) | Keep their current ID creation, stability and rendering responsibilities.                                                    |

## Scope and boundary

Use the existing pure ARIA composition path. Consolidate toolkit-owned
hint/count preparation and final ID composition behind a small internal
feedback-ID module. The wrapper remains an adapter: it queries content and
supplies descriptors rather than defining another ordering policy.

Keep the existing public factory signatures and exports compatible. Do not add
a public count input merely to support this refactor. The internal helper
shape must follow the actual repeated policy, not introduce a general-purpose
registration framework. These limits apply to #760; #761 can make its own
separately approved API changes.

Preserve the existing flat descriptor and identity boundaries:

- The hint registry carries an ID and field name, not a feedback-kind tag.
- Identity hint IDs contain ordinary hints and count-limit descriptions.
- The final composer receives that resolved list without reconstructing kinds.
- Custom published lists remain opaque. Do not infer kinds from ID suffixes
  or reorder custom entries.

ID creation, registration cleanup, field-name resolution, identity fallback,
visibility decisions and DOM writes remain with their current owners.
Preparation helpers must retain descriptor metadata and existing filtering.

### Outside this change

- No new registry, service, identity channel or required consumer migration.
- No change to ID spelling, generated-ID lifetime or SSR identity behavior.
- No automatic registration of standalone character counts.
- No change to validation timing, warning precedence or live announcements.
- No redesign of [fieldset aggregation](../../packages/toolkit/form-field/form-fieldset.ts).
- No change to the [design-system bridge](../../packages/toolkit/core/utilities/aria/create-aria-described-by-bridge.ts).
  Its toolkit-first, external-IDs-afterward order is a separate contract.
- No line-count reduction target. The review's estimated wrapper reduction is
  not an acceptance criterion.

## Invariants

### Ordered descriptions

For toolkit-prepared feedback, preserve this order:

1. Author-supplied or preserved description IDs.
2. Ordinary hint IDs, in their existing relative order.
3. Eligible character-count limit-description IDs, in their existing order.
4. The eligible blocking-error ID, or the eligible warning ID.

When the field name is resolved, split preserved IDs on whitespace and retain
their existing duplicates. Add each managed ID only if it is not already in
the list. For example, preserved IDs `notes notes` and hints `notes`, `hint`,
`hint` produce `notes notes hint`.

When the field name is unresolved or empty, return the preserved value verbatim,
including whitespace and duplicates. Do not append managed hint, count, error
or warning IDs. Preserve the existing no-description return value.

A blocking error suppresses the warning reference according to the current
visibility rules; error and warning timing remain independently resolved.

The flat hint-channel boundary carries the already prepared hint/count order.
The final composer must not split that list to enforce an order on arbitrary
custom IDs.

### Identity publication

| Identity hint value    | Required result                                                                                        |
| ---------------------- | ------------------------------------------------------------------------------------------------------ |
| No identity, or `null` | Use the existing registry fallback and field-name filtering.                                           |
| `[]`                   | Use no registered hints or count-limit descriptions. Do not append counts through a separate fallback. |
| Non-empty list         | Use the published list in its supplied order, without appending registry hints or counts.              |

Publication of one channel must not change fallback in another channel.

### Rendering and ownership

Do not treat feedback eligibility as proof that a message exists in the DOM.
Preserve the current rendering gates and matching error/warning region IDs.
Do not add a blanket rule that descriptions must be visually visible.

Character counts retain their hidden limit-description policy. Visible count
text must remain exposed unless the existing linkage checks confirm an
accessible alternative. Manual standalone wiring remains available.

Pure factories remain unconditional transforms of supplied inputs. The
auto-ARIA shell retains manual-mode opt-out and existing render phasing.

## Implementation sequence

1. Characterize existing behavior with the regression cases below before
   changing composition.
2. Identify the exact repeated preparation/composition rules. Extract only
   those rules into the pure module, reusing the existing composer. Do not
   create an unused count API or move unrelated lifecycle code.
3. Wire the wrapper's preparation and the existing composition path to that
   policy owner. Retain the combined hint channel for auto-ARIA and identity.
4. Check existing direct factory consumers and custom-wrapper examples for
   compatibility. Update documentation that would otherwise describe an
   obsolete ownership boundary.
5. Apply the detailed acceptance and testing decisions in #760 as well as the
   cases below. Run the relevant checks from [Testing](../TESTING.md). Record
   the exact commands and results with the implementation.

If inspection shows a proposed extraction only relocates code and removes no
duplicated policy, report that finding before expanding scope. A new
abstraction is not evidence that the goal has been met.

## Acceptance and verification

| Scenario                                                     | Required assertion                                                                            |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| Author IDs, multiple hints, a count and an error             | Exact final order; matching IDs; no warning reference.                                        |
| Warning eligible without a blocking error                    | Warning reference follows the prepared hint/count list.                                       |
| Error and warning use different timing strategies            | Each follows its existing cascade; no premature reference.                                    |
| IDs repeat within or across inputs                           | With a resolved name, preserve duplicate authored IDs; skip a managed ID already in the list. |
| Field name is unresolved or empty                            | Return the preserved value verbatim; append no managed hint, count, error or warning IDs.     |
| No eligible descriptions                                     | Existing empty-result behavior is unchanged.                                                  |
| Identity hint value changes between `null`, `[]` and a list  | Exact fallback, suppression and publication behavior from the table above.                    |
| Custom published hint list                                   | Supplied relative order is unchanged, including IDs that resemble count IDs.                  |
| Registry descriptors target another field                    | Existing field filtering excludes them; untargeted descriptors retain current behavior.       |
| Hints or counts are added, removed or conditionally rendered | Description IDs update without stale references; existing ordering and cleanup remain intact. |
| Count-limit description is hidden but linked                 | Linkage and visible-count accessibility behavior remain unchanged.                            |
| Standalone count with manual wiring                          | Stable limit ID and existing manual linkage still work; no new automatic linkage.             |
| Manual ARIA mode                                             | The directive retains consumer ownership; direct factory composition still works.             |
| Fieldset and design-system bridge                            | Their distinct aggregation, rendering gates and ordering remain unchanged.                    |
| Existing custom-wrapper/direct-composition consumers         | Existing call shapes type-check and produce unchanged descriptions.                           |

Test pure ordering, deduplication and fallback in the existing composer and
hint-resolver specs. Add wrapper-level assertions for the preparation boundary;
testing only a new helper is insufficient.

Use the documented real-browser environment for rendered-region linkage and
count accessibility behavior. Exercise dynamic projection and removal at the
component boundary. Follow [the toolkit environment guidance](../TESTING.md)
when choosing between jsdom and browser specs.

The implementation must pass relevant unit tests, browser regressions, lint
and type checks. Verify exact attribute values and excluded references, not
only internal signal changes. Automated checks must not be presented as proof
of identical speech output across all screen readers.

## Platform guidance checked

- [MDN: aria-describedby](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-describedby):
  references identify same-document descriptions. Hidden elements can provide
  descriptions; plain-text descriptions differ from navigable rich content.
- Modern Web Guidance, retrieved on 2026-11-05: `forms`, `accessibility` and
  `accessible-error-announcement`. These support explicit description
  relationships and consistent accessible feedback. They do not prescribe a
  field-name registry or this toolkit's channel order.

The ordering and publication rules above are repository contracts, not claims
that MDN mandates this architecture. The guidance search reported that the
installed skill instructions were outdated; guidance was retrieved from the
latest command package.
