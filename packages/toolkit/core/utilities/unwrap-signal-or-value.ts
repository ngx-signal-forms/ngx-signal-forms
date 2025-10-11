import { isSignal } from '@angular/core';
import type { SignalOrValue } from '../types';

/**
 * Unwraps a SignalOrValue to get the actual value.
 *
 * Handles three cases:
 * 1. Signal<T> - calls signal() to get value
 * 2. () => T - calls function to get value
 * 3. T - returns value directly
 *
 * @template T The type of the value
 * @param value - The SignalOrValue to unwrap
 * @returns The unwrapped value
 *
 * @example
 * ```typescript
 * const staticValue = 'on-touch';
 * const signalValue = signal('on-touch');
 * const fnValue = () => 'on-touch';
 *
 * unwrapSignalOrValue(staticValue);  // 'on-touch'
 * unwrapSignalOrValue(signalValue);  // 'on-touch'
 * unwrapSignalOrValue(fnValue);      // 'on-touch'
 * ```
 */
export function unwrapSignalOrValue<T>(value: SignalOrValue<T>): T {
  // Check if it's a Signal using Angular's isSignal helper
  if (isSignal(value)) {
    return value();
  }

  // Check if it's a function (zero-argument function returning T)
  if (typeof value === 'function') {
    return (value as () => T)();
  }

  // It's a static value
  return value as T;
}
