import { isSignal } from '@angular/core';
import type { ReactiveOrStatic } from '../types';

/**
 * Unwraps a `ReactiveOrStatic<T>` value to get the actual value of type `T`.
 *
 * ## What does it do?
 * Extracts the static value from reactive (Signal/function) or static inputs,
 * handling all three input types transparently.
 *
 * ## When to use it?
 * Use `unwrapValue()` when you need to:
 * - Get the actual value from a `ReactiveOrStatic<T>` parameter
 * - Work with the concrete value inside `computed()` or `effect()`
 * - Convert flexible inputs into usable values
 *
 * ## How does it work?
 * The function checks the input type and unwraps accordingly:
 * 1. **Signal** (`signal()` or `computed()`) → Calls the signal to get the value
 * 2. **Function** (`() => T`) → Calls the function to get the value
 * 3. **Static value** (`T`) → Returns the value directly
 *
 * ## Why use this instead of manual checks?
 * - Type-safe: Properly narrows `ReactiveOrStatic<T>` to `T`
 * - Consistent: Handles all three cases with proper Angular signal detection
 * - Maintainable: Centralized unwrapping logic with proper type assertions
 *
 * @template T The type of the unwrapped value
 * @param value - The reactive or static value to unwrap
 * @returns The unwrapped value of type `T`
 *
 * @example Unwrapping different input types
 * ```typescript
 * const staticValue = 'on-touch';
 * const signalValue = signal('on-touch');
 * const fnValue = () => 'on-touch';
 *
 * unwrapValue(staticValue);  // 'on-touch' (returned directly)
 * unwrapValue(signalValue);  // 'on-touch' (signal called)
 * unwrapValue(fnValue);      // 'on-touch' (function called)
 * ```
 *
 * @example Inside a computed signal
 * ```typescript
 * function computeShowErrors<T>(
 *   field: ReactiveOrStatic<FieldState<T>>,
 *   strategy: ReactiveOrStatic<ErrorDisplayStrategy>
 * ): Signal<boolean> {
 *   return computed(() => {
 *     // Unwrap to get actual values inside computed
 *     const fieldState = unwrapValue(field);
 *     const strategyValue = unwrapValue(strategy);
 *
 *     // Now work with concrete values
 *     return fieldState.invalid() && strategyValue === 'immediate';
 *   });
 * }
 * ```
 *
 * @example Component input unwrapping
 * ```typescript
 * @Component({...})
 * export class MyComponent {
 *   readonly strategy = input<ReactiveOrStatic<ErrorDisplayStrategy>>('on-touch');
 *
 *   protected readonly actualStrategy = computed(() =>
 *     unwrapValue(this.strategy())
 *   );
 * }
 * ```
 *
 * @see {@link ReactiveOrStatic} The type this function unwraps
 */
export function unwrapValue<T>(value: ReactiveOrStatic<T>): T {
  // SignalLike is Signal<T> | (() => T), so check both cases
  if (isSignal(value)) {
    // isSignal returns true for Signal<unknown>, cast to get correct type
    return (value as () => T)();
  }

  // If it's a function but not a Signal, it must be () => T
  if (typeof value === 'function') {
    // Type assertion needed because TypeScript can't narrow SignalLike properly
    return (value as () => T)();
  }

  // Otherwise it's a static value of type T
  return value as T;
}
