import type { ElementRef } from '@angular/core';
import type {
  NgxSignalFormControlKind,
  NgxSignalFormControlPresetRegistry,
  ResolvedNgxSignalFormControlSemantics,
} from '@ngx-signal-forms/toolkit';
import { resolveNgxSignalFormControlSemantics } from '@ngx-signal-forms/toolkit';
import { findBoundControl } from '@ngx-signal-forms/toolkit/core';

// Re-exported here for backward compatibility with intra-toolkit callers.
// Owning module is `@ngx-signal-forms/toolkit/core` so `NgxFieldIdentity`
// and any future surface that needs to discover a bound control share one
// resolution rule.
export { findBoundControl } from '@ngx-signal-forms/toolkit/core';

/**
 * Resolve the host element from an `ElementRef`, asserting that it is an
 * `HTMLElement`. The wrapper component can't do useful DOM work otherwise
 * (the SSR/test setups that miss `HTMLElement` are contract violations
 * the caller should surface loudly).
 *
 * @internal
 */
export function requireHostElement(
  elementRef: ElementRef<unknown>,
): HTMLElement {
  const hostEl = elementRef.nativeElement;

  if (!(hostEl instanceof HTMLElement)) {
    throw new TypeError('NgxFormFieldWrapper requires an HTMLElement host.');
  }

  return hostEl;
}

/**
 * Wrapper-visible control families derived from resolved control semantics.
 */
export type FormFieldControlKind =
  ResolvedNgxSignalFormControlSemantics['kind'];

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
}

/**
 * Read the wrapper's projected-control DOM snapshot in one place.
 *
 * Called from `NgxFormFieldWrapper`'s `afterEveryRender` early-read phase, so
 * this must stay synchronous and free of reactive reads. `controlPresets` is
 * passed as a plain registry (not a signal) for the same reason — the
 * wrapper resolves it once at construction and reuses it here.
 *
 * @internal
 */
export function readFormFieldWrapperDomSnapshot(
  hostEl: HTMLElement,
  cachedControl: HTMLElement | null,
  controlPresets: NgxSignalFormControlPresetRegistry,
): FormFieldWrapperDomSnapshot {
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
  const inputEl = cacheHit ? cachedControl : findBoundControl(hostEl);

  return {
    inputEl,
    inputId: inputEl && inputEl.id.length > 0 ? inputEl.id : null,
    semantics: resolveNgxSignalFormControlSemantics(inputEl, controlPresets),
    selectionControlCount: hostEl.querySelectorAll(
      "input[type='radio'], input[type='checkbox']:not([role='switch']), [role='radio'], [role='checkbox']",
    ).length,
    label: hostEl.querySelector(
      ':scope > .ngx-signal-form-field-wrapper__label :is(label, [ngxFormFieldLabel])',
    ),
  };
}

/**
 * Wrapper-visible capability flags for a control kind.
 *
 * Each flag answers one rendering question the wrapper has to make a
 * decision about. Keep the flag set small and orthogonal — adding a flag
 * forces every entry in {@link CONTROL_KIND_CAPABILITIES} plus
 * {@link UNKNOWN_CONTROL_CAPABILITIES} to declare its value, which is the
 * point of the exhaustiveness guard.
 *
 * - `textual` — the wrapper should render the default textual field shell
 *   (border, padding, focus ring via `:focus-within`).
 * - `supportsOutline` — `appearance="outline"` is meaningful for this
 *   control family. Selection-group controls (checkbox, radio-group,
 *   switch) keep `false` because the outline chrome doesn't frame them
 *   correctly.
 * - `selectionGroup` — the control uses grouped selection-row layout
 *   (checkbox + label inline, radio group stack).
 * - `paddedContent` — the wrapper should keep shared content padding
 *   around the control. True for controls whose host is a widget that
 *   benefits from the wrapper's padding (slider, composite) rather than
 *   managing its own.
 */
interface ControlKindCapabilities {
  readonly textual: boolean;
  readonly supportsOutline: boolean;
  readonly selectionGroup: boolean;
  readonly paddedContent: boolean;
}

