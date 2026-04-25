import { describe, expect, it } from 'vitest';
import { NGX_SIGNAL_FORM_CONTROL_KIND_VALUES } from '@ngx-signal-forms/toolkit/core';
import type { NgxSignalFormControlKind } from '@ngx-signal-forms/toolkit';
import {
  hasPaddedControlContent,
  isSelectionGroupKind,
  isTextualControlKind,
  supportsOutlinedAppearance,
} from './form-field.utils';

/**
 * Expected capability flags for each NgxSignalFormControlKind.
 *
 * This table is the runtime mirror of the `CONTROL_KIND_CAPABILITIES`
 * constant in `form-field.utils.ts`. Keeping it explicit here protects
 * against:
 * - Accidental removal of the `satisfies Record<NgxSignalFormControlKind, …>`
 *   clause (which enforces compile-time exhaustiveness).
 * - Silent capability-flag regressions when a kind's defaults are changed.
 */
const EXPECTED_CAPABILITIES: Record<
  NgxSignalFormControlKind,
  {
    textual: boolean;
    supportsOutline: boolean;
    selectionGroup: boolean;
    paddedContent: boolean;
  }
> = {
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
} satisfies Record<NgxSignalFormControlKind, object>;

describe('CONTROL_KIND_CAPABILITIES exhaustiveness', () => {
  it('should have a capability entry for every registered control kind', () => {
    for (const kind of NGX_SIGNAL_FORM_CONTROL_KIND_VALUES) {
      expect(kind in EXPECTED_CAPABILITIES).toBe(true);
    }
  });

  it('should cover exactly the set of known control kinds — no extras, no gaps', () => {
    // Both sets are widened to `Set<string>` so the cross-checks stay
    // type-safe regardless of which side iterates first — `Set<T>.has`
    // would otherwise reject the inferred type from the opposing iterator.
    const testedKinds = new Set<string>(Object.keys(EXPECTED_CAPABILITIES));
    const registeredKinds = new Set<string>(
      NGX_SIGNAL_FORM_CONTROL_KIND_VALUES,
    );

    for (const kind of registeredKinds) {
      expect(testedKinds.has(kind)).toBe(true);
    }

    for (const kind of testedKinds) {
      expect(registeredKinds.has(kind)).toBe(true);
    }
  });

  describe.each(NGX_SIGNAL_FORM_CONTROL_KIND_VALUES)('%s', (kind) => {
    it('isTextualControlKind returns expected value', () => {
      expect(isTextualControlKind(kind)).toBe(
        EXPECTED_CAPABILITIES[kind].textual,
      );
    });

    it('supportsOutlinedAppearance returns expected value', () => {
      expect(supportsOutlinedAppearance(kind)).toBe(
        EXPECTED_CAPABILITIES[kind].supportsOutline,
      );
    });

    it('isSelectionGroupKind returns expected value', () => {
      expect(isSelectionGroupKind(kind)).toBe(
        EXPECTED_CAPABILITIES[kind].selectionGroup,
      );
    });

    it('hasPaddedControlContent returns expected value', () => {
      expect(hasPaddedControlContent(kind)).toBe(
        EXPECTED_CAPABILITIES[kind].paddedContent,
      );
    });
  });
});

describe('null (unresolved) control kind fallback', () => {
  it('isTextualControlKind falls back to textual chrome', () => {
    expect(isTextualControlKind(null)).toBe(true);
  });

  it('supportsOutlinedAppearance falls back to outline support', () => {
    expect(supportsOutlinedAppearance(null)).toBe(true);
  });

  it('isSelectionGroupKind falls back to false', () => {
    expect(isSelectionGroupKind(null)).toBe(false);
  });

  it('hasPaddedControlContent falls back to false', () => {
    expect(hasPaddedControlContent(null)).toBe(false);
  });
});
