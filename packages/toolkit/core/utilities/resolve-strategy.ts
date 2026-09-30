import type {
  ErrorDisplayStrategy,
  ResolvedErrorDisplayStrategy,
  ResolvedWarningDisplayStrategy,
  SubmittedStatus,
  WarningDisplayStrategy,
} from '../types';
import type { NgxSignalFormContext } from '../directives/ngx-signal-form';
import { createCascadingResolver } from './cascading-resolver';

/**
 * Resolves a display strategy through the shared cascade. The error and
 * warning channels use the same union, so one helper serves both.
 *
 * Cascade order (three tiers, plus a terminal fallback):
 * 1. explicit input strategy (if not `'inherit'`)
 * 2. form context's strategy
 * 3. config default strategy
 * 4. terminal fallback `'on-touch'`
 */
function resolveCascade<T extends ResolvedErrorDisplayStrategy>(
  inputStrategy: T | 'inherit' | null | undefined,
  contextStrategy: T | null | undefined,
  configDefault: T | null | undefined,
): T {
  return createCascadingResolver<T>({
    input: inputStrategy === 'inherit' ? null : inputStrategy,
    context: contextStrategy,
    configDefault,
    fallback: 'on-touch' as T,
  });
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
  return resolveCascade<ResolvedErrorDisplayStrategy>(
    inputStrategy,
    formContext?.errorStrategy(),
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
  return resolveCascade<ResolvedWarningDisplayStrategy>(
    inputStrategy,
    formContext?.warningStrategy(),
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
