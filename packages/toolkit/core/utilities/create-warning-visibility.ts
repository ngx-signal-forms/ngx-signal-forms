import { computed, type Injector, type Signal } from '@angular/core';
import type {
  ReactiveOrStatic,
  ResolvedWarningDisplayStrategy,
  SubmittedStatus,
  WarningDisplayStrategy,
} from '../types';
import { assertInjector } from './assert-injector';
import { shouldShowWarnings } from './error-strategies';
import type { WarningVisibilityState } from './field-state-types';
import { injectFormContext } from './inject-form-context';
import { readDirectErrors } from './read-direct-errors';
import {
  resolveSubmittedStatusFromContext,
  resolveWarningStrategyFromContext,
} from './resolve-strategy';
import { unwrapValue } from './unwrap-signal-or-value';
import { isWarningError } from './warning-error';

/**
 * Options for {@link createWarningVisibility}.
 *
 * Mirrors `CreateErrorVisibilityOptions` tier for tier, with two additions
 * the warning channel needs: a presence override for surfaces that aggregate
 * warnings from elsewhere, and the blocking-error visibility that suppresses
 * the warning region (ADR-0007).
 */
export interface CreateWarningVisibilityOptions {
  /**
   * Warning display strategy override.
   *
   * - Static `WarningDisplayStrategy` — read on every evaluation but stable.
   * - `Signal<WarningDisplayStrategy | undefined>` — tracked reactively.
   * - `undefined` / omitted — inherits from the form context's
   *   `warningStrategy()`, then `opts.configDefault`, then `'on-touch'`.
   *
   * No tier reaches into the error channel (ADR-0007).
   */
  readonly strategy?:
    | WarningDisplayStrategy
    | Signal<WarningDisplayStrategy | undefined>
    | undefined;

  /**
   * Explicit submission status. Only needed for the `'on-submit'` strategy
   * without a parent `[ngxSignalForm]` context that already supplies it.
   */
  readonly submittedStatus?:
    | SubmittedStatus
    | Signal<SubmittedStatus | undefined>
    | undefined;

  /**
   * Fallback strategy consulted when both `strategy` and the ambient form
   * context resolve to nothing. Typically the caller's own
   * `NGX_SIGNAL_FORMS_CONFIG.defaultWarningStrategy`. Opt-in for the same
   * reason as the error seam's `configDefault`: most callers run inside a
   * form context and never observe the difference.
   */
  readonly configDefault?: ResolvedWarningDisplayStrategy | null;

  /**
   * Warning-presence override.
   *
   * By default presence is read from the field state's own `errors()` —
   * any error whose `kind` starts with `warn:`. Surfaces that collect
   * warnings from somewhere else pass their own presence signal, or `true`
   * when they apply the presence gate downstream. `NgxHeadlessFieldset` is
   * the second case: its warnings live on member fields rather than on the
   * fieldset's own `errors()`, and `createFieldsetAggregation` already
   * returns `showWarnings() && hasWarnings()`.
   */
  readonly hasWarnings?: ReactiveOrStatic<boolean>;

  /**
   * Whether a blocking error is currently visible on the **same field**.
   * While it reads `true` the warning stays hidden: errors and warnings are
   * never shown together, so a warning only ever appears on a field whose
   * value is currently acceptable (ADR-0007).
   *
   * Omitted means "no blocking error competes for this region". Aggregate
   * surfaces (`NgxHeadlessFieldset`, `NgxHeadlessErrorSummary`) leave it
   * omitted on purpose — they span a subtree, and a blocking error on one
   * member field must not silence a warning on a sibling.
   */
  readonly errorVisibility?: ReactiveOrStatic<boolean>;

  /**
   * Optional injector for use outside an Angular injection context (e.g.
   * unit tests, `runInInjectionContext` wrappers).
   */
  // Angular's Injector is inherently mutable; Readonly<Injector> is not practical here.
  // oxlint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Angular's Injector is mutable by design
  readonly injector?: Injector;
}

