import type { WritableSignal } from '@angular/core';
import type {
  NgxFieldIdentity,
  NgxSignalFormHintDescriptor,
  ResolvedNgxSignalFormControlSemantics,
} from '@ngx-signal-forms/toolkit';
import {
  devWarnOnce,
  isHtmlElement,
  sanitizeFieldNameForId,
  type WarnOnceRef,
} from '@ngx-signal-forms/toolkit/core';
import type { FormFieldWrapperDomSnapshot } from './form-field-dom-snapshot';
import { capabilitiesFor } from './form-field.utils';

/**
 * The wrapper state that {@link applyWrapperDomSnapshot} writes, plus the
 * readers it needs. The wrapper owns the signals; this function only sets
 * them.
 *
 * @internal
 */
export interface WrapperDomState {
  /** The bound control found in the last snapshot. */
  readonly boundControl: WritableSignal<HTMLElement | null>;
  /** The bound control's `id`: tier 2 of the field-name cascade. */
  readonly inputId: WritableSignal<string | null>;
  /** Whether the bound control is required. Drives the required marker. */
  readonly required: WritableSignal<boolean>;
  /** Whether the wrapper hosts a radio group or a multi-checkbox group. */
  readonly selectionCluster: WritableSignal<boolean>;
  /** The id of the cluster's label, for `aria-labelledby` on the host. */
  readonly selectionClusterLabelId: WritableSignal<string | null>;
  /** The resolved semantics of the bound control. */
  readonly semantics: WritableSignal<ResolvedNgxSignalFormControlSemantics>;
  /**
   * Reads the resolved field name. It derives from `inputId`, so this
   * function reads it only after it writes `inputId`.
   */
  readonly resolvedFieldName: () => string | null;
  /** Reads `required()` from the field state. */
  readonly fieldRequired: () => boolean;
  readonly warnedUnresolvedKind: WarnOnceRef;
  readonly warnedUnresolvedFieldName: WarnOnceRef;
}

/**
 * The identity writers {@link applyWrapperDomSnapshot} drives. The resolved
 * strategies are not here: `createFieldPresentation()` publishes those.
 *
 * @internal
 */
export type WrapperDomIdentity = Pick<
  NgxFieldIdentity,
  'setFieldName' | 'setControlElement' | 'setControlVisible' | 'setHintIds'
>;

/**
 * The write phase of `NgxFormFieldWrapper`'s `afterEveryRender` hook.
 *
 * Turns a DOM snapshot from the `earlyRead` phase into state updates. It
 * makes no DOM queries and needs no injection context, so unit tests call
 * it with plain signals and elements. The only DOM writes are the two the
 * wrapper owns on projected content: a generated label `id` for a
 * selection cluster, and `data-signal-field` on the bound control.
 *
 * Signal writes use `set`, which is a no-op for an equal value, so a
 * steady-state render notifies nobody. See ADR-0011 for why the wrapper,
 * and not the identity provider, publishes the tier-2 field name.
 *
 * @internal
 */
export function applyWrapperDomSnapshot(
  snapshot: FormFieldWrapperDomSnapshot,
  state: WrapperDomState,
  identity: WrapperDomIdentity,
  hints: readonly NgxSignalFormHintDescriptor[],
): void {
  const { inputEl, inputId, semantics, selectionControlCount, label } =
    snapshot;

  const previousBoundControl = state.boundControl();
  if (previousBoundControl !== inputEl) {
    previousBoundControl?.removeAttribute('data-signal-field');
    state.boundControl.set(inputEl);
  }
  state.inputId.set(inputId);

  // Read each render so the marker follows dynamic schema changes. Auto-aria
  // toggles `aria-required` whenever the field's required state flips.
  state.required.set(
    inputEl !== null &&
      (inputEl.hasAttribute('required') ||
        inputEl.getAttribute('aria-required') === 'true' ||
        state.fieldRequired()),
  );

  const clusterRole = capabilitiesFor(semantics.kind).clusterRole;
  const isSelectionCluster =
    clusterRole === 'radiogroup' ||
    (clusterRole === 'group' && selectionControlCount > 1);
  state.selectionCluster.set(isSelectionCluster);

  const fieldName = state.resolvedFieldName();

  if (isHtmlElement(label) && isSelectionCluster) {
    const existingLabelId = label.id.trim();
    // Two unnamed clusters on one page would collide on the same fallback
    // id and point `aria-labelledby` at the wrong legend. Skip the wiring
    // instead; the unresolved-name diagnostic below tells the author.
    const nextLabelId = existingLabelId
      ? existingLabelId
      : fieldName === null
        ? null
        : // `fieldName` is the raw resolved name and may contain inner
          // whitespace, so sanitize it where the id is built.
          `${sanitizeFieldNameForId(fieldName)}-label`;

    if (nextLabelId !== null && existingLabelId.length === 0) {
      label.id = nextLabelId;
    }
    state.selectionClusterLabelId.set(nextLabelId);
  } else {
    state.selectionClusterLabelId.set(null);
  }

  const current = state.semantics();
  if (
    current.kind !== semantics.kind ||
    current.layout !== semantics.layout ||
    current.ariaMode !== semantics.ariaMode
  ) {
    state.semantics.set(semantics);
  }

  // Without a kind the control renders with default textual chrome. Authors
  // usually notice only when the outline or the selection layout does not
  // apply, so say it once in dev mode.
  if (inputEl && semantics.kind === null) {
    devWarnOnce(
      state.warnedUnresolvedKind,
      'warn',
      '[ngx-signal-forms] Form-field wrapper could not infer a control ' +
        'kind for its bound control and will render with default textual ' +
        'chrome. Declare semantics via `ngxSignalFormControl="..."` on the ' +
        'control host (or register a preset) to opt into the right layout ' +
        'and ARIA wiring.',
      inputEl,
    );
  }

  // `data-signal-field` is a stable runtime contract: custom controls style
  // `:host([data-signal-field]:focus-visible)`, tests discover fields by it,
  // and the hint component correlates through it. Never write `"null"`,
  // and skip equal writes: `setAttribute` mutates the DOM even for the same
  // value, which wakes any `MutationObserver`.
  if (inputEl) {
    const currentFieldName = inputEl.getAttribute('data-signal-field');
    if (fieldName === null) {
      if (currentFieldName !== null) {
        inputEl.removeAttribute('data-signal-field');
      }
    } else if (currentFieldName !== fieldName) {
      inputEl.setAttribute('data-signal-field', fieldName);
    }
  }

  // The diagnostic fires here, after this render's `inputId` is written,
  // and not in the `resolvedFieldName` computed. Projected hints and errors
  // read the name on the first change-detection pass, before any write
  // phase ran, so a check there would fire on every correct field.
  if (fieldName === null) {
    devWarnOnce(
      state.warnedUnresolvedFieldName,
      'error',
      '[ngx-signal-forms] Could not resolve a deterministic field name for ngx-form-field-wrapper. Add an explicit `fieldName` input or an `id` attribute to the bound control. ARIA wiring will be skipped until a name is available.',
    );
  }

  // Keep order: name → element → visible → hints. `setControlElement` reads
  // the name for its missing-id diagnostic. `controlVisible` came from the
  // `earlyRead` phase, so this adds no forced style recalculation.
  identity.setFieldName(fieldName);
  identity.setControlElement(inputEl);
  identity.setControlVisible(snapshot.controlVisible);
  identity.setHintIds(
    hints
      .filter((hint) => hint.fieldName === null || hint.fieldName === fieldName)
      .map((hint) => hint.id),
  );
}
