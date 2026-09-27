# ADR-0015: Hints Stay Visible While an Error Shows

## Status

Accepted

## Date

2026-09-27

## Context

Issue [#521](https://github.com/ngx-signal-forms/ngx-signal-forms/issues/521), a follow-up to [#500](https://github.com/ngx-signal-forms/ngx-signal-forms/issues/500).

`NgxFormFieldWrapper` hid a field's hint through two mechanisms whenever the field carried a blocking error or warning:

1. A CSS rule set `--ngx-form-field-hint-display: none` on the host, which `ngx-form-field-hint` reads for its own `display`.
2. The wrapper's template additionally set `[style.display] = 'none'` directly on the hint's projection slot — the mechanism that actually collapsed the hint from layout; the CSS variable was a secondary, documented coordination hook for consumers who style `ngx-form-field-hint` directly outside that slot.

The hint's id stayed in `aria-describedby` either way, so a screen reader still read it. A sighted user did not: the format instructions disappeared right when the error said the value did not match them (WCAG 2.2 SC 3.3.2, Labels or Instructions).

## Decision

### 1. The hint stays visible by default

Both mechanisms now gate on the same condition: `presentation.showErrors() || presentation.showWarnings()` (a message is actually visible, respecting each strategy's own timing) **and** the new opt-in described below. `presentation.renderMessageSlot()` — which also mounts the message renderer — is deliberately not the gate: it opens whenever the error strategy allows messages on a field that has any, including a warning-only field whose warning is not yet shown (for example `warningStrategy="on-submit"` before submit). Gating on it would have hidden the hint while nothing was visible yet. Without the opt-in, neither mechanism fires, and the hint renders in its normal position — after the error in the wrapper's assistive row (the error renders first in that row; this ADR does not change layout). `aria-describedby` order is unchanged — the hint id already came before the error id, and still does.

### 2. Hiding is opt-in, through a wrapper input and a config key

`NgxFormFieldWrapper` gets a `hideHintOnError` input (`boolean | undefined`, using a `booleanAttribute`-based transform so an _unset_ attribute or binding stays `undefined` instead of coercing to `false` — the config fallback below only applies to `undefined`). Unset, it falls back to `NgxSignalFormsConfig.hideHintOnError`, which defaults to `false`. The name matches the existing `showMarkerWhen` input / config pair for its fallback order (input, then config, then default) — `showMarkerWhen` itself is a string union (`'required' | 'optional' | 'none'`), not a boolean; `hideHintOnError` is the boolean-shaped counterpart in that same family of presentation switches.

Setting either restores the old behavior: the wrapper adds a host class that both mechanisms key off, and the hint hides while the field's error or warning is actually visible.

A CSS token override was considered and rejected — see Alternatives.

The Angular Material reference wrapper (`apps/demo-material`) is unaffected: it renders through Material's own `<mat-error>`/`<mat-hint>` components, which keep Material's native error/hint swap regardless of this toolkit default.

## Consequences

- Every consumer on the default config sees hints and errors together after this upgrade. Layouts that assumed the hint disappeared may need to accommodate both lines — this is the breaking change the release notes call out.
- A consumer who wants the old single-message behavior sets `hideHintOnError: true` once, globally or per field, and gets it back exactly as before.
- `aria-describedby` composition, hint ids, and the CSS variable name (`--ngx-form-field-hint-display`) are all unchanged; only the condition under which the wrapper applies both hiding mechanisms changed.

## Alternatives Considered

**Keep it a CSS token override** (e.g. document that consumers set `--ngx-form-field-hint-display` themselves). Rejected: the issue brief asks for a documented public switch, not a CSS token, because a token is easy to miss, does not show up in autocomplete for component inputs, and cannot be validated or defaulted per the toolkit's config cascade the way an input/config key can.

**Only a config key, no wrapper input.** Rejected: every other wrapper presentation choice (`appearance`, `orientation`, `showMarkerWhen`) is available at both levels, so a single field can differ from the app default. Hint visibility should follow the same pattern.

## Related

- [ADR-0012](0012-error-summary-announces-alone.md) — another #500 follow-up that added a config-driven opt-out for a default behavior change.
- Issue [#521](https://github.com/ngx-signal-forms/ngx-signal-forms/issues/521), [#500](https://github.com/ngx-signal-forms/ngx-signal-forms/issues/500).
