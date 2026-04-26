import { type Injector, type Signal } from '@angular/core';
import type {
  ErrorDisplayStrategy,
  ReactiveOrStatic,
  SubmittedStatus,
} from '../types';
import { assertInjector } from './assert-injector';
import type { ErrorVisibilityState } from './field-state-types';
import { injectFormContext } from './inject-form-context';
import {
  resolveStrategyFromContext,
  resolveSubmittedStatusFromContext,
} from './resolve-strategy';
import { createShowErrorsComputed } from './show-errors';
import { unwrapValue } from './unwrap-signal-or-value';

/**
 * Options for {@link createErrorVisibility}.
 *
 * Both `strategy` and `submittedStatus` are optional:
 * - Omit to inherit from form context (via DI) or fall back to `'on-touch'`.
 * - Pass a static value to hard-code the behaviour at the call site.
 * - Pass a signal to allow the behaviour to change reactively.
 */
export interface CreateErrorVisibilityOptions {
  /**
   * Error display strategy override.
   *
   * - Static `ErrorDisplayStrategy` — value is read on every computed
   *   evaluation but is stable, so the result does not change.
   * - `Signal<ErrorDisplayStrategy>` — tracked reactively.
   * - `undefined` / omitted — inherits from form context, then falls back to
   *   `'on-touch'`.
   */
  readonly strategy?: ErrorDisplayStrategy | Signal<ErrorDisplayStrategy>;

  /**
   * Explicit submission status.
   *
   * Only needed when using `'on-submit'` strategy without a parent
   * `[ngxSignalForm]` context that already supplies it. Accepts a static
   * value or a reactive signal.
   */
  readonly submittedStatus?:
    | SubmittedStatus
    | Signal<SubmittedStatus | undefined>;

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
 * `createShowErrorsComputed` that every consumer used to inline.
 *
 * ## What it does
 *
 * 1. Reads the nearest `[ngxSignalForm]` context via `inject()` (optional).
 * 2. Resolves the error display strategy: explicit opt → context → `'on-touch'`.
 * 3. Resolves the submission status: explicit opt → context → `undefined`.
 * 4. Delegates to {@link createShowErrorsComputed} and returns the resulting
 *    `Signal<boolean>`.
 *
 * No new logic is introduced — this is purely ergonomic glue over the
 * existing building blocks.
 *
 * ## When to use
 *
 * Use `createErrorVisibility` as the **recommended entry point** for
 * consumer-side error visibility wiring. The four building blocks remain
 * exported for advanced composition but are no longer the first choice.
 *
 * ## When NOT to use
 *
 * If you need to compose the strategy and/or submission status with
 * additional logic (e.g. a config-default cascade, a component preset
 * registry) reach for the individual building blocks instead.
 *
 * @param field Reactive or static field state. `null`/`undefined` values
 *   short-circuit the result to `false` — this is handled by the underlying
 *   {@link createShowErrorsComputed} building block.
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
 * @see {@link createShowErrorsComputed} Building block: reactive visibility computed
 * @see {@link shouldShowErrors} Building block: pure boolean evaluation
 *
 * @public
 */
export function createErrorVisibility(
  field: ReactiveOrStatic<Partial<ErrorVisibilityState> | null | undefined>,
  opts?: CreateErrorVisibilityOptions,
): Signal<boolean> {
  return assertInjector(createErrorVisibility, opts?.injector, () => {
    const formContext = injectFormContext();

    // Plain getter (not `computed()`): `createShowErrorsComputed` already runs
    // its body inside a `computed()`, so wrapping again would just add an
    // intermediate signal node. Reading `unwrapValue()` here keeps Signal
    // inputs reactive and context signal changes tracked.
    const resolvedStrategy = () => {
      const strategyValue =
        opts?.strategy !== undefined
          ? unwrapValue(opts.strategy as ReactiveOrStatic<ErrorDisplayStrategy>)
          : undefined;
      return resolveStrategyFromContext(strategyValue, formContext);
    };

    // Same pattern for submitted status.
    const resolvedSubmittedStatus = () => {
      const statusValue =
        opts?.submittedStatus !== undefined
          ? unwrapValue(
              opts.submittedStatus as ReactiveOrStatic<
                SubmittedStatus | undefined
              >,
            )
          : undefined;
      return resolveSubmittedStatusFromContext(statusValue, formContext);
    };

    return createShowErrorsComputed(
      field,
      resolvedStrategy,
      resolvedSubmittedStatus,
    );
  });
}
