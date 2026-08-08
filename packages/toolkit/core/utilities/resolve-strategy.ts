import type {
  ErrorDisplayStrategy,
  ResolvedErrorDisplayStrategy,
  ResolvedWarningDisplayStrategy,
  SubmittedStatus,
  WarningDisplayStrategy,
} from '../types';
import type { NgxSignalFormContext } from '../directives/ngx-signal-form';

type StrategyInput = ErrorDisplayStrategy | null | undefined;
type WarningStrategyInput = WarningDisplayStrategy | null | undefined;

const isSet = <T>(value: T | null | undefined): value is T =>
  value !== null && value !== undefined;

export function resolveErrorDisplayStrategy(
  inputStrategy: StrategyInput,
  contextStrategy?: ResolvedErrorDisplayStrategy | null,
  configDefault?: ResolvedErrorDisplayStrategy | null,
): ResolvedErrorDisplayStrategy {
  if (isSet(inputStrategy) && inputStrategy !== 'inherit') {
    return inputStrategy;
  }

  if (isSet(contextStrategy)) {
    return contextStrategy;
  }

  if (isSet(configDefault)) {
    return configDefault;
  }

  return 'on-touch';
}

/**
 * Resolves the warning display strategy from an input value, context, and config default.
 * This is the warning-specific counterpart to `resolveErrorDisplayStrategy`.
 *
 * Cascade order (four tiers):
 * 1. explicit input strategy (if not 'inherit')
 * 2. form context's warning strategy
 * 3. config default warning strategy
 * 4. terminal fallback 'on-touch'
 */
export function resolveWarningStrategy(
  inputStrategy: WarningStrategyInput,
  contextStrategy?: ResolvedWarningDisplayStrategy | null,
  configDefault?: ResolvedWarningDisplayStrategy | null,
): ResolvedWarningDisplayStrategy {
  if (isSet(inputStrategy) && inputStrategy !== 'inherit') {
    return inputStrategy;
  }

  if (isSet(contextStrategy)) {
    return contextStrategy;
  }

  if (isSet(configDefault)) {
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
 * Resolves the warning display strategy from a component/directive's input,
 * falling back to form context, then to the config default.
 *
 * This is the warning-specific counterpart to `resolveStrategyFromContext`.
 * It ensures warnings follow their own independent cascade, separate from errors.
 */
export function resolveWarningStrategyFromContext(
  inputStrategy: WarningDisplayStrategy | undefined,
  formContext: NgxSignalFormContext | undefined,
  configDefault?: ResolvedWarningDisplayStrategy | null,
): ResolvedWarningDisplayStrategy {
  const contextStrategy = formContext?.warningStrategy();
  return resolveWarningStrategy(inputStrategy, contextStrategy, configDefault);
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
