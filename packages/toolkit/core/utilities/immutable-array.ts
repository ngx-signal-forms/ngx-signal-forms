/**
 * Immutable array update utilities for use with NgRx Signal Store.
 *
 * These helpers reduce nested spread boilerplate when updating
 * deeply nested arrays in immutable state.
 *
 * @example
 * ```typescript
 * import { updateAt, removeAt, insertAt } from '@ngx-signal-forms/toolkit';
 *
 * // Update item at index
 * const updated = updateAt(items, 2, (item) => ({ ...item, name: 'New' }));
 *
 * // Remove item at index
 * const removed = removeAt(items, 2);
 *
 * // Insert item at index
 * const inserted = insertAt(items, 1, newItem);
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
  return array.map((item, i) => (i === index ? updater(item) : item));
}

/**
 * Removes an item at a specific index from an array immutably.
 *
 * @param array - The source array
 * @param index - The index of the item to remove
 * @returns A new array without the item at the specified index
 *
 * @example
 * ```typescript
 * const items = ['a', 'b', 'c'];
 * const removed = removeAt(items, 1);
 * /// Result: ['a', 'c']
 * ```
 */
export function removeAt<T>(array: readonly T[], index: number): T[] {
  return array.filter((_, i) => i !== index);
}

/**
 * Inserts an item at a specific index in an array immutably.
 *
 * @param array - The source array
 * @param index - The index where the item should be inserted
 * @param item - The item to insert
 * @returns A new array with the item inserted at the specified index
 *
 * @example
 * ```typescript
 * const items = ['a', 'c'];
 * const inserted = insertAt(items, 1, 'b');
 * /// Result: ['a', 'b', 'c']
 * ```
 */
export function insertAt<T>(array: readonly T[], index: number, item: T): T[] {
  return [...array.slice(0, index), item, ...array.slice(index)];
}

/**
 * Appends an item to the end of an array immutably.
 *
 * @param array - The source array
 * @param item - The item to append
 * @returns A new array with the item appended
 *
 * @example
 * ```typescript
 * const items = ['a', 'b'];
 * const appended = append(items, 'c');
 * /// Result: ['a', 'b', 'c']
 * ```
 */
export function append<T>(array: readonly T[], item: T): T[] {
  return [...array, item];
}

/**
 * Prepends an item to the beginning of an array immutably.
 *
 * @param array - The source array
 * @param item - The item to prepend
 * @returns A new array with the item prepended
 *
 * @example
 * ```typescript
 * const items = ['b', 'c'];
 * const prepended = prepend(items, 'a');
 * /// Result: ['a', 'b', 'c']
 * ```
 */
export function prepend<T>(array: readonly T[], item: T): T[] {
  return [item, ...array];
}

/**
 * Moves an item from one index to another in an array immutably.
 *
 * @param array - The source array
 * @param fromIndex - The current index of the item
 * @param toIndex - The target index where the item should be moved
 * @returns A new array with the item moved to the target index
 *
 * @example
 * ```typescript
 * const items = ['a', 'b', 'c', 'd'];
 * const moved = moveItem(items, 0, 2);
 * /// Result: ['b', 'c', 'a', 'd']
 * ```
 */
export function moveItem<T>(
  array: readonly T[],
  fromIndex: number,
  toIndex: number,
): T[] {
  if (fromIndex === toIndex) return [...array];

  const result = [...array];
  const [item] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, item);
  return result;
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
