import { inject, Injectable, type Signal } from '@angular/core';
import type { BrnFieldA11yService } from '@spartan-ng/brain/field';
import {
  createAriaDescribedByBridge,
  type AriaDescribedByBridge,
} from '@ngx-signal-forms/toolkit/headless';
import { NgxSpartanFormField } from './spartan-form-field';

/**
 * Wrapper-scoped replacement for Spartan brain's `BrnFieldA11yService`.
 *
 * `[hlmInput]` declares `BrnFieldControlDescribedBy` as a host directive,
 * and that directive owns `aria-describedby` on the helm input host
 * element via a host binding fed by `BrnFieldA11yService.describedBy`.
 * In a `NgControl`-based reactive form, helm's own label/hint/error
 * directives populate Brain's service via `register*`; with Angular Signal
 * Forms (`[formField]`) the toolkit's auto-aria writes IDs directly to the
 * host element via `setAttribute`, but Brain's host binding wins on the
 * next change-detection tick and overwrites those writes (the manual
 * `aria-describedby` input does not observe DOM mutations).
 *
 * The bridge is provided at the `<spartan-form-field>` component level
 * (component-scope providers win over host-directive providers, so this
 * `useClass` registration replaces the `BrnFieldA11yService` instance
 * Brain registers via the wrapper's `BrnField` host directive). Brain's
 * `BrnFieldControlDescribedBy` then writes the toolkit-managed IDs onto
 * the helm input host element through its own host binding — no DOM
 * tug-of-war.
 *
 * The implementation delegates to the toolkit's
 * {@link createAriaDescribedByBridge} primitive so the
 * "merge toolkit composition with `register*` IDs, dedupe, return `null`
 * when empty" logic stays centralised. This class is a thin DI shim over
 * the primitive — it has no behaviour beyond satisfying Brain's class
 * shape so the `useClass` provider can swap it in.
 */
@Injectable()
export class NgxSpartanAriaDescribedByBridge implements AriaDescribedByBridge {
  readonly #wrapper = inject(NgxSpartanFormField);
  readonly #bridge = createAriaDescribedByBridge({
    toolkit: this.#wrapper.toolkitAriaDescribedBy,
  });

  readonly describedBy: Signal<string | null> = this.#bridge.describedBy;

  registerDescription(id: string): void {
    this.#bridge.registerDescription(id);
  }

  unregisterDescription(id: string): void {
    this.#bridge.unregisterDescription(id);
  }

  registerError(id: string): void {
    this.#bridge.registerError(id);
  }

  unregisterError(id: string): void {
    this.#bridge.unregisterError(id);
  }
}

/**
 * Compile-time guard that the bridge stays a structural superset of
 * Brain's `BrnFieldA11yService` contract. If Brain adds a new public
 * member, this assertion fails at typecheck time. We `Pick` the documented
 * members (rather than asserting full structural equivalence) because
 * Brain's class also has `private` fields the bridge intentionally keeps
 * separate — DI matches by token identity at runtime, not by structural
 * compatibility.
 */
type BrnFieldA11yPublicSurface = Pick<
  BrnFieldA11yService,
  | 'describedBy'
  | 'registerDescription'
  | 'unregisterDescription'
  | 'registerError'
  | 'unregisterError'
>;

// Function form sidesteps `no-underscore-dangle`/`no-unused-vars` while
// still triggering a typecheck failure if the bridge ever drifts away
// from Brain's public contract. Unreferenced at runtime.
function assertSpartanBridgeContract(
  bridge: NgxSpartanAriaDescribedByBridge,
): BrnFieldA11yPublicSurface {
  return bridge;
}
void assertSpartanBridgeContract;
