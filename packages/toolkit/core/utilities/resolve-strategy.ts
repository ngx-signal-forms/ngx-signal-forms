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
  if (
    inputStrategy !== undefined &&
    inputStrategy !== null &&
    inputStrategy !== 'inherit'
  ) {
    return inputStrategy;
  }

  if (contextStrategy !== undefined && contextStrategy !== null) {
    return contextStrategy;
  }

  if (configDefault !== undefined && configDefault !== null) {
    return configDefault;
  }

  return 'on-touch';
}
