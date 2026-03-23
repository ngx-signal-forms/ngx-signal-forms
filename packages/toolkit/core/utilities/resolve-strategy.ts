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
  if (inputStrategy !== undefined && inputStrategy !== 'inherit') {
    return inputStrategy;
  }

  if (contextStrategy !== undefined) {
    return contextStrategy;
  }

  if (configDefault !== undefined) {
    return configDefault;
  }

  return 'on-touch';
}
