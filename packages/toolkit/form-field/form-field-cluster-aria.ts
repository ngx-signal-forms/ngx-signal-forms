import { generateRequiredHintId } from '@ngx-signal-forms/toolkit/core';
import type { FormFieldControlKind } from './form-field.utils';

/**
 * Raw inputs `NgxFormFieldWrapper` collects across several of its own
 * signals to compute the selection-cluster ARIA contract. Kept as a flat,
 * plain-value interface (not signals) so {@link resolveClusterAriaAttrs}
 * stays a pure function the component's `computed()` reads from — see that
 * function's doc comment for why the four related host bindings
 * (`role`, `aria-labelledby`, `aria-describedby`, and the visually-hidden
 * `groupRequiredHintId` node) are resolved together instead of as four
 * separately-guarded computeds.
 *
 * @internal
 */
export interface ClusterAriaInputs {
  readonly isSelectionCluster: boolean;
  readonly controlKind: FormFieldControlKind;
  readonly boundControlIsRequired: boolean;
  readonly requiredHintText: string;
  readonly fieldName: string | null;
  readonly selectionClusterLabelId: string | null;
  readonly initialAriaLabelledby: string | null;
  readonly initialAriaDescribedby: string | null;
  readonly showInvalidState: boolean;
  readonly showWarningState: boolean;
  readonly shouldShowWarnings: boolean;
}

/**
 * The whole selection-cluster ARIA contract `NgxFormFieldWrapper`'s host
 * bindings read from, resolved together by {@link resolveClusterAriaAttrs}.
 *
 * @internal
 */
export interface ClusterAriaAttrs {
  /** `[attr.role]` — `'group'` | `'radiogroup'`, or `null` for a non-cluster wrapper. */
  readonly role: 'group' | 'radiogroup' | null;
  /**
   * ID of the visually-hidden required-state node rendered in the label
   * slot for a `group`-role cluster (`radiogroup` keeps `aria-required`
   * from auto-aria instead — see the inline reasoning below). `null` when
   * it doesn't apply.
   */
  readonly groupRequiredHintId: string | null;
  /** `[attr.aria-labelledby]`. */
  readonly labelledBy: string | null;
  /** `[attr.aria-describedby]`. */
  readonly describedBy: string | null;
}

/**
 * Resolves the entire selection-cluster ARIA contract — `role`,
 * `aria-labelledby`, `aria-describedby`, and the visually-hidden
 * required-hint id — in one pure computation.
 *
 * Extracted from `NgxFormFieldWrapper` (issue #354), which used to spread
 * this across four separately-guarded `computed()`s
 * (`selectionClusterRole`, `groupRequiredHintId`, `selectionClusterLabelledBy`,
 * `selectionClusterDescribedBy`) that each re-checked `isSelectionCluster`
 * and silently depended on being read in the right order (`describedBy`
 * reads the already-resolved `groupRequiredHintId`). Folding them into one
 * function makes that dependency explicit and keeps the four outputs
 * consistent with each other by construction — a caller can no longer read
 * `describedBy` computed from a stale `groupRequiredHintId`.
 *
 * Deliberately pure (no signal reads, no `inject()`) — the component wraps
 * this in a single `computed()` and projects each field from that one
 * result. See `NgxFormFieldWrapper`'s original inline doc comments (now
 * folded into this module) for the accessibility rationale:
 *
 * - `aria-required` is not valid ARIA on the `group` role (only
 *   `radiogroup`), so a `group` cluster's required-ness is relocated to a
 *   visually-hidden node wired into `aria-describedby` instead
 *   (WCAG 1.3.1 / 4.1.2, see
 *   https://github.com/ngx-signal-forms/ngx-signal-forms/issues/300).
 * - `aria-describedby`/`aria-labelledby` merge with (never replace) any
 *   author-supplied initial values, mirroring how auto-aria preserves
 *   author-supplied values on the bound control itself.
 * - The error/warning id appended to `describedBy` is gated on
 *   `shouldShowWarnings` (not just `showWarningState`) because that signal
 *   also gates whether the projected error renderer's warning live region
 *   is actually in the DOM — appending the id unconditionally would leave a
 *   dangling `aria-describedby` reference for warning-only clusters gated
 *   by a non-`'immediate'` `warningStrategy`.
 *
 * @internal
 */
export function resolveClusterAriaAttrs(
  inputs: Readonly<ClusterAriaInputs>,
): ClusterAriaAttrs {
  const {
    isSelectionCluster,
    controlKind,
    boundControlIsRequired,
    requiredHintText,
    fieldName,
    selectionClusterLabelId,
    initialAriaLabelledby,
    initialAriaDescribedby,
    showInvalidState,
    showWarningState,
    shouldShowWarnings,
  } = inputs;

  const role: ClusterAriaAttrs['role'] = isSelectionCluster
    ? controlKind === 'radio-group'
      ? 'radiogroup'
      : 'group'
    : null;

  const groupRequiredHintId =
    role !== 'group' || !boundControlIsRequired || requiredHintText === ''
      ? null
      : fieldName === null
        ? null
        : generateRequiredHintId(fieldName);

  const labelledBy = isSelectionCluster
    ? (selectionClusterLabelId ?? initialAriaLabelledby)
    : initialAriaLabelledby;

  const managedIds: string[] = [];
  if (isSelectionCluster) {
    if (groupRequiredHintId !== null) {
      managedIds.push(groupRequiredHintId);
    }

    if (fieldName !== null) {
      if (showInvalidState) {
        managedIds.push(`${fieldName}-error`);
      } else if (showWarningState && shouldShowWarnings) {
        managedIds.push(`${fieldName}-warning`);
      }
    }
  }

  const describedBy =
    managedIds.length === 0
      ? initialAriaDescribedby
      : initialAriaDescribedby
        ? `${initialAriaDescribedby} ${managedIds.join(' ')}`
        : managedIds.join(' ');

  return { role, groupRequiredHintId, labelledBy, describedBy };
}
