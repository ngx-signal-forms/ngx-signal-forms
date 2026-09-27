import { ElementRef } from '@angular/core';
import {
  DEFAULT_NGX_SIGNAL_FORM_CONTROL_PRESETS,
  type NgxSignalFormControlPresetRegistry,
} from '@ngx-signal-forms/toolkit';
import { describe, expect, it } from 'vitest';
import {
  captureFormFieldWrapperDomSnapshot,
  readFormFieldWrapperDomSnapshot,
  requireHostElement,
} from './form-field-dom-snapshot';

const PRESETS: NgxSignalFormControlPresetRegistry =
  DEFAULT_NGX_SIGNAL_FORM_CONTROL_PRESETS;

/**
 * Builds the wrapper's structural DOM: `host > .layout > .content > .main`,
 * with `input` projected inside `.main` (or, when `inLabel` is set, inside a
 * `<label>` in the `.label` slot instead — the implicit-label pattern).
 */
function buildWrapperHost(
  input: HTMLElement | null,
  options: { inLabel?: boolean } = {},
): HTMLElement {
  const host = document.createElement('div');
  const layout = document.createElement('div');
  layout.className = 'ngx-signal-form-field-wrapper__layout';
  host.append(layout);

  const labelSlot = document.createElement('div');
  labelSlot.className = 'ngx-signal-form-field-wrapper__label';
  layout.append(labelSlot);

  const content = document.createElement('div');
  content.className = 'ngx-signal-form-field-wrapper__content';
  layout.append(content);

  const main = document.createElement('div');
  main.className = 'ngx-signal-form-field-wrapper__main';
  content.append(main);

  if (input) {
    if (options.inLabel) {
      const label = document.createElement('label');
      label.append(input);
      labelSlot.append(label);
    } else {
      main.append(input);
    }
  }

  return host;
}

function textInput(id = 'email'): HTMLInputElement {
  const el = document.createElement('input');
  el.id = id;
  return el;
}

describe('requireHostElement', () => {
  it('returns the native element from an ElementRef', () => {
    const div = document.createElement('div');
    expect(requireHostElement(new ElementRef(div))).toBe(div);
  });

  it('throws when the host is not an HTMLElement (e.g. a server-side stand-in)', () => {
    expect(() => requireHostElement(new ElementRef({}))).toThrow(TypeError);
  });
});

