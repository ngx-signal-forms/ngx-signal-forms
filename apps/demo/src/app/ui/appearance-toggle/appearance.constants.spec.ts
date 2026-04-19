import { describe, expect, it } from 'vitest';
import { APPEARANCE_LABELS, getAppearanceLabel } from './appearance.constants';

describe('getAppearanceLabel', () => {
  it('returns the label for supported appearances', () => {
    expect(getAppearanceLabel('standard')).toBe(APPEARANCE_LABELS.standard);
    expect(getAppearanceLabel('outline')).toBe(APPEARANCE_LABELS.outline);
    expect(getAppearanceLabel('plain')).toBe(APPEARANCE_LABELS.plain);
  });

  it('falls back to standard when an unresolved appearance like inherit reaches the helper', () => {
    expect(getAppearanceLabel('inherit')).toBe(APPEARANCE_LABELS.standard);
  });
});
