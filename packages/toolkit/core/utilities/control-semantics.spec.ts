import { describe, expect, it } from 'vitest';
import { DEFAULT_NGX_SIGNAL_FORM_CONTROL_PRESETS } from '../tokens';
import type { NgxSignalFormControlPresetRegistry } from '../types';
import {
  inferNgxSignalFormControlKind,
  isNgxSignalFormControlAriaMode,
  isNgxSignalFormControlKind,
  isNgxSignalFormControlLayout,
  readNgxSignalFormControlSemantics,
  resolveNgxSignalFormControlSemantics,
} from './control-semantics';

describe('isNgxSignalFormControlKind', () => {
  it.each([
    'input-like',
    'standalone-field-like',
    'switch',
    'checkbox',
    'radio-group',
    'slider',
    'composite',
  ])('should accept "%s"', (kind) => {
    expect(isNgxSignalFormControlKind(kind)).toBe(true);
  });

  it('should reject unknown strings', () => {
    expect(isNgxSignalFormControlKind('button')).toBe(false);
    expect(isNgxSignalFormControlKind('')).toBe(false);
  });

  it('should reject null and undefined', () => {
    expect(isNgxSignalFormControlKind(null)).toBe(false);
    expect(isNgxSignalFormControlKind(undefined)).toBe(false);
  });
});

describe('isNgxSignalFormControlLayout', () => {
  it.each(['stacked', 'inline-control', 'group', 'custom'])(
    'should accept "%s"',
    (layout) => {
      expect(isNgxSignalFormControlLayout(layout)).toBe(true);
    },
  );

  it('should reject unknown strings', () => {
    expect(isNgxSignalFormControlLayout('flex')).toBe(false);
    expect(isNgxSignalFormControlLayout('')).toBe(false);
  });

  it('should reject null and undefined', () => {
    expect(isNgxSignalFormControlLayout(null)).toBe(false);
    expect(isNgxSignalFormControlLayout(undefined)).toBe(false);
  });
});

describe('isNgxSignalFormControlAriaMode', () => {
  it.each(['auto', 'manual'])('should accept "%s"', (mode) => {
    expect(isNgxSignalFormControlAriaMode(mode)).toBe(true);
  });

  it('should reject unknown strings', () => {
    expect(isNgxSignalFormControlAriaMode('none')).toBe(false);
    expect(isNgxSignalFormControlAriaMode('')).toBe(false);
  });

  it('should reject null and undefined', () => {
    expect(isNgxSignalFormControlAriaMode(null)).toBe(false);
    expect(isNgxSignalFormControlAriaMode(undefined)).toBe(false);
  });
});

describe('readNgxSignalFormControlSemantics', () => {
  it('should return empty object for null element', () => {
    expect(readNgxSignalFormControlSemantics(null)).toEqual({});
  });

  it('should return empty object when no data attributes exist', () => {
    const el = document.createElement('input');
    expect(readNgxSignalFormControlSemantics(el)).toEqual({});
  });

  it('should read kind from data attribute', () => {
    const el = document.createElement('input');
    el.setAttribute('data-ngx-signal-form-control-kind', 'switch');
    const result = readNgxSignalFormControlSemantics(el);
    expect(result.kind).toBe('switch');
  });

  it('should read layout from data attribute', () => {
    const el = document.createElement('input');
    el.setAttribute('data-ngx-signal-form-control-layout', 'inline-control');
    const result = readNgxSignalFormControlSemantics(el);
    expect(result.layout).toBe('inline-control');
  });

  it('should read ariaMode from data attribute', () => {
    const el = document.createElement('input');
    el.setAttribute('data-ngx-signal-form-control-aria-mode', 'manual');
    const result = readNgxSignalFormControlSemantics(el);
    expect(result.ariaMode).toBe('manual');
  });

  it('should read all three attributes together', () => {
    const el = document.createElement('input');
    el.setAttribute('data-ngx-signal-form-control-kind', 'slider');
    el.setAttribute('data-ngx-signal-form-control-layout', 'custom');
    el.setAttribute('data-ngx-signal-form-control-aria-mode', 'manual');
    const result = readNgxSignalFormControlSemantics(el);
    expect(result).toEqual({
      kind: 'slider',
      layout: 'custom',
      ariaMode: 'manual',
    });
  });

  it('should ignore invalid attribute values', () => {
    const el = document.createElement('input');
    el.setAttribute('data-ngx-signal-form-control-kind', 'invalid');
    el.setAttribute('data-ngx-signal-form-control-layout', 'bad');
    el.setAttribute('data-ngx-signal-form-control-aria-mode', 'wrong');
    expect(readNgxSignalFormControlSemantics(el)).toEqual({});
  });
});

