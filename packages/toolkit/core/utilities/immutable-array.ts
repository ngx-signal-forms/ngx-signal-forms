/**
 * Immutable array update utilities for use with NgRx Signal Store.
 *
 * These helpers reduce nested spread boilerplate when updating
 * deeply nested arrays in immutable state.
 *
 * @example
 * ```typescript
 * import { updateAt, updateNested } from '@ngx-signal-forms/toolkit';
 *
 * // Update item at index
 * const updated = updateAt(items, 2, (item) => ({ ...item, name: 'New' }));
 *
 * // Update nested item
 * const nested = updateNested(items, 0, 'children', 1, (child) => ({ ...child }));
 * ```
 *
 * @packageDocumentation
 */

/**
 * Updates an item at a specific index in an array immutably.
 *
 * @param array - The source array
 * @param index - The index of the item to update
 * @param updater - A function that receives the current item and returns the updated item
 * @returns A new array with the updated item
 *
 * @example
 * ```typescript
 * const users = [{ name: 'Alice' }, { name: 'Bob' }];
 * const updated = updateAt(users, 1, (user) => ({ ...user, name: 'Robert' }));
 * /// Result: [{ name: 'Alice' }, { name: 'Robert' }]
 * ```
 */
export function updateAt<T>(
  array: readonly T[],
  index: number,
  updater: (item: T) => T,
): T[] {
  assertValidIndex(index, array.length, 'updateAt');
  return array.map((item, i) => (i === index ? updater(item) : item));
}

function assertValidIndex(
  index: number,
  length: number,
  operation: string,
): void {
  if (!Number.isInteger(index) || index < 0 || index >= length) {
    throw new RangeError(
      `[ngx-signal-forms] ${operation} index ${index} is out of bounds for length ${length}`,
    );
  }
}

/**
 * Updates nested items in an array using a path of indices and property keys.
 * Useful for deeply nested form arrays.
 *
 * @param array - The source array
 * @param index - The index of the parent item
 * @param nestedKey - The property key of the nested array
 * @param nestedIndex - The index within the nested array
 * @param updater - A function that receives the nested item and returns the updated item
 * @returns A new array with the nested item updated
 *
 * @example
 * ```typescript
 * interface Destination {
 *   name: string;
 *   activities: { name: string }[];
 * }
 *
 * const destinations: Destination[] = [
 *   { name: 'Paris', activities: [{ name: 'Louvre' }, { name: 'Eiffel' }] }
 * ];
 *
 * const updated = updateNested(
 *   destinations, 0, 'activities', 1,
 *   (activity) => ({ ...activity, name: 'Eiffel Tower' })
 * );
 * ```
 */
export function updateNested<T extends Record<K, U[]>, K extends keyof T, U>(
  array: readonly T[],
  index: number,
  nestedKey: K,
  nestedIndex: number,
  updater: (item: U) => U,
): T[] {
  return updateAt(array, index, (parent) => ({
    ...parent,
    [nestedKey]: updateAt(parent[nestedKey], nestedIndex, updater),
  }));
}
