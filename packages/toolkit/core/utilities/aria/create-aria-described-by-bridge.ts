import { computed, signal, type Signal } from '@angular/core';

/**
 * Public surface of an `aria-describedby` bridge.
 *
 * This shape is the structural superset most design-system a11y services
 * adopt: a reactive `describedBy` value plus a registration API for
 * description and error IDs that downstream design-system primitives may
 * register imperatively (labels, hints, etc.).
 *
 * Brain's `BrnFieldA11yService` matches this shape. Wrapping the bridge
 * behind this typed contract lets a future toolkit consumer assert that a
 * design-system service it intends to swap can be replaced — without
 * pulling in a runtime dependency on the design-system itself.
 *
 * @public
 */
export interface AriaDescribedByBridge {
  /**
   * Composed `aria-describedby` value (toolkit-managed IDs first, then any
   * IDs registered via `register*`). `null` when nothing has accumulated,
   * mirroring the directive-friendly "drop the attribute" convention.
   */
  readonly describedBy: Signal<string | null>;

  registerDescription(id: string): void;
  unregisterDescription(id: string): void;
  registerError(id: string): void;
  unregisterError(id: string): void;
}

/**
 * Inputs for {@link createAriaDescribedByBridge}.
 *
 * @public
 */
export interface CreateAriaDescribedByBridgeOptions {
  /**
   * Toolkit-managed `aria-describedby` value. Typically the output of
   * {@link import('./create-aria-described-by-signal').createAriaDescribedBySignal}
   * but any `Signal<string | null>` works (a space-separated id list, or
   * `null` when no toolkit-owned IDs apply).
   */
  readonly toolkit: Signal<string | null>;
}

/**
 * Creates a wrapper-scoped bridge that lets a design-system a11y service
 * (e.g. Spartan brain's `BrnFieldA11yService`) consume the toolkit's
 * `aria-describedby` composition.
 *
 * ## Why this exists
 *
 * Design-system primitives that own `aria-describedby` via a host binding
 * fed by an injectable a11y service (Spartan's `BrnFieldA11yService` is the
 * motivating case) overwrite any direct DOM writes the toolkit's auto-aria
 * makes on the next change-detection tick. The fix is to provide a custom
 * a11y service at the wrapper's component-level injector that reads from
 * the toolkit's composition, then let the design-system's host binding
 * write the toolkit-managed IDs onto the bound element.
 *
 * Wrapper authors register the bridge with `useFactory` (or `useClass`
 * around a thin subclass) at the wrapper component-level — component-scope
 * providers win over host-directive providers, so the bridge replaces the
 * design-system's default service without forking the design-system.
 *
 * The bridge's `describedBy` signal merges the toolkit composition with
 * any IDs registered via `register*` so any other DS primitive that
 * registers a description or error id keeps working transparently. It is
 * a strict superset of the typical DS contract, not a lossy replacement.
 *
 * @example Spartan brain integration
 * ```ts
 * import { BrnFieldA11yService } from '@spartan-ng/brain/field';
 * import {
 *   createAriaDescribedByBridge,
 *   createAriaDescribedBySignal,
 * } from '@ngx-signal-forms/toolkit/headless';
 *
 * @Component({
 *   selector: 'spartan-form-field[ngxSpartanFormField]',
 *   providers: [
 *     {
 *       provide: BrnFieldA11yService,
 *       useFactory: () => createAriaDescribedByBridge({
 *         toolkit: inject(SpartanFormField).toolkitAriaDescribedBy,
 *       }),
 *     },
 *   ],
 * })
 * export class SpartanFormField {
 *   readonly toolkitAriaDescribedBy = createAriaDescribedBySignal({ ... });
 * }
 * ```
 *
 * @public
 */
export function createAriaDescribedByBridge(
  options: CreateAriaDescribedByBridgeOptions,
): AriaDescribedByBridge {
  const { toolkit } = options;

  const descriptions = signal<readonly string[]>([]);
  const errors = signal<readonly string[]>([]);

  const toolkitIds = computed<readonly string[]>(() => {
    const value = toolkit();
    if (value === null || value.length === 0) return [];
    return value.split(/\s+/).filter(Boolean);
  });

  const describedBy = computed<string | null>(() => {
    const merged = [...toolkitIds(), ...descriptions(), ...errors()].filter(
      Boolean,
    );
    if (merged.length === 0) return null;
    const unique = [...new Set(merged)];
    return unique.join(' ');
  });

  return {
    describedBy,
    registerDescription(id: string): void {
      descriptions.update((ids) => (ids.includes(id) ? ids : [...ids, id]));
    },
    unregisterDescription(id: string): void {
      descriptions.update((ids) => ids.filter((value) => value !== id));
    },
    registerError(id: string): void {
      errors.update((ids) => (ids.includes(id) ? ids : [...ids, id]));
    },
    unregisterError(id: string): void {
      errors.update((ids) => ids.filter((value) => value !== id));
    },
  };
}
