import { linkedSignal, type WritableSignal } from '@angular/core';

/**
 * Configuration for {@link delegatedStoreField}.
 */
export type DelegatedStoreFieldConfig<T> = {
  /**
   * Reactive read seam. Returns the current store slice. Wrapped in a
   * `linkedSignal` so reads stay reactive to the store — an external store
   * mutation flows back into the field.
   */
  source: () => T;
  /**
   * Write seam. Receives the next value the form wants to commit and is
   * expected to push it straight into the store (e.g. via `patchState`).
   * There is no draft/commit buffer: this runs on every `set`/`update`.
   */
  write: (value: T) => void;
};

/**
 * Builds a genuine `WritableSignal<T>` that a Signal Form `form()` model can
 * bind to, where:
 *
 * - **reads** come from a `linkedSignal({ source, computation })` seam, so the
 *   field stays reactive to the backing store, and
 * - **writes** are delegated straight back to the store through `config.write`
 *   (typically `patchState`), with no local draft buffer.
 *
 * ## Why the override is necessary on Angular 22.0.0-rc.x
 *
 * On rc.x, the `WritableSignal` returned by `linkedSignal({ source,
 * computation })` is writable, but its `.set` / `.update` only mutate the
 * **local** linked value — they do **not** propagate back to `source`. So a
 * plain `linkedSignal` handle would silently swallow form edits.
 *
 * This helper therefore overrides `set` and `update` to call `config.write`
 * first (the store becomes the source of truth), then mirrors the value into
 * the local linked signal so synchronous reads are consistent before change
 * detection re-pulls from the store.
 *
 * ## 22.1 follow-up
 *
 * Angular [PR #68708](https://github.com/angular/angular/pull/68708)
 * (`target: minor`, ships in **22.1+**) adds a native custom-`set` overload to
 * `linkedSignal`. Once the workspace is on >= 22.1 this entire helper can be
 * deleted and replaced with that built-in `set`. ngxtension's `writableSlice`
 * and ngrx's reverted `delegatedSignal` (ngrx
 * [#5157](https://github.com/ngrx/platform/pull/5157)) both converge on the
 * same native overload.
 */
export function delegatedStoreField<T>(
  config: DelegatedStoreFieldConfig<T>,
): WritableSignal<T> {
  // Reactive read seam: re-evaluates whenever the store slice changes.
  const linked = linkedSignal<T, T>({
    source: config.source,
    computation: (slice: T): T => slice,
  });

  const originalSet = linked.set.bind(linked);

  // Override set: delegate the write to the store, then mirror locally so a
  // synchronous read right after set() is already consistent.
  linked.set = (value: T): void => {
    config.write(value);
    originalSet(value);
  };

  // update() is expressed in terms of the (overridden) set() so the same
  // write-through path is guaranteed.
  linked.update = (updateFn: (value: T) => T): void => {
    linked.set(updateFn(linked()));
  };

  return linked;
}
