import { describe, expect, it } from 'vitest';
import {
  DEFAULT_NGX_SIGNAL_FORM_CONTROL_PRESETS,
  NGX_SIGNAL_FORM_CONTROL_KIND_VALUES,
} from '@ngx-signal-forms/toolkit/core';
import type { NgxSignalFormControlKind } from '@ngx-signal-forms/toolkit';
import { readFormFieldWrapperDomSnapshot } from './form-field-dom-snapshot';
import { capabilitiesFor } from './form-field.utils';

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
    forcesVertical: boolean;
    clusterRole: 'radiogroup' | 'group' | null;
  }
> = {
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
    it('capabilitiesFor returns the expected capability flags', () => {
      expect(capabilitiesFor(kind)).toEqual(EXPECTED_CAPABILITIES[kind]);
    });
  });
});

describe('readFormFieldWrapperDomSnapshot — native-vs-fallback precedence', () => {
  /**
   * Builds the projected-control region the snapshot's selection-control and
   * label scans expect, then appends `controls` into the `__main` slot. Returns
   * the host so callers can position a competing `findBoundControl` match.
   */
  function hostWithProjectedControls(
    ...controls: readonly HTMLElement[]
  ): HTMLElement {
    const host = document.createElement('div');
    const content = document.createElement('div');
    content.className = 'ngx-signal-form-field-wrapper__content';
    const main = document.createElement('div');
    main.className = 'ngx-signal-form-field-wrapper__main';
    main.append(...controls);
    content.append(main);
    host.append(content);
    return host;
  }

  it('prefers the native binding element (with an id) over a competing findBoundControl match', () => {
    // Two id-bearing controls in the host: `findBoundControl` would match the
    // first `<input id>` via the CSS selector, but a non-null `nativeControl`
    // must win — the native binding registry is the source of truth.
    const probeMatch = document.createElement('input');
    probeMatch.id = 'probe-match';
    const native = document.createElement('input');
    native.id = 'native-control';
    const host = hostWithProjectedControls(probeMatch, native);

    const snapshot = readFormFieldWrapperDomSnapshot(
      host,
      null,
      DEFAULT_NGX_SIGNAL_FORM_CONTROL_PRESETS,
      native,
    );

    expect(snapshot.inputEl).toBe(native);
    expect(snapshot.inputId).toBe('native-control');
  });

  it('falls back to findBoundControl when nativeControl is null', () => {
    // No native binding (id-less host filtered upstream, mock state, or
    // pre-init window): the snapshot must run the DOM probe and find the
    // inner `<input id>`.
    const probeMatch = document.createElement('input');
    probeMatch.id = 'probe-match';
    const host = hostWithProjectedControls(probeMatch);

    const snapshot = readFormFieldWrapperDomSnapshot(
      host,
      null,
      DEFAULT_NGX_SIGNAL_FORM_CONTROL_PRESETS,
      null,
    );

    expect(snapshot.inputEl).toBe(probeMatch);
    expect(snapshot.inputId).toBe('probe-match');
  });

  it('does not let an id-bearing [prefix]/label-slot element outrank the real control in __main', () => {
    // Regression guard: `findBoundControl`'s selector is one comma-separated
    // `querySelector`, which returns the first match in *document order*
    // across the whole host, not "the real control" specifically. An
    // `id`-bearing element projected before `__main` (label slot, [prefix]
    // slot) used to win the fallback probe purely by being earlier in the
    // DOM — even though it isn't a form control at all. The probe must be
    // scoped to `__main` so only the real control can match.
    const host = document.createElement('div');

    const label = document.createElement('div');
    label.className = 'ngx-signal-form-field-wrapper__label';
    // A native <button type="button"> with an id satisfies
    // BOUND_CONTROL_SELECTOR and sits before `__main` in document order.
    const decoyToggle = document.createElement('button');
    decoyToggle.type = 'button';
    decoyToggle.id = 'decoy-toggle';
    label.append(decoyToggle);

    const content = document.createElement('div');
    content.className = 'ngx-signal-form-field-wrapper__content';
    const prefix = document.createElement('div');
    prefix.className = 'ngx-signal-form-field-wrapper__prefix';
    const decoyPrefixInput = document.createElement('input');
    decoyPrefixInput.id = 'decoy-prefix';
    prefix.append(decoyPrefixInput);

    const main = document.createElement('div');
    main.className = 'ngx-signal-form-field-wrapper__main';
    const realControl = document.createElement('input');
    realControl.id = 'real-control';
    main.append(realControl);

    content.append(prefix, main);
    host.append(label, content);

    const snapshot = readFormFieldWrapperDomSnapshot(
      host,
      null,
      DEFAULT_NGX_SIGNAL_FORM_CONTROL_PRESETS,
      null,
    );

    expect(snapshot.inputEl).toBe(realControl);
    expect(snapshot.inputId).toBe('real-control');
  });

  it('uses semantics from a nested custom-control host for its internal input', () => {
    const internalInput = document.createElement('input');
    internalInput.id = 'framework';

    const customHost = document.createElement('div');
    customHost.setAttribute('data-ngx-signal-form-control', '');
    customHost.setAttribute('data-ngx-signal-form-control-kind', 'composite');
    customHost.setAttribute('data-ngx-signal-form-control-layout', 'custom');
    customHost.setAttribute('data-ngx-signal-form-control-aria-mode', 'manual');
    customHost.append(internalInput);

    const host = hostWithProjectedControls(customHost);
    const snapshot = readFormFieldWrapperDomSnapshot(
      host,
      null,
      DEFAULT_NGX_SIGNAL_FORM_CONTROL_PRESETS,
      null,
    );

    expect(snapshot.inputEl).toBe(internalInput);
    expect(snapshot.semantics).toEqual({
      kind: 'composite',
      layout: 'custom',
      ariaMode: 'manual',
    });
  });

  it('uses nested host input-like semantics when the inner trigger is a combobox', () => {
    const trigger = document.createElement('div');
    trigger.id = 'framework';
    trigger.setAttribute('role', 'combobox');

    const customHost = document.createElement('div');
    customHost.setAttribute('data-ngx-signal-form-control', '');
    customHost.setAttribute('data-ngx-signal-form-control-kind', 'input-like');
    customHost.append(trigger);

    const host = hostWithProjectedControls(customHost);
    const snapshot = readFormFieldWrapperDomSnapshot(
      host,
      null,
      DEFAULT_NGX_SIGNAL_FORM_CONTROL_PRESETS,
      null,
    );

    expect(snapshot.inputEl).toBe(trigger);
    expect(snapshot.semantics).toEqual({
      kind: 'input-like',
      layout: 'stacked',
      ariaMode: 'auto',
    });
  });
});

describe('null (unresolved) control kind fallback', () => {
  it('falls back to textual chrome with outline support and no grouping', () => {
    expect(capabilitiesFor(null)).toEqual({
      textual: true,
      supportsOutline: true,
      selectionGroup: false,
      paddedContent: false,
      forcesVertical: false,
      clusterRole: null,
    });
  });
});
