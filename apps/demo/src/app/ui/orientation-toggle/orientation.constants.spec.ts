import { describe, expect, it } from 'vitest';
import {
  getOrientationLabel,
  isOrientationDisabledForAppearance,
  normalizeOrientationForAppearance,
  ORIENTATION_LABELS,
} from './orientation.constants';

describe('orientation.constants', () => {
  it('returns the label for supported orientations', () => {
    expect(getOrientationLabel('vertical')).toBe(ORIENTATION_LABELS.vertical);
    expect(getOrientationLabel('horizontal')).toBe(
      ORIENTATION_LABELS.horizontal,
    );
  });

  it('disables horizontal orientation only for outline appearance', () => {
    expect(isOrientationDisabledForAppearance('outline', 'horizontal')).toBe(
      true,
    );
    expect(isOrientationDisabledForAppearance('standard', 'horizontal')).toBe(
      false,
    );
    expect(isOrientationDisabledForAppearance('plain', 'horizontal')).toBe(
      false,
    );
    expect(isOrientationDisabledForAppearance('outline', 'vertical')).toBe(
      false,
    );
  });

  it('normalizes invalid orientation choices back to vertical', () => {
    expect(normalizeOrientationForAppearance('outline', 'horizontal')).toBe(
      'vertical',
    );
    expect(normalizeOrientationForAppearance('outline', 'vertical')).toBe(
      'vertical',
    );
    expect(normalizeOrientationForAppearance('standard', 'horizontal')).toBe(
      'horizontal',
    );
  });
});
