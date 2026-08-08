# ADR-0007: Separate Warning Display Timing Cascade

## Status

Accepted

## Date

2026-08-08

## Context

Issue [#264](https://github.com/ngx-signal-forms/ngx-signal-forms/issues/264) identified that warning display timing was not properly decoupled from error display timing. Prior to this change, warnings in some components (notably `NgxHeadlessFieldset`) would inherit the error display strategy, causing them to be hidden behind the same gates as blocking errors (`'on-touch'` or `'on-submit'`). This defeated the purpose of warnings as advisory messages that should typically be visible immediately to guide users while they type.

The toolkit already had a `warningStrategy` input on `NgxFormFieldError` and `NgxFormFieldWrapper` with a default of `'immediate'`, but:

1. The cascade for resolving warning strategy was not consistent across all components
2. There was no form-level `warningStrategy` input on `NgxSignalForm`
3. There was no global `defaultWarningStrategy` configuration option
4. `NgxHeadlessFieldset` used a single internal "show" signal for both errors and warnings, so warnings inherited the error strategy

This meant that in a form with `errorStrategy="on-submit"`, fieldset-level warnings would also be hidden until submit, unlike wrapper-level warnings which defaulted to immediate.

## Decision

Introduce a **separate, independent cascade for warning display strategy** that mirrors the error cascade but with different defaults and terminal fallback.

### Warning Strategy Resolution Cascade

The warning display strategy is resolved through **four tiers**, in order of priority:

```
1. Explicit input (component-level) → `warningStrategy` input on the component/directive
2. Form context → `warningStrategy()` from `NGX_SIGNAL_FORM_CONTEXT` (provided by `NgxSignalForm`)
3. Config default → `NGX_SIGNAL_FORMS_CONFIG.defaultWarningStrategy`
4. Terminal fallback → `'immediate'`
```

This cascade is **independent** from the error strategy cascade. Errors default to `'on-touch'`, warnings default to `'immediate'`.

### New Configuration Option

Add `defaultWarningStrategy` to `NgxSignalFormsConfig`:

```typescript
interface NgxSignalFormsConfig {
  // ... existing properties
  /**
   * Default warning display strategy.
   * @default 'immediate'
   */
  defaultWarningStrategy: ResolvedWarningDisplayStrategy;
}
```

The default value is `'immediate'` (defined in `DEFAULT_NGX_SIGNAL_FORMS_CONFIG.defaultWarningStrategy`).

### New Form-Level Input

Add `warningStrategy` input to `NgxSignalForm` directive:

```typescript
@Directive({
  selector: 'form[formRoot][ngxSignalForm]',
  // ...
})
export class NgxSignalForm {
  /**
   * Warning display strategy for this form.
   * Overrides the global default for all fields in this form.
   *
   * Typed as ResolvedWarningDisplayStrategy (not WarningDisplayStrategy)
   * because 'inherit' is a field-level-only value.
   */
  readonly warningStrategy = input<
    ResolvedWarningDisplayStrategy | null | undefined
  >();

  /**
   * Resolved warning display strategy (form-level or global default).
   */
  protected readonly resolvedWarningStrategy = computed(() => {
    const formStrategy = this.warningStrategy();
    if (formStrategy !== undefined && formStrategy !== null) {
      return formStrategy;
    }
    return this.#config.defaultWarningStrategy;
  });
}
```

### New Utility Function

Add `shouldShowWarnings()` function in `error-strategies.ts`:

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

This mirrors `shouldShowErrors()` but checks for warnings presence instead of invalid state.

### New Resolution Function

Add `resolveWarningStrategyFromContext()` in `resolve-strategy.ts`:

```typescript
export function resolveWarningStrategyFromContext(
  inputStrategy: WarningDisplayStrategy | undefined,
  formContext: NgxSignalFormContext | undefined,
  configDefault?: ResolvedWarningDisplayStrategy | null,
): ResolvedWarningDisplayStrategy {
  const contextStrategy = formContext?.warningStrategy();
  return resolveWarningStrategy(inputStrategy, contextStrategy, configDefault);
}
```

### Component Updates

#### NgxFormFieldWrapper

- Add `effectiveWarningStrategy` computed using `resolveWarningStrategyFromContext()`
- Add `shouldShowWarnings` computed using the new `shouldShowWarnings()` function
- Update `shouldRenderErrorSlot` to render when either errors OR warnings should show
- Pass `warningStrategy` input to the projected error renderer

#### NgxHeadlessFieldset / NgxFormFieldset

- Use `resolveWarningStrategyFromContext()` for warning strategy resolution
- `shouldShowWarnings()` is no longer suppressed when blocking errors are visible
- Warning strategy defaults to `'immediate'` directly (not inheriting from error strategy)

## Consequences

### Positive

1. **Consistency**: All components now use the same cascade logic for warnings
2. **Flexibility**: Developers can configure warning timing at app, form, or field level
3. **Better UX**: Warnings default to `'immediate'` so users see advisory guidance while typing
4. **Separation of concerns**: Error timing and warning timing are fully independent
5. **Backward compatibility**: Existing code continues to work; the new config option has a sensible default

### Negative

1. **Slight complexity increase**: There are now two parallel cascades to understand (errors and warnings)
2. **Potential for confusion**: Developers must remember that `defaultWarningStrategy` is separate from `defaultErrorStrategy`

### Neutral

1. **Migration**: No breaking changes; existing code works without modification

## Alternatives Considered

### Alternative 1: Make warnings inherit error strategy by default

**Rejected** because it defeats the purpose of warnings. Users need to see advisory messages like "consider 12+ characters" while typing, not after submit. This was the original problem identified in issue #264.

### Alternative 2: Only add form-level warningStrategy, no config default

**Rejected** because it would require every app that wants a non-'immediate' default to configure each form individually. The config-level default allows setting a consistent policy across an entire application.

### Alternative 3: Use a single strategy input that applies to both errors and warnings

**Rejected** because it removes the ability to have different timing for errors vs warnings, which is the core value proposition. The whole point is that warnings should typically be immediate while errors are often gated.

## Related

- Issue [#264](https://github.com/ngx-signal-forms/ngx-signal-forms/issues/264): Warning display timing with separate warning cascade
- PR [#288](https://github.com/ngx-signal-forms/ngx-signal-forms/pull/288): feat(toolkit): implement issue #264
- ADR-0006: One cascade seam — visibility timing is composed once, never inlined (applies to both errors and warnings)
- `WARNINGS_SUPPORT.md`: Updated to document the new cascade and configuration options

## Notes

The implementation follows the same patterns established by ADR-0006 for error strategy resolution. The warning cascade uses the same utility functions (`createCascadingResolver`) and follows the same injection pattern.

The terminal fallback for warnings is `'immediate'`, whereas for errors it is `'on-touch'`. This difference reflects the different semantics:

- Errors are blocking and WCAG recommends not showing them until the user has had a chance to interact (`'on-touch'`)
- Warnings are advisory and provide the most value when shown immediately as the user types

However, both can be overridden at any tier of the cascade, so applications that want warnings to follow the same timing as errors can set `defaultWarningStrategy: 'on-touch'` or use `warningStrategy="inherit"` at the field level.
