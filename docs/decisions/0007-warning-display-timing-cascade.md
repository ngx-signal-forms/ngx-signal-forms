# ADR-0007: Separate Warning Display Timing Cascade

## Status

Accepted

## Date

2026-08-08

## Context

Issue [#264](https://github.com/ngx-signal-forms/ngx-signal-forms/issues/264) identified that warning display timing was not properly decoupled from error display timing. `warningStrategy="inherit"` resolved to **two different values** depending on the surface, and neither matched the documented behaviour:

| Site                               | Passed `configDefault`? | Result with no form context |
| ---------------------------------- | ----------------------- | --------------------------- |
| `form-field/form-field-wrapper.ts` | ❌                      | `'on-touch'`                |
| `headless/src/lib/fieldset.ts`     | ❌                      | `'on-touch'`                |
| `assistive/form-field-error.ts`    | ✅                      | `defaultErrorStrategy`      |

All three routed through `resolveErrorDisplayStrategy`, so every tier of the "warning" cascade reached into the **error** channel. `NgxHeadlessFieldset` went further and shared a single internal "show" signal between errors and warnings, so a fieldset under `errorStrategy="on-submit"` hid its warnings until submit.

Fixing this correctly required settling what a warning _is_, because the resolver's terminal value is a semantic choice, not an implementation detail.

### The model

Three channels, three timing rules:

| Channel     | When shown                  | Rationale                                     |
| ----------- | --------------------------- | --------------------------------------------- |
| **Hint**    | Always                      | Guidance about what to enter. Never gated.    |
| **Warning** | `'on-touch'` (configurable) | A quality judgement on an _acceptable_ value. |
| **Error**   | `'on-touch'` (configurable) | A blocking constraint violation.              |

Errors and warnings are **never visible together** — a blocking error suppresses the warning live region entirely (see `create-aria-described-by-signal.ts`). So a warning only ever appears on a field that is currently acceptable. It is not a weaker error; it is a comment on a value that will submit fine (weak-but-valid password, `.co` where `.com` was meant, a legal-but-deprecated format).

That is why warning timing must be _independent_ of error timing — not why it must be _earlier_.

## Decision

Introduce a **separate, independent cascade for warning display strategy** that mirrors the error cascade tier for tier, with its own terminal value. No tier of either cascade reaches into the other channel.

### Warning Strategy Resolution Cascade

```text
1. Explicit input (component-level) → `warningStrategy` input on the component/directive
2. Form context → `warningStrategy()` from `NGX_SIGNAL_FORM_CONTEXT` (provided by `NgxSignalForm`)
3. Config default → `NGX_SIGNAL_FORMS_CONFIG.defaultWarningStrategy`
4. Terminal fallback → `'on-touch'`
```

### Why the terminal is `'on-touch'`

A warning is a judgement about a **complete** value, and on an incomplete value that judgement is meaningless — "weak password" after 3 of 12 characters is noise. This is the same reasoning that produced the platform's `:user-invalid` pseudo-class, which defers invalidity styling until the user commits by blur or submit.

There is also a concrete accessibility failure mode with immediate warnings. While typing, a field flips valid → invalid → valid, so the warning appears, is suppressed by the blocking error, then reappears. That churn lands in a `role="status"` **polite live region**, the worst possible place for it.

`'immediate'` remains fully reachable as _configuration_ at every tier, because it is genuinely right for some fields — a live password-strength meter is the canonical case. Keeping it configurable is about expressiveness; the terminal value is about what is correct when nobody has decided.

### New Configuration Option

Add `defaultWarningStrategy` to `NgxSignalFormsConfig`:

```typescript
interface NgxSignalFormsConfig {
  // ... existing properties
  /**
   * Default warning display strategy.
   * @default 'on-touch'
   */
  defaultWarningStrategy: ResolvedWarningDisplayStrategy;
}
```

The default is `'on-touch'`, defined in `DEFAULT_NGX_SIGNAL_FORMS_CONFIG.defaultWarningStrategy`.

### New Form-Level Input

Add a `warningStrategy` input to the `NgxSignalForm` directive, typed `ResolvedWarningDisplayStrategy` (not `WarningDisplayStrategy`) because `'inherit'` is a field-level-only value — there is nothing above the form root to inherit from. It falls back to `NGX_SIGNAL_FORMS_CONFIG.defaultWarningStrategy` when unset, and is exposed on `NgxSignalFormContext` as `warningStrategy()`.

### New Utility Function

Add `shouldShowWarnings()` in `error-strategies.ts`:

```typescript
export function shouldShowWarnings(
  hasWarnings: boolean,
  isTouched: boolean,
  strategy: ResolvedWarningDisplayStrategy,
  submittedStatus: SubmittedStatus,
): boolean {
  const hasSubmitted = submittedStatus !== 'unsubmitted';

  switch (strategy) {
    case 'immediate':
      return hasWarnings;
    case 'on-touch':
      return hasWarnings && isTouched;
    case 'on-submit':
      return hasWarnings && hasSubmitted;
    default:
      return hasWarnings && isTouched;
  }
}
```

This mirrors `shouldShowErrors()` but gates on warning _presence_ rather than the field's invalid state, since warnings are non-blocking and never make a field invalid.

### New Resolution Functions

Add `resolveWarningStrategy()` and `resolveWarningStrategyFromContext()` in `resolve-strategy.ts`. These deliberately do **not** delegate to `resolveErrorDisplayStrategy` — sharing that implementation is exactly how the terminal value became an accident rather than a decision, even though both currently terminate at `'on-touch'`.

### Component Updates

All three surfaces route through the single resolver, so a fourth copy cannot drift (finding **C1** of the [toolkit audit](https://github.com/ngx-signal-forms/ngx-signal-forms/issues/262)):

- **`NgxHeadlessErrorState`** owns the resolution and exposes `shouldShowWarnings`, timed independently of `shouldShowErrors`.
- **`NgxFormFieldError`** drops its private context/config injection and forwards `warningStrategy` to the headless directive via `hostDirectives`.
- **`NgxFormFieldWrapper`** adds `effectiveWarningStrategy` and a `shouldShowWarnings` computed, and mounts the error renderer when errors **or** warnings should show — otherwise a warnings-only field never renders at all while `strategy` gates the blocking-error timing.
- **`NgxHeadlessFieldset` / `NgxFormFieldset`** resolve via the warning cascade, and `shouldShowWarnings()` is no longer suppressed merely because `shouldShowErrors()` is true. The redundant `?? 'on-touch'` at the fieldset's error-strategy call site is removed, since the shared resolver already supplies that terminal.

### Keeping `aria-describedby` in lockstep

Splitting the cascades exposed a latent coupling in `NgxSignalFormAutoAria`, which composes the control's `aria-describedby`. It gated **both** the `${fieldName}-error` and `${fieldName}-warning` ids on one `createErrorVisibility()` signal, and read only the ambient form context. That was invisible while the channels shared a strategy. Once they can diverge it breaks in both directions:

- a **missing** reference — `errorStrategy="on-submit"` with `warningStrategy="immediate"` renders a visible warning that nothing points at, so AT never reaches the text (WCAG 1.3.1)
- a **dangling** reference — a wrapper-level `strategy` override that renders _less_ than the form implies leaves an id pointing at no element (axe `aria-valid-attr-value`)

Two changes close it:

1. `NgxSignalFormAutoAria` resolves warning visibility through the warning cascade, and `createAriaDescribedBySignal` takes an optional `warningVisibility` (defaulting to `visibility`, so pre-existing callers are unaffected).
2. `NgxFormFieldWrapper` publishes both **fully-resolved** strategies through `NgxFieldIdentity.setResolvedStrategies()`, and auto-aria prefers them over the form context. The identity service is already the wrapper→auto-aria channel for field name, hint ids, and control visibility; field-level strategy is the same kind of fact.

The invariant to preserve in future work: **a rendered region must be referenced, and a suppressed one must not be.** Blocking-error precedence still applies — a visible error suppresses both the warning region and its id.

## Consequences

### Positive

1. **Consistency**: all surfaces resolve warnings through one cascade
2. **Flexibility**: warning timing is configurable at app, form, and field level
3. **Correct default**: warnings judge complete values, so they wait for blur or submit
4. **No live-region churn**: the polite region no longer flickers while typing
5. **Separation of concerns**: neither cascade can reach into the other channel

### Negative

1. **Behaviour change**: warnings previously documented as defaulting to `'immediate'` now default to `'on-touch'`. Apps relying on immediate warnings must set `defaultWarningStrategy: 'immediate'` or `warningStrategy="immediate"`.
2. **Slight complexity increase**: two parallel cascades to understand
3. **Potential for confusion**: `defaultWarningStrategy` is separate from `defaultErrorStrategy`

The workspace is at `1.0.0-rc.11` and v1.0.0 has never shipped — every release to date is a pre-release — so there is no backwards-compatibility obligation. The correct behaviour was chosen over the compatible one.

## Alternatives Considered

### Alternative 1: Keep the `'immediate'` terminal

**Rejected.** The argument for it — "users need guidance while typing" — does not survive the observation that errors and warnings are never visible together. A warning on an incomplete value is a judgement about a value the user has not finished writing, and its churn in a polite live region is an accessibility regression. Fields that genuinely want it (strength meters) opt in explicitly.

### Alternative 2: Make warnings inherit the error strategy

**Rejected.** This is the defect in issue #264. It couples two independent decisions and means `defaultErrorStrategy: 'on-submit'` silently hides advisory guidance.

### Alternative 3: Only add form-level `warningStrategy`, no config default

**Rejected.** Every app wanting a non-default policy would configure each form individually.

### Alternative 4: A single strategy input applying to both channels

**Rejected.** It removes the ability to time errors and warnings differently, which is the core value proposition.

## Related

- Issue [#264](https://github.com/ngx-signal-forms/ngx-signal-forms/issues/264): Warning display timing with separate warning cascade
- Issue [#262](https://github.com/ngx-signal-forms/ngx-signal-forms/issues/262): toolkit audit — finding C1 (call sites bypassing the visibility seam)
- PR [#288](https://github.com/ngx-signal-forms/ngx-signal-forms/pull/288): feat(toolkit): implement issue #264
- ADR-0006: One cascade seam — visibility timing is composed once, never inlined (applies to both errors and warnings)
- `WARNINGS_SUPPORT.md`: documents the cascade and configuration options

## Notes

The warning cascade is hand-written in `resolve-strategy.ts` alongside the error cascade rather than built on `createCascadingResolver` (used by the field-labels and control-semantics providers). Those resolvers cascade _values_ through injector hierarchies; this one cascades a strategy through input → form context → config, which is a different shape. Aligning them is a candidate follow-up under ADR-0006's "one cascade seam" goal, not a prerequisite here.

Both cascades currently terminate at `'on-touch'`. That is a coincidence of two independent decisions, not a shared constant — errors terminate there because WCAG discourages flagging invalidity before the user has interacted, warnings because a judgement on an incomplete value is meaningless. The implementations stay separate so that changing one never silently moves the other.
