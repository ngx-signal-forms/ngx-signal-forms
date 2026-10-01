import { computed, type Injector, type Signal } from '@angular/core';
import type {
  ErrorDisplayStrategy,
  NgxReactiveOrStatic,
  ResolvedErrorDisplayStrategy,
  SubmittedStatus,
} from '../types';
import { assertInjector } from './assert-injector';
import { createDevWarnOnce } from './dev-warn-once';
import { shouldShowErrors } from './error-strategies';
import type { ErrorVisibilityState } from './field-state-types';
import { injectFormContext } from './inject-form-context';
import {
  resolveStrategyFromContext,
  resolveSubmittedStatusFromContext,
} from './resolve-strategy';
import { unwrapValue } from './unwrap-signal-or-value';

/**
 * Options for {@link createErrorVisibility}.
 *
 * Both `strategy` and `submittedStatus` are optional:
 * - Omit `strategy` to inherit from form context (via DI), then
 *   `opts.configDefault` (when supplied), then fall back to `'on-touch'`.
 * - Pass a static value to hard-code the behaviour at the call site.
 * - Pass a signal to allow the behaviour to change reactively.
 */
export interface CreateErrorVisibilityOptions {
  /**
   * Error display strategy override.
   *
   * - Static `ErrorDisplayStrategy` — value is read on every computed
   *   evaluation but is stable, so the result does not change.
   * - `Signal<ErrorDisplayStrategy | undefined>` — tracked reactively.
   * - `undefined` / omitted — inherits from form context, then falls back to
   *   `opts.configDefault` (when supplied), then `'on-touch'`.
   */
  readonly strategy?:
    | ErrorDisplayStrategy
    | Signal<ErrorDisplayStrategy | undefined>
    | undefined;

  /**
   * Explicit submission status.
   *
   * Only needed when using `'on-submit'` strategy without a parent
   * `[ngxSignalForm]` context that already supplies it. Accepts a static
   * value or a reactive signal.
   */
  readonly submittedStatus?:
    | SubmittedStatus
    | Signal<SubmittedStatus | undefined>
    | undefined;

  /**
   * Fallback strategy consulted when both `strategy` and the ambient form
   * context resolve to nothing (i.e. no `[ngxSignalForm]` host is present).
   * Typically the caller's own `NGX_SIGNAL_FORMS_CONFIG.defaultErrorStrategy`.
   *
   * Deliberately opt-in rather than auto-injected, so this generic
   * primitive does not read the global config behind a caller's back.
   * Callers that must match the visible message when no form context
   * exists (`NgxSignalFormAutoAria`, the headless package's standalone
   * factories) inject the config themselves and pass it through here.
   */
  readonly configDefault?: ResolvedErrorDisplayStrategy | null;

  /**
   * Optional injector for use outside an Angular injection context (e.g.
   * unit tests, `runInInjectionContext` wrappers). When omitted the function
   * must be called inside a DI context.
   */
  // Angular's Injector is inherently mutable; Readonly<Injector> is not practical here.
  // oxlint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Angular's Injector is mutable by design
  readonly injector?: Injector;
}

