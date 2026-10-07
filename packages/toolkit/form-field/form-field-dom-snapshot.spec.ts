import { ElementRef } from '@angular/core';
import {
  DEFAULT_NGX_SIGNAL_FORM_CONTROL_PRESETS,
  type NgxSignalFormControlPresetRegistry,
} from '@ngx-signal-forms/toolkit';
import { afterEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import {
  captureFormFieldWrapperDomSnapshot,
  readFormFieldWrapperDomSnapshot,
  requireHostElement,
} from './form-field-dom-snapshot';

const PRESETS: NgxSignalFormControlPresetRegistry =
  DEFAULT_NGX_SIGNAL_FORM_CONTROL_PRESETS;

/**
 * Builds the wrapper's structural DOM: `host > .layout > .content > .main`,
 * with `input`(s) projected inside `.main` (or, when `inLabel` is set, the
 * first one inside a `<label>` in the `.label` slot instead — the
 * implicit-label pattern). Multiple `inputs` land in `.main` in the given
 * order — used by the cache tests below to give a fresh `querySelector`
 * probe a real, different-identity candidate to find instead of the cached
 * element, so a removed cache guard changes the observed result.
 *
 * Does NOT attach `host` to `document` — callers that exercise the
 * `isConnected` half of a cache guard must do that themselves (see
 * `attachToBody` below); `Node.isConnected` is false for a node whose
 * topmost ancestor is not the `Document`, even if it has a parent.
 */
function buildWrapperHost(
  inputs: readonly HTMLElement[],
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

  const [first, ...rest] = inputs;
  if (first) {
    if (options.inLabel) {
      const label = document.createElement('label');
      label.append(first);
      labelSlot.append(label);
    } else {
      main.append(first);
    }
  }
  main.append(...rest);

  return host;
}

function textInput(id = 'email'): HTMLInputElement {
  const el = document.createElement('input');
  el.id = id;
  return el;
}

/**
 * Attaches `element` to `document.body` so its `isConnected` reads true, the
 * way a real render leaves elements. Cleaned up in `afterEach` below.
 */
function attachToBody(element: HTMLElement): HTMLElement {
  document.body.append(element);
  return element;
}

afterEach(() => {
  document.body.replaceChildren();
});

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
      const host = buildWrapperHost([probedInput]);

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
      const host = buildWrapperHost([input]);

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
      const host = buildWrapperHost([input], { inLabel: true });

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
      const host = buildWrapperHost([input]);

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
      // A decoy sits BEFORE the cached control in document order, so a fresh
      // `findBoundControl` probe (first-match-wins) would return the decoy,
      // not `cached` — making a cache hit observable by identity, not just
      // by accident of there being only one candidate.
      const decoy = textInput('decoy');
      const cached = textInput('cached');
      const host = attachToBody(buildWrapperHost([decoy, cached]));

      const snapshot = readFormFieldWrapperDomSnapshot(
        host,
        cached,
        PRESETS,
        null,
      );

      expect(snapshot.inputEl).toBe(cached);
    });

    it('does not reuse a cached control that has been disconnected from the document', () => {
      // `stale` is a genuine orphan — never attached anywhere — simulating
      // the element the wrapper cached on a previous render having since
      // been removed from the DOM entirely.
      const stale = textInput('stale');
      const freshProbeResult = textInput('fresh');
      const host = attachToBody(buildWrapperHost([freshProbeResult]));

      const snapshot = readFormFieldWrapperDomSnapshot(
        host,
        stale,
        PRESETS,
        null,
      );

      expect(snapshot.inputEl).toBe(freshProbeResult);
    });

    it('does not reuse a cached control that moved outside the current host', () => {
      // `movedElsewhere` IS connected to the document (isolating the
      // `hostEl.contains()` clause from the `isConnected` clause above) —
      // just not inside `host`.
      const movedElsewhere = textInput('moved');
      const otherHost = attachToBody(document.createElement('div'));
      otherHost.append(movedElsewhere);

      const freshProbeResult = textInput('fresh');
      const host = attachToBody(buildWrapperHost([freshProbeResult]));

      const snapshot = readFormFieldWrapperDomSnapshot(
        host,
        movedElsewhere,
        PRESETS,
        null,
      );

      expect(snapshot.inputEl).toBe(freshProbeResult);
    });

    it('does not reuse a cached control whose id attribute was removed', () => {
      // `idless` is connected AND inside `host` (isolating the
      // `hasAttribute('id')` clause from the other two) — it just lost its
      // id, the way `NgxFormFieldWrapper` never caches an id-less control in
      // practice but a stale reference could still carry one here.
      const idless = document.createElement('input');
      const freshProbeResult = textInput('fresh');
      const host = attachToBody(buildWrapperHost([idless, freshProbeResult]));

      const snapshot = readFormFieldWrapperDomSnapshot(
        host,
        idless,
        PRESETS,
        null,
      );

      // The stale, now id-less cache entry must not win over the real probe.
      expect(snapshot.inputEl).not.toBe(idless);
      expect(snapshot.inputEl).toBe(freshProbeResult);
    });

    it('a native binding always wins over a cache hit', () => {
      const cached = textInput('cached');
      const native = textInput('native');
      const host = attachToBody(buildWrapperHost([cached]));

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
    /**
     * `mainSlot`/`label` only have one real candidate each in the built DOM
     * (unlike the bound-control cache above, there's no natural "decoy" to
     * distinguish a hit from a miss by return-value identity alone, since a
     * fresh query and a cache hit return the very same node). Spying on
     * `host.querySelector` and filtering by the module's own selector text
     * makes the hit/miss distinction observable instead: a genuine cache hit
     * must skip the query entirely.
     */
    function queriesFor(
      spy: MockInstance<HTMLElement['querySelector']>,
      selectorFragment: string,
    ): number {
      return spy.mock.calls.filter(([selector]) =>
        selector.includes(selectorFragment),
      ).length;
    }

    it('reuses a cached __main slot instead of re-querying, while it is still connected and inside the host', () => {
      const host = attachToBody(buildWrapperHost([textInput()]));
      const mainSlot = host.querySelector<HTMLElement>(
        '.ngx-signal-form-field-wrapper__main',
      );
      expect(mainSlot).not.toBeNull();
      const querySelectorSpy = vi.spyOn(host, 'querySelector');

      const snapshot = readFormFieldWrapperDomSnapshot(
        host,
        null,
        PRESETS,
        null,
        mainSlot,
      );

      expect(snapshot.mainSlot).toBe(mainSlot);
      expect(queriesFor(querySelectorSpy, '__main')).toBe(0);
    });

    it('re-queries for the __main slot when the cached one has been disconnected', () => {
      const detachedSlot = document.createElement('div');
      const host = attachToBody(buildWrapperHost([textInput()]));
      const realMainSlot = host.querySelector<HTMLElement>(
        '.ngx-signal-form-field-wrapper__main',
      );
      const querySelectorSpy = vi.spyOn(host, 'querySelector');

      const snapshot = readFormFieldWrapperDomSnapshot(
        host,
        null,
        PRESETS,
        null,
        detachedSlot,
      );

      expect(snapshot.mainSlot).toBe(realMainSlot);
      expect(snapshot.mainSlot).not.toBe(detachedSlot);
      expect(queriesFor(querySelectorSpy, '__main')).toBe(1);
    });

    it('reuses a cached label instead of re-querying', () => {
      const host = attachToBody(buildWrapperHost([textInput()]));
      const labelSlot = host.querySelector(
        '.ngx-signal-form-field-wrapper__label',
      )!;
      const label = document.createElement('label');
      labelSlot.append(label);
      const querySelectorSpy = vi.spyOn(host, 'querySelector');

      const snapshot = readFormFieldWrapperDomSnapshot(
        host,
        null,
        PRESETS,
        null,
        null,
        label,
      );

      expect(snapshot.label).toBe(label);
      expect(queriesFor(querySelectorSpy, '__label')).toBe(0);
    });

    it('re-queries for the label when the cached one has been disconnected', () => {
      const detachedLabel = document.createElement('label');
      const host = attachToBody(buildWrapperHost([textInput()]));
      const labelSlot = host.querySelector(
        '.ngx-signal-form-field-wrapper__label',
      )!;
      const querySelectorSpy = vi.spyOn(host, 'querySelector');
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
      expect(queriesFor(querySelectorSpy, '__label')).toBe(1);
    });
  });

  describe('selectionControlCount', () => {
    it('counts radio and checkbox inputs scoped to the __main slot', () => {
      const host = buildWrapperHost([]);
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
      const host = buildWrapperHost([]);
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
    const host = buildWrapperHost([input]);

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
