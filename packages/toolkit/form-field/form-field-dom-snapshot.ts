import type { ElementRef } from '@angular/core';
import type {
  NgxSignalFormControlPresetRegistry,
  ResolvedNgxSignalFormControlSemantics,
} from '@ngx-signal-forms/toolkit';
import { resolveNgxSignalFormControlSemantics } from '@ngx-signal-forms/toolkit';
import {
  findBoundControl,
  isElementCssVisible,
  isHtmlElement,
  resolveBoundControlFromBindings,
  type FormFieldBindingsState,
} from '@ngx-signal-forms/toolkit/core';

/**
 * Resolve the host element from an `ElementRef`, asserting that it is an
 * `HTMLElement`. The wrapper component can't do useful DOM work otherwise,
 * so a host that is not an element is a contract violation this surfaces
 * loudly.
 *
 * The check goes through {@link isHtmlElement}, which reads a server-side
 * element as an element instead of throwing on the missing `HTMLElement`
 * global. This function only ever runs inside `afterEveryRender`, which a
 * server pass skips, but a direct caller must not crash the render either.
 *
 * @internal
 */
export function requireHostElement(
  elementRef: ElementRef<unknown>,
): HTMLElement {
  const hostEl = elementRef.nativeElement;

  if (!isHtmlElement(hostEl)) {
    throw new TypeError('NgxFormFieldWrapper requires an HTMLElement host.');
  }

  return hostEl;
}

/**
 * DOM snapshot consumed by `NgxFormFieldWrapper`'s render hook.
 *
 * @internal
 */
export interface FormFieldWrapperDomSnapshot {
  readonly inputEl: HTMLElement | null;
  readonly inputId: string | null;
  readonly semantics: ResolvedNgxSignalFormControlSemantics;
  readonly selectionControlCount: number;
  readonly label: Element | null;
  /**
   * The resolved `__main` projected-content slot. Returned so the caller can
   * cache it across renders and skip the `querySelector` call next time.
   */
  readonly mainSlot: HTMLElement | null;
  /**
   * Whether `inputEl` currently has a CSS layout box. Resolved here, in the
   * `earlyRead` phase, instead of in the wrapper's `write` phase. A `write`
   * phase read would run after other wrappers already mutated the DOM. That
   * forces a style recalculation this snapshot avoids by reading everything
   * up front.
   */
  readonly controlVisible: boolean;
}

/**
 * Read the wrapper's projected-control DOM snapshot in one place.
 *
 * Called from `NgxFormFieldWrapper`'s `afterEveryRender` early-read phase, so
 * this must stay synchronous and free of reactive reads. `controlPresets` is
 * passed as a plain registry (not a signal) for the same reason — the
 * wrapper resolves it once at construction and reuses it here.
 *
 * Kept as a standalone, pure function (rather than folded into
 * {@link captureFormFieldWrapperDomSnapshot}) so its native-vs-fallback
 * precedence rules stay directly unit-testable without an `ElementRef` or a
 * `FieldTree` fixture — see `form-field.utils.spec.ts`.
 *
 * @internal
 */
