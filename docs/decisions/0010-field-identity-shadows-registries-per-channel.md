# ADR-0010: Field Identity Shadows the Fallback Registries Per Channel

## Status

Accepted

## Date

2026-08-17

## Context

Issue [#387](https://github.com/ngx-signal-forms/ngx-signal-forms/issues/387) asked whether `NgxFieldIdentity`'s `set*` writers should become the supported surface for third-party wrapper authors. Answering it exposed a defect one layer down.

`NgxFieldIdentity` carries several independent channels: the resolved field name, the bound control's element and layout visibility, the hint IDs correlated to the field, and the wrapper's resolved error and warning display strategies. Two of those channels have a registry-based public equivalent that any surface inside a form can publish to:

| Channel                        | Fallback registry                                  |
| ------------------------------ | -------------------------------------------------- |
| hint IDs                       | `NGX_SIGNAL_FORM_HINT_REGISTRY`                    |
| error / warning display timing | `NGX_SIGNAL_FORM_FIELD_VISIBILITY_REGISTRY`        |
| field name                     | — (no equivalent; derived from the control's `id`) |

Both consumers of those fallbacks tested for the **presence of the service**, not for a published value:

- `createHintIdsSignal` returned `identity.hintIds()` whenever an identity was passed, before consulting the registry at all.
- `NgxSignalFormAutoAria` skipped the visibility-registry lookup entirely whenever `NgxFieldIdentity` was injectable.

That was invisible in practice because `NgxFormFieldWrapper` was the only thing that ever provided an identity, and it drives every channel on every render. There was no such thing as a partially-driven identity, so "the service exists" and "this channel is published" were the same statement.

They stop being the same statement the moment anything else provides an identity — which is exactly what #387 set out to allow. A third-party wrapper that adopts `NgxFieldIdentity` to fix its field naming would, by the mere act of providing it, switch its own hints and its own field-level strategy overrides off the registries and onto the ambient form context. Adopting the new capability would silently cost adopters two working ones.

## Decision

**Resolution is per channel. A channel is owned by the identity only when the identity has published a value for it. Consumers must never branch on whether `NgxFieldIdentity` is injectable.**

Each channel therefore needs a state that means "never published", distinct from every legitimate resolved value:

- `resolvedErrorStrategy` and `resolvedWarningStrategy` already had one — they are `null` until `setResolvedStrategies` runs. No type change; the call sites changed from testing the service to testing the value.
- `hintIds` did not. It was `readonly string[]`, initialized to `[]`, which conflated "nobody published hints" with "this field genuinely has no hints". It is now `readonly string[] | null`:
  - `null` — unpublished. Consumers fall through to the hint registry exactly as they would with no identity at all.
  - `[]` — published, and this field has no hints. Authoritative; the registry is not consulted.

The error and warning channels resolve **independently of each other**, per [ADR-0007](0007-warning-display-timing-cascade.md). An identity that publishes an error strategy but not a warning strategy leaves warnings to the registry. Deciding both from one test would reintroduce the cross-channel coupling ADR-0007 removed.

The `set*` writers stay `@internal` and stay stripped from the published `.d.ts`. This ADR is about how _readers_ resolve, not about who is allowed to write.

## Consequences

- **Breaking, on a public read surface.** `NgxFieldIdentity.hintIds` widens to `readonly string[] | null`. `NgxFieldIdentity` is published from the root entry point; the structural type `HintIdsIdentityLike` widens with it and is published from `@ngx-signal-forms/toolkit/headless` only — the `core` barrel it also lives in is a build-time-only source barrel that `strip-internal-exports.mjs` removes from the published `exports` map. Anything reading `identity.hintIds()` directly must handle `null`. `createHintIdsSignal` still _returns_ a non-null `Signal<readonly string[]>` — it coalesces internally — so consumers who go through the factory are unaffected, which is every wrapper in this repo.
- `NgxFieldIdentity.describedBy` treats the unpublished state as "no IDs", so it stays `string | null` and its behavior is unchanged.
- `setHintIds([])` is now a meaningful claim rather than a no-op: it is how a driver says "I own this channel and there is nothing in it".
- `NgxFormFieldWrapper` behavior is unchanged. It publishes every channel on every render, so it takes the same branch it always did.
- This is a prerequisite for shipping any public way to provide an identity. Without it, the facade would be a foot-gun on arrival.

## Alternatives Considered

**Keep presence-based shadowing and require drivers to publish every channel.** Rejected. It makes the cheapest useful case — a wrapper that only wants to fix its field name — the most expensive one, forcing authors to re-derive strategy and hint state they have no reason to own. It also fails silently: forget a channel and you get subtly wrong ARIA, not an error.

**Use a separate "published" boolean per channel.** Rejected as redundant. Two of the three channels already encode it in their value, and a parallel set of flags is one more thing that can disagree with the data it describes.

**Make `hintIds` stay `readonly string[]` and add `hasPublishedHints`.** Rejected for the same reason, and because it leaves the misleading `[]` default in place for anyone who reads only the array.

## Related

- [ADR-0007](0007-warning-display-timing-cascade.md) — the independence of the error and warning cascades, which this ADR must preserve per channel.
- [ADR-0005](0005-aria-primitives-as-factories.md) — why `createHintIdsSignal` is a pure factory that consumers thread DI-resolved values into, which is what makes the coalescing possible in one place.
- Issue [#387](https://github.com/ngx-signal-forms/ngx-signal-forms/issues/387).
