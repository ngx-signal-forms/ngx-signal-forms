import { signal } from '@angular/core';
import { describe, expect, it } from 'vitest';
import {
  createOrientationSelection,
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

describe('createOrientationSelection', () => {
  it('uses the initial value as the starting orientation', () => {
    const appearance =
      signal<import('@ngx-signal-forms/toolkit').FormFieldAppearance>(
        'standard',
      );
    const orientation = createOrientationSelection(appearance, 'horizontal');
    expect(orientation()).toBe('horizontal');
  });

  it('defaults to vertical when no initial value is provided', () => {
    const appearance =
      signal<import('@ngx-signal-forms/toolkit').FormFieldAppearance>(
        'standard',
      );
    const orientation = createOrientationSelection(appearance);
    expect(orientation()).toBe('vertical');
  });

  it('allows the user to write a supported orientation value', () => {
    const appearance =
      signal<import('@ngx-signal-forms/toolkit').FormFieldAppearance>(
        'standard',
      );
    const orientation = createOrientationSelection(appearance);
    orientation.set('horizontal');
    expect(orientation()).toBe('horizontal');
  });

  it('snaps to vertical when appearance changes to outline with horizontal selected', () => {
    const appearance =
      signal<import('@ngx-signal-forms/toolkit').FormFieldAppearance>(
        'standard',
      );
    const orientation = createOrientationSelection(appearance);
    orientation.set('horizontal');
    expect(orientation()).toBe('horizontal');

    appearance.set('outline');
    expect(orientation()).toBe('vertical');
  });

  it('does not resurrect the pre-snap value when appearance changes back', () => {
    const appearance =
      signal<import('@ngx-signal-forms/toolkit').FormFieldAppearance>(
        'standard',
      );
    const orientation = createOrientationSelection(appearance);
    orientation.set('horizontal');

    // snap to vertical
    appearance.set('outline');
    expect(orientation()).toBe('vertical');

    // switch back — should remain at snapped value (vertical), not restore horizontal
    appearance.set('standard');
    expect(orientation()).toBe('vertical');
  });

  it('keeps orientation unchanged when appearance changes to a compatible appearance', () => {
    const appearance =
      signal<import('@ngx-signal-forms/toolkit').FormFieldAppearance>(
        'standard',
      );
    const orientation = createOrientationSelection(appearance);
    orientation.set('horizontal');

    appearance.set('plain');
    expect(orientation()).toBe('horizontal');
  });
});