export function readFormFieldWrapperDomSnapshot(
  hostEl: HTMLElement,
  cachedControl: HTMLElement | null,
  controlPresets: NgxSignalFormControlPresetRegistry,
  nativeControl: HTMLElement | null,
  cachedMainSlot: HTMLElement | null = null,
  cachedLabel: Element | null = null,
): FormFieldWrapperDomSnapshot {
  // Prefer Angular's native binding registry: when the field reports a
  // `[formField]` binding inside this host, that element is the canonical
  // bound control and we skip DOM probing entirely. The registry is empty
  // for plain `<input id>` controls (the wrapper carries the `FieldTree`)
  // and for a render or two before the projected directive initializes, so
  // the `findBoundControl` selector below stays as the fallback that keeps
  // those cases — and the unit tests that bind a mock field state — working.
  //
  // DOM-query cache: reuse the previously bound control when it is
  // still mounted inside this host AND still carries an `id` (without
  // the id it no longer satisfies the `findBoundControl` selector).
  // The `isConnected` + `hostEl.contains` guard covers the common
  // `@if`-branch-swap case where Angular detaches the old node from
  // its parent on branch change. Moving `[formField]` to a sibling
  // inside the same template branch without a re-render is an
  // author-error edge case this cache does not catch.
  // oxlint-disable-next-line @typescript-eslint/prefer-optional-chain -- rewriting to `cachedControl?.isConnected` trades one lint rule for another (strict-boolean-expressions on the resulting nullable boolean)
  const cacheHit =
    cachedControl?.isConnected &&
    hostEl.contains(cachedControl) &&
    cachedControl.hasAttribute('id');

  // `mainSlot` is a structural template slot. The wrapper never re-creates
  // it without also detaching the whole host (an `@if` branch flip).
  // `label` is consumer-projected content, so it can move independently.
  // Both reuse the same `isConnected` + `hostEl.contains` guard as
  // `cachedControl` above. The guard is what makes reuse safe, not any
  // assumption about where the element comes from. It lets steady-state
  // renders skip the `querySelector` call for both.
  // oxlint-disable-next-line @typescript-eslint/prefer-optional-chain -- see cacheHit above
  const mainSlot =
    cachedMainSlot?.isConnected && hostEl.contains(cachedMainSlot)
      ? cachedMainSlot
      : hostEl.querySelector<HTMLElement>(
          // `findBoundControl`'s selector is a single comma-separated
          // `querySelector`, which returns the first match in *document
          // order* across whatever root it's given, not by resolution tier.
          // Scanning `hostEl` directly lets a `[prefix]`/label-slot element
          // that happens to match the selector (a
          // `<button prefix type="button" id="toggle">`, or a second,
          // unrelated `<input id>` sitting in a projected label) win over
          // the real control in `__main` — `__label` renders before
          // `__content` in the template, and `__prefix` before `__main`
          // inside it, so both slots are checked first in document order.
          ':scope > .ngx-signal-form-field-wrapper__content > .ngx-signal-form-field-wrapper__main',
        );
  // oxlint-disable-next-line @typescript-eslint/prefer-optional-chain -- see cacheHit above
  const label =
    cachedLabel?.isConnected && hostEl.contains(cachedLabel)
      ? cachedLabel
      : hostEl.querySelector(
          ':scope > .ngx-signal-form-field-wrapper__label :is(label, [ngxFormFieldLabel])',
        );

  // `nativeControl` wins when present, and a `cachedControl` hit means the
  // previously-found control is still the right one — in both cases the
  // `findBoundControl` probe (up to two calls of an 8-branch selector) is
  // unnecessary and skipped. Only a genuine cache miss (no native binding,
  // and the cached control moved or disappeared) falls through to it.
  //
  // Probe `__main` first — the region `selectionControlCount` below also
  // scans — since that's where a wrapper's real control lives whenever it's
  // projected as a standalone sibling. Only fall back to scanning the whole
  // host when `__main` has no match: the implicit-label pattern
  // (`<label>Email <input id="email"></label>`) projects the control AS PART
  // OF the label into `__label`, not `__main`, so a real, singly-nested
  // control legitimately has no `__main` match to find.
  //
  // The native-vs-fallback invariant (PR #92: native and CSS-selector paths
  // must produce identical output) is upheld upstream in
  // `resolveBoundControlFromBindings`, which only returns a binding element
  // that carries a non-empty `id` — exactly the constraint the
  // `findBoundControl` selector enforces. An id-less `[formField]` host
  // therefore arrives here as `nativeControl === null` and falls through to
  // the probe, which still finds the inner `<input id>`.
  const inputEl =
    nativeControl ??
    (cacheHit
      ? cachedControl
      : ((mainSlot && findBoundControl(mainSlot)) ?? findBoundControl(hostEl)));
  const semantics = resolveProjectedControlSemantics(
    inputEl,
    hostEl,
    controlPresets,
  );

  return {
    inputEl,
    inputId: inputEl && inputEl.id.length > 0 ? inputEl.id : null,
    semantics,
    // Scope the scan to the projected control region so selection controls
    // rendered in `[prefix]` / `[suffix]` (e.g. a checkbox-shaped icon
    // toggle) cannot flip a single-control wrapper into selection-cluster
    // mode. The `__main` slot is always rendered by the wrapper template;
    // the `?? 0` is defense-in-depth against unexpected DOM trees.
    selectionControlCount:
      mainSlot?.querySelectorAll(
        "input[type='radio'], input[type='checkbox']:not([role='switch']), [role='radio'], [role='checkbox']",
      ).length ?? 0,
    label,
    mainSlot,
    controlVisible: inputEl ? isElementCssVisible(inputEl) : true,
  };
}

function resolveProjectedControlSemantics(
  inputEl: HTMLElement | null,
  hostEl: HTMLElement,
  controlPresets: NgxSignalFormControlPresetRegistry,
): ResolvedNgxSignalFormControlSemantics {
  for (
    let ancestor = inputEl?.parentElement;
    ancestor && ancestor !== hostEl;
    ancestor = ancestor.parentElement
  ) {
    if (ancestor.hasAttribute('data-ngx-signal-form-control')) {
      return resolveNgxSignalFormControlSemantics(ancestor, controlPresets);
    }
  }

  return resolveNgxSignalFormControlSemantics(inputEl, controlPresets);
}

/**
 * Single entry point for `NgxFormFieldWrapper`'s `afterEveryRender`
 * `earlyRead` phase: resolves the host element, looks up the bound control
 * via Angular's native binding registry, then folds in the DOM-probe
 * fallback via {@link readFormFieldWrapperDomSnapshot}.
 *
 * Extracted (issue #354) so the wrapper component's constructor only calls
 * one function to capture render state, instead of composing
 * `requireHostElement` + `resolveBoundControlFromBindings` +
 * `readFormFieldWrapperDomSnapshot` inline. Must stay synchronous and free
 * of reactive reads — it runs inside `afterEveryRender`'s `earlyRead`
 * callback, before Angular's write phase.
 *
 * @internal
 */
export function captureFormFieldWrapperDomSnapshot(
  elementRef: ElementRef<unknown>,
  cachedControl: HTMLElement | null,
  controlPresets: NgxSignalFormControlPresetRegistry,
  fieldState: FormFieldBindingsState | null | undefined,
  cachedMainSlot: HTMLElement | null = null,
  cachedLabel: Element | null = null,
): FormFieldWrapperDomSnapshot {
  const hostEl = requireHostElement(elementRef);
  const nativeControl = resolveBoundControlFromBindings(fieldState, hostEl);

  return readFormFieldWrapperDomSnapshot(
    hostEl,
    cachedControl,
    controlPresets,
    nativeControl,
    cachedMainSlot,
    cachedLabel,
  );
}
