import { type ErrorDisplayStrategy, type ReactiveOrStatic } from '../types';
import { unwrapValue } from './unwrap-signal-or-value';

type StrategyInput = ReactiveOrStatic<ErrorDisplayStrategy> | null | undefined;

export function resolveErrorDisplayStrategy(
  inputStrategy: StrategyInput,
  contextStrategy?: ErrorDisplayStrategy | null,
  configDefault?: ReactiveOrStatic<ErrorDisplayStrategy> | null,
): ErrorDisplayStrategy {
  if (inputStrategy !== undefined && inputStrategy !== null) {
    const resolved = unwrapValue(inputStrategy);
    if (resolved !== 'inherit') {
      return resolved;
    }
  }

  if (contextStrategy !== undefined && contextStrategy !== null) {
    if (contextStrategy !== 'inherit') {
      return contextStrategy;
    }
  }

  if (configDefault !== undefined && configDefault !== null) {
    const resolvedDefault = unwrapValue(configDefault);
    if (resolvedDefault !== 'inherit') {
      return resolvedDefault;
    }
  }

  return 'on-touch';
}