describe('readFormFieldWrapperDomSnapshot', () => {
  describe('finding the projected control', () => {
    it('prefers the native binding element over any DOM probe', () => {
      const probedInput = textInput('probed');
      const nativeInput = textInput('native');
      const host = buildWrapperHost(probedInput);

      const snapshot = readFormFieldWrapperDomSnapshot(
        host,
        null,
        PRESETS,
        nativeInput,
      );

      expect(snapshot.inputEl).toBe(nativeInput);
    });

    it('falls back to a DOM probe of the __main slot when there is no native binding', () => {
      const input = textInput();
      const host = buildWrapperHost(input);

      const snapshot = readFormFieldWrapperDomSnapshot(
        host,
        null,
        PRESETS,
        null,
      );

      expect(snapshot.inputEl).toBe(input);
      expect(snapshot.inputId).toBe('email');
    });

    it('falls back to probing the whole host when __main has no match (implicit-label pattern)', () => {
      const input = textInput('full-name');
      const host = buildWrapperHost(input, { inLabel: true });

      const snapshot = readFormFieldWrapperDomSnapshot(
        host,
        null,
        PRESETS,
        null,
      );

      expect(snapshot.inputEl).toBe(input);
    });

    it('returns a null inputId for a control with no id attribute', () => {
      const input = document.createElement('input');
      const host = buildWrapperHost(input);

      const snapshot = readFormFieldWrapperDomSnapshot(
        host,
        null,
        PRESETS,
        null,
      );

      expect(snapshot.inputId).toBeNull();
    });
  });

  describe('bound-control cache (issue #504 perf fix)', () => {
    it('reuses the cached control when it is still connected, inside the host, and still has an id', () => {
      const cached = textInput('cached');
      // Not appended anywhere new — the cache is what makes it reachable
      // without a fresh querySelector. Attach it to the real host so
      // `isConnected` is true, matching what a real render leaves behind.
      const host = buildWrapperHost(cached);

      const snapshot = readFormFieldWrapperDomSnapshot(
        host,
        cached,
        PRESETS,
        null,
      );

      expect(snapshot.inputEl).toBe(cached);
    });

    it('does not reuse a cached control that has been disconnected from the document', () => {
      const stale = textInput('stale');
      const replacement = textInput('replacement');
      // `stale` is never attached anywhere — simulates the element the
      // wrapper cached on a previous render having since been removed.
      const host = buildWrapperHost(replacement);

      const snapshot = readFormFieldWrapperDomSnapshot(
        host,
        stale,
        PRESETS,
        null,
      );

      expect(snapshot.inputEl).toBe(replacement);
    });

    it('does not reuse a cached control that moved outside the current host', () => {
      const movedElsewhere = textInput('moved');
      const otherHost = document.createElement('div');
      otherHost.append(movedElsewhere);

      const replacement = textInput('replacement');
      const host = buildWrapperHost(replacement);

      const snapshot = readFormFieldWrapperDomSnapshot(
        host,
        movedElsewhere,
        PRESETS,
        null,
      );

      expect(snapshot.inputEl).toBe(replacement);
    });

    it('does not reuse a cached control whose id attribute was removed', () => {
      const idless = document.createElement('input');
      const replacement = textInput('replacement');
      const host = buildWrapperHost(replacement);
      host.append(idless); // still connected, still inside the host

      const snapshot = readFormFieldWrapperDomSnapshot(
        host,
        idless,
        PRESETS,
        null,
      );

      // The stale, now id-less cache entry must not win over the real probe.
      expect(snapshot.inputEl).not.toBe(idless);
      expect(snapshot.inputEl).toBe(replacement);
    });

    it('a native binding always wins over a cache hit', () => {
      const cached = textInput('cached');
      const native = textInput('native');
      const host = buildWrapperHost(cached);

      const snapshot = readFormFieldWrapperDomSnapshot(
        host,
        cached,
        PRESETS,
        native,
      );

      expect(snapshot.inputEl).toBe(native);
    });
  });

  describe('__main slot and label caches', () => {
    it('reuses a cached __main slot instead of re-querying, while it is still connected and inside the host', () => {
      const host = buildWrapperHost(textInput());
      const mainSlot = host.querySelector<HTMLElement>(
        '.ngx-signal-form-field-wrapper__main',
      );
      expect(mainSlot).not.toBeNull();

      const snapshot = readFormFieldWrapperDomSnapshot(
        host,
        null,
        PRESETS,
        null,
        mainSlot,
      );

      expect(snapshot.mainSlot).toBe(mainSlot);
    });

    it('re-queries for the __main slot when the cached one has been disconnected', () => {
      const detachedSlot = document.createElement('div');
      const host = buildWrapperHost(textInput());
      const realMainSlot = host.querySelector<HTMLElement>(
        '.ngx-signal-form-field-wrapper__main',
      );

      const snapshot = readFormFieldWrapperDomSnapshot(
        host,
        null,
        PRESETS,
        null,
        detachedSlot,
      );

      expect(snapshot.mainSlot).toBe(realMainSlot);
      expect(snapshot.mainSlot).not.toBe(detachedSlot);
    });

    it('reuses a cached label instead of re-querying', () => {
      const host = buildWrapperHost(textInput());
      const labelSlot = host.querySelector(
        '.ngx-signal-form-field-wrapper__label',
      )!;
      const label = document.createElement('label');
      labelSlot.append(label);

      const snapshot = readFormFieldWrapperDomSnapshot(
        host,
        null,
        PRESETS,
        null,
        null,
        label,
      );

      expect(snapshot.label).toBe(label);
    });

    it('re-queries for the label when the cached one has been disconnected', () => {
      const detachedLabel = document.createElement('label');
      const host = buildWrapperHost(textInput());
      const labelSlot = host.querySelector(
        '.ngx-signal-form-field-wrapper__label',
      )!;
      const realLabel = document.createElement('label');
      labelSlot.append(realLabel);

      const snapshot = readFormFieldWrapperDomSnapshot(
        host,
        null,
        PRESETS,
        null,
        null,
        detachedLabel,
      );

      expect(snapshot.label).toBe(realLabel);
    });
  });

  describe('selectionControlCount', () => {
    it('counts radio and checkbox inputs scoped to the __main slot', () => {
      const host = buildWrapperHost(null);
      const main = host.querySelector('.ngx-signal-form-field-wrapper__main')!;
      main.innerHTML =
        '<input type="radio" /><input type="radio" /><input type="checkbox" /><input type="text" />';

      const snapshot = readFormFieldWrapperDomSnapshot(
        host,
        null,
        PRESETS,
        null,
      );

      expect(snapshot.selectionControlCount).toBe(3);
    });

    it('excludes a checkbox-shaped switch (role="switch") from the count', () => {
      const host = buildWrapperHost(null);
      const main = host.querySelector('.ngx-signal-form-field-wrapper__main')!;
      main.innerHTML =
        '<input type="checkbox" role="switch" /><input type="checkbox" />';

      const snapshot = readFormFieldWrapperDomSnapshot(
        host,
        null,
        PRESETS,
        null,
      );

      expect(snapshot.selectionControlCount).toBe(1);
    });

    it('is 0 when there is no __main slot at all', () => {
      const host = document.createElement('div');

      const snapshot = readFormFieldWrapperDomSnapshot(
        host,
        null,
        PRESETS,
        null,
      );

      expect(snapshot.selectionControlCount).toBe(0);
    });
  });

  describe('semantics resolution across a data-ngx-signal-form-control ancestor', () => {
    it('resolves semantics from the nearest ancestor carrying the custom-control marker', () => {
      const host = document.createElement('div');
      const customControlRoot = document.createElement('div');
      customControlRoot.setAttribute('data-ngx-signal-form-control', '');
      customControlRoot.setAttribute(
        'data-ngx-signal-form-control-kind',
        'switch',
      );
      const inner = document.createElement('span');
      customControlRoot.append(inner);
      host.append(customControlRoot);

      const snapshot = readFormFieldWrapperDomSnapshot(
        host,
        null,
        PRESETS,
        inner,
      );

      expect(snapshot.semantics.kind).toBe('switch');
    });

    it('resolves semantics from the input itself when no ancestor carries the marker', () => {
      const host = document.createElement('div');
      const input = textInput();
      host.append(input);

      const snapshot = readFormFieldWrapperDomSnapshot(
        host,
        null,
        PRESETS,
        input,
      );

      expect(snapshot.semantics.kind).toBe('input-like');
    });
  });
});

describe('captureFormFieldWrapperDomSnapshot', () => {
  it('resolves the host element and folds in the native binding lookup', () => {
    const input = textInput('email');
    const host = buildWrapperHost(input);

    const snapshot = captureFormFieldWrapperDomSnapshot(
      new ElementRef(host),
      null,
      PRESETS,
      undefined,
    );

    expect(snapshot.inputEl).toBe(input);
  });

  it("throws requireHostElement's error when the ElementRef is not an HTMLElement", () => {
    expect(() =>
      captureFormFieldWrapperDomSnapshot(
        new ElementRef({}),
        null,
        PRESETS,
        undefined,
      ),
    ).toThrow(TypeError);
  });
});
