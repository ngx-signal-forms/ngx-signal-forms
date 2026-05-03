import {
  computed,
  inject,
  Injectable,
  signal,
  type Signal,
} from '@angular/core';
import { NgxSpartanFormField } from './spartan-form-field';

/**
 * Wrapper-scoped replacement for Spartan brain's `BrnFieldA11yService`.
 *
 * ## Why this exists
 *
 * `[hlmInput]` declares `BrnFieldControlDescribedBy` as a host directive, and
 * that directive owns `aria-describedby` on the helm input host element via:
 *
 * ```ts
 * host: { '[attr.aria-describedby]': '_computedDescribedBy()' }
 * ```
 *
 * `_computedDescribedBy` reads from `BrnFieldA11yService.describedBy` (a
 * computed of internal description/error registries) and from the manual
 * `aria-describedby` input. In a NgControl-based reactive form, helm's own
 * label/hint/error directives populate the registries via
 * `registerDescription` / `registerError`; with Angular Signal Forms
 * (`[formField]`) the toolkit's auto-aria writes IDs directly to the host
 * element via `setAttribute`, but Brain's host binding wins on the next
 * change-detection tick and overwrites those writes (the manual input alias
 * `aria-describedby` does not observe DOM mutations).
 *
 * ## What it does
 *
 * The bridge is provided at the `<spartan-form-field>` component level —
 * because `BrnField` (the wrapper's host directive) provides
 * `BrnFieldA11yService` at the same element, and component-level providers
 * win over host-directive providers, this `useClass` registration replaces
 * Brain's empty service with one whose `describedBy` signal is fed from the
 * toolkit's `aria-describedby` composition exposed by
 * {@link NgxSpartanFormField}. `BrnFieldControlDescribedBy` then writes
 * the toolkit-managed IDs (hint / error / warning) onto the helm input host
 * element through its own host binding — no DOM tug-of-war.
 *
 * The `register*` methods keep their original behaviour and merge into the
 * same output, so any other Spartan helm primitive that registers a
 * description ID on the field still surfaces alongside the toolkit IDs. This
 * keeps the bridge a strict superset of Brain's contract rather than a
 * lossy replacement.
 */
// `BrnFieldA11yService` is exported as a concrete class with `private`
// fields (`_descriptions`, `_errors`), so `implements BrnFieldA11yService`
// would force this bridge to redeclare those as private members. That is
// strictly tighter than what DI requires — the token is matched by identity
// at runtime, not by structural compatibility — so we keep the public
// surface in lockstep without `implements` and rely on the unit + e2e
// specs to enforce the contract. The cast at the `useClass` provider site
// is unnecessary because `useClass: NgxSpartanAriaDescribedByBridge` is
// resolved against the token, not against the declared type.
@Injectable()
export class NgxSpartanAriaDescribedByBridge {
  readonly #wrapper = inject(NgxSpartanFormField);

  /**
   * Internal registries kept identical to Brain's `BrnFieldA11yService` so
   * downstream Spartan primitives that call `registerDescription` /
   * `registerError` (none today, but the contract is part of the public
   * surface) keep working transparently.
   */
  readonly #descriptions = signal<readonly string[]>([]);
  readonly #errors = signal<readonly string[]>([]);

  /**
   * IDs derived from the wrapper's toolkit composition
   * (`createAriaDescribedBySignal`). These are the hint / error / warning
   * IDs that {@link NgxSpartanFormField} produces from
   * `NGX_SIGNAL_FORM_HINT_REGISTRY` and the bound `FieldState`.
   */
  readonly #toolkitIds = computed<readonly string[]>(() => {
    const value = this.#wrapper.toolkitAriaDescribedBy();
    if (value === null || value.length === 0) return [];
    return value.split(/\s+/).filter(Boolean);
  });

  /**
   * Composed `aria-describedby` value with deduped insertion order:
   * toolkit-managed IDs first (hints, then error/warning), then any IDs
   * registered through the original Brain API. `BrnFieldControlDescribedBy`
   * additionally merges the manual `aria-describedby` input on the host.
   */
  readonly describedBy: Signal<string | null> = computed(() => {
    const ids = [
      ...this.#toolkitIds(),
      ...this.#descriptions(),
      ...this.#errors(),
    ].filter(Boolean);

    const unique = [...new Set(ids)];

    return unique.length > 0 ? unique.join(' ') : null;
  });

  registerDescription(id: string): void {
    this.#descriptions.update((ids) => (ids.includes(id) ? ids : [...ids, id]));
  }

  unregisterDescription(id: string): void {
    this.#descriptions.update((ids) => ids.filter((value) => value !== id));
  }

  registerError(id: string): void {
    this.#errors.update((ids) => (ids.includes(id) ? ids : [...ids, id]));
  }

  unregisterError(id: string): void {
    this.#errors.update((ids) => ids.filter((value) => value !== id));
  }
}
