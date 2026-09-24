import type {
  NgxSignalFormControlKind,
  ResolvedNgxSignalFormControlSemantics,
} from '@ngx-signal-forms/toolkit';

/**
 * Wrapper-visible control families derived from resolved control semantics.
 */
export type FormFieldControlKind =
  ResolvedNgxSignalFormControlSemantics['kind'];

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
 * - `forcesVertical` — the wrapper should force `'vertical'` layout
 *   regardless of the requested orientation. True for the selection-control
 *   kinds (checkbox, switch, radio-group), whose rows don't read well
 *   side-by-side with their label.
 * - `clusterRole` — the ARIA role a *selection group* of this kind takes:
 *   `'radiogroup'` for radio-group, `'group'` for a multi-checkbox group.
 *   `null` means the kind never forms a group. The kind alone does not
 *   decide whether a group forms. `NgxFormFieldWrapper`'s
 *   `isSelectionCluster` also checks the projected control count for
 *   `'group'`. This flag only names the role once a group is confirmed.
 */
export interface ControlKindCapabilities {
  readonly textual: boolean;
  readonly supportsOutline: boolean;
  readonly selectionGroup: boolean;
  readonly paddedContent: boolean;
  readonly forcesVertical: boolean;
  readonly clusterRole: 'radiogroup' | 'group' | null;
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
 * 4. Add a row here with all six capability flags for the new kind.
 *
 * TypeScript will surface each missing edit in turn. Ship a test covering
 * the wrapper chrome for the new kind (see the existing slider/composite
 * tests in `form-field-wrapper.spec.ts` for the pattern).
 *
 * ## Why consumers can't add kinds from user code
 *
 * The closed union is intentional: wrapper chrome decisions depend on all
 * of the capability flags, and a consumer-supplied kind could not be
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
    forcesVertical: false,
    clusterRole: null,
  },
  'standalone-field-like': {
    textual: true,
    supportsOutline: true,
    selectionGroup: false,
    paddedContent: false,
    forcesVertical: false,
    clusterRole: null,
  },
  switch: {
    textual: false,
    supportsOutline: false,
    selectionGroup: false,
    paddedContent: false,
    forcesVertical: true,
    clusterRole: null,
  },
  checkbox: {
    textual: false,
    supportsOutline: false,
    selectionGroup: true,
    paddedContent: false,
    forcesVertical: true,
    clusterRole: 'group',
  },
  'radio-group': {
    textual: false,
    supportsOutline: false,
    selectionGroup: true,
    paddedContent: false,
    forcesVertical: true,
    clusterRole: 'radiogroup',
  },
  slider: {
    textual: false,
    supportsOutline: true,
    selectionGroup: false,
    paddedContent: true,
    forcesVertical: false,
    clusterRole: null,
  },
  composite: {
    textual: false,
    supportsOutline: true,
    selectionGroup: false,
    paddedContent: true,
    forcesVertical: false,
    clusterRole: null,
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
  forcesVertical: false,
  clusterRole: null,
};

/**
 * Looks up the capability flags for a control kind. `null` (unresolved
 * control kind) falls back to {@link UNKNOWN_CONTROL_CAPABILITIES} so legacy
 * markup and custom controls without registered semantics keep rendering
 * with the default textual field shell.
 */
export function capabilitiesFor(
  controlKind: FormFieldControlKind,
): ControlKindCapabilities {
  return controlKind === null
    ? UNKNOWN_CONTROL_CAPABILITIES
    : CONTROL_KIND_CAPABILITIES[controlKind];
}