describe('inferNgxSignalFormControlKind', () => {
  it('should return null for null element', () => {
    expect(inferNgxSignalFormControlKind(null)).toBeNull();
  });

  it('should infer input-like for text input', () => {
    const el = document.createElement('input');
    el.type = 'text';
    expect(inferNgxSignalFormControlKind(el)).toBe('input-like');
  });

  it.each([
    'color',
    'date',
    'datetime-local',
    'email',
    'month',
    'number',
    'password',
    'search',
    'tel',
    'text',
    'time',
    'url',
    'week',
  ])('should infer input-like for input type "%s"', (type) => {
    const el = document.createElement('input');
    el.type = type;
    expect(inferNgxSignalFormControlKind(el)).toBe('input-like');
  });

  it('should infer input-like for input with no type', () => {
    const el = document.createElement('input');
    expect(inferNgxSignalFormControlKind(el)).toBe('input-like');
  });

  it('should infer standalone-field-like for textarea', () => {
    const el = document.createElement('textarea');
    expect(inferNgxSignalFormControlKind(el)).toBe('standalone-field-like');
  });

  it('should infer standalone-field-like for select', () => {
    const el = document.createElement('select');
    expect(inferNgxSignalFormControlKind(el)).toBe('standalone-field-like');
  });

  it('should infer checkbox for checkbox input', () => {
    const el = document.createElement('input');
    el.type = 'checkbox';
    expect(inferNgxSignalFormControlKind(el)).toBe('checkbox');
  });

  it('should infer switch for checkbox with role=switch', () => {
    const el = document.createElement('input');
    el.type = 'checkbox';
    el.setAttribute('role', 'switch');
    expect(inferNgxSignalFormControlKind(el)).toBe('switch');
  });

  it('should infer radio-group for radio input', () => {
    const el = document.createElement('input');
    el.type = 'radio';
    expect(inferNgxSignalFormControlKind(el)).toBe('radio-group');
  });

  it('should infer slider for range input', () => {
    const el = document.createElement('input');
    el.type = 'range';
    expect(inferNgxSignalFormControlKind(el)).toBe('slider');
  });

  it('should infer switch from role=switch on non-input', () => {
    const el = document.createElement('div');
    el.setAttribute('role', 'switch');
    expect(inferNgxSignalFormControlKind(el)).toBe('switch');
  });

  it('should infer slider from role=slider on non-input', () => {
    const el = document.createElement('div');
    el.setAttribute('role', 'slider');
    expect(inferNgxSignalFormControlKind(el)).toBe('slider');
  });

  it('should infer radio-group from role=radiogroup on non-input', () => {
    const el = document.createElement('div');
    el.setAttribute('role', 'radiogroup');
    expect(inferNgxSignalFormControlKind(el)).toBe('radio-group');
  });

  it('should infer composite for button element', () => {
    const el = document.createElement('button');
    expect(inferNgxSignalFormControlKind(el)).toBe('composite');
  });

  it('should infer composite for element with data-ngx-signal-form-control', () => {
    const el = document.createElement('div');
    el.setAttribute('data-ngx-signal-form-control', '');
    expect(inferNgxSignalFormControlKind(el)).toBe('composite');
  });

  it('should return null for unrecognized element', () => {
    const el = document.createElement('div');
    expect(inferNgxSignalFormControlKind(el)).toBeNull();
  });
});

describe('resolveNgxSignalFormControlSemantics', () => {
  const presets: NgxSignalFormControlPresetRegistry =
    DEFAULT_NGX_SIGNAL_FORM_CONTROL_PRESETS;

  it('should return all nulls for null element', () => {
    expect(resolveNgxSignalFormControlSemantics(null, presets)).toEqual({
      kind: null,
      layout: null,
      ariaMode: null,
    });
  });

  it('should resolve kind from heuristic and layout/ariaMode from preset', () => {
    const el = document.createElement('input');
    el.type = 'text';
    const result = resolveNgxSignalFormControlSemantics(el, presets);
    expect(result.kind).toBe('input-like');
    expect(result.layout).toBe('stacked');
    expect(result.ariaMode).toBe('auto');
  });

  it('should prefer explicit data-attribute kind over heuristic', () => {
    const el = document.createElement('input');
    el.type = 'checkbox';
    el.setAttribute('data-ngx-signal-form-control-kind', 'switch');
    const result = resolveNgxSignalFormControlSemantics(el, presets);
    expect(result.kind).toBe('switch');
    expect(result.layout).toBe('inline-control');
  });

  it('should prefer explicit data-attribute layout over preset', () => {
    const el = document.createElement('input');
    el.type = 'text';
    el.setAttribute('data-ngx-signal-form-control-layout', 'custom');
    const result = resolveNgxSignalFormControlSemantics(el, presets);
    expect(result.kind).toBe('input-like');
    expect(result.layout).toBe('custom');
  });

  it('should prefer explicit data-attribute ariaMode over preset', () => {
    const el = document.createElement('input');
    el.type = 'text';
    el.setAttribute('data-ngx-signal-form-control-aria-mode', 'manual');
    const result = resolveNgxSignalFormControlSemantics(el, presets);
    expect(result.kind).toBe('input-like');
    expect(result.ariaMode).toBe('manual');
  });

  it('should apply switch preset for checkbox with role=switch', () => {
    const el = document.createElement('input');
    el.type = 'checkbox';
    el.setAttribute('role', 'switch');
    const result = resolveNgxSignalFormControlSemantics(el, presets);
    expect(result.kind).toBe('switch');
    expect(result.layout).toBe('inline-control');
    expect(result.ariaMode).toBe('auto');
  });

  it('should apply composite preset for button element', () => {
    const el = document.createElement('button');
    const result = resolveNgxSignalFormControlSemantics(el, presets);
    expect(result.kind).toBe('composite');
    expect(result.layout).toBe('custom');
  });

  it('should return null layout/ariaMode for unrecognized element with no preset', () => {
    const el = document.createElement('div');
    const result = resolveNgxSignalFormControlSemantics(el, presets);
    expect(result.kind).toBeNull();
    expect(result.layout).toBeNull();
    expect(result.ariaMode).toBeNull();
  });

  it('should handle all three layers together: explicit > heuristic > preset', () => {
    const el = document.createElement('input');
    el.type = 'text';
    el.setAttribute('data-ngx-signal-form-control-kind', 'slider');
    el.setAttribute('data-ngx-signal-form-control-layout', 'custom');
    el.setAttribute('data-ngx-signal-form-control-aria-mode', 'manual');
    const result = resolveNgxSignalFormControlSemantics(el, presets);
    expect(result).toEqual({
      kind: 'slider',
      layout: 'custom',
      ariaMode: 'manual',
    });
  });
});
