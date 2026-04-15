import type {
  ErrorDisplayStrategy,
  ResolvedErrorDisplayStrategy,
  SubmittedStatus,
} from '../types';
import type { NgxSignalFormContext } from '../directives/ngx-signal-form.directive';

type StrategyInput = ErrorDisplayStrategy | null | undefined;

// `!= null` (intentional loose equality) is the idiomatic "neither null nor
// undefined" nullish check. Rewriting to explicit `!== null && !== undefined`
// bloats a hot path for zero semantic change. The three oxlint-disable lines
// below freeze this check for v1; behavior must not change.
export function resolveErrorDisplayStrategy(
  inputStrategy: StrategyInput,
  contextStrategy?: ResolvedErrorDisplayStrategy | null,
  configDefault?: ResolvedErrorDisplayStrategy | null,
): ResolvedErrorDisplayStrategy {
  // oxlint-disable-next-line eqeqeq -- intentional nullish check, see comment above
  if (inputStrategy != null && inputStrategy !== 'inherit') {
    return inputStrategy;
  }

  // oxlint-disable-next-line eqeqeq -- intentional nullish check, see comment above
  if (contextStrategy != null) {
    return contextStrategy;
  }

  // oxlint-disable-next-line eqeqeq -- intentional nullish check, see comment above
  if (configDefault != null) {
    return configDefault;
  }

  return 'on-touch';
}

/**
 * Resolves the error display strategy from a component/directive's input,
 * falling back to form context, then to the default.
 *
 * This eliminates the repeated pattern across directives/components that
 * each implement their own `#resolvedStrategy` computed with the same logic.
 */
export function resolveStrategyFromContext(
  inputStrategy: ErrorDisplayStrategy | undefined,
  formContext: NgxSignalFormContext | undefined,
  configDefault?: ResolvedErrorDisplayStrategy | null,
): ResolvedErrorDisplayStrategy {
  const contextStrategy = formContext?.errorStrategy();
  return resolveErrorDisplayStrategy(
    inputStrategy,
    contextStrategy,
    configDefault,
  );
}

/**
 * Resolves the submitted status from a component/directive's input,
 * falling back to form context.
 *
 * This eliminates the repeated pattern across directives/components that
 * each implement their own `#resolvedSubmittedStatus` computed with the same logic.
 */
export function resolveSubmittedStatusFromContext(
  inputStatus: SubmittedStatus | undefined,
  formContext: NgxSignalFormContext | undefined,
): SubmittedStatus | undefined {
  if (inputStatus !== undefined) return inputStatus;
  return formContext?.submittedStatus();
}