/**
 * One-shot factory for warning-visibility wiring — the warning channel's
 * counterpart to `createErrorVisibility()` (ADR-0006's one cascade seam,
 * ADR-0007's independent warning cascade).
 *
 * ## What it does
 *
 * 1. Reads the nearest `[ngxSignalForm]` context via `inject()` (optional).
 * 2. Resolves the warning display strategy: explicit opt → context
 *    `warningStrategy()` → `opts.configDefault` → `'on-touch'`.
 * 3. Resolves the submission status: explicit opt → context → `'unsubmitted'`.
 * 4. Applies the **presence** rule — warnings gate on `warn:` errors being
 *    present, not on `invalid()`, because a warning never makes a field
 *    invalid on its own.
 * 5. Applies the **suppression** rule — a visible blocking error on the same
 *    field hides the warning (`opts.errorVisibility`).
 *
 * ## When NOT to use
 *
 * Reach for `resolveWarningStrategyFromContext()` + `shouldShowWarnings()`
 * directly when a surface needs the resolved strategy as public API, or
 * composes the presence check into a larger pipeline of its own.
 *
 * @param field Reactive or static field state. Nullish values short-circuit
 *   the result to `false`.
 * @param opts Optional overrides; all properties are optional.
 * @returns A computed `Signal<boolean>` that is `true` when the warning
 *   region should be shown.
 *
 * @example Inside a component (auto-consumes form context via DI)
 * ```typescript
 * readonly showWarnings = createWarningVisibility(
 *   computed(() => this.formField()()),
 * );
 * ```
 *
 * @example Per-field surface, with blocking errors taking precedence
 * ```typescript
 * readonly showWarnings = createWarningVisibility(this.fieldState, {
 *   strategy: this.warningStrategy,
 *   configDefault: this.config.defaultWarningStrategy,
 *   errorVisibility: this.errorsVisible,
 * });
 * ```
 *
 * @see {@link createErrorVisibility} The blocking-error counterpart
 * @see {@link resolveWarningStrategyFromContext} Building block: warning cascade
 * @see {@link shouldShowWarnings} Building block: pure boolean evaluation
 *
 * @group Reactive Primitives
 *
 * @public
 */
export function createWarningVisibility(
  field: ReactiveOrStatic<Partial<WarningVisibilityState> | null | undefined>,
  opts?: CreateWarningVisibilityOptions,
): Signal<boolean> {
  return assertInjector(createWarningVisibility, opts?.injector, () => {
    const formContext = injectFormContext();

    return computed(() => {
      const fieldState = unwrapValue(field);

      const errorsVisible =
        opts?.errorVisibility === undefined
          ? false
          : unwrapValue(opts.errorVisibility);

      // A visible blocking error owns the message region; the warning waits
      // until the value is acceptable again (ADR-0007).
      if (errorsVisible) return false;

      // `readDirectErrors` tolerates a missing or non-array `errors()`, which
      // matters for the partial field states custom controls and tests pass.
      const hasWarnings =
        opts?.hasWarnings === undefined
          ? readDirectErrors(fieldState).some(isWarningError)
          : unwrapValue(opts.hasWarnings);

      const isTouched = fieldState?.touched?.() ?? false;

      const strategyValue =
        opts?.strategy === undefined
          ? undefined
          : unwrapValue<WarningDisplayStrategy | undefined>(opts.strategy);

      const statusValue =
        opts?.submittedStatus === undefined
          ? undefined
          : unwrapValue<SubmittedStatus | undefined>(opts.submittedStatus);

      return shouldShowWarnings(
        hasWarnings,
        isTouched,
        resolveWarningStrategyFromContext(
          strategyValue,
          formContext,
          opts?.configDefault,
        ),
        resolveSubmittedStatusFromContext(statusValue, formContext) ??
          'unsubmitted',
      );
    });
  });
}
