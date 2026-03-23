import type {
  ErrorDisplayStrategy,
  ResolvedErrorDisplayStrategy,
} from '../types';

type StrategyInput = ErrorDisplayStrategy | null | undefined;

export function resolveErrorDisplayStrategy(
  inputStrategy: StrategyInput,
  contextStrategy?: ResolvedErrorDisplayStrategy | null,
  configDefault?: ResolvedErrorDisplayStrategy | null,
): ResolvedErrorDisplayStrategy {
  if (inputStrategy != null && inputStrategy !== 'inherit') {
    return inputStrategy;
  }

  if (contextStrategy != null) {
    return contextStrategy;
  }

  if (configDefault != null) {
    return configDefault;
  }

  return 'on-touch';
}