/**
 * One-shot factory for error-visibility wiring.
 *
 * Replaces the four-step manual composition of
 * `resolveStrategyFromContext` → `resolveSubmittedStatusFromContext` →
 * the visibility computed that every in-tree consumer now routes through
 * this seam instead of inlining (ADR-0006) — `NgxHeadlessErrorState`,
 * `NgxHeadlessFieldset`, `createErrorState()`, `NgxFormFieldWrapper`,
 * `NgxSignalFormAutoAria`, `createAriaInvalidSignal`,
 * `createErrorMessageSignal()`, and `NgxHeadlessErrorSummary`.
 *
 * ## What it does
 *
 * 1. Reads the nearest `[ngxSignalForm]` context via `inject()` (optional).
 * 2. Resolves the error display strategy: explicit opt → context →
 *    `opts.configDefault` (when supplied) → `'on-touch'`.
 * 3. Resolves the submission status: explicit opt → context → `undefined`.
 * 4. Evaluates the visibility timing predicate and returns a reactive
 *    `Signal<boolean>`.
 *
 * This is the single composition point for the visibility cascade. It owns
 * the reactive computed and its missing-submission-status diagnostic while
 * delegating strategy evaluation to the shared pure predicate.
 *
 * ## When to use
 *
 * Use `createErrorVisibility` as the **recommended entry point** for
 * consumer-side error visibility wiring. The lower-level resolution and
 * predicate helpers remain exported for advanced composition but are no
 * longer the first choice.
 *
 * ## When NOT to use
 *
 * If you need to compose the strategy and/or submission status with logic
 * beyond a flat config-default fallback (e.g. a component preset registry,
 * a multi-tier cascade) reach for the individual building blocks instead.
 *
 * @param field Reactive or static field state. `null`/`undefined` values
 *   short-circuit the result to `false` — this is handled by the visibility
 *   computation inside this factory.
 * @param opts Optional overrides; all properties are optional.
 * @returns A computed `Signal<boolean>` that is `true` when the strategy says
 *   errors should be visible.
 *
 * @example Inside a component (auto-consumes form context via DI)
 * ```typescript
 * @Component({ ... })
 * export class MyFieldComponent {
 *   readonly formField = input.required<FieldTree<string>>();
 *
 *   // Reads strategy + submission status from the nearest [ngxSignalForm] context.
 *   readonly showErrors = createErrorVisibility(
 *     computed(() => this.formField()()),
 *   );
 * }
 * ```
 *
 * @example With an explicit strategy override
 * ```typescript
 * readonly showErrors = createErrorVisibility(
 *   computed(() => this.formField()()),
 *   { strategy: 'immediate' },
 * );
 * ```
 *
 * @example With a reactive strategy signal
 * ```typescript
 * readonly strategy = input<ErrorDisplayStrategy>('on-touch');
 *
 * readonly showErrors = createErrorVisibility(
 *   computed(() => this.formField()()),
 *   { strategy: this.strategy },
 * );
 * ```
 *
 * @example Outside DI (tests / standalone utilities)
 * ```typescript
 * const showErrors = createErrorVisibility(fieldState, {
 *   strategy: 'on-touch',
 *   injector: TestBed.inject(Injector),
 * });
 * ```
 *
 * @see {@link resolveStrategyFromContext} Building block: strategy cascade
 * @see {@link resolveSubmittedStatusFromContext} Building block: submitted-status cascade
 * @see {@link shouldShowErrors} Building block: pure boolean evaluation
 *
 * @public
 */
export function createErrorVisibility(
  field: NgxReactiveOrStatic<Partial<ErrorVisibilityState> | null | undefined>,
  opts?: CreateErrorVisibilityOptions,
): Signal<boolean> {
  return assertInjector(createErrorVisibility, opts?.injector, () => {
    const formContext = injectFormContext();

    // Plain getters keep signal inputs and context changes tracked by the
    // computed below without introducing intermediate signal nodes.
    //
    // The explicit `<ErrorDisplayStrategy | undefined>` parameter accepts
    // both the static `ErrorDisplayStrategy` branch and the
    // `Signal<ErrorDisplayStrategy | undefined>` branch without a cast —
    // it is the union of what `opts.strategy` can yield once unwrapped.
    const resolvedStrategy = () => {
      const strategyValue =
        opts?.strategy === undefined
          ? undefined
          : unwrapValue<ErrorDisplayStrategy | undefined>(opts.strategy);
      return resolveStrategyFromContext(
        strategyValue,
        formContext,
        opts?.configDefault,
      );
    };

    // Same pattern for submitted status.
    const resolvedSubmittedStatus = () => {
      const statusValue =
        opts?.submittedStatus === undefined
          ? undefined
          : unwrapValue<SubmittedStatus | undefined>(opts.submittedStatus);
      return resolveSubmittedStatusFromContext(statusValue, formContext);
    };

    const warnOnce = createDevWarnOnce();

    return computed(() => {
      const fieldState = unwrapValue(field);
      const strategyValue = resolvedStrategy();
      const statusValue = resolvedSubmittedStatus();
      const isInvalid = fieldState?.invalid?.() ?? false;
      const isTouched = fieldState?.touched?.() ?? false;
      const resolvedStatus = statusValue ?? 'unsubmitted';
      const concreteStrategy: ResolvedErrorDisplayStrategy = strategyValue;

      if (concreteStrategy === 'on-submit' && statusValue === undefined) {
        warnOnce(
          'warn',
          "[ngx-signal-forms] createErrorVisibility(): 'on-submit' strategy requires an explicit submittedStatus signal. " +
            "Without it, errors will never surface. Wire the status from NgxSignalForm ('ngxSignalForm') or pass submittedStatus explicitly.",
        );
      }

      return shouldShowErrors(
        isInvalid,
        isTouched,
        concreteStrategy,
        resolvedStatus,
      );
    });
  });
}
