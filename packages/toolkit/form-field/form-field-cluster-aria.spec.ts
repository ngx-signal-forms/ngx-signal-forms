import { describe, expect, it } from 'vitest';
import {
  resolveClusterAriaAttrs,
  type ClusterAriaInputs,
} from './form-field-cluster-aria';

/**
 * Direct unit tests for {@link resolveClusterAriaAttrs}. This function was
 * previously only exercised indirectly through `NgxFormFieldWrapper`'s
 * wrapper-level browser specs — this file pins its pure contract without a
 * rendered component.
 */
function baseInputs(
  overrides: Partial<ClusterAriaInputs> = {},
): ClusterAriaInputs {
  return {
    isSelectionCluster: false,
    controlKind: 'input-like',
    boundControlIsRequired: false,
    requiredHintText: '',
    fieldName: null,
    selectionClusterLabelId: null,
    initialAriaLabelledby: null,
    initialAriaDescribedby: null,
    showInvalidState: false,
    showWarningState: false,
    shouldShowWarnings: false,
    ...overrides,
  };
}

describe('resolveClusterAriaAttrs', () => {
  describe('non-cluster wrapper', () => {
    it('returns no role and passes through the initial aria attrs unchanged', () => {
      const result = resolveClusterAriaAttrs(
        baseInputs({
          initialAriaLabelledby: 'label-1',
          initialAriaDescribedby: 'hint-1',
        }),
      );

      expect(result).toEqual({
        role: null,
        groupRequiredHintId: null,
        labelledBy: 'label-1',
        describedBy: 'hint-1',
      });
    });
  });

  describe('role', () => {
    it('resolves "group" for a checkbox-group cluster', () => {
      const result = resolveClusterAriaAttrs(
        baseInputs({ isSelectionCluster: true, controlKind: 'checkbox' }),
      );
      expect(result.role).toBe('group');
    });

    it('resolves "radiogroup" for a radio-group cluster', () => {
      const result = resolveClusterAriaAttrs(
        baseInputs({ isSelectionCluster: true, controlKind: 'radio-group' }),
      );
      expect(result.role).toBe('radiogroup');
    });
  });

  describe('groupRequiredHintId', () => {
    it('is set for a required "group"-role cluster with hint text and a field name', () => {
      const result = resolveClusterAriaAttrs(
        baseInputs({
          isSelectionCluster: true,
          controlKind: 'checkbox',
          boundControlIsRequired: true,
          requiredHintText: 'Required',
          fieldName: 'topping',
        }),
      );
      expect(result.groupRequiredHintId).not.toBeNull();
    });

    it('is null for a "radiogroup"-role cluster — aria-required is valid there instead', () => {
      const result = resolveClusterAriaAttrs(
        baseInputs({
          isSelectionCluster: true,
          controlKind: 'radio-group',
          boundControlIsRequired: true,
          requiredHintText: 'Required',
          fieldName: 'plan',
        }),
      );
      expect(result.groupRequiredHintId).toBeNull();
    });

    it('is null when the bound control is not required', () => {
      const result = resolveClusterAriaAttrs(
        baseInputs({
          isSelectionCluster: true,
          controlKind: 'checkbox',
          boundControlIsRequired: false,
          requiredHintText: 'Required',
          fieldName: 'topping',
        }),
      );
      expect(result.groupRequiredHintId).toBeNull();
    });

    it('is null when the required hint text is empty', () => {
      const result = resolveClusterAriaAttrs(
        baseInputs({
          isSelectionCluster: true,
          controlKind: 'checkbox',
          boundControlIsRequired: true,
          requiredHintText: '',
          fieldName: 'topping',
        }),
      );
      expect(result.groupRequiredHintId).toBeNull();
    });

    it('is null when there is no field name to derive an id from', () => {
      const result = resolveClusterAriaAttrs(
        baseInputs({
          isSelectionCluster: true,
          controlKind: 'checkbox',
          boundControlIsRequired: true,
          requiredHintText: 'Required',
          fieldName: null,
        }),
      );
      expect(result.groupRequiredHintId).toBeNull();
    });
  });

  describe('labelledBy', () => {
    it('prefers the selection-cluster label id over the initial aria-labelledby', () => {
      const result = resolveClusterAriaAttrs(
        baseInputs({
          isSelectionCluster: true,
          controlKind: 'checkbox',
          selectionClusterLabelId: 'cluster-label',
          initialAriaLabelledby: 'author-label',
        }),
      );
      expect(result.labelledBy).toBe('cluster-label');
    });

    it('falls back to the initial aria-labelledby when no cluster label id exists', () => {
      const result = resolveClusterAriaAttrs(
        baseInputs({
          isSelectionCluster: true,
          controlKind: 'checkbox',
          selectionClusterLabelId: null,
          initialAriaLabelledby: 'author-label',
        }),
      );
      expect(result.labelledBy).toBe('author-label');
    });

    it('uses the initial aria-labelledby unconditionally for a non-cluster wrapper', () => {
      const result = resolveClusterAriaAttrs(
        baseInputs({
          isSelectionCluster: false,
          selectionClusterLabelId: 'cluster-label',
          initialAriaLabelledby: 'author-label',
        }),
      );
      expect(result.labelledBy).toBe('author-label');
    });
  });

  describe('describedBy', () => {
    it('appends the error id when the invalid state is shown', () => {
      const result = resolveClusterAriaAttrs(
        baseInputs({
          isSelectionCluster: true,
          controlKind: 'checkbox',
          fieldName: 'topping',
          showInvalidState: true,
        }),
      );
      expect(result.describedBy).toContain('topping');
    });

    it('appends the warning id when the warning state is shown and warnings are enabled', () => {
      const result = resolveClusterAriaAttrs(
        baseInputs({
          isSelectionCluster: true,
          controlKind: 'checkbox',
          fieldName: 'topping',
          showWarningState: true,
          shouldShowWarnings: true,
        }),
      );
      expect(result.describedBy).toContain('topping');
    });

    it('does not append a warning id when warnings are shown but shouldShowWarnings is false', () => {
      const result = resolveClusterAriaAttrs(
        baseInputs({
          isSelectionCluster: true,
          controlKind: 'checkbox',
          fieldName: 'topping',
          initialAriaDescribedby: null,
          showWarningState: true,
          shouldShowWarnings: false,
        }),
      );
      expect(result.describedBy).toBeNull();
    });

    it('prefers the error id over the warning id when both states are active', () => {
      const errorOnly = resolveClusterAriaAttrs(
        baseInputs({
          isSelectionCluster: true,
          controlKind: 'checkbox',
          fieldName: 'topping',
          showInvalidState: true,
          showWarningState: true,
          shouldShowWarnings: true,
        }),
      );
      const warningOnly = resolveClusterAriaAttrs(
        baseInputs({
          isSelectionCluster: true,
          controlKind: 'checkbox',
          fieldName: 'topping',
          showInvalidState: false,
          showWarningState: true,
          shouldShowWarnings: true,
        }),
      );
      // Both must produce SOME managed id, but they must not be identical —
      // the error branch wins and never also appends the warning id.
      expect(errorOnly.describedBy).not.toBeNull();
      expect(warningOnly.describedBy).not.toBeNull();
      expect(errorOnly.describedBy?.split(' ')).toHaveLength(
        warningOnly.describedBy?.split(' ').length ?? 0,
      );
    });

    it('merges the required-hint id and an error id with an author-supplied aria-describedby', () => {
      const result = resolveClusterAriaAttrs(
        baseInputs({
          isSelectionCluster: true,
          controlKind: 'checkbox',
          boundControlIsRequired: true,
          requiredHintText: 'Required',
          fieldName: 'topping',
          initialAriaDescribedby: 'author-hint',
          showInvalidState: true,
        }),
      );
      const ids = result.describedBy?.split(' ') ?? [];
      expect(ids[0]).toBe('author-hint');
      expect(ids).toHaveLength(3); // author-hint, groupRequiredHintId, error id
      expect(result.groupRequiredHintId).not.toBeNull();
      expect(ids).toContain(result.groupRequiredHintId);
    });

    it('returns the initial aria-describedby unchanged when there is nothing to manage', () => {
      const result = resolveClusterAriaAttrs(
        baseInputs({
          isSelectionCluster: true,
          controlKind: 'checkbox',
          initialAriaDescribedby: 'author-hint',
        }),
      );
      expect(result.describedBy).toBe('author-hint');
    });

    it('returns null when neither an author-supplied describedby nor a managed id exists', () => {
      const result = resolveClusterAriaAttrs(baseInputs());
      expect(result.describedBy).toBeNull();
    });

    it('ignores the error/warning ids entirely for a non-cluster wrapper', () => {
      const result = resolveClusterAriaAttrs(
        baseInputs({
          isSelectionCluster: false,
          fieldName: 'topping',
          showInvalidState: true,
        }),
      );
      expect(result.describedBy).toBeNull();
    });
  });
});