/**
 * Capability table keyed by `NgxSignalFormControlKind`.
 *
 * The `as const satisfies Record<NgxSignalFormControlKind, …>` clause is
 * load-bearing: it forces every new kind added to the union to declare its
 * wrapper behavior here at compile time. Adding a kind without updating
 * this table is a TypeScript error, not a silent fall-through to
 * {@link UNKNOWN_CONTROL_CAPABILITIES}.
 *
 * ## How to add a new control kind
 *
 * Four coupled edits, all enforced by `satisfies`:
 *
 * 1. Add the value to `NgxSignalFormControlKind` in
 *    `packages/toolkit/core/types.ts`.
 * 2. Add it to `NGX_SIGNAL_FORM_CONTROL_KIND_VALUES` in
 *    `packages/toolkit/core/utilities/control-semantics.ts`. Optionally
 *    teach `inferNgxSignalFormControlKind` to recognize the DOM shape.
 * 3. Add a default preset (layout + ariaMode) to
 *    `DEFAULT_NGX_SIGNAL_FORM_CONTROL_PRESETS` in
 *    `packages/toolkit/core/tokens.ts`.
 * 4. Add a row here with the four capability flags for the new kind.
 *
 * TypeScript will surface each missing edit in turn. Ship a test covering
 * the wrapper chrome for the new kind (see the existing slider/composite
 * tests in `form-field-wrapper.spec.ts` for the pattern).
 *
 * ## Why consumers can't add kinds from user code
 *
 * The closed union is intentional: wrapper chrome decisions depend on all
 * four capability flags, and a consumer-supplied kind could not be
 * classified by `supportsOutline` / `selectionGroup` without leaking that
 * internal taxonomy. For custom widgets that don't fit any existing kind,
 * use `composite` + `appearance="plain"` + `ariaMode="manual"` — that
 * combination intentionally leaves chrome and ARIA to the widget while
 * the wrapper still contributes labels, hints, errors, and field
 * identity.
 */
const CONTROL_KIND_CAPABILITIES = {
  'input-like': {
    textual: true,
    supportsOutline: true,
    selectionGroup: false,
    paddedContent: false,
  },
  'standalone-field-like': {
    textual: true,
    supportsOutline: true,
    selectionGroup: false,
    paddedContent: false,
  },
  switch: {
    textual: false,
    supportsOutline: false,
    selectionGroup: false,
    paddedContent: false,
  },
  checkbox: {
    textual: false,
    supportsOutline: false,
    selectionGroup: true,
    paddedContent: false,
  },
  'radio-group': {
    textual: false,
    supportsOutline: false,
    selectionGroup: true,
    paddedContent: false,
  },
  slider: {
    textual: false,
    supportsOutline: true,
    selectionGroup: false,
    paddedContent: true,
  },
  composite: {
    textual: false,
    supportsOutline: true,
    selectionGroup: false,
    paddedContent: true,
  },
} as const satisfies Record<NgxSignalFormControlKind, ControlKindCapabilities>;

/**
 * Capability defaults for an unresolved control (no explicit semantics and no
 * heuristic match). The wrapper falls back to textual chrome so legacy markup
 * and custom controls without registered semantics keep working.
 */
const UNKNOWN_CONTROL_CAPABILITIES: ControlKindCapabilities = {
  textual: true,
  supportsOutline: true,
  selectionGroup: false,
  paddedContent: false,
};

function capabilitiesFor(
  controlKind: FormFieldControlKind,
): ControlKindCapabilities {
  return controlKind === null
    ? UNKNOWN_CONTROL_CAPABILITIES
    : CONTROL_KIND_CAPABILITIES[controlKind];
}

/**
 * Determines whether a control family can safely render with outline chrome.
 */
export function supportsOutlinedAppearance(
  controlKind: FormFieldControlKind,
): boolean {
  return capabilitiesFor(controlKind).supportsOutline;
}

/**
 * Determines whether a control family uses the standard textual field shell.
 *
 * Unresolved (`null`) control kinds fall back to textual chrome so legacy
 * markup keeps rendering with the default field shell.
 */
export function isTextualControlKind(
  controlKind: FormFieldControlKind,
): boolean {
  return capabilitiesFor(controlKind).textual;
}

/**
 * Determines whether a control family should use grouped selection-row layout.
 */
export function isSelectionGroupKind(
  controlKind: FormFieldControlKind,
): boolean {
  return capabilitiesFor(controlKind).selectionGroup;
}

/**
 * Determines whether the wrapper should keep shared padding around the control.
 */
export function hasPaddedControlContent(
  controlKind: FormFieldControlKind,
): boolean {
  return capabilitiesFor(controlKind).paddedContent;
}
